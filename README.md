# INFO 521 Peer-Engagement Loops

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.21971108.svg)](https://doi.org/10.5281/zenodo.21971108) [![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

If using these course materials, cite the following: 
>Chism, G. (2026). INFO 521: Machine Learning Foundations — Interactive Activities (Version v1.0.0) [Computer software]. Zenodo. https://doi.org/10.5281/zenodo.21971108

Interactive tools + retakeable mastery quizzes for INFO 521. Six tools (one per
loop-carrying week), each the entry point to a four-stage loop that continues in
D2L: **tool + quiz → reflection → peer review → respond + revise.** The quiz emits
a completion token students paste into their D2L reflection as proof of mastery
(≥ 80%). Week 3 has no tool (its discussion carries the loop alone); its
parameter-uncertainty demo is embedded in lecture instead.

Everything is **buildless static HTML**: no bundler, no framework, no build step.

## What is in this repo

| Path | Role |
|---|---|
| `week01-least-squares/` | least-squares explorer + quiz (fitting, residuals, normal equations) |
| `week02-bias-variance/` | bias-variance explorer (polynomial order, ridge penalty) |
| `week03-bayesian-updating/` | Bayesian updating explorer (runs in Week 4; slugs are week-named from an earlier numbering) |
| `week04-logistic-regression/` | logistic explorer (runs in Week 5) |
| `week05-kmeans/` | k-means explorer (runs in Week 6) |
| `week06-pca/` | PCA explorer (runs in Week 7) |
| `m3-parameter-uncertainty/` | in-lecture demo for Module 3 (not a loop) |
| `shared/shell.css` | design system: light/dark, Okabe-Ito data colors |
| `shared/quiz-engine.js` | quiz + completion-token engine (grading-critical; edit with care) |
| `shared/viz-helpers.js` | D3 palette + theme helpers |
| `d2l/` | one embed page per tool for D2L content topics |
| `lectures/` | lecture-support pages |
| `index.html` | tool index (the site landing page) |
| `deploy.sh` | stages a flat `dist/` for local preview only (Pages does not use it) |
| `.github/workflows/publish.yml` | GitHub Pages deploy (Settings → Pages → Source: GitHub Actions) |

The **Runs in** mapping (tool slug vs. actual course week) is authoritative on the
hub's Activities page; from Module 4 on, each tool runs one week after its slug
number.

## Run it

- Preview: open any `weekNN-*/index.html` in a browser (on `file://`, score
  persistence may be limited; fine for previewing).
- Full behavior: `python3 -m http.server` then visit
  `http://localhost:8000/week01-least-squares/`.
- Production: GitHub Pages via the publish workflow. Push to `main` deploys.

## Accessibility and theming

All tools: dark/light toggle matching the slide decks, keyboard-operable controls
with visible focus, Okabe-Ito palette with redundant non-color cues, reduced-motion
support, KaTeX 0.16.9 for math (identical to the slides).

## Editing rules

The completion token and quiz logic live in `shared/quiz-engine.js` and are
honor-evidence for grading: each week's token differs, and an audit list flags
anomalies. Do not change token generation mid-term.
