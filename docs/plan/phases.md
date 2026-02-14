# Ananke — Implementation Phases

## Phase Overview

| Phase | Name | Key Deliverables | Prerequisites |
|---|---|---|---|
| Phase 1 | Core Data Model + Basic Plan View | Data models, file read/write, manual daily plan creation and display | None |
| Phase 2 | Time Tracking (Log) | Timer, CSV recording, actual duration display | Phase 1 |
| Phase 3 | Routine System | Routine definitions, auto-expansion, routine manager view | Phase 1 |
| Phase 4 | Review and Analysis | Statistics display, estimation improvement suggestions, past log reference | Phase 2, Phase 3 |

### Dependencies

```
Phase 1 ──→ Phase 2 ──→ Phase 4
   │                       ↑
   └──────→ Phase 3 ──────┘
```

Phase 2 and Phase 3 can be developed in parallel after Phase 1 is complete. Phase 4 depends on both Phase 2 and Phase 3.

---

## Phase 1: Core Data Model + Basic Plan View

### Goals

- Implement TypeScript definitions for the data models
- Implement Markdown file read/write (parser/serializer)
- Implement the basic daily plan view display
- Implement manual task add/delete/reorder

### Implementation Tasks

#### 1-1. Project Structure Setup

Create new directories and place interface definition files.

- `src/Models/` — `ITask.ts`, `IRoutine.ts`, `IRecurrence.ts`, `IDailyPlan.ts`, `ITimeLogEntry.ts`
- `src/Views/` — Custom views
- `src/Services/` — Business logic for file operations
- `src/Parsers/` — Markdown / CSV parsers

#### 1-2. Markdown Parser Implementation

`src/Parsers/DailyPlanParser.ts`:

- `parse(content: string): IDailyPlan` — Parse a Markdown string and return an IDailyPlan object
- `serialize(plan: IDailyPlan): string` — Convert an IDailyPlan object to a Markdown string
- Frontmatter parsing
- Inline field parsing: Extract fields with the regex `\[(\w[\w-]*)::([^\]]*)\]`
- Task row parsing: `- HH:mm TaskName [inline fields...]` format (no checkboxes)

#### 1-3. Folder Management Service Implementation

`src/Services/FolderService.ts`:

- `ensureFolder(path: string): Promise<void>` — Create folder if it doesn't exist
- `initializeStructure(): Promise<void>` — Create `taskFolder/{daily, routines, logs}`

#### 1-4. Daily Plan Service Implementation

`src/Services/DailyPlanService.ts`:

- `loadPlan(date: string): Promise<IDailyPlan | null>` — Load the plan for a given date
- `savePlan(plan: IDailyPlan): Promise<void>` — Save the plan to a Markdown file
- `addTask(date: string, task: ITask): Promise<void>` — Add a task
- `removeTask(date: string, order: number): Promise<void>` — Remove a task
- `reorderTasks(date: string, newOrder: number[]): Promise<void>` — Reorder tasks
- `recalculateStartTimes(plan: IDailyPlan): IDailyPlan` — Recalculate planned start times

#### 1-5. Daily Plan View Implementation

`src/Views/DailyPlanView.ts` (extends `ItemView`):

- Date navigation (previous day / next day / today)
- Task list display (grouped by section)
- Task add form
- Task delete (context menu)
- Drag-and-drop reordering

#### 1-6. Plugin Integration

Update `src/Obsidian/Ananke.ts`'s `onload()`:

- Remove sample commands, ribbon icon, and event listeners
- Register views
- Register commands (`open-daily-plan`, `add-task`)
- Register ribbon icon (`clock`)
- Set up status bar
- Extend settings (`defaultStartTime`, `showStatusBar`)

#### 1-7. i18n Updates

- Add translation keys for views and commands to `assets/i18n/ja.json`
- Update `LocalizeEntity` in `src/i18n/ILocalizeKey.ts`

#### 1-8. CSS Implementation

- Write daily plan view styles in `styles.css`
- Structure that supports platform-specific rendering for future mobile support

### Deliverables

- A daily plan view capable of manual task management
- Persistence to Markdown files

---

## Phase 2: Time Tracking (Log)

### Goals

- Implement task start/complete/skip operations
- Implement timer display
- Implement CSV log writing
- Display active task information in the status bar

### Prerequisites

Phase 1 must be complete

### Implementation Tasks

#### 2-1. CSV Parser Implementation

`src/Parsers/TimeLogParser.ts`:

