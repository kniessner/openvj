interface LogoMarkProps {
  size?: number
  className?: string
}

export function LogoMark({ size = 28, className = '' }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Dark background */}
      <rect width="32" height="32" rx="7" fill="#0d1117" />

      {/* Projection surface — keystoned quad suggesting a mapped surface */}
      <path
        d="M5 26 L10 7 L22 7 L27 26 Z"
        fill="rgba(212,245,66,0.07)"
        stroke="#d4f542"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Horizontal scan lines inside — projected content */}
      <line x1="8.5"  y1="14" x2="23.5" y2="14" stroke="#d4f542" strokeWidth="1"   opacity="0.55" />
      <line x1="7.5"  y1="18" x2="24.5" y2="18" stroke="#d4f542" strokeWidth="0.75" opacity="0.35" />
      <line x1="6.5"  y1="22" x2="25.5" y2="22" stroke="#d4f542" strokeWidth="0.5"  opacity="0.2"  />

      {/* Projector source dot at top-center */}
      <circle cx="16" cy="4" r="2" fill="#d4f542" />

      {/* Beam lines from source to surface corners */}
      <line x1="16" y1="6" x2="10" y2="7" stroke="#d4f542" strokeWidth="0.6" opacity="0.25" />
      <line x1="16" y1="6" x2="22" y2="7" stroke="#d4f542" strokeWidth="0.6" opacity="0.25" />
    </svg>
  )
}

export function LogoFull({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={28} />
      <div className="flex items-baseline gap-1.5">
        <span className="font-bold text-sm tracking-tight text-white">
          Open<span className="text-[#d4f542]">VJ</span>
        </span>
      </div>
    </div>
  )
}
