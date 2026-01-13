import { useEffect, useMemo, useState } from "react";

const API_URL = "https://localhost:7102/api/Tasks";

const THEMES = {
  pink:   { name: "Pink",   accent: "#ff4d8d", bg: "#fff1f6", card: "#ffffff", border: "#ffd1e1", text: "#2b2b2b" },
  purple: { name: "Purple", accent: "#8b5cf6", bg: "#f5f3ff", card: "#ffffff", border: "#ddd6fe", text: "#2b2b2b" },
  blue:   { name: "Blue",   accent: "#3b82f6", bg: "#eff6ff", card: "#ffffff", border: "#bfdbfe", text: "#1f2937" },
  green:  { name: "Green",  accent: "#10b981", bg: "#ecfdf5", card: "#ffffff", border: "#a7f3d0", text: "#1f2937" },
  dark:   { name: "Dark",   accent: "#f472b6", bg: "#0b0b10", card: "#12121a", border: "#2b2b38", text: "#f2f2f2" },
};

const LS_THEME_KEY = "taskhub_theme";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");

  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  const [toasts, setToasts] = useState([]);

  const [themeKey, setThemeKey] = useState(() => localStorage.getItem(LS_THEME_KEY) || "pink");
  const theme = THEMES[themeKey] ?? THEMES.pink;

  useEffect(() => {
    localStorage.setItem(LS_THEME_KEY, themeKey);
  }, [themeKey]);

  function pushToast(type, title, msg, ms = 2200) {
    const id = Date.now() + Math.random();
    const toast = { id, type, title, msg };
    setToasts((prev) => [...prev, toast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, ms);
  }

  async function apiFetch(url, options) {
    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`${res.status} ${res.statusText} ${text}`.trim());
    }
    return res;
  }

  async function loadTasks() {
    setLoading(true);
    try {
      const res = await apiFetch(API_URL);
      const data = await res.json();
      setTasks(data);
    } catch (e) {
      console.error(e);
      pushToast("error", "Load failed", "Check API / HTTPS certificate / CORS");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  const visibleTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...tasks];

    if (status === "active") list = list.filter((t) => !t.isDone);
    if (status === "done") list = list.filter((t) => t.isDone);

    if (q) list = list.filter((t) => (t.title ?? "").toLowerCase().includes(q));

    if (sort === "newest") list.sort((a, b) => b.id - a.id);
    if (sort === "oldest") list.sort((a, b) => a.id - b.id);
    if (sort === "az") list.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
    if (sort === "doneFirst") list.sort((a, b) => Number(b.isDone) - Number(a.isDone) || (b.id - a.id));

    return list;
  }, [tasks, query, status, sort]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.isDone).length;
    const active = total - done;
    return { total, done, active };
  }, [tasks]);

  async function addTask(e) {
    e.preventDefault();

    const trimmed = title.trim();
    if (!trimmed) {
      pushToast("warn", "Empty title", "Type something first");
      return;
    }

    const tempId = -Date.now();
    const temp = { id: tempId, title: trimmed, isDone: false };
    setTasks((prev) => [temp, ...prev]);
    setTitle("");

    try {
      const res = await apiFetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      const created = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === tempId ? created : t)));
      pushToast("success", "Added", trimmed);
    } catch (e2) {
      console.error(e2);
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      pushToast("error", "Add failed", "Server rejected the request");
    }
  }

  async function toggleDone(id) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, isDone: !t.isDone } : t)));

    try {
      await apiFetch(`${API_URL}/${id}/toggle`, { method: "PATCH" });
    } catch (e) {
      console.error(e);
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, isDone: !t.isDone } : t)));
      pushToast("error", "Toggle failed", "Could not update this task");
    }
  }

  function startEdit(t) {
    setEditingId(t.id);
    setEditingTitle(t.title ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingTitle("");
  }

  async function saveEdit(id) {
    const trimmed = editingTitle.trim();
    if (!trimmed) {
      pushToast("warn", "Empty title", "Title cannot be empty");
      return;
    }

    const before = tasks.find((t) => t.id === id);
    if (!before) return;

    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, title: trimmed } : t)));
    cancelEdit();

    try {
      await apiFetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed, isDone: before.isDone }),
      });
      pushToast("success", "Updated", trimmed);
    } catch (e) {
      console.error(e);
      setTasks((prev) => prev.map((t) => (t.id === id ? before : t)));
      pushToast("error", "Update failed", "Rolled back changes");
    }
  }

  async function deleteTask(id) {
    const before = tasks.find((t) => t.id === id);
    if (!before) return;

    if (!confirm(`Delete task "${before.title}"?`)) return;

    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await apiFetch(`${API_URL}/${id}`, { method: "DELETE" });
      pushToast("success", "Deleted", before.title);
    } catch (e) {
      console.error(e);
      setTasks((prev) => [before, ...prev]);
      pushToast("error", "Delete failed", "Task restored");
    }
  }

  async function clearCompleted() {
    const done = tasks.filter((t) => t.isDone);
    if (done.length === 0) return;

    if (!confirm(`Clear ${done.length} completed task(s)?`)) return;

    const before = tasks;
    const doneIds = new Set(done.map((t) => t.id));

    setTasks((prev) => prev.filter((t) => !doneIds.has(t.id)));

    try {
      await Promise.allSettled(done.map((t) => apiFetch(`${API_URL}/${t.id}`, { method: "DELETE" })));
      pushToast("success", "Cleared", `${done.length} removed`);
    } catch (e) {
      console.error(e);
      setTasks(before);
      pushToast("error", "Clear failed", "Rolled back changes");
    }
  }

  const styles = `
    * { box-sizing: border-box; }
    html, body, #root { height: 100%; margin: 0; }
    button, input, select { font: inherit; }
    button:disabled { opacity: 0.55; cursor: not-allowed; }
  `;

  const page = {
    minHeight: "100%",
    background: theme.bg,
    color: theme.text,
  };

  const container = {
    width: "100%",
    padding: 24,
    fontFamily: "system-ui",
  };

  const content = {
    width: "100%",
    maxWidth: "none",
    margin: 0,
  };

  const card = {
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: 18,
    padding: 16,
    boxShadow: themeKey === "dark" ? "0 12px 30px rgba(0,0,0,0.35)" : "0 12px 30px rgba(0,0,0,0.06)",
  };

  const input = {
    height: 44,
    padding: "0 12px",
    borderRadius: 14,
    border: `1px solid ${theme.border}`,
    outline: "none",
    background: theme.card,
    color: theme.text,
  };

  const btn = {
    height: 44,
    padding: "0 14px",
    borderRadius: 14,
    border: `1px solid ${theme.border}`,
    background: theme.card,
    color: theme.text,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const btnPrimary = {
    ...btn,
    border: `1px solid ${theme.accent}`,
    background: theme.accent,
    color: "#fff",
    fontWeight: 700,
  };

  const btnDanger = {
    ...btn,
    border: "1px solid #ef4444",
    background: "#ef4444",
    color: "#fff",
    fontWeight: 700,
  };

  return (
    <div style={page}>
      <style>{styles}</style>

      <div style={container}>
        <div style={content}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 16,
              alignItems: "start",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <h1 style={{ margin: 0, fontSize: 44, letterSpacing: -1 }}>TaskHub</h1>
                <span style={{ opacity: 0.7, fontWeight: 600 }}>(React)</span>
              </div>
              <div style={{ marginTop: 6, opacity: 0.75 }}>
                React frontend connected to ASP.NET Core API
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
              <span style={{ fontSize: 14, opacity: 0.75 }}>Theme:</span>
              <select
                value={themeKey}
                onChange={(e) => setThemeKey(e.target.value)}
                style={{ ...input, paddingRight: 10 }}
              >
                {Object.entries(THEMES).map(([key, t]) => (
                  <option key={key} value={key}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 18, ...card }}>
            <form onSubmit={addTask} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a task..."
                maxLength={100}
                style={input}
              />
              <button type="submit" style={btnPrimary}>Add</button>
            </form>

            <div
              style={{
                marginTop: 12,
                display: "grid",
                gridTemplateColumns: "1fr 140px 160px auto auto",
                gap: 12,
                alignItems: "center",
              }}
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                style={input}
              />

              <select value={status} onChange={(e) => setStatus(e.target.value)} style={input}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="done">Done</option>
              </select>

              <select value={sort} onChange={(e) => setSort(e.target.value)} style={input}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="az">A–Z</option>
                <option value="doneFirst">Done first</option>
              </select>

              <button type="button" onClick={loadTasks} style={btn}>Refresh</button>

              <button type="button" onClick={clearCompleted} disabled={stats.done === 0} style={btn}>
                Clear completed
              </button>
            </div>

            <div style={{ marginTop: 10, opacity: 0.75, fontSize: 14 }}>
              {visibleTasks.length} shown • {stats.total} total • {stats.active} active • {stats.done} done
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            {loading ? (
              <div style={{ opacity: 0.8 }}>Loading…</div>
            ) : visibleTasks.length === 0 ? (
              <div style={{ opacity: 0.8 }}>No tasks</div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
                {visibleTasks.map((t) => (
                  <li
                    key={t.id}
                    style={{
                      ...card,
                      padding: 14,
                      opacity: t.isDone ? 0.78 : 1,
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    <input type="checkbox" checked={t.isDone} onChange={() => toggleDone(t.id)} />

                    {editingId === t.id ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, alignItems: "center" }}>
                        <input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          maxLength={100}
                          style={input}
                        />
                        <button onClick={() => saveEdit(t.id)} style={btnPrimary}>Save</button>
                        <button onClick={cancelEdit} style={btn}>Cancel</button>
                      </div>
                    ) : (
                      <div style={{ textDecoration: t.isDone ? "line-through" : "none", fontSize: 16 }}>
                        {t.title}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => startEdit(t)} style={btn}>Edit</button>
                      <button onClick={() => deleteTask(t.id)} style={btnDanger}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          display: "grid",
          gap: 10,
          width: 340,
          maxWidth: "calc(100vw - 32px)",
          zIndex: 9999,
        }}
      >
        {toasts.map((t) => {
          const border =
            t.type === "success" ? "#22c55e" :
            t.type === "error" ? "#ef4444" :
            t.type === "warn" ? "#f59e0b" :
            theme.accent;

          return (
            <div
              key={t.id}
              style={{
                background: theme.card,
                border: `1px solid ${theme.border}`,
                borderLeft: `6px solid ${border}`,
                borderRadius: 14,
                padding: 12,
                boxShadow: themeKey === "dark" ? "0 10px 30px rgba(0,0,0,0.35)" : "0 10px 30px rgba(0,0,0,0.08)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{t.title}</div>
                  <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>{t.msg}</div>
                </div>
                <button onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} style={btn}>
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
