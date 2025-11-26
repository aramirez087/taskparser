
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

export interface TagData {
  tasks: Task[];
  metadata: Metadata;
}

// Legacy alias for backward compatibility
export type MasterData = TagData;

// RootData can have multiple tags (master, feature branches, etc.)
// Each key is a tag name, value is the tag's task data
export interface RootData {
  [tagName: string]: TagData | string | undefined;
  master: TagData;
  fileName?: string;
}

// Helper type for extracting tag names from RootData
export type TagName = Exclude<keyof RootData, 'fileName'>;

export interface ParsedLogInfo {
  date: string;
  content: string;
}

export interface ParsedDetails {
  mainText: string;
  logs: ParsedLogInfo[];
}
