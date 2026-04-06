# SPEC.md — Activity Time Tracker

## App Overview
A mobile app for logging and timing personal activities. The user starts a
timer before beginning any activity (coding, gym, homework, etc.), pauses
and resumes as needed, and stops when done. Each completed session is saved
as a record with timestamps, total duration, tags, and an optional journal
note. The user can browse, search, and filter all past records.

---

## End-to-End User Flow
This section describes the full app experience from the user's perspective,
in linear order.

The user opens the app and lands on the History Screen. If there are no
records yet, a friendly empty state message is shown (e.g., "No activities
yet — tap + to start tracking"). If a session was previously active and the
app was killed/backgrounded, the user is immediately redirected to the Timer
Screen instead.

To start a new activity, the user taps the "+" floating action button. A
modal appears asking for an activity name (required) and one or more tags
(at least one required, chosen from the 5 fixed tags or a custom tag). The
user taps "Start" and is taken to the Timer Screen.

On the Timer Screen, the user sees the activity name, elapsed time counting
up in HH:MM:SS, and Pause / Resume / Stop buttons. The user can pause and
resume as many times as needed — paused time is not counted. When the user
taps "Stop", a Post-Session Notes modal appears. The user can optionally
write a journal entry (e.g., "finished the hard part, still need to review
section 3") and tap "Save & Close", or tap "Skip" to dismiss without a note.
Either way, the record is saved and the user is returned to the History
Screen where the new record appears at the top.

To review a past record, the user taps any card on the History Screen. The
Detail Screen opens, showing the activity name, tags, total duration, all
time segments (e.g., 13:33–14:01, 15:09–15:30), and the journal note. The
user can edit the activity name, tags, the first start time, the last end
time, and the note. Changes are saved automatically or on explicit save.

To find a specific record, the user can type in the search bar (filters by
activity name in real time) or tap a tag chip (filters to records with that
tag). Both filters can be active simultaneously.

---

## File Structure
The project should be organized as follows.

`App.tsx` is the root entry point. It sets up the navigation stack and checks
on startup whether an active session exists, redirecting to the Timer Screen
if so.

`screens/HistoryScreen.tsx` contains the History Screen UI and logic,
including the search bar, tag filter chips, and the list of record cards.

`screens/TimerScreen.tsx` contains the Timer Screen UI and all timer logic
(start, pause, resume, stop, elapsed time calculation from segments).

`screens/DetailScreen.tsx` contains the Detail Screen UI and edit logic.

`components/NewActivityModal.tsx` is the modal for entering activity name
and tags before starting a session.

`components/PostSessionModal.tsx` is the modal for entering optional notes
after stopping a session.

`storage/storage.ts` is the single module that encapsulates all AsyncStorage
reads and writes. No other file should call AsyncStorage directly — all
persistence goes through this module. This makes it easy to swap out the
storage layer later if needed.

`types.ts` defines all shared TypeScript types and interfaces, in particular
the `ActivityRecord` and `TimeSegment` types.

`constants.ts` defines the 5 fixed tags and any other app-wide constants
such as color values and AsyncStorage key names.

---

## Screens & Navigation

### Screen 1: History Screen (Root Screen)
This is the home screen. It shows all completed activity records in reverse
chronological order (most recent first).

**UI Elements:** A prominent "+" floating action button (bottom right) to
start a new activity. A search bar at the top for searching by activity name
(partial match, case-insensitive). A horizontal scrollable row of tag filter
chips below the search bar: "All", "工作", "生活", "学习", "娱乐", "锻炼",
plus any custom tags the user has created. Only one tag filter chip can be
active at a time. Each record card displays: activity name, date, total
duration, and tags.

**Navigation:** Tapping "+" opens the New Activity Modal then navigates to
the Timer Screen. Tapping a record card navigates to the Detail Screen.

### New Activity Modal
A bottom sheet that appears when the user taps "+".

**Fields:** Activity name (required text input). Tag selector: pick one or
more from the 5 fixed tags, or type a custom tag. A "Start" button that
validates input, dismisses the modal, and navigates to the Timer Screen.

### Screen 2: Timer Screen
This screen is shown whenever there is an active (in-progress) session. If
the user backgrounds the app and returns, this screen must be shown
automatically as long as a session is active.

**UI Elements:** Activity name and tags at the top. A large elapsed time
display (HH:MM:SS) showing total active time only (paused intervals
excluded). Start time shown as a static label, e.g. "Started: Apr 6,
13:33". A "Pause / Resume" toggle button. A "Stop" button.

**Behavior:** Time is tracked using timestamps, not a simple incrementing
counter. Each pause records a pause timestamp; each resume records a resume
timestamp. Elapsed time is computed as the sum of all completed
[start, end] segment durations plus the current ongoing segment if active.
This ensures accuracy even if the app was backgrounded. Tapping "Stop"
finalizes the last segment, saves the session, and opens the Post-Session
Notes Modal.

### Post-Session Notes Modal
Appears immediately after the user taps "Stop". Contains a title ("How did
it go?"), a multi-line text input for optional notes, a "Save & Close"
button, and a "Skip" button. Either action saves the record and navigates
back to the History Screen.

### Screen 3: Detail Screen
Shown when the user taps a completed record card.

**UI Elements:** Activity name (editable). Tags (editable). Total duration
prominently at top, e.g. "Total: 49 min". List of all time segments, e.g.
"13:33 – 14:01" and "15:09 – 15:30". Editable first-start time and
last-end time. Journal/notes field (editable). A "Delete Record" button at
the bottom (with a confirmation dialog before deletion).

---

## Data Model

Each activity record contains the following fields. `id` is a unique UUID
string. `name` is the activity name entered by the user. `tags` is an array
of strings (mix of fixed and custom tags). `segments` is an array of objects
each with a `start` and `end` field (ISO timestamp strings). `totalDuration`
is a number in milliseconds, always computed from segments and never stored
as a user-editable value. `notes` is a string or null. `createdAt` is the
ISO timestamp of when the session was first started.

In addition to completed records, the currently active session (if any) is
persisted separately under its own AsyncStorage key. This active session
record stores all of the above fields plus a `isPaused` boolean and the
`currentSegmentStart` timestamp of the ongoing segment (if not paused).

---

## Data Persistence
All completed records, all custom tags, and the active session state (if
any) are stored locally using AsyncStorage. The storage module uses the
following keys: `@records` for the array of completed ActivityRecord objects,
`@customTags` for the array of user-created tag strings, and `@activeSession`
for the in-progress session object (null if no session is active).

---

## Error Handling
The following error cases must be handled gracefully.

**AsyncStorage read failure on app launch.** If loading records or the active
session from AsyncStorage throws an error, the app should catch the error,
log it to the console, and display the History Screen with an empty list
rather than crashing. A non-intrusive warning message may be shown (e.g.,
"Could not load saved data").

**User attempts to start a session without filling required fields.** If the
activity name field is empty when the user taps "Start" in the New Activity
Modal, the app should show an inline validation error ("Please enter an
activity name") and not proceed to the Timer Screen.

**User attempts to start a second session while one is already active.** The
"+" button should be disabled or hidden on the History Screen whenever an
active session exists. If the Timer Screen is somehow bypassed, the app
should detect the existing active session and redirect the user to the Timer
Screen rather than creating a conflicting second session.

**App killed mid-session (crash or force-quit).** On next launch, the app
should detect the persisted `@activeSession` key, recover the session state,
and navigate directly to the Timer Screen. The elapsed time should be
correctly recomputed from the stored segments and the stored
`currentSegmentStart` timestamp.

**User edits start/end time to an invalid value on the Detail Screen.** If
the edited start time is after the end time, or if the end time is before
the start time, the app should show an inline error and revert to the
previous valid value rather than saving the invalid state.

---

## Fixed Tags
The five fixed tags are Work, Life, Study, Entertainment, and Gym. These are defined
in `constants.ts` and cannot be deleted or renamed by the user. Custom tags
created by the user are stored in AsyncStorage under `@customTags` and
persist across sessions.

---

## Visual Style
Dark theme with a dark navy or charcoal background and a warm amber accent
color for interactive elements (buttons, active tag chips, the running timer
digits). Typography should be clean and minimal — a monospace or semi-mono
font for the timer digits gives a dev-tool aesthetic. The overall feel should
be functional and uncluttered, with consistent padding and clear visual
hierarchy. The timer digits on the Timer Screen should be large and
immediately readable at a glance.

---

## Acceptance Criteria
1. The user can create a new activity with a name and at least one tag; the
   Timer Screen appears immediately and begins counting elapsed time.
2. Pausing and resuming correctly excludes paused intervals: if the user runs
   for 10 minutes, pauses for 5, then runs for 10 more, the displayed total
   is 20 minutes, not 25.
3. After stopping a session and optionally adding a note, the completed
   record appears at the top of the History Screen with the correct total
   duration and tag(s).
4. If the app is backgrounded or killed during an active session and then
   reopened, the Timer Screen is shown and the elapsed time is accurate based
   on stored timestamps.
5. Typing a partial activity name in the search bar (e.g., "gym") filters the
   History Screen in real time to show only records whose names contain that
   string (case-insensitive).
6. Tapping a tag chip (e.g., "Learning") filters the History Screen to show only
   records tagged with "Learning"; tapping "All" restores the full list.
7. On the Detail Screen, editing the journal note and navigating away
   persists the change — reopening the record shows the updated note.
8. On the Detail Screen, attempting to set the start time to a value after
   the end time shows a validation error and does not save the invalid value.
9. Deleting a record from the Detail Screen removes it from the History
   Screen immediately and it does not reappear after restarting the app.
10. The app launches without errors on Expo Go or a simulator after a fresh
    `npm install` and `npx expo start`.