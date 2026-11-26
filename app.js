// Bloom: a small wellness tracker. All data is saved in this browser (localStorage).
const KEY = "bloom-v1";
const DEF = { goals: { cal: 2000, pro: 100, carb: 250, fat: 65, sugar: 25, move: 30, water: 8 }, days: {} };
let db;
try { db = JSON.parse(localStorage.getItem(KEY)) || DEF; } catch (e) { db = DEF; }
db.goals = { ...DEF.goals, ...db.goals };
db.days = db.days || {};
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} };

const app = document.getElementById("app");
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const at = k => new Date(k + "T12:00");
const today = iso(new Date());
let sel = today;
const cal = new Date(); cal.setDate(1);

const day = k => db.days[k] || (db.days[k] = { food: [], move: [], water: 0, tasks: [] });
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = v => Math.max(0, parseFloat(v) || 0);
const sum = (a, k) => a.reduce((s, x) => s + (x[k] || 0), 0);
const tot = d => ({ cal: sum(d.food, "cal"), p: sum(d.food, "p"), c: sum(d.food, "c"), f: sum(d.food, "f"), s: sum(d.food, "s") });
const long = k => at(k).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

const bar = (l, v, g, u, lim) =>
  `<div class="row"><span>${l}</span><span>${Math.round(v)} / ${g}${u}</span></div>` +
  `<div class="bar${lim && v > g ? " over" : ""}"><i style="width:${Math.min(100, g ? v / g * 100 : 0)}%"></i></div>`;

const dateBar = () =>
  `<div class="datebar"><button data-a="shift" data-n="-1" aria-label="Previous day">‹</button><strong>${long(sel)}</strong>` +
  `<button data-a="shift" data-n="1" aria-label="Next day">›</button>${sel !== today ? '<button data-a="now">Back to today</button>' : ""}</div>`;

const taskList = d => d.tasks.length
  ? `<ul class="list">${d.tasks.map((x, i) =>
      `<li><label><input type="checkbox" data-a="task" data-i="${i}" ${x.done ? "checked" : ""}><span class="${x.done ? "done" : ""}">${esc(x.t)}</span></label>` +
      `<button data-a="deltask" data-i="${i}" aria-label="Delete task">×</button></li>`).join("")}</ul>`
  : `<p class="hint">No tasks for this day.</p>`;

function flower(ps) {
  const petals = ps.map(([n, v], i) =>
    `<ellipse cx="0" cy="-36" rx="15" ry="30" transform="rotate(${i * 72})" fill="var(--p${i})" fill-opacity="${(0.12 + 0.88 * v).toFixed(2)}"><title>${n}: ${Math.round(v * 100)}%</title></ellipse>`).join("");
  return `<svg class="flower" viewBox="-80 -80 160 160" role="img" aria-label="Daily progress flower, one petal per goal">${petals}<circle r="14" fill="var(--sun)"/></svg>`;
}

function pgToday() {
  const d = day(sel), t = tot(d), g = db.goals, mv = sum(d.move, "min"), done = d.tasks.filter(x => x.done).length;
  const ps = [["Fuel", t.cal / g.cal], ["Protein", t.p / g.pro], ["Movement", mv / g.move], ["Water", d.water / g.water], ["Plan", d.tasks.length ? done / d.tasks.length : 0]]
    .map(([n, v]) => [n, Math.min(1, v || 0)]);
  const empty = !d.food.length && !d.move.length && !d.water && !d.tasks.length;
  return dateBar() +
    `<section class="hero">${flower(ps)}<ul class="legend">${ps.map(([n, v], i) => `<li><i style="background:var(--p${i})"></i>${n}<b>${Math.round(v * 100)}%</b></li>`).join("")}</ul></section>` +
    (empty ? `<p class="hint">Log a meal, a workout, or a task to start filling in your flower.</p>` : "") +
    `<section class="card"><h2>Water</h2><div class="water"><button data-a="water" data-n="-1" aria-label="Remove a glass">−</button><strong>${d.water} of ${g.water} glasses</strong><button data-a="water" data-n="1" aria-label="Add a glass">+</button></div></section>` +
    `<section class="card"><h2>Tasks</h2>${taskList(d)}<a href="#planner">Open planner</a></section>`;
}

function pgPlanner() {
  const y = cal.getFullYear(), m = cal.getMonth(), off = new Date(y, m, 1).getDay(), n = new Date(y, m + 1, 0).getDate(), d = day(sel);
  let cells = "<span></span>".repeat(off);
  for (let i = 1; i <= n; i++) {
    const dt = new Date(y, m, i), k = iso(dt), s = db.days[k];
    cells += `<button class="cell${k === today ? " today" : ""}${s && s.tasks.length ? " has" : ""}" data-a="pick" data-k="${k}" aria-pressed="${k === sel}" aria-label="${dt.toLocaleDateString(undefined, { month: "long", day: "numeric" })}">${i}</button>`;
  }
  return `<section class="card"><div class="datebar"><button data-a="month" data-n="-1" aria-label="Previous month">‹</button><strong>${cal.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong><button data-a="month" data-n="1" aria-label="Next month">›</button></div>` +
    `<div class="cal">${"SMTWTFS".split("").map(c => `<b>${c}</b>`).join("")}${cells}</div></section>` +
    `<section class="card"><h2>${long(sel)}</h2>${taskList(d)}<form data-f="task" class="inline"><input name="t" required maxlength="120" placeholder="Add a task or plan" aria-label="New task"><button class="primary">Add task</button></form></section>`;
}

