# TaskFlow Horizon

> Visualize complex project plans from a single JSON file, monitor live updates, and explore task dependencies through cinematic dashboards.

TaskFlow Horizon is a Vite + React application that ingests a structured JSON “task parser” export and renders an immersive control center for program managers, tech leads, and automation agents. It pairs a polished landing/import flow with rich analytics, list views, and an interactive dependency graph powered by D3.

## Highlights

- **Instant ingestion** – drag-and-drop, paste, or open JSON files exported from your task parser pipeline.
- **Live file sync** – leverages the File System Access API to poll changes every second and reflect edits without a manual refresh.
- **Adaptive dashboards** – summary stats, progress bars, activity logs, and subtask drill-downs with tasteful motion.
- **Dependency graph** – force-directed visualization showing upstream/downstream relationships and task health at a glance.
- **Modern stack** – React 19, TypeScript, Vite, Framer Motion, Lucide icons, tailwind-merge utilities, and D3.

## Requirements

- Node.js 20+
- npm 10+
- Optional: Chrome/Edge for File System Access API live-sync support (fallback upload works everywhere).

### Environment Variables

Create a `.env.local` file to store runtime secrets. The app currently expects:

```
GEMINI_API_KEY="your-key"
```

> The UI does not call Gemini directly yet, but the key is reserved for upcoming AI-assisted parsing. Keep it handy if you plan to extend the parser service.

## Getting Started

```
npm install
npm run dev    # http://localhost:5173

npm run build  # generates production bundle in dist/
npm run preview
```

## Usage Workflow

1. **Open the app** – served locally via Vite; background gradients and grain overlay set the tone.
2. **Load project data**
   - Click **“Open File & Watch Changes”** to pick a JSON file and enable live syncing.
   - Drag a file into the dropzone or paste raw JSON into the text editor as a fallback.
3. **Review the dashboard**
   - Sticky header highlights project metadata, file name, and live-sync status.
   - Stat cards summarize totals, completion rates, high-priority counts, and in-progress work.
4. **Explore tasks**
   - **List mode** shows expandable task cards with details, logs, subtasks, test strategies, and dependency badges.
   - **Graph mode** renders a draggable/zoomable force graph where color encodes status.
5. **Stay in sync** – as long as live-sync is enabled, edits to the source JSON automatically refresh the visualization.

## JSON Data Model

The app expects a `RootData` shape with `master` metadata and task collections. Example:

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
- `Task`: core unit with description, priority, status, dependencies, subtasks, and parsing-friendly `details` string (supports embedded `<info added on …>` blocks).
- `Subtask`: lightweight entries inheriting dependency/test metadata when available.

## Project Structure

```
├── App.tsx                # orchestrates landing vs dashboard states + live sync
├── components/
│   ├── Landing.tsx        # import UX: drag/drop, file picker, text paste
│   ├── Dashboard.tsx      # stats, top bar, list/graph toggles
│   ├── TaskList.tsx       # list view + animated cards
│   ├── TaskCard.tsx       # expandable task details, logs, subtasks
│   └── DependencyGraph.tsx# D3 force layout for dependencies
├── metadata.json          # sample data file
├── types.ts               # shared TypeScript interfaces
├── vite.config.ts
└── package.json
```

## Troubleshooting

1. **“Invalid JSON structure. Missing 'master.tasks'.”** – Ensure your data matches the schema above; wrap tasks inside `master.tasks`.
2. **Live sync banner shows errors** – The file changed but contains invalid JSON or browser permissions were revoked. Fix/restore access and reopen.
3. **Graph is empty** – There must be at least one task with dependencies; otherwise the list view still works.

## Roadmap & Ideas

1. Integrate Gemini or another LLM to convert unstructured specs into the required JSON.
2. Export annotated task reports (PDF/Markdown) for stakeholders.
3. Multi-file sessions with tabbed dashboards.

## License

Distributed under the terms of the [LICENSE](./LICENSE) file.
