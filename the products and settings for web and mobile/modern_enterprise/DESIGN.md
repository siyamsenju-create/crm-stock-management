---
name: Modern Enterprise
colors:
  surface: '#fcf8ff'
  surface-dim: '#dcd8e5'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2ff'
  surface-container: '#f0ecf9'
  surface-container-high: '#eae6f4'
  surface-container-highest: '#e4e1ee'
  on-surface: '#1b1b24'
  on-surface-variant: '#464555'
  inverse-surface: '#302f39'
  inverse-on-surface: '#f3effc'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006591'
  on-secondary: '#ffffff'
  secondary-container: '#39b8fd'
  on-secondary-container: '#004666'
  tertiary: '#7e3000'
  on-tertiary: '#ffffff'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#89ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#fcf8ff'
  on-background: '#1b1b24'
  surface-variant: '#e4e1ee'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  h1:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
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
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
---

## Brand & Style

This design system is engineered for the high-density information environments of CRM and Inventory management. The brand personality is **utilitarian, precise, and sophisticated**, leaning into a **Modern Corporate** aesthetic that prioritizes functional clarity over decorative flair.

The style draws inspiration from industry-leading tools like Linear and Stripe, utilizing a "Subdued Premium" approach. This is achieved through:
- **High-Information Density:** Optimized layouts that present complex data without overwhelming the user.
- **Glassmorphic Accents:** Strategic use of backdrop blurs on elevated surfaces (modals, dropdowns) to maintain spatial awareness.
- **Precision Engineering:** Strict adherence to an 8px grid and consistent corner radii to evoke a sense of reliability and architectural integrity.

## Colors

The palette is anchored by **Indigo-600 (#4F46E5)** as the primary action color, providing a professional and energetic focal point. The neutral scale is a sophisticated Slate/Gray hybrid that avoids "dead" grays in favor of slightly cool-toned neutrals to maintain a modern feel.

- **Primary:** Reserved for high-intent actions, active states, and critical branding.
- **Surface Colors:** The canvas uses a very light gray (#F9FAFB) to provide contrast against pure white cards and containers.
- **Semantic Colors:** Used strictly for status communication. Success Green for inventory "In Stock," Error Red for "Overdue" or "Out of Stock," and Warning Yellow for "Low Stock" alerts.
- **Glassmorphism:** Transparency is applied at 80% opacity with a 12px backdrop blur for overlays.

## Typography

This design system leverages **Inter** for its exceptional legibility in data-heavy interfaces. The typographic scale is optimized for hierarchy in complex CRM dashboards and inventory manifests.

- **Headlines:** Use a tighter letter-spacing and heavier weights to create distinct visual anchors.
- **Data Labels:** Small, semi-bold labels (12px) are used for table headers and metadata descriptions to maximize vertical space.
- **Body Text:** Standardized at 14px for most CRM interactions to allow for high density, with 16px reserved for long-form content or settings descriptions.
- **Numbers:** Tabular lining should be enabled for all inventory counts and currency values to ensure perfect vertical alignment in data tables.

## Layout & Spacing

The system follows a strict **8px linear scale**. All dimensions, padding, and margins must be multiples of 8 (or 4 for micro-adjustments).

- **Grid:** A 12-column fluid grid is used for the main content area. In CRM record views, a 2/3 and 1/3 split is preferred for the primary activity feed and secondary details sidebar.
- **Inventory Tables:** Use a "Compact" spacing model (8px vertical cell padding) and a "Relaxed" model (16px vertical cell padding) based on user density preferences.
- **Rhythm:** Standardize horizontal sections with 48px (2xl) or 64px (3xl) of vertical breathing room between major content blocks.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layering**. We avoid heavy black shadows in favor of soft, diffused Indigo-tinted shadows that feel integrated into the UI.

1.  **Level 0 (Base):** #F9FAFB. Used for the main background.
2.  **Level 1 (Surface):** White (#FFFFFF). Used for main cards and table containers. 1px stroke (#E5E7EB) is required.
3.  **Level 2 (Floating):** Used for dropdowns and popovers. Includes a subtle shadow: `0 4px 6px -1px rgba(79, 70, 229, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`.
4.  **Level 3 (Overlays):** Used for Modals. Glassmorphic effect (80% white, 12px blur) with a 1px border and a deep, soft shadow.

## Shapes

The shape language balances modern softness with professional structure. 

- **Primary Radius:** 8px (rounded-md) is the standard for buttons, inputs, and small cards.
- **Container Radius:** 12px or 16px is reserved for large dashboard widgets and main modal containers to create a distinct "encapsulated" feel.
- **Inputs:** Must strictly use 8px to ensure they align perfectly with the buttons and dropdown menus.
- **Badges/Chips:** Use a fully rounded (pill) shape for status indicators to differentiate them from interactive buttons.

## Components

### Buttons
- **Primary:** Solid #4F46E5 with white text. 8px radius.
- **Secondary:** White background with 1px #D1D5DB border.
- **Ghost:** No border, Indigo text. Used for secondary actions in tables.

### Inputs & Dropdowns
- **States:** Default (1px Gray-300), Hover (1px Gray-400), Focus (2px Indigo-600 ring).
- **Dropdowns:** Use glassmorphism (backdrop-blur) and 8px radius.

### Data Tables
- **Header:** Gray-50 background, 12px bold uppercase text.
- **Rows:** White background, 1px bottom border (#F3F4F6).
- **Interactions:** Subtle background change (#F9FAFB) on hover.

### Cards
- **Construction:** White background, 1px Gray-200 border, 12px radius.
- **Glass variant:** Use for floating widgets over data—white at 70% opacity with 16px blur.

### Badges
- **Status:** Use light background tints of semantic colors (e.g., Success is light green background with dark green text).

### Skeleton Loaders
- **Style:** Flat, light-gray blocks (#F3F4F6) with a subtle pulse animation. Match the border-radius of the component they are replacing.