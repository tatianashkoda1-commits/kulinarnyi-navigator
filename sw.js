// Навигатор: один сервис-воркер на приложение и все книги (основа — сервис-воркер «Моей полки» ХулиФуда).
// Приложение кешируется при установке; книга — целиком по кнопке «На полку»; видео отдаются из кеша нарезкой 206 (иначе на iPhone офлайн не играет).
const C = "nav-v6";
const SHELL = ["./", "index.html", "app.js", "app.css", "inbook.js", "inbook.css", "manifest.webmanifest", "data.json", "files.json", "img/logo.png", "img/logo-light.png", "img/icon-192.png", "img/icon-512.png"];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(SHELL))); });
self.addEventListener("activate", e => e.waitUntil((async () => { for (const k of await caches.keys()) if (k !== C) await caches.delete(k); await self.clients.claim(); })()));
const tell = async m => { for (const c of await self.clients.matchAll({ includeUncontrolled: true })) c.postMessage(m); };
async function saveBook(slug, urls) {
  const c = await caches.open(C); const have = new Set((await c.keys()).map(r => r.url));
  const todo = urls.filter(u => !have.has(new URL(u, self.registration.scope).href)); let done = urls.length - todo.length, i = 0, n = 0;
  tell({ type: "progress", slug, done, total: urls.length });
  const worker = async () => { while (i < todo.length) { const u = todo[i++];
    try { const r = await fetch(u, { signal: AbortSignal.timeout(180000) }); if (r.ok) { await c.put(u, r); done++; } } catch (_) {}
    if (++n % 6 === 0) tell({ type: "progress", slug, done, total: urls.length }); } };
  await Promise.all(Array.from({ length: 6 }, worker));
  tell({ type: "progress", slug, done, total: urls.length });
}
async function missing(urls) { const c = await caches.open(C); const have = new Set((await c.keys()).map(r => r.url)); return urls.filter(u => !have.has(new URL(u, self.registration.scope).href)).length; }
self.addEventListener("message", e => {
  const m = e.data || {};
  if (m.type === "book") e.waitUntil(saveBook(m.slug, m.urls));
  if (m.type === "status") e.waitUntil((async () => { const out = {}; for (const [s, u] of Object.entries(m.books)) out[s] = await missing(u); tell({ type: "status", missing: out }); })());
});
async function ranged(req, full) {
  const buf = await full.arrayBuffer(); const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get("range") || "");
  const start = m && m[1] ? +m[1] : 0, end = m && m[2] ? +m[2] : buf.byteLength - 1;
  return new Response(buf.slice(start, end + 1), { status: 206, headers: { "Content-Type": full.headers.get("Content-Type") || "video/mp4",
    "Content-Range": `bytes ${start}-${end}/${buf.byteLength}`, "Content-Length": String(end - start + 1), "Accept-Ranges": "bytes" } });
}
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = req.url.split("#")[0];
  if (new URL(url).origin !== self.location.origin && !/fonts\.(googleapis|gstatic)\.com/.test(url)) return;
  if (req.headers.has("range")) {
    e.respondWith((async () => { const c = await caches.open(C); const full = await c.match(url); return full ? ranged(req, full) : fetch(req); })());
    return;
  }
  if (req.mode === "navigate") {
    const fresh = fetch(req, { cache: "no-store" }).then(r => { if (r.ok) { const cp = r.clone(); caches.open(C).then(c => c.put(url, cp)); } return r; });
    e.respondWith((async () => {
      const hit = (await caches.match(url, { ignoreSearch: true })) || (await caches.match(url.replace(/\/?$/, "/index.html")));
      if (hit) { const quick = await Promise.race([fresh.catch(() => null), new Promise(r => setTimeout(() => r(null), 1500))]); if (quick && quick.ok) return quick; e.waitUntil(fresh.catch(() => {})); return hit; }
      try { return await fresh; } catch (_) { return (await caches.match("index.html")) || Response.error(); }
    })());
    return;
  }
  // код приложения и data.json — сначала сеть (свежая версия), без сети из кеша; остальное — кеш, иначе сеть
  if (/data\.json|files\.json|\/(app\.js|app\.css|inbook\.js|inbook\.css|manifest\.webmanifest)(\?.*)?$/.test(url)) { e.respondWith(fetch(req, { cache: "no-store" }).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(url, cp)); return r; }).catch(() => caches.match(url, { ignoreSearch: true }))); return; }
  e.respondWith(caches.match(url).then(hit => (hit && hit.ok) ? hit : fetch(req).then(r => { if (r.ok && !/\.mp4$/.test(url)) { const cp = r.clone(); caches.open(C).then(c => c.put(url, cp)); } return r; })).catch(() => fetch(req)));
});