- `parse(content: string): ITimeLogEntry[]` — Parse a CSV string
- `serializeEntry(entry: ITimeLogEntry): string` — Convert one entry to a single CSV row string
- `serializeHeader(): string` — Return the CSV header row
- Simple RFC 4180-compliant parser (no external libraries)

#### 2-2. Time Log Service Implementation

`src/Services/TimeLogService.ts`:

- `appendLog(entry: ITimeLogEntry): Promise<void>` — Append one row to the monthly CSV file
- `loadLogs(yearMonth: string): Promise<ITimeLogEntry[]>` — Load a monthly CSV
- `getLogsByDate(date: string): Promise<ITimeLogEntry[]>` — Get logs for a given date
- `getLogsByRoutineId(routineId: string, periodDays?: number): Promise<ITimeLogEntry[]>` — Search past logs by routine ID

#### 2-3. Timer Service Implementation

`src/Services/TimerService.ts`:

- `startTask(task: ITask): void` — Start the timer
- `stopTask(): ITimerResult` — Stop the timer
- `pauseTask(): void` — Pause
- `resumeTask(): void` — Resume
- `getElapsedSeconds(): number` — Get current elapsed seconds
- `isRunning(): boolean` — Whether the timer is running
- `onTick(callback: (elapsed: number) => void): void` — Callback every second
- `onOvertime(callback: () => void): void` — Callback when estimate is exceeded

#### 2-4. Daily Plan View Extension

