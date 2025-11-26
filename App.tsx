import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RootData, TagData } from './types';
import { Landing } from './components/Landing';
import { Dashboard } from './components/Dashboard';
import { AnimatePresence } from 'framer-motion';
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from './contexts/ThemeContext';
import { 
  getAllProjects, 
  getLastProjectId, 
  saveProject, 
  setLastProjectId, 
  deleteProject,
  renameProject,
  ProjectMetadata,
  StoredProject
} from './utils/projectManager';

export default function App() {
  const [data, setData] = useState<RootData | null>(null);
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [availableProjects, setAvailableProjects] = useState<ProjectMetadata[]>([]);
  const [currentTag, setCurrentTag] = useState<string>('master');
  const lastModRef = useRef<number>(0);

  // Extract available tags from current data
  const availableTags = useMemo(() => {
    if (!data) return ['master'];
    return Object.keys(data).filter(key => {
      if (key === 'fileName') return false;
      const value = data[key];
      // Check if it's a valid tag (has tasks array)
      return value && typeof value === 'object' && 'tasks' in value && Array.isArray((value as TagData).tasks);
    });
  }, [data]);

  // Get current tag data
  const currentTagData = useMemo(() => {
    if (!data) return null;
    const tagData = data[currentTag];
    if (tagData && typeof tagData === 'object' && 'tasks' in tagData) {
      return tagData as TagData;
    }
    // Fallback to master if current tag doesn't exist
    return data.master;
  }, [data, currentTag]);

  // Load projects from localStorage on mount
  useEffect(() => {
    const projects = getAllProjects();
    setAvailableProjects(projects.map(p => p.metadata));
    
    // Load last opened project if available
    const lastProjectId = getLastProjectId();
    if (lastProjectId) {
      const lastProject = projects.find(p => p.metadata.id === lastProjectId);
      if (lastProject) {
        setData(lastProject.data);
        setCurrentProjectId(lastProjectId);
        // Reset to master tag when loading a project
        setCurrentTag('master');
      }
    }
  }, []);

  const handleDataLoaded = async (loadedData: RootData, handle: FileSystemFileHandle | null = null, existingProjectId?: string) => {
    const fileName = loadedData.fileName || 'untitled.json';
    let filePath: string | undefined;
    
    // Try to extract file path for better project name inference
    if (handle) {
      try {
        const file = await handle.getFile();
        // @ts-ignore - webkitRelativePath might be available
        filePath = file.webkitRelativePath || file.path || undefined;
        
        // If we can't get the path from the file, try to construct it
        if (!filePath && (window as any).showOpenFilePicker) {
          // Modern API might have path info in some browsers
          // For now, we'll use the file name as fallback
          filePath = file.name;
        }
      } catch (e) {
        console.log('Could not extract file path:', e);
      }
    }
    
    // Save to localStorage and get project metadata
    const metadata = saveProject(loadedData, fileName, existingProjectId, filePath);
    
    setData(loadedData);
    setFileHandle(handle);
    setSyncError(null);
    setCurrentProjectId(metadata.id);
    // Reset to master tag when loading new data
    setCurrentTag('master');
    
    // Refresh available projects list
    const projects = getAllProjects();
    setAvailableProjects(projects.map(p => p.metadata));
    
    if (handle) {
      handle.getFile().then((file: File) => {
        lastModRef.current = file.lastModified;
      });
    }
  };

  const handleReset = () => {
    setData(null);
    setFileHandle(null);
    setSyncError(null);
    setCurrentProjectId(null);
    setCurrentTag('master');
  };

  const handleSwitchProject = (projectId: string) => {
    const projects = getAllProjects();
    const project = projects.find(p => p.metadata.id === projectId);
    
    if (project) {
      setData(project.data);
      setCurrentProjectId(projectId);
      setLastProjectId(projectId);
      setFileHandle(null); // Clear file handle when switching
      setSyncError(null);
      lastModRef.current = 0;
      setCurrentTag('master'); // Reset to master when switching projects
    }
  };

  const handleDeleteProject = (projectId: string) => {
    deleteProject(projectId);
    
    // Refresh available projects list
    const projects = getAllProjects();
    setAvailableProjects(projects.map(p => p.metadata));
    
    // If we deleted the current project, reset
    if (projectId === currentProjectId) {
      handleReset();
    }
  };

  const handleAddNewProject = () => {
    setData(null);
    setFileHandle(null);
    setSyncError(null);
    setCurrentProjectId(null);
    setCurrentTag('master');
  };

  const handleSwitchTag = (tagName: string) => {
    if (availableTags.includes(tagName)) {
      setCurrentTag(tagName);
    }
  };

  const handleRenameProject = (projectId: string, newName: string) => {
    const success = renameProject(projectId, newName);
    
    if (success) {
      // Refresh available projects list
      const projects = getAllProjects();
      setAvailableProjects(projects.map(p => p.metadata));
      
      // If we renamed the current project, update the data object too
      if (projectId === currentProjectId && data) {
        setData({ ...data });
      }
    }
  };

  const handleRefresh = () => {
    if (!currentProjectId) return;
    
    const projects = getAllProjects();
    const project = projects.find(p => p.metadata.id === currentProjectId);
    
    if (project) {
      setData(project.data);
      console.log('Project refreshed from storage');
    }
  };

  // Live Sync Polling
  useEffect(() => {
    if (!fileHandle) return;

    const checkFile = async () => {
      try {
        const file = await fileHandle.getFile();
        if (file.lastModified > lastModRef.current) {
          // File has changed
          console.log('File change detected, reloading...');
          const text = await file.text();
          try {
            const parsed = JSON.parse(text);
            if (parsed.master && parsed.master.tasks) {
              const updatedData = { ...parsed, fileName: file.name };
              setData(updatedData);
              lastModRef.current = file.lastModified;
              setSyncError(null);
              
              // Update in localStorage if we have a current project
              if (currentProjectId) {
                // Try to get path from file
                // @ts-ignore
                const filePath = file.webkitRelativePath || file.path || undefined;
                saveProject(updatedData, file.name, currentProjectId, filePath);
              }
            }
          } catch (e) {
            console.warn("Live Reload: Invalid JSON", e);
            setSyncError("File changed but JSON is invalid. Pausing updates.");
          }
        }
      } catch (e) {
        console.error("Error accessing file handle:", e);
        // If we lose permission or file is gone, we might stop polling or show error
        setSyncError("Lost access to file. Live sync stopped.");
      }
    };

    const intervalId = setInterval(checkFile, 1000);
    return () => clearInterval(intervalId);
  }, [fileHandle, currentProjectId]);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
        <AnimatePresence mode="wait">
          {!data ? (
            <Landing key="landing" onDataLoaded={handleDataLoaded} />
          ) : (
            <Dashboard 
              key="dashboard" 
              data={data} 
              currentTagData={currentTagData}
              onReset={handleReset}
              onSwitchProject={handleSwitchProject}
              onDeleteProject={handleDeleteProject}
              onAddNewProject={handleAddNewProject}
              onRenameProject={handleRenameProject}
              onRefresh={handleRefresh}
              onSwitchTag={handleSwitchTag}
              currentProjectId={currentProjectId}
              availableProjects={availableProjects}
              currentTag={currentTag}
              availableTags={availableTags}
              isSyncing={!!fileHandle}
              syncError={syncError}
            />
          )}
        </AnimatePresence>
        <Analytics />
      </div>
    </ThemeProvider>
  );
}

// Types for File System Access API
interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
}

interface FileSystemFileHandle extends FileSystemHandle {
  getFile(): Promise<File>;
}
