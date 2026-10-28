import { brand } from "@/config/brand";

/**
 * Format an integer minor-unit amount (paisa) as a PKR display string.
 * All money in the app is integer paisa — never floats.
 */
export function formatPkr(minor: number): string {
  if (!Number.isFinite(minor)) return `${brand.currency.symbol} 0`;

  const rupees = Math.trunc(minor / 100);
  return `${brand.currency.symbol} ${rupees.toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  })}`;
}
