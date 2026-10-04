import math

# ==============================================================================
# CONCEPT A: "The Hex Radar" (Outreach Signal + Honeycomb Bee)
# Perfectly tuned chevron spacing, optical weight, and antenna balance.
# ==============================================================================
def build_mark_a():
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="a-title">
  <title id="a-title">ReachBee — The Hex Radar</title>
  <!-- Antennae: 30° clean isometric angle -->
  <circle cx="106" cy="22" r="5" fill="#18231e"/>
  <circle cx="150" cy="22" r="5" fill="#18231e"/>
  <line x1="118" y1="36" x2="108" y2="24" stroke="#18231e" stroke-width="4.5" stroke-linecap="round"/>
  <line x1="138" y1="36" x2="148" y2="24" stroke="#18231e" stroke-width="4.5" stroke-linecap="round"/>

  <!-- Band 1: Head, Thorax & Wing Apex (Top Chevron) -->
  <path fill="#18231e" d="
    M128 34
    L214 84
    C220 88 220 96 214 100
    L202 107
    L128 66
    L54 107
    L42 100
    C36 96 36 88 42 84
    Z
  "/>

  <!-- Band 2: Upper Abdomen / Thorax Chevron -->
  <path fill="#18231e" d="
    M128 84
    L190 120
    C195 123 195 129 190 132
    L178 139
    L128 112
    L78 139
    L66 132
    C61 129 61 123 66 120
    Z
  "/>

  <!-- Band 3: Mid Abdomen Chevron -->
  <path fill="#18231e" d="
    M128 130
    L168 154
    C172 156 172 161 168 164
    L158 170
    L128 154
    L98 170
    L88 164
    C84 161 84 156 88 154
    Z
  "/>

  <!-- Band 4: Lower Abdomen Chevron -->
  <path fill="#18231e" d="
    M128 172
    L148 184
    C151 186 151 190 148 192
    L140 197
    L128 190
    L116 197
    L108 192
    C105 190 105 186 108 184
    Z
  "/>

  <!-- Stinger: Apex terminal point -->
  <polygon points="128,232 136,206 120,206" fill="#18231e"/>
</svg>'''


# ==============================================================================
# CONCEPT B: "The Velocity Scout" (45° Forward-Thrusting Aerodynamic Bee)
# Re-centered, stripes perpendicular to the body axis, cohesive silhouette.
# ==============================================================================
def build_mark_b():
    # Rotated -45 degrees around center (128, 128)
    # The body and wings are aligned with the vertical axis before rotation.
    # Stripes are horizontal cuts across the vertical body, so after -45 deg rotation,
    # they are precisely perpendicular to the flight vector!
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="b-title">
  <title id="b-title">ReachBee — The Velocity Scout</title>
  <g transform="translate(12, -8) rotate(-45 128 128)">
    <!-- Forewing (Right wing when facing up, top wing in flight) -->
    <path fill="#18231e" d="
      M144 86
      C180 54 214 48 224 58
      C234 68 228 102 198 136
      L144 116
      Z
    "/>

    <!-- Hindwing (Left wing) -->
    <path fill="#18231e" d="
      M112 86
      C76 54 42 48 32 58
      C22 68 28 102 58 136
      L112 116
      Z
    "/>

    <!-- Antennae -->
    <path d="M120 46 C112 32 102 26 92 28" fill="none" stroke="#18231e" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="90" cy="28" r="4.5" fill="#18231e"/>
    <path d="M136 46 C144 32 154 26 164 28" fill="none" stroke="#18231e" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="166" cy="28" r="4.5" fill="#18231e"/>

    <!-- Central Fuselage (Continuous compound path, negative-space stripes strictly inside body) -->
    <path fill="#18231e" fill-rule="evenodd" d="
      M128 40
      C142 40 150 52 150 70
      L150 120
      C150 152 138 188 128 224
      C118 188 106 152 106 120
      L106 70
      C106 52 114 40 128 40
      Z

      M107 126 H149 V138 H107 Z
      M110 152 H146 V164 H110 Z
      M115 178 H141 V190 H115 Z
    "/>
  </g>
</svg>'''


# ==============================================================================
# CONCEPT C: "The Sovereign Scout" (Symmetrical Modernist Insignia)
# Fully resolved optical silhouette: smooth wing curves, clean negative stripes
# with zero overhangs or notches, perfect vertical balance.
# ==============================================================================
def build_mark_c():
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="c-title">
  <title id="c-title">ReachBee — The Sovereign Scout</title>
  <!-- Left Wing: Swept aerodynamic upward wing -->
  <path fill="#18231e" d="
    M114 96
    C88 64 54 48 36 52
    C24 55 18 68 24 80
    C36 104 70 134 114 140
    Z
  "/>

  <!-- Right Wing: Symmetrical sweep -->
  <path fill="#18231e" d="
    M142 96
    C168 64 202 48 220 52
    C232 55 238 68 232 80
    C220 104 186 134 142 140
    Z
  "/>

  <!-- Antennae: Minimalist arcs with pips -->
  <path d="M122 46 C116 32 106 24 94 26" fill="none" stroke="#18231e" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="92" cy="26" r="4.5" fill="#18231e"/>
  <path d="M134 46 C140 32 150 24 162 26" fill="none" stroke="#18231e" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="164" cy="26" r="4.5" fill="#18231e"/>

  <!-- Central Body: Head, Thorax, Segmented Abdomen & Stinger -->
  <!-- Negative space stripes cut inside the body boundaries with 2px inset margins -->
  <path fill="#18231e" fill-rule="evenodd" d="
    M128 40
    C142 40 150 52 150 70
    L150 120
    C150 154 138 190 128 226
    C118 190 106 154 106 120
    L106 70
    C106 52 114 40 128 40
    Z

    M107 124 H149 V136 H107 Z
    M110 150 H146 V162 H110 Z
    M115 176 H141 V188 H115 Z
  "/>
</svg>'''

with open("docs/brand/reachbee_mark_a.svg", "w") as f: f.write(build_mark_a())
with open("docs/brand/reachbee_mark_b.svg", "w") as f: f.write(build_mark_b())
with open("docs/brand/reachbee_mark_c.svg", "w") as f: f.write(build_mark_c())

print("Wrote refined marks A, B, C")
