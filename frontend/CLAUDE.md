# Athena Frontend

Athena is an open-source AutoML platform for drug discovery. This is the landing page / marketing frontend.

## Tech Stack

- **React 19** + **TypeScript** (strict mode)
- **Vite 8** with `@vitejs/plugin-react`
- **Tailwind CSS v4** (uses `@theme` directive in `src/index.css`, not `tailwind.config`)
- **Framer Motion** for animations
- **Lucide React** for icons (outline style) — GitHub icon uses a custom filled SVG, not lucide

## Commands

- `npm run dev` — start dev server (use `npx vite --force` if changes aren't reflecting)
- `npm run build` — type-check then build (`tsc -b && vite build`)
- `npm run lint` — ESLint
- `npx tsc --noEmit` — type-check only

## Project Structure

```
src/
  App.tsx          — root layout, composes all sections
  main.tsx         — entry point (StrictMode)
  index.css        — Tailwind imports + @theme (all color tokens) + utility classes
  components/
    Navbar.tsx             — fixed top nav with mobile hamburger menu
    Hero.tsx               — hero section with badge, heading, CTAs, stats
    Models.tsx             — "The Pipeline" section (stage cards + PipelineVisualization)
    PipelineVisualization.tsx — animated 5-stage progress demo with terminal output
    Platform.tsx           — dashboard mockup + capability cards
    Research.tsx           — "How It Works" 5-step cards
    Company.tsx            — "About" highlights + tech stack
    CTA.tsx                — call-to-action with pip install command
    Footer.tsx             — 5-column footer
public/
  logo.svg         — Athena logo (used in Navbar + Footer)
```

## Theming

All colors are defined as CSS custom properties in `src/index.css` under `@theme`. The primary accent is `--color-athena-amber` (sea blue `#0ea5e9`). The naming is legacy — it was originally amber/yellow.

Key tokens: `athena-dark`, `athena-darker`, `athena-card`, `athena-border`, `athena-amber` (primary), `athena-red`, `athena-orange`, `athena-cyan`, `athena-emerald`, `athena-purple`, `athena-text`, `athena-text-bright`.

## Conventions

- Dark theme — backgrounds use `athena-dark`/`athena-darker`, cards use `athena-card`
- Brand name is lowercase: `athena.`
- Logo is `<img src="/logo.svg">`, not a CSS-generated element
- GitHub icon is a custom inline SVG (filled circle mark), defined locally in components that use it — not imported from lucide
- Mobile-first responsive: complex sections (dashboard preview, stage detail cards, terminal output) are hidden on mobile with `hidden md:block` / `hidden md:grid`
- Section padding: `py-16 md:py-32`, container padding: `px-4 md:px-6`
- Animations use Framer Motion `whileInView` with `viewport={{ once: true }}`
- `PipelineVisualization` uses `useEffect` + `setTimeout` for its animation loop — do not use `setInterval` or nest timers inside `setActiveStage`
