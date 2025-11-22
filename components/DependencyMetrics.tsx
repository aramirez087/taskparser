import React from 'react';
import { Task } from '../types';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Link, GitMerge } from 'lucide-react';

interface DependencyMetricsProps {
    tasks: Task[];
}

export const DependencyMetrics: React.FC<DependencyMetricsProps> = ({ tasks }) => {
    const metrics = React.useMemo(() => {
        const total = tasks.length;
        if (total === 0) return null;

        const blocked = tasks.filter(t =>
            t.status !== 'done' &&
            t.dependencies?.some(depId => tasks.find(x => x.id === depId)?.status !== 'done')
        ).length;

        const ready = tasks.filter(t =>
            t.status !== 'done' &&
            (!t.dependencies || t.dependencies.every(depId => tasks.find(x => x.id === depId)?.status === 'done'))
        ).length;

        const dependencyCounts = tasks.map(t => t.dependencies?.length || 0);
        const avgDeps = (dependencyCounts.reduce((a, b) => a + b, 0) / total).toFixed(1);

        // Find most depended-on task
        const dependencyMap = new Map<string, number>();
        tasks.forEach(t => {
            t.dependencies?.forEach(depId => {
                dependencyMap.set(depId.toString(), (dependencyMap.get(depId.toString()) || 0) + 1);
            });
        });

        let maxDeps = 0;
        let bottleneckId = '';
        dependencyMap.forEach((count, id) => {
            if (count > maxDeps) {
                maxDeps = count;
                bottleneckId = id;
            }
        });

        const bottleneckTask = tasks.find(t => t.id.toString() === bottleneckId);

        return { blocked, ready, avgDeps, bottleneckTask, maxDeps };
    }, [tasks]);

    if (!metrics) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel border border-slate-800 rounded-xl p-6 mb-6"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-1 text-emerald-400">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Ready to Work</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-100">{metrics.ready}</div>
                    <div className="text-xs text-emerald-500/60">Unblocked tasks</div>
                </div>

                <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <div className="flex items-center gap-2 mb-1 text-rose-400">
                        <ShieldAlert className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Blocked</span>
                    </div>
                    <div className="text-2xl font-bold text-rose-100">{metrics.blocked}</div>
                    <div className="text-xs text-rose-500/60">Waiting on dependencies</div>
                </div>

                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-1 text-blue-400">
                        <Link className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Avg Complexity</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-100">{metrics.avgDeps}</div>
                    <div className="text-xs text-blue-500/60">Dependencies per task</div>
                </div>

                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-1 text-purple-400">
                        <GitMerge className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Primary Bottleneck</span>
                    </div>
                    <div className="text-lg font-bold text-purple-100 truncate">
                        {metrics.bottleneckTask ? `#${metrics.bottleneckTask.id}` : 'None'}
                    </div>
                    <div className="text-xs text-purple-500/60">
                        {metrics.bottleneckTask ? `Blocks ${metrics.maxDeps} tasks` : 'No dependencies'}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
