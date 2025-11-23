import React, { useState, useMemo } from 'react';
import { RootData, Task } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Share2, Activity, CheckCircle2, Clock, AlertTriangle, FileText, RefreshCw, AlertCircle, Table as TableIcon, Network, List, FolderOpen, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { ProjectMetadata } from '../utils/projectManager';
import { TaskList } from './TaskList';
import { DependencyGraph } from './DependencyGraph';
import { TaskFilters, FilterState } from './TaskFilters';
import { PremiumStats } from './PremiumStats';
import { DependencyMetrics } from './DependencyMetrics';
import { ThemeToggle } from './ThemeToggle';
import { ProjectNameEditor } from './ProjectNameEditor';

interface DashboardProps {
  data: RootData;
  onReset: () => void;
  onSwitchProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onAddNewProject: () => void;
  onRenameProject: (projectId: string, newName: string) => void;
  currentProjectId: string | null;
  availableProjects: ProjectMetadata[];
  isSyncing?: boolean;
  syncError?: string | null;
}

type ViewMode = 'list' | 'graph' | 'table';

export const Dashboard: React.FC<DashboardProps> = ({ 
  data, 
  onReset, 
  onSwitchProject, 
  onDeleteProject, 
  onAddNewProject, 
  onRenameProject, 
  currentProjectId, 
  availableProjects, 
  isSyncing = false, 
  syncError 
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'graph' | 'table'>('list');
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
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
      className="min-h-screen flex flex-col bg-background text-foreground"
    >
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 glass-panel px-6 py-4 flex items-center justify-between border-b border-border/40">
        <div className="flex items-center gap-4">
          <div className="bg-primary/5 p-2 rounded-lg border border-primary/10">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          
          {/* Project Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors border border-border/50 bg-background/50"
            >
              <FolderOpen className="w-4 h-4 text-primary" />
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-semibold text-foreground tracking-tight">
                    {availableProjects.find(p => p.id === currentProjectId)?.name || "Project"}
                  </h1>
                  {isSyncing && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {data.fileName && <span className="font-medium text-foreground/80">{data.fileName}</span>}
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown Menu */}
            <AnimatePresence>
              {isProjectDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-2 w-80 glass-panel rounded-lg border border-border/50 shadow-xl overflow-hidden z-50"
                  onMouseLeave={() => setIsProjectDropdownOpen(false)}
                >
                  <div className="p-2">
                    <div className="flex items-center justify-between px-3 py-2 mb-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Projects</span>
                      <span className="text-xs text-muted-foreground">{availableProjects.length}</span>
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {availableProjects.map(project => (
                        <div
                          key={project.id}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors group ${project.id === currentProjectId ? 'bg-primary/10 border border-primary/20' : ''}`}
                        >
                          <div className="flex-1 min-w-0">
                            <ProjectNameEditor
                              projectId={project.id}
                              currentName={project.name}
                              onSave={onRenameProject}
                            />
                            <button
                              onClick={() => {
                                onSwitchProject(project.id);
                                setIsProjectDropdownOpen(false);
                              }}
                              className="text-xs text-muted-foreground hover:text-foreground text-left w-full mt-0.5"
                            >
                              {project.fileName}
                            </button>
                          </div>
                          {project.id !== currentProjectId && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete project "${project.name}"?`)) {
                                  onDeleteProject(project.id);
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
                              title="Delete project"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-border/50 mt-2 pt-2">
                      <button
                        onClick={() => {
                          onAddNewProject();
                          setIsProjectDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/10 text-primary transition-colors text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Add New Project
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Segmented Control */}
          <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
            {[
              { id: 'list', icon: List, label: 'List' },
              { id: 'table', icon: TableIcon, label: 'Table' },
              { id: 'graph', icon: Network, label: 'Graph' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as ViewMode)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${viewMode === mode.id
                  ? 'bg-background text-foreground shadow-sm border border-border/50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
              >
                <mode.icon className="w-3.5 h-3.5" />
                {mode.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-border/50 mx-2"></div>
          <ThemeToggle />
          
          <button onClick={onReset} className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2">
            Close
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
            className="bg-destructive/10 border-b border-destructive/20 overflow-hidden"
          >
            <div className="px-6 py-2 flex items-center gap-2 justify-center text-xs font-medium text-destructive">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{syncError}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Stats Bar */}
      <div className="px-6 py-8 space-y-8 max-w-[1600px] mx-auto w-full">
        <PremiumStats tasks={filteredTasks} />
        <DependencyMetrics tasks={filteredTasks} />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 px-6 pb-10 overflow-hidden flex flex-col max-w-[1600px] mx-auto w-full">
        {/* Filters */}
        <TaskFilters
          filters={filters}
          onFiltersChange={setFilters}
          taskCounts={{
            total: data.master.tasks.length,
            filtered: filteredTasks.length
          }}
        />

        <div className="flex-1 relative mt-6">
          <AnimatePresence mode="wait">
            {viewMode === 'list' ? (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TaskList tasks={filteredTasks} />
              </motion.div>
            ) : viewMode === 'table' ? (
              <motion.div
                key="table"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="clean-card overflow-hidden bg-card"
              >
                {filteredTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="bg-muted/30 p-8 rounded-2xl border border-border/50 max-w-md">
                      <div className="bg-muted/50 p-3 rounded-full w-fit mx-auto mb-4">
                        <TableIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">No tasks found</h3>
                      <p className="text-sm text-muted-foreground">Try adjusting your filters or search query to find what you're looking for.</p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">ID</th>
                          <th className="p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Title</th>
                          <th className="p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                          <th className="p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Priority</th>
                          <th className="p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Deps</th>
                          <th className="p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Subtasks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {filteredTasks.map(task => (
                          <tr key={task.id} className="hover:bg-muted/30 transition-colors group">
                            <td className="p-4 font-mono text-xs text-muted-foreground">#{task.id}</td>
                            <td className="p-4 font-medium text-sm text-foreground">{task.title}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${task.status === 'done' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400' :
                                  task.status === 'in-progress' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400' :
                                    task.status === 'cancelled' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400' :
                                      task.status === 'deferred' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400' :
                                        'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400'
                                }`}>
                                {task.status}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${task.priority === 'critical' ? 'bg-red-500' :
                                  task.priority === 'high' ? 'bg-amber-500' :
                                    task.priority === 'medium' ? 'bg-blue-500' :
                                      'bg-slate-300 dark:bg-slate-600'
                                  }`}></div>
                                <span className="text-xs text-muted-foreground capitalize">{task.priority}</span>
                              </div>
                            </td>
                            <td className="p-4 text-xs text-muted-foreground">
                              {task.dependencies?.length || '-'}
                            </td>
                            <td className="p-4 text-xs text-muted-foreground">
                              {task.subtasks?.length || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="graph"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-[70vh] w-full clean-card overflow-hidden bg-card relative"
              >
                <DependencyGraph tasks={filteredTasks} />
                <div className="absolute bottom-4 left-4 glass-panel px-3 py-2 rounded-lg border border-border/50 pointer-events-none">
                  <p className="font-medium text-[10px] text-muted-foreground mb-2 uppercase tracking-wider">Legend</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-foreground"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Done</div>
                    <div className="flex items-center gap-2 text-xs text-foreground"><div className="w-2 h-2 rounded-full bg-amber-500"></div> In Progress</div>
                    <div className="flex items-center gap-2 text-xs text-foreground"><div className="w-2 h-2 rounded-full bg-slate-400"></div> Pending</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
