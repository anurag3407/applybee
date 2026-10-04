import math
import os

# ----------------------------------------------------------------------
# 1. Concept A: "The Hex Radar"
# ----------------------------------------------------------------------
# Snapping angles to exact 30/150 deg; stinger snapped to clean 75 deg.
# No strokes, 100% filled paths.
svg_a = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="a-title">
  <title id="a-title">ReachBee — The Hex Radar</title>
  <!-- Antennae: 30° clean isometric angle -->
  <circle cx="106" cy="22" r="5" fill="#18231e"/>
  <circle cx="150" cy="22" r="5" fill="#18231e"/>
  <polygon points="116,38 119.5,36 108.5,23 105,25" fill="#18231e"/>
  <polygon points="140,38 136.5,36 147.5,23 151,25" fill="#18231e"/>

  <!-- Band 1: Wing Apex & Head (Top Chevron) -->
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

  <!-- Stinger: Exact 75 deg taper -->
  <polygon points="128,232 135.5,204 120.5,204" fill="#18231e"/>
</svg>'''


# ----------------------------------------------------------------------
# 2. Concept B: "The Velocity Scout"
# ----------------------------------------------------------------------
# Rotated 45 degrees, centered at (128, 128), antenna strokes outlined into fills
svg_b = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="b-title">
  <title id="b-title">ReachBee — The Velocity Scout</title>
  <g transform="translate(132, 124) rotate(-45) translate(-128, -128)">
    <!-- Forewing -->
    <path fill="#18231e" d="
      M142 84
      C176 52 208 46 220 54
      C230 62 226 92 196 128
      C176 152 152 142 142 120
      Z
    "/>

    <!-- Hindwing -->
    <path fill="#18231e" d="
      M114 84
      C80 52 48 46 36 54
      C26 62 30 92 60 128
      C80 152 104 142 114 120
      Z
    "/>

    <!-- Antennae: Filled paths -->
    <circle cx="91" cy="26" r="4.5" fill="#18231e"/>
    <circle cx="165" cy="26" r="4.5" fill="#18231e"/>
    <polygon points="119,43 122,46 95,29 93,25" fill="#18231e"/>
    <polygon points="137,43 134,46 161,29 163,25" fill="#18231e"/>

    <!-- Central Body with negative space stripes -->
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


# ----------------------------------------------------------------------
# 3. Concept C: "The Sovereign Scout"
# ----------------------------------------------------------------------
# Symmetrical heraldic bee, antennae as filled paths, clean margins
svg_c = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="c-title">
  <title id="c-title">ReachBee — The Sovereign Scout</title>
  <!-- Left Wing -->
  <path fill="#18231e" d="
    M112 90
    C84 60 52 46 34 50
    C22 53 16 66 22 78
    C34 102 68 132 112 138
    Z
  "/>

  <!-- Right Wing -->
  <path fill="#18231e" d="
    M144 90
    C172 60 204 46 222 50
    C234 53 240 66 234 78
    C222 102 188 132 144 138
    Z
  "/>

  <!-- Antennae: Filled paths -->
  <circle cx="92" cy="26" r="4.5" fill="#18231e"/>
  <circle cx="164" cy="26" r="4.5" fill="#18231e"/>
  <polygon points="120,44 123,47 96,29 93,25" fill="#18231e"/>
  <polygon points="136,44 133,47 160,29 163,25" fill="#18231e"/>

  <!-- Head & Thorax -->
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

  <!-- Abdomen Plate 1 -->
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

  <!-- Abdomen Plate 2 -->
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

  <!-- Abdomen Plate 3 & Stinger -->
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

# ----------------------------------------------------------------------
# Horizontal Lockups (viewBox="0 0 920 256")
# ----------------------------------------------------------------------
def make_lockup(symbol_svg, name="ReachBee", sub="CAREER OUTREACH"):
    # Strip svg header & closing
    inner = symbol_svg.split(">", 1)[1].rsplit("</svg>", 1)[0]
    font_main = "font-family=\"system-ui,-apple-system,'SF Pro Display',Inter,sans-serif\""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 256" width="920" height="256" role="img">
  <g transform="translate(32, 16) scale(0.88)">
    {inner}
  </g>
  <text x="270" y="148" {font_main} font-size="94" font-weight="800" letter-spacing="-0.03em" fill="#18231e">Reach<tspan fill="#e8b544">Bee</tspan></text>
  <text x="274" y="188" {font_main} font-size="22" font-weight="600" letter-spacing="0.22em" fill="#586257">{sub}</text>
</svg>'''

with open("docs/brand/concept-a-symbol.svg", "w") as f: f.write(svg_a)
with open("docs/brand/concept-b-symbol.svg", "w") as f: f.write(svg_b)
with open("docs/brand/concept-c-symbol.svg", "w") as f: f.write(svg_c)

with open("docs/brand/concept-a-lockup.svg", "w") as f: f.write(make_lockup(svg_a))
with open("docs/brand/concept-b-lockup.svg", "w") as f: f.write(make_lockup(svg_b))
with open("docs/brand/concept-c-lockup.svg", "w") as f: f.write(make_lockup(svg_c))

print("Generated complete production set of symbols and lockups")
