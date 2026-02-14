# Ananke — Overview and Concept

## Plugin Vision

Ananke is an Obsidian plugin for murnana to manage tasks at work. Based on the **TaskChute method**, it aims to complete the three cycles of task **estimation (Plan)**, **recording (Log)**, and **review (Review)** within an Obsidian Vault using Markdown and CSV.

The essence of the TaskChute method is to "treat each day as a timeline and record all activities." Ananke adapts this philosophy to the Obsidian ecosystem and provides the following values:

- **All data is plain text**: Task definitions in Markdown, measurement data in CSV. Maintains compatibility with other Obsidian plugins and external tools
- **Focus on today**: Centers on a daily view, showing only "what needs to be done today"
- **Improve estimation accuracy**: References actual durations from past logs to continuously improve estimation accuracy
- **Desktop first**: Currently targets desktop Obsidian only. The UI is designed with platform-specific rendering to prepare for future mobile support

## Adapting the TaskChute Method to Obsidian

The three pillars of TaskChute are mapped in Ananke as follows:

| TaskChute Pillar | Ananke Implementation | Description |
|---|---|---|
| **Plan** | Daily Plan View | Arrange today's tasks in execution order, set estimated durations. Display projected end time in real time |
| **Log** | Time Log (CSV) | Record actual start and end times for each task. Record the entire day as a continuous timeline |
| **Routine** | Routine Definitions (Markdown) | Define recurring tasks and automatically expand them into the daily plan on applicable days |

### Cycle

```
Routine definitions → Auto-generate today's plan → Execute tasks & record logs → Review → Improve routines/estimates
```

## Glossary

| Term | Description |
|---|---|
| Task | The smallest unit of work to execute. Has a name, estimated duration, and category |
| DailyPlan | An ordered list of tasks to execute on a given day |
| TimeLog | A record of actual start and end times for tasks |
| Routine | A definition of a periodically recurring task. Has recurrence conditions such as days of the week and intervals |
| Section | A broad classification of tasks (e.g., morning preparation, work, personal) |
| Category | A label indicating the type of task (e.g., meeting, development, break) |
| EstimatedDuration | The expected time for a task (in minutes) |
| ActualDuration | The actual time spent on a task (in minutes) |
| ProjectedEndTime | The projected end time of the day, calculated from the estimates of remaining tasks |
| TaskFolder | The folder within the Vault that stores task definition files (default: `ananke-tasks`) |

## Typical Daily Workflow

### Morning (Plan)

1. Open Obsidian and display Ananke's daily plan view
2. Today's tasks have been automatically generated based on routine definitions
3. Add, remove, or reorder tasks as needed
4. Review and adjust estimated durations for each task (if past logs exist, the average actual duration is shown as a reference)
5. The header displays "today's projected end time"

### During the Day (Log)

6. Press the "Start" button on the first task. The start time is automatically recorded
7. When the task is complete, press the "Complete" button. The end time is automatically recorded
8. The next task is automatically highlighted
9. If an unplanned task arises, you can add and start it on the spot
10. The projected end time is updated in real time

### Evening (Review)

11. In the daily plan view, check the discrepancies between estimates and actuals
12. For tasks with large deviations, record the cause in notes
13. Adjust the estimated durations of routines

## Design Principles

1. **Obsidian First**: Properly use Obsidian's APIs (`Vault`, `DataAdapter`, `ItemView`) and respect platform constraints
2. **Plain Text Transparency**: Keep file contents human-readable even without the plugin
3. **Non-destructive**: Do not interfere with the existing Vault file structure. All data is contained within the `taskFolder`
4. **Internationalization**: Multi-language support via i18next. Japanese is the fallback language
5. **Incremental Release**: Add features incrementally across Phases 1 through 4
