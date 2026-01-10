const API_URL = "https://localhost:7102/api/Tasks";

const taskList = document.getElementById("taskList");
const taskInput = document.getElementById("taskInput");
const form = document.getElementById("task-form");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const sortSelect = document.getElementById("sortSelect");
const refreshBtn = document.getElementById("refreshBtn");
const clearDoneBtn = document.getElementById("clearDoneBtn");
const stats = document.getElementById("stats");
const toastsRoot = document.getElementById("toasts");

// UI state
let tasksCache = [];
let editingId = null;

// local "loading" sets
const busyIds = new Set(); // tasks that are updating
let globalBusy = false;    // e.g., adding or full refresh

function escapeHtml(str) {
  return (str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ---------- Toasts ----------
function toast(type, title, msg, ms = 2200) {
  if (!toastsRoot) return; // <- важно

  const el = document.createElement("div");
  el.className = `toast ${type}`;

  el.innerHTML = `
    <div class="t-title">${escapeHtml(title)}</div>
    <div class="t-msg">${escapeHtml(msg)}</div>
  `;

  toastsRoot.appendChild(el);

  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(6px)";
    el.style.transition = "160ms";
    setTimeout(() => el.remove(), 180);
  }, ms);
}

// ---------- Helpers ----------
function setGlobalBusy(v) {
  globalBusy = v;

  if (refreshBtn) refreshBtn.disabled = v;

  const addBtn = form?.querySelector?.("button[type='submit']");
  if (addBtn) addBtn.disabled = v;

  if (clearDoneBtn) clearDoneBtn.disabled = v || !tasksCache.some(t => t.isDone);
}


function markBusy(id, v) {
  if (v) busyIds.add(id);
  else busyIds.delete(id);
}

function isBusy(id) {
  return busyIds.has(id);
}

// optimistic update in cache + rerender
function updateTaskInCache(id, updater) {
  const idx = tasksCache.findIndex(t => t.id === id);
  if (idx === -1) return;
  const copy = { ...tasksCache[idx] };
  updater(copy);
  tasksCache[idx] = copy;
}
async function fetchWithTimeout(url, options = {}, ms = 6000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}
// ---------- Data ----------
async function loadTasks() {
  setGlobalBusy(true);
  taskList.innerHTML = `<li class="badge">Loading…</li>`;

  try {
    const res = await fetchWithTimeout(API_URL, {}, 6000);
    if (!res.ok) throw new Error(`Load failed: ${res.status}`);

    tasksCache = await res.json();
    render();
    toast("success", "Loaded", "Tasks refreshed");
  } catch (e) {
    taskList.innerHTML = `<li class="badge">Failed to load</li>`;
    toast("error", "Error", String(e.message || e));
  } finally {
    setGlobalBusy(false);
    render(); // ✅ ВОТ ЭТО ДОБАВЬ
  }
}


function getFilteredSortedTasks() {
  const q = (searchInput.value || "").trim().toLowerCase();
  const status = statusFilter.value;
  const sort = sortSelect.value;

  let list = [...tasksCache];

  if (status === "active") list = list.filter(t => !t.isDone);
  if (status === "done") list = list.filter(t => t.isDone);

  if (q.length > 0) list = list.filter(t => (t.title || "").toLowerCase().includes(q));

  if (sort === "newest") list.sort((a, b) => b.id - a.id);
  if (sort === "oldest") list.sort((a, b) => a.id - b.id);
  if (sort === "az") list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  if (sort === "doneFirst") list.sort((a, b) => Number(b.isDone) - Number(a.isDone) || (b.id - a.id));

  return list;
}

function renderStats() {
  const total = tasksCache.length;
  const done = tasksCache.filter(t => t.isDone).length;
  const active = total - done;
  const shown = getFilteredSortedTasks().length;

  stats.textContent = `${shown} shown • ${total} total • ${active} active • ${done} done`;

  const hasDone = tasksCache.some(t => t.isDone);
  if (clearDoneBtn) clearDoneBtn.disabled = globalBusy || !hasDone;
}

