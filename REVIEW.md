# Code Review — Activity Time Tracker

Reviewed against `SPEC.md` acceptance criteria. The project is a TypeScript/React Native (Expo) app — no Python code is present.

---

## Acceptance Criteria

**1. [PASS] AC1 — Create activity → Timer Screen starts counting**
`NewActivityModal` ([components/NewActivityModal.tsx:60-71](components/NewActivityModal.tsx#L60-L71)) validates that name is non-empty and at least one tag is selected before calling `onStart`. `handleStartActivity` ([app/index.tsx:108-123](app/index.tsx#L108-L123)) persists the session and navigates to `/timer`. Correct.

**2. [PASS] AC2 — Pause/resume correctly excludes paused intervals**
`computeElapsed` ([app/timer.tsx:26-40](app/timer.tsx#L26-L40)) sums all completed segments and adds the current ongoing segment only when `!isPaused`. `handlePauseResume` ([app/timer.tsx:143-171](app/timer.tsx#L143-L171)) correctly closes/opens segments on each press.

**3. [PASS] AC3 — Completed record appears at top of History Screen**
`addRecord` ([storage/storage.ts:25-29](storage/storage.ts#L25-L29)) uses `unshift` to prepend. History Screen reloads via `useFocusEffect` on every focus.

**4. [PASS] AC4 — App kill/background recovery shows Timer Screen with accurate elapsed time**
On startup, [app/index.tsx:63-70](app/index.tsx#L63-L70) detects a persisted `@activeSession` and calls `router.replace('/timer')`. The `AppState` listener in [app/timer.tsx:124-141](app/timer.tsx#L124-L141) recomputes elapsed from stored timestamps when the app returns to the foreground.

**5. [PASS] AC5 — Search bar filters by name in real time (partial, case-insensitive)**
Implemented correctly at [app/index.tsx:99-106](app/index.tsx#L99-L106).

**6. [PASS] AC6 — Tag chip filters records; "All" restores full list**
Same filter block handles both: `activeTag === 'All' || r.tags.includes(activeTag)`.

**7. [FAIL] AC7 — Editing journal note and navigating away persists the change**
The SPEC states "Changes are saved automatically or on explicit save." The Detail Screen ([app/detail/[id].tsx](app/detail/%5Bid%5D.tsx)) only saves when the user explicitly taps "Save Changes". If the user edits the note and presses the back button, **the change is silently lost**. Auto-save on blur or navigation is not implemented.

**8. [PASS] AC8 — Setting start time after end time shows a validation error and does not save**
[app/detail/[id].tsx:160-163](app/detail/%5Bid%5D.tsx#L160-L163) correctly catches `newStart >= newEnd`, sets `timeError`, and returns early.

**9. [PASS] AC9 — Deleting a record removes it from History and does not reappear after restart**
`handleDelete` ([app/detail/[id].tsx:196-213](app/detail/%5Bid%5D.tsx#L196-L213)) calls `deleteRecord` then navigates to `/`. History Screen reloads on focus.

**10. [PASS] AC10 — App launches without errors after a fresh `npm install` and `npx expo start`**
No obvious import errors, missing dependencies, or bad syntax. Cannot verify without running.

---

## Bugs and Logic Errors

**11. [FAIL] Custom tag added in Detail Screen is not persisted**
`handleAddCustomTag` in [app/detail/[id].tsx:129-138](app/detail/%5Bid%5D.tsx#L129-L138) updates component state but never calls `saveCustomTags`. Compare with [components/NewActivityModal.tsx:53-57](components/NewActivityModal.tsx#L53-L57), which correctly calls `saveCustomTags(updated)`. Any custom tag created from the Detail Screen disappears after a restart and never appears in the History Screen tag filter row.

**12. [FAIL] Total duration display does not reflect unsaved time edits**
[app/detail/[id].tsx:234-242](app/detail/%5Bid%5D.tsx#L234-L242) computes a local `totalDuration` variable, but the `.map()` callback returns every segment unchanged — the comment `// Use edited values for display` is misleading dead code. The rendered duration badge at line 256 reads `record.totalDuration` (the last saved value), so the displayed total never updates while the user is editing start/end times.

**13. [WARN] Redundant branch in single-segment time edit logic**
[app/detail/[id].tsx:165-177](app/detail/%5Bid%5D.tsx#L165-L177): the `map` already applies `newStart` at `i === 0`. The subsequent `if (updatedSegments.length === 1)` block then overwrites the same element with both `start` and `end`. The result is correct, but the dual-write is confusing and hides the intent.

**14. [WARN] Cross-midnight sessions cannot be edited**
`parseTimeInput` ([app/detail/[id].tsx:46-57](app/detail/%5Bid%5D.tsx#L46-L57)) reconstructs a full datetime by replacing only the time portion of `referenceDate`. For a session that spans midnight (e.g. 23:30 → 00:30), parsing the end time with the same calendar date as the start produces a timestamp that is *earlier* than the start. The `newStart >= newEnd` guard then blocks the save, making cross-midnight sessions permanently uneditable.

---

## Missing Error Handling

**15. [WARN] Detail Screen load failure shows no error to the user**
The `catch` block in [app/detail/[id].tsx:108-110](app/detail/%5Bid%5D.tsx#L108-L110) only calls `setLoading(false)` — no error state is set, so the user sees a blank screen with no indication of what went wrong. The History Screen has a visible `loadError` banner for the same scenario; the Detail Screen should too.

**16. [WARN] Storage write failures are silently swallowed**
`saveRecords` ([storage/storage.ts:17-23](storage/storage.ts#L17-L23)) and the write path inside `deleteRecord` ([storage/storage.ts:40-43](storage/storage.ts#L40-L43)) catch errors and log them, but return `void` to callers regardless. A disk-full or quota-exceeded error would appear to succeed, leaving the user thinking their data was saved when it was not.

**17. [WARN] Clearing all tags in Detail Screen silently reverts to old tags**
[app/detail/[id].tsx:185](app/detail/%5Bid%5D.tsx#L185) uses `tags.length > 0 ? tags : record.tags` as a silent fallback. If the user deliberately deselects every tag and saves, the alert says "Saved successfully" but the tags are unchanged. The screen should show an inline validation error instead.

---

## Code Quality

**18. [WARN] `generateId` is copy-pasted in two files**
The function is defined identically at [app/index.tsx:24-26](app/index.tsx#L24-L26) and [app/timer.tsx:22-24](app/timer.tsx#L22-L24). It should be extracted to a shared utility (e.g. `utils/id.ts`) and imported where needed.

**19. [WARN] File structure deviates from SPEC**
The SPEC specifies `App.tsx`, `screens/HistoryScreen.tsx`, `screens/TimerScreen.tsx`, and `screens/DetailScreen.tsx`. The actual project uses Expo Router's file-based conventions (`app/_layout.tsx`, `app/index.tsx`, `app/timer.tsx`, `app/detail/[id].tsx`). This is likely an intentional architectural choice, but it is an undocumented deviation from the SPEC.

---

## Summary

| Severity | Count |
|----------|-------|
| FAIL     | 3     |
| WARN     | 7     |
| PASS     | 9     |

**Top priorities to fix:**
1. **AC7** — auto-save (or at least a "save on back" prompt) in the Detail Screen.
2. **Finding 11** — call `saveCustomTags` when a custom tag is created from the Detail Screen.
3. **Finding 15** — surface a visible error state when the Detail Screen fails to load.
