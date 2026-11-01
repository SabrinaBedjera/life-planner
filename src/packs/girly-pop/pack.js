(() => {
  /* ================= Constants ================= */
  const STAGES = [
    { id: "pool", label: "Pool" },
    { id: "queue", label: "Apply next" },
    { id: "applied", label: "Applied" },
    { id: "interviewing", label: "Interviewing" },
    { id: "offer", label: "Offer" },
  ];
  const SIDE = [
    { id: "rejected", label: "Rejected" },
    { id: "withdrawn", label: "Withdrew" },
    { id: "passed", label: "I passed" },
    { id: "closed", label: "Posting closed" },
  ];
  const INACTIVE = new Set(SIDE.map((s) => s.id));
  const APPLIED_SET = new Set(["applied", "interviewing", "offer", "rejected", "withdrawn"]);
  const ALL_STATUS = [...STAGES, ...SIDE];
  const AI_CALL = {
    "apply-next": { text: "AI: apply next", cls: "ai" },
    "worth": { text: "AI: worth applying", cls: "ai" },
    "maybe": { text: "AI: maybe", cls: "ai" },
    "pass": { text: "AI: suggests passing", cls: "ai" },
  };
  const CHECK = [
    { id: "not-checked", label: "Not checked", cls: "" },
    { id: "unverified", label: "Couldn't verify", cls: "warn" },
    { id: "open", label: "Confirmed open", cls: "good" },
    { id: "closed", label: "Confirmed closed", cls: "bad" },
  ];
  const P_STATUS = [
    { id: "to-contact", label: "To reach out" },
    { id: "reached-out", label: "Reached out" },
    { id: "replied", label: "Replied" },
    { id: "met", label: "Met / talked" },
    { id: "referred", label: "Referred me" },
    { id: "no-reply", label: "No reply" },
  ];
  const PROJ_STATUS = [
    { id: "active", label: "Active" },
    { id: "small", label: "Small / time-bound" },
    { id: "vault", label: "Idea vault" },
    { id: "done", label: "Done" },
  ];
  const BUCKET_NOTE = {
    active: "A few projects getting real attention.",
    small: "Contained tasks or genuine deadlines.",
    done: "Finished. Good conversation starters.",
    vault: "Exciting possibilities, no commitment yet.",
  };
  const MIX = [
    { k: "assess", label: "Technical assessment", c: "--info" },
    { k: "data", label: "Data & tools", c: "--good" },
    { k: "strategy", label: "Strategy", c: "--accent" },
    { k: "commercial", label: "Commercial & negotiation", c: "--warn" },
    { k: "admin", label: "Briefings & admin", c: "--muted" },
  ];
  const ACTIONS = [
    { k: "comment", label: "Thoughtful comments" },
    { k: "outreach", label: "Outreach messages" },
    { k: "apply", label: "Applications" },
    { k: "project", label: "Project steps" },
  ];
  const LSTAGES = [
    { n: 1, t: "Comment", goal: "Leave one or two thoughtful LinkedIn comments" },
    { n: 2, t: "Connect", goal: "Add a few relevant LinkedIn connections, with a note when there's a real reason" },
    { n: 3, t: "Converse", goal: "Send one message or set up one coffee chat" },
    { n: 4, t: "Share", goal: "Share one post from my own work" },
  ];
  const LANES = [
    { k: "body", l: "Health" }, { k: "career", l: "Career" }, { k: "people", l: "Social" }, { k: "creative", l: "Creative" }, { k: "other", l: "Other" },
  ];
  // Sort a schedule line into a lane by keywords. First match wins, in this order.
  const LANE_WORDS = [
    ["career", ["resume", "résumé", "cv", "apply", "application", "linkedin", "interview", "job", "cover letter", "recruiter", "networking", "coffee chat", "portfolio", "website", "lab project", "github", "python"]],
    ["body", ["run", "jog", "yoga", "pilates", "gym", "strength", "workout", "physio", " pt", "pt ", "walk", "hike", "swim", "stretch", "doctor", "rest", "sleep", "meditat", "exercise", "training", "pickleball", "tennis", "badminton", "climb", "bike", "cycl", "spin", "soccer", "skiing", "skate", "dance", "barre", "5k", "10k", "km"]],
    ["creative", ["colouring", "coloring", "novella", "writing", "write", "draw", "illustrat", "story", "paint", "art "]],
    ["people", ["friend", "concert", "dinner", "lunch", "brunch", "drinks", "party", "birthday", "family", "mom", "dad", "brother", "sister", "date night", "movie", "show", "game night", "visit", "wedding", "call with", "coffee with", "hang"]],
  ];
  const LANE_RX = LANE_WORDS.map(([lane, words]) => [lane, words.map((w) => new RegExp("(^|[^a-zà-ÿ0-9])" + w.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"))]);
  function classify(text) {
    for (const [lane, rxs] of LANE_RX) if (rxs.some((r) => r.test(text))) return lane;
    return "other";
  }
  const WTYPES = [
    { k: "run", l: "Run", c: "--accent" }, { k: "strength", l: "Strength", c: "--info" }, { k: "pilates", l: "Pilates", c: "--good" },
    { k: "yoga", l: "Yoga", c: "--warn" }, { k: "walk", l: "Walk", c: "--muted" }, { k: "other", l: "Other", c: "--fg" },
  ];
  const LEVEL = ["", "Low", "Low–medium", "Medium", "Medium–high", "High"];
  const CONF = { H: "high confidence", M: "medium confidence", L: "low confidence" };
  const VISA = {
    likely: { cls: "good", text: "Visa: likely workable" },
    unknown: { cls: "warn", text: "Visa: unknown" },
    restricted: { cls: "bad", text: "Visa: restricted" },
  };
  const NO_REPLY_DAYS = 21;

  /* ================= Example data (public copy only) ================= */
  const EX = {
    jobs: [
      { id: "ex1", title: "Product Designer", company: "Example Studio (sample)", location: "New York, NY", region: "New York", source: "Referral", status: "interviewing", interviewed: true, appliedOn: "2026-10-01", aiCall: "apply-next", check: "open", verified: "2026-10-20", qualified: 4, qConf: "M", enjoy: 5, eConf: "M", myInterest: 5, visa: "unknown", salary: "$90–110k", summary: "Designs app features from first sketch to launch.", pros: ["Mix of research, design and teamwork"], cons: ["Some evening launches"], gaps: ["Design systems"], mix: { assess: 20, data: 10, strategy: 20, commercial: 30, admin: 20 }, nextAction: "Prepare for second interview", nextDate: "", questions: ["How many days in the office?"], log: [{ date: "2026-10-01", text: "Applied through referral" }], outreach: [], notes: "", url: "", added: "2026-09-20" },
      { id: "ex2", title: "Marketing Manager", company: "Example Brands (sample)", location: "London, UK", region: "London", source: "Own find", status: "applied", appliedOn: "2026-09-10", aiCall: "worth", check: "open", verified: "2026-09-05", qualified: 3, qConf: "M", enjoy: 4, eConf: "L", myInterest: 3, visa: "unknown", salary: "£50–60k", summary: "Runs campaigns for a small lifestyle brand.", pros: ["Creative and varied"], cons: ["Small team, lots of hats"], gaps: ["Years of experience"], mix: { assess: 10, data: 20, strategy: 25, commercial: 30, admin: 15 }, log: [], notes: "", url: "", added: "2026-09-05" },
      { id: "ex3", title: "Office Coordinator", company: "Example Co. (sample)", location: "Remote", region: "Remote", source: "Recruiter", status: "passed", aiCall: "pass", check: "not-checked", qualified: 5, qConf: "H", enjoy: 2, eConf: "M", visa: "unknown", summary: "Mostly admin, so passed.", pros: [], cons: ["Admin would dominate"], gaps: [], log: [], notes: "", url: "", added: "2026-09-15" },
      { id: "ex4", title: "Project Manager", company: "Example Agency (sample)", location: "Remote", region: "Remote", source: "Own find", status: "queue", aiCall: "apply-next", check: "open", verified: "2026-10-25", deadline: "", qualified: 4, qConf: "M", enjoy: 4, eConf: "M", myInterest: 4, visa: "unknown", summary: "Leads client projects with real ownership.", pros: [], cons: [], gaps: ["Years of experience"], nextAction: "Tailor résumé", nextDate: "", log: [], notes: "", url: "", added: "2026-10-22" },
      { id: "ex5", title: "Data Analyst", company: "Example Labs (sample)", location: "New York, NY", region: "New York", source: "Own find", status: "pool", aiCall: "maybe", check: "unverified", qualified: 2, qConf: "L", enjoy: 3, eConf: "L", visa: "unknown", summary: "Check how much coding it needs.", pros: [], cons: [], gaps: ["SQL"], log: [], notes: "", url: "", added: "2026-10-10" },
    ],
    people: [
      { id: "exp1", name: "Example Contact (sample)", company: "Example Studio (sample)", role: "Design Lead", channel: "Referral intro", status: "met", jobId: "ex1", lastContact: "2026-09-25", nextDate: "", nextStep: "Send a short update after the second interview", notes: "", added: "2026-09-22" },
    ],
    projects: [
      { id: "exj1", name: "Example data visualization (sample)", status: "done", order: 1, short: "Example viz", skills: ["Interactive charts (sample)"], summary: "An interactive chart project.", links: [], nextStep: "Write a short LinkedIn post about what I learned", linkedin: "Good first post", added: "2026-09-01" },
    ],
    profile: [
      { id: "exs1", title: "What I'm looking for (sample)", order: 1, body: "A varied role mixing **creative work**, people and problem-solving.\n\n- No single activity more than half the job\n- Supportive team, sustainable hours" },
    ],
    weeks: [],
    workouts: [
      { id: "exw1", date: "2026-10-20", type: "run", minutes: 30, km: 4.5, effort: "easy", notes: "Sample run" },
      { id: "exw2", date: "2026-10-22", type: "pilates", minutes: 45, effort: "moderate", notes: "" },
    ],
    creative: [
      { id: "exc1", name: "Example short story (sample)", status: "active", order: 1, summary: "A creative project.", nextStep: "Write 500 words" },
    ],
    skills: [
      { id: "ks1", name: "Interactive charts (sample)", level: "built", order: 1 },
      { id: "ks2", name: "Python (sample)", level: "next", order: 2 },
    ],
    settings: { linkedinStage: 1, applyTarget: 3 },
  };

  /* ================= State + helpers ================= */
  const state = {
    jobs: [], people: [], projects: [], profile: [], weeks: [], skills: [], workouts: [], creative: [], targets: [], settings: { linkedinStage: 1 },
    mode: "loading", tab: "week", stage: null, region: "All", q: "", sort: "best", pStatus: "All", pq: "",
    fitAll: false, editing: null, db: null, schedDraft: {},
  };
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const isoLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayISO = () => isoLocal(new Date());
  const parse = (iso) => { const d = new Date(iso + "T12:00:00"); return isNaN(d) ? null : d; };
  const mondayOf = (d) => { const x = new Date(d); x.setHours(12, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  const WEEK = isoLocal(mondayOf(new Date()));
  const fmtDate = (iso) => { const d = iso && parse(iso); return d ? d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : ""; };
  const fmtShort = (iso) => { const d = iso && parse(iso); return d ? d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""; };
  const daysUntil = (iso) => {
    const d = iso && parse(iso); if (!d) return null;
    const t = new Date(); t.setHours(12, 0, 0, 0);
    return Math.round((d - t) / 86400000);
  };
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const score = (j) => (j.enjoy || 0) * 1.2 + (j.qualified || 0) + (j.myInterest || 0) * 1.5;
  const jobLabel = (j) => `${j.company} — ${j.title}`;
  const isDue = (p) => p.nextDate && daysUntil(p.nextDate) !== null && daysUntil(p.nextDate) <= 0 && p.status !== "no-reply";
  const hasApplied = (j) => APPLIED_SET.has(j.status) || !!j.appliedOn;
  const showBanner = (text) => { const b = $("banner"); b.textContent = text; b.hidden = false; };
  const live = () => state.mode === "live" && state.db;

  // Small markdown: paragraphs, bullet and numbered lists, pipe tables, **bold**, [links](https://…)
  function inline(s) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }
  function md(text) {
    const lines = String(text || "").split("\n");
    let html = "", i = 0;
    while (i < lines.length) {
      const l = lines[i];
      if (!l.trim()) { i++; continue; }
      if (l.trim().startsWith("|")) {
        const rows = [];
        while (i < lines.length && lines[i].trim().startsWith("|")) { rows.push(lines[i].trim()); i++; }
        const cells = (r) => r.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
        const body = rows.filter((r) => !/^\|?\s*:?-{3,}/.test(r));
        const [head, ...rest] = body;
        html += `<div class="scroll-x"><table><thead><tr>${cells(head).map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${rest.map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
        continue;
      }
      if (/^\s*[-*] /.test(l)) {
        const items = [];
        while (i < lines.length && /^\s*[-*] /.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*] /, "")); i++; }
        html += `<ul>${items.map((x) => `<li>${inline(x)}</li>`).join("")}</ul>`;
        continue;
      }
      if (/^\s*\d+\. /.test(l)) {
        const items = [];
        while (i < lines.length && /^\s*\d+\. /.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+\. /, "")); i++; }
        html += `<ol>${items.map((x) => `<li>${inline(x)}</li>`).join("")}</ol>`;
        continue;
      }
      const para = [];
      while (i < lines.length && lines[i].trim() && !/^\s*([-*] |\d+\. |\|)/.test(lines[i])) { para.push(lines[i]); i++; }
      html += `<p>${inline(para.join(" "))}</p>`;
    }
    return html;
  }

  async function writeDoc(coll, id, patch) {
    const arr = { jobs: state.jobs, contacts: state.people, projects: state.projects, profile: state.profile, creative: state.creative, workouts: state.workouts, targets: state.targets }[coll];
    const item = arr && arr.find((x) => x.id === id);
    if (item) Object.assign(item, patch);
    if (live()) {
      try { await state.db.collection(coll).doc(id).update(patch); }
      catch (e) { showBanner("That change didn't save. Reload the page and try again."); }
    }
  }

  /* ================= Tabs ================= */
  const TABS = ["week", "goals", "fitness", "roles", "insights", "people", "projects", "creative", "profile"];
  const GROUP = { week: "week", goals: "week", roles: "jobs", insights: "jobs", people: "jobs", projects: "jobs", profile: "jobs", fitness: "life", creative: "life" };
  function setTab(t) {
    state.tab = TABS.includes(t) ? t : "week";
    const g = GROUP[state.tab];
    document.querySelectorAll(".tab[data-top]").forEach((a) => a.setAttribute("aria-selected", String(a.dataset.top === g)));
    document.querySelectorAll(".subtabs [data-tab]").forEach((a) => a.setAttribute("aria-selected", String(a.dataset.tab === state.tab)));
    $("sub-week").hidden = g !== "week"; $("sub-jobs").hidden = g !== "jobs"; $("sub-life").hidden = g !== "life";
    TABS.forEach((x) => { $("panel-" + x).hidden = x !== state.tab; });
    renderCharts();
  }
  window.addEventListener("hashchange", () => setTab(location.hash.slice(1)));

  /* ================= This week ================= */
  const weekDoc = () => state.weeks.find((w) => w.id === WEEK);
  function defaultItems() { return []; }
  const weekItems = () => (weekDoc() && weekDoc().items) || defaultItems();
  const weekActions = (w) => Object.assign({ comment: 0, outreach: 0, apply: 0, project: 0 }, (w && w.actions) || {});

  async function saveWeek(patch) {
    const cur = weekDoc();
    const base = cur ? { ...cur } : { week: WEEK, items: defaultItems(), actions: weekActions(null), reflection: {} };
    delete base.id;
    const next = { ...base, ...patch };
    if (cur) Object.assign(cur, patch); else state.weeks.push({ id: WEEK, ...next });
    if (live()) {
      try { await state.db.collection("weeks").doc(WEEK).set(next); }
      catch (e) { showBanner("That change didn't save. Reload the page and try again."); }
    }
  }

  const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  function renderSchedule() {
    const sch = (weekDoc() && weekDoc().schedule) || {};
    const today = todayISO();
    const active = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.day : null;
    // While typing in a day, leave the boxes alone so the cursor stays put; the lanes below still refresh
    if (active && $("sched").contains(document.activeElement) && $("sched").children.length) return;
    $("sched").innerHTML = DAYS.map((d, i) => {
      const iso = addDays(WEEK, i), dt = parse(iso);
      const val = state.schedDraft[d] !== undefined ? state.schedDraft[d] : (sch[d] || "");
      return `<div class="day${iso === today ? " today" : ""}"><label class="dn" for="day-${d}">${dt.toLocaleDateString(undefined, { weekday: "short" })}<span>${dt.getDate()}</span></label><textarea class="field" id="day-${d}" data-day="${d}" rows="3">${esc(val)}</textarea></div>`;
    }).join("");
    if (active) { const el = $("day-" + active); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }
  }

  let schedTimer = null;
  async function saveSchedule() {
    clearTimeout(schedTimer);
    const saved = (weekDoc() && weekDoc().schedule) || {};
    const schedule = {};
    DAYS.forEach((d) => { schedule[d] = (state.schedDraft[d] !== undefined ? state.schedDraft[d] : (saved[d] || "")).trim(); });
    // Turn each schedule line into a checklist item in its category; keep ticks on lines that didn't change.
    const old = weekItems();
    const kept = old.filter((it) => !String(it.id).startsWith("s-"));
    const prevDone = Object.fromEntries(old.filter((it) => String(it.id).startsWith("s-")).map((it) => [it.id, it.done]));
    const fromSched = [];
    DAYS.forEach((d, i) => {
      const label = parse(addDays(WEEK, i)).toLocaleDateString(undefined, { weekday: "short" });
      schedule[d].split(/\n|;/).map((x) => x.trim()).filter(Boolean).forEach((line) => {
        const id = "s-" + d + "-" + line.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
        fromSched.push({ id, text: `${label}: ${line}`, lane: classify(line), done: !!prevDone[id] });
      });
    });
    const snapshot = { ...state.schedDraft };
    await saveWeek({ schedule, items: [...kept, ...fromSched] });
    // drop drafts that are now stored (unless the person kept typing meanwhile)
    Object.keys(snapshot).forEach((d) => { if (state.schedDraft[d] === snapshot[d]) delete state.schedDraft[d]; });
    $("schedMsg").textContent = live() ? "Saved" : "Saved for this visit";
    if (!typing() || $("sched").contains(document.activeElement)) render(true); else { renderMeta(); state.pendingRender = true; }
  }
  document.addEventListener("input", (e) => {
    const t = e.target;
    if (!t.matches || !t.matches("#sched textarea")) return;
    state.schedDraft[t.dataset.day] = t.value;
    $("schedMsg").textContent = "Saving…";
    clearTimeout(schedTimer);
    schedTimer = setTimeout(saveSchedule, 600);
  });

  function renderWeek() {
    renderSchedule();
    const mon = parse(WEEK);
    $("weekTitle").textContent = `Week of ${mon.toLocaleDateString(undefined, { month: "long", day: "numeric" })}`;
    const items = weekItems();
    const li = (it) => `<li class="${it.done ? "done" : ""}"><label for="wi-${esc(it.id)}"><input type="checkbox" id="wi-${esc(it.id)}" data-act="toggle-item" data-id="${esc(it.id)}" ${it.done ? "checked" : ""}><span>${esc(it.text)}</span></label></li>`;
    const wk = weekWorkouts(WEEK), wt = weekWorkoutTarget();
    const pulled = dueThisWeek();
    const act = document.activeElement, keep = act && act.classList && act.classList.contains("lane-input") ? { lane: act.closest("form").dataset.lane, v: act.value } : null;
    $("lanes").innerHTML = LANES.filter((ln) => ln.k !== "other" || items.some((it) => it.lane === "other")).map((ln) => {
      const its = items.filter((it) => (it.lane || "career") === ln.k);
      const pl = pulled.filter((x) => x.lane === ln.k);
      const auto = "";
      const add = `<form class="lane-add" data-lane="${ln.k}"><input type="checkbox" disabled tabindex="-1" aria-hidden="true"><input class="lane-input" placeholder="Add something…" aria-label="Add to ${ln.l}" autocomplete="off"></form>`;
      return `<div class="lane"><h3><span>${ln.l}</span></h3><div class="lane-body">${auto}${its.length ? `<ul class="checklist">${its.map(li).join("")}</ul>` : ""}${add}</div></div>`;
    }).join("");
    if (keep) { const f = document.querySelector(`.lane-add[data-lane="${keep.lane}"] .lane-input`); if (f) { f.value = keep.v; f.focus(); } }
    const a = weekActions(weekDoc());
    const fEl = $("focus"); if (document.activeElement !== fEl) fEl.value = (weekDoc() && weekDoc().focus) || "";
    const r = (weekDoc() && weekDoc().reflection) || {};
    const rEl = $("r-text"); if (document.activeElement !== rEl) rEl.value = r.text || "";
    const past = state.weeks.filter((w) => w.id !== WEEK && w.reflection && w.reflection.text).sort((x, y) => y.id.localeCompare(x.id));
    $("pastList").innerHTML = past.length ? past.map((w) => `
      <div class="prof"><h4>Week of ${esc(fmtDate(w.id))}${w.focus ? ` · ${esc(w.focus)}` : ""}</h4><div style="font-size:14px;white-space:pre-wrap">${esc(w.reflection.text)}</div></div>`).join("") : `<p class="saved">Past weeks will appear here.</p>`;
  }

  function addDays(iso, n) { const d = parse(iso); d.setDate(d.getDate() + n); return isoLocal(d); }
  function weekWorkoutTarget(wk) { const w = state.weeks.find((x) => x.id === (wk || WEEK)); return w && w.workoutTarget !== undefined ? w.workoutTarget : (state.settings.workoutTarget ?? 3); }
  function weekWorkouts(wk) { const end = addDays(wk, 7); return state.workouts.filter((w) => w.date >= wk && w.date < end); }
  const wtype = (k) => WTYPES.find((t) => t.k === k) || WTYPES[WTYPES.length - 1];
  const pace = (w) => (w.km > 0 && w.minutes ? (() => { const m = w.minutes / w.km; const mm = Math.floor(m), ss = Math.round((m - mm) * 60); return `${mm}:${pad(ss === 60 ? 0 : ss)} /km`; })() : "");
  function lastWeeks(n) { const out = []; for (let i = n - 1; i >= 0; i--) out.push(addDays(WEEK, -7 * i)); return out; }

  function renderFitness() {
    const wk = weekWorkouts(WEEK), target = weekWorkoutTarget();
    const goalKm = state.settings.goalKm || 10, startKm = state.settings.startKm || 5;
    $("fitGoalTitle").textContent = state.settings.fitnessGoal || `Run ${goalKm} km`;
    const runs = state.workouts.filter((w) => w.type === "run" && w.km > 0);
    const longest = Math.max(startKm, ...runs.map((w) => Number(w.km) || 0));
    $("goalBar").innerHTML = `<div class="row" style="gap:12px;align-items:center">
      <span class="mono" style="font-family:var(--font-mono);font-size:13px">${startKm} km</span>
      <span class="mixbar" style="flex:1 1 200px;height:16px"><i style="width:${Math.min(100, (longest / goalKm) * 100)}%;background:var(--accent)"></i></span>
      <span style="font-family:var(--font-mono);font-size:13px">${goalKm} km</span></div>
      <p class="saved" style="margin:6px 0 0">Longest run: ${longest.toFixed(1)} km${runs.length ? "" : " (starting point)"} · ${Math.max(0, goalKm - longest).toFixed(1)} km to go</p>`;
    const mins = wk.reduce((a, w) => a + (Number(w.minutes) || 0), 0);
    const km = wk.filter((w) => w.type === "run").reduce((a, w) => a + (Number(w.km) || 0), 0);
    $("fitWeek").innerHTML = `<div class="counter" style="flex-direction:row;align-items:center;gap:14px;flex-wrap:wrap;margin-top:6px">
      <span class="n">${target ? `${wk.length} / ${target}` : wk.length}</span>
      <span style="flex:1 1 200px"><strong>${target ? "Workouts this week" : "Resting this week"}</strong>${wk.length ? ` <span class="saved">· ${mins} min${km ? ` · ${km.toFixed(1)} km run` : ""}</span>` : ""}
        <span class="mixbar" style="margin-top:6px;display:flex"><i style="width:${target ? Math.min(100, (wk.length / target) * 100) : 0}%;background:var(--good)"></i></span></span>
      <span class="row"><label class="saved" for="workoutTarget">Weekly target</label><select class="field" id="workoutTarget">${[0, 1, 2, 3, 4, 5, 6, 7].map((n) => `<option ${n === target ? "selected" : ""}>${n}</option>`).join("")}</select></span>
    </div>`;
    const nEl = $("fitNote"); if (document.activeElement !== nEl) nEl.value = (weekDoc() && weekDoc().fitnessNote) || "";
    $("fitPlan").innerHTML = state.settings.fitnessPlan ? md(state.settings.fitnessPlan) : `<p class="saved">Write your plan here, or ask an AI to draft one for you.</p>`;
    const recent = state.workouts.slice().sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 15);
    $("fitList").innerHTML = recent.length ? recent.map((w) => { const t = wtype(w.type); return `<li data-wid="${esc(w.id)}">
      <span class="d">${esc(fmtShort(w.date))}</span><span class="sw" style="--c:var(${t.c})"></span>
      <span><strong>${t.l}</strong>${w.minutes ? ` · ${esc(w.minutes)} min` : ""}${w.km ? ` · ${esc(w.km)} km${w.minutes ? " · " + pace(w) : ""}` : ""}${w.notes ? `<br><span class="saved">${esc(w.notes)}</span>` : ""}</span>
      <button class="link-btn" data-act="del-workout">Remove</button></li>`; }).join("") : `<li class="saved" style="display:block">No sessions yet. Log one above.</li>`;
  }

  function renderFitCharts() {
    const weeks = lastWeeks(10);
    // Sessions per week, stacked by type, with the target as a dashed line
    const svg = $("fitBars");
    const W = Math.max(380, svg.parentElement.clientWidth || 380), H = 210, L = 30, B = H - 26, T = 10;
    const target = state.settings.workoutTarget ?? 3;
    const data = weeks.map((wk) => { const ws = weekWorkouts(wk); return { wk, parts: WTYPES.map((t) => ws.filter((w) => w.type === t.k).length) }; });
    const nice = Math.max(target + 1, ...data.map((d) => d.parts.reduce((a, b) => a + b, 0)));
    const bw = (W - L - 8) / weeks.length;
    const yOf = (v) => B - (v / nice) * (B - T);
    let s = "";
    for (let v = 0; v <= nice; v++) s += `<line class="axis" x1="${L}" x2="${W - 4}" y1="${yOf(v)}" y2="${yOf(v)}" stroke-dasharray="2 4"/><text class="lbl" x="${L - 6}" y="${yOf(v) + 4}" text-anchor="end">${v}</text>`;
    data.forEach((d, i) => {
      let y = B; const x = L + i * bw + bw * 0.18, w = bw * 0.64;
      d.parts.forEach((n, k) => { if (!n) return; const h = (n / nice) * (B - T); y -= h; s += `<rect x="${x}" y="${y}" width="${w}" height="${h - 1}" fill="${css(WTYPES[k].c)}" rx="2"><title>Week of ${esc(fmtShort(d.wk))}: ${WTYPES[k].l} × ${n}</title></rect>`; });
      if (i % 3 === 0 || d.wk === WEEK) s += `<text class="lbl" x="${x + w / 2}" y="${H - 8}" text-anchor="middle">${d.wk === WEEK ? "Now" : esc(fmtShort(d.wk))}</text>`;
    });
    if (target) s += `<line x1="${L}" x2="${W - 4}" y1="${yOf(target)}" y2="${yOf(target)}" stroke="${css("--good")}" stroke-width="2" stroke-dasharray="6 4"/><text class="lbl" x="${W - 6}" y="${yOf(target) - 5}" text-anchor="end">target ${target}</text>`;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.setAttribute("width", W); svg.setAttribute("height", H); svg.innerHTML = s;
    $("fitLegend2").innerHTML = WTYPES.filter((t) => state.workouts.some((w) => w.type === t.k)).map((t) => `<span style="--c:var(${t.c})">${t.l}</span>`).join("") || `<span class="saved" style="--c:transparent">Sessions appear once they're logged.</span>`;
    // Running km per week
    const rs = $("runBars");
    const km = weeks.map((wk) => weekWorkouts(wk).filter((w) => w.type === "run").reduce((a, w) => a + (Number(w.km) || 0), 0));
    const kmax = Math.max(5, ...km), knice = Math.ceil(kmax / 5) * 5;
    let r = "";
    for (let v = 0; v <= knice; v += knice / (knice > 10 ? 4 : knice / 5 || 1)) { const y = B - (v / knice) * (B - T); r += `<line class="axis" x1="${L}" x2="${W - 4}" y1="${y}" y2="${y}" stroke-dasharray="2 4"/><text class="lbl" x="${L - 6}" y="${y + 4}" text-anchor="end">${Math.round(v)}</text>`; }
    km.forEach((v, i) => { const x = L + i * bw + bw * 0.18, w = bw * 0.64, h = (v / knice) * (B - T);
      if (v) r += `<rect x="${x}" y="${B - h}" width="${w}" height="${h}" fill="${css("--accent")}" rx="2"><title>Week of ${esc(fmtShort(weeks[i]))}: ${v.toFixed(1)} km</title></rect>`;
      if (i % 3 === 0 || weeks[i] === WEEK) r += `<text class="lbl" x="${x + w / 2}" y="${H - 8}" text-anchor="middle">${weeks[i] === WEEK ? "Now" : esc(fmtShort(weeks[i]))}</text>`; });
    rs.setAttribute("viewBox", `0 0 ${W} ${H}`); rs.setAttribute("width", W); rs.setAttribute("height", H); rs.innerHTML = r;
    const runs = state.workouts.filter((w) => w.type === "run" && w.km > 0);
    const longest = runs.reduce((m, w) => Math.max(m, Number(w.km) || 0), 0);
    const best = runs.filter((w) => w.km >= 1).sort((a, b) => a.minutes / a.km - b.minutes / b.km)[0];
    $("runStats").innerHTML = runs.length ? [[runs.length, "runs logged"], [longest.toFixed(1) + " km", "longest run"], [best ? pace(best) : "—", "best pace (1 km+)"]]
      .map(([n, l]) => `<div class="win"><div class="n" style="font-size:20px">${esc(n)}</div><div class="l">${l}</div></div>`).join("") : `<p class="saved" style="margin:0">Runs with a distance show up here.</p>`;
  }

  function dueThisWeek() {
    const end = addDays(WEEK, 7);
    const tabOf = { deadline: "roles", role: "roles", person: "people", project: "projects", creative: "creative" };
    tabOf.target = "goals";
    const laneOf = { deadline: "career", role: "career", person: "career", project: "career", creative: "creative" };
    return upcoming().filter((x) => x.date < end).map((x) => ({ ...x, tab: tabOf[x.kind], lane: x.kind === "target" ? x.area : laneOf[x.kind] }));
  }
  function upcoming() {
    const items = [];
    for (const j of state.jobs) {
      if (INACTIVE.has(j.status)) continue;
      if (j.deadline && !hasApplied(j)) items.push({ date: j.deadline, kind: "deadline", text: `Deadline: ${j.company}`, sub: j.title, ref: j.id });
      if (j.nextDate) items.push({ date: j.nextDate, kind: "role", text: j.nextAction || "Next step", sub: j.company, ref: j.id });
    }
    for (const p of state.people) if (p.nextDate && p.status !== "no-reply") items.push({ date: p.nextDate, kind: "person", text: p.nextStep || `Follow up with ${p.name}`, sub: p.name });
    for (const p of state.projects) if (p.nextDate && p.status !== "done" && p.status !== "vault") items.push({ date: p.nextDate, kind: "project", text: p.nextStep || "Next step", sub: p.name });
    for (const t of state.targets) if (t.due && !t.done) items.push({ date: t.due, kind: "target", text: t.text, sub: (LANES.find((l) => l.k === t.area) || { l: "Target" }).l, area: t.area || "career", metric: t.metric, goal: t.goal });
    for (const p of state.creative) if (p.nextDate && p.status !== "done" && p.status !== "vault") items.push({ date: p.nextDate, kind: "creative", text: p.nextStep || "Next step", sub: p.name });
    return items.filter((x) => daysUntil(x.date) !== null && daysUntil(x.date) <= HORIZON).sort((a, b) => a.date.localeCompare(b.date));
  }
  const HORIZON = 124;
  const AREA_C = { body: "--good", career: "--accent", creative: "--warn", people: "--info" };
  const KIND = { target: { c: "--fg", l: "Target" }, deadline: { c: "--bad", l: "Deadline" }, role: { c: "--accent", l: "Role step" }, person: { c: "--info", l: "Follow-up" }, project: { c: "--good", l: "Lab project" }, creative: { c: "--warn", l: "Creative" } };

  function renderStrip() {
    const svg = $("strip");
    const items = upcoming().filter((i) => i.kind === "target");
    const W = Math.max(320, svg.parentElement.clientWidth || 560);
    const narrow = W < 640, LW = narrow ? 118 : 230, L = LW + 10, R = W - 16, TOP = 30, ROW = 34;
    const H = TOP + Math.max(1, items.length) * ROW + 10;
    const x = (d) => L + (Math.max(0, Math.min(HORIZON, d)) / HORIZON) * (R - L);
    let s = "";
    // month gridlines
    const t0 = parse(todayISO());
    for (let m = 0; m <= 5; m++) {
      const d = new Date(t0.getFullYear(), t0.getMonth() + m, 1, 12);
      const off = Math.round((d - t0) / 86400000);
      if (off < 6 || off > HORIZON) continue;
      s += `<line class="axis" x1="${x(off)}" x2="${x(off)}" y1="${TOP - 8}" y2="${H - 6}" stroke-dasharray="2 4"/><text class="lbl" x="${x(off)}" y="${TOP - 14}" text-anchor="middle">${d.toLocaleDateString(undefined, { month: "short" })}</text>`;
    }
    s += `<line x1="${x(0)}" x2="${x(0)}" y1="${TOP - 8}" y2="${H - 6}" stroke="${css("--muted")}" stroke-width="1.5"/><text class="lbl" x="${x(0)}" y="${TOP - 14}" text-anchor="middle">Today</text>`;
    if (!items.length) s += `<text class="lbl" x="${(L + R) / 2}" y="${TOP + 20}" text-anchor="middle">No dated targets yet.</text>`;
    items.forEach((it, i) => {
      const y = TOP + i * ROW + ROW / 2, d = daysUntil(it.date), cx = x(d), c = css(AREA_C[it.area] || "--fg");
      const label = it.text.length > (narrow ? 16 : 34) ? it.text.slice(0, narrow ? 15 : 33) + "…" : it.text;
      s += `<text x="${LW}" y="${y + 4}" text-anchor="end" style="font-size:12.5px;font-weight:600">${esc(label)}<title>${esc(it.text)}</title></text>`;
      s += `<line x1="${x(0)}" x2="${cx}" y1="${y}" y2="${y}" stroke="${c}" stroke-width="3" stroke-opacity="0.35" stroke-linecap="round"/>`;
      s += `<rect x="${cx - 6}" y="${y - 6}" width="12" height="12" transform="rotate(45 ${cx} ${y})" fill="${c}"><title>${esc(fmtDate(it.date))}: ${esc(it.text)}</title></rect>`;
      const flipL = cx > R - (narrow ? 48 : 60);
      const prog = progressOf(it);
      s += `<text class="lbl" x="${cx + (flipL ? -12 : 12)}" y="${y + 4}" text-anchor="${flipL ? "end" : "start"}">${esc(fmtShort(it.date))}${prog ? ` · ${esc(prog.text)}` : ""}</text>`;
      if (prog) {
        const px = x(0) + (cx - x(0)) * Math.min(1, prog.frac);
        s += `<line x1="${x(0)}" x2="${px}" y1="${y}" y2="${y}" stroke="${c}" stroke-width="5" stroke-linecap="round"><title>${esc(prog.text)}</title></line>`;
      }
    });
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.setAttribute("width", W); svg.setAttribute("height", H);
    svg.innerHTML = s;
    $("upnext").innerHTML = items.length ? items.map((it) => {
      const d = daysUntil(it.date);
      return `<li><span class="d${d < 0 ? " over" : ""}">${d < 0 ? "Overdue" : d === 0 ? "Today" : esc(fmtShort(it.date))}</span><span><span style="color:var(${it.kind === "target" ? (AREA_C[it.area] || "--fg") : KIND[it.kind].c})">${it.kind === "target" ? "◆" : "●"}</span> ${it.kind === "target" ? `<strong>${esc(it.text)}</strong>` : esc(it.text)} <span class="saved">· ${esc(it.sub)}</span></span></li>`;
    }).join("")
      : `<li class="saved">Nothing dated yet. Targets you add in Goals show up here.</li>`;
  }

  function progressOf(it) {
    if (!it.metric || !it.goal) return null;
    if (it.metric === "applications") { const n = state.jobs.filter(hasApplied).length; return { frac: n / it.goal, text: `${n} of ${it.goal}` }; }
    if (it.metric === "longestRun") { const k = Math.max(0, ...state.workouts.filter((w) => w.type === "run").map((w) => Number(w.km) || 0)); return { frac: k / it.goal, text: `${k ? k.toFixed(1) : 0} of ${it.goal} km` }; }
    return null;
  }

  function renderGoals() {
    const g = state.settings.goals || "";
    const COLORS = { health: "--good", job: "--accent", creative: "--warn" };
    if (/^### /m.test(g)) {
      const parts = g.split(/^### /m).filter((x) => x.trim());
      $("goals").innerHTML = `<div class="goalgroups">${parts.map((part) => {
        const [title, ...rest] = part.split("\n");
        const c = COLORS[title.trim().toLowerCase()] || "--info";
        return `<section class="goalgroup" style="--c:var(${c})"><h3>${esc(title.trim())}</h3><div class="md">${md(rest.join("\n"))}</div></section>`;
      }).join("")}</div>`;
    } else $("goals").innerHTML = g ? md(g) : `<p class="saved">Your big goals will appear here.</p>`;
    const rows = state.targets.slice().sort((a, b) => (a.done - b.done) || (a.due || "9999").localeCompare(b.due || "9999"));
    if (!$("targetList")) return;
    $("targetList").innerHTML = rows.length ? rows.map((t) => {
      const d = daysUntil(t.due);
      return `<li class="${t.done ? "done" : ""}" data-tid="${esc(t.id)}"><input type="checkbox" data-act="toggle-target" aria-label="Done: ${esc(t.text)}" ${t.done ? "checked" : ""}>
        <span class="tt">${esc(t.text)} <span class="tag">${esc((LANES.find((l) => l.k === t.area) || { l: "" }).l)}</span></span>
        <span class="saved ${!t.done && d !== null && d < 0 ? "" : ""}" style="${!t.done && d !== null && d < 0 ? "color:var(--bad)" : ""}">${t.due ? esc(fmtDate(t.due)) : "No date"}</span>
        <button class="link-btn" data-act="del-target">Remove</button></li>`;
    }).join("") : `<li class="saved" style="display:block;border:0">No targets yet. We'll set them together.</li>`;
  }

  /* ================= Roles ================= */
  function visibleJobs() {
    const q = state.q.trim().toLowerCase();
    const rows = state.jobs.filter((j) => {
      if (state.stage) { if (j.status !== state.stage) return false; }
      else if (INACTIVE.has(j.status)) return false;
      if (state.region !== "All" && (j.region || "Other") !== state.region) return false;
      if (q && ![j.title, j.company, j.notes, j.summary, j.location].join(" ").toLowerCase().includes(q)) return false;
      return true;
    });
    const by = {
      best: (a, b) => score(b) - score(a),
      deadline: (a, b) => (a.deadline || "9999").localeCompare(b.deadline || "9999"),
      newest: (a, b) => (b.added || "").localeCompare(a.added || ""),
      company: (a, b) => (a.company || "").localeCompare(b.company || ""),
    }[state.sort];
    return rows.sort(by);
  }

  function renderPipeline() {
    const count = (s) => state.jobs.filter((j) => j.status === s).length;
    $("pipeline").innerHTML = STAGES.map((s) => `<button class="stage" data-stage="${s.id}" aria-pressed="${state.stage === s.id}"><span class="n">${count(s.id)}</span><span class="l">${s.label}</span></button>`).join("");
    const active = state.jobs.filter((j) => !INACTIVE.has(j.status)).length;
    $("sideCounts").innerHTML = `<button data-stage="" aria-pressed="${state.stage === null}">All active (${active})</button>` +
      SIDE.map((s) => `<button data-stage="${s.id}" aria-pressed="${state.stage === s.id}">${s.label} (${count(s.id)})</button>`).join("");
    const order = ["New York", "London", "Remote", "Other"];
    const present = order.filter((r) => state.jobs.some((j) => (j.region || "Other") === r));
    $("regionChips").innerHTML = ["All", ...present].map((r) => `<button class="chip" data-region="${r}" aria-pressed="${state.region === r}">${r}</button>`).join("");
  }

  function ticks(j, field, cls) {
    let h = `<span class="ticks ${cls}" role="group" aria-label="${field}">`;
    for (let i = 1; i <= 5; i++) h += `<button class="tick${i <= (j[field] || 0) ? " on" : ""}" data-act="score" data-field="${field}" data-val="${i}" aria-label="Set ${field} to ${LEVEL[i]}" title="${LEVEL[i]}"></button>`;
    return h + "</span>";
  }
  const byLabel = (j, f) => (j[f + "By"] === "me" ? "you" : j[f === "qualified" ? "qConf" : "eConf"] ? "AI " + j[f === "qualified" ? "qConf" : "eConf"] : "AI");

  function mixHTML(j) {
    const m = j.mix;
    const has = m && MIX.some((x) => m[x.k]);
    const total = has ? MIX.reduce((s, x) => s + (Number(m[x.k]) || 0), 0) : 0;
    const bar = has ? `<div class="mixbar" role="img" aria-label="Estimated time split">${MIX.map((x) => (m[x.k] ? `<i style="width:${(m[x.k] / total) * 100}%;background:var(${x.c})" title="${x.label}: ${m[x.k]}%"></i>` : "")).join("")}</div>
      <div class="mixlegend">${MIX.map((x) => (m[x.k] ? `<span class="${m[x.k] / total > 0.5 ? "over" : ""}" style="--c:var(${x.c})">${x.label} ${Math.round((m[x.k] / total) * 100)}%</span>` : "")).join("")}</div>` : `<p class="saved" style="margin:0">No estimate yet.</p>`;
    const over = has && MIX.some((x) => (m[x.k] || 0) / total > 0.5);
    return `<div>
      <h4>Role mix · ${j.mixBy === "me" ? "my estimate" : "AI estimate"}</h4>
      ${bar}
      ${over ? `<p class="saved" style="margin:6px 0 0;color:var(--bad)">One activity is more than half the job.</p>` : ""}
      <details><summary class="saved" style="cursor:pointer;margin-top:6px">Adjust the split</summary>
        <div class="mixedit">${MIX.map((x) => `<label for="mix-${esc(j.id)}-${x.k}">${x.label}<input class="field" type="number" min="0" max="100" step="5" id="mix-${esc(j.id)}-${x.k}" data-mix="${x.k}" value="${(m && m[x.k]) || 0}"></label>`).join("")}</div>
        <div class="row" style="margin-top:6px"><button class="btn small" data-act="save-mix">Save split</button><span class="saved" data-mixmsg></span></div>
      </details>
    </div>`;
  }

  function jobCard(j) {
    const v = VISA[j.visa] || VISA.unknown;
    const dl = daysUntil(j.deadline);
    const ck = CHECK.find((c) => c.id === (j.check || "not-checked")) || CHECK[0];
    const dlTag = j.deadline ? `<span class="tag mono ${dl !== null && dl < 0 ? "bad" : dl !== null && dl <= 7 ? "warn" : ""}">Due ${esc(fmtShort(j.deadline))}${dl !== null && dl >= 0 ? ` · ${dl}d` : dl !== null ? " · past" : ""}</span>` : "";
    const ai = AI_CALL[j.aiCall];
    const opts = ALL_STATUS.map((s) => `<option value="${s.id}" ${s.id === j.status ? "selected" : ""}>${s.label}</option>`).join("");
    const list = (arr) => (arr || []).map((p) => `<li>${esc(p)}</li>`).join("") || "<li>None noted yet</li>";
    const people = state.people.filter((p) => p.jobId === j.id);
    const log = (j.log || []).slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return `
    <article class="job${INACTIVE.has(j.status) ? " dim" : ""}" data-id="${esc(j.id)}" id="job-${esc(j.id)}">
      <div class="job-head">
        <div style="min-width:0">
          <h3 class="job-title">${esc(j.title)}</h3>
          <div class="job-co">${esc(j.company)}</div>
          <div class="tags">
            <span class="tag loc">${esc(j.location || j.region || "Location unknown")}</span>
            ${j.visa === "likely" || j.visa === "restricted" ? `<span class="tag ${v.cls}">${v.text}</span>` : ""}
            ${ck.id === "open" || ck.id === "closed" ? `<span class="tag ${ck.cls}">${ck.label}</span>` : ""}
            ${j.salary ? `<span class="tag mono">${esc(j.salary)}</span>` : ""}
            ${dlTag}
            ${ai ? `<span class="tag ai">${ai.text}</span>` : ""}
            ${people.length ? `<span class="tag">${people.length} contact${people.length > 1 ? "s" : ""}</span>` : ""}
          </div>
          ${j.summary ? `<p class="verdict">${esc(j.summary)}</p>` : ""}
          ${j.nextAction ? `<p class="next">Next: ${esc(j.nextAction)}${j.nextDate ? ` <span class="saved">(${esc(fmtShort(j.nextDate))})</span>` : ""}</p>` : ""}
        </div>
        <div class="right">
          <label class="saved" for="st-${esc(j.id)}" style="display:flex;flex-direction:column;gap:2px;align-items:flex-end">My decision
            <select class="status" id="st-${esc(j.id)}" data-s="${esc(j.status)}" data-act="status">${opts}</select></label>
          <div class="meters">
            <span>Qualified</span><span>${ticks(j, "qualified", "qual")} <span class="who">${esc(byLabel(j, "qualified"))}</span></span>
            <span>Enjoy</span><span>${ticks(j, "enjoy", "enjoy")} <span class="who">${esc(byLabel(j, "enjoy"))}</span></span>
            <span>My interest</span><span>${ticks(j, "myInterest", "mine")} <span class="who">${j.myInterest ? "you" : "–"}</span></span>
          </div>
        </div>
      </div>
      <details class="more">
        <summary>Details, next steps and notes</summary>
        <div class="body">
          <div class="pc">
            <div><h4>Positives</h4><ul class="pros">${list(j.pros)}</ul></div>
            <div><h4>Negatives and gaps</h4><ul class="cons">${list(j.cons)}</ul></div>
          </div>
          ${mixHTML(j)}
          ${(j.outreach && j.outreach.length) ? `<div class="outreach"><h4>Who to reach out to</h4><ul>${list(j.outreach)}</ul></div>` : ""}
          <div>
            <h4>Next action</h4>
            <div class="inline-edit">
              <input class="field" data-f="nextAction" value="${esc(j.nextAction)}" aria-label="Next action" placeholder="e.g. Check the posting is open">
              <input class="field" type="date" data-f="nextDate" value="${esc(j.nextDate)}" aria-label="Next action date">
              <button class="btn" data-act="save-next">Save</button>
            </div>
          </div>
          <div class="pc">
            <div>
              <h4><label for="qs-${esc(j.id)}">Questions for the recruiter</label></h4>
              <textarea class="field" id="qs-${esc(j.id)}" data-f="questions" rows="3" placeholder="One per line">${esc((j.questions || []).join("\n"))}</textarea>
              <div class="row" style="margin-top:6px"><button class="btn small" data-act="save-questions">Save questions</button><span class="saved" data-qmsg></span></div>
            </div>
            <div>
              <h4>Posting check</h4>
              <div class="row">
                <select class="field" data-act="check" aria-label="Posting check">${CHECK.map((c) => `<option value="${c.id}" ${c.id === ck.id ? "selected" : ""}>${c.label}</option>`).join("")}</select>
                <span class="saved">${j.verified ? `Last checked ${esc(fmtDate(j.verified))}` : "Never checked"}</span>
              </div>
            </div>
          </div>
          <div>
            <h4>Activity</h4>
            ${log.length ? `<ul class="log">${log.map((e) => `<li><span class="d">${esc(fmtShort(e.date))}</span>${esc(e.text)}</li>`).join("")}</ul>` : `<p class="saved" style="margin:0 0 6px">No activity logged yet.</p>`}
            <div class="row" style="margin-top:6px"><input class="field" data-f="logText" placeholder="What happened? e.g. Messaged recruiter" aria-label="Log activity" style="flex:1 1 220px"><button class="btn small" data-act="add-log">Log it</button></div>
          </div>
          <dl class="facts">
            ${j.visaNote ? `<dt>Visa</dt><dd>${esc(j.visaNote)}</dd>` : ""}
            <dt>Found via</dt><dd>${esc(j.source || "Not recorded")}</dd>
            ${j.appliedOn ? `<dt>Applied</dt><dd>${esc(fmtDate(j.appliedOn))}</dd>` : ""}
            ${(j.gaps && j.gaps.length) ? `<dt>Gaps</dt><dd>${j.gaps.map(esc).join(" · ")}</dd>` : ""}
            ${people.length ? `<dt>Contacts</dt><dd>${people.map((p) => esc(p.name)).join(", ")}</dd>` : ""}
            <dt>Posting</dt><dd>${j.url ? `<a href="${esc(j.url)}" target="_blank" rel="noopener">Open original posting ↗</a>` : "No link saved"}</dd>
          </dl>
          <div>
            <h4><label for="notes-${esc(j.id)}">My notes</label></h4>
            <textarea class="field" id="notes-${esc(j.id)}" data-f="notes" rows="3">${esc(j.notes)}</textarea>
            <div class="row" style="margin-top:6px"><button class="btn small" data-act="save-notes">Save notes</button><span class="saved" data-nmsg></span></div>
          </div>
        </div>
      </details>
    </article>`;
  }

  function renderList() {
    if (state.mode === "loading") { $("list").innerHTML = `<div class="empty">Loading your roles…</div>`; return; }
    if (!state.jobs.length) { $("list").innerHTML = `<div class="empty">No roles yet. Use “Add a role” below.</div>`; return; }
    const rows = visibleJobs();
    if (!rows.length) { $("list").innerHTML = `<div class="empty">Nothing matches these filters.</div>`; return; }
    const open = new Set([...document.querySelectorAll(".job details.more[open]")].map((d) => d.closest(".job").dataset.id));
    $("list").innerHTML = rows.map(jobCard).join("");
    open.forEach((id) => { const el = document.querySelector(`.job[data-id="${CSS.escape(id)}"] details.more`); if (el) el.open = true; });
  }

  const STATUS_COLOR = (s) => (s === "queue" ? "--accent" : s === "pool" ? "--info" : APPLIED_SET.has(s) && s !== "rejected" && s !== "withdrawn" ? "--good" : "--muted");
  function renderFitMap() {
    const svg = $("fitmap");
    const W = Math.max(560, svg.parentElement.clientWidth || 560), H = 340, L = 44, R = W - 16, T = 16, B = H - 40;
    const sx = (v) => L + ((v - 0.5) / 5) * (R - L), sy = (v) => B - ((v - 0.5) / 5) * (B - T);
    const pts = state.jobs.filter((j) => j.qualified && j.enjoy && (state.fitAll || !INACTIVE.has(j.status)));
    let s = "";
    s += `<rect x="${sx(3.5)}" y="${T}" width="${R - sx(3.5)}" height="${sy(3.5) - T}" fill="${css("--good-soft")}" rx="6"/>`;
    s += `<text class="lbl" x="${R - 8}" y="${T + 16}" text-anchor="end">Apply now</text>`;
    s += `<text class="lbl" x="${L + 8}" y="${T + 16}">Stretch, but I'd love it</text>`;
    s += `<text class="lbl" x="${R - 8}" y="${B - 8}" text-anchor="end">Could do it, wouldn't love it</text>`;
    for (let i = 1; i <= 5; i++) {
      s += `<line class="axis" x1="${sx(i)}" x2="${sx(i)}" y1="${T}" y2="${B}" stroke-dasharray="2 4"/>`;
      s += `<line class="axis" x1="${L}" x2="${R}" y1="${sy(i)}" y2="${sy(i)}" stroke-dasharray="2 4"/>`;
      s += `<text class="lbl" x="${sx(i)}" y="${B + 16}" text-anchor="middle">${i === 1 ? "Low" : i === 3 ? "Med" : i === 5 ? "High" : ""}</text>`;
      s += `<text class="lbl" x="${L - 8}" y="${sy(i) + 4}" text-anchor="end">${i === 1 ? "Low" : i === 3 ? "Med" : i === 5 ? "High" : ""}</text>`;
    }
    s += `<text class="lbl" x="${(L + R) / 2}" y="${H - 4}" text-anchor="middle">Qualified →</text>`;
    s += `<text class="lbl" transform="translate(12 ${(T + B) / 2}) rotate(-90)" text-anchor="middle">Enjoy →</text>`;
    const groups = {};
    pts.forEach((j) => { const k = j.qualified + "," + j.enjoy; (groups[k] = groups[k] || []).push(j); });
    Object.values(groups).forEach((g) => g.forEach((j, i) => {
      const ang = (i / g.length) * Math.PI * 2, off = g.length > 1 ? 14 : 0;
      const cx = sx(j.qualified) + Math.cos(ang) * off, cy = sy(j.enjoy) + Math.sin(ang) * off;
      const r = 6 + (j.myInterest || 0) * 1.8;
      s += `<g class="dot" data-act="jump" data-id="${esc(j.id)}" style="cursor:pointer"><circle cx="${cx}" cy="${cy}" r="${r}" fill="${css(STATUS_COLOR(j.status))}" fill-opacity="0.78" stroke="${css("--surface")}" stroke-width="1.5"/><title>${esc(jobLabel(j))} · qualified ${LEVEL[j.qualified]}, enjoy ${LEVEL[j.enjoy]}${j.myInterest ? ", my interest " + LEVEL[j.myInterest] : ""}</title></g>`;
    }));
    if (!pts.length) s += `<text class="lbl" x="${(L + R) / 2}" y="${(T + B) / 2}" text-anchor="middle">Scored roles will appear here.</text>`;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.setAttribute("width", W); svg.setAttribute("height", H);
    svg.innerHTML = s;
    $("fitLegend").innerHTML = [["Pool", "--info"], ["Apply next", "--accent"], ["Applied or further", "--good"], ["Passed or closed", "--muted"]].map(([l, c]) => `<span style="--c:var(${c})">${l}</span>`).join("");
  }

  /* ================= Insights ================= */
  function renderStats() {
    const applied = state.jobs.filter(hasApplied);
    const interviews = state.jobs.filter((j) => j.interviewed || j.status === "interviewing" || j.status === "offer");
    const responded = applied.filter((j) => ["interviewing", "offer", "rejected"].includes(j.status) || j.interviewed).length;
    const rate = applied.length ? Math.round((responded / applied.length) * 100) + "%" : "—";
    $("stats").innerHTML = [
      [state.jobs.length, "Roles found"],
      [state.jobs.filter((j) => j.status === "queue").length, "In my apply-next queue"],
      [applied.length, "Applied"],
      [applied.length ? `${interviews.length} · ${rate}` : "0", applied.length ? "Interviews · response rate" : "Interviews"],
    ].map(([n, l]) => `<div class="stat"><div class="n">${esc(n)}</div><div class="l">${esc(l)}</div></div>`).join("");
  }

  function outcomeOf(j) {
    if (j.status === "offer") return "Offer";
    if (j.status === "interviewing") return "Interviewing";
    if (j.status === "rejected") return "Rejected";
    if (j.status === "withdrawn") return "Withdrew";
    const since = j.appliedOn ? -daysUntil(j.appliedOn) : null;
    return since !== null && since >= NO_REPLY_DAYS ? "No reply" : "Waiting";
  }
  const NODE_COLOR = { "Applied": "--good", "Apply next": "--accent", "Pool": "--info", "I passed": "--muted", "Posting closed": "--muted", "Interview": "--good", "Offer": "--good", "Interviewing": "--good", "Waiting": "--warn", "No reply": "--muted", "Rejected": "--bad", "Withdrew": "--muted" };

  function renderSankey() {
    const svg = $("sankey"), note = $("funnelNote");
    if (!state.jobs.length) { svg.innerHTML = ""; note.textContent = "The flow appears once there are roles here."; return; }
    if (!window.d3 || !d3.sankey) { svg.innerHTML = ""; note.textContent = "The chart library didn't load. Reload the page to try again."; return; }
    const links = new Map();
    const add = (a, b) => { const k = a + "→" + b; links.set(k, (links.get(k) || 0) + 1); };
    for (const j of state.jobs) {
      const src = "Found: " + (j.source || "Not recorded");
      if (!hasApplied(j)) { add(src, { pool: "Pool", queue: "Apply next", passed: "I passed", closed: "Posting closed" }[j.status] || "Pool"); continue; }
      add(src, "Applied");
      const out = outcomeOf(j);
      if (j.interviewed || j.status === "interviewing" || j.status === "offer") { add("Applied", "Interview"); add("Interview", out); }
      else add("Applied", out);
    }
    const names = new Set(); links.forEach((_, k) => k.split("→").forEach((n) => names.add(n)));
    const nodes = [...names].map((name) => ({ name })), idx = new Map(nodes.map((n, i) => [n.name, i]));
    const g = { nodes, links: [...links].map(([k, value]) => { const [a, b] = k.split("→"); return { source: idx.get(a), target: idx.get(b), value }; }) };
    const width = Math.max(640, svg.parentElement.clientWidth || 640), height = Math.max(280, Math.min(520, 110 + nodes.length * 24));
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`); svg.setAttribute("height", height);
    const { nodes: N, links: Lk } = d3.sankey().nodeId((d) => d.index).nodeWidth(12).nodePadding(16).nodeAlign(d3.sankeyLeft).extent([[8, 12], [width - 8, height - 12]])(g);
    const colorOf = (n) => css(NODE_COLOR[n.name] || "--fg");
    const root = d3.select(svg); root.selectAll("*").remove();
    root.append("g").attr("fill", "none").selectAll("path").data(Lk).join("path").attr("d", d3.sankeyLinkHorizontal())
      .attr("stroke", (d) => colorOf(d.target)).attr("stroke-opacity", 0.32).attr("stroke-width", (d) => Math.max(1.5, d.width))
      .append("title").text((d) => `${d.source.name.replace(/^Found: /, "")} → ${d.target.name}: ${d.value}`);
    root.append("g").selectAll("rect").data(N).join("rect").attr("x", (d) => d.x0).attr("y", (d) => d.y0)
      .attr("width", (d) => d.x1 - d.x0).attr("height", (d) => Math.max(2, d.y1 - d.y0)).attr("rx", 2).attr("fill", colorOf);
    const label = root.append("g").selectAll("text").data(N).join("text")
      .attr("x", (d) => (d.x0 < width / 2 ? d.x1 + 8 : d.x0 - 8)).attr("y", (d) => (d.y0 + d.y1) / 2).attr("dy", "0.35em")
      .attr("text-anchor", (d) => (d.x0 < width / 2 ? "start" : "end"));
    label.append("tspan").text((d) => d.name.replace(/^Found: /, ""));
    label.append("tspan").attr("class", "count").attr("dx", 6).text((d) => d.value);
    note.textContent = state.jobs.some(hasApplied)
      ? `Applications with no change for ${NO_REPLY_DAYS} days count as “No reply”.`
      : "No applications yet, so the flow stops at my decisions. It extends as I apply.";
  }

  function renderGaps() {
    const counts = {};
    state.jobs.filter((j) => !INACTIVE.has(j.status)).forEach((j) => (j.gaps || []).forEach((g) => { counts[g] = (counts[g] || 0) + 1; }));
    const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const max = rows.length ? rows[0][1] : 1;
    $("gaps").innerHTML = rows.length ? rows.map(([g, n]) => `<div class="hbar"><span>${esc(g)}</span><span class="track"><span class="fill" style="display:block;width:${(n / max) * 100}%"></span></span><span class="v">${n}</span></div>`).join("")
      : `<p class="saved" style="margin:0">Gaps appear once roles have them noted.</p>`;
  }

  function warmth(j) {
    const ps = state.people.filter((p) => p.jobId === j.id || (p.company && j.company && p.company.toLowerCase() === j.company.toLowerCase()));
    if (ps.some((p) => ["replied", "met", "referred"].includes(p.status))) return "warm";
    if (ps.some((p) => p.status === "reached-out")) return "contacted";
    if (ps.length) return "named";
    return "cold";
  }
  function renderCoverage() {
    const roles = state.jobs.filter((j) => !INACTIVE.has(j.status)).sort((a, b) => score(b) - score(a));
    const W = { warm: { l: "Warm (replied or met)", c: "--good" }, contacted: { l: "Reached out", c: "--warn" }, named: { l: "Someone in mind", c: "--info" }, cold: { l: "Cold", c: "--muted" } };
    const counts = { warm: 0, contacted: 0, named: 0, cold: 0 };
    roles.forEach((j) => counts[warmth(j)]++);
    const max = Math.max(1, ...Object.values(counts));
    $("covBars").innerHTML = Object.entries(W).map(([k, v]) => `<div class="hbar"><span>${v.l}</span><span class="track"><span class="fill" style="display:block;width:${(counts[k] / max) * 100}%;background:var(${v.c})"></span></span><span class="v">${counts[k]}</span></div>`).join("");
    const top = roles.filter((j) => j.status === "queue" || j.aiCall === "apply-next").slice(0, 6);
    $("covList").innerHTML = top.length ? `<li class="saved" style="border:0">Top roles</li>` + top.map((j) => `<li><span>${esc(j.company)} <span class="saved">· ${esc(j.title)}</span></span><span class="tag ${{ warm: "good", contacted: "warn", named: "info", cold: "" }[warmth(j)]}">${W[warmth(j)].l}</span></li>`).join("") : "";
  }

  /* ================= People ================= */
  function renderPeople() {
    const counts = Object.fromEntries(P_STATUS.map((s) => [s.id, state.people.filter((p) => p.status === s.id).length]));
    const due = state.people.filter(isDue).length;
    const chips = [["All", `All (${state.people.length})`], ["due", `Follow-up due (${due})`], ...P_STATUS.filter((s) => counts[s.id]).map((s) => [s.id, `${s.label} (${counts[s.id]})`])];
    $("peopleChips").innerHTML = chips.map(([id, l]) => `<button class="chip" data-pstatus="${id}" aria-pressed="${state.pStatus === id}">${l}</button>`).join("");
    const b = $("dueBadge"); b.hidden = !due; b.textContent = due ? `${due} due` : "";
    if (!$("p-status").options.length) $("p-status").innerHTML = P_STATUS.map((s) => `<option value="${s.id}">${s.label}</option>`).join("");
    const keep = $("p-job").value;
    const active = state.jobs.filter((j) => !INACTIVE.has(j.status)).sort((a, b) => jobLabel(a).localeCompare(jobLabel(b)));
    $("p-job").innerHTML = `<option value="">None</option>` + active.map((j) => `<option value="${esc(j.id)}">${esc(jobLabel(j))}</option>`).join("");
    $("p-job").value = keep || "";
    if (state.mode === "loading") { $("peopleList").innerHTML = `<div class="empty">Loading your contacts…</div>`; return; }
    if (!state.people.length) { $("peopleList").innerHTML = `<div class="empty">No one here yet. Add the people you reach out to on LinkedIn or by email, and when to follow up.<br>Roles in the apply-next queue have “Who to reach out to” suggestions in their details.</div>`; return; }
    const q = state.pq.trim().toLowerCase();
    const rows = state.people.filter((p) => {
      if (state.pStatus === "due" && !isDue(p)) return false;
      if (state.pStatus !== "All" && state.pStatus !== "due" && p.status !== state.pStatus) return false;
      if (q && ![p.name, p.company, p.role, p.notes, p.nextStep].join(" ").toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => (isDue(b) - isDue(a)) || (a.nextDate || "9999").localeCompare(b.nextDate || "9999"));
    $("peopleList").innerHTML = rows.length ? rows.map((p) => {
      const job = state.jobs.find((j) => j.id === p.jobId), due = isDue(p);
      return `<article class="person" data-pid="${esc(p.id)}">
        <div style="min-width:0">
          <div class="who-name">${esc(p.name)}</div>
          <div class="what">${esc([p.role, p.company].filter(Boolean).join(" · "))}${p.channel ? ` · via ${esc(p.channel)}` : ""}</div>
          ${job ? `<div class="tags" style="margin-top:6px"><span class="tag">${esc(jobLabel(job))}</span></div>` : ""}
          ${p.nextStep || p.nextDate ? `<div class="next${due ? " due" : ""}">${due ? "Follow-up due: " : "Next: "}${esc(p.nextStep || "Follow up")}${p.nextDate ? ` (${esc(fmtShort(p.nextDate))})` : ""}</div>` : ""}
          ${p.notes ? `<div class="pnotes">${esc(p.notes)}</div>` : ""}
        </div>
        <div class="right">
          <select class="status" data-s="${esc(p.status)}" data-act="pstatus" aria-label="Status for ${esc(p.name)}">${P_STATUS.map((s) => `<option value="${s.id}" ${s.id === p.status ? "selected" : ""}>${s.label}</option>`).join("")}</select>
          <span class="saved">${p.lastContact ? `Last contact ${esc(fmtShort(p.lastContact))}` : "Not contacted yet"}</span>
        </div>
      </article>`;
    }).join("") : `<div class="empty">Nothing matches these filters.</div>`;
  }

  /* ================= Projects ================= */
  const LVL = { built: { l: "Built", c: "--good" }, growing: { l: "Growing", c: "--accent" }, next: { l: "Next to learn", c: "--info" } };
  function renderSkillMap() {
    const done = state.projects.filter((p) => p.status === "done").length;
    const lv = (k) => state.skills.filter((x) => x.level === k).length;
    $("wins").innerHTML = [[done, "projects finished"], [lv("built"), "skills built"], [lv("growing"), "growing now"], [lv("next"), "next to learn"]]
      .map(([n, l]) => `<div class="win"><div class="n">${n}</div><div class="l">${l}</div></div>`).join("");
    const ordP = { done: 0, small: 1, active: 2, vault: 3 };
    const cols = state.projects.filter((p) => (p.skills || []).length).sort((a, b) => (ordP[a.status] ?? 4) - (ordP[b.status] ?? 4) || (a.order || 99) - (b.order || 99));
    if (!state.skills.length || !cols.length) { $("skillmap").innerHTML = `<p class="saved">Skills appear once projects list them.</p>`; return; }
    let h = `<table class="skillmap"><thead><tr><th>Skill</th>${cols.map((p) => `<th class="${p.status === "vault" ? "" : "done"}" title="${esc(p.name)}">${esc(p.short || p.name)}${p.status === "vault" ? "<br><span class='saved'>idea</span>" : p.status === "active" ? "<br><span class='saved'>active</span>" : ""}</th>`).join("")}</tr></thead><tbody>`;
    for (const k of ["built", "growing", "next"]) {
      const rows = state.skills.filter((x) => x.level === k).sort((a, b) => (a.order || 99) - (b.order || 99));
      if (!rows.length) continue;
      h += `<tr class="grp"><td colspan="${cols.length + 1}">${LVL[k].l}</td></tr>`;
      h += rows.map((sk) => `<tr><td><span class="lvl" style="--c:var(${LVL[k].c})"></span>${esc(sk.name)}</td>${cols.map((p) => (p.skills || []).includes(sk.name)
        ? `<td><span class="dot ${p.status === "vault" ? "plan" : "on"}" style="--c:var(${LVL[k].c})" title="${esc(sk.name)} · ${esc(p.name)}"></span></td>` : "<td></td>").join("")}</tr>`).join("");
    }
    $("skillmap").innerHTML = h + "</tbody></table>";
  }

  function renderProjects() {
    renderSkillMap();
    renderProjectList("projectList", "projects", state.projects, "j-status");
    renderProjectList("creativeList", "creative", state.creative, "c-status");
  }
  function renderProjectList(listId, coll, items, selId) {
    if (!$(selId).options.length) $(selId).innerHTML = PROJ_STATUS.map((s) => `<option value="${s.id}">${s.label}</option>`).join("");
    if (state.mode === "loading") { $(listId).innerHTML = `<div class="empty">Loading…</div>`; $(listId + "-bottom").innerHTML = ""; return; }
    if (!items.length) { $(listId).innerHTML = `<div class="empty">Nothing here yet. Add one below.</div>`; $(listId + "-bottom").innerHTML = ""; return; }
    const groups = ["active", "small", "vault", "done"].map((b) => [b, items.filter((p) => (p.status || "vault") === b).sort((x, y) => (x.order || 99) - (y.order || 99))]).filter(([, r]) => r.length);
    const card = (p) => `
      <article class="project${p.status === "vault" ? " dim" : ""}" data-jid="${esc(p.id)}" data-coll="${coll}">
        <div class="top">
          <div style="min-width:0">
            <div class="pname">${esc(p.name)}</div>
            ${p.summary ? `<div class="psum">${esc(p.summary)}</div>` : ""}
            ${(p.links && p.links.length) ? `<div class="tags" style="margin-top:8px">${p.links.map((l) => `<a class="tag" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join("")}</div>` : ""}
          </div>
          <select class="status" data-s="${esc(p.status)}" data-act="jstatus" aria-label="Stage for ${esc(p.name)}">${PROJ_STATUS.map((s) => `<option value="${s.id}" ${s.id === p.status ? "selected" : ""}>${s.label}</option>`).join("")}</select>
        </div>
        ${p.linkedin ? `<div class="outreach"><h4>LinkedIn angle</h4><div style="font-size:14px">${esc(p.linkedin)}</div></div>` : ""}
        <div>
          <h4>Next step</h4>
          <div class="inline-edit">
            <input class="field" data-f="nextStep" value="${esc(p.nextStep)}" aria-label="Next step for ${esc(p.name)}">
            <input class="field" type="date" data-f="nextDate" value="${esc(p.nextDate)}" aria-label="Next step date">
            <button class="btn" data-act="save-pnext">Save</button>
          </div>
        </div>
      </article>`;
    const nActive = items.filter((p) => p.status === "active").length;
    const nudge = nActive > 2 ? `<div class="banner" style="color:var(--warn)">${nActive} projects are active. Two is plenty: pick the one you'd most like to finish and move another to the idea vault.</div>` : "";
    const block = ([b, r]) => {
      const lab = PROJ_STATUS.find((s) => s.id === b).label;
      const body = r.map(card).join("");
      return b === "vault"
        ? `<details class="add"><summary>${lab} (${r.length}) <span class="saved">· ${BUCKET_NOTE[b]}</span></summary><div class="list" style="padding:0 12px 12px">${body}</div></details>`
        : `<div class="row between" style="margin-top:4px"><h2>${lab}</h2><span class="saved">${BUCKET_NOTE[b]}</span></div>${body}`;
    };
    const top = groups.filter(([b]) => b === "active" || b === "small"), bottom = groups.filter(([b]) => b === "vault" || b === "done");
    $(listId).innerHTML = nudge + (top.length ? top.map(block).join("") : `<p class="saved" style="margin:0">Nothing active right now.</p>`);
    $(listId + "-bottom").innerHTML = bottom.map(block).join("");
  }

  /* ================= Profile ================= */
  function renderProfile() {
    if (state.mode === "loading") { $("profileList").innerHTML = `<div class="empty">Loading profile…</div>`; return; }
    if (!state.profile.length) { $("profileList").innerHTML = `<div class="empty">The profile is empty. Add a section to start.</div>`; $("toc").innerHTML = ""; return; }
    const rows = state.profile.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
    $("toc").innerHTML = rows.map((s) => `<a class="chip" href="#profile" data-act="toc" data-sid="${esc(s.id)}">${esc(s.title)}</a>`).join("");
    $("profileList").innerHTML = rows.map((s) => state.editing === s.id ? `
      <section class="prof" data-sid="${esc(s.id)}" id="sec-${esc(s.id)}">
        <div class="row between"><h2>${esc(s.title)}</h2></div>
        <textarea class="field" data-f="body" rows="14" style="margin-top:10px;font-family:var(--font-mono);font-size:13px" aria-label="Edit ${esc(s.title)}">${esc(s.body)}</textarea>
        <p class="saved" style="margin:6px 0">Plain text. Use “- ” for bullets, **bold**, and | pipes | for tables.</p>
        <div class="row"><button class="btn primary" data-act="save-section">Save</button><button class="btn" data-act="cancel-section">Cancel</button></div>
      </section>` : `
      <section class="prof" data-sid="${esc(s.id)}" id="sec-${esc(s.id)}">
        <div class="row between" style="margin-bottom:10px"><h2>${esc(s.title)}</h2><button class="btn small" data-act="edit-section">Edit</button></div>
        <div class="md">${md(s.body)}</div>
        ${s.updated ? `<p class="saved" style="margin:10px 0 0">Updated ${esc(fmtDate(s.updated))}</p>` : ""}
      </section>`).join("");
  }

  /* ================= Render orchestration ================= */
  /* ================= Roadmap ================= */
  const RM_LANE = { body: "Health", career: "Career", people: "Social", creative: "Creative", other: "Other" };
  const roadmap = () => state.settings.roadmap || null;
  function rmItem(it, wi, edit) {
    return `<li class="${it.done ? "done" : ""}"><label><input type="checkbox" data-act="toggle-rm" data-w="${wi}" data-id="${esc(it.id)}" ${it.done ? "checked" : ""}><span><i class="rm-dot" style="--c:var(${AREA_C[it.lane] || "--muted"})" title="${esc(RM_LANE[it.lane] || "")}"></i>${esc(it.text)}</span></label>${edit ? `<button class="link-btn rm-x" data-act="del-rm" data-w="${wi}" data-id="${esc(it.id)}" aria-label="Remove: ${esc(it.text)}">×</button>` : ""}</li>`;
  }
  async function saveRoadmap(rm) {
    state.settings.roadmap = rm;
    if (live()) { try { await state.db.collection("settings").doc("main").update({ roadmap: rm }); } catch (err) { showBanner("That change didn't save."); } }
  }
  function renderRoadmap() {
    const rm = roadmap();
    if (!rm || !Array.isArray(rm.weeks) || !rm.weeks.length) {
      $("rmTitle").textContent = (rm && rm.title) || "Roadmap"; $("rmNote").innerHTML = "";
      $("rmList").innerHTML = `<li class="saved">No roadmap yet. Add a few weeks below: one or two things each, no more.</li>`;
      $("rmNowCard").hidden = true; return;
    }
    $("rmTitle").textContent = rm.title || "Roadmap";
    $("rmNote").innerHTML = rm.note ? md(rm.note) : "";
    const cur = rm.weeks.findIndex((w) => w.start === WEEK);
    $("rmList").innerHTML = rm.weeks.map((w, wi) => {
      const items = w.items || [], done = items.filter((i) => i.done).length;
      const cls = wi === cur ? "now" : w.start < WEEK ? "past" : "";
      return `<li class="rm-week ${cls}"><div class="rm-when"><span>${esc(w.label || fmtShort(w.start))}</span>${wi === cur ? "<b>This week</b>" : items.length ? `<em>${done}/${items.length}</em>` : ""}</div><ul class="checklist">${items.map((it) => rmItem(it, wi, true)).join("")}</ul></li>`;
    }).join("");
    $("rmNowCard").hidden = cur < 0;
    if (cur < 0) return;
    $("rmNowTitle").textContent = `On the ${rm.short || "roadmap"} this week`;
    $("rmNowList").innerHTML = (rm.weeks[cur].items || []).map((it) => rmItem(it, cur)).join("");
  }
  function renderMeta() {
    $("meta").textContent = state.jobs.length ? `${state.jobs.filter((j) => !INACTIVE.has(j.status)).length} active roles · ${state.people.length} contacts · ${state.projects.length} projects` : "";
  }
  function renderCharts() {
    if (state.mode === "loading") return;
    if (state.tab === "goals") renderStrip();
    if (state.tab === "fitness") renderFitCharts();
    if (state.tab === "insights") {
      const enough = state.jobs.filter(hasApplied).length >= 10;
      $("sankeyCard").hidden = !enough; $("covCard").hidden = !enough;
      $("gapsRow").style.gridTemplateColumns = enough ? "" : "minmax(0, 1fr)";
      renderFitMap(); renderStats(); renderSankey(); renderGaps(); renderCoverage(); }
  }
  const typing = () => document.activeElement && document.activeElement.matches("textarea, input:not([type=checkbox])");
  function render(force) {
    if (!force && typing()) { renderMeta(); return; }
    renderWeek(); renderGoals(); renderRoadmap(); renderFitness(); renderPipeline(); renderList(); renderPeople(); renderProjects(); renderProfile(); renderMeta(); renderCharts();
  }

  /* ================= Events ================= */
  document.addEventListener("click", async (e) => {
    const t = e.target.closest("[data-act], [data-stage], [data-region], [data-pstatus]");
    if (!t) return;
    if (t.dataset.stage !== undefined) { const s = t.dataset.stage || null; state.stage = state.stage === s && s ? null : s; render(true); return; }
    if (t.dataset.region) { state.region = t.dataset.region; render(true); return; }
    if (t.dataset.pstatus) { state.pStatus = t.dataset.pstatus; renderPeople(); return; }
    const act = t.dataset.act;
    const job = t.closest(".job"), jid = job && job.dataset.id;
    const field = (name) => job.querySelector(`[data-f="${name}"]`);

    if (act === "jump") {
      const id = t.dataset.id, j = state.jobs.find((x) => x.id === id);
      if (j && INACTIVE.has(j.status)) state.stage = j.status; else state.stage = null;
      state.region = "All"; state.q = ""; $("q").value = "";
      if (location.hash !== "#roles") location.hash = "roles";
      setTab("roles"); render(true);
      const el = document.getElementById("job-" + id);
      if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1600); }
      return;
    }
    if (act === "score") {
      const f = t.dataset.field, v = Number(t.dataset.val);
      const j = state.jobs.find((x) => x.id === jid);
      const patch = { [f]: j && j[f] === v && f === "myInterest" ? 0 : v };
      if (f === "qualified") patch.qualifiedBy = "me";
      if (f === "enjoy") patch.enjoyBy = "me";
      await writeDoc("jobs", jid, patch); render(true); return;
    }
    if (act === "save-next") { await writeDoc("jobs", jid, { nextAction: field("nextAction").value.trim(), nextDate: field("nextDate").value }); render(true); return; }
    if (act === "save-questions") {
      await writeDoc("jobs", jid, { questions: field("questions").value.split("\n").map((s) => s.trim()).filter(Boolean) });
      job.querySelector("[data-qmsg]").textContent = "Saved"; return;
    }
    if (act === "save-notes") { await writeDoc("jobs", jid, { notes: field("notes").value }); job.querySelector("[data-nmsg]").textContent = live() ? "Saved" : "Saved for this visit"; return; }
    if (act === "add-log") {
      const txt = field("logText").value.trim(); if (!txt) return;
      const j = state.jobs.find((x) => x.id === jid);
      await writeDoc("jobs", jid, { log: [...((j && j.log) || []), { date: todayISO(), text: txt }] }); render(true); return;
    }
    if (act === "save-mix") {
      const mix = {}; job.querySelectorAll("[data-mix]").forEach((i) => { mix[i.dataset.mix] = Math.max(0, Number(i.value) || 0); });
      await writeDoc("jobs", jid, { mix, mixBy: "me" }); render(true); return;
    }
    if (act === "toggle-item") {
      const items = weekItems().map((it) => (it.id === t.dataset.id ? { ...it, done: t.checked } : it));
      await saveWeek({ items }); render(true); return;
    }
    if (act === "count") {
      const a = weekActions(weekDoc()); a[t.dataset.k] = Math.max(0, a[t.dataset.k] + Number(t.dataset.d));
      await saveWeek({ actions: a }); render(true); return;
    }
    if (act === "lstage") {
      const n = Number(t.dataset.n);
      state.settings.linkedinStage = n;
      if (live()) { try { await state.db.doc("settings/main").set({ ...state.settings, linkedinStage: n }); } catch (err) { showBanner("That change didn't save."); } }
      const w = weekDoc();
      if (w && w.items) await saveWeek({ items: w.items.map((it) => (it.id === "linkedin" && !it.done ? { ...it, text: LSTAGES[n - 1].goal } : it)) });
      render(true); return;
    }
    if (act === "save-fitnote") { await saveWeek({ fitnessNote: $("fitNote").value.trim() }); $("fitNoteMsg").textContent = live() ? "Saved." : "Saved for this visit"; render(true); return; }
    if (act === "del-workout") {
      const id = t.closest("[data-wid]").dataset.wid;
      state.workouts = state.workouts.filter((w) => w.id !== id);
      if (live()) { try { await state.db.collection("workouts").doc(id).delete(); } catch (err) { showBanner("That change didn't save."); } }
      render(true); return;
    }
    if (act === "toggle-target") { const id = t.closest("[data-tid]").dataset.tid; await writeDoc("targets", id, { done: t.checked }); render(true); return; }
    if (act === "del-target") {
      const id = t.closest("[data-tid]").dataset.tid; state.targets = state.targets.filter((x) => x.id !== id);
      if (live()) { try { await state.db.collection("targets").doc(id).delete(); } catch (err) { showBanner("That change didn't save."); } }
      render(true); return;
    }
    if (act === "toggle-rm") {
      const rm = roadmap(); if (!rm) return;
      const wi = Number(t.dataset.w);
      const weeks = rm.weeks.map((w, i) => (i !== wi ? w : { ...w, items: (w.items || []).map((it) => (it.id === t.dataset.id ? { ...it, done: t.checked } : it)) }));
      await saveRoadmap({ ...rm, weeks }); render(true); return;
    }
    if (act === "del-rm") {
      const rm = roadmap(); if (!rm) return;
      const wi = Number(t.dataset.w);
      const weeks = rm.weeks.map((w, i) => (i !== wi ? w : { ...w, items: (w.items || []).filter((it) => it.id !== t.dataset.id) })).filter((w) => (w.items || []).length);
      await saveRoadmap({ ...rm, weeks }); render(true); return;
    }
    if (act === "save-sched") { await saveSchedule(); return; }
    if (act === "save-focus") { await saveWeek({ focus: $("focus").value.trim() }); render(true); return; }
    if (act === "save-reflection") {
      const reflection = { text: $("r-text").value.trim() };
      await saveWeek({ reflection }); $("reflMsg").textContent = live() ? "Saved" : "Saved for this visit"; render(true); return;
    }
    if (act === "save-pnext") {
      const card = t.closest(".project");
      await writeDoc(card.dataset.coll || "projects", card.dataset.jid, { nextStep: card.querySelector('[data-f="nextStep"]').value.trim(), nextDate: card.querySelector('[data-f="nextDate"]').value });
      render(true); return;
    }
    if (act === "edit-section") { state.editing = t.closest(".prof").dataset.sid; renderProfile(); const ta = document.querySelector(".prof textarea"); if (ta) ta.focus(); return; }
    if (act === "cancel-section") { state.editing = null; renderProfile(); return; }
    if (act === "save-section") {
      const sec = t.closest(".prof"); const body = sec.querySelector('[data-f="body"]').value;
      state.editing = null;
      await writeDoc("profile", sec.dataset.sid, { body, updated: todayISO(), editedBy: "me" }); render(true); return;
    }
    if (act === "toc") { e.preventDefault(); const el = $("sec-" + t.dataset.sid); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    if (act === "export-json" || act === "export-csv") { await exportData(act === "export-json" ? "json" : "csv"); return; }
  });

  document.addEventListener("change", async (e) => {
    const t = e.target;
    if (t.matches('[data-act="status"]')) {
      const id = t.closest(".job").dataset.id, j = state.jobs.find((x) => x.id === id);
      const patch = { status: t.value };
      if (["applied", "interviewing", "offer"].includes(t.value) && j && !j.appliedOn) patch.appliedOn = todayISO();
      if (["interviewing", "offer"].includes(t.value)) patch.interviewed = true;
      const label = (ALL_STATUS.find((s) => s.id === t.value) || {}).label;
      patch.log = [...((j && j.log) || []), { date: todayISO(), text: `Status: ${label}` }];
      await writeDoc("jobs", id, patch); render(true); return;
    }
    if (t.matches('[data-act="check"]')) {
      const id = t.closest(".job").dataset.id;
      const patch = { check: t.value }; if (t.value === "open" || t.value === "closed" || t.value === "unverified") patch.verified = todayISO();
      await writeDoc("jobs", id, patch); render(true); return;
    }
    if (t.matches('[data-act="pstatus"]')) {
      const id = t.closest(".person").dataset.pid;
      const patch = { status: t.value }; if (["reached-out", "replied", "met", "referred"].includes(t.value)) patch.lastContact = todayISO();
      await writeDoc("contacts", id, patch); render(true); return;
    }
    if (t.matches('[data-act="jstatus"]')) { const c = t.closest(".project"); await writeDoc(c.dataset.coll || "projects", c.dataset.jid, { status: t.value }); render(true); return; }
    if (t.id === "workoutTarget") { await saveWeek({ workoutTarget: Number(t.value) }); render(true); return; }
    if (t.id === "applyTarget") { await saveWeek({ applyTarget: Number(t.value) }); render(true); return; }
    if (t.id === "fitAll") { state.fitAll = t.checked; renderFitMap(); }
  });
  $("q").addEventListener("input", (e) => { state.q = e.target.value; renderList(); });
  $("sort").addEventListener("change", (e) => { state.sort = e.target.value; renderList(); });
  $("pq").addEventListener("input", (e) => { state.pq = e.target.value; renderPeople(); });
  document.addEventListener("focusout", () => setTimeout(() => { if (!typing() && state.pendingRender) { state.pendingRender = false; render(true); } }, 0));

  async function addTo(coll, arr, obj, msgEl, okText) {
    if (live()) {
      try { await state.db.collection(coll).add(obj); msgEl.textContent = okText; return true; }
      catch (err) { msgEl.textContent = err && err.code === "quota_exceeded" ? "Storage is full. Remove a few old items first." : "That didn't save. Try again in a moment."; return false; }
    }
    arr.push({ ...obj, id: "local-" + Date.now() }); msgEl.textContent = "Added for this visit (example data isn't saved)."; render(true); return true;
  }
  // Type straight into a lane: the empty checkbox line at the bottom of each one
  document.addEventListener("submit", async (e) => {
    const f = e.target.closest && e.target.closest(".lane-add"); if (!f) return;
    e.preventDefault(); const inp = f.querySelector(".lane-input"), txt = inp.value.trim(); if (!txt) return;
    inp.value = "";
    await saveWeek({ items: [...weekItems(), { id: "i" + Date.now(), text: txt, done: false, lane: f.dataset.lane }] }); render(true);
    const again = document.querySelector(`.lane-add[data-lane="${f.dataset.lane}"] .lane-input`); if (again) again.focus();
  });
  $("itemForm").addEventListener("submit", async (e) => {
    e.preventDefault(); const txt = $("newItem").value.trim(); if (!txt) return;
    await saveWeek({ items: [...weekItems(), { id: "i" + Date.now(), text: txt, done: false, lane: $("newLane").value }] }); $("newItem").value = ""; render(true);
  });
  $("addForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const job = { title: $("f-title").value.trim(), company: $("f-company").value.trim(), url: $("f-url").value.trim(), location: $("f-location").value.trim(), region: $("f-region").value, source: $("f-source").value, notes: $("f-notes").value.trim(), status: "pool", check: "not-checked", pros: [], cons: [], gaps: [], log: [{ date: todayISO(), text: "Added" }], visa: "unknown", added: todayISO() };
    if (!job.title || !job.company) return;
    if (await addTo("jobs", state.jobs, job, $("addMsg"), "Added to the pool.")) e.target.reset();
  });
  $("personForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const p = { name: $("p-name").value.trim(), company: $("p-company").value.trim(), role: $("p-role").value.trim(), channel: $("p-channel").value, status: $("p-status").value, jobId: $("p-job").value, lastContact: $("p-last").value, nextDate: $("p-nextdate").value, nextStep: $("p-next").value.trim(), notes: $("p-notes").value.trim(), added: todayISO() };
    if (!p.name) return;
    if (await addTo("contacts", state.people, p, $("personMsg"), "Added.")) e.target.reset();
  });
  if ($("targetForm")) $("targetForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const tg = { text: $("t-text").value.trim(), area: $("t-area").value, due: $("t-due").value, done: false, added: todayISO() };
    if (!tg.text) return;
    if (await addTo("targets", state.targets, tg, $("targetMsg"), "Target added.")) { $("t-text").value = ""; $("t-due").value = ""; }
  });
  $("rmForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = $("rm-text").value.trim(), d = parse($("rm-week").value);
    if (!text || !d) return;
    const start = isoLocal(mondayOf(d)), rm = roadmap() || { title: "Roadmap", weeks: [] };
    const weeks = (rm.weeks || []).slice();
    let wi = weeks.findIndex((w) => w.start === start);
    if (wi < 0) { weeks.push({ start, items: [] }); weeks.sort((a, b) => a.start.localeCompare(b.start)); wi = weeks.findIndex((w) => w.start === start); }
    weeks[wi] = { ...weeks[wi], items: [...(weeks[wi].items || []), { id: "r" + Date.now(), lane: $("rm-lane").value, text, done: false }] };
    await saveRoadmap({ ...rm, weeks });
    $("rm-text").value = ""; $("rmMsg").textContent = "Added."; render(true);
  });
  $("creativeForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const p = { name: $("c-name").value.trim(), status: $("c-status").value, summary: $("c-summary").value.trim(), nextStep: $("c-next").value.trim(), links: [], order: 99, added: todayISO() };
    if (!p.name) return;
    if (await addTo("creative", state.creative, p, $("creativeMsg"), "Added.")) e.target.reset();
  });
  $("projectForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const p = { name: $("j-name").value.trim(), status: $("j-status").value, summary: $("j-summary").value.trim(), nextStep: $("j-next").value.trim(), links: [], order: 99, added: todayISO() };
    if (!p.name) return;
    if (await addTo("projects", state.projects, p, $("projectMsg"), "Added.")) e.target.reset();
  });
  window.addEventListener("resize", () => renderCharts());

  /* ================= Export ================= */
  function csvRoles() {
    const cols = ["company", "title", "location", "region", "status", "aiCall", "check", "verified", "qualified", "enjoy", "myInterest", "salary", "deadline", "nextAction", "nextDate", "appliedOn", "source", "url", "summary", "notes"];
    const cell = (v) => { const s = Array.isArray(v) ? v.join("; ") : String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    return [cols.join(","), ...state.jobs.map((j) => cols.map((c) => cell(j[c])).join(","))].join("\n");
  }
  async function exportData(kind) {
    if (kind === "json" && window.LPBackup) return window.LPBackup.exportBackup();
    const data = kind === "json"
      ? JSON.stringify({ exported: todayISO(), roles: state.jobs, contacts: state.people, projects: state.projects, creative: state.creative, workouts: state.workouts, targets: state.targets, profile: state.profile, weeks: state.weeks, settings: state.settings }, null, 2)
      : csvRoles();
    const filename = `life-planner-${kind === "json" ? "data" : "roles"}-${todayISO()}.${kind}`;
    const msg = $("exportMsg");
    if (window.claude && typeof window.claude.use === "function") {
      const dl = await window.claude.use("downloads").catch(() => null);
      if (dl) {
        try { await dl.save({ filename, data }); msg.textContent = "Exported."; }
        catch (err) { msg.textContent = err && err.code === "declined" ? "Export cancelled." : "Export didn't work. Try again."; }
        return;
      }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([data], { type: kind === "json" ? "application/json" : "text/csv" }));
    a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    msg.textContent = "Exported.";
  }


  /* ================= Local storage =================
     Everything saves in this browser (localStorage), so the file works
     on its own: open it in Chrome, Safari, Edge or Firefox, or paste it
     into an AI chat that can show HTML. Nothing is sent anywhere. */
  const STORE_KEY = "life-planner-girly-pop-v1";
  function seedData() {
    const byId = (arr) => Object.fromEntries(arr.map((x) => { const { id, ...rest } = x; return [id, rest]; }));
    return {
      jobs: byId(EX.jobs), contacts: byId(EX.people), projects: byId(EX.projects), profile: byId(EX.profile),
      weeks: {}, skills: byId(EX.skills), workouts: byId(EX.workouts), creative: byId(EX.creative),
      targets: byId([{ id: "ext1", text: "Apply to 5 jobs (sample)", area: "career", due: addDays(todayISO(), 21), done: false, metric: "applications", goal: 5 }]),
      settings: { main: { ...EX.settings, roadmap: exampleRoadmap() } }
    };
  }
  // A sample week-by-week plan, dated from this week so it always looks current.
  function exampleRoadmap() {
    const mon = mondayOf(new Date());
    const wk = (n, items) => { const d = new Date(mon); d.setDate(d.getDate() + 7 * n); const start = isoLocal(d); return { start, items: items.map(([lane, text], i) => ({ id: `${start}-${i}`, lane, text, done: false })) }; };
    return {
      title: "Road to the holidays", short: "plan",
      note: "A light week-by-week plan (sample). Career first, rest counts, creative only on lighter weeks. Tick things off, remove them with ×, or add your own below.",
      weeks: [
        wk(0, [["career", "Update the résumé"], ["career", "One small LinkedIn action"], ["body", "Three movement sessions"]]),
        wk(1, [["career", "Send two applications"], ["creative", "Gift project: list what's left to do"]]),
        wk(2, [["career", "Applications"], ["people", "Plan a catch-up with a friend"]]),
        wk(3, [["career", "Applications"], ["creative", "Gift project: finish it"]]),
        wk(4, [["career", "Applications, lighter"], ["creative", "Wrap gifts"]]),
        wk(5, [["people", "Holiday: rest and celebrate"]]),
      ],
    };
  }
  function makeLocalDB() {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { data = null; }
    const firstRun = !data;
    if (!data) data = seedData();
    const subs = {};
    const persist = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) { if (window.LPBackup) LPBackup.saveFailed(e); } };
    if (window.LPBackup) { LPBackup.setSource(() => data); LPBackup.setSamples(seedData); }
    const coll = (c) => (data[c] = data[c] || {});
    const snapOf = (c) => ({ docs: Object.entries(coll(c)).map(([id, v]) => ({ id, data: () => ({ ...v }) })) });
    const emit = (c) => (subs[c] || []).forEach((f) => f());
    const listen = (c, f) => { (subs[c] = subs[c] || []).push(f); setTimeout(f, 0); return () => {}; };
    const ref = (c, id) => ({
      set: async (v) => { coll(c)[id] = { ...v }; persist(); emit(c); },
      update: async (p) => { coll(c)[id] = { ...(coll(c)[id] || {}), ...p }; persist(); emit(c); },
      delete: async () => { delete coll(c)[id]; persist(); emit(c); },
      onSnapshot: (f) => listen(c, () => { const v = coll(c)[id]; f({ exists: !!v, data: () => ({ ...v }) }); })
    });
    return {
      firstRun,
      collection: (c) => ({
        doc: (id) => ref(c, id),
        add: async (v) => { const id = Math.random().toString(36).slice(2, 10); await ref(c, id).set(v); return { id }; },
        onSnapshot: (f) => listen(c, () => f(snapOf(c)))
      }),
      doc: (path) => { const [c, id] = path.split("/"); return ref(c, id); },
      clearAll: () => { data = { settings: { main: { ...EX.settings } } }; persist(); Object.keys(subs).forEach(emit); },
    };
  }

  /* ================= Data ================= */
  function useExamples(reason) {
    state.mode = "demo";
    state.jobs = EX.jobs.map((j) => ({ ...j })); state.people = EX.people.map((p) => ({ ...p }));
    state.projects = EX.projects.map((p) => ({ ...p })); state.profile = EX.profile.map((p) => ({ ...p }));
    state.weeks = []; state.skills = EX.skills.map((k) => ({ ...k })); state.workouts = EX.workouts.map((k) => ({ ...k })); state.creative = EX.creative.map((k) => ({ ...k })); state.targets = [{ id: "ext1", text: "Apply to 5 jobs (sample)", area: "career", due: addDays(todayISO(), 21), done: false, metric: "applications", goal: 5 }]; state.settings = { ...EX.settings };
    showBanner(reason); render(true);
  }

  setTab(location.hash.slice(1));
  render(true);
  {
    Promise.resolve(makeLocalDB()).then((db) => {
      state.db = db; window.lifePlannerDB = db;
      const need = new Set(["jobs", "contacts", "projects", "profile", "weeks", "skills", "workouts", "creative", "targets", "settings"]);
      const arrived = (k) => { need.delete(k); if (!need.size && state.mode === "loading") state.mode = "live"; };
      const onErr = () => showBanner("Live updates stopped. Reload the page to reconnect.");
      const sub = (coll, key) => db.collection(coll).onSnapshot((snap) => {
        state[key] = snap.docs.map((d) => ({ id: d.id, ...d.data() })); arrived(coll);
        if (typing()) { state.pendingRender = true; renderMeta(); return; }
        render(true);
      }, onErr);
      sub("jobs", "jobs"); sub("contacts", "people"); sub("projects", "projects"); sub("profile", "profile"); sub("weeks", "weeks"); sub("skills", "skills"); sub("workouts", "workouts"); sub("creative", "creative"); sub("targets", "targets");
      db.doc("settings/main").onSnapshot((snap) => {
        if (snap.exists) state.settings = { linkedinStage: 1, ...snap.data() };
        arrived("settings");
        if (typing()) { state.pendingRender = true; return; }
        render(true);
      }, onErr);
    });
  }
})();


document.getElementById("freshBtn").addEventListener("click", (e) => {
  const b = e.currentTarget;
  if (!b.dataset.armed) { b.dataset.armed = "1"; b.textContent = "Tap again to clear everything"; setTimeout(() => { b.textContent = "Start fresh"; delete b.dataset.armed; }, 4000); return; }
  if (window.lifePlannerDB) window.lifePlannerDB.clearAll();
  b.textContent = "Start fresh"; delete b.dataset.armed;
});
document.getElementById("exampleBtn").addEventListener("click", () => { if (window.LPBackup) window.LPBackup.restoreSamples(); });


/* Phone status bar clock and the week in the title bar */
(function () {
  function tick() {
    var d = new Date(), t = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }).replace(/\s?[AP]M$/i, "");
    var mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
    var a = document.getElementById("psTime"), c = document.getElementById("psDay");
    if (a) a.textContent = t;
    if (c) c.textContent = "Week of " + mon.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  tick(); setInterval(tick, 20000);
})();
