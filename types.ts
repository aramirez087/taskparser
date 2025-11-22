
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
  status: 'pending' | 'in-progress' | 'done' | 'cancelled' | 'deferred' | string;
  testStrategy?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  acceptanceCriteria?: string;
  parentTaskId?: number | string;
}

export interface Task {
  id: number | string;
  title: string;
  description: string;
  details: string;
  testStrategy: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: (number | string)[];
  status: 'pending' | 'in-progress' | 'done' | 'cancelled' | 'deferred' | string;
  subtasks: Subtask[];
  previousStatus?: string;
  acceptanceCriteria?: string;
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
