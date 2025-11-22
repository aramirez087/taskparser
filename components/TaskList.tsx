import React from 'react';
import { Task } from '../types';
import { TaskCard } from './TaskCard';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
}

export const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 max-w-md">
          <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-400 mb-2">No tasks found</h3>
          <p className="text-sm text-slate-500">Try adjusting your filters or search query</p>
        </div>
      </div>
    );
  }

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