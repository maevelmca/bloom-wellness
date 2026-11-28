// Bloom more: goals + rewards, achievements, streaks, weekly summary, gifts, saved foods,
// meal plan, journal prompts, backup, theme, and live sync (hosted version only).
const X = () => {
  const x = db.x = db.x || {};
  for (const k of ["goals", "gifts", "cards", "foods", "ev"]) x[k] = x[k] || [];
  x.ach = x.ach || {}; x.burst = x.burst || {}; x.budget = x.budget || 0;
  return x;
};
const FF = [["cal", "Calories"], ["p", "Protein (g)"], ["c", "Carbs (g)"], ["f", "Fat (g)"], ["s", "Added sugar (g)"]];
const MET = { miles: "Advent miles", minutes: "Active minutes", workouts: "Workouts", water: "Glasses of water", meals: "Foods logged", thanks: "Gratitude entries", habits: "Habits checked", tasks: "Tasks done", days: "Days logged" };
const isLink = u => /^https?:\/\//i.test(u || "");
const active = s => !!s && !!((s.food && s.food.length) || (s.move && s.move.length) || s.water || (s.tasks && s.tasks.length) || s.mood || (s.thanks && s.thanks.length) || (s.habits && Object.values(s.habits).some(Boolean)));
const btn = (k, i, l, p) => `<button data-x="${k}" data-i="${i}"${p === undefined ? "" : ` aria-pressed="${p}"`}>${l}</button>`;
const del = (k, i, l) => `<button data-x="${k}" data-i="${i}" aria-label="Delete ${esc(l)}">×</button>`;
const row = (m, s, b) => `<li><span>${m}<small>${s}</small></span><span class="acts">${b}</span></li>`;
const inputs = l => l.map(([k, t]) => `<label>${t}<input name="${k}" type="number" min="0" step="any" inputmode="decimal"></label>`).join("");

function stats() {
  const S = { meals: 0, minutes: 0, workouts: 0, water: 0, thanks: 0, habits: 0, tasks: 0, days: 0 };
  const ds = Object.entries(db.days);
  for (const [, d] of ds) {
    S.meals += (d.food || []).length; S.minutes += sum(d.move || [], "min"); S.workouts += (d.move || []).length;
    S.water += d.water || 0; S.thanks += (d.thanks || []).length;
    S.habits += Object.values(d.habits || {}).filter(Boolean).length;
    S.tasks += (d.tasks || []).filter(t => t.done).length;
    if (active(d)) S.days++;
  }
  const a = A();
  S.miles = Object.keys(a.done.care).filter(k => a.done.care[k]).reduce((s, k) => s + MILES[k - 1], 0);
  S.gifts = X().gifts.filter(g => g.wrapped).length;
  let best = 0, run = 0, prev = null;
  for (const k of ds.filter(([, d]) => active(d)).map(([k]) => k).sort()) {
    run = prev && Math.round((at(k) - at(prev)) / 864e5) === 1 ? run + 1 : 1;
    best = Math.max(best, run); prev = k;
  }
  S.best = best;
  let cur = 0; const x = at(today);
  if (!active(db.days[today])) x.setDate(x.getDate() - 1);
  while (active(db.days[iso(x)])) { cur++; x.setDate(x.getDate() - 1); }
  S.streak = cur;
  return S;
}

const ACH = [
  ["🌱", "Seedling", "Log your first food", s => s.meals >= 1], ["🍽️", "Fuel Up", "Log 25 foods", s => s.meals >= 25],
  ["👟", "First Steps", "Log a workout", s => s.workouts >= 1], ["⏱️", "Minute Maker", "300 active minutes", s => s.minutes >= 300],
  ["💪", "Strong Habit", "Log 20 workouts", s => s.workouts >= 20], ["💧", "Hydrated", "50 glasses of water", s => s.water >= 50],
  ["🙏", "Grateful Heart", "10 gratitude entries", s => s.thanks >= 10], ["✅", "Doer", "Finish 25 tasks", s => s.tasks >= 25],
  ["🎄", "Advent Walker", "10 advent miles", s => s.miles >= 10], ["🏅", "Mile Master", "25 advent miles", s => s.miles >= 25],
  ["🔥", "On a Roll", "3-day streak", s => s.best >= 3], ["🌸", "Full Bloom", "7-day streak", s => s.best >= 7],
  ["📅", "Regular", "Log 14 different days", s => s.days >= 14], ["🎁", "Gift Giver", "Wrap 5 gifts", s => s.gifts >= 5]
];