function pgFood() {
  const d = day(sel), t = tot(d), g = db.goals;
  const fields = [["cal", "Calories"], ["p", "Protein (g)"], ["c", "Carbs (g)"], ["f", "Fat (g)"], ["s", "Added sugar (g)"]];
  const goals = [["cal", "Calories"], ["pro", "Protein (g)"], ["carb", "Carbs (g)"], ["fat", "Fat (g)"], ["sugar", "Added sugar limit (g)"], ["move", "Exercise (min)"], ["water", "Water (glasses)"]];
  return dateBar() +
    `<section class="card"><h2>Macros</h2>${bar("Calories", t.cal, g.cal, " kcal")}${bar("Protein", t.p, g.pro, " g")}${bar("Carbs", t.c, g.carb, " g")}${bar("Fat", t.f, g.fat, " g")}${bar("Added sugar (limit)", t.s, g.sugar, " g", 1)}</section>` +
    `<section class="card"><h2>Log food</h2><form data-f="food" class="grid"><label class="wide">Food<input name="n" required maxlength="80"></label>` +
    fields.map(([k, l]) => `<label>${l}<input name="${k}" type="number" min="0" step="any" inputmode="decimal"></label>`).join("") +
    `<button class="wide primary">Add food</button></form></section>` +
    `<section class="card"><h2>Logged</h2>${d.food.length ? `<ul class="list">${d.food.map((x, i) =>
      `<li><span>${esc(x.n)}<small>${x.cal} kcal, protein ${x.p} g, carbs ${x.c} g, fat ${x.f} g, added sugar ${x.s} g</small></span><button data-a="delfood" data-i="${i}" aria-label="Delete ${esc(x.n)}">×</button></li>`).join("")}</ul>` : `<p class="hint">Nothing logged yet.</p>`}</section>` +
    `<details class="card"><summary>Daily goals</summary><form data-f="goals" class="grid">${goals.map(([k, l]) => `<label>${l}<input name="${k}" type="number" min="1" step="any" value="${g[k]}"></label>`).join("")}<button class="wide primary">Save goals</button></form></details>`;
}

function pgMove() {
  const d = day(sel), g = db.goals;
  const wk = [...Array(7)].map((_, i) => {
    const x = at(sel); x.setDate(x.getDate() - 6 + i);
    const s = db.days[iso(x)];
    return { m: s ? sum(s.move, "min") : 0, l: x.toLocaleDateString(undefined, { weekday: "narrow" }) };
  });
  const mx = Math.max(g.move, ...wk.map(w => w.m));
  return dateBar() +
    `<section class="card"><h2>Exercise</h2>${bar("Minutes", sum(d.move, "min"), g.move, " min")}</section>` +
    `<section class="card"><h2>Log a workout</h2><form data-f="move" class="grid"><label class="wide">Activity<input name="n" required maxlength="80" placeholder="Walk, yoga, lifting"></label>` +
    `<label>Minutes<input name="min" type="number" min="1" step="any" required></label><label>Calories burned (optional)<input name="cal" type="number" min="0" step="any"></label>` +
    `<button class="wide primary">Add workout</button></form></section>` +
    `<section class="card"><h2>Logged</h2>${d.move.length ? `<ul class="list">${d.move.map((x, i) =>
      `<li><span>${esc(x.n)}<small>${x.min} min${x.cal ? `, ${x.cal} kcal burned` : ""}</small></span><button data-a="delmove" data-i="${i}" aria-label="Delete ${esc(x.n)}">×</button></li>`).join("")}</ul>` : `<p class="hint">No workouts logged yet.</p>`}</section>` +
    `<section class="card"><h2>Last 7 days</h2><div class="week" role="img" aria-label="Exercise minutes over the last 7 days">${wk.map(w => `<div title="${w.m} min"><i style="height:${w.m / mx * 100}%"></i><span>${w.l}</span></div>`).join("")}</div></section>`;
}

const pages = { today: pgToday, planner: pgPlanner, food: pgFood, move: pgMove };

function render() {
  const p = location.hash.slice(1), id = pages[p] ? p : "today";
  app.innerHTML = pages[id]();
  document.querySelectorAll("nav a").forEach(a =>
    a.getAttribute("href") === "#" + id ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
}

app.addEventListener("click", e => {
  const b = e.target.closest("[data-a]");
  if (!b) return;
  const a = b.dataset.a, n = +b.dataset.n, i = +b.dataset.i, d = day(sel);
  if (a === "shift") { const x = at(sel); x.setDate(x.getDate() + n); sel = iso(x); }
  else if (a === "now") sel = today;
  else if (a === "water") d.water = Math.max(0, d.water + n);
  else if (a === "task") d.tasks[i].done = !d.tasks[i].done;
  else if (a === "deltask") d.tasks.splice(i, 1);
  else if (a === "delfood") d.food.splice(i, 1);
  else if (a === "delmove") d.move.splice(i, 1);
  else if (a === "pick") sel = b.dataset.k;
  else if (a === "month") cal.setMonth(cal.getMonth() + n);
  save(); render();
});

app.addEventListener("submit", e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target)), d = day(sel), k = e.target.dataset.f;
  if (k === "food") d.food.push({ n: f.n.trim(), cal: num(f.cal), p: num(f.p), c: num(f.c), f: num(f.f), s: num(f.s) });
  if (k === "move") d.move.push({ n: f.n.trim(), min: num(f.min), cal: num(f.cal) });
  if (k === "task" && f.t.trim()) d.tasks.push({ t: f.t.trim(), done: false });
  if (k === "goals") for (const x in db.goals) db.goals[x] = num(f[x]) || db.goals[x];
  save(); render();
});

window.addEventListener("hashchange", render);
render();
