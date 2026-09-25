// Local production-bundle preview with the same SPA fallback required in hosting.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(process.env.BENTO_WEB_DIR || "dist");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".wav": "audio/wav",
  ".txt": "text/plain; charset=utf-8",
};
if (!fs.existsSync(path.join(root, "index.html")))
  throw new Error("Run npm run build:web first.");
http
  .createServer((req, res) => {
    let file;
    try {
      file = path.resolve(
        root,
        "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
      );
    } catch {
      res.writeHead(400).end("Invalid path");
      return;
    }
    if (!file.startsWith(root + path.sep) && file !== root) {
      res.writeHead(403).end();
      return;
    }
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      if (path.extname(file)) {
        res.writeHead(404).end("Not found");
        return;
      }
      file = path.join(root, "index.html");
    }
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    fs.createReadStream(file).pipe(res);
  })
  .listen(Number(process.env.PORT || 8082), "127.0.0.1", () =>
    console.log(
      `Production preview: http://localhost:${process.env.PORT || 8082}`,
    ),
  );
