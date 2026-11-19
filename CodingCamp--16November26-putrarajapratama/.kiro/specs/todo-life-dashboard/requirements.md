# Requirements Document

## Introduction

The To-Do List Life Dashboard is a personal productivity static website built with HTML, CSS, and Vanilla JavaScript. It runs entirely in the browser with no backend, persisting all user data in LocalStorage. The dashboard combines four core widgets — a greeting with live clock, a Pomodoro focus timer, a task manager, and a quick-links launcher — into a single clean, minimal page. It must work in Chrome, Firefox, Edge, and Safari as either a standalone web app or a browser extension.

## Glossary

- **Dashboard**: The single HTML page that hosts all four widgets.
- **Widget**: A self-contained UI section on the Dashboard (Greeting, Focus_Timer, Task_List, Quick_Links).
- **Greeting_Widget**: The widget that displays the current time, date, and a time-of-day greeting.
- **Focus_Timer**: The Pomodoro-style countdown timer widget.
- **Task_List**: The to-do list widget where the user manages tasks.
- **Task**: A single to-do item with a title, completion state, and an optional edit state.
- **Quick_Links**: The widget that displays user-saved shortcut buttons that open external URLs.
- **Link**: A Quick_Links entry containing a label and a URL.
- **LocalStorage**: The browser's `localStorage` API used as the sole persistence layer.
- **Modern_Browser**: Chrome (latest), Firefox (latest), Edge (latest), and Safari (latest).
- **Pomodoro_Session**: A 25-minute focused work interval as defined by the Pomodoro Technique.
- **Idle**: The state of the Focus_Timer when it has not been started or has been reset.
- **Running**: The state of the Focus_Timer when it is actively counting down.
- **Paused**: The state of the Focus_Timer when it has been stopped mid-countdown.

---

## Requirements

### Requirement 1: Live Greeting and Clock

**User Story:** As a user, I want to see the current time, date, and a greeting based on the time of day, so that I can orient myself and feel welcomed when I open the Dashboard.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current local time in HH:MM:SS 24-hour format, updated every second.
2. THE Greeting_Widget SHALL display the current local date in the format "Weekday, Month DD, YYYY" (e.g., "Monday, November 19, 2026"), where Weekday is the full day name and Month is the full month name.
3. WHEN the local hour is between 05:00 and 11:59 (inclusive), THE Greeting_Widget SHALL display the greeting "Good Morning".
4. WHEN the local hour is between 12:00 and 17:59 (inclusive), THE Greeting_Widget SHALL display the greeting "Good Afternoon".
5. WHEN the local hour is between 18:00 and 23:59 or between 00:00 and 04:59 (inclusive), THE Greeting_Widget SHALL display the greeting "Good Evening".
6. THE Greeting_Widget SHALL update the greeting text automatically without requiring a page reload when the local hour crosses a boundary.
7. IF the system clock is unavailable or returns an invalid value, THEN THE Greeting_Widget SHALL display a placeholder indicating time is unavailable in place of the time, date, and greeting fields.

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute Pomodoro-style countdown timer with Start, Stop, and Reset controls, so that I can structure focused work sessions directly from the Dashboard.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialize in the Idle state with the display set to 25:00.
2. WHEN the user activates the Start control while the Focus_Timer is in the Idle state, THE Focus_Timer SHALL transition to the Running state and count down one second per real second.
3. WHEN the user activates the Start control while the Focus_Timer is in the Paused state, THE Focus_Timer SHALL transition to the Running state and resume counting down from the retained remaining time.
4. WHILE the Focus_Timer is in the Running state, THE Focus_Timer SHALL update the displayed MM:SS countdown every second.
5. WHEN the user activates the Stop control while the Focus_Timer is in the Running state, THE Focus_Timer SHALL transition to the Paused state and retain the remaining time.
6. WHEN the user activates the Reset control in any state, THE Focus_Timer SHALL transition to the Idle state and reset the display to 25:00.
7. WHEN the Focus_Timer countdown reaches 00:00, THE Focus_Timer SHALL transition to the Idle state, reset the display to 25:00, and play an audible signal lasting between 1 and 3 seconds.
8. WHILE the Focus_Timer is in the Running state, THE Focus_Timer SHALL disable the Start control to prevent duplicate timers.
9. WHILE the Focus_Timer is in the Idle state, THE Focus_Timer SHALL disable the Stop control.
10. WHILE the Focus_Timer is in the Paused state, THE Focus_Timer SHALL disable the Stop control.

---

### Requirement 3: To-Do Task Management

**User Story:** As a user, I want to add, edit, mark as done, and delete tasks, with all tasks saved automatically in LocalStorage, so that my task list persists across browser sessions.

#### Acceptance Criteria

