import math

# ==============================================================================
# CONCEPT A: "The Hex Radar"
# Snapping ALL diagonal angles to EXACTLY 30.00° and 150.00°
# tan(30°) = 1 / sqrt(3) ~= 0.577350269
# If dx is given, dy = dx * tan(30°)
# ==============================================================================
def build_perfect_concept_a():
    # Center X = 128
    # Top chevron:
    # Apex at (128, 38)
    # dx = 86 -> dy = 86 * tan(30) = 49.65 -> vertex at (128+86, 38+49.65) = (214, 87.65)
    # End thickness: dx = -12, dy = 12 * tan(60) = 20.78
    # Let's ensure every diagonal line has EXACT slope tan(30°) or tan(60°)!
    
    t30 = math.tan(math.radians(30)) # 0.5773502691896257
    t60 = math.tan(math.radians(60)) # 1.7320508075688772

    # Band 1:
    # Outer top: (128, 36) -> (128 + 84 = 212, 36 + 84*t30 = 84.5)
    # Outer tip: rounded cap or 60 deg bevel
    # Inner top: (128, 68) -> (128 + 72 = 200, 68 + 72*t30 = 109.57) ... wait, inner apex is (128, 68), tip is (200, 109.57)
    # dx = 72, dy = 72 * t30 = 41.57. So 68 + 41.57 = 109.57. That is EXACTLY 30 deg!
    
    # Let's write the exact SVG:
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="a-title">
  <title id="a-title">ReachBee — The Hex Radar</title>
  <!-- Antennae: Filled paths at exact 30 deg angle -->
  <circle cx="106" cy="22" r="5" fill="#18231e"/>
  <circle cx="150" cy="22" r="5" fill="#18231e"/>
  <polygon points="116,38 119.5,36 108.5,23 105,25" fill="#18231e"/>
  <polygon points="140,38 136.5,36 147.5,23 151,25" fill="#18231e"/>

  <!-- Band 1: Wing Apex & Head (Top Chevron) -->
  <!-- Outer slope: from (128, 36) to (212, 84.5) dx=84, dy=48.5 (exact 30 deg) -->
  <!-- Inner slope: from (128, 68) to (200, 109.57) dx=72, dy=41.57 (exact 30 deg) -->
  <path fill="#18231e" d="
    M128 36
    L212 84.5
    C218 88 217 96 211 100
    L200 109.57
    L128 68
    L56 109.57
    L45 100
    C39 96 38 88 44 84.5
    Z
  "/>

  <!-- Band 2: Thorax Chevron -->
  <!-- Outer: (128, 86) -> (188, 120.64) dx=60, dy=34.64 (exact 30 deg) -->
  <!-- Inner: (128, 114) -> (176, 141.71) dx=48, dy=27.71 (exact 30 deg) -->
  <path fill="#18231e" d="
    M128 86
    L188 120.64
    C193 123.5 193 129.5 188 132.5
    L176 141.71
    L128 114
    L80 141.71
    L68 132.5
    C63 129.5 63 123.5 68 120.64
    Z
  "/>

  <!-- Band 3: Abdomen Chevron -->
  <!-- Outer: (128, 132) -> (168, 155.09) dx=40, dy=23.09 (exact 30 deg) -->
  <!-- Inner: (128, 154) -> (156, 170.17) dx=28, dy=16.17 (exact 30 deg) -->
  <path fill="#18231e" d="
    M128 132
    L168 155.09
    C172 157.4 172 162.6 168 165
    L156 170.17
    L128 154
    L100 170.17
    L88 165
    C84 162.6 84 157.4 88 155.09
    Z
  "/>

  <!-- Band 4: Lower Abdomen Chevron -->
  <!-- Outer: (128, 172) -> (148, 183.55) dx=20, dy=11.55 (exact 30 deg) -->
  <!-- Inner: (128, 188) -> (138, 193.77) dx=10, dy=5.77 (exact 30 deg) -->
  <path fill="#18231e" d="
    M128 172
    L148 183.55
    C151 185.3 151 189 148 190.8
    L138 193.77
    L128 188
    L118 193.77
    L108 190.8
    C105 189 105 185.3 108 183.55
    Z
  "/>

  <!-- Stinger: Terminal Apex Point -->
  <polygon points="128,232 136,204 120,204" fill="#18231e"/>
