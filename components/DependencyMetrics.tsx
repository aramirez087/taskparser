import React from 'react';
import { Task } from '../types';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Link, GitMerge } from 'lucide-react';

interface DependencyMetricsProps {
    tasks: Task[];
    compact?: boolean;
}

export const DependencyMetrics: React.FC<DependencyMetricsProps> = ({ tasks, compact = false }) => {
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

    if (compact) {
        return (
            <div className="clean-card p-4 bg-card">
                <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                            <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Ready to Work</div>
                            <div className="text-lg font-semibold text-foreground tracking-tight">{metrics.ready}</div>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-border/50" />
                    <div className="flex items-center gap-3 flex-1">
                        <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                            <ShieldAlert className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Blocked</div>
                            <div className="text-lg font-semibold text-foreground tracking-tight">{metrics.blocked}</div>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-border/50" />
                    <div className="flex items-center gap-3 flex-1">
                        <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                            <Link className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Avg Complexity</div>
                            <div className="text-lg font-semibold text-foreground tracking-tight">{metrics.avgDeps}</div>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-border/50" />
                    <div className="flex items-center gap-3 flex-1">
                        <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                            <GitMerge className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Bottleneck</div>
                            <div className="text-lg font-semibold text-foreground tracking-tight truncate">
                                {metrics.bottleneckTask ? `#${metrics.bottleneckTask.id}` : 'None'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
            <div className="clean-card p-4 bg-card">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ready to Work</span>
                </div>
                <div className="text-2xl font-semibold text-foreground tracking-tight">{metrics.ready}</div>
                <div className="text-xs text-muted-foreground mt-1">Unblocked tasks</div>
            </div>

            <div className="clean-card p-4 bg-card">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        <ShieldAlert className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Blocked</span>
                </div>
                <div className="text-2xl font-semibold text-foreground tracking-tight">{metrics.blocked}</div>
                <div className="text-xs text-muted-foreground mt-1">Waiting on dependencies</div>
            </div>

            <div className="clean-card p-4 bg-card">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Link className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Avg Complexity</span>
                </div>
                <div className="text-2xl font-semibold text-foreground tracking-tight">{metrics.avgDeps}</div>
                <div className="text-xs text-muted-foreground mt-1">Dependencies per task</div>
            </div>

            <div className="clean-card p-4 bg-card">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        <GitMerge className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Bottleneck</span>
                </div>
                <div className="text-lg font-semibold text-foreground tracking-tight truncate">
                    {metrics.bottleneckTask ? `#${metrics.bottleneckTask.id}` : 'None'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                    {metrics.bottleneckTask ? `Blocks ${metrics.maxDeps} tasks` : 'No dependencies'}
                </div>
            </div>
        </motion.div>
    );
};
