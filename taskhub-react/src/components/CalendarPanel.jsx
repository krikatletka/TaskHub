import React, { useMemo } from "react";

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
function parseYmd(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function CalendarPanel({
  cursor,
  setCursor,
  selectedDay,
  setSelectedDay,
  dotsByDate,
  onDropTaskToDate,
}) {
  const monthLabel = useMemo(() => {
    const m = cursor.toLocaleString(undefined, { month: "long" });
    return `${m} ${cursor.getFullYear()}`;
  }, [cursor]);

  const grid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);

    const firstDay = (first.getDay() + 6) % 7;
    const daysInMonth = last.getDate();

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
  }, [cursor]);

  const today = startOfDay(new Date());

  return (
    <section className="calPanel">
      <div className="calHead">
        <div>
          <div className="calTitle">Calendar</div>
          <div className="calSub">Click day to filter • Drag task to set deadline</div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="miniBtn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
            ←
          </button>
          <div style={{ fontWeight: 950 }}>{monthLabel}</div>
          <button className="miniBtn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
            →
          </button>
        </div>
      </div>

      <div className="calWeek">
        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((w) => (
          <div key={w} className="calWeekDay">{w}</div>
        ))}
      </div>

      <div className="calGrid">
        {grid.map((d, idx) => {
          if (!d) return <div key={idx} className="calCell calEmpty" />;

          const key = ymd(d);
          const dots = dotsByDate.get(key) ?? [];
          const isToday = startOfDay(d).getTime() === today.getTime();
          const isSelected = selectedDay && ymd(selectedDay) === key;

          return (
            <button
              key={idx}
              className={`calCell ${isToday ? "calToday" : ""} ${isSelected ? "calSelected" : ""}`}
              onClick={() => setSelectedDay(parseYmd(key))}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const taskId = e.dataTransfer.getData("text/taskId");
                if (!taskId) return;
                const iso = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
                onDropTaskToDate(taskId, iso);
              }}
            >
              <div className="calDayTop">
                <div className="calNum">{d.getDate()}</div>
                {!!dots.length && <div className="calCount">{dots.length}</div>}
              </div>

              <div className="calDots">
                {dots.slice(0, 4).map((c, i) => (
                  <span key={i} className="calDot" style={{ background: c }} />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
        <button className="btn" onClick={() => setSelectedDay(null)}>Show folder</button>
        <button className="btn primary" onClick={() => setSelectedDay(today)}>Today</button>
      </div>
    </section>
  );
}
