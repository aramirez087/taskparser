import React from 'react';
import { Filter, X, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export interface FilterState {
    status: string[];
    priority: string[];
    searchQuery: string;
    hasSubtasks: boolean | null;
}

interface TaskFiltersProps {
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    taskCounts: {
        total: number;
        filtered: number;
    };
}

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending', color: 'slate' },
    { value: 'in-progress', label: 'In Progress', color: 'amber' },
    { value: 'done', label: 'Done', color: 'emerald' },
    { value: 'cancelled', label: 'Cancelled', color: 'rose' },
    { value: 'deferred', label: 'Deferred', color: 'purple' }
];

const PRIORITY_OPTIONS = [
    { value: 'low', label: 'Low', color: 'slate' },
    { value: 'medium', label: 'Medium', color: 'blue' },
    { value: 'high', label: 'High', color: 'amber' },
    { value: 'critical', label: 'Critical', color: 'red' }
];

export const TaskFilters: React.FC<TaskFiltersProps> = ({ filters, onFiltersChange, taskCounts }) => {
    const toggleStatus = (status: string) => {
        const newStatuses = filters.status.includes(status)
            ? filters.status.filter(s => s !== status)
            : [...filters.status, status];
        onFiltersChange({ ...filters, status: newStatuses });
    };

    const togglePriority = (priority: string) => {
        const newPriorities = filters.priority.includes(priority)
            ? filters.priority.filter(p => p !== priority)
            : [...filters.priority, priority];
        onFiltersChange({ ...filters, priority: newPriorities });
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFiltersChange({ ...filters, searchQuery: e.target.value });
    };

    const clearFilters = () => {
        onFiltersChange({
            status: [],
            priority: [],
            searchQuery: '',
            hasSubtasks: null
        });
    };

    { taskCounts.filtered } of { taskCounts.total } tasks
                        </span >
                    )}
                </div >
    { hasActiveFilters && (
        <button
            onClick={clearFilters}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
        >
            <X className="w-3 h-3" />
            Clear All
        </button>
    )}
            </div >

    {/* Search */ }
    < div className = "mb-4" >
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
                type="text"
                placeholder="Search tasks..."
                value={filters.searchQuery}
                onChange={handleSearchChange}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
            />
        </div>
            </div >

    {/* Status Filter */ }
    < div className = "mb-4" >
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                    Status
                </label>
                <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map(option => (
                        <button
                            key={option.value}
                            onClick={() => toggleStatus(option.value)}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-xs font-medium transition-all border",
                                filters.status.includes(option.value)
                                    ? `bg-${option.color}-500/20 border-${option.color}-500/40 text-${option.color}-300`
                                    : "bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div >

    {/* Priority Filter */ }
    < div className = "mb-4" >
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                    Priority
                </label>
                <div className="flex flex-wrap gap-2">
                    {PRIORITY_OPTIONS.map(option => (
                        <button
                            key={option.value}
                            onClick={() => togglePriority(option.value)}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-xs font-medium transition-all border",
                                filters.priority.includes(option.value)
                                    ? `bg-${option.color}-500/20 border-${option.color}-500/40 text-${option.color}-300`
                                    : "bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div >

    {/* Subtask Filter */ }
    < div >
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                    Subtasks
                </label>
                <div className="flex gap-2">
                    <button
                        onClick={() => onFiltersChange({ ...filters, hasSubtasks: true })}
                        className={cn(
                            "px-3 py-1.5 rounded-md text-xs font-medium transition-all border",
                            filters.hasSubtasks === true
                                ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                                : "bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                        )}
                    >
                        With Subtasks
                    </button>
                    <button
                        onClick={() => onFiltersChange({ ...filters, hasSubtasks: false })}
                        className={cn(
                            "px-3 py-1.5 rounded-md text-xs font-medium transition-all border",
                            filters.hasSubtasks === false
                                ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                                : "bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                        )}
                    >
                        No Subtasks
                    </button>
                </div>
            </div >
        </div >
    );
};
