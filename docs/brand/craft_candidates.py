import math

# Candidate A: "The Hex Vanguard" / "Chevron Honeycomb Bee"
# Constructed from 3 stacked forward chevrons forming a bee + forward arrow
def candidate_a():
    # An aerodynamic soaring bee where wings + body + stinger form an upward arrow
    # Total width ~ 180, height ~ 200, centered at 128, 125
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="cand-a-title">
  <title id="cand-a-title">ReachBee — Hex Vanguard</title>
  <!-- Wings (Geometric Swept Diamond Wings) -->
  <path fill="#18231e" d="M128 76 L62 48 C52 44 42 50 40 60 C38 68 42 76 50 80 L114 116 Z"/>
  <path fill="#18231e" d="M128 76 L194 48 C204 44 214 50 216 60 C218 68 214 76 206 80 L142 116 Z"/>
  
  <!-- Central Body (Thorax + Head) -->
  <path fill="#18231e" d="M128 34 C138 34 146 42 146 52 L146 112 C146 118 138 122 128 122 C118 122 110 118 110 112 L110 52 C110 42 118 34 128 34 Z"/>
  
  <!-- Antennae -->
  <circle cx="112" cy="24" r="5" fill="#18231e"/>
  <circle cx="144" cy="24" r="5" fill="#18231e"/>
  <path d="M122 36 L114 27" stroke="#18231e" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M134 36 L142 27" stroke="#18231e" stroke-width="4.5" stroke-linecap="round"/>
  
  <!-- Abdomen: Segment 1 (Upper stripe) -->
  <path fill="#18231e" d="M106 132 C106 130 114 128 128 128 C142 128 150 130 150 132 L147 154 C147 156 139 158 128 158 C117 158 109 156 109 154 Z"/>
  
  <!-- Abdomen: Segment 2 (Mid stripe) -->
  <path fill="#18231e" d="M111 166 C111 164 118 163 128 163 C138 163 145 164 145 166 L141 186 C141 188 135 189 128 189 C121 189 115 188 115 186 Z"/>

  <!-- Abdomen: Segment 3 (Stinger / Tail) -->
  <path fill="#18231e" d="M117 196 C117 195 122 194 128 194 C134 194 139 195 139 196 L128 226 Z"/>
</svg>'''

# Candidate B: "The Honeycomb 'B'" (Monogram Letter B + Bee Wings)
# A bold modernist capital B where the two loops are faceted hexagon wings / comb cells
def candidate_b():
    # Left stem: solid architectural pillar (x=48 to x=84, y=40 to y=216)
    # Right loops: Two hexagonal chambers forming the B
    # Waist notch in middle
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="cand-b-title">
  <title id="cand-b-title">ReachBee — Honeycomb Monogram B</title>
  <!-- Architectural B with Hexagonal / Wing Curvature -->
  <path fill="#18231e" fill-rule="evenodd" d="
    M52 40
    H146
    C176 40 198 58 198 86
    C198 106 186 120 168 126
    C192 132 206 150 206 172
    C206 200 180 216 148 216
    H52
    Z
    
    M88 72
    V112
    H140
    C156 112 166 102 166 92
    C166 82 156 72 140 72
    H88
    Z
    
    M88 142
    V184
    H144
    C162 184 174 174 174 163
    C174 152 162 142 144 142
    H88
    Z
  "/>
  <!-- Wing / Flight cut in the B: diagonal feather cuts on the spine that turn it into bee stripes -->
  <polygon points="46,104 58,104 58,124 46,124" fill="#ffffff"/>
  <polygon points="46,134 58,134 58,154 46,154" fill="#ffffff"/>
</svg>'''

# Candidate C: "The Golden Apex" / "The Minimalist Orbit Bee"
# Pure circular geometry: two intersecting circular arc wings + central capsule with negative stripes
def candidate_c():
    # Pure geometric construction
    # Center 128, 128
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="cand-c-title">
  <title id="cand-c-title">ReachBee — Minimalist Apex Bee</title>
  <!-- Symmetrical Circular Arc Wings -->
  <!-- Left Wing -->
  <path fill="#18231e" d="M120 104 C100 64 64 48 44 54 C32 58 28 72 38 82 C56 100 88 124 116 132 Z"/>
  <!-- Right Wing -->
  <path fill="#18231e" d="M136 104 C156 64 192 48 212 54 C224 58 228 72 218 82 C200 100 168 124 140 132 Z"/>
  
  <!-- Central Body: Unified droplet / capsule with 2 negative cuts -->
  <!-- Outer Body: (128, 44) to (128, 220) -->
  <path fill="#18231e" fill-rule="evenodd" d="
    M128 42
    C144 42 154 56 154 74
    L154 136
    C154 168 142 198 128 220
    C114 198 102 168 102 136
    L102 74
    C102 56 112 42 128 42 Z
    
    M98 114 H158 V126 H98 Z
    M104 142 H152 V154 H104 Z
    M112 170 H144 V182 H112 Z
  "/>
  
  <!-- Minimalist Head Pips / Antennae -->
  <circle cx="114" cy="30" r="5" fill="#18231e"/>
  <circle cx="142" cy="30" r="5" fill="#18231e"/>
</svg>'''

with open("docs/brand/cand_a.svg", "w") as f: f.write(candidate_a())
with open("docs/brand/cand_b.svg", "w") as f: f.write(candidate_b())
with open("docs/brand/cand_c.svg", "w") as f: f.write(candidate_c())
print("Wrote candidate SVGs")
