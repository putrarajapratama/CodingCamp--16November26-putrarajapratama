# Implementation Plan: To-Do Life Dashboard

## Overview

Implement a zero-dependency, single-page dashboard using HTML, CSS, and Vanilla JavaScript. All state is persisted in `localStorage`. The app ships as three files: `index.html`, `css/style.css`, and `js/app.js`, and must run directly from the filesystem (`file://`) without a build step.

## Tasks

- [x] 1. Scaffold project structure
  - Create the root `index.html`, `css/style.css`, and `js/app.js` files at the workspace root so the file layout matches the design exactly (one CSS file, one JS file).
  - Add a `<script defer src="js/app.js">` tag and a `<link rel="stylesheet" href="css/style.css">` tag to `index.html`.
  - Verify no other CSS or JS files are introduced.
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [x] 2. Build HTML widget shells
  - [x] 2.1 Add Greeting widget markup
    - Write a `<section class="widget widget--greeting">` with child elements `#greeting-text`, `#clock-time`, and `#clock-date`.
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 2.2 Add Focus Timer widget markup
    - Write a `<section class="widget widget--timer">` containing `#timer-display` and buttons `#btn-start`, `#btn-stop`, `#btn-reset`.
    - Set initial `disabled` attributes per the Idle state (Stop disabled; Start and Reset enabled).
    - Add `role="timer"` to `#timer-display` and an `aria-live="assertive"` completion-announcement region.
    - _Requirements: 2.1, 2.8, 2.9, 2.10_

  - [x] 2.3 Add Task List widget markup
    - Write a `<section class="widget widget--tasks">` with `#task-input`, `#task-submit`, `#task-error`, and `<ul id="task-list">`.
    - _Requirements: 3.1, 3.2_

  - [x] 2.4 Add Quick Links widget markup
    - Write a `<section class="widget widget--links">` with `#link-label`, `#link-url`, `#link-submit`, `#link-error`, and `<div id="links-list">`.
    - _Requirements: 4.1, 4.2_

- [x] 3. Implement CSS — custom properties, reset, and layout
  - [~] 3.1 Define CSS custom properties and base reset
    - Add all custom properties to `:root` (colour palette, typography, spacing, radius, shadow) exactly as specified in the design.
    - Apply `box-sizing: border-box`, zero margin/padding reset, and set `body` background and font from the custom properties.
    - _Requirements: 5.1, 6.3, 6.4_

  - [x] 3.2 Implement responsive grid layout
    - Style `.dashboard` as a CSS grid with `gap` and `padding` from custom properties.
    - Add a `@media (min-width: 640px)` rule setting `grid-template-columns: 1fr 1fr`.
    - Make `.widget--greeting` span both columns with `grid-column: 1 / -1`.
    - _Requirements: 6.2_

  - [x] 3.3 Implement widget and button component styles
    - Write `.widget` base styles (card background, border, border-radius, shadow).
    - Write `.btn`, `.btn--primary`, `.btn--ghost`, `.btn--danger` button variants.
    - Add `button:disabled { opacity: 0.4; cursor: not-allowed; }` and `aria-disabled="true"` pairing note in a comment.
    - Write `.task--complete .task__title { text-decoration: line-through; color: var(--color-muted); }`.
    - Ensure all text uses a minimum `font-size` of 14 px and meets WCAG 2.1 AA contrast (4.5:1).
    - Add `:focus-visible` outlines on all interactive elements using `--color-accent`.
    - _Requirements: 3.5, 6.3, 6.4, 6.5_

- [~] 4. Implement StorageService
  - Write the `StorageService` object literal inside `app.js` with `get(key)` (try/catch JSON.parse, returns `null` on failure) and `set(key, value)` (try/catch JSON.stringify + localStorage.setItem, returns `true`/`false`).
  - Ensure `get()` logs a `console.warn` and returns `null` when JSON parsing fails.
  - _Requirements: 3.3, 3.4, 4.5, 4.6_

