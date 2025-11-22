import React, { useState, useMemo } from 'react';
import { RootData, Task } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Share2, Activity, CheckCircle2, Clock, AlertTriangle, FileText, RefreshCw, AlertCircle } from 'lucide-react';
import { TaskList } from './TaskList';
import { DependencyGraph } from './DependencyGraph';
import { TaskFilters, FilterState } from './TaskFilters';
import { PremiumStats } from './PremiumStats';

interface DashboardProps {
  data: RootData;
  onReset: () => void;
  isSyncing?: boolean;
  syncError?: string | null;
}

type ViewMode = 'list' | 'graph';

export const Dashboard: React.FC<DashboardProps> = ({ data, onReset, isSyncing = false, syncError }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    priority: [],
    searchQuery: '',
    hasSubtasks: null
  });

  // Filter tasks based on current filters
  const filteredTasks = useMemo(() => {
    let tasks = data.master.tasks;

    // Status filter
    if (filters.status.length > 0) {
      tasks = tasks.filter(t => filters.status.includes(t.status));
    }

    // Priority filter
    if (filters.priority.length > 0) {
      tasks = tasks.filter(t => filters.priority.includes(t.priority));
    }

    // Search filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      tasks = tasks.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      );
    }

    // Subtask filter
    if (filters.hasSubtasks !== null) {
      tasks = tasks.filter(t =>
        filters.hasSubtasks ? (t.subtasks && t.subtasks.length > 0) : (!t.subtasks || t.subtasks.length === 0)
      );
    }

    return tasks;
  }, [data.master.tasks, filters]);

  const stats = useMemo(() => {
    const allTasks = filteredTasks;
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.status === 'done').length;
    const inProgress = allTasks.filter(t => t.status === 'in-progress').length;
    const pending = allTasks.filter(t => t.status === 'pending').length;
    const highPriority = allTasks.filter(t => t.priority === 'high' || t.priority === 'critical').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, pending, highPriority, completionRate };
  }, [filteredTasks]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col"
    >
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-500/20 p-2 rounded-lg">
            <Activity className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-100 tracking-tight">
                {data.master.metadata.description || data.master.metadata.name || "Project Overview"}
              </h1>
              {isSyncing && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">Live Sync</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {data.fileName && <span className="text-slate-300 font-mono">{data.fileName}</span>}
              <span>•</span>
              <span>Updated: {new Date(data.master.metadata.updated).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> List
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'graph' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Share2 className="w-4 h-4" /> Graph
            </button>
          </div>

          <button onClick={onReset} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            Close File
          </button>
        </div>
      </header>

      {/* Error Banner */}
      <AnimatePresence>
        {syncError && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-500/10 border-b border-amber-500/20 overflow-hidden"
          >
            <div className="px-6 py-2 flex items-center gap-2 justify-center text-sm text-amber-400">
              <AlertCircle className="w-4 h-4" />
              <span>{syncError}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Stats Bar */}
      <div className="px-6 py-6">
        <PremiumStats data={data} />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 px-6 pb-10 overflow-hidden flex flex-col">
        {/* Filters */}
        <TaskFilters
          filters={filters}
          onFiltersChange={setFilters}
          taskCounts={{
            total: data.master.tasks.length,
            filtered: filteredTasks.length
          }}
        />

        <div className="flex-1 relative">
          {viewMode === 'list' ? (
            <TaskList tasks={filteredTasks} />
          ) : (
            <div className="h-[70vh] w-full glass-panel rounded-2xl overflow-hidden border border-slate-800 relative">
              <DependencyGraph tasks={filteredTasks} />
              <div className="absolute bottom-4 left-4 bg-slate-900/80 p-3 rounded-lg text-xs text-slate-400 border border-slate-800 pointer-events-none">
                <p className="font-semibold text-slate-300 mb-1">Graph Legend</p>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Done</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> In Progress</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-500"></div> Pending</div>
              </div>
            </div>
          )}
        </div>
      </main>
    </motion.div>
  );
};

const StatCard = ({ icon, label, value, subValue, color = "blue" }: any) => (
  <div className={`glass-panel p-4 rounded-xl border border-slate-800 hover:border-${color}-500/30 transition-colors group`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-slate-100">{value}</h3>
        <p className="text-slate-500 text-xs mt-1 group-hover:text-slate-300 transition-colors">{subValue}</p>
      </div>
      <div className={`p-2 rounded-lg bg-${color}-500/10 border border-${color}-500/10 group-hover:scale-110 transition-transform`}>
        {React.cloneElement(icon, { className: `w-5 h-5 text-${color}-400` })}
      </div>
    </div>
  </div>
);