</svg>'''
    return svg

# ==============================================================================
# CONCEPT B: "The Velocity Scout" (45° Forward-Thrusting Aerodynamic Bee)
# A clean, perfectly balanced bee soaring at 45 degrees.
# ==============================================================================
def build_perfect_concept_b():
    # Centered at (128, 128)
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="b-title">
  <title id="b-title">ReachBee — The Velocity Scout</title>
  <!-- Group rotated by -45 degrees and centered -->
  <g transform="translate(128, 128) rotate(-45) translate(-128, -128)">
    <!-- Forewing (Right wing in vertical orientation) -->
    <path fill="#18231e" d="
      M142 84
      C176 52 208 46 220 54
      C230 62 226 92 196 128
      C176 152 152 142 142 120
      Z
    "/>

    <!-- Hindwing (Left wing) -->
    <path fill="#18231e" d="
      M114 84
      C80 52 48 46 36 54
      C26 62 30 92 60 128
      C80 152 104 142 114 120
      Z
    "/>

    <!-- Antennae: Filled paths with clean terminal pips -->
    <path d="M121 44 C113 30 103 24 93 26" fill="none" stroke="#18231e" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="91" cy="26" r="4.5" fill="#18231e"/>
    <path d="M135 44 C143 30 153 24 163 26" fill="none" stroke="#18231e" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="165" cy="26" r="4.5" fill="#18231e"/>

    <!-- Central Body: Head, Thorax & Striped Abdomen (Compound path with fill-rule) -->
    <path fill="#18231e" fill-rule="evenodd" d="
      M128 38
      C142 38 150 50 150 68
      L150 118
      C150 152 138 190 128 226
      C118 190 106 152 106 118
      L106 68
      C106 50 114 38 128 38
      Z

      M109 126 C115 125 141 125 147 126 L145 138 C139 137 117 137 111 138 Z
      M112 152 C118 151 138 151 144 152 L141 164 C135 163 121 163 115 164 Z
      M116 178 C120 177 136 177 140 178 L136 190 C132 189 124 189 120 190 Z
    "/>
  </g>
</svg>'''

# ==============================================================================
# CONCEPT C: "The Sovereign Scout" (Symmetrical Modernist Insignia)
# Symmetrical heraldic bee with pure circular arcs and segmented shield plates
# ==============================================================================
def build_perfect_concept_c():
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="c-title">
  <title id="c-title">ReachBee — The Sovereign Scout</title>
  <!-- Left Wing (Sleek aerodynamic upward sweep) -->
  <path fill="#18231e" d="
    M112 90
    C84 60 52 46 34 50
    C22 53 16 66 22 78
    C34 102 68 132 112 138
    Z
  "/>

  <!-- Right Wing (Symmetrical sweep) -->
  <path fill="#18231e" d="
    M144 90
    C172 60 204 46 222 50
    C234 53 240 66 234 78
    C222 102 188 132 144 138
    Z
  "/>

  <!-- Antennae: Minimalist arcs with pips -->
  <path d="M122 46 C116 32 106 24 94 26" fill="none" stroke="#18231e" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="92" cy="26" r="4.5" fill="#18231e"/>
  <path d="M134 46 C140 32 150 24 162 26" fill="none" stroke="#18231e" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="164" cy="26" r="4.5" fill="#18231e"/>

  <!-- Head & Thorax (Solid upper body keystone) -->
  <path fill="#18231e" d="
    M128 40
    C140 40 148 50 148 64
    L148 112
    C148 118 142 122 134 122
    H122
    C114 122 108 118 108 112
    L108 64
    C108 50 116 40 128 40
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

with open("docs/brand/perfect_a.svg", "w") as f: f.write(build_perfect_concept_a())
with open("docs/brand/perfect_b.svg", "w") as f: f.write(build_perfect_concept_b())
with open("docs/brand/perfect_c.svg", "w") as f: f.write(build_perfect_concept_c())

print("Built perfect candidates")