function weekRows() {
  const r = []; for (let i = 0; i < 7; i++) { const x = at(today); x.setDate(x.getDate() - i); r.push(db.days[iso(x)] || {}); }
  const f = r.filter(d => d.food && d.food.length), mo = r.filter(d => d.mood), sl = r.filter(d => d.sleep), wa = r.filter(d => d.water);
  const av = (a, fn, u, dp) => a.length ? (a.reduce((s, d) => s + fn(d), 0) / a.length).toFixed(dp || 0) + u : "–";
  return [["Avg calories", av(f, d => tot(d).cal, " kcal")], ["Avg protein", av(f, d => tot(d).p, " g")], ["Avg added sugar", av(f, d => tot(d).s, " g")],
    ["Active minutes", Math.round(r.reduce((s, d) => s + sum(d.move || [], "min"), 0))], ["Avg water", av(wa, d => d.water, " glasses")],
    ["Avg mood", av(mo, d => d.mood, " of 5", 1)], ["Avg sleep", av(sl, d => d.sleep, " h", 1)],
    ["Tasks done", r.reduce((s, d) => s + (d.tasks || []).filter(t => t.done).length, 0)]];
}

function pgGoals() {
  const x = X(), S = stats();
  const goals = x.goals.map((g, i) => {
    const p = Math.min(g.t, Math.max(0, (S[g.m] || 0) - g.base)), ok = p >= g.t;
    return `<li class="goal"><div class="row"><strong>${esc(g.n)}</strong><span>${Math.round(p)} / ${g.t} ${MET[g.m].toLowerCase()}</span></div><div class="bar"><i style="width:${p / g.t * 100}%"></i></div>` +
      (ok ? `<p class="earned">🎉 Reward earned: ${esc(g.r)} ${isLink(g.l) ? `<a href="${esc(g.l)}" target="_blank" rel="noopener noreferrer">Get it</a>` : ""}</p>${btn("claim", i, g.got ? "Claimed ✓" : "Mark as claimed", !!g.got)}` : `<p class="hint">Reward: ${esc(g.r)}</p>`) +
      ` ${del("delgoal", i, g.n)}</li>`;
  }).join("");
  return `<section class="card"><h2>My goals and rewards</h2>${goals ? `<ul class="list">${goals}</ul>` : `<p class="hint">Make a goal, pick a reward, and Bloom tracks your progress from today.</p>`}` +
    `<form data-f="mygoal" class="grid"><label class="wide">Goal name<input name="n" required maxlength="80" placeholder="Move 300 minutes"></label>` +
    `<label>Track<select name="m">${Object.entries(MET).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></label>` +
    `<label>Target<input name="t" type="number" min="1" step="any" required></label>` +
    `<label class="wide">Reward<input name="r" required maxlength="80" placeholder="New candle, coffee date, new leggings"></label>` +
    `<label class="wide">Reward link (optional)<input name="l" type="url" placeholder="https://"></label><button class="wide primary">Add goal</button></form></section>` +
    `<section class="card"><h2>Achievements</h2><ul class="badges">${ACH.map(a => `<li class="badge ${X().ach[a[1]] ? "on" : "off"}"><span aria-hidden="true">${a[0]}</span><b>${a[1]}</b><small>${a[2]}</small></li>`).join("")}</ul></section>` +
    `<section class="card"><h2>This week</h2><ul class="list">${weekRows().map(([k, v]) => `<li><span>${k}</span><strong>${v}</strong></li>`).join("")}</ul></section>` +
    `<section class="card"><h2>Settings and backup</h2><div class="tabs" role="group" aria-label="Theme">${[["", "Auto"], ["light", "Light"], ["dark", "Dark"]].map(([v, l]) => `<button data-x="theme" data-v="${v}" aria-pressed="${(x.theme || "") === v}">${l}</button>`).join("")}</div>` +
    `<label>Your backup (copy this to move your data)<textarea id="bk" readonly rows="3">${esc(JSON.stringify(db))}</textarea></label><button data-x="copy">Copy backup</button>` +
    `<label style="margin-top:14px">Restore from a backup (replaces data on this device)<textarea id="imp" rows="3"></textarea></label><button data-x="import">Restore</button></section>`;
}

