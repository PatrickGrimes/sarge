const WORKOUT_URL = new URL("workout.json", window.location.href).toString();
const STORE = "sarnt-state-v1";

const $ = (id) => document.getElementById(id);
const screens = {
  wait: $("screen-wait"),
  ready: $("screen-ready"),
  work: $("screen-work"),
  done: $("screen-done"),
};

let workout = null;
let index = 0;
let phase = "exercise"; // exercise | rest
let muted = false;
let timer = null;
let remainingMs = 0;
let durationMs = 0;
let midSpoken = false;
let wakeLock = null;

function show(name) {
  Object.values(screens).forEach((el) => el.classList.remove("on"));
  screens[name].classList.add("on");
}

function todayStamp() {
  const d = new Date();
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORE) || "{}");
  } catch {
    return {};
  }
}

function saveState(extra = {}) {
  const prev = loadState();
  localStorage.setItem(STORE, JSON.stringify({ ...prev, muted, index, phase, workout, ...extra }));
}

function speak(text, opts = {}) {
  if (!text || muted || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  const vcfg = (workout && workout.voice) || {};
  u.lang = vcfg.lang || "en-GB";
  u.rate = vcfg.rate ?? 1.2;
  u.pitch = vcfg.pitch ?? 0.65;
  u.volume = vcfg.volume ?? 1;
  const voices = speechSynthesis.getVoices() || [];
  const isFemale = (v) =>
    /female|woman|girl|samantha|serena|karen|moira|kate|martha|hazel|susan|victoria|fiona|tessa|zira|ava/i.test(v.name);
  const isMale = (v) =>
    !isFemale(v) &&
    /\b(male|daniel|arthur|george|brian|rishi|thomas|david|alex|fred)\b|uk english male|microsoft george/i.test(v.name);
  const gb = voices.filter((v) => /en-GB/i.test(v.lang));
  const pick =
    gb.find(isMale) ||
    gb.find((v) => !isFemale(v)) ||
    voices.find(isMale) ||
    voices.find((v) => !isFemale(v) && /^en/i.test(v.lang));
  if (pick) u.voice = pick;
  if (!opts.queue) speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

function formatTime(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function currentExercise() {
  return workout && workout.exercises[index];
}

function progressLabel() {
  return `${index + 1} / ${workout.exercises.length}`;
}

function setBar() {
  const pct = workout ? ((index + (phase === "rest" ? 1 : 0)) / workout.exercises.length) * 100 : 0;
  $("workBar").style.width = `${Math.min(100, pct)}%`;
}

async function lockScreen() {
  try {
    if (navigator.wakeLock) wakeLock = await navigator.wakeLock.request("screen");
  } catch {
    /* phones may deny */
  }
}

function buzz() {
  if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
}

function validate(data) {
  if (!data || data.schemaVersion !== 1 || !Array.isArray(data.exercises) || !data.exercises.length) {
    throw new Error("No usable workout in workout.json");
  }
  data.exercises.forEach((ex, i) => {
    if (!ex.name || !ex.instruction || !["timed", "reps"].includes(ex.type)) {
      throw new Error(`Exercise ${i + 1} is missing name, instruction, or type`);
    }
    if (ex.type === "timed" && !(ex.durationSeconds > 0)) throw new Error(`Exercise ${i + 1} needs durationSeconds`);
    if (ex.type === "reps" && !(ex.reps > 0)) throw new Error(`Exercise ${i + 1} needs reps`);
  });
}

async function fetchWorkout({ force } = {}) {
  $("waitEyebrow").textContent = "FETCHING TODAY";
  $("waitTitle").textContent = "STAND BY";
  $("waitCopy").textContent = "SARN'T IS COLLECTING THIS MORNING'S ORDERS.";
  show("wait");
  try {
    const res = await fetch(`${WORKOUT_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Could not read workout.json (${res.status})`);
    const data = await res.json();
    validate(data);
    const cached = loadState();
    const sameFile = cached.workout && JSON.stringify(cached.workout) === JSON.stringify(data);
    workout = data;
    if (!force && sameFile && cached.workout.date === data.date && typeof cached.index === "number") {
      index = cached.index;
      phase = cached.phase || "exercise";
    } else {
      index = 0;
      phase = "exercise";
    }
    saveState();
    renderReady();
  } catch (err) {
    const cached = loadState();
    if (cached.workout && cached.workout.date === todayStamp()) {
      workout = cached.workout;
      index = cached.index || 0;
      phase = cached.phase || "exercise";
      renderReady();
      $("statusLine").textContent = "OFFLINE COPY";
      return;
    }
    $("waitEyebrow").textContent = "WAITING ON SARN'T";
    $("waitTitle").textContent = "NO ORDERS";
    $("waitCopy").textContent = err.message + ". When the GrokBot writes workout.json to this repo, open the app again.";
    show("wait");
  }
}

function renderReady() {
  const stale = workout.date && workout.date !== todayStamp();
  $("readyMeta").textContent = `${workout.date || "NO DATE"}  ·  ${workout.exercises.length} MOVEMENTS${stale ? "  ·  NOT TODAY" : ""}`;
  $("readyTitle").textContent = workout.title || "WORKOUT";
  $("readyIntro").textContent = workout.intro || workout.subtitle || "";
  $("statusLine").textContent = stale ? "OLD FILE" : "READY";
  show("ready");
}

function renderExercise() {
  const ex = currentExercise();
  if (!ex) return renderDone();
  phase = "exercise";
  $("workProgress").textContent = progressLabel();
  $("workName").textContent = ex.name;
  $("workCopy").textContent = ex.instruction;
  setBar();
  if (ex.type === "timed") {
    remainingMs = ex.durationSeconds * 1000;
    durationMs = remainingMs;
    midSpoken = false;
    $("workTimer").hidden = false;
    $("workReps").hidden = true;
    $("workTimer").textContent = formatTime(remainingMs);
    $("mainBtn").textContent = "START";
  } else {
    $("workTimer").hidden = true;
    $("workReps").hidden = false;
    $("workReps").textContent = `${ex.reps} REPS`;
    $("mainBtn").textContent = "DONE ✓";
  }
  $("skipBtn").textContent = "SKIP";
  show("work");
  saveState();
}

function renderRest(seconds, cue) {
  phase = "rest";
  remainingMs = seconds * 1000;
  durationMs = remainingMs;
  $("workProgress").textContent = "REST";
  $("workName").textContent = "REST";
  $("workCopy").textContent = cue || "REST.";
  $("workTimer").hidden = false;
  $("workReps").hidden = true;
  $("workTimer").textContent = formatTime(remainingMs);
  $("mainBtn").textContent = "SKIP REST";
  $("skipBtn").textContent = "SKIP REST";
  show("work");
  speak(cue || "REST.");
  startCountdown({ rest: true });
}

function renderDone() {
  clearInterval(timer);
  timer = null;
  $("doneCopy").textContent = workout.completion || "WORKOUT COMPLETE.";
  $("statusLine").textContent = "DONE";
  show("done");
  speak(workout.completion || "WORKOUT COMPLETE.");
  saveState({ index: workout.exercises.length, phase: "done" });
}

function startCountdown({ rest } = {}) {
  clearInterval(timer);
  const started = Date.now();
  const initial = remainingMs;
  timer = setInterval(() => {
    remainingMs = initial - (Date.now() - started);
    $("workTimer").textContent = formatTime(remainingMs);
    const ex = currentExercise();
    if (!rest && ex && ex.midCue && !midSpoken && remainingMs <= durationMs / 2) {
      midSpoken = true;
      speak(ex.midCue);
    }
    if (remainingMs <= 0) {
      clearInterval(timer);
      timer = null;
      $("workTimer").textContent = "0:00";
      buzz();
      if (rest) advance();
      else finishTimed();
    }
  }, 200);
}

function finishTimed() {
  const ex = currentExercise();
  speak((ex && ex.endCue) || "TIME.");
  setTimeout(() => goRestOrNext(), 1100);
}

function goRestOrNext() {
  const ex = currentExercise();
  const rest = ex && ex.restAfterSeconds > 0 ? ex.restAfterSeconds : 0;
  if (phase === "exercise" && rest) renderRest(rest, ex.restCue);
  else advance();
}

function advance() {
  index += 1;
  phase = "exercise";
  if (!currentExercise()) renderDone();
  else {
    renderExercise();
    speak(currentExercise().instruction);
  }
}

function onMain() {
  const ex = currentExercise();
  if (phase === "rest") {
    clearInterval(timer);
    timer = null;
    advance();
    return;
  }
  if (!ex) return;
  if (ex.type === "timed") {
    if (timer) {
      clearInterval(timer);
      timer = null;
      $("mainBtn").textContent = "START";
      return;
    }
    speak(ex.startCue || "START THE CLOCK.");
    $("mainBtn").textContent = "PAUSE";
    lockScreen();
    startCountdown();
  } else {
    speak(ex.completeCue || "DONE. NEXT.");
    goRestOrNext();
  }
}

function onSkip() {
  if (!confirm("Skip this bit?")) return;
  clearInterval(timer);
  timer = null;
  if (phase === "rest") advance();
  else goRestOrNext();
}

function applyMute() {
  $("muteBtn").textContent = muted ? "🔇" : "🔊";
  if (muted && "speechSynthesis" in window) speechSynthesis.cancel();
  saveState();
}

$("beginBtn").addEventListener("click", () => {
  speak(workout.intro || "WORKOUT LOADED. BEGIN WHEN READY.");
  if (index >= workout.exercises.length) {
    index = 0;
    phase = "exercise";
  }
  renderExercise();
  setTimeout(() => speak(currentExercise().instruction), 1600);
});
$("mainBtn").addEventListener("click", onMain);
$("skipBtn").addEventListener("click", onSkip);
$("retryBtn").addEventListener("click", () => fetchWorkout({ force: true }));
$("refreshBtn").addEventListener("click", () => fetchWorkout({ force: true }));
$("reloadBtn").addEventListener("click", () => fetchWorkout({ force: true }));
$("againBtn").addEventListener("click", () => {
  index = 0;
  phase = "exercise";
  saveState();
  renderReady();
});
$("muteBtn").addEventListener("click", () => {
  muted = !muted;
  applyMute();
});

if ("speechSynthesis" in window) speechSynthesis.onvoiceschanged = () => {};

muted = !!loadState().muted;
applyMute();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

fetchWorkout();
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && !workout) fetchWorkout();
});
