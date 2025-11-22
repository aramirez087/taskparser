
import React, { useState, useMemo } from 'react';
import { Task, Subtask, ParsedDetails, ParsedLogInfo } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Clock, CheckCircle, CheckCircle2, Circle, GitCommit, PlayCircle, AlertOctagon, TestTube, FileJson, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface TaskCardProps {
    task: Task;
}

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

// Helper to parse the details string
const parseDetails = (details: string): ParsedDetails => {
    const logs: ParsedLogInfo[] = [];
    const logRegex = /<info added on (.*?)>([\s\S]*?)<\/info added on \1>/g;

    let match;
    let mainText = details;

    while ((match = logRegex.exec(details)) !== null) {
        logs.push({
            date: match[1],
            content: match[2].trim()
        });
        mainText = mainText.replace(match[0], ''); // Remove log from main text
    }

    return { mainText: mainText.trim(), logs };
};

const PriorityBadge = ({ priority }: { priority: string }) => {
    const colors: Record<string, string> = {
        low: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
        medium: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
        high: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
        critical: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
    };

    return (
        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium uppercase border tracking-wide", colors[priority] || colors.low)}>
            {priority}
        </span>
    );
};

const StatusIndicator = ({ status }: { status: string }) => {
    const config: Record<string, { icon: React.ElementType, color: string }> = {
        'done': { icon: CheckCircle, color: 'text-emerald-500 dark:text-emerald-400' },
        'in-progress': { icon: Clock, color: 'text-amber-500 dark:text-amber-400' },
        'pending': { icon: Circle, color: 'text-muted-foreground' },
        'cancelled': { icon: AlertOctagon, color: 'text-rose-500 dark:text-rose-400' }
    };

    const { icon: Icon, color } = config[status] || config.pending;

    return (
        <div className={cn("flex items-center gap-1.5", color)}>
            <Icon className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">{status}</span>
        </div>
    );
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
    const [expanded, setExpanded] = useState(false);
    const parsedDetails = useMemo(() => parseDetails(task.details), [task.details]);
    const progress = task.subtasks?.length > 0
        ? Math.round((task.subtasks.filter(s => s.status === 'done').length / task.subtasks.length) * 100)
        : (task.status === 'done' ? 100 : 0);

    return (
        <motion.div
            className={cn(
                "clean-card group transition-all duration-300 bg-card overflow-hidden",
                expanded ? "shadow-md ring-1 ring-primary/5" : "hover:shadow-sm"
            )}
        >
            {/* Header / Main Row */}
            <div
                className="p-5 cursor-pointer relative z-10"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-start gap-4">
                    <button className={cn(
                        "mt-0.5 p-1 rounded-md transition-colors",
                        expanded ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}>
                        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-[10px] text-muted-foreground">#{task.id}</span>
                                <PriorityBadge priority={task.priority} />
                                {task.subtasks && task.subtasks.length > 0 && (
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/50 border border-border/50">
                                        <span className="text-[10px] font-medium text-muted-foreground">{task.subtasks.length} subtasks</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <StatusIndicator status={task.status} />
                                {task.previousStatus && task.previousStatus !== task.status && (
                                    <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground/60">
                                        <span>←</span>
                                        <span className="uppercase">{task.previousStatus}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-baseline justify-between gap-4">
                            <h3 className={cn(
                                "text-base font-medium transition-colors truncate pr-4",
                                task.status === 'done' ? "text-muted-foreground line-through decoration-border" : "text-foreground group-hover:text-primary"
                            )}>
                                {task.title}
                            </h3>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1 pr-10">{task.description}</p>

                        {/* Progress Bar */}
                        <div className="mt-4 flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                    initial={false}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    className={cn("h-full rounded-full",
                                        task.status === 'done' ? 'bg-emerald-500' :
                                            task.status === 'in-progress' ? 'bg-amber-500' : 'bg-slate-400'
                                    )}
                                ></motion.div>
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{progress}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border/40 bg-muted/30"
                    >
                        <div className="p-6 pl-14 space-y-8">

                            {/* Description Full */}
                            <div>
                                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Description</h4>
                                <p className="text-sm text-foreground leading-relaxed">{task.description}</p>
                            </div>

                            {/* Task Acceptance Criteria */}
                            {task.acceptanceCriteria && (
                                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-4">
                                    <h4 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Acceptance Criteria
                                    </h4>
                                    <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                        {task.acceptanceCriteria}
                                    </div>
                                </div>
                            )}

                            {/* Details & Logs */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <FileJson className="w-3.5 h-3.5" /> Details
                                    </h4>
                                    <div className="text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-background p-4 rounded-lg border border-border/50 shadow-sm">
                                        {parsedDetails.mainText || "No additional details provided."}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <TestTube className="w-3.5 h-3.5" /> Test Strategy
                                    </h4>
                                    <div className="text-sm text-foreground/80 italic border-l-2 border-primary/30 pl-4 py-1">
                                        {task.testStrategy || "No test strategy defined."}
                                    </div>

                                    {/* Dependencies */}
                                    {task.dependencies.length > 0 && (
                                        <div className="mt-6">
                                            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <GitCommit className="w-3.5 h-3.5" /> Dependencies
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {task.dependencies.map(d => (
                                                    <span key={d} className="text-[10px] bg-muted text-muted-foreground px-2 py-1 rounded border border-border hover:bg-background transition-colors cursor-default">
                                                        #{d}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Development Log Timeline */}
                            {parsedDetails.logs.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Search className="w-3.5 h-3.5" /> Activity Log
                                    </h4>
                                    <div className="space-y-4 border-l border-border ml-2 pl-6 relative">
                                        {parsedDetails.logs.map((log, i) => (
                                            <div key={i} className="relative">
                                                <div className="absolute -left-[29px] top-1.5 w-2.5 h-2.5 rounded-full bg-background border-2 border-primary"></div>
                                                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-1">
                                                    <span className="text-primary text-[10px] font-mono font-bold">UPDATE</span>
                                                    <span className="text-muted-foreground text-[10px]">{new Date(log.date).toLocaleString()}</span>
                                                </div>
                                                <div className="text-xs text-foreground/90 bg-background p-3 rounded border border-border/50 whitespace-pre-wrap font-mono shadow-sm">
                                                    {log.content}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Subtasks */}
                            {task.subtasks && task.subtasks.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <PlayCircle className="w-3.5 h-3.5" /> Subtasks
                                    </h4>
                                    <div className="grid gap-3">
                                        {task.subtasks.map((sub) => (
                                            <SubtaskCard key={sub.id} subtask={sub} />
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </motion.div>
                )
                }
            </AnimatePresence>
        </motion.div>
    );
};

const SubtaskCard = ({ subtask }: { subtask: Subtask }) => {
    const parsed = useMemo(() => subtask.details ? parseDetails(subtask.details) : null, [subtask.details]);
    const [open, setOpen] = useState(false);

    return (
        <div className="bg-background border border-border/60 rounded-lg overflow-hidden hover:border-primary/20 transition-all shadow-sm">
            <div className="p-3 flex items-start gap-3 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setOpen(!open)}>
                <StatusIndicatorIcon status={subtask.status} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <p className={cn(
                            "text-sm font-medium truncate",
                            subtask.status === 'done' ? "text-muted-foreground line-through" : "text-foreground"
                        )}>{subtask.title}</p>
                        <div className="flex items-center gap-2">
                            {subtask.priority && <PriorityBadge priority={subtask.priority} />}
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{subtask.description}</p>
                    {subtask.dependencies && subtask.dependencies.length > 0 && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground/70">
                            <GitCommit className="w-3 h-3" />
                            <span>Deps: {subtask.dependencies.join(', ')}</span>
                        </div>
                    )}
                </div>
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
            </div>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-muted/20 border-t border-border/50 p-4 space-y-4"
                    >
                        {/* Acceptance Criteria */}
                        {subtask.acceptanceCriteria && (
                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
                                <h5 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Acceptance Criteria
                                </h5>
                                <div className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                    {subtask.acceptanceCriteria}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        <div>
                            <h5 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Description</h5>
                            <p className="text-sm text-foreground leading-relaxed">{subtask.description}</p>
                        </div>

                        {/* Details with Logs */}
                        {subtask.details && (
                            <div>
                                <h5 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <FileJson className="w-3 h-3" />
                                    Details
                                </h5>
                                {parsed && parsed.mainText && (
                                    <div className="text-xs text-muted-foreground whitespace-pre-wrap mb-3 bg-background p-3 rounded border border-border/50">
                                        {parsed.mainText}
                                    </div>
                                )}
                                {parsed && parsed.logs.length > 0 && (
                                    <div className="space-y-2 mt-3">
                                        <p className="text-[10px] font-bold text-primary uppercase">Activity Log ({parsed.logs.length})</p>
                                        {parsed.logs.map((log, i) => (
                                            <div key={i} className="bg-primary/5 border border-primary/10 rounded p-2">
                                                <span className="text-[10px] text-primary font-mono mb-1 block">
                                                    {new Date(log.date).toLocaleString()}
                                                </span>
                                                <pre className="text-xs text-foreground/80 whitespace-pre-wrap">{log.content}</pre>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Test Strategy */}
                        {subtask.testStrategy && (
                            <div>
                                <h5 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <TestTube className="w-3 h-3" />
                                    Test Strategy
                                </h5>
                                <div className="text-xs text-foreground/80 italic border-l-2 border-primary/30 pl-3 py-1">
                                    {subtask.testStrategy}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

const StatusIndicatorIcon = ({ status }: { status: string }) => {
    if (status === 'done') return <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
    if (status === 'in-progress') return <Clock className="w-4 h-4 text-amber-500 mt-0.5" />
    return <Circle className="w-4 h-4 text-muted-foreground mt-0.5" />
}
