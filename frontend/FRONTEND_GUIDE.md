# Athena Frontend — Developer Guide

A detailed reference for where to make changes across the landing page.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Getting Started](#getting-started)
- [File Map](#file-map)
- [Page Section Order](#page-section-order)
- [Theme & Colors](#theme--colors)
- [Fonts](#fonts)
- [Logo](#logo)
- [Navigation Links](#navigation-links)
- [Hero Section](#hero-section)
- [Pipeline Section](#pipeline-section)
- [Pipeline Animation](#pipeline-animation)
- [Platform Section](#platform-section)
- [How It Works Section](#how-it-works-section)
- [About Section](#about-section)
- [Call-to-Action Section](#call-to-action-section)
- [Footer](#footer)
- [Adding a New Section](#adding-a-new-section)
- [Icons](#icons)
- [Mobile Responsiveness](#mobile-responsiveness)
- [Custom CSS Utilities](#custom-css-utilities)
- [Troubleshooting](#troubleshooting)

---

## Project Overview

| Detail       | Value                                          |
| ------------ | ---------------------------------------------- |
| Framework    | React 19 + TypeScript                          |
| Bundler      | Vite 8                                         |
| Styling      | Tailwind CSS v4 (`@theme` directive, no config) |
| Animations   | Framer Motion                                  |
| Icons        | Lucide React (+ custom GitHub SVG)             |

## Getting Started

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173)
npx vite --host      # Start dev server accessible on local network
npm run build        # Type-check + production build
npm run lint         # Run ESLint
npx tsc --noEmit     # Type-check only
```

If changes aren't reflecting, clear the Vite cache:

```bash
npx vite --force
```

---

## File Map

```
src/
├── App.tsx                            # Root layout — controls section order
├── main.tsx                           # Entry point (React StrictMode)
├── index.css                          # Theme tokens, fonts, custom utilities
└── components/
    ├── Navbar.tsx                      # Fixed top navigation bar
    ├── Hero.tsx                        # Hero section (heading, CTAs, stats)
    ├── Models.tsx                      # "The Pipeline" section (stage cards)
    ├── PipelineVisualization.tsx       # Animated pipeline progress demo
    ├── Platform.tsx                    # Dashboard mockup + capability cards
    ├── Research.tsx                    # "How It Works" 5-step cards
    ├── Company.tsx                     # "About" section (highlights + tech stack)
    ├── CTA.tsx                        # Call-to-action with install command
    └── Footer.tsx                     # Footer with link columns

public/
├── logo.svg                           # Athena logo
├── favicon.svg                        # Browser tab icon
└── icons.svg                          # Icon sprite (if used)
```

---

## Page Section Order

Controlled in `src/App.tsx`. To reorder, add, or remove sections, edit the JSX:

```tsx
// src/App.tsx
<Navbar />       {/* Always on top, fixed position */}
<Hero />         {/* Full-screen hero */}
<Pipeline />     {/* "The Pipeline" — from Models.tsx */}
<Platform />     {/* Dashboard preview + capabilities */}
<HowItWorks />   {/* 5-step flow — from Research.tsx */}
<About />        {/* Why Athena — from Company.tsx */}
<CTA />          {/* Final call-to-action */}
<Footer />       {/* Site footer */}
```

---

## Theme & Colors

**File:** `src/index.css` — lines 3–20

All colors are defined as CSS custom properties under `@theme`. Tailwind auto-generates classes from these (e.g., `--color-athena-amber` → `bg-athena-amber`, `text-athena-amber`, `border-athena-amber`).

| Token                      | Current Value | Used For                         |
| -------------------------- | ------------- | -------------------------------- |
| `--color-athena-dark`      | `#0a0a0f`     | Page background                  |
| `--color-athena-darker`    | `#06060a`     | Deeper backgrounds (footer, cards) |
| `--color-athena-card`      | `#111118`     | Card backgrounds                 |
| `--color-athena-border`    | `#1e1e2a`     | Borders, dividers                |
| `--color-athena-amber`     | `#0ea5e9`     | **Primary accent** (buttons, highlights) |
| `--color-athena-amber-light` | `#38bdf8`   | Primary hover state              |
| `--color-athena-red`       | `#ef4444`     | Stage 3 color, gradients         |
| `--color-athena-orange`    | `#f97316`     | Stage 2 color                    |
| `--color-athena-cyan`      | `#22d3ee`     | Stage 5 color                    |
| `--color-athena-emerald`   | `#34d399`     | Success states, terminal prompt  |
| `--color-athena-purple`    | `#a78bfa`     | Stage 4 color                    |
| `--color-athena-text`      | `#94a3b8`     | Body text                        |
| `--color-athena-text-bright` | `#e2e8f0`   | Emphasized text                  |

> **Note:** The token is named `amber` for legacy reasons but the actual color is sea blue (`#0ea5e9`). To change the primary accent color, update `--color-athena-amber` and `--color-athena-amber-light`.

### To change the primary accent color:

1. Update `--color-athena-amber` and `--color-athena-amber-light` in `src/index.css`
2. Update the hardcoded hex values in the utility classes (same file, lines 47–76):
   - `.text-gradient` — line 49
   - `.text-gradient-hero` — line 56
   - `.glow` — line 63
   - `.grid-bg` — lines 68–69
   - `.molecule-glow` — line 74
   - `::selection` — line 42

---

## Fonts

**File:** `src/index.css` — lines 18–19

| Token          | Current Value                                  | Used For     |
| -------------- | ---------------------------------------------- | ------------ |
| `--font-sans`  | `"Inter", system-ui, -apple-system, sans-serif` | Body text    |
| `--font-mono`  | `"JetBrains Mono", ui-monospace, monospace`     | Code, terminal |

Fonts are loaded via the browser's system font stack. To use a web font, add the `<link>` or `@import` to `index.html` and update the token.

---

## Logo

**File:** `public/logo.svg`

The logo is referenced as `<img src="/logo.svg">` in two places:

| Location             | File                    | Line |
| -------------------- | ----------------------- | ---- |
| Navbar               | `src/components/Navbar.tsx`  | 29   |
| Footer               | `src/components/Footer.tsx`  | 44   |

To change the logo, replace `public/logo.svg` with your new file (keep the same filename), or update the `src` path in both components.

The brand name text ("athena.") appears next to the logo:
- **Navbar:** `Navbar.tsx` line 30
- **Footer:** `Footer.tsx` line 45

---

## Navigation Links

**File:** `src/components/Navbar.tsx` — lines 13–19

```tsx
const navLinks = [
  { label: 'Pipeline', href: '#pipeline' },
  { label: 'Platform', href: '#platform' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
  { label: 'Docs', href: '#', external: false },
];
```

- Add/remove items from this array to update both desktop and mobile menus
- Set `external: true` to open in a new tab
- The `href` must match the `id` on the target `<section>` (e.g., `#pipeline` → `<section id="pipeline">`)

### Navbar CTA buttons (desktop):
- **GitHub button:** `Navbar.tsx` lines 50–56
- **Get Started button:** `Navbar.tsx` lines 57–62

### Navbar CTA buttons (mobile):
- **GitHub button:** `Navbar.tsx` lines 96–102
- **Get Started button:** `Navbar.tsx` lines 103–108

---

## Hero Section

**File:** `src/components/Hero.tsx`

| Element              | Lines   | What to Edit                              |
| -------------------- | ------- | ----------------------------------------- |
| Badge pill           | 21–34   | Badge text, link destination (`href`)     |
| Main heading         | 37–44   | Headline text, font size classes          |
| Subtitle             | 47–55   | Description paragraph                     |
| Primary CTA button   | 64–69   | "Start a pipeline" — text, `href`, color  |
| GitHub CTA button    | 71–77   | "View on GitHub" — text, `href`           |
| Stats bar            | 81–103  | Stat values and labels (4 items)          |

### To change a stat:

Edit the relevant `<div className="text-center">` block (lines 87–102). Each stat has:
```tsx
<div className="text-lg md:text-2xl font-bold text-white">5 Stages</div>   {/* Value */}
<div className="mt-0.5 md:mt-1 text-xs md:text-sm text-athena-text">Full pipeline</div>  {/* Label */}
```

---

## Pipeline Section

**File:** `src/components/Models.tsx`

### Section header:
- **Subtitle tag:** line 116–118 ("The Pipeline")
- **Heading:** line 119–121 ("Five stages. Zero guesswork.")
- **Description:** lines 122–125

### Pipeline stage cards (desktop only — hidden on mobile):
- **Stage data:** lines 5–86 — the `stages` array
- Each stage has: `name`, `badge`, `description`, `features` (array of 4), `icon`, `color`, `gradient`, `borderColor`
- **Top row (3 cards):** lines 140–176
- **Bottom row (2 cards):** lines 177–213

### To add/remove a pipeline stage:

1. Edit the `stages` array (lines 5–86)
2. Update `colorMap` (lines 88–94) and `bgColorMap` (lines 96–102) if adding a new color
3. Also update the matching stage in `PipelineVisualization.tsx` (see below)

### To change a stage icon:

Import the new icon from `lucide-react` (line 2) and set it in the stage's `icon` field.

---

## Pipeline Animation

**File:** `src/components/PipelineVisualization.tsx`

### Stage labels and colors:
- **Stages array:** lines 4–10
- **Terminal output lines:** lines 12–18

### Animation timing:
- `STAGE_MS = 2500` — time each stage stays active (line 20)
- `DONE_HOLD_MS = 3000` — pause after all stages complete (line 21)
- `RESET_MS = 1500` — pause before restarting the loop (line 22)

### Terminal command shown:
- Line 183: `athena run --dataset chembl_egfr --task classification --benchmark`

### Completion message:
- Line 208: `Pipeline complete — results saved to output/egfr_benchmark.json`

### Desktop vs Mobile:
- **Desktop (horizontal):** lines 55–133 — progress track + circular nodes
- **Mobile (vertical):** lines 136–177 — simple vertical list with colored circles
- **Terminal output:** lines 179–212 — hidden on mobile (`hidden md:block`)

---

## Platform Section

**File:** `src/components/Platform.tsx`

### Section header:
- **Subtitle tag:** line 53 ("Platform")
- **Heading:** line 56 ("Your drug discovery command center")
- **Description:** lines 59–61

### Dashboard mockup (desktop only — hidden on mobile):
- **Window title:** line 80 ("Athena — EGFR Inhibitor Campaign")
- **Experiment sidebar list:** lines 90–95 — array of `{ name, status }`
- **Experiment detail header:** lines 122–125
- **Model leaderboard data:** lines 131–137 — array of `{ model, auroc, auprc, status }`
- **Progress bar label:** line 172 ("Training (3/5 stages)")
- **Progress bar width:** line 175 — `w-3/5` class

### Capability cards:
- **Capabilities data:** lines 4–37 — array of `{ icon, title, description, color, bgColor }`
- **Card grid:** lines 186–203

### To add a new capability card:

Add an entry to the `capabilities` array (lines 4–37) with `icon` (lucide import), `title`, `description`, `color` (text class), and `bgColor` (background class).

---

## How It Works Section

**File:** `src/components/Research.tsx`

### Section header:
- **Subtitle tag:** line 58 ("How It Works")
- **Heading:** line 61 ("From target to benchmark in minutes")
- **Description:** lines 64–66

### Step cards:
- **Steps data:** lines 4–45 — array of `{ step, title, description, color, borderColor }`
- **Card grid:** line 71 — `grid-cols-1 sm:grid-cols-2 md:grid-cols-5`

### Pro tip box:
- **Tip text:** lines 104–109
- **CLI command shown:** line 107 (`athena run --auto`)

### To add/remove a step:

Edit the `steps` array. The grid is currently set to 5 columns on desktop. If you change the number of steps, update the `md:grid-cols-5` class on line 71.

---

## About Section

**File:** `src/components/Company.tsx`

### Section header:
- **Subtitle tag:** line 53 ("About")
- **Heading:** line 56 ("Why Athena?")
- **Description:** lines 59–61

### Highlight cards:
- **Highlights data:** lines 4–25 — array of `{ icon, title, description }`
- **Card grid:** line 66 — `md:grid-cols-2`

### Tech stack pills:
- **Tech list:** lines 27–38 — simple string array
- **Rendered at:** lines 98–106

To add a technology, add a string to the `techStack` array.

---

## Call-to-Action Section

**File:** `src/components/CTA.tsx`

| Element              | Lines   | What to Edit                              |
| -------------------- | ------- | ----------------------------------------- |
| Heading              | 21      | "Ready to accelerate your drug discovery?" |
| Description          | 24–26   | Subtitle paragraph                        |
| Primary button       | 30–36   | "Get started" — text, `href`              |
| Secondary button     | 37–42   | "Read the docs" — text, `href`            |
| Install command      | 46–50   | `pip install athena-drug-discovery`        |
| Bottom note          | 53–55   | "Open source · MIT licensed · Python 3.9+" |

### Background effects:
- **Gradient overlay:** line 16
- **Blur circles:** lines 17–18 (left and right glow effects)

---

## Footer

**File:** `src/components/Footer.tsx`

### Brand area:
- **Logo + name:** lines 43–46
- **Tagline:** lines 47–49

### Link columns:
- **All links:** lines 10–35 — `footerLinks` object with 4 categories
- Each category is an object key (`Pipeline`, `Resources`, `Community`, `Project`)
- Each link has `label` and `href`

### Bottom bar:
- **Copyright:** line 74
- **Bottom links (License, Privacy, GitHub):** lines 77–88

### To add a new footer column:

Add a new key to the `footerLinks` object. The grid is 5 columns on desktop (`md:grid-cols-5`), with the brand taking 1 column and 4 for link groups. If adding a 5th link group, update the grid class on line 40.

---

## Adding a New Section

1. Create a new component in `src/components/` (e.g., `Pricing.tsx`)
2. Export a default function with a `<section>` wrapper:
   ```tsx
   export default function Pricing() {
     return (
       <section id="pricing" className="relative py-16 md:py-32">
         <div className="mx-auto max-w-7xl px-4 md:px-6">
           {/* Content here */}
         </div>
       </section>
     );
   }
   ```
3. Import and add it to `src/App.tsx` in the desired position
4. Add a nav link in `Navbar.tsx` (line 13–19) with `href: '#pricing'`
5. Optionally add a footer link in `Footer.tsx`

---

## Icons

**General icons:** Imported from `lucide-react`. Browse available icons at [lucide.dev/icons](https://lucide.dev/icons).

```tsx
import { IconName } from 'lucide-react';
<IconName size={24} className="text-athena-amber" />
```

**GitHub icon:** Custom filled SVG defined locally in each component that uses it. The SVG is defined as a `GitHubIcon` component at the top of:
- `src/components/Hero.tsx` — lines 4–10
- `src/components/Navbar.tsx` — lines 5–11
- `src/components/Footer.tsx` — lines 1–7

---

## Mobile Responsiveness

The site uses Tailwind's responsive prefixes. Key breakpoints:
- Default (no prefix): mobile-first base styles
- `sm:` — 640px+
- `md:` — 768px+ (main desktop breakpoint)
- `lg:` — 1024px+

### What's hidden on mobile:

| Element                      | File                         | How                  |
| ---------------------------- | ---------------------------- | -------------------- |
| Pipeline stage detail cards  | `Models.tsx`                 | `hidden md:grid`     |
| Pipeline terminal output     | `PipelineVisualization.tsx`  | `hidden md:block`    |
| Desktop horizontal pipeline  | `PipelineVisualization.tsx`  | `hidden md:block`    |
| Platform dashboard mockup   | `Platform.tsx`               | `hidden md:block`    |
| Desktop nav links            | `Navbar.tsx`                 | `hidden md:flex`     |
| Desktop nav CTA buttons      | `Navbar.tsx`                 | `hidden md:flex`     |

### Mobile-only elements:

| Element                      | File                         | How                  |
| ---------------------------- | ---------------------------- | -------------------- |
| Vertical pipeline animation  | `PipelineVisualization.tsx`  | `md:hidden`          |
| Mobile hamburger menu        | `Navbar.tsx`                 | `md:hidden`          |
| Short badge text             | `Hero.tsx`                   | `sm:hidden`          |

### Standard section padding pattern:

```tsx
<section className="relative py-16 md:py-32">
  <div className="mx-auto max-w-7xl px-4 md:px-6">
```

---

## Custom CSS Utilities

**File:** `src/index.css` — lines 47–76

| Class              | Effect                                      | Used In        |
| ------------------ | ------------------------------------------- | -------------- |
| `.text-gradient`   | Multi-color gradient text (blue→red→purple) | General use    |
| `.text-gradient-hero` | White-to-blue gradient text              | Hero heading   |
| `.glow`            | Subtle blue box-shadow glow                 | Cards, panels  |
| `.grid-bg`         | Faint grid line background pattern          | Hero backdrop  |
| `.molecule-glow`   | Radial blue glow effect                     | Decorative     |

---

## Troubleshooting

| Problem                          | Solution                                              |
| -------------------------------- | ----------------------------------------------------- |
| Changes not showing              | Run `npx vite --force` to clear dependency cache      |
| Multiple dev servers running     | Kill other processes on ports 5173–5177                |
| Tailwind classes not working     | Ensure you're using tokens defined in `@theme` in `index.css` |
| Animation double-firing          | Expected in dev (React StrictMode). Works normally in production build |
| `--host` flag not working        | Use `npx vite --host` or `npm run dev -- --host`      |
