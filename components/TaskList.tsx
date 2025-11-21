import React from 'react';
import { Task } from '../types';
import { TaskCard } from './TaskCard';
import { motion } from 'framer-motion';

interface TaskListProps {
  tasks: Task[];
}

export const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between text-xs text-slate-500 uppercase tracking-wider px-4 font-mono">
            <span>Task</span>
            <span>Status / Priority</span>
        </div>
      {tasks.map((task, index) => (
        <motion.div
          key={task.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <TaskCard task={task} />
        </motion.div>
      ))}
    </div>
  );
};