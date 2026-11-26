// Bloom extras: two advent calendars, a wishlist, and a wellness page.
// Runs after app.js and reuses its helpers (db, save, day, esc, num, iso, at, sel, pages, render).
const XMAS = [
  ["🎬", "Christmas movie night"], ["❄️", "Paper snowflake crafts"], ["🎁", "Christmas wishlist"],
  ["🐾", "Pet paw-print clay ornament"], ["🎀", "Wrap gifts"], ["☕", "Festive hot chocolate"],
  ["🎨", "Paint the windows"], ["🌿", "Make a Christmas garland"], ["📚", "Blind Date With a Book"],
  ["🔍", "Christmas mystery film"], ["🥤", "Get a Christmas Starbucks drink"],
  ["🎲", "Choose: Christmas sleepover, Christmas market or Christmas cookies — and pick up the gingerbread-house kit for Day 15"],
  ["🛁", "Christmas everything shower"], ["🎶", "Christmas carols"], ["🏠", "Gingerbread house decorating"],
  ["🍪", "Christmas baked good"], ["📖", "Blind Date With a Book — round 2"], ["🎰", "Christmas movie roulette"],
  ["🍫", "Hot chocolate bar"], ["🎲", "Choose: Christmas sleepover, Christmas market or Christmas cookies"],
  ["🍿", "Christmas movie night"], ["🌟", "Make paper Christmas stars"], ["🎁", "Christmas gift wrapping night"],
  ["🌙", "Read The Night Before Christmas and watch a Christmas movie"]
];
const MILES = [2, 3, 1, 4, 2, 3, 1, 2, 4, 3, 2, 1, 3, 4, 2, 1, 3, 2, 4, 1, 3, 2, 4, 2];
const MOODS = ["😞", "😕", "😐", "🙂", "😄"];
const HABITS = ["Stretch for 5 minutes", "Skincare routine", "10 minutes outside", "Screens off before bed", "Message a friend", "Tidy one small space"];

const A = () => {
  db.advent = db.advent || {};
  const a = db.advent;
  a.open = a.open || { xmas: {}, care: {} };
  a.done = a.done || { xmas: {}, care: {} };
  a.wish = a.wish || [];
  return a;
};
const NOW = new Date(), YR = NOW.getFullYear();
const unlocked = d => A().peek || NOW >= new Date(YR, 11, d);
const order = t => Array.from({ length: 24 }, (_, i) => (i * (t === "xmas" ? 7 : 5)) % 24 + 1);
const backHtml = (t, d) => t === "xmas" ? XMAS[d - 1][0] : `${MILES[d - 1]}<small>mi</small>`;
let advTab = "xmas", advSel = null, advMsg = "", brT;

const door = (t, d) => {
  const op = A().open[t][d], lk = !unlocked(d);
  return `<button class="door${op ? " opened" : ""}${lk ? " locked" : ""}${advSel === d ? " sel" : ""}" data-door="${d}" aria-label="Door ${d}${op ? ", opened" : lk ? ", locked" : ""}">` +
    `<span class="back">${op ? backHtml(t, d) : ""}</span><span class="front">${d}</span></button>`;
};

function panelHtml() {
  const a = A(), t = advTab, d = advSel;
  if (advMsg) { const m = advMsg; advMsg = ""; return `<p class="hint">${m}</p>`; }
  if (!d || !a.open[t][d]) return `<p class="hint">Tap a door to open it.</p>`;
  const st = a.done[t][d];
  if (t === "xmas") return `<h2>Day ${d}</h2><p class="reveal">${XMAS[d - 1][0]} ${XMAS[d - 1][1]}</p><button data-adv="done" data-d="${d}" aria-pressed="${!!st}">${st ? "Done ✓" : "Mark done"}</button>`;
  const m = MILES[d - 1];
  return `<h2>Day ${d}</h2><p class="reveal">Walk or run ${m} mile${m > 1 ? "s" : ""}</p><div class="inline"><button data-adv="walk" data-d="${d}" aria-pressed="${st === "walk"}">Walked it</button><button data-adv="run" data-d="${d}" aria-pressed="${st === "run"}">Ran it</button></div>`;
}

