# Ananke — Features and UI

## Custom Views

Ananke provides two custom views extending Obsidian's `ItemView`.

| VIEW_TYPE | Class Name | Purpose |
|---|---|---|
| `ananke-daily-plan` | `AnankeDailyPlanView` | Daily Plan View (main view) |
| `ananke-routine-manager` | `AnankeRoutineManagerView` | Routine Manager View |

Location: `src/Views/`

---

## Daily Plan View

### Layout

```
┌─────────────────────────────────────────────┐
│ [←] Thu, Feb 12, 2026  [→]  [Today]         │
│                                             │
│  Projected End: 18:30 │ Remaining: 8 │ Total: 6h │
├─────────────────────────────────────────────┤
│                                             │
│  ── Morning ────────────────────────         │
│                                             │
│  ☐ 07:00  Morning Prep          30m   [▶]   │
│  ☑ 07:30  Standup               15m   12m   │
│                                             │
│  ── AM ─────────────────────────────         │
│                                             │
│  ☑ 07:45  Check Email           20m   23m   │
│  ▶ 08:15  Implement Feature A  120m  [⏸][⏹] │
│     ↳ Elapsed: 45:23                        │
│  ☐ 10:15  Code Review           30m   [▶]   │
│                                             │
│  ── PM ─────────────────────────────         │
│                                             │
│  ☐ 12:00  Lunch                 60m   [▶]   │
│  ☐ 13:00  Write Documentation   90m   [▶]   │
│                                             │
│  [+ Add Task]                               │
├─────────────────────────────────────────────┤
│  Current: Implement Feature A | Elapsed 45:23 | End 18:30 │
└─────────────────────────────────────────────┘
```

### Header

- **Date Navigation**: Navigate to the previous/next day with arrow buttons. "Today" button returns to the current day
- **Summary Information**:
  - Projected end time: Calculated by accumulating estimated durations of incomplete tasks from the current time
  - Remaining tasks: Count of `pending` + `in_progress` tasks
  - Total estimated time: Sum of estimated durations for all tasks

### Data Sources

The daily plan view merges two data sources for display:

- **Daily plan file** (`daily/YYYY-MM-DD.md`): Task plan definitions (name, estimated duration, section, order)
- **Time log CSV** (`logs/YYYY-MM.csv`): Task execution records (status, actual durations)

Tasks are matched between plan and log using `order` and `task_name` as keys. Tasks without a corresponding log entry are displayed as "not started."

### Task List

- **Section headers**: Tasks are grouped by their `section` value. Tasks without a section are placed in an "Other" group
- **Task row elements**:
  - Status icon: ☐ (not started) / ▶ (in progress) / ☑ (completed) / ☒ (skipped) (based on CSV status)
  - Planned start time (auto-calculated from the previous task)
  - Task name
  - Estimated duration
  - Actual duration (completed tasks only; retrieved from CSV; color-coded when significantly different from estimate)
  - Action buttons

### Task Actions

| Button | Display Condition | Action |
|---|---|---|
| ▶ (Start) | `pending` and no other task is `in_progress` | Record an `in_progress` entry in CSV. Record `actual_start` with the current time |
| ⏸ (Pause) | `in_progress` | Update the CSV entry to `pending`. Elapsed time is preserved |
| ⏹ (Complete) | `in_progress` | Update the CSV entry to `completed`. Record `actual_end` and `actual_min` |
| ✕ (Skip) | `pending` | Record a `skipped` entry in CSV |

> All execution state changes are recorded **only in the time log CSV**. The daily plan file is not modified.

### Task Reordering

- Tasks can be reordered via drag and drop
- Uses the HTML Drag and Drop API
- After reordering, `order` values and planned start times are recalculated and saved to the file

### Adding Tasks

- The "+ Add Task" button displays an inline form
- Input fields: Task name (required), estimated duration (required, in minutes), section (optional), category (optional)
- "Add from Routine": Select and add from the routine list (implemented in Phase 3)

### Editing Tasks

- Click the task name to switch to edit mode
- Estimated duration: Numeric input field
- Section/Category: Text input (with autocomplete from previously used values)

### Deleting Tasks

- Right-click a task row to show a context menu
- Select "Delete Task"

---

## Task Execution and Timer

### Timer Behavior

1. **Start**: Pressing ▶ records `actual_start` in CSV and updates the elapsed time every second via `setInterval`
2. **Display**: Shows "Elapsed: MM:SS" below the active task. Turns red when the estimated duration is exceeded
3. **Complete**: Pressing ⏹ records `actual_end` and `actual_min` in CSV
4. **Pause**: Pressing ⏸ records the elapsed time in CSV and reverts to `pending`. On resume, elapsed time is accumulated

### Timer Persistence

- Uses `plugin.registerInterval` for lifecycle management
- On Obsidian restart, elapsed time is recalculated from the difference between the `actual_start` recorded in CSV and the current time

### Concurrent Execution Restriction

Following the TaskChute method principle, **only one task can be running at a time**. When attempting to start a task while another is in progress, a confirmation dialog is shown:

- "Complete the current task and start the new task"
- "Pause the current task and start the new task"
- "Cancel"

---

## Routine Manager View

### Layout

