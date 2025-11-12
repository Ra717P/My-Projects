export function rupiahToInt(x: number) {
  if (!Number.isFinite(x)) throw new Error("Amount invalid");
  return Math.round(x); // rupiah integer
}

export function nowIsoUtc() {
  return new Date().toISOString();
}
