// Site-wide details used by the legal pages and footer.
// ✏️ Fill in the [bracketed] values before launch, then have the legal pages
// reviewed by a lawyer (they are a starting template, not legal advice).
export const SITE = {
  name: "Marketcap",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://marketcap-rosy.vercel.app",
  /** The legal entity that runs Marketcap */
  company: "[Your company name]",
  /** Where users send privacy and support requests */
  contactEmail: "[contact email]",
  /** Whose laws govern the Terms */
  jurisdiction: "the Federal Republic of Nigeria",
  /** Shown on each legal page; update when you change them */
  legalUpdated: "20 October 2026",
};
