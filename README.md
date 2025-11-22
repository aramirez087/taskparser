# TaskMaster Pulse

> Give Task Master AI a live cockpit so developers stop re-asking their LLM for task status.

TaskMaster Pulse is the status companion for [Task Master AI](https://www.task-master.dev/). Feed it the JSON export that powers your AI agent, and Pulse turns that data into a cinematic dashboard: real-time stats, dependency graphs, and drill-down histories that keep engineers, PMs, and their copilots perfectly aligned.

- **Live app:** https://taskparser-iota.vercel.app/
- **Parent project:** https://www.task-master.dev/

## Why it exists

Task Master AI breaks ambiguous specs into actionable tasks your AI agent can one-shot. Pulse closes the loop by exposing the agent’s execution plan to humans:

1. **Developers** no longer ping their LLM for progress—Pulse shows it instantly.
2. **PM/Agent teams** can watch dependencies, logs, and test strategies in one interface.
3. **Automation loops** stay trustworthy because everyone sees the same canonical JSON.

## Highlights

1. **Instant ingestion** – drag/drop, file picker, or raw JSON paste.
2. **File System Access live sync** – automatically refreshes the dashboard when the source JSON changes (Chrome/Edge).
3. **Hybrid analytics** – glamorous landing, stat tiles, expandable task cards, activity timelines, and D3 dependency graph.
4. **Task Master aware** – metadata banner echoes the agent’s description/name so context remains in sync.
5. **Modern stack** – React 19, Vite, TypeScript, Framer Motion, Lucide, tailwind-merge, and D3.

## Requirements

- Node.js 20+
- npm 10+
- Optional: Chromium-based browser for live file syncing (fallback upload works everywhere)

### Environment Variables

Create `.env.local` and add:

```
GEMINI_API_KEY="your-key"
```

> Reserved for upcoming Gemini-powered parsing helpers. Not required for core visualization yet.

## Getting Started

```bash
npm install
npm run dev        # http://localhost:5173

npm run build      # outputs to dist/
npm run preview
```

Vercel deploys use the **Vite** preset (`npm run build`, output `dist/`).

## Usage Workflow

1. **Launch Pulse** – local dev server or the hosted Vercel URL.
2. **Load Task Master AI data**
   - “Open File & Watch Changes” (recommended) enables live syncing with the JSON file driving your agent.
   - Drag-and-drop or paste raw JSON as a fallback.
3. **Review the cockpit**
   - Sticky header mirrors `master.metadata`, file name, and sync status.
   - Stat cards highlight totals, completion, SLAs, and blockers.
4. **Explore tasks**
   - **List mode:** motion-enhanced cards with details, logs parsed from `<info added on …>` blocks, subtasks, dependencies, and test plans.
   - **Graph mode:** D3 force layout showing dependency health (color-coded by status) with zoom/pan.
5. **Stay aligned** – keep the JSON open in your editor, edit freely, and Pulse will reflect updates every second.

## JSON Data Model

Pulse expects the `RootData` schema used by Task Master AI:

```jsonc
{
  "fileName": "roadmap.json",
  "master": {
    "metadata": {
      "name": "Project Atlas",
      "description": "Quarterly platform rewrite",
      "created": "2024-11-01T08:00:00Z",
      "updated": "2024-11-20T17:15:00Z"
    },
    "tasks": [
      {
        "id": 101,
        "title": "Migrate auth service",
        "description": "Switch to the unified IAM provider",
        "details": "Implementation notes...",
        "testStrategy": "Smoke tests + chaos sim",
        "priority": "high",
        "status": "in-progress",
        "dependencies": [97],
        "subtasks": [
          { "id": "101a", "title": "Schema diff", "status": "done" }
        ]
      }
    ]
  }
}
```

### Key Interfaces (see [`types.ts`](./types.ts))

- `Metadata`: created/updated timestamps plus optional display name and description.
- `Task`: description, priority, status, dependencies, subtasks, and `details` string containing optional `<info added on …>` log entries.
- `Subtask`: lightweight items inheriting the same status/priority/testStrategy fields.

## Project Structure

```
├── App.tsx                # switches between landing and dashboard, handles live sync polling
├── components/
│   ├── Landing.tsx        # Task Master import UX (file picker, drop zone, raw JSON input)
│   ├── Dashboard.tsx      # stats banner, list/graph toggle, sync banner
│   ├── TaskList.tsx       # animated list wrapper
│   ├── TaskCard.tsx       # expandable cards with logs, subtasks, dependencies
│   └── DependencyGraph.tsx# D3 force graph for upstream/downstream mapping
├── metadata.json          # sample dataset
├── types.ts               # shared TypeScript interfaces
├── vite.config.ts
└── package.json
```

## Troubleshooting

1. **“Invalid JSON structure. Missing 'master.tasks'.”** – ensure tasks live under `master.tasks` with metadata filled in.
2. **Live sync banner shows errors** – the watched file changed but JSON is invalid or file permissions were revoked; fix and reopen.
3. **Graph view is empty** – requires at least one task, and edges appear only when dependencies reference other IDs.

## Roadmap & Ideas

1. Trigger Gemini to fix malformed JSON or summarize risk hot spots.
2. Publish shareable progress reports (PDF/Markdown) to stakeholders.
3. Support multiple agent files with quick switching/tabs.

## License

Distributed under the terms of the [LICENSE](./LICENSE) file.
