# IN //fluency

A static course website for **IN //fluency** — a free 5-day, live-cohort course that teaches
marketers and operators to build practical AI agents.

No build step, no backend, no dependencies. Open `index.html` or drop the folder on any static
host and it runs.

## Structure

```
index.html              Landing page — hero, social proof, coaches, agents,
                        5-day journey, qualifying checklist, waitlist form
workshop.html           The five hands-on exercises, one per cohort day
assets/css/styles.css   Design system: palette, type, buttons, cards, nav, footer
assets/css/workshop.css Exercise-specific components
assets/js/site.js       Nav, overlay menu, scroll reveal, waitlist form
assets/js/workshop.js   All five exercises + progress tracking
```

## The exercises

All five are fully client-side and save to `localStorage`, so progress survives a reload.
The progress strip at the top of `workshop.html` tracks completion; **Reset workshop** clears it.

| Day | Exercise | What it does |
| --- | --- | --- |
| 1 | **Time audit** | List repetitive tasks, score each on frequency × effort, and get a ranked automation priority list with a recommended "Agent #1 candidate". Big-but-rare tasks take a handoff penalty, so high-frequency work rises to the top. |
| 2 | **Prompt lab** | Draft a prompt against a real brief. A five-element checklist (role, context, format, examples, constraints) lights up green as the draft picks each one up, with a weak/strong example toggle you can load into the editor. |
| 3 | **Workflow builder** | Sequence five steps of a multi-step agent by dragging or with arrow buttons. Validation checks the order and explains *why* a placement is wrong (gather first, review last). |
| 4 | **Evaluation drill** | Three AI outputs for the same brief, each failing a different check — a hallucinated figure, drifted tone, a skipped instruction. Flag each, then score with per-output explanations. |
| 5 | **Demo Day card** | Fill in problem, agent description and before/after hours; it renders live as a shareable summary card and computes the weekly and annual time saved. Exports as a ready-to-paste LinkedIn post. |

## Design

- **Cream** `#F3F1E9` base, alternating **forest green** `#0B2E1F` sections, **lime** `#C8F542` accent
- **Fredoka** for display type, **Inter** for body (loaded from Google Fonts; falls back to system sans)
- Pill buttons, rounded cards, lime numbered step badges
- Responsive from 320px up, with a sticky wordmark and an overlay hamburger menu
- Honours `prefers-reduced-motion`

## Notes

The waitlist and Demo Day forms are client-side only — there's no backend. Submissions are
validated and stored in `localStorage` so the flow is demonstrable; wire the submit handler in
`assets/js/site.js` to a real endpoint when one exists.
