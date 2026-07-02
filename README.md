# INFO 521 — Peer-Engagement Loops

Interactive tools + retakeable mastery quizzes for INFO 521. One per week (Weeks 1–6),
each the entry point to a four-stage loop that continues in D2L: **tool + quiz →
reflection → peer review → respond + revise.** The quiz emits a completion token students
paste into their D2L reflection as proof of mastery (≥ 80%).

These replace worksheets and the recurring-assessment role of the midterms; two separate
projects (designed elsewhere) replace the midterm and final.

## Run it

No build step. Either:

- **Preview:** open `week01-least-squares/index.html` in a browser. (On `file://`, score
  persistence may be limited in some browsers — that's fine for previewing.)
- **Serve locally** for full behavior:
  ```sh
  python3 -m http.server   # then visit http://localhost:8000/week01-least-squares/
  ```

The real target is **GitHub Pages**, where the quiz, localStorage persistence, and token
all work normally.

## Layout

| Path | Role |
|---|---|
| `shared/shell.css` | Design system — light/dark, Okabe-Ito data colors |
| `shared/quiz-engine.js` | Quiz + token engine (graded-critical) |
| `shared/viz-helpers.js` | D3 palette + theme helpers |
| `week01-least-squares/` | Week 1 tool: least-squares explorer + 13-item bank |
| `deploy.sh` | Stages a flat `dist/` for Pages (does not publish) |

## Status

- **Week 1** — built (least-squares explorer + quiz).
- **Weeks 2–6** — copy Week 1, swap CONFIG + `drawViz`. See `CLAUDE.md`.

## GitHub Pages setup

Pages is configured to serve from **`main` branch / root** (no docs/ subdirectory). The
site is fully static and buildless — everything is already in the tree.

`deploy.sh` stages a flat `dist/` copy that mirrors the root layout; it is a
**local-preview convenience only** and is not used by Pages. Do not point Pages at `dist/`.

Publishing (repo creation, push, Pages config, GitHub Classroom) is done manually.
