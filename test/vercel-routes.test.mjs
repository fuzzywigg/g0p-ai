import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));

function matchRoute(path) {
  for (const route of config.routes) {
    const match = new RegExp(route.src).exec(path);
    if (!match) continue;
    const dest = route.dest.replace(/\$(\d+)/g, (_, index) => match[Number(index)] ?? "");
    return { dest, headers: route.headers ?? null, src: route.src };
  }
  return null;
}

test("audio and js files are static routes ahead of the spa rewrite", () => {
  assert.deepEqual(
    config.builds.map((build) => build.src),
    ["index.html", "audio/*", "js/**"],
  );
  assert.ok(config.builds.every((build) => build.use === "@vercel/static"));

  const catchAll = config.routes[config.routes.length - 1];
  assert.deepEqual(catchAll, { src: "/(.*)", dest: "/index.html" });
  assert.ok(config.routes.slice(0, -1).every((route) => route.src.startsWith("/audio/") || route.src.startsWith("/js/")));

  const mp3 = matchRoute("/audio/0006.mp3");
  assert.equal(mp3.dest, "/audio/0006.mp3");
  assert.equal(mp3.headers["Content-Type"], "audio/mpeg");

  const manifest = matchRoute("/audio/manifest.json");
  assert.equal(manifest.dest, "/audio/manifest.json");
  assert.equal(manifest.headers["Content-Type"], "application/json");

  for (const path of ["/js/glyph-stage.mjs", "/js/fables/0006.mjs"]) {
    const hit = matchRoute(path);
    assert.equal(hit.dest, path, path);
    assert.match(hit.headers["Content-Type"], /javascript/, path);
  }

  for (const path of ["/", "/0006", "/episodes/0006", "/index.html"]) {
    const hit = matchRoute(path);
    assert.equal(hit.dest, "/index.html", path);
    assert.equal(hit.headers, null, path);
  }
});

test("npm build copies the audio directory into the static output", () => {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.match(pkg.scripts.build, /public\/audio/);
  assert.match(pkg.scripts.build, /audio\/\./);
  assert.match(pkg.scripts.build, /index\.html/);
  assert.match(pkg.scripts.build, /public\/js/);
});
