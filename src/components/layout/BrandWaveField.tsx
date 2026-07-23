/**
 * Full-surface variant of BrandWaveLines: the same drifting/pulsing wave motif,
 * scaled for a large content area (e.g. the login page body) instead of a thin
 * header/footer strip. Multiple bands at different heights so it reads as a
 * living field of lines rather than one stretched strip.
 */
export function BrandWaveField({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`brand-wave-lines pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox="0 0 1600 900"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <filter id="brand-glow-field" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path
        d="M0,180 C200,80 300,280 500,180 C700,80 800,280 1000,180 C1200,80 1300,280 1600,180"
        fill="none"
        stroke="var(--color-brand-gold)"
        strokeWidth="1.5"
        opacity="0.22"
      />
      <path
        d="M0,340 C220,240 340,440 560,340 C780,240 900,440 1120,340 C1260,270 1420,410 1600,340"
        fill="none"
        stroke="var(--color-brand-cyan)"
        strokeWidth="1.25"
        opacity="0.2"
      />
      <path
        d="M0,520 C180,600 320,440 500,520 C680,600 820,440 1000,520 C1180,600 1420,440 1600,520"
        fill="none"
        stroke="var(--color-brand-gold-light)"
        strokeWidth="1"
        opacity="0.18"
      />
      <path
        d="M0,680 C240,600 360,760 600,680 C840,600 960,760 1200,680 C1340,640 1460,720 1600,680"
        fill="none"
        stroke="var(--color-brand-cyan-light)"
        strokeWidth="1"
        opacity="0.16"
      />

      <g filter="url(#brand-glow-field)">
        <circle cx="500" cy="180" r="3" fill="var(--color-brand-gold-light)" style={{ animationDelay: "0s" }} />
        <circle cx="1000" cy="180" r="2.4" fill="var(--color-brand-cyan)" style={{ animationDelay: "1s" }} />
        <circle cx="560" cy="340" r="2.8" fill="var(--color-brand-cyan-light)" style={{ animationDelay: "0.5s" }} />
        <circle cx="1120" cy="340" r="2.2" fill="var(--color-brand-gold)" style={{ animationDelay: "1.8s" }} />
        <circle cx="320" cy="440" r="2.4" fill="var(--color-brand-gold-light)" style={{ animationDelay: "2.4s" }} />
        <circle cx="900" cy="440" r="2.6" fill="var(--color-brand-cyan)" style={{ animationDelay: "0.9s" }} />
        <circle cx="600" cy="680" r="2.4" fill="var(--color-brand-cyan-light)" style={{ animationDelay: "1.4s" }} />
        <circle cx="1200" cy="680" r="2" fill="var(--color-brand-gold)" style={{ animationDelay: "3s" }} />
      </g>
    </svg>
  );
}
