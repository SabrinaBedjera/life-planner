(function () {
  var KEY = "life-planner-arcade-v1";
  var DAY = 864e5;
  function iso(d) { return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); }
  var today = new Date(); today.setHours(0, 0, 0, 0);
  function plus(n) { return iso(new Date(today.getTime() + n * DAY)); }
  var dow = (today.getDay() + 6) % 7;
  var monday = new Date(today.getTime() - dow * DAY);
  var weekKey = iso(monday);
  var uid = function () { return Math.random().toString(36).slice(2, 9); };

  var LANES = [
    { id: "uni", name: "UNI", c: "var(--cyan)" },
    { id: "work", name: "WORK", c: "var(--amber)" },
    { id: "gym", name: "GYM", c: "var(--lime)" },
    { id: "social", name: "SOCIAL", c: "var(--magenta)" }
  ];
  var STATUS = {
    deadlines: ["todo", "doing", "done"],
    jobs: ["saved", "applied", "interview", "offer", "no"],
    games: ["backlog", "playing", "finished", "dropped"],
    social: ["planned", "went"],
    clubs: ["interested", "joined", "left"],
    people: ["met", "followed"]
  };
  var LABEL = { todo: "To do", doing: "On it", done: "Submitted", saved: "Saved", applied: "Applied", interview: "Interview", offer: "Offer", no: "No", backlog: "Backlog", playing: "Playing", finished: "Finished", dropped: "Dropped", planned: "Planned", went: "Done", interested: "Interested", joined: "Joined", left: "Left", met: "Met", followed: "Followed up" };

  function examples() {
    return {
      week: {}, weekSeed: ["9am lecture\nGym after", "Library 2–5\nStart essay plan", "Shift 5–10pm", "Seminar\nFive-a-side", "Hand in lab report\nNight out", "Lie in\nRanked games", "Call home\nPlan next week"],
      focus: "Get the essay plan done early",
      quests: [
        { id: uid(), lane: "uni", text: "Read chapter 4 before seminar", done: true },
        { id: uid(), lane: "uni", text: "Email tutor about extension", done: false },
        { id: uid(), lane: "work", text: "Update CV for summer internships", done: false },
        { id: uid(), lane: "gym", text: "3 sessions this week", done: false },
        { id: uid(), lane: "social", text: "Go to the climbing society taster", done: false },
        { id: uid(), lane: "social", text: "Say yes to one plan this week", done: false }
      ],
      reflect: "",
      deadlines: [
        { id: uid(), title: "Lab report", module: "Physics 101", date: plus(3), s: "doing" },
        { id: uid(), title: "Essay: 2,000 words", module: "History", date: plus(10), s: "todo" },
        { id: uid(), title: "Midterm exam", module: "Maths", date: plus(17), s: "todo" }
      ],
      modules: [
        { id: uid(), title: "Physics 101", note: "Labs on Thursdays" },
        { id: uid(), title: "Maths", note: "Problem sheets due Mondays" },
        { id: uid(), title: "History", note: "Seminar reading is heavy" }
      ],
      jobs: [
        { id: uid(), title: "Weekend barista", org: "Campus café", date: "", s: "offer" },
        { id: uid(), title: "Summer internship", org: "Tech company", date: plus(21), s: "saved" },
        { id: uid(), title: "Student ambassador", org: "Uni", date: plus(6), s: "applied" }
      ],
      budget: 80,
      spends: [
        { id: uid(), title: "Food shop", amount: 32.5 },
        { id: uid(), title: "Bus pass top-up", amount: 10 }
      ],
      gym: [
        { id: uid(), date: iso(monday), type: "Push", title: "Bench felt strong" }
      ],
      games: [
        { id: uid(), title: "That co-op game with the flat", s: "playing" },
        { id: uid(), title: "Long RPG for the holidays", s: "backlog" },
        { id: uid(), title: "Learn guitar basics", s: "backlog" }
      ],
      social: [
        { id: uid(), title: "Gig with flatmates", date: plus(5), s: "planned" },
        { id: uid(), title: "Five-a-side then food", date: plus(2), s: "planned" }
      ],
      clubs: [
        { id: uid(), title: "Five-a-side football", role: "Member", date: plus(2), s: "joined" },
        { id: uid(), title: "Gaming society", role: "Social rep", date: plus(4), s: "joined" },
        { id: uid(), title: "Climbing society", role: "", date: plus(1), s: "interested" }
      ],
      duties: [
        { id: uid(), title: "Book the room for games night", club: "Gaming society", date: plus(3), done: false },
        { id: uid(), title: "Post the social on the group chat", club: "Gaming society", date: plus(1), done: false },
        { id: uid(), title: "Pay subs", club: "Five-a-side football", date: plus(7), done: false }
      ],
      goals: [
        { id: uid(), area: "Uni", title: "No all-nighters before deadlines", done: false },
        { id: uid(), area: "Money", title: "Stay under budget 4 weeks in a row", done: false },
        { id: uid(), area: "Gym", title: "Train 3x a week all term", done: false },
        { id: uid(), area: "Social", title: "Join two clubs and actually keep going", done: false }
      ],
      bonus: 0
    };
  }

  var state;
  try { state = JSON.parse(localStorage.getItem(KEY)); } catch (e) { state = null; }
  if (!state) state = examples();
  if (window.LPBackup) { LPBackup.setSource(function () { return state; }); LPBackup.setSamples(examples); }
  ["clubs", "duties"].forEach(function (k) { if (!state[k]) state[k] = examples()[k]; });
  if (state.resetsV !== 3) { state.resetsV = 3; state.resets = [
    { id: uid(), title: "10-minute walk outside" },
    { id: uid(), title: "Gym or a run" },
    { id: uid(), title: "Refuel: eat something good" },
    { id: uid(), title: "Shower and a glass of water" },
    { id: uid(), title: "Text a mate, about anything" },
    { id: uid(), title: "Early night, phone in the other room" },
    { id: uid(), title: "Call a family member" },
    { id: uid(), title: "Talk to a counsellor" }
  ]; }
  if (!state.battery) state.battery = {};

  /* Respawn: daily battery check */
  var BATS = [
    { v: 1, name: "Empty", w: "2px", c: "var(--red)" },
    { v: 2, name: "Low", w: "5px", c: "var(--amber)" },
    { v: 3, name: "OK", w: "10px", c: "var(--cyan)" },
    { v: 4, name: "Good", w: "14px", c: "var(--lime)" },
    { v: 5, name: "Full", w: "17px", c: "var(--lime)" }
  ];
  function renderBattery() {
    var todayKey = iso(today);
    if (!state.batAuto) state.batAuto = {};
    if (!state.battery[todayKey]) { state.battery[todayKey] = 4; state.batAuto[todayKey] = true; save(); }
    var cur = state.battery[todayKey], picked = !state.batAuto[todayKey];
    var btns = document.getElementById("batBtns");
    btns.innerHTML = BATS.map(function (b) {
      return '<button class="bat" role="radio" data-v="' + b.v + '" aria-checked="' + (cur === b.v) + '" style="--w:' + b.w + ";--bc:" + b.c + '"><i></i>' + b.name + "</button>";
    }).join("");
    btns.querySelectorAll(".bat").forEach(function (el) {
      el.addEventListener("click", function () { var v = +el.dataset.v; state.battery[todayKey] = v; delete state.batAuto[todayKey]; save(); renderBattery(); });
    });
    var names = ["M", "T", "W", "T", "F", "S", "S"];
    document.getElementById("batWeek").innerHTML = names.map(function (n, i) {
      var v = state.battery[iso(new Date(monday.getTime() + i * DAY))], b = BATS[v - 1];
      return '<div class="' + (b ? "set" : "") + '"' + (b ? ' style="--bc:' + b.c + '" title="' + b.name + '"' : "") + ">" + n + "</div>";
    }).join("");
    var cells = [], start = new Date(monday.getTime() - 21 * DAY);
    for (var k = 0; k < 28; k++) {
      var dk = iso(new Date(start.getTime() + k * DAY)), bv = BATS[state.battery[dk] - 1];
      cells.push('<div class="' + (bv ? "set " : "") + (dk === todayKey ? "now" : "") + '"' + (bv ? ' style="--bc:' + bv.c + '" title="' + dk + ": " + bv.name + '"' : ' title="' + dk + '"') + "></div>");
    }
    document.getElementById("batMonth").innerHTML = cells.join("");
    document.getElementById("resets").hidden = !(cur && cur <= 2);
    document.getElementById("emptyLine").hidden = cur !== 1;
    document.getElementById("hpLine").textContent = !picked ? "Feeling good today? Tap if that's changed." : cur <= 2 ? "Low HP? Time to recharge." : cur === 3 ? "Holding steady. Keep it up." : "Full HP. Nice one.";
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { if (window.LPBackup) LPBackup.saveFailed(e); } renderXP(); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function $(s) { return document.querySelector(s); }

  /* XP: earned only from things ticked off here */
  function xp() {
    var n = 0;
    state.quests.forEach(function (q) { if (q.done) n += 10; });
    state.deadlines.forEach(function (d) { if (d.s === "done") n += 25; });
    state.jobs.forEach(function (j) { if (j.s !== "saved") n += 10; });
    state.gym.forEach(function () { n += 15; });
    Object.keys(state.study || {}).forEach(function (k) { n += 10 * (state.study[k] || 0); });
    state.clubs.forEach(function (c) { if (c.s === "joined") n += 20; });
    state.duties.forEach(function (d) { if (d.done) n += 15; });
    return n;
  }
  function renderXP() {
    var n = xp(), lvl = Math.floor(n / 100) + 1;
    $("#lvl").textContent = "LVL " + lvl; $("#xpText").textContent = n + " XP";
    $("#xpBar").style.width = (n % 100) + "%";
  }

  /* Due-date label */
  function dueLabel(date) {
    if (!date) return "";
    var d = new Date(date + "T00:00:00"), diff = Math.round((d - today) / DAY);
    var cls = diff < 0 ? "late" : diff <= 3 ? "soon" : "";
    var txt = diff < 0 ? Math.abs(diff) + "D LATE" : diff === 0 ? "TODAY" : diff === 1 ? "TOMORROW" : "IN " + diff + "D";
    return '<span class="due ' + cls + '">' + txt + "</span>";
  }

  /* Week ahead */
  function renderWeek() {
    var names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], wrap = $("#sched");
    var saved = state.week[weekKey];
    wrap.innerHTML = "";
    names.forEach(function (n, i) {
      var d = new Date(monday.getTime() + i * DAY);
      var el = document.createElement("div");
      el.className = "day" + (i === dow ? " today" : "");
      el.innerHTML = '<label class="dn" for="day-' + i + '">' + n + "<span>" + d.getDate() + "/" + (d.getMonth() + 1) + "</span></label>";
      var ta = document.createElement("textarea");
      ta.id = "day-" + i; ta.rows = 4;
      ta.value = saved ? (saved[i] || "") : (state.weekSeed ? state.weekSeed[i] : "");
      ta.addEventListener("input", function () {
        if (!state.week[weekKey]) state.week[weekKey] = Array.prototype.map.call(wrap.querySelectorAll("textarea"), function (t) { return t.value; });
        state.week[weekKey][i] = ta.value; save();
        $("#schedMsg").textContent = "Saved.";
      });
      el.appendChild(ta); wrap.appendChild(el);
    });
  }

  /* Quests by lane */
  function renderQuests() {
    var lanes = $("#lanes"); lanes.innerHTML = "";
    LANES.forEach(function (l) {
      var items = state.quests.filter(function (q) { return q.lane === l.id; });
      var box = document.createElement("div");
      box.className = "lane"; box.style.setProperty("--c", l.c);
      box.innerHTML = "<h3>" + l.name + "</h3>" + (items.length ? "" : '<div class="empty">Nothing yet.</div>');
      var ul = document.createElement("ul"); ul.className = "list";
      items.forEach(function (q) {
        var li = document.createElement("li");
        li.className = "item" + (q.done ? " done" : ""); li.style.gridTemplateColumns = "auto minmax(0,1fr) auto";
        li.innerHTML = '<input type="checkbox" class="check" aria-label="Done"' + (q.done ? " checked" : "") + '><span class="t"><span>' + esc(q.text) + '</span></span><button class="x" aria-label="Remove">×</button>';
        li.querySelector(".check").addEventListener("change", function (e) { q.done = e.target.checked; save(); renderQuests(); });
        li.querySelector(".x").addEventListener("click", function () { state.quests = state.quests.filter(function (x) { return x !== q; }); save(); renderQuests(); });
        ul.appendChild(li);
      });
      box.appendChild(ul); lanes.appendChild(box);
    });
  }
  $("#questLane").innerHTML = LANES.map(function (l) { return '<option value="' + l.id + '">' + l.name.charAt(0) + l.name.slice(1).toLowerCase() + "</option>"; }).join("");
  $("#questForm").addEventListener("submit", function (e) {
    e.preventDefault(); var t = $("#questText").value.trim(); if (!t) return;
    state.quests.push({ id: uid(), lane: $("#questLane").value, text: t, done: false });
    $("#questText").value = ""; save(); renderQuests();
  });

  /* Generic lists */
  function sub(key, it) {
    if (key === "deadlines") return esc(it.module);
    if (key === "jobs") return esc(it.org);
    if (key === "modules") return esc(it.note);
    if (key === "clubs") return esc(it.role || "") + (it.date ? (it.role ? " · " : "") + "next meet-up" : "");
    if (key === "duties") return esc(it.club);
    if (key === "people") return esc(it.met);
    if (key === "gym") return esc(it.type) + (it.date ? " · " + new Date(it.date + "T00:00:00").toLocaleDateString("en", { weekday: "short", day: "numeric", month: "short" }) : "");
    if (key === "spends") return "";
    return "";
  }
  function renderList(key) {
    var ul = $("#list-" + key); if (!ul) return;
    var items = state[key].slice();
    if (key === "deadlines" || key === "social" || key === "jobs" || key === "duties" || key === "clubs") items.sort(function (a, b) { return (a.date || "9999").localeCompare(b.date || "9999"); });
    if (key === "gym") items.sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); });
    ul.innerHTML = items.length ? "" : '<li class="empty">Nothing here yet. Add one below.</li>';
    items.forEach(function (it) {
      var li = document.createElement("li");
      var hasStatus = !!STATUS[key], isGoal = key === "goals" || key === "duties";
      li.className = "item" + ((isGoal && it.done) || (hasStatus && /^(done|offer|finished|went|left)$/.test(it.s)) ? " done" : "");
      var lead = isGoal ? '<input type="checkbox" class="check" aria-label="Done"' + (it.done ? " checked" : "") + ">" : "<span></span>";
      var title = key === "spends" ? esc(it.title) + "<small>" + Number(it.amount).toFixed(2) + "</small>" : esc(it.title) + (sub(key, it) ? "<small>" + sub(key, it) + "</small>" : "");
      if (key === "goals") title = esc(it.title) + "<small>" + esc(it.area) + "</small>";
      var right = hasStatus ? '<button class="pill" data-s="' + it.s + '">' + LABEL[it.s] + "</button>" : "";
      li.innerHTML = lead + '<span class="t"><span>' + title + "</span></span>" + (it.date && key !== "gym" ? dueLabel(it.date) : "<span></span>") + '<span style="display:flex;gap:8px;align-items:center">' + right + '<button class="x" aria-label="Remove">×</button></span>';
      if (isGoal) li.querySelector(".check").addEventListener("change", function (e) { it.done = e.target.checked; save(); renderList(key); });
      if (hasStatus) li.querySelector(".pill").addEventListener("click", function () {
        var opts = STATUS[key]; it.s = opts[(opts.indexOf(it.s) + 1) % opts.length]; save(); renderAll();
      });
      li.querySelector(".x").addEventListener("click", function () { state[key] = state[key].filter(function (x) { return x !== it; }); save(); renderAll(); });
      ul.appendChild(li);
    });
  }
  document.querySelectorAll("form[data-add]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var key = f.dataset.add, it = { id: uid() };
      Array.prototype.forEach.call(f.elements, function (el) { if (el.name) it[el.name] = el.value.trim(); });
      if (key === "spends") it.amount = parseFloat(it.amount) || 0;
      if (key === "gym" && !it.date) it.date = iso(today);
      if (STATUS[key]) it.s = STATUS[key][0];
      if (key === "goals" || key === "duties") it.done = false;
      state[key].push(it); f.reset(); save(); renderAll();
    });
  });

  /* Money */
  function renderMoney() {
    var spent = state.spends.reduce(function (a, s) { return a + (Number(s.amount) || 0); }, 0);
    var b = Number(state.budget) || 0, left = b - spent;
    $("#budget").value = state.budget;
    $("#mSpent").textContent = spent.toFixed(2);
    $("#mLeft").textContent = left.toFixed(2);
    $("#mLeft").style.color = left < 0 ? "var(--red)" : "var(--lime)";
    $("#mCount").textContent = state.spends.length;
    var pct = b ? Math.min(100, spent / b * 100) : 0;
    $("#meter").classList.toggle("over", left < 0);
    $("#meter i").style.width = pct + "%";
  }

  /* Gym streak for this week */
  function renderStreak() {
    var names = ["M", "T", "W", "T", "F", "S", "S"], el = $("#streak");
    el.innerHTML = names.map(function (n, i) {
      var d = iso(new Date(monday.getTime() + i * DAY));
      var on = state.gym.some(function (g) { return g.date === d; });
      return '<div class="' + (on ? "on" : "") + '">' + n + "</div>";
    }).join("");
  }

  /* Coming up */
  function renderUpcoming() {
    var rows = [];
    state.deadlines.forEach(function (d) { if (d.date && d.s !== "done") rows.push({ date: d.date, t: d.title, k: "Uni · " + (d.module || "") }); });
    state.jobs.forEach(function (j) { if (j.date && j.s !== "no" && j.s !== "offer") rows.push({ date: j.date, t: j.title, k: "Work · " + (j.org || "") }); });
    state.clubs.forEach(function (c) { if (c.date && c.s !== "left") rows.push({ date: c.date, t: c.title, k: "Club meet-up" }); });
    state.duties.forEach(function (d) { if (d.date && !d.done) rows.push({ date: d.date, t: d.title, k: "Club job · " + (d.club || "") }); });
    rows.sort(function (a, b) { return a.date.localeCompare(b.date); });
    var ul = $("#upcoming");
    ul.innerHTML = rows.length ? rows.slice(0, 4).map(function (r) {
      return '<li class="item" style="grid-template-columns:minmax(0,1fr) auto"><span class="t"><span>' + esc(r.t) + "<small>" + esc(r.k) + "</small></span></span>" + dueLabel(r.date) + "</li>";
    }).join("") : '<li class="empty">Nothing with a date yet.</li>';
  }

  function renderAll() {
    ["deadlines", "jobs", "gym", "clubs", "duties", "resets"].forEach(renderList);
    renderStreak(); renderUpcoming(); renderXP();
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-act]"); if (!a) return;
    if (a.dataset.act === "reset") {
      if (a.dataset.armed) {
        state = { week: {}, weekSeed: null, focus: "", quests: [], reflect: "", deadlines: [], modules: [], jobs: [], budget: 0, spends: [], gym: [], games: [], social: [], clubs: [], duties: [], people: [], goals: [], bonus: 0, resets: state.resets, resetsV: 3, battery: {}, batAuto: {}, party: [], study: {}, studyTarget: 5 };
        save(); renderWeek(); renderQuests(); renderAll(); renderBattery(); renderParty(); renderStudy();
        a.textContent = "Start fresh"; delete a.dataset.armed;
      } else { a.dataset.armed = "1"; a.textContent = "Tap again to clear everything"; setTimeout(function () { a.textContent = "Start fresh"; delete a.dataset.armed; }, 4000); }
    }
  });

  /* Tabs via hash */
  var VIEWS = ["week", "uni", "work", "social", "gym"];
  function route() {
    var v = (location.hash || "#week").slice(1); if (VIEWS.indexOf(v) < 0) v = "week";
    VIEWS.forEach(function (n) { document.getElementById("view-" + n).hidden = n !== v; });
    document.querySelectorAll(".tab").forEach(function (t) { t.setAttribute("aria-selected", t.getAttribute("href") === "#" + v ? "true" : "false"); });
  }
  window.addEventListener("hashchange", route);

  /* Your party: people in his corner */
  if (!state.party) state.party = [];
  function renderParty() {
    var box = document.getElementById("party");
    box.innerHTML = state.party.length ? "" : '<span class="hint">Mates, teammates, family. Who\'s got your back?</span>';
    state.party.forEach(function (name, i) {
      var c = document.createElement("span"); c.className = "chip";
      c.innerHTML = esc(name) + '<button class="x" aria-label="Remove ' + esc(name) + '">×</button>';
      c.querySelector(".x").addEventListener("click", function () { state.party.splice(i, 1); save(); renderParty(); });
      box.appendChild(c);
    });
  }
  document.getElementById("partyForm").addEventListener("submit", function (e) {
    e.preventDefault(); var inp = document.getElementById("partyName"), v = inp.value.trim(); if (!v) return;
    state.party.push(v); inp.value = ""; save(); renderParty();
  });

  /* Study sessions: weekly target, tap to fill */
  /* New week: clear finished quests, carry over the rest */
  if (state.questWeek && state.questWeek !== weekKey) state.quests = state.quests.filter(function (q) { return !q.done; });
  state.questWeek = weekKey;
  if (!state.study) state.study = {};
  if (!state.studyTarget) state.studyTarget = 5;
  function renderStudy() {
    var done = state.study[weekKey] || 0, t = state.studyTarget, box = document.getElementById("study");
    box.innerHTML = "";
    for (var i = 0; i < Math.max(t, done); i++) {
      var b = document.createElement("button");
      b.className = "sbox" + (i < done ? " on" : ""); b.type = "button";
      b.setAttribute("aria-label", "Session " + (i + 1) + (i < done ? ", done" : ""));
      b.textContent = i < done ? "✓" : "";
      (function (i) { b.addEventListener("click", function () { state.study[weekKey] = i < done ? i : i + 1; save(); renderStudy(); }); })(i);
      box.appendChild(b);
    }
    document.getElementById("studyTarget").textContent = t;
    document.getElementById("studyMsg").textContent = done >= t ? "Target hit this week. Nice." : done + " of " + t + " this week.";
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-act]"); if (!a) return;
    if (a.dataset.act === "study-plus") { state.studyTarget = Math.min(14, state.studyTarget + 1); save(); renderStudy(); }
    if (a.dataset.act === "study-minus") { state.studyTarget = Math.max(1, state.studyTarget - 1); save(); renderStudy(); }
  });

  /* Quote of the day: tap for another */
  var QUOTES = [
    ["It's dangerous to go alone! Take this.", "The Legend of Zelda"],
    ["Believe in the you that believes in yourself.", "Kamina, Gurren Lagann"],
    ["Plus Ultra!", "My Hero Academia"],
    ["Stay determined.", "Undertale"],
    ["Wake me when you need me.", "Master Chief, Halo 3"],
    ["If you don't take risks, you can't create a future.", "Luffy, One Piece"],
    ["I never go back on my word. That's my ninja way!", "Naruto"],
    ["My friends are my power!", "Sora, Kingdom Hearts"],
    ["Don't you dare go hollow.", "Dark Souls"],
    ["Sometimes life is like this dark tunnel. You can't always see the light at the end, but if you just keep moving, you will come to a better place.", "Uncle Iroh, Avatar"],
    ["A dropout will beat a genius through hard work.", "Rock Lee, Naruto"],
    ["Strength does not come from winning. Your struggles develop your strengths.", "Arnold Schwarzenegger"],
    ["Don't count the days, make the days count.", "Muhammad Ali"],
    ["I wanna be the very best, like no one ever was.", "Pokémon theme"]
  ];
  var qi = Math.floor(today.getTime() / DAY) % QUOTES.length;
  function showQuote() { document.getElementById("qText").textContent = "\u201C" + QUOTES[qi][0] + "\u201D"; document.getElementById("qWho").textContent = QUOTES[qi][1].toUpperCase(); }
  document.getElementById("quote").addEventListener("click", function () { qi = (qi + 1) % QUOTES.length; showQuote(); });
  showQuote();

  renderWeek(); renderQuests(); renderAll(); renderBattery(); renderParty(); renderStudy(); route();
})();