// Wrap existing pages with extra sections
const _td = pages.today;
pages.today = () => { const s = stats(); return (s.streak ? `<p class="streak"><b>${s.streak}</b>-day streak, best ${s.best}</p>` : "") + _td(); };

const _food = pages.food;
pages.food = () => {
  const x = X(), d = day(sel); d.plan = d.plan || [];
  return _food() +
    (d.plan.length ? `<section class="card"><h2>Planned for this day</h2><ul class="list">${d.plan.map((p, i) => row(esc(p.n), `${p.cal} kcal`, btn("logplan", i, "Log") + del("delplan", i, p.n))).join("")}</ul></section>` : "") +
    `<section class="card"><h2>Saved foods</h2>${x.foods.length ? `<ul class="list">${x.foods.map((p, i) => row(esc(p.n), `${p.cal} kcal, protein ${p.p} g, added sugar ${p.s} g`, btn("logfood", i, "Log") + del("delfood2", i, p.n))).join("")}</ul>` : `<p class="hint">Save foods you eat often, then log them with one tap.</p>`}` +
    `<form data-f="sfood" class="grid"><label class="wide">Name<input name="n" required maxlength="80"></label>${inputs(FF)}<button class="wide primary">Save food</button></form></section>`;
};

const _pl = pages.planner;
pages.planner = () => {
  const x = X(), d = day(sel); d.plan = d.plan || [];
  return _pl() + `<section class="card"><h2>Meal plan</h2>${d.plan.length ? `<ul class="list">${d.plan.map((p, i) => row(esc(p.n), "", del("delplan", i, p.n))).join("")}</ul>` : ""}` +
    (x.foods.length ? `<form data-f="plan" class="inline"><select name="i" aria-label="Saved food">${x.foods.map((p, i) => `<option value="${i}">${esc(p.n)}</option>`).join("")}</select><button class="primary">Plan it</button></form>` : `<p class="hint">Save foods on the Food page to plan meals.</p>`) + `</section>`;
};

const PR = ["What made you smile today?", "What are you proud of this week?", "What do you need more of right now?", "Who are you glad you know?", "What would make tomorrow feel easy?", "What small thing can you let go of?", "Describe a moment you want to remember.", "What did your body do for you today?", "What are you looking forward to?", "Which boundary are you glad you kept?"];
const PX = ["Which Christmas memory warms you most?", "What tradition do you want to start?", "Who would you love to surprise this season?", "What does a cozy night look like for you?"];
const _care = pages.care;
pages.care = () => {
  const d = day(sel), m = +sel.slice(5, 7), L = m === 12 ? PX : PR, n = +sel.slice(8) + m * 31;
  return _care() + `<section class="card"><h2>Journal prompt</h2><p class="reveal">${L[n % L.length]}</p><textarea data-x="journal" rows="4" aria-label="Journal entry">${esc(d.journal || "")}</textarea></section>`;
};

