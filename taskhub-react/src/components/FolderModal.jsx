import React, { useEffect, useState } from "react";

export default function FolderModal({ open, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#ff4da6");

  useEffect(() => {
    if (open) {
      setName("");
      setColor("#ff4da6");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 3000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 420,
          background: "rgba(255,255,255,.96)",
          border: "1px solid rgba(31,36,48,.12)",
          borderRadius: 18,
          padding: 16,
          boxShadow: "0 20px 60px rgba(17,24,39,.18)",
          backdropFilter: "blur(8px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontWeight: 950, fontSize: 18 }}>New folder</div>
        <div style={{ marginTop: 6, color: "#6b7280", fontSize: 12 }}>
          Choose a name and color
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>Folder name</span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. University"
              autoFocus
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>Color</span>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: 44, height: 38, border: "none", background: "transparent" }}
                title="Pick color"
              />
              <input className="input" value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn primary"
            onClick={() => {
              const n = name.trim();
              if (!n) return;
              onSubmit({ name: n, color });
              onClose();
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