function render() {
  const list = getFilteredSortedTasks();
  renderStats();

  if (list.length === 0) {
    taskList.innerHTML = `<li class="badge">No tasks</li>`;
    return;
  }

  taskList.innerHTML = "";

  for (const t of list) {
    const li = document.createElement("li");
    li.className = "task" + (t.isDone ? " done" : "") + (isBusy(t.id) ? " loading" : "");

    // checkbox toggle
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!t.isDone;
    cb.disabled = isBusy(t.id) || globalBusy;
    cb.addEventListener("change", () => toggleDone(t.id));
    li.appendChild(cb);

    // center
    const center = document.createElement("div");
    center.className = "title";

    if (editingId === t.id) {
      const row = document.createElement("div");
      row.className = "editRow";

      const input = document.createElement("input");
      input.className = "input";
      input.value = t.title ?? "";
      input.maxLength = 100;
      input.disabled = isBusy(t.id) || globalBusy;

      const saveBtn = document.createElement("button");
      saveBtn.className = "btn small primary";
      saveBtn.textContent = "Save";
      saveBtn.disabled = isBusy(t.id) || globalBusy;
      saveBtn.addEventListener("click", () => saveEdit(t.id, input.value, t.isDone));

      const cancelBtn = document.createElement("button");
      cancelBtn.className = "btn small";
      cancelBtn.textContent = "Cancel";
      cancelBtn.disabled = isBusy(t.id) || globalBusy;
      cancelBtn.addEventListener("click", () => {
        editingId = null;
        render();
      });

      row.appendChild(input);
      row.appendChild(saveBtn);
      row.appendChild(cancelBtn);
      center.appendChild(row);
    } else {
      center.innerHTML = escapeHtml(t.title ?? "");
    }

    li.appendChild(center);

    // actions
    const actions = document.createElement("div");
    actions.className = "actions";

    const editBtn = document.createElement("button");
    editBtn.className = "btn small";
    editBtn.textContent = "Edit";
    editBtn.disabled = isBusy(t.id) || globalBusy;
    editBtn.addEventListener("click", () => {
      editingId = t.id;
      render();
    });

    const delBtn = document.createElement("button");
    delBtn.className = "btn small";
    delBtn.textContent = "Delete";
    delBtn.disabled = isBusy(t.id) || globalBusy;
    delBtn.addEventListener("click", () => deleteTask(t.id));

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(actions);

    taskList.appendChild(li);
  }
}

// ---------- API ops with Optimistic UI ----------
async function addTask(title) {
  const trimmed = (title || "").trim();
  if (!trimmed) return;

  setGlobalBusy(true);

  // optimistic: fake temp task
  const tempId = -Date.now();
  const tempTask = { id: tempId, title: trimmed, isDone: false };
  tasksCache = [tempTask, ...tasksCache];
  render();

  try {
    const res = await fetchWithTimeout(
        API_URL,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: trimmed }),
        },
        6000
    );


    if (!res.ok) throw new Error(`Add failed: ${res.status}`);

    const created = await res.json().catch(() => null);

    // replace temp with created
    if (created && typeof created.id === "number") {
      tasksCache = tasksCache.map(t => (t.id === tempId ? created : t));
    } else {
      await loadTasks();
    }

    taskInput.value = "";
    toast("success", "Added", "Task created");
  } catch (e) {
    tasksCache = tasksCache.filter(t => t.id !== tempId);
    render();
    toast("error", "Error", String(e.message || e));
  } finally {
    setGlobalBusy(false);
  }
}

