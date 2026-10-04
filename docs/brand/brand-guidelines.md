# ReachBee — Brand & Logo Guidelines

> Official identity reference and usage guidelines for the ReachBee career outreach workspace.

---

## 1. The Logo: "The Hex Radar"

The ReachBee logo merges two foundational concepts into a singular geometric identifier:
- **The Honeycomb Bee:** An industrious scout representing diligence, precision, and community intelligence (faceted head crown, winged shoulders, striped abdomen, and anchoring stinger).
- **The Outreach Radar:** Concentric upward-reaching chevron waves symbolizing purposeful direct reach and forward career trajectory.

### Asset Manifest

| Variant | Purpose | Master Path |
|---|---|---|
| **Master Color Symbol** | Two-color brand mark (Ink + Warm Honey) | [`docs/brand/masters/reachbee-symbol-color.svg`](file:///Users/jarvis/reachbee/docs/brand/masters/reachbee-symbol-color.svg) |
| **Monochrome Symbol** | Solid dark mark for light single-color surfaces | [`docs/brand/masters/reachbee-symbol.svg`](file:///Users/jarvis/reachbee/docs/brand/masters/reachbee-symbol.svg) |
| **Micro Cut Symbol** | Optically tuned for 16–24 px favicon & status indicators | [`docs/brand/masters/reachbee-symbol-small.svg`](file:///Users/jarvis/reachbee/docs/brand/masters/reachbee-symbol-small.svg) |
| **Horizontal Lockup** | Primary header, navigation, and marketing lockup | [`docs/brand/masters/reachbee-lockup.svg`](file:///Users/jarvis/reachbee/docs/brand/masters/reachbee-lockup.svg) |
| **Stacked Lockup** | Square cards, packaging, and hero presentations | [`docs/brand/masters/reachbee-stacked.svg`](file:///Users/jarvis/reachbee/docs/brand/masters/reachbee-stacked.svg) |
| **Web Icons Suite** | Favicon.ico, SVG, Apple Touch, PWA manifests | [`public/`](file:///Users/jarvis/reachbee/public/) |

---

## 2. Clear Space

Always maintain a clear exclusion zone around the logo equal to **1X**, where **X** is defined as the height of the terminal stinger (28 units on the master 256 canvas, or ~15% of total height). 
No other text, graphic elements, or borders should intrude into this zone.

---

## 3. Minimum Sizing

| Format | Minimum Digital Size | Minimum Print Size | Notes |
|---|---|---|---|
| **Horizontal Lockup** | 96 px width | 24 mm | Preserves sub-tagline legibility |
| **Standard Symbol** | 32 px width | 8 mm | App icons, headers, buttons |
| **Micro / Favicon Cut** | 16 px width | 4 mm | Uses [`public/favicon.svg`](file:///Users/jarvis/reachbee/public/favicon.svg) with boosted contrast |

---

## 4. Color Palette

The ReachBee palette is grounded in warm paper tones, deep mineral ink, and amber honey accents:

| Token | Name | HEX | RGB | Use Case |
|---|---|---|---|---|
| `--ab-ink` | Deep Ink | `#18231e` | `24, 35, 30` | Primary logo silhouettes, headings, text |
| `--ab-honey` | Warm Honey | `#e8b544` | `232, 181, 68` | Secondary logo chevron accents, primary CTAs |
| `--ab-honey-deep` | Deep Honey | `#c8932a` | `200, 147, 42` | Borders, hover states, badges |
| `--ab-canvas` | Warm Canvas | `#f7f4ec` | `247, 244, 236` | Primary background, neutral containers |
| `--ab-surface` | Pure Surface | `#fffdf7` | `255, 253, 247` | Cards, elevated dialogs, panels |

### Approved Color Pairings
1. **Brand Multi-Color on Light Canvas:** Ink (`#18231e`) body with Honey (`#e8b544`) accents on Canvas (`#f7f4ec`) or White.
2. **Reversed on Dark Ink (`#18231e`):** Surface White (`#fffdf7`) body with Honey (`#e8b544`) accents.
3. **Monochrome Mono:** Solid black on white, or pure white on dark photo backgrounds.

---

## 5. Typography

- **Display / Brand Lockups:** Custom geometric sans-serif based on *Manrope* / *SF Pro Display* / *Inter* with `-0.03em` tracking.
- **UI & Body:** *Manrope* (`--font-manrope`) for clear tabular legibility and high scanability.
- **Editorial Accent:** *Fraunces* (`--font-fraunces`) for subtle human warmth on marketing headlines.

---

## 6. Prohibited Usage ("Don'ts")

- **Do NOT** distort, stretch, or rotate the mark from its 30°/150° isometric orientation.
- **Do NOT** apply dropshadows, glows, bevels, or unapproved gradients.
- **Do NOT** place the dark ink logo on low-contrast dark backgrounds without using the reversed white/surface variant.
- **Do NOT** alter the spacing or proportion between the symbol and the wordmark in lockups.
- **Do NOT** alter the chevron order or remove the antennae pips.
