(() => {
  const MUTE_KEY = "sarnt-mute";
  const ALIASES = { me: "pat", pat: "pat", pam: "pam" };
  function detectBase() {
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts[0] === "sarge") return "/sarge";
    return "";
  }
  const BASE = detectBase();
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/gh/PatrickGrimes/sarge@7548ad1b117706c5f1f86ec4093cb1c2fa9d2aed/app.js";
  s.onload = function () { console.log("[sarnt] loaded core"); };
  document.body.appendChild(s);
})();
