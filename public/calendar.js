(function () {
  "use strict";

  const API = "/api/tasks";
  let tasks = [];
  let viewDate = new Date();
  let selectedKey = keyOf(new Date());

  const grid = document.getElementById("calendar-grid");
  const title = document.getElementById("cal-title");
  const dayList = document.getElementById("day-list");
  const dayTitle = document.getElementById("day-title");
  const dayEmpty = document.getElementById("day-empty");
  const statusEl = document.getElementById("status");

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DOW = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  function keyOf(d) { return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }

  // A little garden — each task gets a different flower + color (stable per id).
  const FLOWERS = [
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5c0 4 1 7 5 8 4-1 5-4 5-8-1.3 1.8-2.7 1.8-3.5.2-.8 1.6-2.2 1.6-3 0-.8 1.6-2.2 1.6-3-.2C9.7 6.8 8.3 6.8 7 5Z"/><rect x="11.4" y="12" width="1.2" height="9" rx="0.6"/><path d="M12 17c-2.5-.6-4.6 1-5.6 3 2.3.2 4.4-.8 5.6-3z"/></svg>',
    '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="11.4" y="9" width="1.2" height="12" rx="0.6"/><circle cx="16.2" cy="8" r="2.3"/><circle cx="14.1" cy="11.6" r="2.3"/><circle cx="9.9" cy="11.6" r="2.3"/><circle cx="7.8" cy="8" r="2.3"/><circle cx="9.9" cy="4.4" r="2.3"/><circle cx="14.1" cy="4.4" r="2.3"/><circle cx="12" cy="8" r="2.6"/></svg>',
    '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="11.4" y="10" width="1.2" height="11" rx="0.6"/><circle cx="12" cy="3.8" r="2.5"/><circle cx="8.4" cy="6.83" r="2.5"/><circle cx="9.77" cy="11.07" r="2.5"/><circle cx="14.23" cy="11.07" r="2.5"/><circle cx="15.6" cy="6.83" r="2.5"/><circle cx="12" cy="8" r="1.8"/></svg>',
    '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="11.4" y="11" width="1.2" height="11" rx="0.6"/><circle cx="18" cy="9" r="1.8"/><circle cx="16.24" cy="13.24" r="1.8"/><circle cx="12" cy="15" r="1.8"/><circle cx="7.76" cy="13.24" r="1.8"/><circle cx="6" cy="9" r="1.8"/><circle cx="7.76" cy="4.76" r="1.8"/><circle cx="12" cy="3" r="1.8"/><circle cx="16.24" cy="4.76" r="1.8"/><circle cx="12" cy="9" r="3.4"/></svg>',
  ];
  const FCOLORS = ["#e0742a", "#d69a2c", "#7ca44f", "#e8749e", "#c96a9c", "#67813a"];
  function hash(id) { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return h; }
  function flowerFor(id) { return FLOWERS[hash(id + "flower") % FLOWERS.length]; }
  function colorFor(id) { return FCOLORS[hash(id) % FCOLORS.length]; }

  async function load() {
    statusEl.textContent = "Loading…";
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error();
      tasks = await res.json();
      statusEl.textContent = "";
    } catch (_) {
      statusEl.textContent = "Couldn't reach the server.";
      statusEl.classList.add("error");
    }
    renderCal(); renderDay();
  }

  function taskDay(t) {
    // Prefer the scheduled `date`; fall back to createdAt for older tasks.
    return new Date(t.date || t.createdAt || Date.now());
  }
  function tasksForKey(key) {
    return tasks.filter((t) => keyOf(taskDay(t)) === key);
  }

  async function addTaskForSelectedDay(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const [y, m, d] = selectedKey.split("-").map(Number);
    const when = new Date(y, m, d, 12, 0, 0); // noon avoids timezone day-shift
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, date: when.toISOString() }),
      });
      if (!res.ok) throw new Error();
      const task = await res.json();
      tasks.push(task);
      statusEl.textContent = "";
      statusEl.classList.remove("error");
      renderCal();
      renderDay();
    } catch (_) {
      statusEl.textContent = "Couldn't add the task.";
      statusEl.classList.add("error");
    }
  }

  function renderCal() {
    title.textContent = `${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
    grid.innerHTML = "";
    DOW.forEach((d) => { const e = document.createElement("div"); e.className = "cal-dow"; e.textContent = d; grid.appendChild(e); });

    const y = viewDate.getFullYear(), m = viewDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const prevDays = new Date(y, m, 0).getDate();
    const todayKey = keyOf(new Date());

    for (let i = firstDay - 1; i >= 0; i--) grid.appendChild(cell(prevDays - i, true, null));
    for (let d = 1; d <= days; d++) { const k = `${y}-${m}-${d}`; grid.appendChild(cell(d, false, k, k === todayKey)); }
    const trailing = (7 - ((firstDay + days) % 7)) % 7;
    for (let i = 1; i <= trailing; i++) grid.appendChild(cell(i, true, null));
  }

  function cell(num, muted, key, isToday) {
    const c = document.createElement("div");
    c.className = "cal-cell" + (muted ? " muted" : "") + (isToday ? " today" : "") + (key === selectedKey ? " selected" : "");
    c.textContent = num;
    if (key) {
      const dt = tasksForKey(key);
      if (dt.length) {
        const dots = document.createElement("div"); dots.className = "cal-dots";
        dt.slice(0, 4).forEach(() => { const dot = document.createElement("span"); dot.className = "cal-dot"; dots.appendChild(dot); });
        c.appendChild(dots);
      }
      c.addEventListener("click", () => { selectedKey = key; renderCal(); renderDay(); });
    }
    return c;
  }

  function renderDay() {
    const [y, m, d] = selectedKey.split("-").map(Number);
    const dt = new Date(y, m, d);
    const todayKey = keyOf(new Date());
    dayTitle.textContent = selectedKey === todayKey ? "Today's tasks" : dt.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

    const items = tasksForKey(selectedKey);
    dayList.innerHTML = "";
    dayEmpty.classList.toggle("show", items.length === 0);
    items.forEach((task) => {
      const li = document.createElement("li");
      li.className = "day-item" + (task.completed ? " done" : "");
      const flower = document.createElement("span");
      flower.className = "di-flower";
      flower.innerHTML = flowerFor(task._id);
      flower.style.color = task.completed ? "#9aa792" : colorFor(task._id);
      const span = document.createElement("span"); span.textContent = task.text;
      li.append(flower, span);
      dayList.appendChild(li);
    });
  }

  document.getElementById("day-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const inp = document.getElementById("day-input");
    addTaskForSelectedDay(inp.value);
    inp.value = "";
    inp.focus();
  });

  document.getElementById("cal-prev").addEventListener("click", () => { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1); renderCal(); });
  document.getElementById("cal-next").addEventListener("click", () => { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1); renderCal(); });
  document.getElementById("cal-today").addEventListener("click", () => { viewDate = new Date(); selectedKey = keyOf(new Date()); renderCal(); renderDay(); });

  load();
})();
