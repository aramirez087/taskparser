import React, { useState, useEffect, useRef } from 'react';
import { RootData } from './types';
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
  ProjectMetadata,
  StoredProject
} from './utils/projectManager';

export default function App() {
  const [data, setData] = useState<RootData | null>(null);
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [availableProjects, setAvailableProjects] = useState<ProjectMetadata[]>([]);
  const lastModRef = useRef<number>(0);

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
      }
    }
  }, []);

  const handleDataLoaded = (loadedData: RootData, handle: FileSystemFileHandle | null = null, existingProjectId?: string) => {
    const fileName = loadedData.fileName || 'untitled.json';
    
    // Save to localStorage and get project metadata
    const metadata = saveProject(loadedData, fileName, existingProjectId);
    
    setData(loadedData);
    setFileHandle(handle);
    setSyncError(null);
    setCurrentProjectId(metadata.id);
    
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
                saveProject(updatedData, file.name, currentProjectId);
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
  }, [fileHandle]);

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
              onReset={handleReset}
              onSwitchProject={handleSwitchProject}
              onDeleteProject={handleDeleteProject}
              onAddNewProject={handleAddNewProject}
              currentProjectId={currentProjectId}
              availableProjects={availableProjects}
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
