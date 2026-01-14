import React, { useEffect, useMemo, useState } from "react";
import "./styles/theme.css";

import Sidebar from "./components/Sidebar.jsx";
import FolderModal from "./components/FolderModal.jsx";
import Toolbar from "./components/Toolbar.jsx";
import TaskList from "./components/TaskList.jsx";
import CalendarPanel from "./components/CalendarPanel.jsx";

import { getTasks, createTask, toggleTask, updateTask, deleteTask } from "./services/tasksApi.js";
import { DEFAULT_FOLDERS, loadFolders, saveFolders } from "./services/foldersApi.js";

const META_KEY = "taskhub_meta_v4";

function loadMeta() {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveMeta(meta) {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function ymd(d) {
  const x = new Date(d);
  const yyyy = x.getFullYear();
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function App() {
  const [collapsed, setCollapsed] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [folders, setFolders] = useState(() => loadFolders() ?? DEFAULT_FOLDERS);
  const [selectedFolderId, setSelectedFolderId] = useState("inbox");

  const [metaById, setMetaById] = useState(() => loadMeta());

  const [quick, setQuick] = useState("all");
  const [selectedDay, setSelectedDay] = useState(null);
  const [cursor, setCursor] = useState(() => new Date());

  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState(""); // YYYY-MM-DD
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("created_desc");

  // folder modal
  const [folderModalOpen, setFolderModalOpen] = useState(false);

  useEffect(() => saveFolders(folders), [folders]);
  useEffect(() => saveMeta(metaById), [metaById]);

  async function refresh() {
    setLoading(true);
    try {
      const data = await getTasks();
      setTasks(data);

      setMetaById((prev) => {
        const next = { ...prev };
        for (const t of data) {
          if (!next[t.id]) {
            next[t.id] = {
              folderId: "inbox",
              dueDate: null,
              createdAt: new Date().toISOString(),
            };
          }
        }
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function add() {
    const title = newTitle.trim();
    if (!title) return;

    const created = await createTask(title);

    const iso = newDueDate ? new Date(newDueDate + "T00:00:00").toISOString() : null;

    setNewTitle("");
    setNewDueDate("");

    setTasks((p) => [created, ...p]);
    setMetaById((p) => ({
      ...p,
      [created.id]: {
        folderId: selectedFolderId ?? "inbox",
        dueDate: iso,
        createdAt: new Date().toISOString(),
      },
    }));
  }

  async function onToggle(t) {
    const updated = await toggleTask(t.id);
    setTasks((p) => p.map((x) => (x.id === t.id ? updated : x)));
  }

  async function onDelete(t) {
    if (!confirm(`Delete "${t.title}"?`)) return;
    await deleteTask(t.id);
    setTasks((p) => p.filter((x) => x.id !== t.id));
    setMetaById((p) => {
      const n = { ...p };
      delete n[t.id];
      return n;
    });
  }

  async function onSaveTitle(t, title) {
    const updated = await updateTask(t.id, { title, isDone: t.isDone });
    setTasks((p) => p.map((x) => (x.id === t.id ? updated : x)));
  }

  function onSetFolder(t, folderId) {
    setMetaById((p) => ({ ...p, [t.id]: { ...p[t.id], folderId } }));
  }

  function onSetDueDate(t, isoOrNull) {
    setMetaById((p) => ({ ...p, [t.id]: { ...p[t.id], dueDate: isoOrNull } }));
  }

  function onClearDue(t) {
    setMetaById((p) => ({ ...p, [t.id]: { ...p[t.id], dueDate: null } }));
  }

  function setDueByTaskId(taskId, iso) {
    setMetaById((p) => ({ ...p, [taskId]: { ...p[taskId], dueDate: iso } }));
  }

  // folders actions (NO PROMPT FOR ADD)
  function addFolderFromModal({ name, color }) {
    const id = crypto.randomUUID?.() ?? String(Date.now());
    setFolders((p) => [{ id, name, color }, ...p]);
  }

  function renameFolder(id, name) {
    setFolders((p) => p.map((f) => (f.id === id ? { ...f, name } : f)));
  }

  function deleteFolder(id) {
    if (id === "inbox") return;

    // move tasks to inbox
    setMetaById((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (next[k]?.folderId === id) next[k] = { ...next[k], folderId: "inbox" };
      }
      return next;
    });

    setFolders((p) => p.filter((f) => f.id !== id));
    if (selectedFolderId === id) setSelectedFolderId("inbox");
  }

  const dotsByDate = useMemo(() => {
    const map = new Map();
    for (const t of tasks) {
      const m = metaById[t.id];
      if (!m?.dueDate) continue;
      const key = ymd(m.dueDate);
      const folder = folders.find((f) => f.id === (m.folderId ?? "inbox")) ?? folders[0];
      const arr = map.get(key) ?? [];
      arr.push(folder.color);
      map.set(key, arr);
    }
    return map;
  }, [tasks, metaById, folders]);

  const visible = useMemo(() => {
    const now = startOfDay(new Date());
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const q = search.trim().toLowerCase();
    let list = [...tasks];

    // folder filter
    list = list.filter((t) => (metaById[t.id]?.folderId ?? "inbox") === selectedFolderId);

    // quick filters
    list = list.filter((t) => {
      const dueIso = metaById[t.id]?.dueDate;
      const due = dueIso ? startOfDay(new Date(dueIso)) : null;

      if (quick === "all") return true;
      if (quick === "nodate") return !due;
      if (!due) return false;

      if (quick === "today") return due.getTime() === now.getTime();
      if (quick === "tomorrow") return due.getTime() === tomorrow.getTime();
      if (quick === "overdue") return due.getTime() < now.getTime() && !t.isDone;

      return true;
    });

    // calendar selected day
    if (selectedDay) {
      const key = ymd(selectedDay);
      list = list.filter((t) => {
        const due = metaById[t.id]?.dueDate;
        return due && ymd(due) === key;
      });
    }

    // status
    if (status === "open") list = list.filter((t) => !t.isDone);
    if (status === "done") list = list.filter((t) => t.isDone);

    // search
    if (q) list = list.filter((t) => (t.title ?? "").toLowerCase().includes(q));

    // sort
    const getCreated = (t) => new Date(metaById[t.id]?.createdAt ?? 0).getTime();
    const getDue = (t) => (metaById[t.id]?.dueDate ? new Date(metaById[t.id].dueDate).getTime() : Infinity);

    list.sort((a, b) => {
      switch (sort) {
        case "created_asc":
          return getCreated(a) - getCreated(b);
        case "created_desc":
          return getCreated(b) - getCreated(a);
        case "title_asc":
          return (a.title ?? "").localeCompare(b.title ?? "");
        case "title_desc":
          return (b.title ?? "").localeCompare(a.title ?? "");
        case "due_asc":
          return getDue(a) - getDue(b);
        case "due_desc":
          return getDue(b) - getDue(a);
        default:
          return 0;
      }
    });

    return list;
  }, [tasks, metaById, selectedFolderId, quick, selectedDay, status, search, sort]);

  const folderName = folders.find((f) => f.id === selectedFolderId)?.name ?? "Folder";

  return (
    <div className="shell">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        folders={folders}
        selectedFolderId={selectedFolderId}
        onSelectFolder={(id) => {
          setSelectedFolderId(id);
          setSelectedDay(null);
        }}
        quick={quick}
        setQuick={setQuick}
        onOpenAddFolder={() => setFolderModalOpen(true)}
        onRenameFolder={renameFolder}
        onDeleteFolder={deleteFolder}
      />

      <FolderModal
        open={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        onSubmit={addFolderFromModal}
      />

      <main className="main">
        <div className="topBar">
          <div>
            <div className="h1">Your tasks</div>
            <div className="sub">
              Folder: <b>{folderName}</b>
              {selectedDay ? ` • Day: ${ymd(selectedDay)}` : ""}
              {loading ? " • loading…" : ` • ${visible.length} items`}
            </div>
          </div>

          <button className="btn" onClick={refresh}>
            Refresh
          </button>
        </div>

        <Toolbar
          newTitle={newTitle}
          setNewTitle={setNewTitle}
          newDueDate={newDueDate}
          setNewDueDate={setNewDueDate}
          onAdd={add}
          search={search}
          setSearch={setSearch}
          status={status}
          setStatus={setStatus}
          sort={sort}
          setSort={setSort}
        />

        <section className="split">
          <div>
            <TaskList
              tasks={visible}
              metaById={metaById}
              folders={folders}
              onToggle={onToggle}
              onDelete={onDelete}
              onSaveTitle={onSaveTitle}
              onSetFolder={onSetFolder}
              onSetDueDate={onSetDueDate}
              onClearDue={onClearDue}
            />
          </div>

          <div>
            <CalendarPanel
              cursor={cursor}
              setCursor={setCursor}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              dotsByDate={dotsByDate}
              onDropTaskToDate={(taskId, iso) => setDueByTaskId(taskId, iso)}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
