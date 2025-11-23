import React, { useState } from 'react';
import { Check, X, Edit2 } from 'lucide-react';

interface ProjectNameEditorProps {
  projectId: string;
  currentName: string;
  onSave: (projectId: string, newName: string) => void;
}

export const ProjectNameEditor: React.FC<ProjectNameEditorProps> = ({ projectId, currentName, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(currentName);

  const handleSave = () => {
    if (editedName.trim() && editedName !== currentName) {
      onSave(projectId, editedName.trim());
    }
    setIsEditing(false);
    setEditedName(currentName);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedName(currentName);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <input
          type="text"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          className="flex-1 px-2 py-1 text-sm bg-background border border-primary/50 rounded focus:outline-none focus:ring-1 focus:ring-primary"
          autoFocus
          onBlur={handleSave}
        />
        <button
          onClick={handleSave}
          className="p-1 hover:bg-emerald-500/10 rounded text-emerald-600"
          title="Save"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 hover:bg-destructive/10 rounded text-destructive"
          title="Cancel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1">
        <div className="text-sm font-medium text-foreground">{currentName}</div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-all"
        title="Rename project"
      >
        <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </div>
  );
};