1. THE Task_List SHALL provide an input field accepting up to 200 characters and a submit control that, when activated, adds a new Task with the trimmed input text as its title and a default completion state of incomplete.
2. IF the user attempts to submit an empty or whitespace-only title, THEN THE Task_List SHALL reject the submission and display an inline validation message without adding a Task.
3. WHEN a Task is added, edited, or deleted, THE Task_List SHALL write the updated task array to LocalStorage under the fixed key `"tasks"`.
4. WHEN the Dashboard loads, THE Task_List SHALL read the task array from LocalStorage under the key `"tasks"` and render all previously saved Tasks in their last-known state within 300 milliseconds.
5. WHEN the user activates the complete control on an incomplete Task, THE Task_List SHALL mark that Task as complete and apply a strikethrough style to its title.
6. WHEN the user activates the complete control on a complete Task, THE Task_List SHALL mark that Task as incomplete and remove the strikethrough style from its title.
7. WHEN the user activates the edit control on a Task, THE Task_List SHALL replace the Task title display with an editable text field pre-populated with the current title and accepting up to 200 characters.
8. WHEN the user confirms an edit, THE Task_List SHALL update the Task title to the trimmed new value, persist the change to LocalStorage under the key `"tasks"`, and return to the display state.
9. IF the user confirms an edit with an empty or whitespace-only value, THEN THE Task_List SHALL discard the change, restore the previous title without modifying LocalStorage, and return to the display state.
10. WHEN the user activates the delete control on a Task, THE Task_List SHALL remove that Task from the list and write the updated task array to LocalStorage under the key `"tasks"`.
11. IF LocalStorage is unavailable or write fails, THEN THE Task_List SHALL display an error message indicating the task could not be saved and retain the Task in the in-memory list.

---

### Requirement 4: Quick Links

**User Story:** As a user, I want to save and manage shortcut buttons that open my favorite websites, so that I can launch frequently visited pages directly from the Dashboard.

#### Acceptance Criteria

1. THE Quick_Links widget SHALL provide an input form that accepts a label of 1–50 characters and a URL of 1–2048 characters to create a new Link.
2. IF the user submits the Link form with an empty label or an empty URL, THEN THE Quick_Links widget SHALL reject the submission and display an inline validation message indicating which field is empty, without creating a Link.
3. IF the user submits the Link form with a URL that does not begin with "http://" or "https://", THEN THE Quick_Links widget SHALL reject the submission and display an inline validation message indicating the URL scheme requirement, without creating a Link.
4. IF the total number of saved Links has reached 20, THEN THE Quick_Links widget SHALL reject any new Link submission and display an inline validation message indicating the maximum limit has been reached.
5. WHEN a Link is added or removed, THE Quick_Links widget SHALL write the updated link array to LocalStorage under a fixed key within 500 milliseconds of the change.
6. WHEN the Dashboard loads, THE Quick_Links widget SHALL read the link array from LocalStorage and render a button for each saved Link within 500 milliseconds of load.
7. IF no link array exists in LocalStorage at Dashboard load, THEN THE Quick_Links widget SHALL render the Quick Links section with an empty list and no error.
8. WHEN the user activates a Link button, THE Quick_Links widget SHALL open the associated URL in a new browser tab.
9. WHEN the user activates the remove control on a Link, THE Quick_Links widget SHALL remove that Link from the displayed list and from LocalStorage within 500 milliseconds.

---

### Requirement 5: Technical Constraints

**User Story:** As a developer, I want the Dashboard built with only HTML, CSS, and Vanilla JavaScript, so that it requires no build tools, no framework installation, and no backend.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented using only HTML, CSS, and Vanilla JavaScript with no external frameworks, libraries, or build tools.
2. THE Dashboard SHALL contain exactly one CSS file located at `css/style.css`.
3. THE Dashboard SHALL contain exactly one JavaScript file located at `js/app.js`.
4. THE Dashboard SHALL function correctly in Modern_Browser without any additional configuration.
5. THE Dashboard SHALL be fully usable as a standalone web app opened directly from the filesystem or served from a static host.

---

### Requirement 6: Performance and Usability

**User Story:** As a user, I want the Dashboard to load instantly, respond without lag, and present a clean, readable layout, so that it stays out of the way and lets me focus on my work.

#### Acceptance Criteria

1. THE Dashboard SHALL render all widgets and restore LocalStorage data within 500ms of the initial page load on a modern device.
2. THE Dashboard SHALL apply a responsive layout that remains usable on viewport widths from 320px to 1920px.
3. THE Dashboard SHALL apply a clear visual hierarchy by using consistent spacing, font sizes, and color contrast so that each widget is visually distinct.
4. THE Dashboard SHALL use a readable body font with a minimum size of 14px for all Task and Link labels.
5. WHEN the user interacts with any control (button, input, timer), THE Dashboard SHALL reflect the updated state within 100ms.
