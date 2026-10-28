/**
 * NOIR ÉLIXIR — centralized brand configuration.
 *
 * Everything here is a placeholder for the store owner's real brand.
 * Replace the values in this single file (and the logo asset) to rebrand
 * the entire site. Demo values are marked DEMO and must be replaced with
 * real business information before going live.
 */

export const brand = {
  name: "NOIR ÉLIXIR",
  shortName: "Noir Élixir",
  tagline: "SCENT THAT DEFINES YOU.",
  category: "Independent luxury perfume house",
  description:
    "An independent luxury perfume house crafting distinctive fragrances in small batches. Each composition is built around rare raw materials — Cambodian oud, Taif rose, saffron — and designed to express individuality, elegance, and confidence.",
  founded: "2026",
  // DEMO — replace with real logo (an image import or CDN URL).
  logoText: "NOIR ÉLIXIR",
  // DEMO — replace with real contact details before launch.
  contact: {
    email: "care@noirelixir.example",
    phone: "+92 300 0000000",
    city: "Lahore, Pakistan",
    address: "Gulberg III, Lahore, Pakistan",
    hours: "Mon–Sat, 10:00–19:00 (PKT)",
  },
  // DEMO — no real social accounts exist yet; leave empty until provided.
  social: [] as { label: string; url: string }[],
  currency: {
    code: "PKR",
    symbol: "Rs",
    locale: "en-PK",
  },
} as const;

/**
 * Shipping configuration. The client uses this for display only — the
 * order server function re-applies the authoritative values itself.
 */
export const shipping = {
  currencyMinorUnitFactor: 100, // PKR paisa
  flatChargeMinor: 25_000, // Rs 250
  freeOverMinor: 800_000, // free above Rs 8,000
  codEnabled: true,
  onlinePaymentsEnabled: false,
  estimate: "2–4 working days nationwide (Pakistan)",
} as const;

export const bottleSizes = [30, 50, 100] as const;
