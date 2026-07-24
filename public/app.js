(function () {
  "use strict";

  const API = "/api/tasks";
  const COIN_VALUES = [10, 20, 30, 40, 50];

  let tasks = [];
  let statusFilter = "all";
  let searchText = "";
  let filterCategory = "";
  let filterPriority = "";
  let sortBy = "created";

  // --- Elements ---
  const form = document.getElementById("task-form");
  const input = document.getElementById("task-input");
  const addPriority = document.getElementById("add-priority");
  const addDue = document.getElementById("add-due");
  const addCategory = document.getElementById("add-category");
  const addNotes = document.getElementById("add-notes");
  const list = document.getElementById("task-list");
  const empty = document.getElementById("empty");
  const statusEl = document.getElementById("status");
  const tabs = document.getElementById("tabs");
  const searchEl = document.getElementById("search");
  const filterCatEl = document.getElementById("filter-category");
  const filterPriEl = document.getElementById("filter-priority");
  const sortEl = document.getElementById("sort-by");

  const shCount = document.getElementById("sh-count");
  const shCoins = document.getElementById("sh-coins");
  const shDate = document.getElementById("sh-date");
  const shStreak = document.getElementById("sh-streak");
  const shFill = document.getElementById("sh-fill");
  const shPct = document.getElementById("sh-pct");
  const shDoneLabel = document.getElementById("sh-done-label");

  if (shDate) shDate.textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

  // --- Icons ---
  const I = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    del: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v12H8l-4 4z"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 12 22l-9-9V3h10z"/><circle cx="7.5" cy="7.5" r="1.2" fill="currentColor"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
  };

  // --- Streak (localStorage) ---
  function dayStr(d) { return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
  function readStreak() { try { return JSON.parse(localStorage.getItem("taskify.streak")) || { date: null, count: 0 }; } catch (_) { return { date: null, count: 0 }; } }
  function bumpStreak() {
    const s = readStreak(); const today = dayStr(new Date());
    if (s.date === today) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    s.count = s.date === dayStr(y) ? (s.count || 0) + 1 : 1;
    s.date = today; localStorage.setItem("taskify.streak", JSON.stringify(s));
  }
  function currentStreak() {
    const s = readStreak(); const today = dayStr(new Date());
    const y = new Date(); y.setDate(y.getDate() - 1);
    return (s.date === today || s.date === dayStr(y)) ? (s.count || 0) : 0;
  }

  // --- Helpers ---
  function hash(id) { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return h; }
  function coinsFor(id) { return COIN_VALUES[hash(id) % COIN_VALUES.length]; }
  const PRIORITY = { high: { label: "High", rank: 3 }, medium: { label: "Medium", rank: 2 }, low: { label: "Low", rank: 1 } };

  // Preset categories with fixed colors; custom ones get a stable color from the palette.
  const CAT_COLORS = { Work: "#4b6ea0", Study: "#7256a3", Personal: "#4b8a5a", Health: "#b5566e", Shopping: "#a5842c", Fitness: "#0d9488", Finance: "#b1544e", Home: "#c67b2a" };
  const PRESET_CATS = Object.keys(CAT_COLORS);
  const CAT_PALETTE = ["#4b6ea0", "#7256a3", "#4b8a5a", "#b5566e", "#a5842c", "#0d9488", "#b1544e", "#8a7550"];
  function catColor(name) { return CAT_COLORS[name] || CAT_PALETTE[hash(name) % CAT_PALETTE.length]; }
  function hexToRgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
  function refreshCatDatalist() {
    const dl = document.getElementById("cat-list"); if (!dl) return;
    const existing = tasks.map((t) => (t.category || "").trim()).filter(Boolean);
    const all = [...new Set([...PRESET_CATS, ...existing])];
    dl.innerHTML = all.map((c) => `<option value="${escapeHtml(c)}"></option>`).join("");
  }

  function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function fmtDue(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    const today = startOfToday();
    const diff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - today) / 86400000);
    let label;
    if (diff === 0) label = "Today";
    else if (diff === 1) label = "Tomorrow";
    else if (diff === -1) label = "Yesterday";
    else label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return { label, overdue: diff < 0 };
  }
  function toDateInput(iso) { const d = new Date(iso); return isNaN(d) ? "" : d.toISOString().slice(0, 10); }
  function dueFromInput(v) { if (!v) return null; const [y, m, d] = v.split("-").map(Number); return new Date(y, m - 1, d, 12, 0, 0).toISOString(); }

  // --- API ---
  async function request(url, options) {
    const res = await fetch(url, options);
    if (!res.ok) {
      let msg = "Something went wrong";
      try { const b = await res.json(); if (b && b.error) msg = b.error; } catch (_) {}
      throw new Error(msg);
    }
    const t = await res.text();
    return t ? JSON.parse(t) : null;
  }
  function setStatus(msg, isError) { statusEl.textContent = msg || ""; statusEl.classList.toggle("error", !!isError); }

  async function loadTasks() {
    setStatus("Loading your tasks…");
    try { tasks = await request(API); setStatus(""); render(); }
    catch (_) { setStatus("Couldn't reach the server.", true); }
  }
  async function addTask(payload) {
    try { const task = await request(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); tasks.unshift(task); setStatus(""); render(); }
    catch (err) { setStatus(err.message, true); }
  }
  async function patchTask(id, patch, afterBump) {
    const task = tasks.find((t) => t._id === id); if (!task) return;
    try {
      const u = await request(`${API}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      Object.assign(task, u);
      if (afterBump) afterBump();
      render();
    } catch (err) { setStatus(err.message, true); }
  }
  async function deleteTask(id) {
    try { await request(`${API}/${id}`, { method: "DELETE" }); tasks = tasks.filter((t) => t._id !== id); render(); }
    catch (err) { setStatus(err.message, true); }
  }

  // --- Filtering / sorting ---
  function getVisible() {
    let out = tasks.slice();
    if (statusFilter === "active") out = out.filter((t) => !t.completed);
    else if (statusFilter === "completed") out = out.filter((t) => t.completed);
    if (filterCategory) out = out.filter((t) => (t.category || "") === filterCategory);
    if (filterPriority) out = out.filter((t) => (t.priority || "medium") === filterPriority);
    if (searchText) {
      const q = searchText.toLowerCase();
      out = out.filter((t) => (t.text || "").toLowerCase().includes(q) || (t.notes || "").toLowerCase().includes(q) || (t.category || "").toLowerCase().includes(q));
    }
    if (sortBy === "due") out.sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));
    else if (sortBy === "priority") out.sort((a, b) => PRIORITY[b.priority || "medium"].rank - PRIORITY[a.priority || "medium"].rank);
    else out.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return out;
  }

  function refreshCategoryFilter() {
    const cats = [...new Set(tasks.map((t) => (t.category || "").trim()).filter(Boolean))].sort();
    const cur = filterCatEl.value;
    filterCatEl.innerHTML = '<option value="">All categories</option>' + cats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    filterCatEl.value = cats.includes(cur) ? cur : "";
    filterCategory = filterCatEl.value;
  }
  function escapeHtml(s) { return s.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])); }

  // --- Render ---
  function render() {
    const total = tasks.length;
    const done = tasks.filter((t) => t.completed).length;
    const collected = tasks.filter((t) => t.completed).reduce((s, t) => s + coinsFor(t._id), 0);
    if (shCount) shCount.textContent = `${done} / ${total}`;
    if (shCoins) shCoins.textContent = collected.toLocaleString();
    if (shStreak) shStreak.textContent = currentStreak();
    const pct = total ? Math.round((done / total) * 100) : 0;
    if (shFill) shFill.style.width = pct + "%";
    if (shPct) shPct.textContent = pct + "%";
    if (shDoneLabel) shDoneLabel.textContent = `${done} of ${total} done`;

    refreshCategoryFilter();
    refreshCatDatalist();

    const visible = getVisible();
    list.innerHTML = "";
    visible.forEach((task) => list.appendChild(card(task)));
    empty.classList.toggle("show", visible.length === 0);
  }

  function tag(cls, html) { const s = document.createElement("span"); s.className = "tag " + cls; s.innerHTML = html; return s; }

  function card(task) {
    const li = document.createElement("li");
    li.className = "tcard pr-" + (task.priority || "medium") + (task.completed ? " done" : "");
    li.dataset.id = task._id;

    const main = document.createElement("div");
    main.className = "tcard-main";

    const check = document.createElement("button");
    check.className = "tcheck"; check.innerHTML = I.check; check.title = task.completed ? "Mark as not done" : "Mark done";
    check.addEventListener("click", () => patchTask(task._id, { completed: !task.completed }, () => { if (!task.completed) bumpStreak(); }));

    const body = document.createElement("div");
    body.className = "tbody";
    const ttext = document.createElement("div");
    ttext.className = "ttext"; ttext.textContent = task.text; ttext.title = "Double-click to edit";
    ttext.addEventListener("dblclick", () => openEdit(li, task));
    body.appendChild(ttext);

    // meta tags
    const meta = document.createElement("div");
    meta.className = "tmeta";
    const p = PRIORITY[task.priority || "medium"];
    const pri = tag("tag-pri " + (task.priority || "medium"), `<span class="dot"></span>${p.label}`);
    pri.title = "Click to change priority";
    pri.style.cursor = "pointer";
    pri.addEventListener("click", () => {
      const order = ["low", "medium", "high"];
      const next = order[(order.indexOf(task.priority || "medium") + 1) % 3];
      patchTask(task._id, { priority: next });
    });
    meta.appendChild(pri);

    if (task.category) {
      const c = catColor(task.category);
      const ct = tag("tag-cat", `${I.tag}${escapeHtml(task.category)}`);
      ct.style.color = c;
      ct.style.background = hexToRgba(c, 0.15);
      meta.appendChild(ct);
    }

    const due = fmtDue(task.date);
    if (due) meta.appendChild(tag("tag-due" + (due.overdue && !task.completed ? " overdue" : ""), `${I.cal}${due.label}`));

    const subCount = (task.subtasks || []).length;
    if (subCount) {
      const doneSub = task.subtasks.filter((s) => s.done).length;
      meta.appendChild(tag("tag-sub", `${I.list}${doneSub}/${subCount}`));
    }
    body.appendChild(meta);

    if (task.notes) {
      const n = document.createElement("div");
      n.className = "tnotes"; n.textContent = task.notes;
      body.appendChild(n);
    }

    const actions = document.createElement("div");
    actions.className = "tactions";
    const expandBtn = iconBtn(I.chevron, "Subtasks");
    expandBtn.classList.add("expand-btn");
    const editBtn = iconBtn(I.edit, "Edit");
    const delBtn = iconBtn(I.del, "Delete"); delBtn.classList.add("del");
    editBtn.addEventListener("click", () => openEdit(li, task));
    delBtn.addEventListener("click", () => deleteTask(task._id));
    actions.append(expandBtn, editBtn, delBtn);

    main.append(check, body, actions);
    li.appendChild(main);

    // subtasks panel (collapsed)
    const panel = document.createElement("div");
    panel.className = "tsub"; panel.hidden = true;
    renderSubtasks(panel, task);
    li.appendChild(panel);
    expandBtn.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      expandBtn.classList.toggle("open", !panel.hidden);
    });

    return li;
  }

  function iconBtn(svg, title) { const b = document.createElement("button"); b.className = "tibtn"; b.innerHTML = svg; b.title = title; return b; }

  function renderSubtasks(panel, task) {
    panel.innerHTML = "";
    const ul = document.createElement("ul");
    ul.className = "subtask-list";
    (task.subtasks || []).forEach((st, idx) => {
      const li = document.createElement("li");
      li.className = "subtask" + (st.done ? " done" : "");
      const box = document.createElement("button");
      box.className = "sub-box"; box.innerHTML = I.check;
      box.addEventListener("click", () => {
        const subs = task.subtasks.map((s, i) => (i === idx ? { text: s.text, done: !s.done } : { text: s.text, done: s.done }));
        patchTask(task._id, { subtasks: subs });
      });
      const span = document.createElement("span"); span.className = "sub-text"; span.textContent = st.text;
      const rm = document.createElement("button"); rm.className = "sub-del"; rm.innerHTML = I.del; rm.title = "Remove";
      rm.addEventListener("click", () => {
        const subs = task.subtasks.filter((_, i) => i !== idx).map((s) => ({ text: s.text, done: s.done }));
        patchTask(task._id, { subtasks: subs });
      });
      li.append(box, span, rm);
      ul.appendChild(li);
    });
    panel.appendChild(ul);

    const addForm = document.createElement("form");
    addForm.className = "subtask-add";
    addForm.innerHTML = `<span>${I.plus}</span><input type="text" placeholder="Add a step…" maxlength="200"><button type="submit">Add</button>`;
    addForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const inp = addForm.querySelector("input");
      const v = inp.value.trim(); if (!v) return;
      const subs = (task.subtasks || []).map((s) => ({ text: s.text, done: s.done }));
      subs.push({ text: v, done: false });
      patchTask(task._id, { subtasks: subs });
    });
    panel.appendChild(addForm);
  }

  // --- Edit panel ---
  function openEdit(li, task) {
    li.classList.add("editing");
    const wrap = document.createElement("div");
    wrap.className = "tedit-panel";
    wrap.innerHTML =
      `<input class="e-title" type="text" maxlength="200" value="${escapeHtml(task.text)}">
       <div class="e-row">
         <select class="e-priority">
           <option value="low">🟢 Low</option>
           <option value="medium">🟡 Medium</option>
           <option value="high">🔴 High</option>
         </select>
         <input class="e-due" type="date" value="${toDateInput(task.date)}">
         <input class="e-cat" type="text" list="cat-list" placeholder="Category…" maxlength="40" value="${escapeHtml(task.category || "")}">
       </div>
       <textarea class="e-notes" placeholder="Notes…" maxlength="1000">${escapeHtml(task.notes || "")}</textarea>
       <div class="e-actions"><button class="e-save" type="button">Save</button><button class="e-cancel" type="button">Cancel</button></div>`;
    li.innerHTML = "";
    li.appendChild(wrap);
    wrap.querySelector(".e-priority").value = task.priority || "medium";
    const titleInput = wrap.querySelector(".e-title");
    titleInput.focus();

    wrap.querySelector(".e-cancel").addEventListener("click", () => render());
    wrap.querySelector(".e-save").addEventListener("click", () => {
      const text = titleInput.value.trim();
      if (!text) return deleteTask(task._id);
      patchTask(task._id, {
        text,
        priority: wrap.querySelector(".e-priority").value,
        date: dueFromInput(wrap.querySelector(".e-due").value) || task.date,
        category: wrap.querySelector(".e-cat").value.trim(),
        notes: wrap.querySelector(".e-notes").value.trim(),
      });
    });
  }

  // --- Wiring ---
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    const payload = {
      text,
      priority: addPriority.value,
      category: addCategory.value.trim(),
      notes: addNotes.value.trim(),
    };
    const due = dueFromInput(addDue.value);
    if (due) payload.date = due;
    addTask(payload);
    input.value = ""; addCategory.value = ""; addNotes.value = ""; addDue.value = ""; addPriority.value = "medium";
    input.focus();
  });

  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest("button"); if (!btn) return;
    statusFilter = btn.dataset.filter;
    tabs.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
    render();
  });
  searchEl.addEventListener("input", () => { searchText = searchEl.value.trim(); render(); });
  filterCatEl.addEventListener("change", () => { filterCategory = filterCatEl.value; render(); });
  filterPriEl.addEventListener("change", () => { filterPriority = filterPriEl.value; render(); });
  sortEl.addEventListener("change", () => { sortBy = sortEl.value; render(); });

  loadTasks();
})();