async function toggleDone(id) {
  if (isBusy(id) || globalBusy) return;

  const before = tasksCache.find(t => t.id === id);
  if (!before) return;

  markBusy(id, true);

  updateTaskInCache(id, t => (t.isDone = !t.isDone));
  render();

  try {
    const res = await fetchWithTimeout(
  `${API_URL}/${id}/toggle`,
  { method: "PATCH" },
  6000
);

    if (!res.ok) throw new Error(`Toggle failed: ${res.status}`);
    toast("info", "Updated", "Status changed");
  } catch (e) {
    updateTaskInCache(id, t => (t.isDone = before.isDone));
    render();
    toast("error", "Error", String(e.message || e));
  } finally {
    markBusy(id, false);
    render();
  }
}

async function saveEdit(id, title, isDone) {
  if (isBusy(id) || globalBusy) return;

  const trimmed = (title || "").trim();
  if (!trimmed) {
    toast("error", "Validation", "Title cannot be empty");
    return;
  }

  const before = tasksCache.find(t => t.id === id);
  if (!before) return;

  markBusy(id, true);

  updateTaskInCache(id, t => {
    t.title = trimmed;
    t.isDone = !!isDone;
  });
  editingId = null;
  render();

  try {
   const res = await fetchWithTimeout(
  `${API_URL}/${id}`,
  {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: trimmed, isDone: !!isDone }),
  },
  6000
);


    if (!res.ok) throw new Error(`Update failed: ${res.status}`);
    toast("success", "Saved", "Task updated");
  } catch (e) {
    updateTaskInCache(id, t => {
      t.title = before.title;
      t.isDone = before.isDone;
    });
    render();
    toast("error", "Error", String(e.message || e));
  } finally {
    markBusy(id, false);
    render();
  }
}

async function deleteTask(id) {
  if (isBusy(id) || globalBusy) return;

  const before = tasksCache.find(t => t.id === id);
  if (!before) return;

  markBusy(id, true);

  tasksCache = tasksCache.filter(t => t.id !== id);
  render();

  try {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
    toast("success", "Deleted", "Task removed");
  } catch (e) {
    tasksCache = [before, ...tasksCache];
    render();
    toast("error", "Error", String(e.message || e));
  } finally {
    markBusy(id, false);
    render();
  }
}

async function clearCompleted() {
  if (globalBusy) return;

  const doneTasks = tasksCache.filter(t => t.isDone);
  if (doneTasks.length === 0) {
    toast("info", "Nothing to clear", "No completed tasks");
    return;
  }

  setGlobalBusy(true);

  const before = [...tasksCache];
  const doneIds = new Set(doneTasks.map(t => t.id));
  tasksCache = tasksCache.filter(t => !doneIds.has(t.id));
  render();

  try {
    const results = await Promise.allSettled(
      doneTasks.map(t => fetch(`${API_URL}/${t.id}`, { method: "DELETE" }))
    );

    const failed = [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const task = doneTasks[i];

      if (r.status === "rejected") {
        failed.push(task);
        continue;
      }

      const res = r.value;
      if (!res.ok) failed.push(task);
    }

    if (failed.length === 0) {
      toast("success", "Cleared", `Deleted ${doneTasks.length} completed task(s)`);
      editingId = null;
      return;
    }

    const failedIds = new Set(failed.map(t => t.id));
    const restore = before.filter(t => failedIds.has(t.id));
    tasksCache = [...tasksCache, ...restore];
    render();

    toast(
      "error",
      "Partial error",
      `Deleted ${doneTasks.length - failed.length}, failed ${failed.length}`
    );
  } catch (e) {
    tasksCache = before;
    render();
    toast("error", "Error", String(e.message || e));
  } finally {
    setGlobalBusy(false);
    render();
  }
}

form?.addEventListener("submit", (e) => {
  e.preventDefault();
  addTask(taskInput.value);
});

searchInput?.addEventListener("input", render);
statusFilter?.addEventListener("change", render);
sortSelect?.addEventListener("change", render);

refreshBtn?.addEventListener("click", loadTasks);
clearDoneBtn?.addEventListener("click", clearCompleted);


toast("info", "TaskHub", "Connected to API");
loadTasks();
