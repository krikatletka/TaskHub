import React, { useMemo, useState } from "react";

function fmt(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}
function isOverdue(iso, isDone) {
  if (!iso || isDone) return false;
  const d = new Date(iso);
  d.setHours(23, 59, 59, 999);
  return d.getTime() < Date.now();
}

export default function TaskCard({
  task,
  meta,
  folders,
  onToggle,
  onDelete,
  onSaveTitle,
  onSetFolder,
  onSetDueDate,   // IMPORTANT
  onClearDue,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);

  const folder = useMemo(() => {
    const id = meta?.folderId ?? "inbox";
    return folders.find((f) => f.id === id) ?? folders[0];
  }, [meta, folders]);

  const overdue = isOverdue(meta?.dueDate, task.isDone);

  const dueValue = meta?.dueDate ? new Date(meta.dueDate).toISOString().slice(0, 10) : "";

  return (
    <div
      className={`card ${task.isDone ? "cardDone" : ""}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/taskId", String(task.id));
        e.dataTransfer.effectAllowed = "move";
      }}
      title="Drag me to calendar day"
    >
      <button className={`check ${task.isDone ? "checkOn" : ""}`} onClick={onToggle}>
        {task.isDone ? "✓" : ""}
      </button>

      <div className="cardMain">
        {!editing ? (
          <div className="titleRow">
            <div className={`title ${task.isDone ? "titleDone" : ""}`}>{task.title}</div>

            <span className="tag">
              <span className="tagDot" style={{ background: folder.color }} />
              {folder.name}
            </span>

            {meta?.dueDate ? (
              <span className={`pill ${overdue ? "pillDanger" : "pillInfo"}`}>
                {overdue ? "Overdue" : "Due"}: {fmt(meta.dueDate)}
              </span>
            ) : (
              <span className="pill pillMuted">No deadline</span>
            )}
          </div>
        ) : (
          <div className="fieldRow">
            <input className="input" value={draft} onChange={(e) => setDraft(e.target.value)} />
            <button
              className="btn primary"
              onClick={() => {
                const t = draft.trim();
                if (!t) return;
                onSaveTitle(t);
                setEditing(false);
              }}
            >
              Save
            </button>
            <button
              className="btn"
              onClick={() => {
                setDraft(task.title);
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        )}

        <div className="metaRow">
          <span className="metaLabel">Folder</span>
          <select className="select" value={meta?.folderId ?? "inbox"} onChange={(e) => onSetFolder(e.target.value)}>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          <span className="metaLabel">Due</span>
          <input
            className="input"
            type="date"
            value={dueValue}
            onChange={(e) => {
              const v = e.target.value; // YYYY-MM-DD or ""
              onSetDueDate(v ? new Date(v + "T00:00:00").toISOString() : null);
            }}
            style={{ width: 165 }}
            title="Due date"
          />

          {meta?.dueDate && <button className="btn" onClick={onClearDue}>Clear</button>}
          {!editing && <button className="btn" onClick={() => setEditing(true)}>Edit</button>}
        </div>
      </div>

      <div className="cardTools">
        <button className="btn" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