```
┌─────────────────────────────────────────────┐
│ Routine Manager            [+ New Routine]   │
├─────────────────────────────────────────────┤
│                                             │
│  ▼ Work (3)                                 │
│    ☑ Standup Meeting        15m  Weekdays    │
│    ☑ Check Email            20m  Daily       │
│    ☐ Weekly Report          60m  Every Fri   │
│                                             │
│  ▼ Life (2)                                 │
│    ☑ Morning Preparation    30m  Daily       │
│    ☑ Exercise               45m  Mon/Wed/Fri │
│                                             │
│  ▼ Personal (1)                             │
│    ☑ Reading                30m  Daily       │
│                                             │
└─────────────────────────────────────────────┘
```

### Creating Routines

The "+ New Routine" button opens a modal dialog.

Input fields:
- Task name (required)
- Estimated duration (required, in minutes)
- Category (optional)
- Section (optional)
- Recurrence type: Daily / Weekly (select days) / Monthly (select dates) / Every N days
- Notes (optional, Markdown)

### Editing Routines

- Click a routine name to open a detail panel
- All fields are editable inline
- "Open in Markdown" button opens the corresponding `.md` file directly in the Obsidian editor

### Enabling/Disabling Routines

- Toggle `enabled` via a checkbox
- Disabled routines are excluded from daily plan auto-generation

### Deleting Routines

- "Delete Routine" from the context menu
- After a confirmation dialog, moved to trash via `vault.trash`

---

## Projected End Time Calculation

### Calculation Logic

```
projected_end = current_time + sum(remaining_tasks.estimated_duration)
```

If there is an `in_progress` task, the remaining time (estimated duration minus elapsed time) is added.

### Display Locations

- **Header**: Always displayed in the daily plan view header
- **Status bar**: Displayed in the Obsidian status bar

### Update Triggers

- When a task is started, completed, or skipped
- When a task is added, deleted, or reordered
- When a task's estimated duration is changed
- Every time the elapsed time of the active task increments by 1 minute

---

## Commands

| Command ID | Name | Action |
|---|---|---|
| `open-daily-plan` | Open Today's Plan | Open/focus the daily plan view |
| `open-routine-manager` | Open Routine Manager | Open the routine manager view |
| `start-next-task` | Start Next Task | Start the first `pending` task as `in_progress` |
| `complete-current-task` | Complete Current Task | Complete the `in_progress` task as `completed` |
| `add-task` | Add Task | Open the add task modal |
| `show-today-summary` | Show Today's Summary | Display today's progress via `Notice` |

No default hotkeys are set (users can configure their own).

---

## Ribbon Icon

| Icon | Tooltip | Action |
|---|---|---|
| `clock` (Lucide) | Ananke: Today's Plan | Open the daily plan view |

### State Display

- Task in progress: Apply pulse animation
- All tasks completed: Display a checkmark badge

---

## Settings

### Setting Items

| Item | Type | Default | Phase | Description |
|---|---|---|---|---|
| `taskFolder` | `string` | `"ananke-tasks"` | Existing | Task folder path |
| `defaultStartTime` | `string` | `"07:00"` | 1 | Default start time (HH:mm) |
| `showStatusBar` | `boolean` | `true` | 1 | Show information in the status bar |
| `timerNotification` | `boolean` | `true` | 2 | Notify when estimated duration is exceeded |
| `autoStartNextTask` | `boolean` | `false` | 2 | Automatically start the next task after completing one |
| `autoGenerateDailyPlan` | `boolean` | `true` | 3 | Enable automatic daily plan generation |
| `reviewPeriodDays` | `number` | `30` | 4 | Analysis period for review (days) |

### Settings Tab Sections

1. **Folder Settings**: Task folder
2. **Plan Settings**: Default start time
3. **Timer Settings**: Notification, auto-start
4. **Routine Settings**: Auto-generation
5. **Analysis Settings**: Analysis period

---

## Platform Support

### Current Target

Desktop Obsidian only. `manifest.json`'s `isDesktopOnly` is kept as `false` to prepare for future mobile support, but no mobile-specific UI implementation is done at this time.

### Platform-specific Rendering Design

To prepare for future mobile support, the UI is designed to allow platform-specific behavior switching.

1. **Platform detection**: Use `Platform.isDesktop` / `Platform.isMobile` (Obsidian API) to determine the platform
2. **View rendering separation**: Separate custom view rendering into platform-independent logic and platform-dependent UI construction. Views receive a common data model and build platform-appropriate DOM
3. **Interaction abstraction**: Abstract interactions such as drag-and-drop and context menus so they can be swapped for touch operations in the future

### CSS Structure

```
styles.css
├── .ananke-daily-plan-view
│   ├── .ananke-header
│   ├── .ananke-summary
│   ├── .ananke-section
│   ├── .ananke-task-row
│   │   ├── .ananke-task-status
│   │   ├── .ananke-task-time
│   │   ├── .ananke-task-name
│   │   ├── .ananke-task-duration
│   │   └── .ananke-task-actions
│   └── .ananke-add-task
├── .ananke-routine-view
└── .ananke-timer-active       /* Animation */
```

CSS classes use the `ananke-` prefix to prevent conflicts with other plugins and themes.

---

## Review and Analysis Features (Phase 4)

### Summary Display

Display the following in the header of the daily plan view for completed days:

- Planned task count / completed task count / skipped count
- Estimated total vs. actual total
- Estimation accuracy (average of actual/estimated ratio)

### Per-routine Analysis

Add an "Analysis" tab to the routine manager view:

- Estimated vs. actual duration trends per routine (text-based bar chart implemented in HTML/CSS)
- Display average actual duration
- "Update estimate to actual average" button

### Past Log Reference

- When viewing a past date, display that day's log and plan in read-only mode
- Extract entries for the selected day from CSV for display
