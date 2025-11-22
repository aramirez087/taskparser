import React, { useMemo } from 'react';
import { Task } from '../types';
import { motion } from 'framer-motion';
import { Flame, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';

interface NextTaskCardProps {
    tasks: Task[];
}

export const NextTaskCard: React.FC<NextTaskCardProps> = ({ tasks }) => {
    const recommendedTask = useMemo(() => {
        // Filter for pending or in-progress tasks
        const candidates = tasks.filter(t => t.status === 'pending' || t.status === 'in-progress');

        // Sort by:
        // 1. Unblocked (all dependencies done)
        // 2. Priority (Critical > High > Medium > Low)
        // 3. ID (ascending)

        return candidates.sort((a, b) => {
            const aBlocked = a.dependencies?.some(depId => tasks.find(t => t.id === depId)?.status !== 'done');
            const bBlocked = b.dependencies?.some(depId => tasks.find(t => t.id === depId)?.status !== 'done');

            if (aBlocked !== bBlocked) return aBlocked ? 1 : -1; // Unblocked first

            const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
            const pA = priorityWeight[a.priority as keyof typeof priorityWeight] || 0;
            const pB = priorityWeight[b.priority as keyof typeof priorityWeight] || 0;

            if (pA !== pB) return pB - pA; // Higher priority first

            return parseInt(a.id.toString()) - parseInt(b.id.toString());
        })[0];
    }, [tasks]);

    if (!recommendedTask) return null;

    const isBlocked = recommendedTask.dependencies?.some(depId => tasks.find(t => t.id === depId)?.status !== 'done');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel-heavy rounded-xl p-1 relative overflow-hidden mb-8 group"
        >
            {/* Glowing border animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 opacity-50 blur-sm group-hover:opacity-75 transition-opacity duration-500" />

            <div className="relative bg-slate-950/90 rounded-[10px] p-6 overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Flame className="w-32 h-32 text-amber-500" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 rounded text-[10px] font-mono uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                <Flame className="w-3 h-3" />
                                Recommended Next Task
                            </span>
                            {isBlocked ? (
                                <span className="px-2 py-1 rounded text-[10px] font-mono uppercase bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    Blocked
                                </span>
                            ) : (
                                <span className="px-2 py-1 rounded text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Ready to Start
                                </span>
                            )}
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                            <span className="font-mono text-slate-500 text-lg">#{recommendedTask.id}</span>
                            {recommendedTask.title}
                        </h2>

                        <p className="text-slate-400 max-w-2xl line-clamp-2">
                            {recommendedTask.description}
                        </p>
                    </div>

                    <button className="group/btn relative px-6 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 font-semibold text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all active:scale-95 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                            <span>Start Working</span>
                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </div>
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
