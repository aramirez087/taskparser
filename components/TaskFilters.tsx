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
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="clean-card p-4 mb-6 bg-card"
        >
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 group"
                >
                    <div className="p-1.5 rounded-md bg-muted/50 group-hover:bg-muted transition-colors">
                        <Filter className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Filters</span>
                        {hasActiveFilters && (
                            <span className="text-[10px] text-muted-foreground">
                                {taskCounts.filtered} / {taskCounts.total} tasks
                            </span>
                        )}
                    </div>
                    <ChevronDown
                        className={cn(
                            "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ml-1",
                            isExpanded && "transform rotate-180"
                        )}
                    />
                </button>

                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-destructive/5"
                    >
                        <X className="w-3 h-3" />
                        Clear
                    </button>
                )}
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden border-t border-border/40 pt-4"
                    >
                        {/* Search */}
                        <div className="mb-5">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={filters.searchQuery}
                                    onChange={handleSearchChange}
                                    className="w-full bg-muted/30 border border-border/50 rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-5">
                            {/* Status Filter */}
                            <div>
                                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5 block">
                                    Status
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {STATUS_OPTIONS.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => toggleStatus(option.value)}
                                            className={cn(
                                                "px-3 py-1 rounded-md text-xs font-medium transition-all border",
                                                filters.status.includes(option.value)
                                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                    : "bg-muted/30 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                            )}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Priority Filter */}
                            <div>
                                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5 block">
                                    Priority
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {PRIORITY_OPTIONS.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => togglePriority(option.value)}
                                            className={cn(
                                                "px-3 py-1 rounded-md text-xs font-medium transition-all border",
                                                filters.priority.includes(option.value)
                                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                    : "bg-muted/30 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                            )}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Subtask Filter */}
                            <div>
                                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5 block">
                                    Subtasks
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onFiltersChange({ ...filters, hasSubtasks: true })}
                                        className={cn(
                                            "px-3 py-1 rounded-md text-xs font-medium transition-all border",
                                            filters.hasSubtasks === true
                                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                : "bg-muted/30 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        With Subtasks
                                    </button>
                                    <button
                                        onClick={() => onFiltersChange({ ...filters, hasSubtasks: false })}
                                        className={cn(
                                            "px-3 py-1 rounded-md text-xs font-medium transition-all border",
                                            filters.hasSubtasks === false
                                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                : "bg-muted/30 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        No Subtasks
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
