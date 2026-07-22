/**
 * Atomically increments the hit counter for a rate-limit bucket and applies
 * blocking, in a single round trip. Mirrors @nestjs/throttler's built-in
 * in-memory ThrottlerStorageService semantics:
 *
 * - A bucket starts a fresh window (hits reset, new expiresAt) the first
 *   time it is touched, or once its window naturally expires.
 * - Hits only accumulate while not blocked.
 * - Once hits exceed limit, the bucket is marked blocked until
 *   blockExpiresAt; while blocked, further calls do not add more hits.
 * - Once a block expires, the bucket resets to a fresh window immediately
 *   (matching the in-memory implementation's resetBlockdRequest behavior).
 *
 * Uses redis.call('TIME') for "now" rather than a client-supplied
 * timestamp, so correctness does not depend on clock sync across multiple
 * API instances sharing this one Redis: whichever instance runs this
 * script, Redis's own clock is authoritative.
 *
 * KEYS[1] = the fully-namespaced bucket key
 * ARGV[1] = ttl in milliseconds
 * ARGV[2] = limit
 * ARGV[3] = blockDuration in milliseconds
 * returns { totalHits, timeToExpireSeconds, isBlocked (0/1), timeToBlockExpireSeconds }
 */
export const THROTTLER_INCREMENT_LUA = `
local key = KEYS[1]
local ttl = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local blockDuration = tonumber(ARGV[3])

local time = redis.call('TIME')
local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)

local data = redis.call('HMGET', key, 'hits', 'expiresAt', 'blockExpiresAt', 'isBlocked')
local hits = tonumber(data[1])
local expiresAt = tonumber(data[2])
local blockExpiresAt = tonumber(data[3])
local isBlocked = data[4] == '1'

if hits == nil then
  hits = 0
  expiresAt = now + ttl
  blockExpiresAt = 0
  isBlocked = false
end

if isBlocked and blockExpiresAt <= now then
  isBlocked = false
  hits = 0
  expiresAt = now + ttl
end

if (not isBlocked) and expiresAt <= now then
  hits = 0
  expiresAt = now + ttl
end

if not isBlocked then
  hits = hits + 1
end

if hits > limit and not isBlocked then
  isBlocked = true
  blockExpiresAt = now + blockDuration
end

redis.call('HMSET', key, 'hits', hits, 'expiresAt', expiresAt, 'blockExpiresAt', blockExpiresAt, 'isBlocked', isBlocked and '1' or '0')

local expireAtPx = expiresAt
if blockExpiresAt > expireAtPx then
  expireAtPx = blockExpiresAt
end
local ttlForExpirePx = expireAtPx - now
if ttlForExpirePx > 0 then
  redis.call('PEXPIRE', key, ttlForExpirePx)
end

local timeToExpire = math.ceil((expiresAt - now) / 1000)
local timeToBlockExpire = math.ceil((blockExpiresAt - now) / 1000)
if timeToBlockExpire < 0 then
  timeToBlockExpire = 0
end

return {hits, timeToExpire, isBlocked and 1 or 0, timeToBlockExpire}
`;
