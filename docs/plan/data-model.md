# Ananke — Data Model

## Folder Structure

All data is stored under the `taskFolder` setting (default: `ananke-tasks`).

```
{vault}/
└── ananke-tasks/
    ├── routines/                # Routine definition files
    │   ├── morning-routine.md
    │   ├── work-standup.md
    │   └── ...
    ├── daily/                   # Daily plan files (one per day)
    │   ├── 2026-02-12.md
    │   ├── 2026-02-13.md
    │   └── ...
    └── logs/                    # Time logs (CSV)
        ├── 2026-02.csv          # Monthly CSV files
        ├── 2026-03.csv
        └── ...
```

### Rationale for Folder Choices

| Folder | Rationale |
|---|---|
| `routines/` | Routines are "templates" not tied to specific dates, so they have their own folder. Each routine is a single Markdown file |
| `daily/` | One file per day. The filename is the date, making sorting and searching straightforward |
| `logs/` | CSV files are organized by month. Daily files would result in too many files; yearly files would be too large. Monthly strikes the best balance between searchability and performance |

---

## Routine Definition File

Path: `{taskFolder}/routines/{slug}.md`

### Sample

```markdown
---
ananke-type: routine
ananke-id: "r-20260212-143052"
category: "Work"
section: "Morning"
estimated-duration: 15
recurrence:
  type: "weekly"
  days: ["mon", "tue", "wed", "thu", "fri"]
enabled: true
created: "2026-02-12T14:30:52+09:00"
updated: "2026-02-12T14:30:52+09:00"
---

# Standup Meeting

Attend the team standup meeting.
- What I did yesterday
- What I'll do today
- Any blockers
```

### Frontmatter Field Definitions

| Field | Type | Required | Description |
|---|---|---|---|
| `ananke-type` | `"routine"` | Yes | Ananke file type identifier |
| `ananke-id` | `string` | Yes | Unique identifier. Format: `r-{YYYYMMdd}-{HHmmss}` |
| `category` | `string` | No | Task category (e.g., Work, Personal, Break) |
| `section` | `string` | No | Section of the day (e.g., Morning, AM, PM, Evening) |
| `estimated-duration` | `number` | Yes | Estimated duration (in minutes) |
| `recurrence` | `object` | Yes | Recurrence conditions (see below) |
| `enabled` | `boolean` | Yes | Whether the routine is enabled/disabled |
| `created` | `string` (ISO 8601) | Yes | Creation timestamp |
| `updated` | `string` (ISO 8601) | Yes | Last updated timestamp |

### Recurrence Object

| Property | Type | Condition | Description |
|---|---|---|---|
| `type` | `"daily" \| "weekly" \| "monthly" \| "interval"` | Required | Recurrence type |
| `days` | `DayOfWeek[]` | `type === "weekly"` | Applicable days (`"mon"`, `"tue"`, ...) |
| `dates` | `number[]` | `type === "monthly"` | Applicable dates (1–31) |
| `intervalDays` | `number` | `type === "interval"` | Every N days |
| `startDate` | `string` (YYYY-MM-DD) | `type === "interval"` | Start date for interval calculation |
| `excludeDates` | `string[]` (YYYY-MM-DD) | Optional | Specific dates to exclude |

### ID Generation Rules

- Format: `r-{YYYYMMdd}-{HHmmss}`
- Example: `r-20260212-143052`
- More human-readable than UUID and sorts well alongside filenames

### Body

The Markdown body after the frontmatter is treated as the task's "notes." Any Markdown can be written, and Obsidian links, tags, and embeds work as-is.

---

## Daily Plan File

Path: `{taskFolder}/daily/{YYYY-MM-DD}.md`

> **Data Separation Principle**: The daily plan file holds **only the task plan definitions**. Task execution state (status, start/end times, actual durations) is **recorded only in the time log (CSV)**. The daily plan view merges both data sources for display.

### Sample