const _adv = pages.advent;
pages.advent = () => {
  const x = X(), spent = x.gifts.filter(g => g.bought).reduce((s, g) => s + g.cost, 0);
  return _adv() +
    `<section class="card"><h2>Gift tracker</h2>${x.budget ? bar("Spent of budget", spent, x.budget, "", 1) : ""}` +
    (x.gifts.length ? `<ul class="list">${x.gifts.map((g, i) => row(`${esc(g.who)}: ${esc(g.what)}`, g.cost ? String(g.cost) : "", btn("bought", i, "Bought", !!g.bought) + btn("wrapped", i, "Wrapped", !!g.wrapped) + del("delgift", i, g.who))).join("")}</ul>` : "") +
    `<form data-f="gift" class="grid"><label>For<input name="who" required maxlength="40"></label><label>Gift<input name="what" maxlength="80"></label><label>Cost<input name="cost" type="number" min="0" step="any"></label><button class="primary">Add gift</button></form>` +
    `<form data-f="budget" class="inline"><input name="b" type="number" min="0" step="any" value="${x.budget || ""}" placeholder="Budget" aria-label="Gift budget"><button>Set budget</button></form></section>` +
    `<section class="card"><h2>Christmas cards</h2>${x.cards.length ? `<ul class="list">${x.cards.map((c, i) => row(esc(c.n), "", btn("sent", i, "Sent", !!c.sent) + del("delcard", i, c.n))).join("")}</ul>` : ""}<form data-f="card" class="inline"><input name="n" required maxlength="60" aria-label="Name" placeholder="Add a name"><button class="primary">Add</button></form></section>` +
    `<section class="card"><h2>Countdowns</h2>${x.ev.length ? `<ul class="list">${x.ev.map((e, i) => { const n = Math.ceil((at(e.d) - at(today)) / 864e5); return row(esc(e.n), e.d, `<strong>${n > 0 ? n + " days" : n === 0 ? "Today" : "Past"}</strong>` + del("delev", i, e.n)); }).join("")}</ul>` : ""}` +
    `<form data-f="ev" class="inline"><input name="n" required maxlength="60" aria-label="Event" placeholder="Market day"><input name="d" type="date" required aria-label="Date"><button class="primary">Add</button></form></section>` +
    `<section class="card"><h2>Pick for me</h2><label>Options, separated by commas<input id="pickopts" value="Christmas sleepover, Christmas market, Christmas cookies"></label><p class="reveal" id="pickout" aria-live="polite"></p><button data-x="pick">Pick one</button></section>`;
};

pages.goals = pgGoals;
document.querySelector("nav").insertAdjacentHTML("beforeend", '<a href="#goals">Goals</a>');

// Theme, toast, petal burst
const applyTheme = () => { const t = X().theme; t ? document.documentElement.dataset.theme = t : delete document.documentElement.dataset.theme; };
const toast = m => { const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = m; document.body.append(t); setTimeout(() => t.remove(), 3500); };
const burst = () => {
  if (matchMedia("(prefers-reduced-motion:reduce)").matches) return;
  for (let i = 0; i < 16; i++) {
    const s = document.createElement("span"); s.className = "petal"; s.textContent = "🌸";
    s.style.left = Math.random() * 100 + "vw"; s.style.animationDelay = Math.random() * .6 + "s";
    document.body.append(s); setTimeout(() => s.remove(), 2800);
  }
};

const _render = render;
render = function () {
  _render(); applyTheme();
  const x = X(), S = stats(), nw = ACH.filter(a => a[3](S) && !x.ach[a[1]]);
  if (nw.length) { nw.forEach(a => x.ach[a[1]] = 1); save(); toast(`Achievement unlocked: ${nw[0][0]} ${nw[0][1]}`); burst(); }
  else {
    const b = [...document.querySelectorAll(".legend b")];
    if (b.length && b.every(e => e.textContent === "100%") && !x.burst[sel]) { x.burst[sel] = 1; save(); burst(); }
  }
};

