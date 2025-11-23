import { RootData } from '../types';

export interface ProjectMetadata {
  id: string;
  name: string;
  fileName: string;
  lastOpened: number;
  filePath?: string;
}

export interface StoredProject {
  metadata: ProjectMetadata;
  data: RootData;
}

const STORAGE_KEY = 'taskmaster_projects';
const LAST_PROJECT_KEY = 'taskmaster_last_project';

/**
 * Extract project name from file path
 * Examples:
 * - "C:\code\BookChat\taskmaster\tasks\tasks.json" -> "BookChat"
 * - "/Users/name/code/MyProject/tasks.json" -> "MyProject"
 * - "tasks.json" -> null (no path, use filename)
 */
export function extractProjectNameFromPath(filePath: string): string | null {
  if (!filePath) return null;
  
  // Normalize path separators
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // Split into parts
  const parts = normalizedPath.split('/').filter(p => p && p !== '.');
  
  // Remove the filename (last part)
  if (parts.length > 0) parts.pop();
  
  // Common folder names to skip when looking for project name
  const skipFolders = ['tasks', 'taskmaster', 'data', 'json', 'files', 'src', 'dist', 'build'];
  
  // Search backwards for a meaningful project folder name
  for (let i = parts.length - 1; i >= 0; i--) {
    const folder = parts[i];
    if (!skipFolders.includes(folder.toLowerCase())) {
      // Found a non-generic folder name, format it nicely
      return formatProjectName(folder);
    }
  }
  
  return null;
}

/**
 * Format a folder/file name into a nice project name
 * Examples:
 * - "BookChat" -> "BookChat"
 * - "my-awesome-project" -> "My Awesome Project"
 * - "task_manager" -> "Task Manager"
 */
function formatProjectName(name: string): string {
  // If it's already in PascalCase or has mixed case, keep it
  if (/[a-z][A-Z]/.test(name)) {
    // Insert spaces before capitals in PascalCase
    return name.replace(/([a-z])([A-Z])/g, '$1 $2');
  }
  
  // Replace underscores and dashes with spaces
  name = name.replace(/[_-]/g, ' ');
  
  // Capitalize first letter of each word
  name = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return name;
}

/**
 * Infer a project name from a file name (fallback)
 * Examples:
 * - "project-tasks.json" -> "Project Tasks"
 * - "my_awesome_project.json" -> "My Awesome Project"
 * - "tasks.json" -> "Tasks"
 */
export function inferProjectName(fileName: string, filePath?: string): string {
  // First try to extract from path if available
  if (filePath) {
    const pathBasedName = extractProjectNameFromPath(filePath);
    if (pathBasedName) return pathBasedName;
  }
  
  // Fall back to filename-based inference
  let name = fileName.replace(/\.json$/i, '');
  return formatProjectName(name) || 'Untitled Project';
}

/**
 * Generate a unique ID for a project based on fileName and timestamp
 */
export function generateProjectId(fileName: string): string {
  const timestamp = Date.now();
  const sanitized = fileName.replace(/[^a-zA-Z0-9]/g, '_');
  return `${sanitized}_${timestamp}`;
}

/**
 * Get all stored projects from localStorage
 */
export function getAllProjects(): StoredProject[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading projects from localStorage:', error);
    return [];
  }
}

/**
 * Save or update a project in localStorage
 */
export function saveProject(data: RootData, fileName: string, existingId?: string, filePath?: string): ProjectMetadata {
  const projects = getAllProjects();
  
  // Check if we're updating an existing project
  const existingIndex = existingId 
    ? projects.findIndex(p => p.metadata.id === existingId)
    : -1;
  
  const projectId = existingId || generateProjectId(fileName);
  const metadata: ProjectMetadata = {
    id: projectId,
    name: inferProjectName(fileName, filePath),
    fileName: fileName,
    lastOpened: Date.now(),
    filePath: filePath,
  };
  
  const storedProject: StoredProject = {
    metadata,
    data,
  };
  
  if (existingIndex >= 0) {
    // Update existing project
    projects[existingIndex] = storedProject;
  } else {
    // Add new project
    projects.push(storedProject);
  }
  
  // Save to localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    localStorage.setItem(LAST_PROJECT_KEY, projectId);
  } catch (error) {
    console.error('Error saving project to localStorage:', error);
  }
  
  return metadata;
}

/**
 * Get a specific project by ID
 */
export function getProject(projectId: string): StoredProject | null {
  const projects = getAllProjects();
  return projects.find(p => p.metadata.id === projectId) || null;
}

/**
 * Delete a project from localStorage
 */
export function deleteProject(projectId: string): void {
  const projects = getAllProjects();
  const filtered = projects.filter(p => p.metadata.id !== projectId);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    // If we deleted the last opened project, clear that too
    const lastProject = localStorage.getItem(LAST_PROJECT_KEY);
    if (lastProject === projectId) {
      localStorage.removeItem(LAST_PROJECT_KEY);
    }
  } catch (error) {
    console.error('Error deleting project from localStorage:', error);
  }
}

/**
 * Get the ID of the last opened project
 */
export function getLastProjectId(): string | null {
  return localStorage.getItem(LAST_PROJECT_KEY);
}

/**
 * Update the last opened project ID
 */
export function setLastProjectId(projectId: string): void {
  localStorage.setItem(LAST_PROJECT_KEY, projectId);
  
  // Also update the lastOpened timestamp for this project
  const projects = getAllProjects();
  const projectIndex = projects.findIndex(p => p.metadata.id === projectId);
  
  if (projectIndex >= 0) {
    projects[projectIndex].metadata.lastOpened = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error('Error updating project timestamp:', error);
    }
  }
}

/**
 * Rename a project
 */
export function renameProject(projectId: string, newName: string): boolean {
  const projects = getAllProjects();
  const projectIndex = projects.findIndex(p => p.metadata.id === projectId);
  
  if (projectIndex >= 0) {
    projects[projectIndex].metadata.name = newName;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      return true;
    } catch (error) {
      console.error('Error renaming project:', error);
      return false;
    }
  }
  
  return false;
}
