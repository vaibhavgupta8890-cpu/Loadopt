import React from 'react';

/**
 * LoadOpt Transportation System Logo
 * Features:
 * 1. Aerodynamic Heavy Freight Hauler / Transport Vehicle
 * 2. 3D Volumetric Optimized Cargo Container with Modular Tier Grids
 * 3. Perspective Highway / Transit Expressway with Animated Speed Lanes
 * 4. Illuminated LED Headlight Cones with Radiant Shimmer Effect
 * 5. Telematics GPS Pulse Beacon for Smart Dispatch
 */
export const LogoIcon = ({ size = 42, className = '' }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center shrink-0 select-none group ${className}`}
    >
      <svg
        viewBox="0 0 72 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible transition-transform duration-300 group-hover:scale-105"
      >
        <style>{`
          @keyframes loRoadFlow {
            0% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: -18; }
          }
          @keyframes loHeadlightPulse {
            0%, 100% { opacity: 0.35; }
            50% { opacity: 0.85; }
          }
          @keyframes loBeaconBlink {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.8); opacity: 0.2; }
          }
          @keyframes loSpeedStreak {
            0% { transform: translateX(-3px); opacity: 0.3; }
            50% { transform: translateX(3px); opacity: 0.9; }
            100% { transform: translateX(-3px); opacity: 0.3; }
          }
          .lo-road-anim {
            animation: loRoadFlow 1.2s linear infinite;
          }
          .lo-beam-anim {
            animation: loHeadlightPulse 2.4s ease-in-out infinite;
          }
          .lo-beacon-ring {
            transform-origin: 36px 9px;
            animation: loBeaconBlink 1.8s ease-out infinite;
          }
          .lo-streak-anim {
            animation: loSpeedStreak 2s ease-in-out infinite;
          }
        `}</style>

        <defs>
          {/* Background Ambient Glow */}
          <radialGradient id="lo-bg-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
            <stop offset="70%" stopColor="#06B6D4" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
          </radialGradient>

          {/* Truck Cab Windshield Reflection */}
          <linearGradient id="lo-windshield" x1="26" y1="21" x2="46" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="40%" stopColor="#7DD3FC" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>

          {/* Truck Grille & Body Gradient */}
          <linearGradient id="lo-cab-body" x1="18" y1="28" x2="54" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="45%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Cargo Container (Roof and Trailer) */}
          <linearGradient id="lo-cargo-box" x1="20" y1="8" x2="52" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="60%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>

          {/* Headlight Beams */}
          <linearGradient id="lo-beam-left" x1="22" y1="43" x2="6" y2="68" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#06B6D4" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="lo-beam-right" x1="50" y1="43" x2="66" y2="68" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#06B6D4" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
          </linearGradient>

          {/* Speed Chevron / Optimization Vector */}
          <linearGradient id="lo-chevron-grad" x1="28" y1="34" x2="44" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          {/* Highway Road Gradient */}
          <linearGradient id="lo-road-grad" x1="36" y1="46" x2="36" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E293B" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.95" />
          </linearGradient>

          {/* Drop Shadows */}
          <filter id="lo-glow-effect" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0284C7" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Atmospheric Backlight Disc */}
        <circle cx="36" cy="36" r="32" fill="url(#lo-bg-glow)" />

        {/* 1. PERSPECTIVE TRANSIT HIGHWAY / ROADWAY */}
        <path
          d="M26 47L8 70H64L46 47H26Z"
          fill="url(#lo-road-grad)"
          stroke="#334155"
          strokeWidth="0.8"
        />

        {/* Outer Highway Shoulder Curbs */}
        <line x1="25" y1="47" x2="6" y2="70" stroke="#38BDF8" strokeWidth="1.5" strokeOpacity="0.8" />
        <line x1="47" y1="47" x2="66" y2="70" stroke="#38BDF8" strokeWidth="1.5" strokeOpacity="0.8" />

        {/* Flowing Highway Center Lane Dashes (Continuous Transit Animation) */}
        <line
          x1="36"
          y1="47"
          x2="36"
          y2="70"
          stroke="#FACC15"
          strokeWidth="2"
          strokeDasharray="4 5"
          strokeLinecap="round"
          className="lo-road-anim"
        />

        {/* 2. ILLUMINATED HEADLIGHT BEAMS (Forward Speed Effect) */}
        <path
          d="M21 44L4 68L22 68L25 44H21Z"
          fill="url(#lo-beam-left)"
          className="lo-beam-anim"
        />
        <path
          d="M51 44L68 68L50 68L47 44H51Z"
          fill="url(#lo-beam-right)"
          className="lo-beam-anim"
        />

        {/* 3. CARGO TRAILER / HIGH-CUBE CONTAINER (Load Volume Matrix) */}
        <g filter="url(#lo-glow-effect)">
          {/* Top Aerodynamic Air-Deflector / Cargo Shell */}
          <path
            d="M23 11C23 9.5 24.5 8 26.5 8H45.5C47.5 8 49 9.5 49 11L52 22H20L23 11Z"
            fill="url(#lo-cargo-box)"
            stroke="#93C5FD"
            strokeWidth="0.8"
          />

          {/* Cargo Container Modular Packing Grid (Loading Slots) */}
          <line x1="30" y1="9" x2="28" y2="21" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="1.5 2" />
          <line x1="36" y1="8.5" x2="36" y2="21.5" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1.2" />
          <line x1="42" y1="9" x2="44" y2="21" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="1.5 2" />
          <line x1="22" y1="15" x2="50" y2="15" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="0.8" />
        </g>

        {/* 4. TRUCK POWER CAB (Heavy Transport Hauler) */}
        {/* Cab Main Shell */}
        <path
          d="M20 22C20 21 21 20 22 20H50C51 20 52 21 52 22V46C52 47.5 50.5 48.5 49 48.5H23C21.5 48.5 20 47.5 20 46V22Z"
          fill="url(#lo-cab-body)"
          stroke="#60A5FA"
          strokeWidth="1"
        />

        {/* Panoramic Tinted Windshield with Horizon Reflection */}
        <path
          d="M23 23C23 22.5 23.5 22 24 22H48C48.5 22 49 22.5 49 23L47.5 32H24.5L23 23Z"
          fill="url(#lo-windshield)"
          stroke="#BAE6FD"
          strokeWidth="0.8"
        />
        {/* Windshield Glare Highlight */}
        <path d="M26 23L24.8 30" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.75" />
        <path d="M29 23L27.8 28" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" strokeOpacity="0.5" />

        {/* Chrome Central Grille (Cooling Intake + Axle Load Center) */}
        <path
          d="M26 34C26 33.5 26.5 33 27 33H45C45.5 33 46 33.5 46 34V44C46 44.5 45.5 45 45 45H27C26.5 45 26 44.5 26 44V34Z"
          fill="#0B1329"
          stroke="#38BDF8"
          strokeWidth="0.8"
        />

        {/* Grille Louvers */}
        <line x1="28" y1="36" x2="44" y2="36" stroke="#475569" strokeWidth="1" />
        <line x1="28" y1="39" x2="44" y2="39" stroke="#475569" strokeWidth="1" />
        <line x1="28" y1="42" x2="44" y2="42" stroke="#475569" strokeWidth="1" />

        {/* Center Optimization Vector Chevron (High-Tech Emblem on Grille) */}
        <path
          d="M32 41L36 36L40 41L38 41L36 38.5L34 41H32Z"
          fill="url(#lo-chevron-grad)"
          filter="url(#lo-glow-effect)"
        />

        {/* Dual High-Intensity LED Headlights */}
        <rect x="20.5" y="41" width="4.5" height="3" rx="1" fill="#38BDF8" stroke="#E0F2FE" strokeWidth="0.5" />
        <rect x="47" y="41" width="4.5" height="3" rx="1" fill="#38BDF8" stroke="#E0F2FE" strokeWidth="0.5" />

        {/* Heavy Commercial Bumper Bar */}
        <path
          d="M17 46H55C55.5 46 56 46.5 55.8 47L54.5 50C54.3 50.5 53.8 51 53.2 51H18.8C18.2 51 17.7 50.5 17.5 50L16.2 47C16 46.5 16.5 46 17 46Z"
          fill="#1E293B"
          stroke="#475569"
          strokeWidth="0.8"
        />

        {/* Transport Fog Lights on Bumper */}
        <circle cx="21" cy="48.5" r="1.2" fill="#FACC15" />
        <circle cx="51" cy="48.5" r="1.2" fill="#FACC15" />

        {/* Front Axle Heavy-Duty Wheels */}
        <rect x="17" y="38" width="3" height="9" rx="1.5" fill="#090D1A" stroke="#334155" strokeWidth="0.8" />
        <rect x="52" y="38" width="3" height="9" rx="1.5" fill="#090D1A" stroke="#334155" strokeWidth="0.8" />

        {/* Side Mirrors (Aerodynamic Transport Wings) */}
        <path d="M19 26L16 25V30L19 29" fill="#1E3A8A" stroke="#60A5FA" strokeWidth="0.8" />
        <path d="M53 26L56 25V30L53 29" fill="#1E3A8A" stroke="#60A5FA" strokeWidth="0.8" />

        {/* 5. TELEMATICS GPS ROOF BEACON (Smart Dispatch Antenna with Pulse Waves) */}
        <circle cx="36" cy="7" r="1.8" fill="#10B981" />
        <circle cx="36" cy="7" r="3.5" stroke="#34D399" strokeWidth="0.8" fill="none" className="lo-beacon-ring" />
        <circle cx="36" cy="7" r="5.5" stroke="#38BDF8" strokeWidth="0.5" strokeOpacity="0.4" fill="none" className="lo-beacon-ring" style={{ animationDelay: '0.6s' }} />

        {/* High-Speed Dynamic Stream Lines (Aerodynamic Flow Over Cab) */}
        <g className="lo-streak-anim">
          <path d="M12 18H18" stroke="#38BDF8" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.6" />
          <path d="M54 18H60" stroke="#38BDF8" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.6" />
          <path d="M10 24H15" stroke="#06B6D4" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.4" />
          <path d="M57 24H62" stroke="#06B6D4" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.4" />
        </g>
      </svg>
    </div>
  );
};

export const Logo = ({
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  variant = 'dark', // 'dark' (for dark navy sidebar) | 'light' (for white cards/login)
  showTagline = true,
  collapsed = false,
  className = '',
}) => {
  const sizeMap = {
    sm: { icon: 34, text: 'text-base', sub: 'text-[9px]' },
    md: { icon: 44, text: 'text-xl', sub: 'text-[10px]' },
    lg: { icon: 60, text: 'text-3xl', sub: 'text-xs' },
    xl: { icon: 76, text: 'text-4xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const isDark = variant === 'dark';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Icon with interactive transport motion housing */}
      <div className="relative group cursor-pointer">
        {/* Luminous dynamic glow trail */}
        <div
          className={`absolute -inset-1.5 rounded-2xl opacity-40 blur-sm transition-all duration-500 group-hover:opacity-90 group-hover:blur-md ${
            isDark
              ? 'bg-gradient-to-tr from-blue-600 via-cyan-400 to-emerald-400'
              : 'bg-gradient-to-tr from-blue-500 via-sky-400 to-indigo-500'
          }`}
        />

        {/* High-tech Transport Chassis Card */}
        <div
          className={`relative p-1.5 rounded-2xl border flex items-center justify-center shadow-xl transition-all duration-300 group-hover:-translate-y-0.5 ${
            isDark
              ? 'bg-slate-900/95 border-slate-700/80 shadow-blue-950/60'
              : 'bg-white/95 border-slate-200/90 shadow-slate-300/60'
          }`}
        >
          <LogoIcon size={currentSize.icon} />
        </div>
      </div>

      {/* Typography & System Wordmark */}
      {!collapsed && (
        <div className="flex flex-col justify-center">
          <div className={`font-black tracking-tight leading-none flex items-baseline ${currentSize.text}`}>
            <span className={isDark ? 'text-white' : 'text-slate-900'}>
              Load
            </span>
            <span className="bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400 bg-clip-text text-transparent ml-0.5">
              Opt
            </span>

            {/* Live Telematics Indicator Pill */}
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider bg-blue-500/15 text-cyan-400 border border-cyan-400/30 uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Fleet</span>
            </span>
          </div>

          {showTagline && (
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`font-bold tracking-widest uppercase leading-none ${currentSize.sub} ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Smart Transport & Delivery
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
