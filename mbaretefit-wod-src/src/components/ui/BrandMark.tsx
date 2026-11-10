/** Marca de MBARETEFIT WOD: una barra cargada vista de frente. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden focusable="false">
      <g fill="var(--color-accent)">
        <rect x="2" y="29" width="60" height="6" rx="3" />
        <rect x="9" y="10" width="10" height="44" rx="4" />
        <rect x="22" y="19" width="6" height="26" rx="3" />
        <rect x="45" y="10" width="10" height="44" rx="4" />
        <rect x="36" y="19" width="6" height="26" rx="3" />
      </g>
    </svg>
  );
}
