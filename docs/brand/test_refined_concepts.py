import math

# Concept 1: The Hexagon Scout (Upright Hexagon with Negative Space Bee / Arrow)
# Hexagon with center (128, 128), radius 100.
# Vertices of regular hexagon:
# top: (128, 28)
# top-right: (128 + 100*cos(30), 128 - 100*sin(30)) = (214.6, 78)
# bottom-right: (214.6, 178)
# bottom: (128, 228)
# bottom-left: (41.4, 178)
# top-left: (41.4, 78)
#
# Now, let's carve a negative space bee/arrow into this hexagon!
# Imagine an upward chevron arrow that carves out the bee's wings and body.
def build_concept_1():
    # A regular hexagon divided into:
    # 1. Top chevron (Thorax & Wings)
    # 2. Mid band (Abdomen stripe 1)
    # 3. Lower band (Abdomen stripe 2)
    # 4. Bottom vertex (Stinger)
    # The bands are separated by 12px negative-space gaps angled at 30 degrees (matching hexagon sides)
    # All geometry snaps to the 30/60 degree isometric hexagon grid!
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="c1-title">
  <title id="c1-title">ReachBee — The Hexagon Scout</title>
  <!-- Segment 1: Top Chevron / Wings & Head (Ascending Hexagon Crown) -->
  <path fill="#18231e" d="
    M128 32
    L210 79
    L196 110
    L128 71
    L60 110
    L46 79
    Z
  "/>
  
  <!-- Segment 2: Mid-Thorax / Abdomen Chevron 1 -->
  <path fill="#18231e" d="
    M128 92
    L190 128
    L176 157
    L128 129
    L80 157
    L66 128
    Z
  "/>

  <!-- Segment 3: Abdomen Chevron 2 -->
  <path fill="#18231e" d="
    M128 148
    L170 172
    L156 198
    L128 182
    L100 198
    L86 172
    Z
  "/>

  <!-- Segment 4: Stinger / Keel Apex -->
  <path fill="#18231e" d="
    M128 200
    L148 211
    L128 232
    L108 211
    Z
  "/>
</svg>'''

# Concept 2: The Hex-Wing 'b' (Modernist Monogram)
# A bold lowercase 'b' where the counter is a pure hexagon honeycomb,
# and an ascending aerodynamic wing flares from the shoulder.
def build_concept_2():
    # Stem on left: x=52 to x=88, y=36 to y=220, rounded top cap
    # Bowl: Hexagonal outline transitioning smoothly from the stem
    # Hexagon center at (144, 156), radius 64
    # Wing: Sweeps from the shoulder of the b (x=88, y=92) up to (196, 44)
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="c2-title">
  <title id="c2-title">ReachBee — The Hex-Wing b</title>
  <!-- Lowercase 'b' with Hexagonal Bowl -->
  <!-- Stem -->
  <path fill="#18231e" d="
    M56 46
    C56 38 64 32 72 32
    C80 32 88 38 88 46
    L88 206
    C88 214 80 220 72 220
    C64 220 56 214 56 206
    Z
  "/>
  <!-- Hexagonal Honeycomb Bowl -->
  <path fill="#18231e" fill-rule="evenodd" d="
    M88 106
    L144 74
    L200 106
    L200 170
    L144 202
    L88 170
    Z
    
    M108 120
    L108 156
    L144 177
    L180 156
    L180 120
    L144 99
    Z
  "/>
  <!-- Ascending Wing (Emerging from shoulder up-right at 30 deg) -->
  <path fill="#18231e" d="
    M114 74
    L196 36
    C206 32 216 38 218 48
    C220 58 212 66 202 70
    L152 86
    Z
  "/>
</svg>'''

# Concept 3: The Velocity Vector Bee (Aerodynamic 45-degree Dart Bee)
# Two sleek aerodynamic delta wings + central banded fuselage soaring at 45 degrees
def build_concept_3():
    # 45-degree angle: rotated so apex points to (208, 48)
    # Clean curved supersonic wing contours + 2 crisp diagonal stripes
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="c3-title">
  <title id="c3-title">ReachBee — The Velocity Vector</title>
  <g transform="rotate(-45 128 128)">
    <!-- Central Fuselage (Bullet shape with stinger) -->
    <path fill="#18231e" d="
      M128 32
      C142 32 152 46 152 64
      L152 160
      L128 224
      L104 160
      L104 64
      C104 46 114 32 128 32 Z
    "/>
    
    <!-- Left Wing (Aerodynamic swept wing) -->
    <path fill="#18231e" d="
      M98 76
      L36 94
      C24 98 22 112 32 120
      L98 148
      Z
    "/>
    
    <!-- Right Wing -->
    <path fill="#18231e" d="
      M158 76
      L220 94
      C232 98 234 112 224 120
      L158 148
      Z
    "/>

    <!-- Negative space stripes carved out across the whole body & wings -->
    <!-- Stripe 1 (White mask or direct compound cutout) -->
    <polygon points="18,126 238,126 238,140 18,140" fill="#ffffff"/>
    <polygon points="18,154 238,154 238,168 18,168" fill="#ffffff"/>
  </g>
</svg>'''

with open("docs/brand/c1.svg", "w") as f: f.write(build_concept_1())
with open("docs/brand/c2.svg", "w") as f: f.write(build_concept_2())
with open("docs/brand/c3.svg", "w") as f: f.write(build_concept_3())

