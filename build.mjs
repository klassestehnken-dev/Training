// Baut die App zu einer einzigen index.html (CSS + JS eingebettet) im Projektordner.
// GitHub Pages liefert diesen Ordner direkt aus.
import { build } from "esbuild";
import { execSync } from "node:child_process";
import fs from "node:fs";

fs.mkdirSync(".build", { recursive: true });
execSync("npx tailwindcss -c tailwind.config.cjs -i src/in.css -o .build/app.css --minify", { stdio: "inherit" });
await build({
  entryPoints: ["src/main.jsx"],
  bundle: true,
  minify: true,
  format: "iife",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  outfile: ".build/app.js",
  logLevel: "warning",
});
const css = fs.readFileSync(".build/app.css", "utf8");
const js = fs.readFileSync(".build/app.js", "utf8").replace(/<\/script/g, "<\\/script");
const html = fs
  .readFileSync("src/index.template.html", "utf8")
  .replace("/*__CSS__*/", () => css)
  .replace("/*__JS__*/", () => js);
fs.writeFileSync("index.html", html);

// Neue Cache-Version, damit die App auf dem Handy das Update sicher lädt
const sw = fs.readFileSync("sw.js", "utf8").replace(/const CACHE = "[^"]+";/, `const CACHE = "training-${Date.now()}";`);
fs.writeFileSync("sw.js", sw);
console.log(`Fertig: index.html (${Math.round(html.length / 1024)} KB), sw.js aktualisiert`);
