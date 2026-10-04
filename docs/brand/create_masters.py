import math
import os

# Production SVG definition for Concept A ("The Hex Radar")
# Canvas: 256 x 256, perfectly centered
# All angles mathematically exact.
# 100% filled paths, 0 strokes.

symbol_mono = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="rb-symbol-title">
  <title id="rb-symbol-title">ReachBee Symbol</title>
  <!-- Antennae (30° isometric angle, filled) -->
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

  <!-- Stinger: Terminal Apex Point -->
  <polygon points="128,232 135.5,204 120.5,204" fill="#18231e"/>
</svg>'''

symbol_color = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="rb-symbol-color-title">
  <title id="rb-symbol-color-title">ReachBee Symbol (Brand Color)</title>
  <!-- Antennae: Honey Accent -->
  <circle cx="106" cy="22" r="5" fill="#e8b544"/>
  <circle cx="150" cy="22" r="5" fill="#e8b544"/>
  <polygon points="116,38 119.5,36 108.5,23 105,25" fill="#e8b544"/>
  <polygon points="140,38 136.5,36 147.5,23 151,25" fill="#e8b544"/>

  <!-- Band 1: Deep Ink -->
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

  <!-- Band 2: Warm Honey Accent -->
  <path fill="#e8b544" d="
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

  <!-- Band 3: Deep Ink -->
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

  <!-- Band 4: Warm Honey Accent -->
  <path fill="#e8b544" d="
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

  <!-- Stinger: Deep Ink -->
  <polygon points="128,232 135.5,204 120.5,204" fill="#18231e"/>
</svg>'''

# Micro / small cut for 16px - 24px (slightly bolder gaps and thicker stinger)
symbol_small = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="rb-symbol-small-title">
  <title id="rb-symbol-small-title">ReachBee Symbol (Micro Cut)</title>
  <!-- Antennae: Bolder for 16px readability -->
  <circle cx="104" cy="20" r="7" fill="#18231e"/>
  <circle cx="152" cy="20" r="7" fill="#18231e"/>
  <polygon points="116,38 120,36 107,22 103,24" fill="#18231e"/>
  <polygon points="140,38 136,36 149,22 153,24" fill="#18231e"/>

  <!-- Band 1 -->
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

  <!-- Band 2 -->
  <path fill="#18231e" d="
    M128 86
    L188 121
    C193 124 193 130 188 133
    L176 140
    L128 112
    L80 140
    L68 133
    C63 130 63 124 68 121
    Z
  "/>

  <!-- Band 3 -->
  <path fill="#18231e" d="
    M128 134
    L168 157
    C172 159 172 164 168 166
    L156 172
    L128 156
    L100 172
    L88 166
    C84 164 84 159 88 157
    Z
  "/>

  <!-- Band 4 + Stinger combined for supreme 16px contrast -->
  <polygon points="128,176 150,189 138,232 118,232 106,189" fill="#18231e"/>
</svg>'''

# Master Horizontal Lockup: Symbol + "ReachBee"
font_css = "font-family=\"system-ui,-apple-system,'SF Pro Display',Inter,sans-serif\""
lockup_horizontal = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 256" width="920" height="256" role="img" aria-labelledby="rb-lockup-title">
  <title id="rb-lockup-title">ReachBee Logo</title>
  <g transform="translate(32, 16) scale(0.88)">
    {symbol_color.split(">", 1)[1].rsplit("</svg>", 1)[0]}
  </g>
  <text x="270" y="148" {font_css} font-size="94" font-weight="800" letter-spacing="-0.03em" fill="#18231e">Reach<tspan fill="#e8b544">Bee</tspan></text>
  <text x="274" y="188" {font_css} font-size="22" font-weight="600" letter-spacing="0.22em" fill="#586257">CAREER OUTREACH</text>
</svg>'''

# Master Stacked Lockup (Square / Card format: viewBox 0 0 360 400)
lockup_stacked = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 400" width="360" height="400" role="img" aria-labelledby="rb-stacked-title">
  <title id="rb-stacked-title">ReachBee Logo (Stacked)</title>
  <g transform="translate(68, 36) scale(0.88)">
    {symbol_color.split(">", 1)[1].rsplit("</svg>", 1)[0]}
  </g>
  <text x="180" y="318" {font_css} font-size="52" font-weight="800" letter-spacing="-0.03em" text-anchor="middle" fill="#18231e">Reach<tspan fill="#e8b544">Bee</tspan></text>
  <text x="180" y="348" {font_css} font-size="14" font-weight="600" letter-spacing="0.22em" text-anchor="middle" fill="#586257">CAREER OUTREACH</text>
</svg>'''

os.makedirs("docs/brand/masters", exist_ok=True)
with open("docs/brand/masters/reachbee-symbol.svg", "w") as f: f.write(symbol_mono)
with open("docs/brand/masters/reachbee-symbol-color.svg", "w") as f: f.write(symbol_color)
with open("docs/brand/masters/reachbee-symbol-small.svg", "w") as f: f.write(symbol_small)
with open("docs/brand/masters/reachbee-lockup.svg", "w") as f: f.write(lockup_horizontal)
with open("docs/brand/masters/reachbee-stacked.svg", "w") as f: f.write(lockup_stacked)

print("Created masters in docs/brand/masters/")
