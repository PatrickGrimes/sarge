(() => {
  const MUTE_KEY = "sarnt-mute";
  const ALIASES = { me: "pat", pat: "pat", pam: "pam" };

  function detectBase() {
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts[0] === "sarge") return "/sarge";
    return "";
  }
  const BASE = detectBase();

  function asset(path) {
    if (!path) return "";
    if (/^https?:/i.test(path)) return path;
    return `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
  }

  function detectWho() {
    const parts = location.pathname
      .split("/")
      .filter(Boolean)
      .map((p) => p.replace(/\.html$/i, "").toLowerCase());
    const last = parts[parts.length - 1];
    if (last && last !== "sarge" && last !== "index") return ALIASES[last] || last;
    return new URLSearchParams(location.search).get("who");
  }

  function inkFor(hex) {
    const n = hex.replace("#", "").trim();
    if (n.length < 6) return "#0A0A0A";
    const r = parseInt(n.slice(0, 2), 16);
    const g = parseInt(n.slice(2, 4), 16);
    const b = parseInt(n.slice(4, 6), 16);
    const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return l > 0.55 ? "#0A0A0A" : "#F4F1EA";
  }

  function paintAccent(person) {
    const root = document.documentElement;
    if (!person) {
      root.style.removeProperty("--accent");
      root.style.removeProperty("--accent-ink");
      return;
    }
    root.style.setProperty("--accent", person.accent);
    root.style.setProperty("--accent-ink", inkFor(person.accent));
  }

  function resolveWho(raw, people) {
    if (!raw) return null;
    const key = raw.trim().toLowerCase();
    const aliased = ALIASES[key] || key;
    const hit =
      people.find((p) => p.id === aliased) ||
      people.find((p) => p.id === key) ||
      people.find((p) => p.name.toLowerCase() === key);
    return hit ? hit.id : null;
  }

  let voicesReady = null;
  function loadVoices() {
    if (!("speechSynthesis" in window)) return Promise.resolve([]);
    if (voicesReady) return voicesReady;
    voicesReady = new Promise((resolve) => {
      const read = () => speechSynthesis.getVoices();
      const now = read();
      if (now.length) return resolve(now);
      const done = () => {
        speechSynthesis.removeEventListener("voiceschanged", done);
        resolve(read());
      };
      speechSynthesis.addEventListener("voiceschanged", done);
      setTimeout(() => resolve(read()), 1500);
    });
    return voicesReady;
  }

  function pickVoice(voices, names, lang) {
    for (const name of names || []) {
      const exact = voices.find((v) => v.name === name);
      if (exact) return exact;
      const partial = voices.find((v) => v.name.includes(name));
      if (partial) return partial;
    }
    const want = (lang || "en-GB").replace("_", "-").toLowerCase();
    return (
      voices.find((v) => v.lang.replace("_", "-").toLowerCase() === want) ||
      voices.find((v) =>
        v.lang.replace("_", "-").toLowerCase().startsWith(want.slice(0, 2)),
      ) ||
      null
    );
  }

  async function speakFromFile(text, voice) {
    const line = text && text.trim();
    if (!line || !voice || !("speechSynthesis" in window)) return;
    const voices = await loadVoices();
    const picked = pickVoice(voices, voice.preferredNames, voice.lang);
    const u = new SpeechSynthesisUtterance(line);
    if (picked) u.voice = picked;
    u.lang = (picked && picked.lang) || voice.lang;
    u.pitch = voice.pitch;
    u.rate = voice.rate;
    u.volume = voice.volume;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }

  function hush() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }

  function line(voice, key) {
    return voice && voice.script ? voice.script[key] : undefined;
  }

  const state = {
    screen: "who",
    people: [],
    person: null,
    workout: null,
    error: null,
    exerciseIndex: 0,
    setIndex: 0,
    restLeft: 0,
    muted: localStorage.getItem(MUTE_KEY) === "1",
    paused: false,
  };

  let splashTimer = 0;
  let speakTimer = 0;
  let restTimer = 0;

  function clearTimers() {
    clearTimeout(splashTimer);
    clearTimeout(speakTimer);
    clearInterval(restTimer);
    splashTimer = speakTimer = restTimer = 0;
  }

  function bark(text) {
    if (state.muted || !state.workout || !text) return;
    void speakFromFile(text, state.workout.voice);
  }

  function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function go(path) {
    location.href = `${BASE}${path}`;
  }

  async function loadPeople() {
    const res = await fetch(asset("/people.json"), { cache: "no-store" });
    if (!res.ok) throw new Error("NO ROSTER");
    const data = await res.json();
    return data.people || [];
  }

  async function loadWorkout(path) {
    const tryPaths = [path];
    if (path.endsWith("/pat.json")) tryPaths.push("/workouts/me.json");
    for (const p of tryPaths) {
      const res = await fetch(asset(p), { cache: "no-store" });
      if (res.ok) return res.json();
    }
    throw new Error("NO ORDERS");
  }

  async function choose(id) {
    const person = state.people.find((p) => p.id === id);
    if (!person) return;
    paintAccent(person);
    state.person = person;
    state.error = null;
    state.workout = null;
    state.exerciseIndex = 0;
    state.setIndex = 0;
    state.restLeft = 0;
    state.paused = false;
    state.screen = "boot";
    render();
    try {
      state.workout = await loadWorkout(person.workout);
      state.screen = "briefing";
      bark(line(state.workout.voice, "welcome"));
    } catch (err) {
      state.error = err.message || "NO ORDERS";
      state.screen = "briefing";
    }
    render();
  }

  function begin() {
    if (!state.workout || !state.workout.exercises.length) return;
    clearTimers();
    const startWork = () => {
      if (!state.workout) return;
      state.screen = "work";
      state.exerciseIndex = 0;
      state.setIndex = 0;
      state.restLeft = 0;
      state.paused = false;
      render();
      speakTimer = setTimeout(() => {
        bark(state.workout.exercises[0] && state.workout.exercises[0].speakStart);
      }, 400);
    };
    bark(line(state.workout.voice, "start"));
    if (reducedMotion()) return startWork();
    state.screen = "splash";
    render();
    splashTimer = setTimeout(startWork, 1600);
  }

  function endRest() {
    state.screen = "work";
    state.restLeft = 0;
    state.paused = false;
    render();
    const exercise = state.workout.exercises[state.exerciseIndex];
    if (!exercise) return;
    if (state.setIndex === 0) {
      bark(line(state.workout.voice, "nextExercise"));
      speakTimer = setTimeout(() => {
        const ex = state.workout.exercises[state.exerciseIndex];
        bark(ex && ex.speakStart);
      }, 800);
      return;
    }
    const last = state.setIndex + 1 >= exercise.sets;
    bark(line(state.workout.voice, last ? "lastSet" : "nextSet"));
  }

  function startRestClock() {
    clearInterval(restTimer);
    restTimer = setInterval(() => {
      if (state.screen !== "rest" || state.paused) return;
      state.restLeft -= 1;
      if (state.restLeft <= 0) {
        clearInterval(restTimer);
        endRest();
        return;
      }
      render();
    }, 1000);
  }

  function completeSet() {
    const exercise = state.workout.exercises[state.exerciseIndex];
    if (!exercise) return;
    const lastSet = state.setIndex + 1 >= exercise.sets;
    const lastMove = state.exerciseIndex + 1 >= state.workout.exercises.length;
    clearTimers();
    if (lastSet && lastMove) {
      hush();
      bark(exercise.speakDone);
      speakTimer = setTimeout(() => bark(line(state.workout.voice, "complete")), 1100);
      state.screen = "done";
      state.paused = false;
      render();
      return;
    }
    if (lastSet) {
      bark(exercise.speakDone || line(state.workout.voice, "setDone"));
      state.screen = "rest";
      state.restLeft = exercise.restSec;
      state.exerciseIndex += 1;
      state.setIndex = 0;
      state.paused = false;
      render();
      startRestClock();
      speakTimer = setTimeout(() => bark(line(state.workout.voice, "rest")), 800);
      return;
    }
    bark(line(state.workout.voice, "setDone"));
    state.screen = "rest";
    state.restLeft = exercise.restSec;
    state.setIndex += 1;
    state.paused = false;
    render();
    startRestClock();
    speakTimer = setTimeout(() => {
      const ex = state.workout.exercises[state.exerciseIndex];
      bark((ex && ex.speakRest) || line(state.workout.voice, "rest"));
    }, 700);
  }

  function skipRest() {
    if (state.screen !== "rest") return;
    clearTimers();
    endRest();
  }

  function pauseToggle() {
    if (state.screen !== "work" && state.screen !== "rest") return;
    state.paused = !state.paused;
    if (state.paused) {
      hush();
      bark(line(state.workout.voice, "pause"));
    } else {
      bark(line(state.workout.voice, "resume"));
    }
    render();
  }

  function toggleMute() {
    state.muted = !state.muted;
    localStorage.setItem(MUTE_KEY, state.muted ? "1" : "0");
    if (state.muted) hush();
    render();
  }

  function iconVolume(muted) {
    return muted
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`;
  }

  function iconPause(paused) {
    return paused
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
  }

  function chrome() {
    const p = state.person;
    const switchBtn =
      p && state.screen !== "who"
        ? `<button class="ghost-btn" type="button" data-act="switch">SWITCH</button>`
        : "";
    return `<header class="chrome">
      <div class="brand">
        <p class="brand-title">${p && p.sarnt ? `SARN'T ${esc(p.sarnt)}` : "SARN'T"}</p>
        <p class="brand-sub">${p ? esc(p.name) : "REPORT"}</p>
      </div>
      <div class="chrome-actions">
        ${switchBtn}
        <button class="icon-btn" type="button" data-act="mute" aria-label="${state.muted ? "Unmute" : "Mute"}">${iconVolume(state.muted)}</button>
      </div>
    </header>`;
  }

  function viewWho() {
    const cards = state.people
      .map(
        (p) => `<a class="who-card" href="${BASE}/${p.id}/">
        <img src="${asset(p.splash || p.portrait)}" alt="" style="object-position:${p.focus || "50% 22%"}">
        <span class="shade"></span>
        <span class="bar" style="background:${p.accent}"></span>
        <span class="label">
          <span class="who-name" style="color:${p.accent}">${esc(p.name)}</span>
          <span class="who-meta">SARN'T ${esc(p.sarnt)} · /${esc(p.id)}</span>
        </span>
      </a>`,
      )
      .join("");
    return `<section class="screen who">
      <h1 class="display-xl">WHO IS<br>WORKING</h1>
      <p class="lede">Bookmark PAT or PAM. Next time you skip this screen.</p>
      ${state.error ? `<p class="error">${esc(state.error)}</p>` : ""}
      <div class="who-grid">${cards}</div>
    </section>`;
  }

  function viewBriefing() {
    const p = state.person;
    const w = state.workout;
    if (state.error || !w) {
      return `<section class="screen" style="padding:0 1rem">
        <h1 class="display-xl" style="color:var(--accent)">NO ORDERS</h1>
        <p class="lede">Morning file missing for ${esc((p && p.name) || "this recruit")}. The bot has not dropped today's workout yet.</p>
      </section>`;
    }
    const list = w.exercises
      .map(
        (ex, i) => `<li class="move">
        <span class="move-n">${String(i + 1).padStart(2, "0")}</span>
        <img src="${asset(ex.image)}" alt="">
        <div>
          <p class="move-name">${esc(ex.name)}</p>
          <p class="move-sets">${ex.sets} × ${esc(ex.reps)}</p>
        </div>
      </li>`,
      )
      .join("");
    return `<section class="screen">
      <div class="frame">
        <img class="hero" src="${asset(p.splash || p.portrait)}" alt="" style="object-position:${p.focus || "50% 22%"}">
        <div class="shade-bottom"></div>
        <div class="frame-copy">
          <p class="kicker">SARN'T ${esc(p.sarnt)} · ${esc(p.name)} · ${esc(w.date)}</p>
          <h1 class="title">${esc(w.title)}</h1>
        </div>
      </div>
      <p class="subtitle">${esc(w.subtitle)}</p>
      <p class="meta">${w.durationMin} MIN · ${w.exercises.length} MOVES</p>
      <ol class="moves">${list}</ol>
      <div class="sticky-cta"><button class="cta" type="button" data-act="begin">BEGIN</button></div>
    </section>`;
  }

  function viewSplash() {
    const p = state.person;
    const w = state.workout;
    return `<section class="splash">
      <img src="${asset(p.splash)}" alt="" style="object-position:${p.focus || "50% 22%"}">
      <div class="splash-shade"></div>
      <div class="splash-top">
        <p class="brand-title">SARN'T ${esc(p.sarnt)}</p>
        <p class="brand-sub">${esc(p.name)}</p>
      </div>
      <div class="splash-bot">
        <p class="kicker">${esc(w && w.date)}</p>
        <h1 class="title">${esc((w && w.title) || "MOVE")}</h1>
        <p class="subtitle" style="margin:0.5rem 0 0">MOVE</p>
      </div>
    </section>`;
  }

  function viewWork() {
    const w = state.workout;
    const ex = w.exercises[state.exerciseIndex];
    if (!ex) return "";
    const resting = state.screen === "rest";
    return `<section class="screen">
      <div class="frame">
        <img class="hero hero-sm" src="${asset(ex.image)}" alt="">
        <div class="shade-bottom"></div>
        <div class="badge">MOVE ${state.exerciseIndex + 1} / ${w.exercises.length}</div>
        ${state.paused ? `<div class="hold">HOLD</div>` : ""}
      </div>
      <div class="pad">
        <h1 class="work-title">${esc(ex.name)}</h1>
        <p class="cue">${esc(ex.cue)}</p>
      </div>
      <div class="stats">
        ${stat("SET", `${state.setIndex + 1}/${ex.sets}`)}
        ${stat("WORK", ex.reps)}
        ${stat(resting ? "REST" : "NEXT REST", resting ? `${state.restLeft}s` : `${ex.restSec}s`)}
      </div>
      ${
        resting
          ? `<div class="rest-wrap"><p class="rest-l">REST</p><p class="rest-n">${state.restLeft}</p></div>`
          : ""
      }
      <div class="row-btns">
        <button class="icon-btn" type="button" data-act="pause" aria-label="${state.paused ? "Resume" : "Pause"}">${iconPause(state.paused)}</button>
        <button class="cta" type="button" data-act="${resting ? "skip" : "done"}">${resting ? "SKIP REST" : "SET DONE"}</button>
      </div>
    </section>`;
  }

  function stat(label, value) {
    return `<div class="stat"><p class="stat-l">${esc(label)}</p><p class="stat-v">${esc(value)}</p></div>`;
  }

  function viewDone() {
    const p = state.person;
    const w = state.workout;
    return `<section class="screen done">
      <div class="frame bleed">
        <img class="hero hero-sm" src="${asset(p.splash)}" alt="" style="object-position:${p.focus || "50% 22%"}">
        <div class="shade-bottom"></div>
      </div>
      <p class="kicker" style="margin-top:1.5rem">SARN'T ${esc(p.sarnt)} · ${esc(p.name)} · ${esc(w && w.date)}</p>
      <h1 class="title">DISMISSED</h1>
      <p class="done-copy">${esc((w && w.voice.script.complete) || "")}</p>
      <div class="stack">
        <button class="cta" type="button" data-act="begin">RUN IT AGAIN</button>
        <button class="ghost-btn" type="button" data-act="switch" style="min-height:3rem">SWITCH RECRUIT</button>
      </div>
    </section>`;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, (ch) => {
      if (ch === "&") return String.fromCharCode(38) + "amp;";
      if (ch === "<") return String.fromCharCode(38) + "lt;";
      if (ch === ">") return String.fromCharCode(38) + "gt;";
      return String.fromCharCode(38) + "quot;";
    });
  }

  function render() {
    const root = document.getElementById("app");
    let body = "";
    if (state.screen === "who") body = viewWho();
    else if (state.screen === "splash") body = viewSplash();
    else if (state.screen === "briefing" || state.screen === "boot") body = viewBriefing();
    else if (state.screen === "work" || state.screen === "rest") body = viewWork();
    else if (state.screen === "done") body = viewDone();
    root.innerHTML = (state.screen === "splash" ? "" : chrome()) + body;
  }

  document.getElementById("app").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.getAttribute("data-act");
    if (act === "mute") toggleMute();
    if (act === "switch") go("/");
    if (act === "begin") begin();
    if (act === "done") completeSet();
    if (act === "skip") skipRest();
    if (act === "pause") pauseToggle();
  });

  async function boot() {
    loadVoices();
    try {
      state.people = await loadPeople();
    } catch {
      state.error = "NO ROSTER";
      render();
      return;
    }
    const wanted = resolveWho(detectWho(), state.people);
    if (wanted) {
      await choose(wanted);
      return;
    }
    paintAccent(null);
    state.screen = "who";
    render();
  }

  boot();
})();