- [x] 5. Implement GreetingWidget
  - [x] 5.1 Implement core greeting helpers
    - Write `_formatTime(date)` returning `"HH:MM:SS"` with zero-padded 24-hour values.
    - Write `_formatDate(date)` returning `"<FullWeekday>, <FullMonth> <DD>, <YYYY>"`.
    - Write `_greeting(hour)` returning "Good Morning" (5–11), "Good Afternoon" (12–17), "Good Evening" (all other hours).
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [~] 5.2 Write property tests for GreetingWidget helpers
    - **Property 1: Greeting text is determined solely by the hour** — generator: `fc.integer({min:0, max:23})`
    - **Validates: Requirements 1.3, 1.4, 1.5**
    - **Property 2: Clock time format correctness** — generator: `fc.date()` filtered to valid dates
    - **Validates: Requirements 1.1**
    - **Property 3: Date string format correctness** — generator: `fc.date()` filtered to valid dates
    - **Validates: Requirements 1.2**

  - [x] 5.3 Implement GreetingWidget init and tick loop
    - Write `init()` to query `#greeting-text`, `#clock-time`, `#clock-date`, call `_tick()` once, then start a `setInterval` at 1 000 ms.
    - Write `_tick()` wrapping `new Date()` in try/catch; on error call `_handleClockError()`.
    - Write `_handleClockError()` to set all three DOM nodes to "Time unavailable".
    - _Requirements: 1.1, 1.2, 1.6, 1.7_

- [x] 6. Implement FocusTimer
  - [~] 6.1 Implement timer state machine and countdown
    - Write `FocusTimer` with `_state`, `_remaining`, `_intervalId` properties initialised to `"idle"`, `1500`, `null`.
    - Implement `_start()`, `_stop()`, `_reset()`, and `_tick()` following the transition table in the design.
    - In `_tick()`, use wall-clock drift correction (`Date.now()` delta) to keep `_remaining` within ±1 s of real elapsed time.
    - Implement `_formatMM_SS(s)` converting seconds to `"MM:SS"`.
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [~] 6.2 Write property tests for FocusTimer
    - **Property 11: Focus Timer Idle/Reset invariant** — generator: `fc.constantFrom("idle","running","paused")`
    - **Validates: Requirements 2.6**
    - **Property 12: Focus Timer countdown monotonicity** — generator: sequence of Start/Stop events without Reset
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5**

  - [x] 6.3 Implement timer render, signal, and button wiring
    - Write `_render()` to update `#timer-display`, set `disabled` and `aria-disabled` on each button per the current state.
    - Write `_playSignal()` using the Web Audio API (short beep 1–3 s); silently swallow any `AudioContext` errors.
    - Announce "Focus session complete." in the `aria-live="assertive"` region when `_remaining` reaches 0.
    - Wire `#btn-start`, `#btn-stop`, `#btn-reset` click handlers in `init()`.
    - _Requirements: 2.7, 2.8, 2.9, 2.10_

- [x] 7. Implement TaskList
  - [~] 7.1 Implement task helpers and storage
    - Write `_validate(title)` returning `null` for valid input (non-empty after trim, ≤ 200 chars) or an error string otherwise.
    - Write `_load()` reading `StorageService.get("tasks")`; fall back to `[]` on `null` or parse failure, write `[]` back to storage.
    - Write `_save()` calling `StorageService.set("tasks", _tasks)`; on `false` call `_showStorageError()` with a user-visible message.
    - _Requirements: 3.2, 3.3, 3.4, 3.11_

  - [~] 7.2 Write property tests for TaskList helpers
    - **Property 4: Task addition round-trip** — generator: `fc.string({minLength:1, maxLength:200}).filter(s => s.trim().length > 0)`
    - **Validates: Requirements 3.1, 3.3**
    - **Property 5: Whitespace-only task titles are always rejected** — generator: `fc.stringOf(fc.constantFrom(' ','\t','\n'), {minLength:1})`
    - **Validates: Requirements 3.2**
    - **Property 6: Task toggle is an involution** — generator: `fc.boolean()` for initial state + any valid Task
    - **Validates: Requirements 3.5, 3.6**
    - **Property 7: Edit confirm round-trip** — generator: valid task + valid new title string
    - **Validates: Requirements 3.8**

  - [~] 7.3 Implement task CRUD operations and render
    - Write `_add(title)` generating an ID (`crypto.randomUUID()` with fallback), pushing to `_tasks`, calling `_save()`, then `_render()`.
    - Write `_delete(id)`, `_toggleComplete(id)`, `_startEdit(id)`, `_confirmEdit(id, newTitle)`, `_cancelEdit(id)` per the design spec.
    - In `_confirmEdit`, discard whitespace-only new titles silently (Requirement 3.9).
    - Write `_render()` clearing `#task-list` and calling `_renderItem(task)` for each task; `_renderItem` returns a `<li>` with accessible `aria-label` attributes on each action button.
    - Wire the submit event on `#task-input`/`#task-submit` in `init()`.
    - _Requirements: 3.1, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

