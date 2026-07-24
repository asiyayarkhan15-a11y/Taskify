(function () {
  "use strict";

  const API = "/api/tasks";

  // Warm card gradients (orange, gold, tan, olive) — stable per task id.
  const THEMES = [
    { g1: "#eaa24d", g2: "#d97b2a", coin: "#c9781f" }, // orange
    { g1: "#e6c256", g2: "#d69a2c", coin: "#c08a1c" }, // gold
    { g1: "#cdbf9f", g2: "#b3a37f", coin: "#8a7550" }, // tan
    { g1: "#b9c67f", g2: "#8fa653", coin: "#67813a" }, // olive
  ];
  const COIN_VALUES = [10, 20, 30, 40, 50];

  let tasks = [];
  let filter = "all";

  const form = document.getElementById("task-form");
  const input = document.getElementById("task-input");
  const list = document.getElementById("task-list");
  const empty = document.getElementById("empty");
  const statusEl = document.getElementById("status");
  const tabs = document.getElementById("tabs");

  const shCount = document.getElementById("sh-count");
  const shCoins = document.getElementById("sh-coins");
  const shDate = document.getElementById("sh-date");
  const shStreak = document.getElementById("sh-streak");
  const shFill = document.getElementById("sh-fill");
  const shPct = document.getElementById("sh-pct");
  const shDoneLabel = document.getElementById("sh-done-label");

  // --- Streak (stored locally) ---
  function dayStr(d) { return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
  function readStreak() {
    try { return JSON.parse(localStorage.getItem("taskify.streak")) || { date: null, count: 0 }; }
    catch (_) { return { date: null, count: 0 }; }
  }
  function bumpStreak() {
    const s = readStreak();
    const today = dayStr(new Date());
    if (s.date === today) return; // already counted today
    const yst = new Date(); yst.setDate(yst.getDate() - 1);
    s.count = s.date === dayStr(yst) ? (s.count || 0) + 1 : 1;
    s.date = today;
    localStorage.setItem("taskify.streak", JSON.stringify(s));
  }
  function currentStreak() {
    const s = readStreak();
    const today = dayStr(new Date());
    const yst = new Date(); yst.setDate(yst.getDate() - 1);
    return (s.date === today || s.date === dayStr(yst)) ? (s.count || 0) : 0;
  }

  if (shDate) shDate.textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

  // A little garden — each card gets a different flower (stable per task).
  const FLOWERS = [
    // tulip
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5c0 4 1 7 5 8 4-1 5-4 5-8-1.3 1.8-2.7 1.8-3.5.2-.8 1.6-2.2 1.6-3 0-.8 1.6-2.2 1.6-3-.2C9.7 6.8 8.3 6.8 7 5Z"/><rect x="11.4" y="12" width="1.2" height="9" rx="0.6"/><path d="M12 17c-2.5-.6-4.6 1-5.6 3 2.3.2 4.4-.8 5.6-3z"/></svg>',
    // daisy
    '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="11.4" y="9" width="1.2" height="12" rx="0.6"/><circle cx="16.2" cy="8" r="2.3"/><circle cx="14.1" cy="11.6" r="2.3"/><circle cx="9.9" cy="11.6" r="2.3"/><circle cx="7.8" cy="8" r="2.3"/><circle cx="9.9" cy="4.4" r="2.3"/><circle cx="14.1" cy="4.4" r="2.3"/><circle cx="12" cy="8" r="2.6"/></svg>',
    // cherry blossom
    '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="11.4" y="10" width="1.2" height="11" rx="0.6"/><circle cx="12" cy="3.8" r="2.5"/><circle cx="8.4" cy="6.83" r="2.5"/><circle cx="9.77" cy="11.07" r="2.5"/><circle cx="14.23" cy="11.07" r="2.5"/><circle cx="15.6" cy="6.83" r="2.5"/><circle cx="12" cy="8" r="1.8"/></svg>',
    // sunflower
    '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="11.4" y="11" width="1.2" height="11" rx="0.6"/><circle cx="18" cy="9" r="1.8"/><circle cx="16.24" cy="13.24" r="1.8"/><circle cx="12" cy="15" r="1.8"/><circle cx="7.76" cy="13.24" r="1.8"/><circle cx="6" cy="9" r="1.8"/><circle cx="7.76" cy="4.76" r="1.8"/><circle cx="12" cy="3" r="1.8"/><circle cx="16.24" cy="4.76" r="1.8"/><circle cx="12" cy="9" r="3.4"/></svg>',
  ];
  function flowerFor(id) { return FLOWERS[hash(id + "flower") % FLOWERS.length]; }
  const ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  const ICON_EDIT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
  const ICON_DEL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>';

  function hash(id) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return h;
  }
  function themeFor(id) { return THEMES[hash(id) % THEMES.length]; }
  function coinsFor(id) { return COIN_VALUES[hash(id) % COIN_VALUES.length]; }

  // --- API ---
  async function request(url, options) {
    const res = await fetch(url, options);
    if (!res.ok) {
      let msg = "Something went wrong";
      try { const b = await res.json(); if (b && b.error) msg = b.error; } catch (_) {}
      throw new Error(msg);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }
  function setStatus(msg, isError) {
    statusEl.textContent = msg || "";
    statusEl.classList.toggle("error", Boolean(isError));
  }

  async function loadTasks() {
    setStatus("Loading your tasks…");
    try { tasks = await request(API); setStatus(""); render(); }
    catch (_) { setStatus("Couldn't reach the server. Is it running?", true); }
  }
  async function addTask(text) {
    const t = text.trim(); if (!t) return;
    try {
      const task = await request(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: t }) });
      tasks.unshift(task); setStatus(""); render();
    } catch (err) { setStatus(err.message, true); }
  }
  async function deleteTask(id) {
    try { await request(`${API}/${id}`, { method: "DELETE" }); tasks = tasks.filter((x) => x._id !== id); render(); }
    catch (err) { setStatus(err.message, true); }
  }
  async function toggleTask(id) {
    const task = tasks.find((x) => x._id === id); if (!task) return;
    try {
      const u = await request(`${API}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed: !task.completed }) });
      Object.assign(task, u);
      if (task.completed) bumpStreak(); // completing a task counts toward today's streak
      render();
    } catch (err) { setStatus(err.message, true); }
  }
  async function editTask(id, newText) {
    const t = newText.trim(); const task = tasks.find((x) => x._id === id); if (!task) return;
    if (!t) return deleteTask(id);
    if (t === task.text) return render();
    try {
      const u = await request(`${API}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: t }) });
      Object.assign(task, u); render();
    } catch (err) { setStatus(err.message, true); }
  }

  // --- Render ---
  function visible() {
    if (filter === "active") return tasks.filter((t) => !t.completed);
    if (filter === "completed") return tasks.filter((t) => t.completed);
    return tasks;
  }
  function fmtDate(iso) { return iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""; }

  function render() {
    const total = tasks.length;
    const done = tasks.filter((t) => t.completed).length;
    const collected = tasks.filter((t) => t.completed).reduce((sum, t) => sum + coinsFor(t._id), 0);

    if (shCount) shCount.textContent = `${done} / ${total}`;
    if (shCoins) shCoins.textContent = collected.toLocaleString();
    if (shStreak) shStreak.textContent = currentStreak();

    const pct = total ? Math.round((done / total) * 100) : 0;
    if (shFill) shFill.style.width = pct + "%";
    if (shPct) shPct.textContent = pct + "%";
    if (shDoneLabel) shDoneLabel.textContent = `${done} of ${total} done`;

    const l = visible();
    list.innerHTML = "";
    l.forEach((task) => list.appendChild(card(task)));
    empty.classList.toggle("show", l.length === 0);
  }

  function card(task) {
    const th = themeFor(task._id);
    const li = document.createElement("li");
    li.className = "tcard" + (task.completed ? " done" : "");
    li.style.setProperty("--g1", th.g1);
    li.style.setProperty("--g2", th.g2);
    li.style.setProperty("--coin", th.coin);

    const check = document.createElement("button");
    check.className = "tcheck";
    check.innerHTML = ICON_CHECK;
    check.title = task.completed ? "Mark as not done" : "Mark done";
    check.addEventListener("click", () => toggleTask(task._id));

    const body = document.createElement("div");
    body.className = "tbody";
    const text = document.createElement("div");
    text.className = "ttext";
    text.textContent = task.text;
    text.title = "Double-click to edit";
    text.addEventListener("dblclick", () => startEdit(li, body, task));
    const date = document.createElement("div");
    date.className = "tdate";
    date.textContent = fmtDate(task.date || task.createdAt);
    body.append(text, date);

    const coins = document.createElement("div");
    coins.className = "tcoins";
    coins.innerHTML = `<b>${coinsFor(task._id)}</b><span>Coins</span>`;

    const actions = document.createElement("div");
    actions.className = "tactions";
    const editBtn = document.createElement("button");
    editBtn.className = "tibtn"; editBtn.innerHTML = ICON_EDIT; editBtn.title = "Edit";
    editBtn.addEventListener("click", () => startEdit(li, body, task));
    const delBtn = document.createElement("button");
    delBtn.className = "tibtn"; delBtn.innerHTML = ICON_DEL; delBtn.title = "Delete";
    delBtn.addEventListener("click", () => deleteTask(task._id));
    actions.append(editBtn, delBtn);

    const flower = document.createElement("span");
    flower.className = "tflower";
    flower.innerHTML = flowerFor(task._id);

    li.append(flower, check, body, coins, actions);
    return li;
  }

  function startEdit(li, body, task) {
    const box = document.createElement("input");
    box.className = "tedit"; box.value = task.text; box.maxLength = 200;
    const text = body.querySelector(".ttext");
    const date = body.querySelector(".tdate");
    text.replaceWith(box);
    if (date) date.style.display = "none";
    box.focus(); box.setSelectionRange(box.value.length, box.value.length);

    let finished = false;
    const commit = () => { if (finished) return; finished = true; editTask(task._id, box.value); };
    const cancel = () => { if (finished) return; finished = true; render(); };
    box.addEventListener("blur", commit);
    box.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); commit(); }
      else if (e.key === "Escape") { e.preventDefault(); cancel(); }
    });
  }

  // --- Wiring ---
  form.addEventListener("submit", (e) => { e.preventDefault(); addTask(input.value); input.value = ""; input.focus(); });
  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest("button"); if (!btn) return;
    filter = btn.dataset.filter;
    tabs.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
    render();
  });

  loadTasks();
})();
