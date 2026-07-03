/** Parse a Graph API numeric string/value into a number, or `null` if absent/invalid. */
export function toNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Like {@link toNumber} but returns `fallback` instead of `null`. */
export function numberOr(value: unknown, fallback: number): number {
  const n = toNumber(value);
  return n === null ? fallback : n;
}
