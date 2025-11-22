import React, { useEffect, useState, useRef } from 'react';
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

    const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
                icon={<Target className="w-6 h-6" />}
                label="Total Tasks"
                value={stats.total}
                subtext={`${stats.completed} completed`}
                gradient="from-blue-500 to-cyan-500"
                delay={0}
            />

            <StatCard
                icon={<Zap className="w-6 h-6" />}
                label="In Progress"
                value={stats.inProgress}
                subtext="Active workflows"
                gradient="from-amber-500 to-orange-500"
                delay={0.1}
            />

            <StatCard
                icon={<AlertTriangle className="w-6 h-6" />}
                label="High Priority"
                value={stats.highPriority}
                subtext="Needs attention"
                gradient="from-rose-500 to-pink-500"
                delay={0.2}
                pulse={stats.highPriority > 0}
            />

            <StatCard
                icon={<CheckCircle2 className="w-6 h-6" />}
                label="Completion"
                value={`${completionRate}%`}
                subtext="Overall progress"
                gradient="from-emerald-500 to-teal-500"
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
    gradient: string;
    delay: number;
    pulse?: boolean;
    showProgress?: boolean;
    progressValue?: number;
}

const StatCard: React.FC<StatCardProps> = ({
    icon,
    label,
    value,
    subtext,
    gradient,
    delay,
    pulse = false,
    showProgress = false,
    progressValue = 0
}) => {
    const numericValue = typeof value === 'number' ? value : parseInt(value) || 0;
    const [displayValue, setDisplayValue] = useState(numericValue);
    const [isInView, setIsInView] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const prevValueRef = useRef<number>(numericValue);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                }
            },
            { threshold: 0.1 }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const targetValue = typeof value === 'number' ? value : parseInt(value);
        if (isNaN(targetValue)) return;
        
        // Skip animation if value hasn't changed
        if (targetValue === prevValueRef.current) return;

        // If not in view yet, just set the value directly
        if (!isInView) {
            setDisplayValue(targetValue);
            prevValueRef.current = targetValue;
            return;
        }

        const startValue = prevValueRef.current;
        const duration = 1000;
        const steps = 50;
        const increment = (targetValue - startValue) / steps;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            if (currentStep >= steps) {
                setDisplayValue(targetValue);
                prevValueRef.current = targetValue;
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(startValue + increment * currentStep));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [value, isInView]);

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                duration: 0.5,
                delay,
                ease: [0.34, 1.56, 0.64, 1]
            }}
            whileHover={{ y: -6, scale: 1.02 }}
            className={`glass-panel rounded-xl p-6 relative overflow-hidden group cursor-default ${pulse ? 'animate-pulse-glow' : ''}`}
        >
            {/* Animated gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />

            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${gradient} bg-opacity-20`}>
                        {icon}
                    </div>
                    <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">{label}</span>
                </div>

                <div className="mt-2">
                    <h3 className="text-4xl font-bold text-slate-100 mb-1">
                        {typeof value === 'string' && value.includes('%')
                            ? `${displayValue}%`
                            : displayValue}
                    </h3>
                    <p className="text-sm text-slate-400">{subtext}</p>
                </div>

                {showProgress && (
                    <div className="mt-4">
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressValue}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className={`h-full bg-gradient-to-r ${gradient} rounded-full relative`}
                            >
                                <div className="absolute inset-0 shimmer" />
                            </motion.div>
                        </div>
                    </div>
                )}
            </div>

            {/* Glow effect */}
            <div className={`absolute -inset-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500 -z-10`} />
        </motion.div>
    );
};
