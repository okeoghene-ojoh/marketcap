/** The Marketcap mark: an "M" whose last stroke becomes a rising arrow. Same artwork as app/icon.svg. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="logo-mark">
      <rect width="64" height="64" rx="16" fill="#1f4a12" />
      <path d="M14 46V22l14 14 19-19" fill="none" stroke="#b6ec6f" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M35 17h12v12" fill="none" stroke="#b6ec6f" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
