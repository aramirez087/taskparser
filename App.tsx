import React, { useState, useEffect, useRef } from 'react';
import { RootData } from './types';
import { Landing } from './components/Landing';
import { Dashboard } from './components/Dashboard';
import { AnimatePresence } from 'framer-motion';

export default function App() {
  const [data, setData] = useState<RootData | null>(null);
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const lastModRef = useRef<number>(0);

  const handleDataLoaded = (loadedData: RootData, handle: FileSystemFileHandle | null = null) => {
    setData(loadedData);
    setFileHandle(handle);
    setSyncError(null);
    
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
              setData({ ...parsed, fileName: file.name });
              lastModRef.current = file.lastModified;
              setSyncError(null);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-slate-950 pointer-events-none"></div>
      
      <AnimatePresence mode="wait">
        {!data ? (
          <Landing key="landing" onDataLoaded={handleDataLoaded} />
        ) : (
          <Dashboard 
            key="dashboard" 
            data={data} 
            onReset={handleReset} 
            isSyncing={!!fileHandle}
            syncError={syncError}
          />
        )}
      </AnimatePresence>
    </div>
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