- Merge daily plan file (plan definitions) and time log CSV (execution records) for display
- Add action buttons to task rows (▶, ⏸, ⏹, ✕)
- Display elapsed time for the active task (calculated from CSV's `actual_start`)
- Display actual duration for completed tasks (from CSV's `actual_min`; color-coded based on difference from estimate)
- Calculate and display projected end time
- Notification when estimated duration is exceeded (`Notice`)

#### 2-5. Status Bar Updates

- Display active task name and elapsed time
- Display projected end time

#### 2-6. Task Execution Operations Implementation

All task execution state is recorded only in the time log CSV. The daily plan file is not updated.

- `TimeLogService.startTask(date: string, task: ITask): Promise<void>` — Record an `in_progress` entry in CSV
- `TimeLogService.completeTask(date: string, task: ITask, actualEnd: string): Promise<void>` — Update CSV entry to `completed`
- `TimeLogService.skipTask(date: string, task: ITask): Promise<void>` — Record a `skipped` entry in CSV

#### 2-7. Settings Extension

- Add `timerNotification` and `autoStartNextTask`

#### 2-8. Concurrent Execution Check

- Check if another task is in progress when starting a task
- Implement confirmation dialog (using `Modal`)

### Deliverables

- Task start/complete/skip functionality
- Real-time timer display
- Log persistence to CSV
- Real-time projected end time calculation

---

## Phase 3: Routine System

### Goals

- Implement routine definition file read/write
- Implement the routine manager view
- Implement daily plan auto-generation

### Prerequisites

Phase 1 must be complete (Phase 2 is not required; can be developed in parallel)

### Implementation Tasks

#### 3-1. Routine Parser Implementation

`src/Parsers/RoutineParser.ts`:

- `parse(content: string, filePath: string): IRoutine`
- `serialize(routine: IRoutine): string`

#### 3-2. Routine Service Implementation

`src/Services/RoutineService.ts`:

- `loadAllRoutines(): Promise<IRoutine[]>` — Load all routines
- `saveRoutine(routine: IRoutine): Promise<void>` — Save a routine to a file
- `createRoutine(routine: ...): Promise<IRoutine>` — Create a new routine
- `deleteRoutine(routine: IRoutine): Promise<void>` — Delete a routine (move to trash)
- `getRoutinesForDate(date: string): Promise<IRoutine[]>` — Get routines applicable to a given date

#### 3-3. Recurrence Evaluation Engine Implementation

`src/Services/RecurrenceEvaluator.ts`:

- `isMatchingDate(recurrence: IRecurrence, date: string): boolean`
  - `daily`: Always true
  - `weekly`: Matches specified days of the week
  - `monthly`: Matches specified dates (including end-of-month handling)
  - `interval`: Matches every `intervalDays` days from `startDate`
  - `excludeDates`: Returns false if the date is in the exclusion list

#### 3-4. Daily Plan Auto-generation Implementation

`src/Services/DailyPlanGenerator.ts`:

- `generate(date: string, routines: IRoutine[], defaultStartTime: string): IDailyPlan`
- Sort order: Section order (Morning → AM → PM → Evening → Other) → routine definition order
- Execute auto-generation in the daily plan view's `onOpen` if the file for the target date doesn't exist

#### 3-5. Routine Manager View Implementation

`src/Views/RoutineManagerView.ts` (extends `ItemView`):

- Display routine list (grouped by category)
- Routine enable/disable toggle
- Routine editing (inline editing)
- "Open in Markdown" button

#### 3-6. Routine Creation Modal Implementation

`src/Views/RoutineCreateModal.ts` (extends `Modal`):

- Input form: Task name, estimated duration, category, section, recurrence type, notes
- Day selection UI (for weekly)
- Date selection UI (for monthly)

#### 3-7. Command and Daily Plan View Extensions

- Register `open-routine-manager` command
- Add "Add from Routine" button
- Display routine icon for routine-derived tasks

### Deliverables

- Routine definition and management
- Auto-generation of daily plans based on routines
- Dedicated routine manager view

---

## Phase 4: Review and Analysis

### Goals

- Analyze and visualize past log data
- Support estimation accuracy improvement

### Prerequisites

Both Phase 2 (time log) and Phase 3 (routines) must be complete

### Implementation Tasks

#### 4-1. Analytics Service Implementation

`src/Services/AnalyticsService.ts`:

- `getDailySummary(date: string): Promise<IDailySummary>` — Get a daily summary
- `getRoutineStats(routineId: string, periodDays: number): Promise<IRoutineStats>` — Get routine statistics
- `getEstimateAccuracy(periodDays: number): Promise<IEstimateAccuracy>` — Get estimation accuracy statistics
- `getCategoryBreakdown(periodDays: number): Promise<ICategoryBreakdown[]>` — Get time breakdown by category

#### 4-2. Analytics Interfaces

```typescript
interface IDailySummary {
    date: string;
    totalPlanned: number;
    totalCompleted: number;
    totalSkipped: number;
    estimatedMinutes: number;
    actualMinutes: number;
    accuracyPercent: number;
}

interface IRoutineStats {
    routineId: string;
    routineName: string;
    executionCount: number;
    averageActualMin: number;
    estimatedMin: number;
    accuracyPercent: number;
    trend: number[];           // Actual durations for the last N executions
}

interface IEstimateAccuracy {
    overallAccuracyPercent: number;
    totalEntries: number;
    overEstimateCount: number;
    underEstimateCount: number;
    exactCount: number;
}

interface ICategoryBreakdown {
    category: string;
    totalMinutes: number;
    percentage: number;
}
```

#### 4-3. Add Summary Display to Daily Plan View

- Display summary information in the header for completed days
- Show estimated vs. actual bar visualization

#### 4-4. Add Analysis Tab to Routine Manager View

- Display statistics in the routine detail panel
- Estimation duration update suggestions
- Actual duration trend graph (HTML/CSS-based bar chart)

#### 4-5. Read-only Display for Past Dates

- When viewing a past date, display the plan + log in read-only mode
- Disable edit operations

#### 4-6. Settings and Command Additions

- Add `reviewPeriodDays` setting
- Implement `show-today-summary` command

### Deliverables

- Daily summary display
- Per-routine statistical analysis
- Estimation accuracy improvement support
- Past data reference

---

## Cross-cutting Concerns

### Error Handling

- File read/write errors: Notify the user via `Notice` and allow the operation to be retried
- Parse errors (invalid Markdown / CSV): Provide specific error notification and fallback behavior
- Folder does not exist: Attempt automatic creation

### Testing Strategy

Design the following units as pure functions to enable future testing:

- `DailyPlanParser.parse` / `serialize`
- `TimeLogParser.parse` / `serializeEntry`
- `RoutineParser.parse` / `serialize`
- `RecurrenceEvaluator.isMatchingDate`
- Projected end time calculation logic

These do not depend on the Obsidian API and can be unit tested with a Node.js test runner (e.g., vitest).

### Performance

- Loading all routines: Not a problem with a few dozen files
- CSV loading: Maximum ~1,000 rows per month. Parsing all rows is not a problem
- View re-rendering: Task count is typically 20–30 items, so full re-render is not a problem

### Data Migration

- In preparation for data format changes during version upgrades, leave room for adding version information to the `ananke-type` field
- Migration functionality is not implemented in Phase 1

### Security

- User input sanitization: Use `createEl` / `setText` so Obsidian automatically handles escaping
- File path validation: Use `normalizePath` to prevent path traversal
