(() => {
  const [, basename] = /([^/]*).html$/.exec(location.pathname);
  const mode = new URLSearchParams(location.search).get("mode");
  let url;
  if (mode && mode.toLowerCase() === "compiled") {
    url = new URL(location.origin);
    if (basename === "chunks") {
      url.pathname = "/build/chunks/chunks.js";
    } else {
      url.pathname = `/build/${basename}.js`;
    }
  } else {
    const params = new URLSearchParams();
    params.set("id", basename);
    if (mode) {
      params.set("mode", mode.toUpperCase());
    } else {
      params.set("mode", "RAW");
    }
    url = new URL("http://localhost:9810/compile");
    // url = new URL("https://localhost:9810/compile");
    url.search = params.toString();
  }
  document.write(`<script src="${url}"></script>`);
  const h1 = document.querySelector("h1");
  h1.textContent = `${h1.textContent} (${mode.toUpperCase()} mode)`;
})();
