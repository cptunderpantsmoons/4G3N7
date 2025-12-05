# 4G3N7 Branding Kit

This kit captures the visual and verbal system for 4G3N7. It is built for a precise, cinematic feel: dark, quiet canvases with neon highlights and thin typography. Keep layouts spacious and intentional.

## Core Identity
- **Name:** 4G3N7 (pronounced "agent")
- **Positioning:** Operating system for autonomous teams; orchestrates agents, humans, and tools in a single control plane.
- **Tone:** Confident, technical, minimal. Favor verbs and short phrases over marketing filler.

## Logos and Marks
- **Primary wordmark:** `packages/bytebot-ui/public/4g3n7-wordmark.svg`
- **Glyph (for favicons/avatars):** Use the wordmark “4G3N7” condensed to a square; keep `Electric` (#27F5C5) on `Ink` (#04060D). When size constrained, drop to “4G7”.
- **Usage:** Keep at least 16px padding around the mark. On dark backgrounds, use full-color; on light, invert to `Ink` (#04060D) on white.

## Color Palette
- **Ink (bg/base):** `#04060D`
- **Void (surface-1):** `#0A0F1D`
- **Surface (panel):** `#0F1628`
- **Panel (card):** `#121C33`
- **Card (lifted):** `#17243F`
- **Electric (primary accent):** `#27F5C5`
- **Signal (secondary accent):** `#F6C452`
- **Heat (alert/accent):** `#FF6B4A`
- **Ice (supporting accent):** `#9AD5FF`
- **Cloud (muted text):** `#C7D6F2`
- **Mist (base text):** `#E8EDFB`

Guidance:
- Dark canvases should use `Ink` → `Surface` gradients.
- Primary CTAs and focus states use `Electric`; hover to `Signal`.
- Warnings use `Heat`; success/badges use `Electric` or `Ice`.
- Borders: translucent `Card` or `#1F2A45`.

## Typography
- **Headlines:** Space Grotesk (600–700). Tight letter-spacing (-2%); larger line-height on stacked headlines.
- **Body/Interface:** Manrope (400–600). Neutral tone, slightly condensed tracking.
- **Numerals/Data:** Prefer tabular numerals where available; uppercase labels with wide tracking for system cues.

## Components and Layout
- **Containers:** Rounded (12–18px). Use subtle inner glow (`Electric` at 10–15% opacity) for interactive surfaces.
- **Buttons:** Primary filled `Electric` on `Ink`; secondary ghost with `Electric` border and low-opacity fills. Avoid grayscale buttons.
- **Cards:** Dense shadows with clear separation; include thin top borders or pills for status.
- **Motion:** Short ease-out (150–220ms). Stagger reveals; avoid bouncy easing.

## Imagery and Backgrounds
- Prefer abstract mesh gradients and gridlines over photography.
- Use radial glows at corners; keep noise subtle. Avoid overly busy patterns behind text.

## Voice and Messaging
- Lead with outcomes (“Start a mission,” “Trace every decision”).
- Keep nouns concrete (agents, runbooks, approvals, telemetry). Avoid buzzwords like “synergy” or “revolutionary.”

## Quick Usage Examples
- CTA: Electric fill, Ink text, border-radius 9999px, glow-ring shadow.
- Status pill: Electric dot + uppercase label with 0.18em tracking on a translucent Panel background.
- Section heading: Space Grotesk 32–48px, Ink → Mist gradient text optional, wide top/bottom padding.

## File Map
- Brand page in product UI: `src/app/page.tsx` (hero + brand highlights)
- Primary wordmark asset: `packages/bytebot-ui/public/4g3n7-wordmark.svg`
- Global theme tokens: `src/app/globals.css`

For any new assets, maintain SVG first, PNG exports only when raster is required. Keep accessibility in mind—maintain contrast ratios above 4.5:1 for body text and 3:1 for larger headings.
