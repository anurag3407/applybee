import math

# Candidate 1: The Sovereign Bee (Aerodynamic, balanced, premium insignia)
def make_sovereign_bee():
    # Center 128, 128
    # Body: 
    # Head at (128, 44), width 28.
    # Thorax widens to 36 at y=90.
    # Abdomen tapers to stinger at (128, 222).
    # Two crisp negative cuts at y=140-150 and y=168-178.
    # Wings:
    # Left wing from (110, 80) sweeps out to (36, 52), smooth round tip, sweeps back to (110, 130).
    # Right wing symmetrical.
    # Antennae: Two sleek 45-deg arcs.
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="t1-title">
  <title id="t1-title">ReachBee — The Sovereign Bee</title>
  
  <!-- Left Wing (Sleek aerodynamic upward sweep) -->
  <path fill="#18231e" d="
    M112 86
    C80 62 48 50 34 54
    C24 57 20 68 26 77
    C38 95 68 122 110 134
    C112 118 112 102 112 86
    Z
  "/>

  <!-- Right Wing (Symmetrical) -->
  <path fill="#18231e" d="
    M144 86
    C176 62 208 50 222 54
    C232 57 236 68 230 77
    C218 95 188 122 146 134
    C144 118 144 102 144 86
    Z
  "/>

  <!-- Antennae (Architectural minimalist arcs with pips) -->
  <path d="M122 46 C116 32 106 24 96 24" fill="none" stroke="#18231e" stroke-width="5" stroke-linecap="round"/>
  <circle cx="94" cy="24" r="5" fill="#18231e"/>
  <path d="M134 46 C140 32 150 24 160 24" fill="none" stroke="#18231e" stroke-width="5" stroke-linecap="round"/>
  <circle cx="162" cy="24" r="5" fill="#18231e"/>

  <!-- Central Body: Head, Thorax, Segmented Abdomen & Stinger -->
  <!-- We construct with fill-rule="evenodd" so stripes are genuine cutouts -->
  <path fill="#18231e" fill-rule="evenodd" d="
    M128 42
    C142 42 150 54 150 70
    L150 114
    C150 148 138 188 128 224
    C118 188 106 148 106 114
    L106 70
    C106 54 114 42 128 42
    Z

    M104 126
    H152
    V138
    H104
    Z

    M108 152
    H148
    V164
    H108
    Z

    M114 178
    H142
    V190
    H114
    Z
  "/>
</svg>'''

# Candidate 2: The Hex Chevron (Refining c1 into a pure, unforgettable mark)
def make_hex_chevron():
    # A regular hexagon silhouette formed by 3 upward-reaching chevrons + stinger.
    # We round the vertices subtly and add clean antenna vertices.
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="t2-title">
  <title id="t2-title">ReachBee — The Hex Chevron</title>
  <!-- Antenna Pips -->
  <circle cx="106" cy="22" r="5" fill="#18231e"/>
  <circle cx="150" cy="22" r="5" fill="#18231e"/>
  <line x1="118" y1="38" x2="108" y2="24" stroke="#18231e" stroke-width="4.5" stroke-linecap="round"/>
  <line x1="138" y1="38" x2="148" y2="24" stroke="#18231e" stroke-width="4.5" stroke-linecap="round"/>

  <!-- Top Chevron: Thorax & Outstretched Wings -->
  <path fill="#18231e" d="
    M128 34
    L214 84
    C220 88 220 96 214 100
    L200 108
    L128 66
    L56 108
    L42 100
    C36 96 36 88 42 84
    Z
  "/>

  <!-- Mid Chevron: Abdomen Band 1 -->
  <path fill="#18231e" d="
    M128 84
    L190 120
    L176 130
    L128 102
    L80 130
    L66 120
    Z
  "/>

  <!-- Lower Chevron: Abdomen Band 2 -->
  <path fill="#18231e" d="
    M128 120
    L168 144
    L154 154
    L128 138
    L102 154
    L88 144
    Z
  "/>

  <!-- Lower Chevron: Abdomen Band 3 -->
  <path fill="#18231e" d="
    M128 156
    L152 170
    L140 180
    L128 172
    L116 180
    L104 170
    Z
  "/>

  <!-- Stinger -->
  <polygon points="128,228 138,194 118,194" fill="#18231e"/>
</svg>'''

# Candidate 3: The Radial Monogram 'B' (Clean Modernist 'B' with Bee Wings)
def make_radial_b():
    # Capital 'B' formed by:
    # 1. Solid vertical spine (x=48 to x=86, y=36 to y=220)
    # 2. Upper loop: shaped like an aerodynamic wing flaring up-right
    # 3. Lower loop: shaped like a bee body with negative space stripes
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="t3-title">
  <title id="t3-title">ReachBee — The Monogram B</title>
  <!-- Architectural B with Integrated Bee Anatomy -->
  <!-- Left Spine -->
  <rect x="50" y="36" width="36" height="184" rx="8" fill="#18231e"/>
  
  <!-- Upper Loop / Wing: Clean geometric semicircle/rounded wedge -->
  <path fill="#18231e" d="
    M96 46
    H150
    C178 46 198 64 198 88
    C198 112 178 126 150 126
    H96
    Z
    M124 72
    V100
    H146
    C158 100 166 94 166 86
    C166 78 158 72 146 72
    Z
  "/>

  <!-- Lower Loop / Abdomen: Hexagonal honeycomb cell with stripes -->
  <path fill="#18231e" fill-rule="evenodd" d="
    M96 130
    H156
    C186 130 208 148 208 174
    C208 200 186 218 156 218
    H96
    Z

    M124 154
    V194
    H152
    C168 194 178 186 178 174
    C178 162 168 154 152 154
    Z

    M96 166 H124 V174 H96 Z
  "/>

  <!-- Antenna / Stinger Accents -->
  <circle cx="68" cy="22" r="5" fill="#18231e"/>
</svg>'''

with open("docs/brand/sculpt_1.svg", "w") as f: f.write(make_sovereign_bee())
with open("docs/brand/sculpt_2.svg", "w") as f: f.write(make_hex_chevron())
with open("docs/brand/sculpt_3.svg", "w") as f: f.write(make_radial_b())
print("Sculpted 3 candidates")