function pgAdvent() {
  const a = A(), t = advTab;
  const dn = Object.values(a.done[t]).filter(Boolean).length;
  const mi = Object.keys(a.done.care).filter(k => a.done.care[k]).reduce((s, k) => s + MILES[k - 1], 0);
  const left = Math.ceil((new Date(YR, 11, 25) - NOW) / 864e5);
  const stat = t === "xmas" ? `${dn} of 24 activities done` : `${mi} of ${MILES.reduce((s, m) => s + m, 0)} miles logged`;
  return `<section class="card"><h2>${left > 0 ? `${left} day${left > 1 ? "s" : ""} until Christmas` : left === 0 ? "Merry Christmas!" : "Hope you had a lovely Christmas"}</h2>` +
    `<div class="tabs" role="group" aria-label="Advent calendar"><button data-adv="tab" data-t="xmas" aria-pressed="${t === "xmas"}">Christmas</button><button data-adv="tab" data-t="care" aria-pressed="${t === "care"}">Self care</button></div>` +
    `<p class="hint">${stat}. Each door opens on its date in December.</p>` +
    `<div class="doors ${t}">${order(t).map(d => door(t, d)).join("")}</div>` +
    `<label class="peek"><input type="checkbox" data-adv="peek" ${a.peek ? "checked" : ""}> Open any door early (preview)</label></section>` +
    `<section class="card" id="advpanel" aria-live="polite">${panelHtml()}</section>` +
    `<section class="card"><h2>Christmas wishlist</h2>${a.wish.length ? `<ul class="list">${a.wish.map((w, i) =>
      `<li><span>${esc(w)}</span><button data-adv="delwish" data-i="${i}" aria-label="Delete ${esc(w)}">×</button></li>`).join("")}</ul>` : `<p class="hint">Add things you’d love to receive or give.</p>`}` +
    `<form data-f="wish" class="inline"><input name="w" required maxlength="100" aria-label="Wishlist item" placeholder="Add a wish"><button class="primary">Add</button></form></section>`;
}

function pgCare() {
  const d = day(sel);
  d.habits = d.habits || {}; d.thanks = d.thanks || [];
  const wk = [...Array(7)].map((_, i) => {
    const x = at(sel); x.setDate(x.getDate() - 6 + i);
    const s = db.days[iso(x)] || {};
    return { m: s.mood || 0, z: s.sleep || 0, l: x.toLocaleDateString(undefined, { weekday: "narrow" }) };
  });
  const zs = wk.filter(w => w.z), avg = zs.length ? (zs.reduce((s, w) => s + w.z, 0) / zs.length).toFixed(1) + " hours" : "no data yet";
  return dateBar() +
    `<section class="card"><h2>Check-in</h2><div class="moods" role="group" aria-label="Mood">${MOODS.map((m, i) =>
      `<button data-care="mood" data-v="${i + 1}" aria-pressed="${d.mood === i + 1}" aria-label="Mood ${i + 1} of 5">${m}</button>`).join("")}</div>` +
    `<label>Hours of sleep<input type="number" min="0" max="24" step="0.25" data-care="sleep" value="${d.sleep || ""}"></label></section>` +
    `<section class="card"><h2>Self-care habits</h2><ul class="list">${HABITS.map((h, i) =>
      `<li><label><input type="checkbox" data-care="habit" data-i="${i}" ${d.habits[i] ? "checked" : ""}>${h}</label></li>`).join("")}</ul></section>` +
    `<section class="card"><h2>Gratitude</h2>${d.thanks.length ? `<ul class="list">${d.thanks.map((g, i) =>
      `<li><span>${esc(g)}</span><button data-care="delthanks" data-i="${i}" aria-label="Delete entry">×</button></li>`).join("")}</ul>` : ""}` +
    `<form data-f="thanks" class="inline"><input name="g" required maxlength="140" aria-label="Gratitude entry" placeholder="One thing you’re grateful for"><button class="primary">Add</button></form></section>` +
    `<section class="card"><h2>Breathe</h2><div class="breathe" id="br"><div class="orb"></div><span class="cue">Press start</span></div><button data-care="breathe">Start</button><p class="hint">Breathe in for 4 seconds, hold for 2, breathe out for 4.</p></section>` +
    `<section class="card"><h2>Mood, last 7 days</h2><div class="week" role="img" aria-label="Mood over the last 7 days">${wk.map(w =>
      `<div title="${w.m ? w.m + " of 5" : "no entry"}"><i style="height:${w.m * 20}%"></i><span>${w.l}</span></div>`).join("")}</div><p class="hint">Average sleep: ${avg}</p></section>`;
}

