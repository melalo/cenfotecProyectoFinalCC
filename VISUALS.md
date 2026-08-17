---
name: Clinical Excellence
colors:
  surface: '#F4F6F8'
  surface-dim: '#dcd9d9'
  surface-bright: '#F4F6F8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0edec'
  surface-container-high: '#ebe7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#44474f'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#747780'
  outline-variant: '#c4c6d0'
  surface-tint: '#435e90'
  primary: '#002554'
  on-primary: '#ffffff'
  primary-container: '#00112d'
  on-primary-container: '#738ec2'
  inverse-primary: '#acc7ff'
  secondary: '#6250a8'
  on-secondary: '#ffffff'
  secondary-container: '#b3a1ff'
  on-secondary-container: '#453289'
  tertiary: '#0f1214'
  on-tertiary: '#ffffff'
  tertiary-container: '#232729'
  on-tertiary-container: '#8b8e90'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e2ff'
  primary-fixed-dim: '#acc7ff'
  on-primary-fixed: '#001a40'
  on-primary-fixed-variant: '#2a4677'
  secondary-fixed: '#e7deff'
  secondary-fixed-dim: '#cbbeff'
  on-secondary-fixed: '#1e0061'
  on-secondary-fixed-variant: '#4a388f'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#F4F6F8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
  med-white: '#FFFFFF'
  border-subtle: '#E2E8F0'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  container-max: 1280px
  stack-xs: 8px
  stack-sm: 16px
  stack-md: 32px
  stack-lg: 64px
---

## Brand & Style

The design system embodies a **Clinical & Professional** aesthetic, transitioning the product from a wellness spa feel to a high-trust medical environment. The target audience includes patients and healthcare providers who prioritize precision, reliability, and security.

The chosen style is **Modern Corporate**, utilizing a structured grid, crisp whites, and a deep, authoritative blue. It balances medical coldness with accessibility through refined typography and generous whitespace. The visual narrative is one of "Professional Clarity"—where every element is positioned to instill confidence in the medical services provided, maintaining a calm but efficient user journey.

## Colors

The palette is anchored by **Deep Navy** (#002554), chosen for its psychological association with medical authority and stability.

- **Primary:** Deep Navy is used for global navigation, primary buttons, and critical headers.
- **Secondary:** A sophisticated **Medical Indigo** (#402D84) is used for secondary actions and subtle brand accents to add depth without compromising professionalism.
- **Tertiary:** A **Cool Slate Tint** (#F4F6F8) serves as the primary surface color for layout sections, providing a crisp contrast to pure white components.
- **Neutral:** A refined **Onyx** (#111111) is reserved for high-readability body text and iconography.
- **Backgrounds:** Pure white is used for interactive cards and input containers to ensure a "sterile" and clean clinical feel.

## Typography

The system continues to use **Manrope** but with a more disciplined application to suit the medical context. The focus is on vertical rhythm and hierarchical clarity.

- **Headlines:** Set in Bold or SemiBold. Use tight tracking for larger headers to maintain a compact, professional look. 
- **Body:** 16px remains the standard for accessibility. Line heights are kept at 1.5x to ensure that dense medical information or booking details remain legible.
- **Labels:** Used for metadata, such as doctor specialties or appointment times, with a slightly increased letter spacing for scannability at small sizes.

## Layout & Spacing

The layout utilizes a **Fluid-Fixed Hybrid Grid**. Content scales fluidly between breakpoints but is constrained by a 1280px maximum width to ensure readability on wide displays.

- **Desktop:** 12-column grid with 24px gutters.
- **Tablet:** 8-column grid with 24px gutters.
- **Mobile:** 4-column grid with 16px margins.
- **Philosophy:** Spacing follows a 4px base unit. Component internal padding should be consistent (typically 16px or 24px) to create a structured, tabular feel that mimics professional medical forms and charts.

## Elevation & Depth

This design system uses **Low-Contrast Outlines** and **Tonal Layers** rather than heavy shadows to convey depth, reinforcing a flat, modern, and clinical aesthetic.

- **Layer 0 (Background):** Tertiary (#F4F6F8) for the main canvas.
- **Layer 1 (Containers):** Pure White surfaces for cards and inputs, defined by a 1px border (#E2E8F0).
- **Interactive State:** Hovering over a card should trigger a very subtle, sharp shadow (Blur: 8px, Y: 2px, Opacity: 5%) or a change in border color to the Secondary Indigo.
- **Modals:** Use a higher elevation with a soft scrim (darkened overlay) to focus the user's attention on critical booking tasks.

## Shapes

The shape language is **Soft** but geometric. To align with a professional medical aesthetic, the overly rounded wellness corners have been sharpened to provide a more institutional and precise appearance.

- **Standard Elements:** Buttons and form fields use 4px (`0.25rem`) corners.
- **Cards/Modals:** Containers use 8px (`0.5rem`) or 12px (`0.75rem`) to remain approachable without appearing too "casual."
- **Data Points:** Status badges and tags utilize a slight rounding (4px) to maintain the geometric discipline.

## Components

- **Buttons:** Primary buttons are solid Deep Navy (#002554) with white text. They should appear sturdy and impactful. Secondary buttons use a 1px Medical Indigo (#402D84) border with indigo text.
- **Input Fields:** Crisp white background with a 1px Slate border. On focus, the border shifts to Deep Navy. Labels should always be visible (not floating) to ensure accessibility.
- **Cards:** Medical professional or service cards should feature high-contrast text and clear alignment. Avoid excessive drop shadows; use the Slate-colored background to make white cards pop.
- **Appointment Chips:** Rectangular with minimal rounding. Available slots are white with an Indigo border; selected slots are solid Indigo.
- **Lists:** Data-heavy lists (like appointment history) should use subtle 1px horizontal dividers rather than boxes to maintain a clean, "report-style" look.
- **Status Indicators:** Use standardized colors for medical urgency or status (e.g., success green, alert amber) but keep the icons and fonts consistent with the Manrope typeface.