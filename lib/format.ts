import { PRECISION } from "./deployment";

export function fmtUsd(n: bigint, d = 2): string {
  const whole = n / PRECISION;
  const frac = ((n % PRECISION) * 10n ** BigInt(d)) / PRECISION;
  return `${whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${frac
    .toString()
    .padStart(d, "0")}`;
}

export function fmt18(n: bigint, d = 4): string {
  const whole = n / PRECISION;
  const frac = ((n % PRECISION) * 10n ** BigInt(d)) / PRECISION;
  return `${whole}.${frac.toString().padStart(d, "0")}`;
}

export function fmtPct(n: bigint, d = 2): string {
  const pct = (n * 10000n) / PRECISION;
  return `${(Number(pct) / 100).toFixed(d)}%`;
}

export function fmtToken9(amount: bigint, d = 4): string {
  const whole = amount / 1_000_000_000n;
  const frac = ((amount % 1_000_000_000n) * 10n ** BigInt(d)) / 1_000_000_000n;
  return `${whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${frac
    .toString()
    .padStart(d, "0")}`;
}

export function truncAddress(addr: string, head = 4, tail = 4): string {
  if (addr.length <= head + tail + 2) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}
