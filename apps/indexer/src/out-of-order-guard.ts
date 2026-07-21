/**
 * True if a change observed at incomingSlot should be applied on top of a row
 * whose stored lastAppliedSlot is storedSlot (undefined if the row does not
 * exist yet). A strictly older incoming slot is stale and must be skipped;
 * an equal or newer slot is applied, so replaying the same notification is
 * harmless.
 */
export function shouldApply(incomingSlot: bigint, storedSlot: bigint | undefined): boolean {
  if (storedSlot === undefined) {
    return true;
  }
  return incomingSlot >= storedSlot;
}
