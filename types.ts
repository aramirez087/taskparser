
export interface Metadata {
  created: string;
  updated: string;
  description: string;
  name?: string;
}

export interface Subtask {
  id: number | string;
  title: string;
  description: string;
  dependencies?: (number | string)[];
  details?: string;
  status: 'pending' | 'in-progress' | 'done' | 'cancelled' | string;
  testStrategy?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface Task {
  id: number | string;
  title: string;
  description: string;
  details: string;
  testStrategy: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: (number | string)[];
  status: 'pending' | 'in-progress' | 'done' | 'cancelled' | string;
  subtasks: Subtask[];
}

export interface MasterData {
  tasks: Task[];
  metadata: Metadata;
}

export interface RootData {
  master: MasterData;
  fileName?: string;
}

export interface ParsedLogInfo {
  date: string;
  content: string;
}

export interface ParsedDetails {
  mainText: string;
  logs: ParsedLogInfo[];
}
