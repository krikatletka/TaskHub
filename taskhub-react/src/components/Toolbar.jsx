import React from "react";

export default function Toolbar({
  newTitle,
  setNewTitle,
  newDueDate,
  setNewDueDate,
  onAdd,
  search,
  setSearch,
  status,
  setStatus,
  sort,
  setSort,
}) {
  return (
    <div className="toolbar">
      <div className="field" style={{ flex: 1 }}>
        <div className="label">New task</div>
        <div className="fieldRow">
          <input
            className="input"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add something…"
            onKeyDown={(e) => e.key === "Enter" && onAdd()}
          />

          <input
            className="input"
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            title="Due date"
            style={{ width: 170 }}
          />

          <button className="btn primary" onClick={onAdd}>
            Add
          </button>
        </div>
      </div>

      <div className="toolbarRight">
        <div className="field">
          <div className="label">Search</div>
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="title…"
          />
        </div>

        <div className="field">
          <div className="label">Status</div>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div className="field">
          <div className="label">Sort</div>
          <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="created_desc">Created: new → old</option>
            <option value="created_asc">Created: old → new</option>
            <option value="title_asc">Title: A → Z</option>
            <option value="title_desc">Title: Z → A</option>
            <option value="due_asc">Due: soon → later</option>
            <option value="due_desc">Due: later → soon</option>
          </select>
        </div>
      </div>
    </div>
  );
}

