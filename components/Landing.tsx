import React, { useState } from 'react';
import { RootData } from '../types';
import { motion } from 'framer-motion';
import { Upload, FileJson, Terminal, AlertCircle, FileSearch, Laptop } from 'lucide-react';

interface LandingProps {
  onDataLoaded: (data: RootData, fileHandle?: any) => void;
}

export const Landing: React.FC<LandingProps> = ({ onDataLoaded }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const parseAndLoad = (raw: string, handle?: any, fileName?: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.master || !parsed.master.tasks) {
        throw new Error("Invalid JSON structure. Missing 'master.tasks'.");
      }
      // Inject filename into data if available
      if (fileName) {
        parsed.fileName = fileName;
      }
      onDataLoaded(parsed as RootData, handle);
    } catch (e: any) {
      setError(e.message || "Invalid JSON");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFile(file);
  };

  const readFile = (file: File, handle?: any) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        parseAndLoad(event.target.result as string, handle, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleOpenFile = async () => {
    try {
      // @ts-ignore - Modern API
      if (window.showOpenFilePicker) {
        // @ts-ignore
        const [handle] = await window.showOpenFilePicker({
          types: [
            {
              description: 'JSON Files',
              accept: {
                'application/json': ['.json'],
              },
            },
          ],
          multiple: false,
        });
        const file = await handle.getFile();
        readFile(file, handle);
      } else {
        // Fallback trigger hidden input
        document.getElementById('hidden-file-input')?.click();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
        setError("Failed to open file");
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const item = e.dataTransfer.items[0];
    if (item && item.kind === 'file') {
      try {
        // Try to get modern handle first
        // @ts-ignore
        if (item.getAsFileSystemHandle) {
           // @ts-ignore
           const handle = await item.getAsFileSystemHandle();
           if (handle.kind === 'file') {
             const file = await handle.getFile();
             readFile(file, handle);
             return;
           }
        }
      } catch (err) {
        console.log("FileSystemAccess API not supported for drop, using fallback");
      }

      // Fallback
      const file = e.dataTransfer.files[0];
      if (file) readFile(file);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen flex items-center justify-center p-4 relative z-10"
    >
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-4 tracking-tight"
          >
            TaskMaster Pulse
          </motion.h1>
          <p className="text-slate-400 text-lg">Give Task Master AI a live cockpit so devs stop re-asking for task status.</p>
        </div>

        <div className="glass-panel rounded-2xl p-8 shadow-2xl shadow-indigo-500/10">
          <div className="flex flex-col gap-6">
            
            {/* Live File Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOpenFile}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white p-4 rounded-xl font-semibold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-3 group"
            >
              <FileSearch className="w-5 h-5" />
              <span>Open File & Watch Changes</span>
              <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full ml-2">Recommended</span>
            </motion.button>

            <div className="flex items-center gap-4 text-slate-600">
               <div className="h-px flex-1 bg-slate-800"></div>
               <span className="text-xs font-mono uppercase tracking-widest">OR</span>
               <div className="h-px flex-1 bg-slate-800"></div>
            </div>

            {/* File Drop Area Style */}
            <div 
              className={`relative group transition-all duration-300 ${isDragging ? 'scale-[1.02]' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <input 
                id="hidden-file-input"
                type="file" 
                accept=".json"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />
              <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-300 ${isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-900/50 hover:bg-slate-800/50 group-hover:border-indigo-500/50'}`}>
                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-base font-medium text-slate-200">Drop JSON file here</h3>
                <p className="text-slate-500 mt-1 text-xs">Supports live sync on compatible browsers</p>
              </div>
            </div>

            {/* Text Paste Area */}
            <div className="relative">
              <textarea
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  setError(null);
                }}
                placeholder="{ 'master': { ... } }"
                className="w-full h-32 bg-slate-950/50 border border-slate-800 rounded-xl p-4 font-mono text-sm text-slate-300 focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent outline-none transition-all resize-none"
              />
              <div className="absolute bottom-4 right-4">
                <button 
                  onClick={() => parseAndLoad(jsonInput)}
                  disabled={!jsonInput.trim()}
                  className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 border border-slate-700"
                >
                  <Terminal className="w-3 h-3" />
                  Visualize Text
                </button>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="text-sm text-red-300">
                  <p className="font-bold mb-1">Parsing Error</p>
                  {error}
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </div>
    </motion.div>
  );
};
