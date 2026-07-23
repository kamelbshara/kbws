/**
 * Decorative header/footer motif: the cover art's flowing gold lines blended
 * with the logo's glowing cyan circuit-node accents, as a lightweight inline
 * SVG (not the 1.6MB cover.png) with a slow drift/pulse animation so it reads
 * as "alive" rather than a static wallpaper. Respects prefers-reduced-motion
 * via the .brand-wave-lines CSS rules in globals.css.
 */
export function BrandWaveLines({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`brand-wave-lines pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox="0 0 800 80"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <filter id="brand-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path
        d="M0,40 C100,10 150,70 250,40 C350,10 400,70 500,40 C600,10 650,70 800,40"
        fill="none"
        stroke="var(--color-brand-gold)"
        strokeWidth="1"
        opacity="0.35"
      />
      <path
        d="M0,55 C120,25 180,85 300,55 C420,25 480,85 600,55 C680,35 740,65 800,55"
        fill="none"
        stroke="var(--color-brand-cyan)"
        strokeWidth="0.75"
        opacity="0.3"
      />
      <path
        d="M0,20 C90,45 170,-5 260,20 C360,48 420,-8 520,20 C620,45 700,-5 800,20"
        fill="none"
        stroke="var(--color-brand-gold-light)"
        strokeWidth="0.5"
        opacity="0.2"
      />

      <g filter="url(#brand-glow)">
        <circle cx="250" cy="40" r="1.8" fill="var(--color-brand-cyan-light)" style={{ animationDelay: "0s" }} />
        <circle cx="500" cy="40" r="1.4" fill="var(--color-brand-cyan)" style={{ animationDelay: "0.8s" }} />
        <circle cx="300" cy="55" r="1.6" fill="var(--color-brand-gold-light)" style={{ animationDelay: "1.5s" }} />
        <circle cx="600" cy="55" r="1.4" fill="var(--color-brand-cyan-light)" style={{ animationDelay: "2.2s" }} />
        <circle cx="90" cy="45" r="1.2" fill="var(--color-brand-cyan)" style={{ animationDelay: "0.4s" }} />
      </g>
    </svg>
  );
}