app.addEventListener("click", e => {
  const b = e.target.closest("[data-door],[data-adv],[data-care]");
  if (!b || b.dataset.care === "sleep") return;
  const a = A();
  if (b.dataset.door) {
    const d = +b.dataset.door;
    if (!unlocked(d)) {
      b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake");
      advMsg = `Door ${d} opens on December ${d}.`; advSel = null;
    } else {
      if (!a.open[advTab][d]) { a.open[advTab][d] = 1; b.querySelector(".back").innerHTML = backHtml(advTab, d); b.classList.add("opened"); }
      advSel = d;
    }
    save();
    document.getElementById("advpanel").innerHTML = panelHtml();
    document.querySelectorAll(".door").forEach(x => x.classList.toggle("sel", +x.dataset.door === advSel));
    return;
  }
  const k = b.dataset.adv, c = b.dataset.care, d = +b.dataset.d, i = +b.dataset.i, dy = day(sel);
  if (k === "tab") { advTab = b.dataset.t; advSel = null; }
  else if (k === "peek") a.peek = !a.peek;
  else if (k === "done") a.done[advTab][d] = !a.done[advTab][d];
  else if (k === "walk" || k === "run") a.done.care[d] = a.done.care[d] === k ? false : k;
  else if (k === "delwish") a.wish.splice(i, 1);
  else if (c === "mood") dy.mood = dy.mood === +b.dataset.v ? 0 : +b.dataset.v;
  else if (c === "habit") { dy.habits = dy.habits || {}; dy.habits[i] = !dy.habits[i]; }
  else if (c === "delthanks") dy.thanks.splice(i, 1);
  else if (c === "breathe") {
    const br = document.getElementById("br"), cue = br.querySelector(".cue"), on = br.classList.toggle("on");
    b.textContent = on ? "Stop" : "Start";
    clearInterval(brT);
    if (!on) cue.textContent = "Press start";
    else {
      const t0 = Date.now();
      cue.textContent = "Breathe in";
      brT = setInterval(() => {
        if (!document.getElementById("br")) return clearInterval(brT);
        const s = ((Date.now() - t0) / 1000) % 10;
        cue.textContent = s < 4 ? "Breathe in" : s < 6 ? "Hold" : "Breathe out";
      }, 250);
    }
    return;
  }
  save(); render();
});

app.addEventListener("submit", e => {
  const f = Object.fromEntries(new FormData(e.target)), k = e.target.dataset.f;
  if (k === "wish" && f.w.trim()) A().wish.push(f.w.trim());
  if (k === "thanks" && f.g.trim()) { const d = day(sel); (d.thanks = d.thanks || []).push(f.g.trim()); }
  save(); render();
});

app.addEventListener("change", e => {
  if (e.target.dataset.care === "sleep") { day(sel).sleep = Math.min(24, num(e.target.value)); save(); render(); }
});

pages.advent = pgAdvent;
pages.care = pgCare;
document.querySelector("nav").insertAdjacentHTML("beforeend", '<a href="#advent">Advent</a><a href="#care">Care</a>');
render();
