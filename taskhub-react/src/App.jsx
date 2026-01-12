import { useEffect, useMemo, useState } from "react";

const API_URL = "https://localhost:7102/api/Tasks";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");

  // фильтры (как в твоём vanilla UI)
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all"); // all | active | done
  const [sort, setSort] = useState("newest");  // newest | oldest | az | doneFirst

  // редактирование
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  // ----- API helpers -----
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
      alert("Failed to load tasks. Check API + HTTPS certificate + CORS.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  // ----- derived list (filters + sort) -----
  const visibleTasks = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = [...tasks];

    if (status === "active") list = list.filter(t => !t.isDone);
    if (status === "done") list = list.filter(t => t.isDone);

    if (q) list = list.filter(t => (t.title ?? "").toLowerCase().includes(q));

    if (sort === "newest") list.sort((a, b) => b.id - a.id);
    if (sort === "oldest") list.sort((a, b) => a.id - b.id);
    if (sort === "az") list.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
    if (sort === "doneFirst") list.sort((a, b) => Number(b.isDone) - Number(a.isDone) || (b.id - a.id));

    return list;
  }, [tasks, query, status, sort]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.isDone).length;
    const active = total - done;
    return { total, done, active };
  }, [tasks]);

  // ----- actions -----
  async function addTask(e) {
    e.preventDefault();

    const trimmed = title.trim();
    if (!trimmed) return;

    // optimistic temp
    const tempId = -Date.now();
    const temp = { id: tempId, title: trimmed, isDone: false };
    setTasks(prev => [temp, ...prev]);
    setTitle("");

    try {
      const res = await apiFetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      const created = await res.json();

      setTasks(prev => prev.map(t => (t.id === tempId ? created : t)));
    } catch (e2) {
      console.error(e2);
      // rollback
      setTasks(prev => prev.filter(t => t.id !== tempId));
      alert("Add failed");
    }
  }

  async function toggleDone(id) {
    // optimistic
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, isDone: !t.isDone } : t)));

    try {
      await apiFetch(`${API_URL}/${id}/toggle`, { method: "PATCH" });
    } catch (e) {
      console.error(e);
      // rollback = flip back
      setTasks(prev => prev.map(t => (t.id === id ? { ...t, isDone: !t.isDone } : t)));
      alert("Toggle failed");
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
    if (!trimmed) return;

    const before = tasks.find(t => t.id === id);
    if (!before) return;

    // optimistic
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, title: trimmed } : t)));
    cancelEdit();

    try {
      await apiFetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed, isDone: before.isDone }),
      });
    } catch (e) {
      console.error(e);
      // rollback
      setTasks(prev => prev.map(t => (t.id === id ? before : t)));
      alert("Update failed");
    }
  }

  async function deleteTask(id) {
    const before = tasks.find(t => t.id === id);
    if (!before) return;

    // optimistic
    setTasks(prev => prev.filter(t => t.id !== id));

    try {
      await apiFetch(`${API_URL}/${id}`, { method: "DELETE" });
    } catch (e) {
      console.error(e);
      // rollback
      setTasks(prev => [before, ...prev]);
      alert("Delete failed");
    }
  }

  async function clearCompleted() {
    const done = tasks.filter(t => t.isDone);
    if (done.length === 0) return;

    const before = tasks;
    const doneIds = new Set(done.map(t => t.id));

    // optimistic
    setTasks(prev => prev.filter(t => !doneIds.has(t.id)));

    try {
      await Promise.allSettled(
        done.map(t => apiFetch(`${API_URL}/${t.id}`, { method: "DELETE" }))
      );
    } catch (e) {
      console.error(e);
      setTasks(before);
      alert("Clear completed failed");
    }
  }

  // ----- UI -----
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20, fontFamily: "system-ui" }}>
      <h1 style={{ margin: 0 }}>TaskHub (React)</h1>
      <p style={{ marginTop: 6, opacity: 0.7 }}>React frontend connected to ASP.NET Core API</p>

      <div style={{ marginTop: 16, padding: 14, border: "1px solid #ddd", borderRadius: 12 }}>
        {/* Add */}
        <form onSubmit={addTask} style={{ display: "flex", gap: 10 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a task..."
            maxLength={100}
            style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
          />
          <button type="submit" style={{ padding: "10px 14px", borderRadius: 10 }}>
            Add
          </button>
        </form>

        {/* Toolbar */}
        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            style={{ flex: 1, minWidth: 220, padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
          />

          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: 10, borderRadius: 10 }}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="done">Done</option>
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: 10, borderRadius: 10 }}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="az">A–Z</option>
            <option value="doneFirst">Done first</option>
          </select>

          <button type="button" onClick={loadTasks} style={{ padding: "10px 14px", borderRadius: 10 }}>
            Refresh
          </button>

          <button
            type="button"
            onClick={clearCompleted}
            disabled={stats.done === 0}
            style={{ padding: "10px 14px", borderRadius: 10 }}
          >
            Clear completed
          </button>
        </div>

        <div style={{ marginTop: 10, opacity: 0.75, fontSize: 14 }}>
          {visibleTasks.length} shown • {stats.total} total • {stats.active} active • {stats.done} done
        </div>
      </div>

      {/* List */}
      <div style={{ marginTop: 16 }}>
        {loading ? (
          <div>Loading…</div>
        ) : visibleTasks.length === 0 ? (
          <div>No tasks</div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
            {visibleTasks.map((t) => (
              <li
                key={t.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: 10,
                  alignItems: "center",
                  padding: 12,
                  border: "1px solid #ddd",
                  borderRadius: 12,
                  opacity: t.isDone ? 0.7 : 1,
                }}
              >
                <input type="checkbox" checked={t.isDone} onChange={() => toggleDone(t.id)} />

                {/* Title / Edit */}
                {editingId === t.id ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8 }}>
                    <input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      maxLength={100}
                      style={{ padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
                    />
                    <button onClick={() => saveEdit(t.id)} style={{ borderRadius: 10 }}>
                      Save
                    </button>
                    <button onClick={cancelEdit} style={{ borderRadius: 10 }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ textDecoration: t.isDone ? "line-through" : "none" }}>
                    {t.title}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, flexWrap: "nowrap" }}>
                  <button onClick={() => startEdit(t)} style={{ borderRadius: 10 }}>
                    Edit
                  </button>
                  <button onClick={() => deleteTask(t.id)} style={{ borderRadius: 10 }}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
