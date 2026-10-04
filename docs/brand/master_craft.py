import math

# ==============================================================================
# CONCEPT A: "The Hex Signal" (Honeycomb Shield + Outreach Radar)
# Refinement of the chevron bee into an authoritative, razor-sharp mark.
# Geometry:
# - Top crown: Swept faceted wings/thorax with antenna vertices.
# - Abdomen: 3 precision chevron bands forming both the bee stripes and radiating signal waves.
# - Stinger: Sharp downward anchor.
# ==============================================================================
def craft_concept_a():
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="a-title">
  <title id="a-title">ReachBee — The Hex Signal</title>
  <!-- Antennae: 30-degree precision offsets -->
  <circle cx="106" cy="24" r="5.5" fill="#18231e"/>
  <circle cx="150" cy="24" r="5.5" fill="#18231e"/>
  <line x1="118" y1="40" x2="108" y2="26" stroke="#18231e" stroke-width="5" stroke-linecap="round"/>
  <line x1="138" y1="40" x2="148" y2="26" stroke="#18231e" stroke-width="5" stroke-linecap="round"/>

  <!-- Wing & Head Chevron (Band 1: Top Apex) -->
  <path fill="#18231e" d="
    M128 36
    L216 86
    C222 90 220 98 214 102
    L200 110
    L128 68
    L56 110
    L42 102
    C36 98 34 90 40 86
    Z
  "/>

  <!-- Thorax / Abdomen Band 2 -->
  <path fill="#18231e" d="
    M128 86
    L190 122
    C195 125 194 131 188 134
    L176 142
    L128 114
    L80 142
    L68 134
    C62 131 61 125 66 122
    Z
  "/>

  <!-- Abdomen Band 3 -->
  <path fill="#18231e" d="
    M128 132
    L168 156
    C172 158 172 164 167 167
    L156 174
    L128 158
    L100 174
    L89 167
    C84 164 84 158 88 156
    Z
  "/>

  <!-- Abdomen Band 4 -->
  <path fill="#18231e" d="
    M128 174
    L148 186
    L140 196
    L128 190
    L116 196
    L108 186
    Z
  "/>

  <!-- Stinger -->
  <polygon points="128,232 138,206 118,206" fill="#18231e"/>
</svg>'''


# ==============================================================================
# CONCEPT B: "The Velocity Scout" (45° Forward-Thrusting Aerodynamic Bee)
# Two sleek overlapping golden wings + streamlined body with negative space stripes.
# Angled at 45 degrees towards top-right (momentum, launch, reaching decision-makers).
# ==============================================================================
def craft_concept_b():
    # Constructed in aligned coordinates, then rotated -45 deg around center (128, 128)
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="b-title">
  <title id="b-title">ReachBee — The Velocity Scout</title>
  <g transform="rotate(-45 128 128)">
    <!-- Forewing (Upper aerodynamic wing) -->
    <path fill="#18231e" d="
      M146 80
      C182 50 216 46 226 56
      C236 66 232 100 202 136
      L146 114
      Z
    "/>

    <!-- Hindwing (Lower aerodynamic wing) -->
    <path fill="#18231e" d="
      M110 80
      C74 50 40 46 30 56
      C20 66 24 100 54 136
      L110 114
      Z
    "/>

    <!-- Antennae -->
    <path d="M120 44 C112 30 102 24 92 26" fill="none" stroke="#18231e" stroke-width="5" stroke-linecap="round"/>
    <circle cx="90" cy="26" r="4.5" fill="#18231e"/>
    <path d="M136 44 C144 30 154 24 164 26" fill="none" stroke="#18231e" stroke-width="5" stroke-linecap="round"/>
    <circle cx="166" cy="26" r="4.5" fill="#18231e"/>

    <!-- Central Fuselage (Continuous path with negative-space stripes via fill-rule) -->
    <path fill="#18231e" fill-rule="evenodd" d="
      M128 38
      C142 38 152 50 152 68
      L152 120
      C152 152 140 190 128 226
      C116 190 104 152 104 120
      L104 68
      C104 50 114 38 128 38
      Z

      M102 124 H154 V138 H102 Z
      M106 152 H150 V166 H106 Z
      M112 180 H144 V194 H112 Z
    "/>
  </g>
</svg>'''


# ==============================================================================
# CONCEPT C: "The Prism Wings" / "Modernist Symmetrical Bee"
# Pure circular arcs and geometric negative space.
# Two magnificent upward-flaring wings flanking a precision striped keystone body.
# Inspired by mid-century modernist icons (Chermayeff & Geismar / Saul Bass).
# ==============================================================================
def craft_concept_c():
    # Pure symmetrical vertical orientation
    # Center 128, 128
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="c-title">
  <title id="c-title">ReachBee — The Prism Wings</title>
  
  <!-- Left Wing (Pure geometric teardrop sweep) -->
  <path fill="#18231e" d="
    M114 94
    C90 62 58 46 40 50
    C26 54 22 68 28 80
    C40 104 74 132 114 138
    Z
  "/>

  <!-- Right Wing (Symmetrical) -->
  <path fill="#18231e" d="
    M142 94
    C166 62 198 46 216 50
    C230 54 234 68 228 80
    C216 104 182 132 142 138
    Z
  "/>

  <!-- Antennae: Minimalist arcs with pips -->
  <path d="M122 46 C116 32 106 24 94 26" fill="none" stroke="#18231e" stroke-width="5" stroke-linecap="round"/>
  <circle cx="92" cy="26" r="4.5" fill="#18231e"/>
  <path d="M134 46 C140 32 150 24 162 26" fill="none" stroke="#18231e" stroke-width="5" stroke-linecap="round"/>
  <circle cx="164" cy="26" r="4.5" fill="#18231e"/>

  <!-- Central Body: Clean capsule with 2 bold curved negative-space stripes -->
  <path fill="#18231e" fill-rule="evenodd" d="
    M128 40
    C142 40 150 52 150 68
    L150 118
    C150 152 140 190 128 226
    C116 190 106 152 106 118
    L106 68
    C106 52 114 40 128 40
    Z

    M104 122 H152 V136 H104 Z
    M108 152 H148 V166 H108 Z
    M114 182 H142 V196 H114 Z
  "/>
</svg>'''

with open("docs/brand/mark_a.svg", "w") as f: f.write(craft_concept_a())
with open("docs/brand/mark_b.svg", "w") as f: f.write(craft_concept_b())
with open("docs/brand/mark_c.svg", "w") as f: f.write(craft_concept_c())

print("Crafted marks A, B, C")
