import math

# ==============================================================================
# CONCEPT 1: "The Hex Vanguard"
# Precision 30/60 degree isometric construction
# ==============================================================================
def make_concept_1():
    # Grid: 256x256, center x=128
    # Head & Thorax:
    # An aerodynamic faceted bee.
    # Upper wings: sweep up and out at 30 degrees.
    # Lower abdomen: 3 banded plates with 10px clean negative gaps, ending in stinger.
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="c1-title">
  <title id="c1-title">ReachBee — The Hex Vanguard</title>
  <!-- Head & Antennae -->
  <path fill="#18231e" d="M128 34 L148 64 L108 64 Z"/>
  <circle cx="102" cy="24" r="5" fill="#18231e"/>
  <circle cx="154" cy="24" r="5" fill="#18231e"/>
  <path d="M116 46 L105 28" stroke="#18231e" stroke-width="4" stroke-linecap="round"/>
  <path d="M140 46 L151 28" stroke="#18231e" stroke-width="4" stroke-linecap="round"/>

  <!-- Left Wing: Swept Hexagonal Wing (angled up at 30 deg) -->
  <path fill="#18231e" d="
    M102 76
    L34 56
    C24 53 16 63 20 72
    L44 116
    C48 124 58 128 66 124
    L102 106
    Z
  "/>

  <!-- Right Wing: Symmetrical -->
  <path fill="#18231e" d="
    M154 76
    L222 56
    C232 53 240 63 236 72
    L212 116
    C208 124 198 128 190 124
    L154 106
    Z
  "/>

  <!-- Thorax (Center shield) -->
  <path fill="#18231e" d="
    M114 74
    H142
    C150 74 156 80 156 88
    L152 118
    C152 122 148 126 142 126
    H114
    C108 126 104 122 104 118
    L100 88
    C100 80 106 74 114 74
    Z
  "/>

  <!-- Abdomen Plate 1 -->
  <path fill="#18231e" d="
    M106 136
    H150
    L146 160
    C146 163 142 166 138 166
    H118
    C114 166 110 163 110 160
    Z
  "/>

  <!-- Abdomen Plate 2 -->
  <path fill="#18231e" d="
    M112 176
    H144
    L140 196
    C140 198 137 200 134 200
    H122
    C119 200 116 198 116 196
    Z
  "/>

  <!-- Stinger -->
  <polygon points="128,230 136,210 120,210" fill="#18231e"/>
</svg>'''

# ==============================================================================
# CONCEPT 2: "The Flight Draft" / "The Origami Paper-Bee"
# Merging paper plane / email draft with aerodynamic bee
# ==============================================================================
def make_concept_2():
    # 45-degree angle flight vector
    # Central folded paper plane spine + two delta wings + banded bee stripes
    # Designed as a single, cohesive geometric structure
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="c2-title">
  <title id="c2-title">ReachBee — The Flight Draft</title>
  <!-- Angled forward flight (Center 128, 128) -->
  <g transform="rotate(-45 128 128)">
    <!-- Apex Head / Forward Needle -->
    <polygon points="128,26 140,58 116,58" fill="#18231e"/>
    
    <!-- Thorax & Swept Wings (Folded Delta Wing) -->
    <path fill="#18231e" d="
      M128 66
      L148 66
      L224 104
      C234 109 232 124 220 126
      L148 134
      L148 114
      L108 114
      L108 134
      L36 126
      C24 124 22 109 32 104
      L108 66
      Z
    "/>

    <!-- Abdomen Stripe 1 -->
    <path fill="#18231e" d="
      M110 144
      H146
      L144 168
      H112
      Z
    "/>

    <!-- Abdomen Stripe 2 -->
    <path fill="#18231e" d="
      M114 178
      H142
      L138 200
      H118
      Z
    "/>

    <!-- Stinger / Tail Rudder -->
    <polygon points="128,230 135,210 121,210" fill="#18231e"/>
  </g>
</svg>'''

# ==============================================================================
# CONCEPT 3: "The Monogram Scout" ('b' + Bee in Flight)
# Architectural lowercase 'b' with bee wings and stripes
# ==============================================================================
def make_concept_3():
    # Left stem: x=48 to x=88, y=32 to y=216 (strong modern pillar)
    # Right: Upper wing sweeps up at 35 deg; lower bowl forms bee abdomen with stripes
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="c3-title">
  <title id="c3-title">ReachBee — The Monogram Scout</title>
  <!-- Vertical Stem (The Backbone of 'b') -->
  <path fill="#18231e" d="
    M52 48
    C52 38 60 30 70 30
    C80 30 88 38 88 48
    L88 208
    C88 218 80 226 70 226
    C60 226 52 218 52 208
    Z
  "/>

  <!-- Upper Wing (Sweeping out from shoulder of 'b') -->
  <path fill="#18231e" d="
    M88 96
    L176 52
    C188 46 202 54 204 68
    C206 80 196 92 182 96
    L134 108
    Z
  "/>

  <!-- Lower Bowl of 'b' (The Bee Body with Negative Space Stripes) -->
  <path fill="#18231e" fill-rule="evenodd" d="
    M88 106
    C114 106 142 108 166 122
    C194 138 206 166 202 192
    C198 214 176 226 150 226
    C124 226 100 220 88 208
    Z
    
    M88 128
    L152 128
    C168 128 178 136 178 148
    L88 148
    Z
    
    M88 162
    L174 162
    C172 174 164 184 150 184
    L88 184
    Z
    
    M88 198
    L136 198
    C122 206 104 206 88 204
    Z
  "/>
</svg>'''

with open("docs/brand/concept_1.svg", "w") as f: f.write(make_concept_1())
with open("docs/brand/concept_2.svg", "w") as f: f.write(make_concept_2())
with open("docs/brand/concept_3.svg", "w") as f: f.write(make_concept_3())

print("Built triad concepts")
