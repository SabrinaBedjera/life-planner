(function () {
  var KEY = "life-planner-studio-v1";
  var DAY = 864e5;
  function iso(d) { return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); }
  var today = new Date(); today.setHours(0, 0, 0, 0);
  function plus(n) { return iso(new Date(today.getTime() + n * DAY)); }
  var dow = (today.getDay() + 6) % 7;
  var monday = new Date(today.getTime() - dow * DAY);
  var weekKey = iso(monday);
  var uid = function () { return Math.random().toString(36).slice(2, 9); };

  var LANES = [
    { id: "home", name: "Home", c: "var(--blush)" },
    { id: "health", name: "Health", c: "var(--sage)" },
    { id: "people", name: "People", c: "var(--birch)" },
    { id: "channel", name: "Channel", c: "var(--sky)" }
  ];
  var STATUS = {
    projects: ["idea", "measuring", "shopping", "building", "done"],
    appts: ["booked", "done"],
    tries: ["spotted", "want", "bought"],
    uploads: ["idea", "filming", "editing", "scheduled", "posted"]
  };
  var LABEL = { idea: "Idea", measuring: "Measuring", shopping: "Shopping", building: "Building", done: "Done", booked: "Booked", filming: "Filming", editing: "Editing", scheduled: "Scheduled", posted: "Posted", spotted: "Spotted", want: "Want it", bought: "Bought" };
  var CHECKED = { shopping: 1, plans: 1, ideas: 0, watch: 1 };

  // Quotes by women writers, feminists and the odd witch, about flowers, home and living boldly
  var OLD_QUOTES = ["Have nothing in your house that you do not know to be useful, or believe to be beautiful.", "Adopt the pace of nature: her secret is patience.", "Little by little, one travels far.", "Bloom where you are planted.", "The earth laughs in flowers.", "If you have a garden and a library, you have everything you need.", "Simplicity is the keynote of all true elegance.", "Home is where one starts from.", "Act as if what you do makes a difference. It does.", "Keep some room in your heart for the unimaginable.", "Not all those who wander are lost.", "Every day is a fresh start."];
  function starterQuotes() {
    return [
      ["If you look the right way, you can see that the whole world is a garden.", "Frances Hodgson Burnett"],
      ["I'd rather have roses on my table than diamonds on my neck.", "Emma Goldman"],
      ["To be a Flower, is profound Responsibility.", "Emily Dickinson"],
      ["Where flowers bloom, so does hope.", "Lady Bird Johnson"],
      ["Keep rosemary by your garden gate. Plant lavender for luck.", "Alice Hoffman, Practical Magic"],
      ["I'm so glad I live in a world where there are Octobers.", "L. M. Montgomery"],
      ["Home is the nicest word there is.", "Laura Ingalls Wilder"],
      ["There is nothing like staying at home for real comfort.", "Jane Austen"],
      ["A woman must have money and a room of her own if she is to write fiction.", "Virginia Woolf"],
      ["I am not afraid of storms, for I am learning how to sail my ship.", "Louisa May Alcott"],
      ["Well-behaved women seldom make history.", "Laurel Thatcher Ulrich"],
      ["The most common way people give up their power is by thinking they don't have any.", "Alice Walker"],
      ["I am my own muse.", "Frida Kahlo"],
      ["Tell me, what is it you plan to do with your one wild and precious life?", "Mary Oliver"],
      ["There is no greater agony than bearing an untold story inside you.", "Maya Angelou"],
      ["Forever is composed of nows.", "Emily Dickinson"]
    ].map(function (q) { return { id: uid(), title: q[0], by: q[1] }; });
  }

  // Example content, so the page isn't empty the first time. "Start fresh" clears it.
  function examples() {
    return {
      week: {},
      weekSeed: ["Walk with Mary 10am", "Pick up paint samples", "Yoga 9:30", "Lunch with my sister", "Build the bookshelf", "Farmers market\nGrandkids visit", "Slow morning\nPlan next week"],
      todos: [
        { id: uid(), lane: "home", text: "Choose the hallway paint colour", done: false },
        { id: uid(), lane: "home", text: "Hang the new curtains", done: true },
        { id: uid(), lane: "health", text: "Three walks this week", done: false },
        { id: uid(), lane: "people", text: "Send a card to Joan", done: false },
        { id: uid(), lane: "channel", text: "Write the script for Saturday's video", done: false }
      ],
      projects: [
        { id: uid(), title: "Reading corner with a pink armchair", room: "Living room", date: plus(20), s: "shopping" },
        { id: uid(), title: "Bookshelf for the guest room", room: "Guest room", date: plus(4), s: "building" },
        { id: uid(), title: "Repaint the hallway", room: "Hallway", date: plus(35), s: "measuring" },
        { id: uid(), title: "Herb shelf by the window", room: "Kitchen", date: "", s: "idea" }
      ],
      shopping: [
        { id: uid(), title: "Picture hooks", note: "Pack of 10", done: false },
        { id: uid(), title: "Linen cushion covers", note: "50 × 50 cm, blush", done: false },
        { id: uid(), title: "Wood glue", note: "", done: true }
      ],
      measures: [
        { id: uid(), title: "Bedroom alcove", size: "92 × 40 cm" },
        { id: uid(), title: "Living room window", size: "140 × 160 cm" }
      ],
      moves: [ { id: uid(), date: iso(monday), type: "Walk", title: "30 minutes by the river" } ],
      books: [
        { id: uid(), title: "A Room with a View", author: "E. M. Forster", shelf: "reading", stars: 0, cover: "" },
        { id: uid(), title: "Little Women", author: "Louisa May Alcott", shelf: "toread", stars: 0, cover: "" },
        { id: uid(), title: "Anne of Green Gables", author: "L. M. Montgomery", shelf: "toread", stars: 0, cover: "" },
        { id: uid(), title: "The Secret Garden", author: "Frances Hodgson Burnett", shelf: "read", stars: 4, cover: "" },
        { id: uid(), title: "Pride and Prejudice", author: "Jane Austen", shelf: "read", stars: 5, cover: "" }
      ],
      quotes: starterQuotes(),
      medits: [
        { id: uid(), date: iso(monday), mins: "10", title: "Morning breathing" },
        { id: uid(), date: plus(-1), mins: "20", title: "Body scan before bed" }
      ],
      appts: [
        { id: uid(), title: "Dentist check-up", where: "2:30pm", date: plus(9), s: "booked" },
        { id: uid(), title: "Eye test", where: "High Street", date: plus(24), s: "booked" }
      ],
      birthdays: [
        { id: uid(), title: "Joan", date: plus(6) },
        { id: uid(), title: "Grandson Leo", date: plus(41) }
      ],
      plans: [
        { id: uid(), title: "Call my brother", date: plus(1), done: false },
        { id: uid(), title: "Coffee with the book club", date: plus(3), done: false }
      ],
      swatches: [
        { id: uid(), flower: "Peony", color: "#f2a9bb", name: "Blush peony", room: "Bedroom" },
        { id: uid(), flower: "Tulip", color: "#e2728f", name: "Tulip pink", room: "Front door" },
        { id: uid(), flower: "Hydrangea", color: "#b9b4e3", name: "Hydrangea", room: "Hallway" },
        { id: uid(), flower: "Rose", color: "#d9536f", name: "Garden rose", room: "Living room" },
        { id: uid(), flower: "Daisy", color: "#fbf3df", name: "Daisy cream", room: "Kitchen" },
        { id: uid(), flower: "Lavender", color: "#a58fd0", name: "Lavender", room: "Bathroom" }
      ],
      ideas: [
        { id: uid(), title: "Scalloped lampshade for the reading corner", link: "" },
        { id: uid(), title: "Pegboard wall for craft supplies", link: "" }
      ],
      journal: (function () {
        var j = {};
        j[plus(-1)] = { mood: "Calm", text: "Finished painting the shelf. The pink looks even better in daylight.\nLong phone call with my sister in the evening.", good: ["Morning sun in the kitchen", "The shelf is done", "A good chat"] };
        j[plus(-3)] = { mood: "Tired", text: "Slow day. Watched a home tour video and saved two ideas for the guest room.", good: ["Fresh flowers", "", ""] };
        return j;
      })(),
      postDay: 5,
      uploads: (function () { var f = (5 - dow + 7) % 7, at = function (n) { return plus(f + 7 * n); }; return [
        { id: uid(), title: "35 new home finds this winter", note: "Thumbnail done", date: at(0), s: "scheduled" },
        { id: uid(), title: "Cosy cottage corner makeover", note: "Voiceover left", date: at(1), s: "editing" },
        { id: uid(), title: "First look at the holiday collection", note: "Film at the store Tuesday", date: at(2), s: "filming" },
        { id: uid(), title: "Best pink decor under $20", note: "", date: "", s: "idea" },
        { id: uid(), title: "Fall arrivals you'll love", note: "", date: at(-1), s: "posted" }
      ]; })(),
      watch: [
        { id: uid(), title: "35 new home products this winter", channel: "Cosy Corners", link: "", done: false },
        { id: uid(), title: "Cottagecore home tour: the cosiest finds", channel: "Cosy Corners", link: "", done: false },
        { id: uid(), title: "First look at the holiday decor collection", channel: "Cosy Corners", link: "", done: false },
        { id: uid(), title: "20-minute gentle morning stretch", channel: "Stretch & Breathe", link: "", done: true }
      ],
      channels: [
        { id: uid(), title: "Cosy Corners", topic: "New-in home finds and tours", link: "" },
        { id: uid(), title: "Stretch & Breathe", topic: "Easy exercise", link: "" },
        { id: uid(), title: "Sunday Bakes", topic: "Baking", link: "" }
      ],
      tries: [
        { id: uid(), title: "Woven rattan basket", price: "$25", from: "35 new home products this winter", s: "want" },
        { id: uid(), title: "Pinecone candles for the mantel", price: "$8", from: "First look at the holiday decor collection", s: "spotted" },
        { id: uid(), title: "Striped linen cushion", price: "$15", from: "", s: "bought" }
      ]
    };
  }

  var state;
  try { state = JSON.parse(localStorage.getItem(KEY)); } catch (e) { state = null; }
  if (!state) state = examples();
  if (window.LPBackup) { LPBackup.setSource(function () { return state; }); LPBackup.setSamples(examples); }
  // Fill in any sections added in a newer version of this file
  (function () { var ex = examples(); for (var k in ex) if (state[k] === undefined) state[k] = ex[k]; })();
  // Swap the first batch of example quotes for the women writers' set (once); quotes you added stay
  if (state.quotesV !== 2) {
    state.quotes = state.quotes.filter(function (q) { return OLD_QUOTES.indexOf(q.title) < 0; });
    var have = state.quotes.map(function (q) { return q.title; });
    starterQuotes().forEach(function (q) { if (have.indexOf(q.title) < 0) state.quotes.push(q); });
    state.quotesV = 2;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { if (window.LPBackup) LPBackup.saveFailed(e); } }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function $(s) { return document.querySelector(s); }
  function nice(date) { return new Date(date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }); }

  // Birthdays repeat every year, so find the next one
  function nextBirthday(date) {
    if (!date) return "";
    var d = new Date(date + "T00:00:00"), n = new Date(today.getFullYear(), d.getMonth(), d.getDate());
    if (n < today) n = new Date(today.getFullYear() + 1, d.getMonth(), d.getDate());
    return iso(n);
  }

  function dueLabel(date) {
    if (!date) return "";
    var d = new Date(date + "T00:00:00"), diff = Math.round((d - today) / DAY);
    if (diff < 0) return '<span class="due">' + nice(date) + "</span>";
    var txt = diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : diff < 7 ? "In " + diff + " days" : nice(date);
    return '<span class="due' + (diff <= 2 ? " soon" : "") + '">' + txt + "</span>";
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
      el.innerHTML = '<label class="dn" for="day-' + i + '">' + n + "<span>" + d.getDate() + "</span></label>";
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

  /* To-dos by area */
  function renderTodos() {
    var lanes = $("#lanes"); lanes.innerHTML = "";
    LANES.forEach(function (l) {
      var items = state.todos.filter(function (q) { return q.lane === l.id; });
      var box = document.createElement("div");
      box.className = "lane"; box.style.setProperty("--c", l.c);
      box.innerHTML = "<h3>" + l.name + "</h3>" + (items.length ? "" : '<div class="empty">Nothing yet.</div>');
      var ul = document.createElement("ul"); ul.className = "list";
      items.forEach(function (q) {
        var li = document.createElement("li");
        li.className = "item" + (q.done ? " done" : ""); li.style.gridTemplateColumns = "auto minmax(0,1fr) auto";
        li.innerHTML = '<input type="checkbox" class="check" aria-label="Done"' + (q.done ? " checked" : "") + '><span class="t"><span>' + esc(q.text) + '</span></span><button class="x" aria-label="Remove">×</button>';
        li.querySelector(".check").addEventListener("change", function (e) { q.done = e.target.checked; save(); renderTodos(); });
        li.querySelector(".x").addEventListener("click", function () { state.todos = state.todos.filter(function (x) { return x !== q; }); save(); renderTodos(); });
        ul.appendChild(li);
      });
      box.appendChild(ul); lanes.appendChild(box);
    });
  }
  $("#todoLane").innerHTML = LANES.map(function (l) { return '<option value="' + l.id + '">' + l.name + "</option>"; }).join("");
  $("#todoForm").addEventListener("submit", function (e) {
    e.preventDefault(); var t = $("#todoText").value.trim(); if (!t) return;
    state.todos.push({ id: uid(), lane: $("#todoLane").value, text: t, done: false });
    $("#todoText").value = ""; save(); renderTodos();
  });

  /* Lists */
  function sub(key, it) {
    if (key === "projects") return esc(it.room);
    if (key === "shopping") return esc(it.note);
    if (key === "measures") return esc(it.size);
    if (key === "appts") return esc(it.where);
    if (key === "moves") return esc(it.type) + (it.date ? " · " + nice(it.date) : "");
    if (key === "quotes") return it.by ? "— " + esc(it.by) : "";
    if (key === "medits") return esc(it.mins) + " min" + (it.date ? " · " + nice(it.date) : "");
    if (key === "birthdays") return it.date ? new Date(it.date + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "long" }) : "";
    var bits = [];
    if (key === "watch" && it.channel) bits.push(esc(it.channel));
    if (key === "uploads" && it.note) bits.push(esc(it.note));
    if (key === "tries" && it.price) bits.push(esc(it.price));
    if (key === "channels" && it.topic) bits.push(esc(it.topic));
    if (key === "tries" && it.from) bits.push("Seen in: " + esc(it.from));
    if (it.link) { var safe = /^https?:\/\//i.test(it.link) ? it.link : "https://" + it.link; bits.push('<a href="' + esc(safe) + '" target="_blank" rel="noopener">' + (key === "watch" ? "Watch" : "Open link") + "</a>"); }
    return bits.join(" · ");
  }
  function renderList(key) {
    var ul = $("#list-" + key); if (!ul) return;
    var items = state[key].slice();
    var when = function (it) { return key === "birthdays" ? nextBirthday(it.date) : it.date; };
    if (["moves", "medits", "quotes", "shopping", "measures", "ideas", "watch", "channels", "tries"].indexOf(key) < 0) items.sort(function (a, b) { return (when(a) || "9999").localeCompare(when(b) || "9999"); });
    if (key === "moves" || key === "medits") items.sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); });
    ul.innerHTML = items.length ? "" : '<li class="empty">Nothing here yet. Add one below.</li>';
    items.forEach(function (it) {
      var li = document.createElement("li");
      var hasStatus = !!STATUS[key], ticks = CHECKED[key] === 1;
      li.className = "item" + ((ticks && it.done) || (hasStatus && it.s === "done") ? " done" : "");
      var lead = ticks ? '<input type="checkbox" class="check" aria-label="Done"' + (it.done ? " checked" : "") + ">" : "<span></span>";
      var s = sub(key, it);
      var title = (key === "watch" && !it.done ? '<span class="tag-new">NEW</span>' : "") + esc(it.title) + (s ? "<small>" + s + "</small>" : "");
      var right = hasStatus ? '<button class="pill" data-s="' + it.s + '" title="Click to change">' + LABEL[it.s] + "</button>" : "";
      var d = when(it);
      li.innerHTML = lead + '<span class="t"><span>' + title + "</span></span>" + (d && key !== "moves" && key !== "medits" ? dueLabel(d) : "<span></span>") + '<span style="display:flex;gap:8px;align-items:center">' + right + '<button class="x" aria-label="Remove">×</button></span>';
      if (ticks) li.querySelector(".check").addEventListener("change", function (e) { it.done = e.target.checked; save(); renderAll(); });
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
      if ((key === "moves" || key === "medits") && !it.date) it.date = iso(today);
      if (STATUS[key]) it.s = STATUS[key][0];
      if (CHECKED[key] === 1) it.done = false;
      state[key].push(it); f.reset(); save(); renderAll();
    });
  });

  /* Books */
  var SPINES = ["#f3b3c2", "#c8d6b4", "#ecd8b8", "#dc7891", "#a9bd8f", "#f8d6dd"];
  // Shrink a photo so lots of covers still fit in the browser's storage
  function shrink(file, cb, maxW) {
    var r = new FileReader();
    r.onload = function () {
      var img = new Image();
      img.onload = function () {
        var w = Math.min(maxW || 240, img.width), h = Math.round(img.height * w / img.width), c = document.createElement("canvas");
        c.width = w; c.height = h; c.getContext("2d").drawImage(img, 0, 0, w, h);
        cb(c.toDataURL("image/jpeg", maxW ? 0.85 : 0.8));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  }
  function renderBooks() {
    ["reading", "toread", "read"].forEach(function (sh) {
      var box = $("#shelf-" + sh), list = state.books.filter(function (b) { return b.shelf === sh; });
      box.innerHTML = list.length ? "" : '<p class="empty">No books here yet.</p>';
      list.forEach(function (b, i) {
        var el = document.createElement("div"); el.className = "book";
        var cover = b.cover ? '<img src="' + esc(b.cover) + '" alt="Cover of ' + esc(b.title) + '">' :
          '<div class="ph" style="background:' + SPINES[(b.title.length + i) % SPINES.length] + '"><span>' + esc(b.title) + "</span></div>";
        var stars = "";
        for (var n = 1; n <= 5; n++) stars += '<button type="button" class="star' + (n <= b.stars ? " on" : "") + '" data-n="' + n + '" aria-label="' + n + ' stars">★</button>';
        el.innerHTML = '<label class="cover" title="Click to add a cover photo">' + cover + '<input type="file" accept="image/*" hidden></label>' +
          '<div class="bt">' + esc(b.title) + "<small>" + esc(b.author) + "</small></div>" +
          (sh === "read" ? '<div class="stars" role="group" aria-label="Rating">' + stars + "</div>" : "") +
          '<div class="bact"><select class="field sm" aria-label="Move to shelf"><option value="toread">To read</option><option value="reading">Reading now</option><option value="read">Read</option></select><button class="x" aria-label="Remove">×</button></div>';
        el.querySelector("select").value = b.shelf;
        el.querySelector("select").addEventListener("change", function () { b.shelf = this.value; save(); renderBooks(); });
        el.querySelector(".x").addEventListener("click", function () { state.books = state.books.filter(function (x) { return x !== b; }); save(); renderBooks(); });
        el.querySelector(".cover input").addEventListener("change", function () { if (this.files[0]) shrink(this.files[0], function (d) { b.cover = d; save(); renderBooks(); }); });
        el.querySelectorAll(".star").forEach(function (st) { st.addEventListener("click", function () { var n = +st.dataset.n; b.stars = b.stars === n ? 0 : n; save(); renderBooks(); }); });
        box.appendChild(el);
      });
    });
    var read = state.books.filter(function (b) { return b.shelf === "read"; }).length;
    $("#readCount").textContent = read ? read + (read === 1 ? " book" : " books") + " read" : "";
  }
  var pendingCover = "";
  $("#bCover").addEventListener("change", function () {
    if (!this.files[0]) return;
    shrink(this.files[0], function (d) { pendingCover = d; $("#bMsg").textContent = "Cover added. Now click Add."; });
  });
  $("#bookForm").addEventListener("submit", function (e) {
    e.preventDefault(); var t = $("#bTitle").value.trim(); if (!t) return;
    state.books.unshift({ id: uid(), title: t, author: $("#bAuthor").value.trim(), shelf: $("#bShelf").value, stars: 0, cover: pendingCover });
    pendingCover = ""; $("#bTitle").value = ""; $("#bAuthor").value = ""; $("#bCover").value = ""; $("#bMsg").textContent = "Added.";
    save(); renderBooks();
  });

  /* Quote of the day */
  function renderQuote() {
    var q = state.quotes, el = $("#quoteDay");
    if (!q.length) { el.hidden = true; return; }
    var n = Math.floor(today.getTime() / DAY), it = q[((n % q.length) + q.length) % q.length];
    el.hidden = false;
    el.innerHTML = "<blockquote>" + esc(it.title) + "</blockquote>" + (it.by ? "<figcaption>" + esc(it.by) + "</figcaption>" : "");
  }

  /* Meditation */
  function renderMed() {
    var names = ["M", "T", "W", "T", "F", "S", "S"], total = 0;
    $("#mdots").innerHTML = names.map(function (n, i) {
      var d = iso(new Date(monday.getTime() + i * DAY));
      var mins = state.medits.filter(function (g) { return g.date === d; }).reduce(function (a, g) { return a + (+g.mins || 0); }, 0);
      total += mins;
      return '<div class="' + (mins ? "on" : "") + '">' + n + "</div>";
    }).join("");
    $("#medTotal").textContent = total ? total + " minutes this week" : "";
  }
  $("#quickMed").addEventListener("click", function (e) {
    var b = e.target.closest("[data-min]"); if (!b) return;
    state.medits.push({ id: uid(), date: iso(today), mins: b.dataset.min, title: "" }); save(); renderAll();
  });

  /* Moving this week */
  function renderDots() {
    var names = ["M", "T", "W", "T", "F", "S", "S"];
    $("#dots").innerHTML = names.map(function (n, i) {
      var d = iso(new Date(monday.getTime() + i * DAY));
      var on = state.moves.some(function (g) { return g.date === d; });
      return '<div class="' + (on ? "on" : "") + '">' + n + "</div>";
    }).join("");
  }

  /* Colours */
  // Little flower drawings, coloured with the chosen colour
  function shade(hex, amt) {
    var n = parseInt(String(hex).replace("#", ""), 16); if (isNaN(n)) n = 0xe8a0b4;
    var r = n >> 16, g = (n >> 8) & 255, b = n & 255, t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    return "rgb(" + Math.round(r + (t - r) * p) + "," + Math.round(g + (t - g) * p) + "," + Math.round(b + (t - b) * p) + ")";
  }
  function flowerSVG(kind, c) {
    var d = shade(c, -0.22), l = shade(c, 0.35), leaf = "#6c8a4c", stem = '<path d="M50 60 V112" stroke="' + leaf + '" stroke-width="4" stroke-linecap="round"/>', g = "";
    var leaves = '<path d="M50 96 C34 92 28 80 30 72 C42 76 49 84 50 96Z M50 88 C64 84 72 74 70 66 C58 70 51 78 50 88Z" fill="' + leaf + '"/>';
    if (kind === "Tulip") g = stem + leaves + '<path d="M30 30 C30 52 38 64 50 64 C62 64 70 52 70 30 L60 40 L50 24 L40 40 Z" fill="' + c + '"/><path d="M40 40 L50 24 L60 40 C58 54 54 62 50 64 C46 62 42 54 40 40Z" fill="' + d + '" opacity=".45"/>';
    else if (kind === "Daisy") { g = stem + leaves; for (var i = 0; i < 12; i++) g += '<ellipse cx="50" cy="22" rx="6" ry="15" fill="' + c + '" stroke="' + d + '" stroke-width="1" transform="rotate(' + i * 30 + ' 50 38)"/>'; g += '<circle cx="50" cy="38" r="9" fill="#f0c840"/>'; }
    else if (kind === "Rose") g = stem + leaves + '<circle cx="50" cy="38" r="24" fill="' + c + '"/><path d="M50 38 m-4 0 a4 4 0 1 1 8 0 a8 8 0 1 1 -16 0 a12 12 0 1 1 24 0 a16 16 0 1 1 -32 0" fill="none" stroke="' + d + '" stroke-width="2.4" stroke-linecap="round"/>';
    else if (kind === "Peony") { g = stem + leaves; [[50,40,26,d],[38,34,15,c],[62,34,15,c],[50,24,15,c],[42,46,14,l],[58,46,14,l],[50,38,11,c],[50,36,6,l]].forEach(function (q) { g += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + q[2] + '" fill="' + q[3] + '"/>'; }); }
    else if (kind === "Hydrangea") { g = stem + leaves; [[50,22],[36,28],[64,28],[30,42],[70,42],[43,38],[57,38],[50,50],[38,52],[62,52],[50,34]].forEach(function (q, i) { var f = i % 3 ? c : d; g += '<g transform="translate(' + q[0] + " " + q[1] + ')"><circle cx="-4" cy="0" r="4.5" fill="' + f + '"/><circle cx="4" cy="0" r="4.5" fill="' + f + '"/><circle cx="0" cy="-4" r="4.5" fill="' + f + '"/><circle cx="0" cy="4" r="4.5" fill="' + f + '"/><circle r="1.6" fill="' + l + '"/></g>'; }); }
    else { g = '<path d="M50 30 V112" stroke="' + leaf + '" stroke-width="3" stroke-linecap="round"/><path d="M50 100 C40 96 36 88 38 82 C46 86 50 92 50 100Z" fill="' + leaf + '"/>'; for (var j = 0; j < 9; j++) { var y = 14 + j * 7; g += '<ellipse cx="' + (j % 2 ? 54 : 46) + '" cy="' + y + '" rx="5" ry="6" fill="' + (j % 3 ? c : d) + '"/>'; } }
    return '<svg viewBox="0 0 100 116" aria-hidden="true">' + g + "</svg>";
  }
  var FLOWERS = ["Tulip", "Peony", "Rose", "Daisy", "Hydrangea", "Lavender"];
  function guessFlower(w) { var n = (w.name || "").toLowerCase(); for (var i = 0; i < FLOWERS.length; i++) if (n.indexOf(FLOWERS[i].toLowerCase()) >= 0) return FLOWERS[i]; return "Tulip"; }
  function renderSwatches() {
    var box = $("#swatches");
    box.innerHTML = state.swatches.length ? "" : '<p class="empty">No flowers yet.</p>';
    state.swatches.forEach(function (w) {
      var el = document.createElement("div"); el.className = "swatch";
      var kind = w.flower || guessFlower(w);
      var art = w.photo ? '<img src="' + esc(w.photo) + '" alt="' + esc(w.name || kind) + '">' : flowerSVG(kind, w.color);
      el.innerHTML = '<label class="col" title="Click to add a photo" style="background:' + shade(w.color, 0.78) + '">' + art + '<input type="file" accept="image/*" hidden></label>' +
        '<div class="nm"><span class="dot" style="background:' + esc(w.color) + '"></span><span>' + esc(w.name || kind) + "<small>" + esc(w.room || kind) + "</small></span></div>" +
        '<button class="x" aria-label="Remove">×</button>';
      el.querySelector(".col input").addEventListener("change", function () { if (this.files[0]) shrink(this.files[0], function (d) { w.photo = d; save(); renderSwatches(); }); });
      el.querySelector(".x").addEventListener("click", function () { state.swatches = state.swatches.filter(function (x) { return x !== w; }); save(); renderSwatches(); });
      box.appendChild(el);
    });
  }
  var pendingFlower = "";
  $("#swPhoto").addEventListener("change", function () { if (this.files[0]) shrink(this.files[0], function (d) { pendingFlower = d; $("#swMsg").textContent = "Photo added. Now click Add."; }); });
  $("#swatchForm").addEventListener("submit", function (e) {
    e.preventDefault();
    state.swatches.push({ id: uid(), flower: $("#swFlower").value, color: $("#swColor").value, name: $("#swName").value.trim(), room: $("#swRoom").value.trim(), photo: pendingFlower });
    pendingFlower = ""; $("#swPhoto").value = ""; $("#swMsg").textContent = "";
    $("#swName").value = ""; $("#swRoom").value = ""; save(); renderSwatches();
  });

  /* Coming up */
  function renderUpcoming() {
    var rows = [];
    state.projects.forEach(function (p) { if (p.date && p.s !== "done") rows.push({ date: p.date, t: p.title, k: "Home project" }); });
    state.appts.forEach(function (a) { if (a.date && a.s !== "done") rows.push({ date: a.date, t: a.title, k: "Appointment" }); });
    state.birthdays.forEach(function (b) { if (b.date) rows.push({ date: nextBirthday(b.date), t: b.title + "'s birthday", k: "Birthday" }); });
    state.plans.forEach(function (p) { if (p.date && !p.done) rows.push({ date: p.date, t: p.title, k: "Family & friends" }); });
    state.uploads.forEach(function (u) { if (u.date && u.s !== "posted") rows.push({ date: u.date, t: u.title, k: "Upload" }); });
    rows = rows.filter(function (r) { return r.date >= iso(today); }).sort(function (a, b) { return a.date.localeCompare(b.date); });
    $("#upcoming").innerHTML = rows.length ? rows.slice(0, 5).map(function (r) {
      return '<li class="item" style="grid-template-columns:minmax(0,1fr) auto"><span class="t"><span>' + esc(r.t) + "<small>" + esc(r.k) + "</small></span></span>" + dueLabel(r.date) + "</li>";
    }).join("") : '<li class="empty">Nothing with a date yet.</li>';
  }

  /* Journal */
  var PROMPTS = ["What made you smile today?", "Which room in your home feels best right now, and why?", "Who would you like to hear from this week?", "What is something you'd like to make?", "Describe a colour you saw today.", "What are you looking forward to?", "What did you learn this week?", "What would make tomorrow lovely?"];
  var MOODS = ["Happy", "Calm", "Busy", "Tired", "Low"];
  var jDay = iso(today);
  function jEntry(make) {
    var e = state.journal[jDay];
    if (!e && make) e = state.journal[jDay] = { mood: "", text: "", good: ["", "", ""] };
    return e || { mood: "", text: "", good: ["", "", ""] };
  }
  function jTidy() {
    var e = state.journal[jDay];
    if (e && !e.mood && !e.text.trim() && !e.good.join("").trim()) delete state.journal[jDay];
  }
  function renderJournal() {
    var e = jEntry(false), n = Math.round((new Date(jDay + "T00:00:00") - new Date(today.getFullYear(), 0, 1)) / DAY);
    $("#jTitle").textContent = jDay === iso(today) ? "Today's page" : nice(jDay);
    $("#jPrompt").textContent = PROMPTS[((n % PROMPTS.length) + PROMPTS.length) % PROMPTS.length];
    $("#jDate").value = jDay; $("#jToday").hidden = jDay === iso(today);
    $("#jText").value = e.text; $("#jMsg").textContent = "";
    $("#jMoods").innerHTML = MOODS.map(function (m) { return '<button type="button" class="mood" aria-pressed="' + (e.mood === m) + '">' + m + "</button>"; }).join("");
    $("#jGood").innerHTML = [0, 1, 2].map(function (i) { return '<label><span class="step" style="--c:var(--sage)">' + (i + 1) + '</span><input class="field" data-i="' + i + '" value="' + esc(e.good[i]) + '" aria-label="Good thing ' + (i + 1) + '"></label>'; }).join("");
    renderPast();
  }
  function renderPast() {
    var days = Object.keys(state.journal).sort().reverse();
    $("#jPast").innerHTML = days.length ? "" : '<li class="empty">Your pages will show up here.</li>';
    days.slice(0, 30).forEach(function (d) {
      var e = state.journal[d], li = document.createElement("li");
      li.className = "item" + (d === jDay ? " current" : ""); li.style.gridTemplateColumns = "minmax(0,1fr) auto";
      var first = (e.text || e.good.filter(Boolean).join(", ")).split("\n")[0];
      li.innerHTML = '<span class="t"><button type="button" class="open">' + esc(nice(d)) + "</button><small>" + esc(first.length > 70 ? first.slice(0, 70) + "..." : first) + "</small></span>" + (e.mood ? '<span class="due">' + esc(e.mood) + "</span>" : "<span></span>");
      li.querySelector(".open").addEventListener("click", function () { jTidy(); jDay = d; renderJournal(); $("#jText").focus(); });
      $("#jPast").appendChild(li);
    });
  }
  $("#jText").addEventListener("input", function () { jEntry(true).text = this.value; jTidy(); save(); $("#jMsg").textContent = "Saved."; renderPast(); });
  $("#jGood").addEventListener("input", function (ev) { var i = ev.target.dataset.i; if (i == null) return; jEntry(true).good[i] = ev.target.value; jTidy(); save(); renderPast(); });
  $("#jMoods").addEventListener("click", function (ev) {
    var b = ev.target.closest(".mood"); if (!b) return;
    var e = jEntry(true); e.mood = e.mood === b.textContent ? "" : b.textContent; jTidy(); save(); renderJournal();
  });
  $("#jDate").addEventListener("change", function () { if (!this.value) return; jTidy(); jDay = this.value; renderJournal(); });
  $("#jToday").addEventListener("click", function () { jTidy(); jDay = iso(today); renderJournal(); });

  var seasonNow = ["Winter", "Winter", "Spring", "Spring", "Spring", "Summer", "Summer", "Summer", "Fall", "Fall", "Fall", "Holidays"][today.getMonth()];
  $("#season").value = state.season || seasonNow;
  $("#season").addEventListener("change", function () { state.season = this.value; save(); });

  /* Posting calendar: the next four upload days */
  var DAYS = ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays", "Sundays"];
  function renderSlots() {
    var pd = state.postDay == null ? 5 : +state.postDay, first = (pd - dow + 7) % 7, html = "";
    for (var n = 0; n < 4; n++) {
      var d = iso(new Date(today.getTime() + (first + 7 * n) * DAY));
      var v = state.uploads.filter(function (u) { return u.date === d; })[0];
      html += '<div class="slot' + (v ? " filled" : "") + '"><div class="sd">' + nice(d) + "</div>" + (v ? "<b>" + esc(v.title) + '</b><span class="pill" data-s="' + v.s + '">' + LABEL[v.s] + "</span>" : '<span class="open-slot">Open slot</span>') + "</div>";
    }
    $("#slots").innerHTML = html;
    var next = state.uploads.filter(function (u) { return u.date && u.date >= iso(today) && u.s !== "posted"; }).sort(function (a, b) { return a.date.localeCompare(b.date); })[0];
    $("#nextUp").textContent = next ? "Next upload: " + next.title + ", " + nice(next.date) : "No upload planned yet";
  }
  $("#postDay").value = state.postDay == null ? 5 : state.postDay;
  $("#postDay").addEventListener("change", function () { state.postDay = +this.value; save(); renderSlots(); });

  function renderAll() {
    ["projects", "shopping", "measures", "moves", "appts", "birthdays", "plans", "ideas", "quotes", "medits", "uploads", "watch", "channels", "tries"].forEach(renderList);
    renderDots(); renderSwatches(); renderUpcoming(); renderSlots(); renderMed(); renderQuote(); renderBooks();
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-act]"); if (!a) return;
    if (a.dataset.act === "reset") {
      if (a.dataset.armed) {
        state = { quotesV: 2, week: {}, weekSeed: null, todos: [], projects: [], shopping: [], measures: [], moves: [], medits: [], quotes: [], books: [], appts: [], birthdays: [], plans: [], swatches: [], ideas: [], custom: state.custom, journal: {}, uploads: [], watch: [], channels: [], tries: [], postDay: state.postDay };
        save(); renderWeek(); renderTodos(); renderAll(); jDay = iso(today); renderJournal();
        a.textContent = "Start fresh"; delete a.dataset.armed;
      } else { a.dataset.armed = "1"; a.textContent = "Click again to clear everything"; setTimeout(function () { a.textContent = "Start fresh"; delete a.dataset.armed; }, 4000); }
    }
  });

  /* Make it yours: title, colours, header and tabs */
  var MAIN_P = ["#6c8a4c", "#c9516f", "#8a72c2", "#4f86a8", "#c96a36", "#3b2f2c"];
  var HI_P = ["#dc7891", "#e8a0b4", "#a58fd0", "#6aa3c7", "#e08a5a", "#6c8a4c"];
  var TAB_DEFAULTS = Array.prototype.map.call(document.querySelectorAll(".tab"), function (t) { return { id: t.getAttribute("href").slice(1), name: t.textContent }; });
  function custom() { if (!state.custom) state.custom = {}; return state.custom; }
  function applyCustom() {
    var c = state.custom || {}, root = document.documentElement.style;
    $(".h-life").textContent = c.t1 || "Life"; $(".h-plan").textContent = c.t2 == null ? "Planner" : c.t2;
    // Shrink long titles so they fit beside the picture
    var longest = Math.max((c.t1 || "Life").length, (c.t2 == null ? "Planner" : c.t2).length);
    $(".mast h1").style.setProperty("--fit", longest > 7 ? (7 / longest).toFixed(3) : 1);
    if (c.main) { root.setProperty("--olive", c.main); root.setProperty("--olive-dark", shade(c.main, -0.25)); root.setProperty("--sage-dark", c.main); }
    else ["--olive", "--olive-dark", "--sage-dark"].forEach(function (v) { root.removeProperty(v); });
    if (c.hi) { root.setProperty("--rose", c.hi); root.setProperty("--rose-dark", shade(c.hi, -0.25)); root.setProperty("--pinky", shade(c.hi, 0.35)); root.setProperty("--blush", shade(c.hi, 0.7)); }
    else ["--rose", "--rose-dark", "--pinky", "--blush"].forEach(function (v) { root.removeProperty(v); });
    $(".mast").setAttribute("data-bg", c.bg || "pink");
    var v = $(".vignette");
    v.classList.toggle("has-photo", !!c.photo);
    var ph = v.querySelector(".v-photo");
    if (c.photo) { if (!ph) { ph = document.createElement("img"); ph.className = "v-photo"; ph.alt = ""; v.appendChild(ph); } ph.src = c.photo; }
    else if (ph) ph.remove();
    var tabs = c.tabs || {};
    document.querySelectorAll(".tab:not([data-lp-extra])").forEach(function (t) {
      var id = t.getAttribute("href").slice(1), def = TAB_DEFAULTS.filter(function (d) { return d.id === id; })[0], o = tabs[id] || {};
      if (def) t.textContent = o.name || def.name; // showing and hiding tabs lives in Customize now
    });
    if (window.LP && LP.refreshNav) LP.refreshNav();
    if (document.title) document.title = (c.t1 || "Life") + " " + (c.t2 == null ? "Planner" : c.t2);
  }
  function swatchRow(box, list, key, input) {
    box.innerHTML = list.map(function (col) { return '<button type="button" class="preset" style="background:' + col + '" data-c="' + col + '" aria-label="Use ' + col + '"></button>'; }).join("");
    box.addEventListener("click", function (e) { var b = e.target.closest(".preset"); if (!b) return; custom()[key] = b.dataset.c; input.value = b.dataset.c; save(); applyCustom(); });
    input.addEventListener("input", function () { custom()[key] = input.value; save(); applyCustom(); });
  }
  function fillCustomForm() {
    var c = state.custom || {}, cs = getComputedStyle(document.documentElement);
    $("#cT1").value = c.t1 || "Life"; $("#cT2").value = c.t2 == null ? "Planner" : c.t2;
    $("#cMain").value = c.main || "#6c8a4c"; $("#cHi").value = c.hi || "#dc7891"; $("#cBg").value = c.bg || "pink";
    var tabs = c.tabs || {};
    $("#cTabs").innerHTML = TAB_DEFAULTS.map(function (d) {
      var o = tabs[d.id] || {};
      return '<label class="ctab"><input class="field" data-id="' + d.id + '" value="' + esc(o.name || d.name) + '" aria-label="Name for ' + esc(d.name) + '"></label>';
    }).join("") + '<button class="btn ghost" type="button" data-act="lp-tabs">Show or hide tabs</button>';
  }
  swatchRow($("#cMainP"), MAIN_P, "main", $("#cMain"));
  swatchRow($("#cHiP"), HI_P, "hi", $("#cHi"));
  $("#cT1").addEventListener("input", function () { custom().t1 = this.value; save(); applyCustom(); });
  $("#cT2").addEventListener("input", function () { custom().t2 = this.value; save(); applyCustom(); });
  $("#cBg").addEventListener("change", function () { custom().bg = this.value; save(); applyCustom(); });
  $("#cPhoto").addEventListener("change", function () { if (this.files[0]) shrink(this.files[0], function (d) { custom().photo = d; save(); applyCustom(); }, 900); this.value = ""; });
  $("#cPhotoReset").addEventListener("click", function () { delete custom().photo; save(); applyCustom(); });
  $("#cTabs").addEventListener("input", function (e) {
    var id = e.target.dataset.id; if (!id) return;
    var c = custom(); if (!c.tabs) c.tabs = {}; if (!c.tabs[id]) c.tabs[id] = {};
    c.tabs[id].name = e.target.value.trim();
    save(); applyCustom(); route();
  });
  $("#cReset").addEventListener("click", function () { state.custom = {}; save(); applyCustom(); fillCustomForm(); route(); });
  document.addEventListener("click", function (e) {
    var lt = e.target.closest('[data-act="lp-tabs"]');
    if (lt) { $("#customize").close(); if (window.LP) LP.openCustomize("tabs"); return; }
    var a = e.target.closest('[data-act="customize"]'); if (!a) return;
    fillCustomForm();
    var d = $("#customize"); if (d.showModal) d.showModal(); else d.setAttribute("open", "");
  });

  /* Tabs */
  var VIEWS = ["week", "home", "wellbeing", "people", "ideas", "books", "watch"];
  function route() {
    var v = (location.hash || "#week").slice(1); if (v === "journal") v = "wellbeing"; if (VIEWS.indexOf(v) < 0) v = "week";
    var visible = VIEWS.filter(function (n) { var t = document.querySelector('.tab[href="#' + n + '"]:not([data-lp-extra])'); return t && !t.hidden; });
    if (visible.indexOf(v) < 0) v = visible[0] || "week";
    VIEWS.forEach(function (n) { document.getElementById("view-" + n).hidden = n !== v; });
    document.querySelectorAll(".tab").forEach(function (t) { t.setAttribute("aria-selected", t.getAttribute("href") === "#" + v ? "true" : "false"); });
  }
  window.addEventListener("hashchange", route);

  applyCustom(); renderWeek(); renderTodos(); renderAll(); renderJournal(); route();
})();
