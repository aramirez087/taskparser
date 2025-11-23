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
 * Infer a project name from a file name
 * Examples:
 * - "project-tasks.json" -> "Project Tasks"
 * - "my_awesome_project.json" -> "My Awesome Project"
 * - "tasks.json" -> "Tasks"
 */
export function inferProjectName(fileName: string): string {
  // Remove .json extension
  let name = fileName.replace(/\.json$/i, '');
  
  // Replace underscores and dashes with spaces
  name = name.replace(/[_-]/g, ' ');
  
  // Capitalize first letter of each word
  name = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return name || 'Untitled Project';
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
export function saveProject(data: RootData, fileName: string, existingId?: string): ProjectMetadata {
  const projects = getAllProjects();
  
  // Check if we're updating an existing project
  const existingIndex = existingId 
    ? projects.findIndex(p => p.metadata.id === existingId)
    : -1;
  
  const projectId = existingId || generateProjectId(fileName);
  const metadata: ProjectMetadata = {
    id: projectId,
    name: inferProjectName(fileName),
    fileName: fileName,
    lastOpened: Date.now(),
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
