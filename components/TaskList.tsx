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
        <div className="bg-muted/30 p-8 rounded-2xl border border-border/50 max-w-md">
          <div className="bg-muted/50 p-3 rounded-full w-fit mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No tasks found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or search query to find what you're looking for.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground uppercase tracking-widest px-5">
        <span>Task Details</span>
        <span>Status & Priority</span>
      </div>
      {tasks.map((task, index) => (
        <motion.div
          key={task.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
        >
          <TaskCard task={task} />
        </motion.div>
      ))}
    </div>
  );
};