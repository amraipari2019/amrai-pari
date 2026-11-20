/** Convert a timestamptz to the value of <input type="datetime-local"> in Dhaka time. */
export function toDhakaInput(value: unknown) {
  if (typeof value !== "string" || !value) return "";
  const d = new Date(value);
  const shifted = new Date(d.getTime() + 6 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 16);
}

/** Interpret a datetime-local value as Dhaka time (UTC+6, no DST). */
export function fromDhakaInput(value: string) {
  return value ? `${value}:00+06:00` : null;
}
