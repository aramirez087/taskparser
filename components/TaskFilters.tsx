import React, { useState } from 'react';
import { Filter, X, Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    const [isExpanded, setIsExpanded] = useState(false);

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

    const hasActiveFilters = filters.status.length > 0 ||
        filters.priority.length > 0 ||
        filters.searchQuery.length > 0 ||
        filters.hasSubtasks !== null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="glass-panel-heavy border border-slate-800 rounded-xl p-6 mb-6 relative overflow-hidden"
        >
            {/* Animated gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                        <Filter className="w-4 h-4 text-indigo-400" />
                        <h3 className="text-sm font-semibold text-slate-200">Filters</h3>
                        {hasActiveFilters && (
                            <span className="text-xs text-slate-500">
                                {taskCounts.filtered} of {taskCounts.total} tasks
                            </span>
                        )}
                        <ChevronDown
                            className={cn(
                                "w-4 h-4 text-slate-500 transition-transform duration-200",
                                isExpanded && "transform rotate-180"
                            )}
                        />
                    </button>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
                        >
                            <X className="w-3 h-3" />
                            Clear All
                        </button>
                    )}
                </div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            {/* Search */}
                            <div className="mb-4">
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
                            </div>

                            {/* Status Filter */}
                            <div className="mb-4">
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
                            </div>

                            {/* Priority Filter */}
                            <div className="mb-4">
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
                            </div>

                            {/* Subtask Filter */}
                            <div>
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
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
