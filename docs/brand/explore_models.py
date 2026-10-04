import math

# Model 1: Upward Soaring Geometric Bee (Refined, uplifting wings, unified body)
def generate_model_1():
    # Wings sweep UPWARDS at 35 degrees, body is centered, clean stripes
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="m1-title">
  <title id="m1-title">Soaring Geometric Bee</title>
  <!-- Wings (Swept Upward and Outward) -->
  <!-- Left Wing -->
  <path fill="#18231e" d="M112 110 C90 60 55 42 36 44 C28 45 24 53 28 62 C38 86 64 122 104 136 Z"/>
  <!-- Right Wing -->
  <path fill="#18231e" d="M144 110 C166 60 201 42 220 44 C228 45 232 53 228 62 C218 86 192 122 152 136 Z"/>
  
  <!-- Central Bee Body: Compound path with negative-space stripes via fill-rule evenodd -->
  <!-- Outer capsule: Head at (128, 48), thorax, abdomen tapering to stinger at (128, 224) -->
  <path fill="#18231e" fill-rule="evenodd" d="
    M128 44
    C142 44 154 56 154 72
    C154 84 158 106 158 132
    C158 168 148 198 128 224
    C108 198 98 168 98 132
    C98 106 102 84 102 72
    C102 56 114 44 128 44 Z
    
    M104 118 L152 118 L150 130 L106 130 Z
    M108 144 L148 144 L144 156 L112 156 Z
    M115 170 L141 170 L136 182 L120 182 Z
  "/>
  <!-- Antennae: clean minimal arcs -->
  <path d="M122 46 C116 32 104 26 94 28" fill="none" stroke="#18231e" stroke-width="7" stroke-linecap="round"/>
  <path d="M134 46 C140 32 152 26 162 28" fill="none" stroke="#18231e" stroke-width="7" stroke-linecap="round"/>
</svg>'''

# Model 2: The Hexagon Vanguard (Isometric faceted bee)
def generate_model_2():
    # Hexagonal geometry with 30/60 degree precision
    # Top crown, two faceted wings, segmented abdomen
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="m2-title">
  <title id="m2-title">The Hexagon Vanguard</title>
  <!-- Head (Triangle / Crown) -->
  <polygon points="128,26 150,60 106,60" fill="#18231e"/>
  <!-- Antenna pips -->
  <circle cx="100" cy="22" r="6" fill="#18231e"/>
  <circle cx="156" cy="22" r="6" fill="#18231e"/>
  <line x1="112" y1="38" x2="103" y2="26" stroke="#18231e" stroke-width="5" stroke-linecap="round"/>
  <line x1="144" y1="38" x2="153" y2="26" stroke="#18231e" stroke-width="5" stroke-linecap="round"/>

  <!-- Wings: Sharp geometric hexagonal wings angled up at 30 deg -->
  <!-- Left Wing -->
  <polygon points="98,72 32,54 38,106 98,124" fill="#18231e"/>
  <!-- Right Wing -->
  <polygon points="158,72 224,54 218,106 158,124" fill="#18231e"/>

  <!-- Body: Segmented Chevron Shields -->
  <!-- Thorax -->
  <polygon points="128,72 150,84 150,116 128,128 106,116 106,84" fill="#18231e"/>
  <!-- Abdomen Segment 1 -->
  <polygon points="128,138 146,148 146,164 128,174 110,164 110,148" fill="#18231e"/>
  <!-- Abdomen Segment 2 -->
  <polygon points="128,184 142,192 142,204 128,212 114,204 114,192" fill="#18231e"/>
  <!-- Stinger -->
  <polygon points="128,236 134,222 122,222" fill="#18231e"/>
</svg>'''

# Model 3: The Monogram 'B' (Modernist Bee-in-Profile)
def generate_model_3():
    # Capital 'B' formed by a bee body and two outstretched rounded wings
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="m3-title">
  <title id="m3-title">The Monogram B</title>
  <!-- Vertical Spine / Bee Body on Left with stripes -->
  <!-- Capsule body -->
  <path fill="#18231e" fill-rule="evenodd" d="
    M72 44
    C84 44 94 54 94 66
    L94 190
    C94 202 84 212 72 212
    C60 212 50 202 50 190
    L50 66
    C50 54 60 44 72 44 Z
    M50 102 L94 102 L94 114 L50 114 Z
    M50 134 L94 134 L94 146 L50 146 Z
    M50 166 L94 166 L94 178 L50 178 Z
  "/>
  <!-- Upper Wing (top loop of B) -->
  <path fill="#18231e" d="M106 60 H154 C178 60 196 76 196 98 C196 120 178 126 154 126 H106 V60 Z M124 78 V108 H152 C164 108 174 102 174 93 C174 84 164 78 152 78 H124 Z"/>
  <!-- Lower Wing (bottom loop of B) -->
  <path fill="#18231e" d="M106 130 H160 C186 130 206 148 206 172 C206 196 186 206 160 206 H106 V130 Z M124 148 V188 H158 C172 188 184 180 184 168 C184 156 172 148 158 148 H124 Z"/>
  <!-- Subtle Antenna at top -->
  <path d="M72 44 C72 30 84 22 96 24" fill="none" stroke="#18231e" stroke-width="7" stroke-linecap="round"/>
</svg>'''

# Model 4: The Minimalist Velocity Dart (45-degree angle flight bee / arrow)
def generate_model_4():
    # 45 degree forward thrust: Arrow / Bee fusion
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="m4-title">
  <title id="m4-title">The Velocity Bee</title>
  <!-- Main fuselage (body angled at 45 deg) -->
  <!-- Top-right apex at (216, 40), bottom-left stinger at (40, 216) -->
  <g transform="rotate(45 128 128)">
    <!-- Central Bee / Rocket Body -->
    <path fill="#18231e" fill-rule="evenodd" d="
      M128 34
      L146 72
      L146 168
      L128 222
      L110 168
      L110 72
      Z
      M110 100 L146 100 L146 114 L110 114 Z
      M110 130 L146 130 L146 144 L110 144 Z
    "/>
    <!-- Delta Wings (Swept Forward-Outward) -->
    <!-- Left Wing -->
    <path fill="#18231e" d="M98 78 L34 108 C26 112 26 122 34 126 L98 146 Z"/>
    <!-- Right Wing -->
    <path fill="#18231e" d="M158 78 L222 108 C230 112 230 122 222 126 L158 146 Z"/>
    <!-- Antennae / Forward Sensor Dots -->
    <circle cx="118" cy="24" r="5" fill="#18231e"/>
    <circle cx="138" cy="24" r="5" fill="#18231e"/>
  </g>
</svg>'''

models = [("m1", generate_model_1()), ("m2", generate_model_2()), ("m3", generate_model_3()), ("m4", generate_model_4())]

for name, svg in models:
    path = f"docs/brand/{name}.svg"
    with open(path, "w") as f:
        f.write(svg)
    print(f"Wrote {path}")
