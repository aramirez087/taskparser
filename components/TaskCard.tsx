
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
        low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        high: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    };

    return (
        <span className={cn("px-2 py-0.5 rounded text-[10px] font-mono uppercase border font-medium tracking-wider", colors[priority] || colors.low)}>
            {priority}
        </span>
    );
};

const StatusIndicator = ({ status }: { status: string }) => {
    const config: Record<string, { icon: React.ElementType, color: string }> = {
        'done': { icon: CheckCircle, color: 'text-emerald-400' },
        'in-progress': { icon: Clock, color: 'text-amber-400' },
        'pending': { icon: Circle, color: 'text-slate-500' },
        'cancelled': { icon: AlertOctagon, color: 'text-rose-400' }
    };

    const { icon: Icon, color } = config[status] || config.pending;

    return (
        <div className={cn("flex items-center gap-1.5", color)}>
            <Icon className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase">{status}</span>
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="glass-panel rounded-xl border border-slate-800/60 hover:border-indigo-500/50 transition-all duration-500 overflow-hidden relative"
            whileHover={{ y: -4, scale: 1.01 }}
        >
            {/* Shimmer effect for high priority */}
            {(task.priority === 'high' || task.priority === 'critical') && (
                <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 pointer-events-none" />
            )}

            {/* Header / Main Row */}
            <div
                className="p-5 cursor-pointer relative z-10 transition-all duration-300"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-start gap-4">
                    <button className="mt-1 text-slate-500 hover:text-indigo-400 transition-colors">
                        {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>

                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-xs text-slate-500">ID: {task.id}</span>
                                <PriorityBadge priority={task.priority} />
                                {task.subtasks && task.subtasks.length > 0 && (
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                                        <span className="text-[10px] font-mono text-indigo-400">{task.subtasks.length}</span>
                                        <span className="text-[10px] text-indigo-400">subtask{task.subtasks.length !== 1 ? 's' : ''}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <StatusIndicator status={task.status} />
                                {task.previousStatus && task.previousStatus !== task.status && (
                                    <div className="flex items-center gap-1 text-[10px] text-slate-600">
                                        <span>←</span>
                                        <span className="uppercase">{task.previousStatus}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <h3 className="text-lg font-semibold text-slate-200 mb-1 group-hover:text-indigo-300 transition-colors">{task.title}</h3>
                        <p className="text-sm text-slate-400 line-clamp-1">{task.description}</p>

                        {/* Progress Bar */}
                        <div className="mt-4 flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-500",
                                        task.status === 'done' ? 'bg-emerald-500' :
                                            task.status === 'in-progress' ? 'bg-amber-500' : 'bg-slate-600'
                                    )}
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <span className="text-xs font-mono text-slate-500">{progress}%</span>
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
                        className="border-t border-slate-800/60 bg-slate-950/30"
                    >
                        <div className="p-6 pl-14 space-y-8">

                            {/* Description Full */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Description</h4>
                                <p className="text-slate-300 leading-relaxed text-sm">{task.description}</p>
                            </div>

                            {/* Task Acceptance Criteria - If Present */}
                            {task.acceptanceCriteria && (
                                <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-4">
                                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Acceptance Criteria
                                    </h4>
                                    <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                                        {task.acceptanceCriteria}
                                    </div>
                                </div>
                            )}

                            {/* Details & Logs */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <FileJson className="w-3 h-3" /> Details
                                    </h4>
                                    <div className="text-sm text-slate-400 whitespace-pre-wrap font-mono text-xs bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                                        {parsedDetails.mainText || "No additional details provided."}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <TestTube className="w-3 h-3" /> Test Strategy
                                    </h4>
                                    <div className="text-sm text-slate-400 italic border-l-2 border-indigo-500/50 pl-4 py-1">
                                        {task.testStrategy}
                                    </div>

                                    {/* Dependencies */}
                                    {task.dependencies.length > 0 && (
                                        <div className="mt-6">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <GitCommit className="w-3 h-3" /> Dependencies
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {task.dependencies.map(d => (
                                                    <span key={d} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                                                        Task #{d}
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
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Search className="w-3 h-3" /> Activity Log
                                    </h4>
                                    <div className="space-y-4 border-l border-slate-800 ml-2 pl-6 relative">
                                        {parsedDetails.logs.map((log, i) => (
                                            <div key={i} className="relative">
                                                <div className="absolute -left-[29px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border-4 border-slate-950"></div>
                                                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-1">
                                                    <span className="text-indigo-400 text-xs font-mono font-bold">UPDATE</span>
                                                    <span className="text-slate-500 text-xs">{new Date(log.date).toLocaleString()}</span>
                                                </div>
                                                <div className="text-sm text-slate-300 bg-slate-900/30 p-3 rounded border border-slate-800 whitespace-pre-wrap font-mono text-xs">
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
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <PlayCircle className="w-3 h-3" /> Subtasks
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
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-lg overflow-hidden hover:border-slate-700/70 transition-all">
            <div className="p-3 flex items-start gap-3 hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setOpen(!open)}>
                <StatusIndicatorIcon status={subtask.status} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-slate-200 truncate">{subtask.title}</p>
                        <div className="flex items-center gap-2">
                            {subtask.priority && <PriorityBadge priority={subtask.priority} />}
                            <span className="text-[10px] font-mono text-slate-500">#{subtask.id}</span>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{subtask.description}</p>
                    {subtask.dependencies && subtask.dependencies.length > 0 && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-600">
                            <GitCommit className="w-3 h-3" />
                            <span>Deps: {subtask.dependencies.join(', ')}</span>
                        </div>
                    )}
                </div>
                <ChevronDown className={cn("w-4 h-4 text-slate-600 transition-transform", open && "rotate-180")} />
            </div>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-slate-950/50 border-t border-slate-800/50 p-4 space-y-4"
                    >
                        {/* Acceptance Criteria - Prominent Display */}
                        {subtask.acceptanceCriteria && (
                            <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-3">
                                <h5 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Acceptance Criteria
                                </h5>
                                <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                                    {subtask.acceptanceCriteria}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        <div>
                            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Description</h5>
                            <p className="text-sm text-slate-300 leading-relaxed">{subtask.description}</p>
                        </div>

                        {/* Details with Logs */}
                        {subtask.details && (
                            <div>
                                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <FileJson className="w-3 h-3" />
                                    Details
                                </h5>
                                {parsed && parsed.mainText && (
                                    <div className="text-xs text-slate-400 whitespace-pre-wrap mb-3 bg-slate-900/50 p-3 rounded border border-slate-800">
                                        {parsed.mainText}
                                    </div>
                                )}
                                {parsed && parsed.logs.length > 0 && (
                                    <div className="space-y-2 mt-3">
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase">Activity Log ({parsed.logs.length} updates)</p>
                                        {parsed.logs.map((log, i) => (
                                            <div key={i} className="bg-indigo-950/20 border border-indigo-900/30 rounded p-2">
                                                <span className="text-[10px] text-indigo-400 font-mono mb-1 block">
                                                    {new Date(log.date).toLocaleString()}
                                                </span>
                                                <pre className="text-xs text-slate-300 whitespace-pre-wrap">{log.content}</pre>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Test Strategy */}
                        {subtask.testStrategy && (
                            <div>
                                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <TestTube className="w-3 h-3" />
                                    Test Strategy
                                </h5>
                                <div className="text-xs text-slate-400 italic border-l-2 border-purple-500/50 pl-3 py-1">
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
    return <Circle className="w-4 h-4 text-slate-600 mt-0.5" />
}