app.addEventListener("click", e => {
  const b = e.target.closest("[data-x]");
  if (!b) return;
  const x = X(), k = b.dataset.x, i = +b.dataset.i, d = day(sel);
  switch (k) {
    case "claim": x.goals[i].got = !x.goals[i].got; break;
    case "delgoal": x.goals.splice(i, 1); break;
    case "theme": x.theme = b.dataset.v; break;
    case "logfood": d.food.push({ ...x.foods[i] }); break;
    case "delfood2": x.foods.splice(i, 1); break;
    case "logplan": d.food.push({ ...d.plan[i] }); d.plan.splice(i, 1); break;
    case "delplan": d.plan.splice(i, 1); break;
    case "bought": x.gifts[i].bought = !x.gifts[i].bought; break;
    case "wrapped": x.gifts[i].wrapped = !x.gifts[i].wrapped; break;
    case "delgift": x.gifts.splice(i, 1); break;
    case "sent": x.cards[i].sent = !x.cards[i].sent; break;
    case "delcard": x.cards.splice(i, 1); break;
    case "delev": x.ev.splice(i, 1); break;
    case "copy": { const t = document.getElementById("bk"); t.select(); try { navigator.clipboard.writeText(t.value); toast("Copied"); } catch (_) {} return; }
    case "import":
      try {
        const o = JSON.parse(document.getElementById("imp").value);
        if (!o || typeof o !== "object" || !o.days) throw 0;
        for (const q in db) delete db[q];
        Object.assign(db, o); db.goals = { ...DEF.goals, ...db.goals };
        toast("Backup restored");
      } catch (_) { toast("That doesn’t look like a Bloom backup"); return; }
      break;
    case "pick": {
      const o = document.getElementById("pickopts").value.split(",").map(s => s.trim()).filter(Boolean);
      if (o.length) document.getElementById("pickout").textContent = "🎲 " + o[Math.floor(Math.random() * o.length)];
      return;
    }
    default: return;
  }
  save(); render();
});

app.addEventListener("submit", e => {
  const f = Object.fromEntries(new FormData(e.target)), k = e.target.dataset.f, x = X(), d = day(sel), t = v => (v || "").trim();
  if (k === "mygoal" && t(f.n) && num(f.t) > 0) x.goals.push({ n: t(f.n), m: f.m, t: num(f.t), r: t(f.r), l: t(f.l), base: stats()[f.m] || 0, got: false });
  if (k === "sfood" && t(f.n)) x.foods.push({ n: t(f.n), cal: num(f.cal), p: num(f.p), c: num(f.c), f: num(f.f), s: num(f.s) });
  if (k === "plan" && x.foods[+f.i]) (d.plan = d.plan || []).push({ ...x.foods[+f.i] });
  if (k === "gift" && t(f.who)) x.gifts.push({ who: t(f.who), what: t(f.what), cost: num(f.cost), bought: false, wrapped: false });
  if (k === "budget") x.budget = num(f.b);
  if (k === "card" && t(f.n)) x.cards.push({ n: t(f.n), sent: false });
  if (k === "ev" && t(f.n) && f.d) x.ev.push({ n: t(f.n), d: f.d });
  save(); render();
});

app.addEventListener("change", e => { if (e.target.dataset.x === "journal") { day(sel).journal = e.target.value; save(); } });

// Live sync across devices (hosted version only; silently skipped elsewhere)
(async () => {
  try {
    if (!window.claude) return;
    const [cdb, usr] = await Promise.all([claude.use("db"), claude.use("user")]);
    if (!cdb || !usr) return;
    const ref = cdb.collection("data/users/" + await usr.id()).doc("bloom");
    let seen = JSON.stringify(db);
    const push = () => { db._t = Date.now(); seen = JSON.stringify(db); save(); return ref.set({ json: seen, t: db._t }).catch(() => {}); };
    ref.onSnapshot(s => {
      const r = s.exists ? s.data() : null;
      if (!r) return push();
      if (r.t > (db._t || 0)) {
        try {
          const o = JSON.parse(r.json);
          for (const q in db) delete db[q];
          Object.assign(db, o); db.goals = { ...DEF.goals, ...db.goals }; db.days = db.days || {};
          seen = JSON.stringify(db); save();
          if (!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) render();
        } catch (_) {}
      }
    }, () => {});
    setInterval(() => { if (JSON.stringify(db) !== seen) push(); }, 2000);
  } catch (_) {}
})();

render();
