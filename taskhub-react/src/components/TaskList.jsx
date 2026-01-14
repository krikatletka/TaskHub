import React from "react";
import TaskCard from "./TaskCard.jsx";

export default function TaskList({
  tasks,
  metaById,
  folders,
  onToggle,
  onDelete,
  onSaveTitle,
  onSetFolder,
  onSetDueDate,  // IMPORTANT
  onClearDue,
}) {
  if (!tasks.length) {
    return (
      <div className="empty">
        <div className="emptyT">No tasks here</div>
        <div className="emptyS">Try another folder / day, or add a new one ✨</div>
      </div>
    );
  }

  return (
    <div className="list">
      {tasks.map((t) => (
        <TaskCard
          key={t.id}
          task={t}
          meta={metaById[t.id]}
          folders={folders}
          onToggle={() => onToggle(t)}
          onDelete={() => onDelete(t)}
          onSaveTitle={(title) => onSaveTitle(t, title)}
          onSetFolder={(folderId) => onSetFolder(t, folderId)}
          onSetDueDate={(isoOrNull) => onSetDueDate(t, isoOrNull)}
          onClearDue={() => onClearDue(t)}
        />
      ))}
    </div>
  );
}
