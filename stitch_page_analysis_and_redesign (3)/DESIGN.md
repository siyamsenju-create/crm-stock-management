---
name: Insight Mobile
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#454555'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#767687'
  outline-variant: '#c6c5d8'
  surface-tint: '#4048e3'
  primary: '#0605bf'
  on-primary: '#ffffff'
  primary-container: '#2d34d3'
  on-primary-container: '#b7bbff'
  inverse-primary: '#bfc2ff'
  secondary: '#4648d4'
  on-secondary: '#ffffff'
  secondary-container: '#6063ee'
  on-secondary-container: '#fffbff'
  tertiary: '#00402a'
  on-tertiary: '#ffffff'
  tertiary-container: '#005a3c'
  on-tertiary-container: '#46d89d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e0e0ff'
  primary-fixed-dim: '#bfc2ff'
  on-primary-fixed: '#00006e'
  on-primary-fixed-variant: '#2228cc'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  display-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.02em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  margin-mobile: 1.25rem
  gutter-mobile: 1rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 1.5rem
---

## Brand & Style

This design system is built for clarity and speed, transforming complex business intelligence into actionable mobile insights. The brand personality is **Professional, Analytical, and Empowering**. It utilizes a **Corporate Modern** style with subtle **Glassmorphism** cues to maintain a lightweight feel on mobile devices.

The UI targets executives and field managers who need to digest data quickly. By using the distinctive blue and purple palette of the parent brand, it maintains a sense of reliability while introducing a fresh, software-oriented aesthetic. The visual mood is clean and structured, prioritizing data legibility above all else through high-contrast typography and a generous but purposeful use of white space.

## Colors

The color strategy uses the brand's signature **Deep Blue** as the primary action color, ensuring strong contrast against white backgrounds. The **Vibrant Purple** acts as a secondary accent for categorization and secondary data series. 

- **Primary (#2D34D3):** Used for primary buttons, active navigation states, and key data trend lines.
- **Secondary (#6366F1):** Used for supporting visualizations and toggle states.
- **Tertiary/Success (#10B981):** Critical for BI apps to denote positive growth and meeting targets.
- **Neutral (#1E293B):** A slate-based neutral palette ensures that text remains sharp and highly readable without the harshness of pure black.

Backgrounds utilize a very light grey (`#F8FAFC`) to differentiate card surfaces from the main canvas.

## Typography

The system employs a multi-font approach to balance friendliness with technical precision. **Plus Jakarta Sans** provides a warm, modern feel for headings and large metrics. **Inter** is used for body text to ensure maximum legibility at small sizes. **JetBrains Mono** is introduced for small labels and metadata to lean into the "intelligence" and "data" aspect of the app.

High-contrast weight distribution is key; headlines and primary metrics use Bold (700) weights to stand out immediately, while supporting text stays in Regular (400) to create a clear information hierarchy.

## Layout & Spacing

The layout follows a **Fluid Grid** model optimized for portrait mobile viewports. It uses a base 4px/8px scaling system. 

- **Outer Margins:** A fixed 20px (1.25rem) margin on the left and right ensures content doesn't feel cramped against the screen edges.
- **Vertical Rhythm:** Components are stacked using "Stack" units. Metrics within a card use `stack-sm`, while distinct cards use `stack-lg`.
- **Card Padding:** All data containers utilize a consistent 16px internal padding to ensure charts and text have room to breathe.

## Elevation & Depth

This design system uses **Tonal Layers** combined with **Ambient Shadows** to create a sense of organized depth.

- **Level 0 (Canvas):** The base background layer in light grey.
- **Level 1 (Cards):** White surfaces with a very soft, diffused shadow (0px 4px 20px rgba(0,0,0,0.05)). This is the primary container for charts and metrics.
- **Level 2 (Modals/Overlays):** Elevated surfaces with a stronger shadow and a subtle 1px border in a light neutral tone to define edges.

Backdrop blurs (10px - 20px) are used exclusively for navigation bars and sticky headers to maintain context of the scrolled data underneath.

## Shapes

To achieve the "friendly professional" feel, the system uses a **Rounded (2)** shape language. 

Standard components like buttons and input fields use a `0.5rem` radius. Main data cards and containers utilize `rounded-lg` (1rem) to create a distinct, modern silhouette that feels approachable. Small indicators like status tags or "chips" use a full pill-shape to contrast against the more structured rectangular cards.

## Components

### Buttons & Inputs
- **Primary Action:** Solid Blue background with white text and `rounded-md` corners.
- **Secondary Action:** Ghost style with a Blue 1px border or a soft Purple tinted background.
- **Input Fields:** Light grey fill with a subtle 1px border that turns Blue on focus. Labels sit above the field in `label-caps`.

### Data Cards
- Every metric should be housed in a card. 
- **Top Section:** Icon (top left) and Percentage Change (top right).
- **Middle Section:** The "Hero" metric in `data-lg`.
- **Bottom Section:** A descriptive label in `label-caps`.

### Chips & Tags
- Used for filtering (e.g., "Monthly", "Weekly"). Active states should use the primary blue, while inactive states use a subtle grey stroke.

### Lists
- Transactional data lists should have high horizontal padding and a subtle separator line. Each row should have a clear "Value" on the right in semi-bold weight.

### Progress Gauges
- Linear or circular progress bars should use a 8px stroke width with rounded caps to match the overall shape language.