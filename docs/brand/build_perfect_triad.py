import math

# ==============================================================================
# CONCEPT A: "The Hex Radar" (Isometric Comb Bee / Outreach Signal)
# Symmetrical, authoritative, 30/60 degree isometric geometry
# ==============================================================================
def make_concept_a():
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-a">
  <title id="title-a">ReachBee — The Hex Radar</title>
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
# CONCEPT B: "The Flight Draft" (Origami Plane + Soaring Bee)
# Merges the 1-click email draft / paper plane with aerodynamic bee anatomy.
# Dynamic forward-upward flight trajectory (45 deg).
# ==============================================================================
def make_concept_b():
    # Designed as an origami paper airplane fused with bee stripes and wings
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-b">
  <title id="title-b">ReachBee — The Flight Draft</title>
  <!-- Angled forward-right (momentum vector) -->
  <g transform="translate(10, 6)">
    <!-- Main Center Fuselage / Nose Dart -->
    <path fill="#18231e" d="
      M210 46
      L146 110
      L130 114
      L114 98
      L118 82
      Z
    "/>
    
    <!-- Left Wing (Top in 45-deg view) with Bee Stripe Band -->
    <path fill="#18231e" d="
      M200 56
      L84 56
      C74 56 68 66 74 74
      L114 114
      L138 114
      Z
    "/>
    
    <!-- Right Wing (Bottom in 45-deg view) with Bee Stripe Band -->
    <path fill="#18231e" d="
      M184 72
      L114 142
      L114 166
      C114 176 124 182 132 176
      L172 136
      Z
    "/>

    <!-- Negative space stripes carved cleanly through the origami wing -->
    <!-- Wing Facet 2 (The Mid Honeycomb Band) -->
    <path fill="#18231e" d="
      M58 88
      C52 94 54 104 62 108
      L96 124
      L82 92
      Z
    "/>
    <path fill="#18231e" d="
      M102 182
      C106 190 116 192 122 186
      L138 152
      L106 138
      Z
    "/>
    
    <!-- Tail Rudder / Stinger -->
    <polygon points="62,154 44,172 74,166" fill="#18231e"/>
    
    <!-- Forward Antenna Beam -->
    <line x1="214" y1="42" x2="228" y2="28" stroke="#18231e" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="230" cy="26" r="4.5" fill="#18231e"/>
  </g>
</svg>'''


# ==============================================================================
# CONCEPT C: "The Sovereign Scout" (Symmetrical Modernist Insignia)
# Segmented shield plates for abdomen: 100% clean curvature, zero notches.
# Two magnificent upward-flaring wings.
# ==============================================================================
def make_concept_c():
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title-c">
  <title id="title-c">ReachBee — The Sovereign Scout</title>
  <!-- Left Wing (Sleek aerodynamic upward sweep) -->
  <path fill="#18231e" d="
    M112 88
    C84 58 52 44 34 48
    C22 51 16 64 22 76
    C34 100 68 130 112 136
    Z
  "/>

  <!-- Right Wing (Symmetrical sweep) -->
  <path fill="#18231e" d="
    M144 88
    C172 58 204 44 222 48
    C234 51 240 64 234 76
    C222 100 188 130 144 136
    Z
  "/>

  <!-- Antennae: Minimalist arcs with pips -->
  <path d="M122 44 C116 30 106 22 94 24" fill="none" stroke="#18231e" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="92" cy="24" r="4.5" fill="#18231e"/>
  <path d="M134 44 C140 30 150 22 162 24" fill="none" stroke="#18231e" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="164" cy="24" r="4.5" fill="#18231e"/>

  <!-- Head & Thorax (Solid upper body keystone) -->
  <path fill="#18231e" d="
    M128 38
    C140 38 148 48 148 62
    L148 110
    C148 116 142 122 134 122
    H122
    C114 122 108 116 108 110
    L108 62
    C108 48 116 38 128 38
    Z
  "/>

  <!-- Abdomen Plate 1 (Curved Shield Segment) -->
  <path fill="#18231e" d="
    M110 130
    H146
    C149 130 151 133 150 136
    L146 156
    C145 159 142 161 139 161
    H117
    C114 161 111 159 110 156
    L106 136
    C105 133 107 130 110 130
    Z
  "/>

  <!-- Abdomen Plate 2 (Mid Shield Segment) -->
  <path fill="#18231e" d="
    M114 169
    H142
    C145 169 147 172 146 175
    L142 191
    C141 193 139 195 136 195
    H120
    C117 195 115 193 114 191
    L110 175
    C109 172 111 169 114 169
    Z
  "/>

  <!-- Abdomen Plate 3 & Stinger (Terminal Apex) -->
  <path fill="#18231e" d="
    M118 203
    H138
    C141 203 143 206 141 209
    L128 232
    L115 209
    C113 206 115 203 118 203
    Z
  "/>
</svg>'''

with open("docs/brand/concept_a.svg", "w") as f: f.write(make_concept_a())
with open("docs/brand/concept_b.svg", "w") as f: f.write(make_concept_b())
with open("docs/brand/concept_c.svg", "w") as f: f.write(make_concept_c())

print("Wrote concept_a, concept_b, concept_c")
