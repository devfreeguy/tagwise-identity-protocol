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
 * Everything here is tracked in whole SECONDS, not milliseconds, even
 * though the ttl/blockDuration arguments arrive in milliseconds (matching
 * @nestjs/throttler's own convention). This is deliberate, not just a
 * rounding shortcut: every real ttl/blockDuration this app configures is
 * already a whole number of seconds (env vars like THROTTLE_TTL are
 * seconds, multiplied by 1000 only to match the ms-typed option), so
 * flooring to seconds loses no real precision. It also sidesteps a real bug
 * found in ioredis-mock's Lua bridge (used for this repo's tests, not
 * production Redis): millisecond epoch timestamps are large enough
 * (13 digits) to overflow a 32-bit signed integer inside that bridge,
 * silently wrapping to a negative number and making comparisons like
 * `blockExpiresAt <= now` unreliable. Whole-second epoch values stay
 * comfortably under that boundary until the year 2038, the same limit most
 * 32-bit Unix time handling has.
 *
 * KEYS[1] = the fully-namespaced bucket key
 * ARGV[1] = ttl in milliseconds
 * ARGV[2] = limit
 * ARGV[3] = blockDuration in milliseconds
 * returns { totalHits, timeToExpireSeconds, isBlocked (0/1), timeToBlockExpireSeconds }
 */
export const THROTTLER_INCREMENT_LUA = `
local key = KEYS[1]
local ttl = math.floor(tonumber(ARGV[1]) / 1000)
local limit = tonumber(ARGV[2])
local blockDuration = math.floor(tonumber(ARGV[3]) / 1000)

local time = redis.call('TIME')
local now = tonumber(time[1])

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

local expireAt = expiresAt
if blockExpiresAt > expireAt then
  expireAt = blockExpiresAt
end
local ttlForExpire = expireAt - now
if ttlForExpire > 0 then
  redis.call('EXPIRE', key, ttlForExpire)
end

local timeToExpire = expiresAt - now
local timeToBlockExpire = blockExpiresAt - now
if timeToBlockExpire < 0 then
  timeToBlockExpire = 0
end

return {hits, timeToExpire, isBlocked and 1 or 0, timeToBlockExpire}
`;
