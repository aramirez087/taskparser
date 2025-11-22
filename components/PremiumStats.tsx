import React from 'react';
import { RootData } from '../types';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, Target, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface PremiumStatsProps {
    data: RootData;
}

export const PremiumStats: React.FC<PremiumStatsProps> = ({ data }) => {
    const allTasks = data.master.tasks;

    const stats = {
        total: allTasks.length,
        completed: allTasks.filter(t => t.status === 'done').length,
        inProgress: allTasks.filter(t => t.status === 'in-progress').length,
        pending: allTasks.filter(t => t.status === 'pending').length,
        highPriority: allTasks.filter(t => t.priority === 'high' || t.priority === 'critical').length,
    };

    const completionRate = stats.total > 0
        ? Math.round(
            allTasks.reduce((sum, task) => {
                if (task.subtasks && task.subtasks.length > 0) {
                    const doneSubtasks = task.subtasks.filter(s => s.status === 'done').length;
                    return sum + (doneSubtasks / task.subtasks.length) * 100;
                }
                return sum + (task.status === 'done' ? 100 : 0);
            }, 0) / stats.total
        )
        : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
                icon={<Target className="w-4 h-4" />}
                label="Total Tasks"
                value={stats.total}
                subtext={`${stats.completed} completed`}
                iconColor="text-blue-500"
                delay={0}
            />

            <StatCard
                icon={<Zap className="w-4 h-4" />}
                label="In Progress"
                value={stats.inProgress}
                subtext="Active workflows"
                iconColor="text-amber-500"
                delay={0.1}
            />

            <StatCard
                icon={<AlertTriangle className="w-4 h-4" />}
                label="High Priority"
                value={stats.highPriority}
                subtext="Needs attention"
                iconColor="text-rose-500"
                delay={0.2}
            />

            <StatCard
                icon={<CheckCircle2 className="w-4 h-4" />}
                label="Completion"
                value={`${completionRate}%`}
                subtext="Overall progress"
                iconColor="text-emerald-500"
                delay={0.3}
                showProgress
                progressValue={completionRate}
            />
        </div>
    );
};

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    subtext: string;
    iconColor: string;
    delay: number;
    showProgress?: boolean;
    progressValue?: number;
}

const StatCard: React.FC<StatCardProps> = ({
    icon,
    label,
    value,
    subtext,
    iconColor,
    delay,
    showProgress = false,
    progressValue = 0
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.4,
                delay,
                ease: [0.2, 0.65, 0.3, 0.9]
            }}
            className="clean-card p-5 relative overflow-hidden group bg-card"
        >
            <div className="flex flex-col h-full justify-between">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
                        <h3 className="text-2xl font-semibold text-foreground mt-1 tracking-tight">
                            {value}
                        </h3>
                    </div>
                    <div className={`p-2 rounded-md bg-muted/50 ${iconColor}`}>
                        {icon}
                    </div>
                </div>

                <div>
                    <p className="text-xs text-muted-foreground">{subtext}</p>
                    
                    {showProgress && (
                        <div className="mt-3">
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressValue}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="h-full bg-primary rounded-full"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
