# TaskMaster Pulse 🎯

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Open Source](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/aramirez087/taskparser)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/aramirez087/taskparser/issues)

**A real-time visualization dashboard for AI agent task management**

TaskMaster Pulse transforms JSON task data from [Task Master AI](https://www.task-master.dev/) into a beautiful, live-updating dashboard. Think of it as Mission Control for your AI agent—see task status, dependencies, logs, and metrics all in one place, in real-time.

🚀 **[Try it live](https://taskparser-iota.vercel.app/)** | 📖 **[Task Master AI](https://www.task-master.dev/)**

---

## What is this?

If you're using AI agents (like Claude, GPT-4, or Task Master AI) to break down complex projects into tasks, you need a way to visualize what's happening. TaskMaster Pulse takes your AI's task JSON file and gives you:

- ✅ **Live sync** - Changes to your JSON file auto-refresh the dashboard (no manual reload!)
- 📊 **Visual metrics** - See progress, blockers, SLA status at a glance  
- 🕸️ **Dependency graphs** - Interactive D3 visualization of task relationships
- 📝 **Activity timelines** - Track when tasks were created, updated, and completed
- 🎨 **Beautiful UI** - Modern, responsive design built with React + TailwindCSS

Perfect for developers, project managers, and teams who want to stay in sync with their AI agents without constantly asking "what's the status?"

---

## Why Use This?

**Problem:** You're using an AI agent to manage tasks, but checking progress means re-opening the JSON file or asking the AI "what's done?"

**Solution:** TaskMaster Pulse gives you a persistent, auto-updating dashboard. Edit your JSON in VSCode, and watch the dashboard update in real-time. Share the URL with your team so everyone sees the same truth.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20 or higher
- **npm** 10 or higher
- **Browser:** Chrome/Edge recommended (for live sync), but any modern browser works

### Installation

```bash
# Clone the repository
git clone https://github.com/aramirez087/taskparser.git
cd taskparser

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build      # Outputs to dist/
npm run preview    # Preview production build
```

### Optional: Environment Variables

Create `.env.local` if you want to use upcoming Gemini features:

```env
GEMINI_API_KEY="your-key-here"
```

> ⚠️ Not required for core visualization features.

---

## 📖 How to Use

### Step 1: Get Your Task Data
Export or generate JSON from Task Master AI (or any compatible task management system). See [JSON Format](#json-format) below for the expected structure.

### Step 2: Load Data into Pulse
You have three options:

1. **Open File & Watch Changes** (Recommended)
   - Click this button on the landing page
   - Select your JSON file
   - Pulse will automatically detect and reflect any changes you make to the file

2. **Drag & Drop**
   - Simply drag your JSON file onto the landing page

3. **Paste JSON**
   - Copy your JSON and paste it into the text area

### Step 3: Explore Your Dashboard

- **Metrics** - See overall progress, completion rate, blockers at the top
- **Task List** - View all tasks with expandable details, logs, subtasks
- **Dependency Graph** - Visualize how tasks depend on each other (toggle with Graph View button)
- **Live Sync** - If using file watching, any edits auto-refresh in ~1 second

---

## 📋 JSON Format

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

---

## 🏗️ Project Structure

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

---

## 🔧 Troubleshooting

1. **“Invalid JSON structure. Missing 'master.tasks'.”** – ensure tasks live under `master.tasks` with metadata filled in.
2. **Live sync banner shows errors** – the watched file changed but JSON is invalid or file permissions were revoked; fix and reopen.
3. **Graph view is empty** – requires at least one task, and edges appear only when dependencies reference other IDs.

---

## 🗺️ Roadmap

- [ ] AI-powered JSON validation and auto-fix (Gemini integration)
- [ ] Export progress reports (PDF/Markdown)
- [ ] Multi-file support with tabs
- [ ] Custom themes and layouts
- [ ] Webhook notifications for task updates

Have ideas? [Open an issue](https://github.com/aramirez087/taskparser/issues)!

---

## 🤝 Contributing

We welcome contributions! Whether it's bug fixes, new features, documentation, or ideas—we'd love your help.

### Ways to Contribute

1. **Report Bugs** - [Open an issue](https://github.com/aramirez087/taskparser/issues) with reproduction steps
2. **Suggest Features** - Share your ideas in [Discussions](https://github.com/aramirez087/taskparser/discussions)
3. **Submit PRs** - Fix bugs or implement features (see below)
4. **Improve Docs** - Help make the README or code comments clearer

### Development Workflow

```bash
# Fork and clone the repo
git clone https://github.com/YOUR-USERNAME/taskparser.git
cd taskparser

# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes and test
npm install
npm run dev

# Commit with clear messages
git commit -m "Add: descriptive message about your change"

# Push and open a PR
git push origin feature/your-feature-name
```

### Code Guidelines

- **Style**: Follow existing code patterns (TypeScript, React hooks, functional components)
- **Components**: Keep components small and focused
- **Testing**: Test your changes manually before submitting
- **Commits**: Use clear, descriptive commit messages

### Need Help?

Not sure where to start? Check out [issues labeled "good first issue"](https://github.com/aramirez087/taskparser/labels/good%20first%20issue) or reach out in [Discussions](https://github.com/aramirez087/taskparser/discussions).

---

## 📄 License

This project is open source under the [MIT License](LICENSE). Free to use, modify, and distribute.

---

## 🙏 Acknowledgments

Built with modern web technologies:
- [React 19](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [D3.js](https://d3js.org/) - Data visualization
- [Lucide](https://lucide.dev/) - Icons

Inspired by [Task Master AI](https://www.task-master.dev/) and the need for better AI agent visibility.

---

<p align="center">
  <strong>⭐ If you find this useful, give it a star!</strong><br>
  Made with ❤️ for the AI agent community
</p>