```markdown
---
ananke-type: daily-plan
date: "2026-02-12"
created: "2026-02-12T07:00:00+09:00"
updated: "2026-02-12T18:30:00+09:00"
---

# Plan for 2026-02-12

## Task List

- 07:00 Morning Preparation [estimated::30] [section::Morning] [category::Life] [routine-id::r-20260101-070000] [order::1]
- 07:30 Standup Meeting [estimated::15] [section::AM] [category::Work] [routine-id::r-20260212-143052] [order::2]
- 07:45 Check Email [estimated::20] [section::AM] [category::Work] [order::3]
- 08:05 Implement Feature A [estimated::120] [section::AM] [category::Development] [order::4]
- 10:05 Lunch [estimated::60] [section::PM] [category::Break] [order::5]
```

### Task Row Format

```
- HH:mm TaskName [estimated::minutes] [section::SectionName] [category::CategoryName] [routine-id::RoutineID] [order::Order]
```

| Element | Description |
|---|---|
| `HH:mm` | Planned start time (auto-calculated from the previous task's estimate) |
| TaskName | Display name of the task |
| `[estimated::N]` | Estimated duration (in minutes) |
| `[section::Name]` | Section (optional) |
| `[category::Name]` | Category (optional) |
| `[routine-id::ID]` | Source routine ID if derived from a routine (optional) |
| `[order::N]` | Execution order (integer) |

Task execution state (status, actual durations, etc.) is not recorded in the daily plan file; it is stored only in the time log CSV.

### Rationale for Inline Field Notation

The `[key::value]` notation widely used by Obsidian's Dataview plugin is adopted.

1. **Compatibility**: Dataview users can query task data
2. **Readability**: Meaningful even when read as plain text
3. **Ease of parsing**: Easily extracted with the regex `\[(\w[\w-]*)::([^\]]*)\]`
4. **Keeps frontmatter clean**: Task metadata stays inline, while file-level frontmatter is reserved for file metadata

### Auto-generation of Daily Plans

When the daily plan view is opened for the first time on a given day and the file for that day does not exist, it is auto-generated:

1. Load all routine definition files from the `routines/` folder
2. Evaluate each routine's `recurrence` and extract those applicable to the target date
3. Sort applicable routines by `section` then by definition order
4. Calculate start times from the default start time setting (e.g., 07:00)
5. Generate the daily plan file

---

## Time Log (CSV)

Path: `{taskFolder}/logs/{YYYY-MM}.csv`

### Sample

```csv
date,task_name,routine_id,section,category,estimated_min,planned_start,actual_start,actual_end,actual_min,status,note
2026-02-12,Morning Preparation,r-20260101-070000,Morning,Life,30,07:00,07:05,07:32,27,completed,
2026-02-12,Standup Meeting,r-20260212-143052,AM,Work,15,07:30,07:35,07:52,17,completed,Ran a bit long
2026-02-12,Check Email,,AM,Work,20,07:45,07:52,08:15,23,completed,
2026-02-12,Implement Feature A,,AM,Development,120,08:05,08:15,,0,skipped,Something else came up
```

### CSV Column Definitions

| Column | Type | Required | Description |
|---|---|---|---|
| `date` | `YYYY-MM-DD` | Yes | Task execution date |
| `task_name` | `string` | Yes | Task name |
| `routine_id` | `string` | No | Source routine ID if derived from a routine |
| `section` | `string` | No | Section name |
| `category` | `string` | No | Category name |
| `estimated_min` | `number` | Yes | Estimated duration (minutes) |
| `planned_start` | `HH:mm` | Yes | Planned start time |
| `actual_start` | `HH:mm` | No | Actual start time (empty if not started) |
| `actual_end` | `HH:mm` | No | Actual end time (empty if not completed) |
| `actual_min` | `number` | No | Actual duration (minutes; auto-calculated from `actual_end - actual_start`) |
| `status` | `string` | Yes | `pending` / `in_progress` / `completed` / `skipped` |
| `note` | `string` | No | Notes (double-quote escaped if containing commas) |

### Status Values

Task execution state is recorded only in the `status` column of the time log CSV.

| Value | Meaning | Description |
|---|---|---|
| `pending` | Not started | Has not been started yet |
| `in_progress` | In progress | Currently running (timer active) |
| `completed` | Completed | Successfully completed |
| `skipped` | Skipped | Interrupted or skipped |

### CSV Read/Write Policy

- Obsidian's Vault API can handle `.csv` files as plain text (`vault.adapter.read` / `vault.adapter.write`)
- Implement a custom CSV parser without external libraries (RFC 4180 compliant; only double-quote escaping supported)
- File encoding: UTF-8 (no BOM)

---

## Entity Relationships

```
Routine (routines/*.md)
  │
  │  Evaluate recurrence (expand on applicable days)
  ▼
DailyPlan (daily/YYYY-MM-DD.md)     ← Plan definitions only (task name, estimate, order)
  │
  │  Each task row references via [routine-id::xxx]
  │  On task execution, write to log (CSV only; plan file is not modified)
  ▼
TimeLog (logs/YYYY-MM.csv)          ← Execution records only (status, actual durations)
  │
  │  Reference routine via routine_id column
  │  Aggregate past logs to calculate average actual durations
  ▼
Propose updates to Routine's estimated-duration
```

### Data Merging in Views

The daily plan view reads both the daily plan file (plan definitions) and the time log CSV (execution records), then merges them for display. Tasks are matched between plan and log using `order` and `task_name` as keys.

### Data Integrity

- **Routine → DailyPlan**: Referenced by routine ID. Even if a routine is deleted, existing task rows in daily plans remain as-is (orphans are tolerated)
- **DailyPlan → TimeLog**: When a task is executed, a row is appended to the CSV. The daily plan file is not updated. If CSV append fails, it is retried
- **TimeLog → Routine**: Past actuals are aggregated via `routine_id` from logs to provide estimation improvement suggestions

---

## TypeScript Interface Definitions

Following the existing naming convention (`I` prefix), defined under `src/Models/`.

### ITask

Plan definition read from the daily plan file. Does not include execution state.

```typescript
interface ITask {
    name: string;
    estimatedDuration: number;  // minutes
    section: string | null;
    category: string | null;
    routineId: string | null;
    order: number;
    plannedStart: string;       // HH:mm (auto-calculated from previous task's estimate)
}
```

### TaskStatus

Status values used only in the time log CSV.

```typescript
type TaskStatus = "pending" | "in_progress" | "completed" | "skipped";
```

### IRoutine

```typescript
interface IRoutine {
    id: string;                 // ananke-id
    name: string;               // Extracted from H1 heading
    category: string | null;
    section: string | null;
    estimatedDuration: number;
    recurrence: IRecurrence;
    enabled: boolean;
    created: string;            // ISO 8601
    updated: string;            // ISO 8601
    body: string;               // Markdown body
    filePath: string;           // Relative path within the Vault
}
```

### IRecurrence

```typescript
interface IRecurrence {
    type: "daily" | "weekly" | "monthly" | "interval";
    days?: DayOfWeek[];
    dates?: number[];
    intervalDays?: number;
    startDate?: string;
    excludeDates?: string[];
}

type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
```

### IDailyPlan

```typescript
interface IDailyPlan {
    date: string;               // YYYY-MM-DD
    tasks: ITask[];
    created: string;
    updated: string;
    filePath: string;
}
```

### ITimeLogEntry

```typescript
interface ITimeLogEntry {
    date: string;               // YYYY-MM-DD
    taskName: string;
    routineId: string | null;
    section: string | null;
    category: string | null;
    estimatedMin: number;
    plannedStart: string;       // HH:mm
    actualStart: string | null; // HH:mm
    actualEnd: string | null;   // HH:mm
    actualMin: number | null;
    status: TaskStatus;
    note: string;
}
```

---

## Edge Cases and Constraints

### Date Boundaries

- If a task runs past midnight, it is recorded under the daily plan's date (not treated as the next day)
- `actual_end` may be a next-day time such as `00:30`. The CSV `date` column uses the daily plan's date
- A "day start time" setting will be considered for future implementation (fixed at midnight in Phase 1)

### File Conflicts

- Files may conflict via Obsidian Sync or similar services
- CSV appends use `vault.adapter.append` to minimize conflicts
- Full exclusive locking is not implemented (Obsidian's sync uses last-write-wins as standard behavior)

### File Size

- CSV files have a maximum of approximately 1,000 rows per month (30 tasks/day x 31 days). Read performance is sufficient
- Indexing will be considered if needed in Phase 4

### Special Characters

- If a task name contains `[` and `]`, it may conflict with inline field notation. Task name validation will restrict forbidden characters
- If the CSV note field contains commas or newlines, it is enclosed in double quotes per RFC 4180
