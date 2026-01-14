const KEY = "taskhub_folders_v2";

export const DEFAULT_FOLDERS = [
  { id: "inbox", name: "Inbox", color: "#ff4da6" },
  { id: "today", name: "Today", color: "#2dd4bf" },
  { id: "study", name: "Study", color: "#ff7ac8" },
  { id: "work", name: "Work", color: "#f59e0b" },
];

export function loadFolders() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : DEFAULT_FOLDERS;
  } catch {
    return DEFAULT_FOLDERS;
  }
}

export function saveFolders(folders) {
  localStorage.setItem(KEY, JSON.stringify(folders));
}