- [~] 8. Implement QuickLinks
  - [x] 8.1 Implement link helpers and storage
    - Write `_validate(label, url)` returning `null` only when label is non-empty (trimmed, ≤ 50 chars), URL is non-empty (trimmed, ≤ 2048 chars), and URL starts with `"http://"` or `"https://"`.
    - Write `_load()` and `_save()` mirroring TaskList's pattern for `StorageService` key `"links"`.
    - _Requirements: 4.2, 4.3, 4.5, 4.6_

  - [x] 8.2 Write property tests for QuickLinks helpers
    - **Property 8: Link validation covers all invalid inputs** — generator: `fc.tuple(fc.string(), fc.string())` covering all invalid combos
    - **Validates: Requirements 4.2, 4.3**
    - **Property 9: Link addition round-trip** — generator: valid label + valid URL arbitraries
    - **Validates: Requirements 4.1, 4.5**
    - **Property 10: Link count cap enforcement** — generator: link array of exactly 20 + any valid new link
    - **Validates: Requirements 4.4**

  - [x] 8.3 Implement link add/remove and render
    - Write `_add(label, url)` checking the 20-link cap (return a validation error if reached), generating an ID, pushing to `_links`, calling `_save()`, then `_render()`.
    - Write `_remove(id)`, `_render()`, and `_renderLink(link)` producing a button with `aria-label="Open <label> in new tab"` that calls `window.open(url, '_blank')`.
    - Wire the add form submit and remove button events in `init()`.
    - _Requirements: 4.1, 4.4, 4.7, 4.8, 4.9_

- [x] 9. Checkpoint — Ensure all unit and property tests pass
  - Ensure all tests pass. Ask the user if any questions arise before proceeding.

- [ ] 10. Wire all widgets and finalise app.js
  - Wrap all widget object literals in a single IIFE inside `app.js`.
  - Call `GreetingWidget.init()`, `FocusTimer.init()`, `TaskList.init()`, `QuickLinks.init()` in sequence inside the IIFE; the script's `defer` attribute ensures the DOM is ready.
  - Confirm `StorageService` is declared before all widget objects in the file.
  - _Requirements: 5.1, 5.3, 6.1_

- [~] 11. Final checkpoint — Full integration verification
  - Ensure all tests pass. Ask the user if any questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP.
- Property tests use the **fast-check** UMD build (no bundler required); include it via a `<script>` tag in the test HTML file only — do not add it to `index.html`.
- Each task references specific requirements for traceability.
- Checkpoints ensure incremental validation at logical breaks.
- The timer drift-correction logic (Task 6.1) is essential for correctness under tab-background throttling.
- ID generation uses `crypto.randomUUID()` with a `Date.now() + Math.random()` fallback for full browser compatibility.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "4"] },
    { "id": 4, "tasks": ["5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "6.1", "7.1", "8.1"] },
    { "id": 6, "tasks": ["6.2", "6.3", "7.2", "7.3", "8.2", "8.3"] },
    { "id": 7, "tasks": ["9"] },
    { "id": 8, "tasks": ["10"] },
    { "id": 9, "tasks": ["11"] }
  ]
}
```
