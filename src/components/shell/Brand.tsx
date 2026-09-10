import { cn } from "@/lib/cn";

/** Nossa marca — glifo abstrato de progresso (seta ascendente + faísca).
 *  Identidade própria: sem logo, nome ou marca de terceiros. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label="Estudos do Amor"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="ea-brand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--primary-hover)" />
          <stop offset="1" stopColor="var(--primary)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="32" height="32" rx="9" fill="url(#ea-brand)" />
      <path
        d="M9 20.5 L16 10 L23 20.5"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="23.4" r="1.9" fill="#fff" />
    </svg>
  );
}

export function BrandLockup({
  collapsed = false,
  className,
}: {
  collapsed?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <BrandMark className="h-8 w-8" />
      {!collapsed && (
        <span className="text-[15px] font-bold leading-tight tracking-tight text-text">
          Estudos
          <span className="text-primary"> do Amor</span>
        </span>
      )}
    </span>
  );
}
