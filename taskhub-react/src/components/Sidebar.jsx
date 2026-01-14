import React from "react";

export default function Sidebar({
  collapsed,
  onToggle,
  folders,
  selectedFolderId,
  onSelectFolder,
  quick,
  setQuick,
  onOpenAddFolder,     // IMPORTANT: открываем модалку
  onRenameFolder,
  onDeleteFolder,
}) {
  return (
    <aside className={`sb ${collapsed ? "sb--collapsed" : ""}`}>
      <div className="sbTop">
        <button className="iconBtn" onClick={onToggle} title="Menu">
          ≡
        </button>

        {!collapsed && (
          <div className="brand">
            <div className="logoDot" />
            <div>
              <div className="brandTitle">TaskHub</div>
              <div className="brandSub">white • pink • calendar</div>
            </div>
          </div>
        )}
      </div>

      {!collapsed && (
        <>
          <div className="section">
            <div className="sectionTitle">Quick</div>
            <div className="rowWrap">
              {[
                ["all", "All"],
                ["today", "Today"],
                ["tomorrow", "Tomorrow"],
                ["overdue", "Overdue"],
                ["nodate", "No date"],
              ].map(([k, label]) => (
                <button
                  key={k}
                  className={`chip ${quick === k ? "chipOn" : ""}`}
                  onClick={() => setQuick(k)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="section">
            <div className="sectionTitle">Folders</div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
              <button className="miniBtn" onClick={onOpenAddFolder}>
                + Add
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {folders.map((f) => (
                <div
                  key={f.id}
                  className={`folderRow ${selectedFolderId === f.id ? "folderActive" : ""}`}
                  onClick={() => onSelectFolder(f.id)}
                >
                  <div className="folderDot" style={{ background: f.color }} />
                  <div className="folderName">{f.name}</div>

                  <div className="folderTools" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="ghostIcon"
                      title="Rename"
                      onClick={() => {
                        const name = prompt("Rename folder:", f.name);
                        if (name && name.trim()) onRenameFolder(f.id, name.trim());
                      }}
                    >
                      ✎
                    </button>
                    {f.id !== "inbox" && (
                      <button
                        className="ghostIcon"
                        title="Delete"
                        onClick={() => {
                          if (confirm(`Delete "${f.name}"?`)) onDeleteFolder(f.id);
                        }}
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

