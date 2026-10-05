"use client";

import React from "react";

export interface FeatureGridDarkProps {
  className?: string;
}

export function FeatureGridDark({ className = "" }: FeatureGridDarkProps) {
  return (
    <section className={`relative w-full py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-[#060709] ${className}`}>
      {/* Outer wrapper with centered constraint */}
      <div className="relative mx-auto max-w-[1140px]">
        
        {/* Ambient Corner Auras directly behind the top corners of the outer card */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -left-12 h-96 w-96 rounded-full bg-orange-600/35 blur-[100px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -right-12 h-[420px] w-[420px] rounded-full bg-blue-600/40 blur-[110px]"
        />

        {/* Main Dark Beveled Container matching the reference screenshot */}
        <div className="relative overflow-hidden rounded-[2.25rem] md:rounded-[2.75rem] border border-white/[0.09] bg-[#0c0d12] p-4 sm:p-6 md:p-7 shadow-[0_30px_90px_rgba(0,0,0,0.95)]">
          
          {/* Top-Left Corner Glowing Orange Border */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-2 -left-2 h-64 w-64 rounded-tl-[2.75rem] bg-gradient-to-br from-orange-500/70 via-amber-500/25 to-transparent blur-[14px]"
          />
          {/* Top-Right Corner Glowing Electric Blue Border */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-2 -right-2 h-72 w-72 rounded-tr-[2.75rem] bg-gradient-to-bl from-blue-500/80 via-sky-400/30 to-transparent blur-[16px]"
          />

          {/* Subtle Dot Grid Pattern on the container header */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.14]"
            style={{
              backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
              backgroundSize: "22px 22px",
              maskImage: "linear-gradient(to bottom, black 20%, transparent 80%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 20%, transparent 80%)",
            }}
          />

          {/* 2x2 Feature Grid */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            
            {/* ------------------------------------------------------------- */}
            {/* Card 1: Real-Time Analytics (Tachometer / Speedometer Gauge) */}
            {/* ------------------------------------------------------------- */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-[1.65rem] border border-white/[0.06] bg-[#121318] p-6 sm:p-8 min-h-[390px] shadow-md transition-all duration-300 hover:border-white/[0.1]">
              
              {/* Visual Display */}
              <div className="relative flex h-56 w-full items-center justify-center">
                {/* Diffuse warm orange glow in center */}
                <div
                  aria-hidden="true"
                  className="absolute h-36 w-44 rounded-full bg-orange-500/25 blur-[45px] pointer-events-none"
                />

                <svg
                  viewBox="0 0 340 210"
                  className="w-full max-w-[310px] h-auto overflow-visible select-none"
                  aria-hidden="true"
                >
                  <defs>
                    {/* Glowing active arc gradient */}
                    <linearGradient id="speedArcGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="55%" stopColor="#fb923c" />
                      <stop offset="85%" stopColor="#fde047" />
                      <stop offset="100%" stopColor="#ffffff" />
                    </linearGradient>

                    {/* Needle gradient */}
                    <linearGradient id="needleGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                      <stop offset="50%" stopColor="#fb923c" />
                      <stop offset="90%" stopColor="#fed7aa" />
                      <stop offset="100%" stopColor="#ffffff" />
                    </linearGradient>

                    {/* Arc soft blur glow filter */}
                    <filter id="arcGlowFilter2" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="5.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Outer Radial Tick Marks (from ~145° to ~35°) */}
                  {Array.from({ length: 41 }).map((_, i) => {
                    const startAngle = 145; // degrees
                    const totalSweep = 250; // degrees
                    const angleDeg = startAngle + (i / 40) * totalSweep;
                    const angleRad = (angleDeg * Math.PI) / 180;
                    const cx = 170;
                    const cy = 160;
                    const isLong = i % 4 === 0;
                    const rInner = 114;
                    const rOuter = isLong ? 124 : 120;
                    const x1 = cx + rInner * Math.cos(angleRad);
                    const y1 = cy + rInner * Math.sin(angleRad);
                    const x2 = cx + rOuter * Math.cos(angleRad);
                    const y2 = cy + rOuter * Math.sin(angleRad);
                    const isLit = i <= 28;

                    return (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={isLit ? "rgba(255, 255, 255, 0.42)" : "rgba(255, 255, 255, 0.12)"}
                        strokeWidth={isLong ? 2 : 1.25}
                        strokeLinecap="round"
                      />
                    );
                  })}

                  {/* Base Track Arc (Dim background guide) */}
                  <path
                    d="M 66 160 A 104 104 0 1 1 274 160"
                    fill="none"
                    stroke="#1c1e25"
                    strokeWidth="8.5"
                    strokeLinecap="round"
                  />

                  {/* Glowing Active Arc (Sweeps from bottom-left up and over to ~2 o'clock) */}
                  <path
                    d="M 66 160 A 104 104 0 1 1 246 88"
                    fill="none"
                    stroke="url(#speedArcGrad2)"
                    strokeWidth="11"
                    strokeLinecap="round"
                    filter="url(#arcGlowFilter2)"
                  />

                  {/* Needle Indicator: Thick rounded tapered beam pointing UP-RIGHT at ~35° */}
                  <g transform="translate(170, 160)">
                    {/* Shadow under needle */}
                    <path
                      d="M -6 -4 L 56 -48 Q 66 -54 58 -44 L -4 6 Z"
                      fill="#ea580c"
                      opacity="0.35"
                      filter="blur(5px)"
                    />
                    {/* Tapered glowing needle beam pointing up-right */}
                    <path
                      d="M -5 -3 L 58 -45 Q 67 -51 59 -43 L -3 5 Z"
                      fill="url(#needleGrad2)"
                      filter="url(#arcGlowFilter2)"
                    />
                    {/* Glowing needle tip bloom */}
                    <circle
                      cx="61"
                      cy="-47"
                      r="4.5"
                      fill="#ffffff"
                      filter="url(#arcGlowFilter2)"
                    />
                  </g>
                </svg>
              </div>

              {/* Text Block */}
              <div className="mt-4">
                <h3 className="text-lg md:text-xl font-semibold tracking-tight text-white">
                  Real – Time Analytics
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#8f94a2]">
                  Stay ahead with accurate, real-time performance tracking and deliverability insights.
                </p>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* Card 2: AI-Driven Growth (Floating 24% HUD with side connectors) */}
            {/* ------------------------------------------------------------- */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-[1.65rem] border border-white/[0.06] bg-[#121318] p-6 sm:p-8 min-h-[390px] shadow-md transition-all duration-300 hover:border-white/[0.1]">
              
              {/* Visual Display */}
              <div className="relative flex h-56 w-full flex-col items-center justify-center">
                
                {/* Faint micro glyphs / data dust in the background */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-3 right-6 text-[10px] font-mono leading-tight tracking-widest text-sky-400/20 select-none text-right"
                >
                  <div>A Z K D J + &nbsp; H L</div>
                  <div>β θ θ &nbsp; μ &nbsp; B O M</div>
                  <div>U T U &nbsp; E L D %</div>
                </div>

                {/* Top Badge: "Growth Increased" with glowing blue dot */}
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-[#0c182b]/90 px-3.5 py-0.5 backdrop-blur-md shadow-[0_0_12px_rgba(56,189,248,0.2)]">
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_6px_#38bdf8]" />
                  </span>
                  <span className="text-[11px] font-medium tracking-wide text-sky-200">
                    Growth Increased
                  </span>
                </div>

                {/* Central HUD Card with continuous horizontal connector line */}
                <div className="relative flex items-center justify-center w-full max-w-[290px]">
                  
                  {/* Horizontal Wire Line behind HUD */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 h-[1.5px] bg-sky-400/25 pointer-events-none"
                  />

                  {/* Left Pill Node */}
                  <div className="relative z-10 mr-[-6px] h-2 w-4 rounded-full border border-sky-400/50 bg-[#0c182b] shadow-[0_0_8px_rgba(56,189,248,0.5)]" />

                  {/* Glassmorphic HUD Box */}
                  <div className="relative z-20 flex items-center justify-center gap-3.5 rounded-2xl border border-sky-400/40 bg-gradient-to-b from-[#162744]/90 to-[#0c1626]/95 px-8 py-4 shadow-[0_0_35px_rgba(56,189,248,0.28)] backdrop-blur-xl">
                    {/* Upward Chevron Icon (Double Chevron) */}
                    <div className="flex flex-col items-center -space-y-1.5 text-sky-400">
                      <svg
                        className="h-6 w-6 stroke-[3.5] drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m18 15-6-6-6 6" />
                      </svg>
                    </div>

                    {/* 24% Bold Metric */}
                    <span className="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
                      24%
                    </span>
                  </div>

                  {/* Right Pill Node */}
                  <div className="relative z-10 ml-[-6px] h-2 w-4 rounded-full border border-sky-400/50 bg-[#0c182b] shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                </div>

              </div>

              {/* Text Block */}
              <div className="mt-4">
                <h3 className="text-lg md:text-xl font-semibold tracking-tight text-white">
                  AI – Driven Growth
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#8f94a2]">
                  Make smarter moves with accurate, real-time outreach intelligence and career insights.
                </p>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* Card 3: Decision-Maker Discovery (Spotlight Avatar) */}
            {/* ------------------------------------------------------------- */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-[1.65rem] border border-white/[0.06] bg-[#121318] p-6 sm:p-8 min-h-[390px] shadow-md transition-all duration-300 hover:border-white/[0.1]">
              
              {/* Visual Display */}
              <div className="relative flex h-56 w-full items-center justify-center overflow-hidden">
                
                {/* Ethereal Spotlight Beam from Top (Smooth Gaussian blur ray) */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center"
                >
                  {/* Top glowing origin bar */}
                  <div className="h-1.5 w-16 rounded-full bg-sky-200 blur-[1px] shadow-[0_0_18px_#38bdf8]" />
                  {/* Soft Gaussian blur cone of light */}
                  <div className="h-44 w-44 bg-gradient-to-b from-sky-400/40 via-sky-500/15 to-transparent blur-2xl" />
                </div>

                {/* 3 Avatar Profiles (Clean silhouettes with illuminated center tile) */}
                <div className="relative z-10 flex items-center justify-center gap-7 sm:gap-9">
                  
                  {/* Left Muted Silhouette (No box frame, clean silhouette) */}
                  <div className="opacity-25 text-[#545c6e]">
                    <svg className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>

                  {/* Center Decision Maker Tile */}
                  <div className="relative flex h-[84px] w-[84px] items-center justify-center rounded-[22px] border border-sky-400/50 bg-gradient-to-b from-[#1a273c] to-[#0d1522] shadow-[0_0_40px_rgba(56,189,248,0.45),inset_0_1px_2px_rgba(255,255,255,0.25)]">
                    {/* Top edge illumination line */}
                    <div className="absolute top-0 inset-x-2 h-[2px] bg-gradient-to-r from-transparent via-sky-200 to-transparent blur-[0.5px]" />
                    
                    {/* Highlighted avatar silhouette */}
                    <div className="text-sky-100">
                      <svg
                        className="h-11 w-11 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  </div>

                  {/* Right Muted Silhouette */}
                  <div className="opacity-25 text-[#545c6e]">
                    <svg className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>

                </div>

              </div>

              {/* Text Block */}
              <div className="mt-4">
                <h3 className="text-lg md:text-xl font-semibold tracking-tight text-white">
                  Decision – Maker Discovery
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#8f94a2]">
                  Pinpoint relevant engineering leads and hiring managers directly, bypassing crowded application portals.
                </p>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* Card 4: Advanced Security (PCB Circuit Traces + Shield Tile) */}
            {/* ------------------------------------------------------------- */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-[1.65rem] border border-white/[0.06] bg-[#121318] p-6 sm:p-8 min-h-[390px] shadow-md transition-all duration-300 hover:border-white/[0.1]">
              
              {/* Visual Display */}
              <div className="relative flex h-56 w-full items-center justify-center">
                
                {/* Thin, elegant PCB Circuit Lines without cartoon colored dots */}
                <svg
                  className="absolute inset-0 h-full w-full pointer-events-none select-none"
                  viewBox="0 0 320 180"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  {/* Left Circuit Lines */}
                  <path
                    d="M 20 62 L 85 62 L 112 80 L 124 80"
                    stroke="#383e4d"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 12 88 L 124 88"
                    stroke="#434a5c"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 25 114 L 85 114 L 112 96 L 124 96"
                    stroke="#383e4d"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />

                  {/* Right Circuit Lines */}
                  <path
                    d="M 300 62 L 235 62 L 208 80 L 196 80"
                    stroke="#383e4d"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 308 88 L 196 88"
                    stroke="#434a5c"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 295 114 L 235 114 L 208 96 L 196 96"
                    stroke="#383e4d"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Backlight Amber/Orange Glow behind the Left Side of the Shield Tile */}
                <div
                  aria-hidden="true"
                  className="absolute h-28 w-28 -translate-x-3 rounded-full bg-orange-500/35 blur-2xl pointer-events-none"
                />

                {/* Metallic Shield Tile */}
                <div className="relative z-10 flex h-[84px] w-[84px] items-center justify-center rounded-[22px] border border-white/10 bg-gradient-to-b from-[#1e212a] to-[#0f1116] shadow-[0_12px_35px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.12)]">
                  {/* Security Shield with Padlock Cutout */}
                  <svg
                    className="h-10 w-10 text-white drop-shadow-md"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 1.5a.75.75 0 0 1 .37.1l6.75 3.75a.75.75 0 0 1 .38.65v5.5c0 5.48-3.41 10.43-7.5 11.95a.75.75 0 0 1-.5 0C7.41 21.93 4 16.98 4 11.5V6a.75.75 0 0 1 .38-.65l6.75-3.75a.75.75 0 0 1 .37-.1Zm0 6a2.25 2.25 0 0 0-2.25 2.25v.75h-.25A1.5 1.5 0 0 0 8 12v3a1.5 1.5 0 0 0 1.5 1.5h5A1.5 1.5 0 0 0 16 15v-3a1.5 1.5 0 0 0-1.5-1.5h-.25v-.75A2.25 2.25 0 0 0 12 7.5Zm-1 2.25a1 1 0 1 1 2 0v.75h-2v-.75Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>

              </div>

              {/* Text Block */}
              <div className="mt-4">
                <h3 className="text-lg md:text-xl font-semibold tracking-tight text-white">
                  Advanced Security
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#8f94a2]">
                  Enterprise-grade encryption and threat modeling to keep your data safe.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
