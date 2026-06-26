# CLAUDE.md

Guidance for Claude Code working in this repo.

## What this is

Six weekly **peer-engagement loops** that replace worksheets and the recurring-assessment
role of midterms in INFO 521. Each week's tool = an interactive D3 visualization + a
retakeable mastery quiz that emits a **completion token** the student pastes into D2L.
The four-stage loop (tool+quiz → reflection → peer review → respond+revise) lives in D2L;
this repo is only the tool+quiz half.

## Architecture

Buildless static site. No bundler, no package manager, no framework.

```
shared/        built once, hardened — touched rarely
  shell.css        design system (light/dark via CSS vars; Okabe-Ito data colors)
  quiz-engine.js   GRADED-CRITICAL: randomize, feedback, localStorage, mastery, token
  viz-helpers.js   Okabe-Ito palette + theme-aware grid/text colors for D3
weekNN-topic/  one thin module per week
  index.html       page shell linking ../shared/*; week-specific control markup
  weekNN.js        CONFIG (data + quiz bank) + drawViz; the only file that varies
deploy.sh      stages a flat dist/ for GitHub Pages (does NOT publish)
```

## Conventions (do not drift)

- **Classic `<script>` tags only — no ES modules.** Tools must open by double-click
  (`file://`) for preview AND work on Pages. Module imports break `file://` in Chrome.
- **D3 v7** (cdnjs 7.9.0) for all viz; **KaTeX** 0.16.9 for all math.
- **Okabe-Ito data palette only**, and always pair hue with a redundant cue (line style,
  marker shape, on-element label). Never rely on color alone. This is an accessibility
  floor, not a preference.
- Full **dark mode** via the CSS variables in `shell.css`; D3 reads grid/text colors
  through `PL.viz` so axes track the theme.
- **Accessibility floor:** keyboard-operable controls, visible focus, ARIA labels,
  `prefers-reduced-motion` respected.
- Topic-named week directories (`week01-least-squares`), not lecture numbers.

## The token

Each week's CONFIG holds a `token` revealed only at `masteryThreshold` (0.80). It is
**honor-evidence, not security** — rotate the phrase each term and keep a token list to
spot-check against pasted receipts. Do not add server calls or analytics; the no-backend
design is deliberate.

## Git

- Stage commits with clear messages. **Do NOT push, publish, or run deploy.** Repo
  creation, pushes, Pages, and GitHub Classroom wiring are Greg's manual steps.
- `deploy.sh` only stages `dist/`; it never publishes.

## Adding a week

Copy `week01-least-squares/` to `weekNN-topic/`, replace CONFIG (data + quiz bank) and
the `drawViz` body, swap the week-specific control markup in `index.html`, and register
the directory in `deploy.sh`. Weeks 3 and 6 can adapt existing Bayesian / Gaussian demos
instead of starting fresh.
