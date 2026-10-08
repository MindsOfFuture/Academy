# M5 restart usability verification

## Scope

Existing restart usability bugfix in `feat/lg2-m05-restart`, based on `origin/development` at `2d722dd`. Initial worktree status was clean. No M10 changes, new dependencies, archive/history feature, commit, push, or deployment.

- Question headers and the result header show **Analisar outro produto, serviço ou mercadoria** without scrolling on the tested mobile viewport.
- One confirmation/reset handler serves question screens, results, and the existing cover restart action.
- Confirmation warns that current answers are erased and suggests saving or printing results first.
- Cancel does not re-render or mutate state, retaining even unsaved input.
- Confirm replaces answers/history and opens `M5.P01` directly. Its new navigation history is exactly `["M5.P01"]`.
- Existing `lg2-turma-a-m05` storage key, spreadsheet questions, calculation engine and styles are unchanged.

## Reproduce

Working directory: `C:/Users/faelr/Downloads/reps/_wt-lg2-m05-restart`

```sh
node --check public/lg2/turma-a/m05/js/app.js
node --check tests/lg2-m05-restart.cjs
node tests/lg2-m05-restart.cjs
git diff --check
```

All commands exited **0**. Regression test imports the installed Playwright dependency at `C:/Users/faelr/Downloads/reps/Academy/node_modules/playwright`; no installation is needed. It launches headless Chromium and a loopback static HTTP server on an ephemeral port, owned by the test process, and closes both in `finally`. It does not use the main checkout's application or write its files.

Initial RED run, before implementation: exit **1**, `AssertionError: Restart must be discoverable on questions` (`0 !== 1`).

Final GREEN run output:

```text
Owned HTTP server PID 21228, port 49757
PASS: explicit restart on questions
PASS: Produto branch through real results; cancel, confirm and reload persistence
PASS: Serviço branch through real results; cancel, confirm and reload persistence
PASS: Mercadoria branch through real results; cancel, confirm and reload persistence
PASS: question confirmation clears answers/history and persists
PASS: restart hidden in print; no browser errors
```

Each branch is selected through the real UI after a fresh state or restart, with its first question explicitly checked (`M5.P02`, `M5.P17`, `M5.P10`). The test answers through actual rendered controls to reach real calculated results; it does not inject a result fixture into storage. Assertions cover question/result cancellation, unsaved input retention, answers/history reset, progress/result/reset persistence across reload, all three choices becoming available again, mobile viewport positioning and overflow, print hiding, and browser errors. Reload intentionally keeps the existing cover/Continue behavior.

## Visual evidence

Viewport: **390 × 844**. Both screenshots were loaded and visually inspected:

- `C:/Users/faelr/AppData/Local/hermes/work/lg2-m05-restart/mobile-question.png`
- `C:/Users/faelr/AppData/Local/hermes/work/lg2-m05-restart/mobile-results.png`

The complete restart label wraps cleanly to two lines in a light button against the purple header. It is fully visible near the top with no clipping or horizontal overflow. The question screenshot also shows all three branch choices and Continue. The result screenshot shows the restart button before the calculated cost and margin content.

## Limitations

Focused static-module regression only; no full Academy build, authenticated Next.js integration suite, physical-device test, or cross-browser suite was run. The calculation engine was exercised by the three end-to-end paths but was not modified or independently exhaustively audited.
