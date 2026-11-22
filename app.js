// Кулинарный навигатор — прототип. Всё хранится в телефоне (localStorage "nav1"), сервера нет.
const KEY = "nav1";
const PLANS = {
  shelf:   { t: "Одна полка", p: "690 ₽", plus: false, two: false, d: "Книги одной полки, все конструкторы, заметки, закладки, офлайн, общение" },
  plus:    { t: "Одна полка с фишками", p: "990 ₽", plus: true, two: false, d: "+ видео полки, мои меню и план, список покупок, свои книги и обмен" },
  two:     { t: "Две полки", p: "1 380 ₽", plus: false, two: true, d: "Обе полки и все конструкторы, без фишек" },
  twoplus: { t: "Две полки с фишками", p: "1 680 ₽", plus: true, two: true, d: "Всё сразу. Фишки оплачиваются один раз" },
};
const SHELF = { cook: "Кулинария", pastry: "Кондитерка" };
const BUILDERS = [
  { t: "Конструктор трайфлов", d: "Собери свой трайфл из слоёв, получи рецепт и картинку", url: "https://xplanet-trifle-test-production.up.railway.app/", live: true, img: "books/rozhdestvo/img/06-hero.jpg" },
  { t: "Конструктор пиццы", d: "Тесто, соус, начинки — и твоя пицца с рецептом", url: "https://xplanet-trifle-test-production.up.railway.app/pizza/", live: true, img: "books/novyi-god/img/03-hero.jpg" },
  { t: "Кукисы", d: "В следующей партии", live: false },
  { t: "Моти-мороженое", d: "В следующей партии", live: false },
];
const SOON_PASTRY = [["Торты", 560], ["Пирожные и десерты", 443], ["Конфеты и шоколад", 126], ["Печенье и пряники", 79]];
const VIDEO_CATS = { cook: [["Колбасы и мясные деликатесы", 143], ["Пироги, хлеб, лепёшки", 131], ["Горячее мясо", 127], ["Закуски", 98], ["Напитки и коктейли", 65], ["Салаты", 59], ["Супы", 53]],
                     pastry: [["Торты", 560], ["Пирожные и десерты", 443], ["Конфеты и шоколад", 126], ["Печенье и пряники", 79]] };

let S = load(), D = { books: [], recipes: [] }, F = {}, R = {}, dl = {};
function load() { try { return Object.assign(def(), JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (_) { return def(); } }
function def() { return { plan: "plus", main: "cook", tab: "cook", saved: {}, bm: [], notes: {}, menus: [], shopDone: {}, chat: [], wall: [] }; }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) { toast("Память телефона заполнена"); } }
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function toast(t) { const el = $("#toast"); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => el.hidden = true, 2600); }
const plan = () => PLANS[S.plan];
const hasShelf = sh => plan().two || S.main === sh;
const bookOf = slug => D.books.find(b => b.slug === slug);
const recUrl = r => `books/${r.book}/#${r.rid}`;

function sheet(html) { const s = $("#sheet"); s.innerHTML = `<div class="box">${html}</div>`; s.hidden = false; s.onclick = e => { if (e.target === s) s.hidden = true; }; }
const closeSheet = () => $("#sheet").hidden = true;

// ——— тариф (для прототипа переключается вручную)
function planBtn() { $("#planBtn").textContent = "Тариф: " + plan().p; }
$("#planBtn").onclick = () => {
  sheet(`<h3>Тариф (в прототипе — переключатель)</h3><div class="opt">${Object.entries(PLANS).map(([k, p]) =>
    `<button data-p="${k}" class="${k === S.plan ? "on" : ""}"><b>${p.t} — ${p.p} в месяц</b><small>${p.d}</small></button>`).join("")}</div>
    <h3 style="margin-top:16px">Моя полка, если одна</h3><div class="seg">${Object.entries(SHELF).map(([k, t]) => `<button data-m="${k}" class="${S.main === k ? "on" : ""}">${t}</button>`).join("")}</div>
    <p class="note">В настоящем приложении тариф выбирается при оплате. Здесь можно переключать, чтобы посмотреть, что открывается в каждом.</p>`);
  $("#sheet").querySelectorAll("[data-p]").forEach(b => b.onclick = () => { S.plan = b.dataset.p; save(); planBtn(); closeSheet(); route(); });
  $("#sheet").querySelectorAll("[data-m]").forEach(b => b.onclick = () => { S.main = b.dataset.m; save(); closeSheet(); route(); });
};

// ——— экраны
function vShelves() {
  const sh = S.tab, own = hasShelf(sh);
  const books = D.books.filter(b => b.shelf === sh);
  let h = `<h1>Полки</h1><p class="sub">Живые книги шефов: текст и короткие видео шагов. Книга на полке работает без интернета.</p>
    <div class="seg">${Object.entries(SHELF).map(([k, t]) => `<button data-sh="${k}" class="${k === sh ? "on" : ""}">${t}</button>`).join("")}</div>`;
  if (!own) h += `<div class="lock"><b>Эта полка не входит в ваш тариф</b>Вторая полка — ещё 690 ₽ в месяц, фишки повторно не оплачиваются. <button class="btn sm" id="addShelf" style="margin-top:8px">Посмотреть тарифы</button></div>`;
  const m = sh === "cook" ? bookOf("novyi-god") : bookOf("rozhdestvo");
  if (m) h += `<a class="card month" href="books/${m.slug}/"><img src="img/${m.slug}.jpg" alt=""><div class="in"><span class="pill">Книга месяца</span><h2 style="margin:8px 0 2px">${esc(m.title)}</h2><span class="note">${esc(m.who)} · ${m.n} рецептов</span></div></a>`;
  h += `<h2>Все книги</h2><div class="grid">${books.map(card).join("")}`;
  if (sh === "pastry") h += SOON_PASTRY.map(([t, n]) => `<div class="book soon"><div class="ph">Готовится</div><div class="bt"><b>${t}</b><small>${n} рецептов в архиве</small></div></div>`).join("");
  h += `</div><p class="proto">Прототип Кулинарного навигатора · данные хранятся только в этом телефоне</p>`;
  $("#view").innerHTML = h;
  $("#view").querySelectorAll("[data-sh]").forEach(b => b.onclick = () => { S.tab = b.dataset.sh; save(); vShelves(); });
  const a = $("#addShelf"); if (a) a.onclick = () => $("#planBtn").click();
  $("#view").querySelectorAll("[data-dl]").forEach(b => b.onclick = () => saveBook(b.dataset.dl));
  refreshStatus();
}
function card(b) {
  const st = S.saved[b.slug] ? (dl[b.slug] && dl[b.slug] < 100 ? `<button class="dl" disabled>Загрузка ${dl[b.slug]}%</button>` : `<button class="dl ok" disabled>✓ На полке, без интернета</button>`)
    : `<button class="dl" data-dl="${b.slug}">↓ На полку · ${b.mb} МБ</button>`;
  return `<div class="book"><a class="cv" href="books/${b.slug}/"><img src="img/${b.slug}.jpg" alt="" loading="lazy"><div class="bt"><b>${esc(b.title)}</b><small>${esc(b.who)} · ${b.n} рецептов</small></div></a><div class="st" data-st="${b.slug}">${st}</div></div>`;
}

function vBuilders() {
  $("#view").innerHTML = `<h1>Конструкторы</h1><p class="sub">Партия этого месяца. Конструкторы открыты в любом тарифе, каждый месяц приходит новая партия.</p>
    <div class="list">${BUILDERS.map(b => b.live
      ? `<a class="li" href="${b.url}" target="_blank" rel="noopener"><img src="${b.img}" alt=""><div class="t"><b>${b.t}</b><small>${b.d}</small></div><span class="pill">Открыть</span></a>`
      : `<div class="li soon"><div class="t"><b>${b.t}</b><small>${b.d}</small></div><span class="pill o">Скоро</span></div>`).join("")}</div>
    <p class="note" style="margin-top:14px">Конструкторы открываются в новой вкладке. Картинка блюда от ИИ генерируется по коду доступа команды.</p>`;
}

function vVideo() {
  let h = `<h1>Видео</h1><p class="sub">Видеоархив уроков, по полкам. Смотрится при интернете.</p>`;
  if (!plan().plus) { $("#view").innerHTML = h + `<div class="lock"><b>Видеоархив входит в «фишки»</b>Одна полка с фишками — 990 ₽ в месяц. <button class="btn sm" id="up" style="margin-top:8px">Посмотреть тарифы</button></div>`; $("#up").onclick = () => $("#planBtn").click(); return; }
  const sh = S.tab;
  h += `<div class="seg">${Object.entries(SHELF).map(([k, t]) => `<button data-sh="${k}" class="${k === sh ? "on" : ""}">${t}</button>`).join("")}</div>`;
  if (!hasShelf(sh)) h += `<div class="lock"><b>Эта полка не в вашем тарифе</b>Видео открываются для ваших полок.</div>`;
  const demo = D.recipes.filter(r => r.shelf === sh && r.steps).slice(0, 4);
  h += `<h2>Примеры из уроков</h2><div class="grid">${demo.map(r => `<div class="book"><video src="books/${r.book}/clips/${r.rid.slice(1)}-1.mp4" muted loop playsinline preload="none" controls style="width:100%;aspect-ratio:1/1;object-fit:cover;background:#000"></video><div class="bt"><b>${esc(r.title)}</b><small>${esc(bookOf(r.book).title)}</small></div></div>`).join("")}</div>
    <h2>Разделы архива</h2><div class="list">${VIDEO_CATS[sh].map(([t, n]) => `<div class="li"><div class="t"><b>${t}</b><small>${n} уроков · переносятся из архива клуба</small></div><span class="pill o">Скоро</span></div>`).join("")}</div>`;
  $("#view").innerHTML = h;
  $("#view").querySelectorAll("[data-sh]").forEach(b => b.onclick = () => { S.tab = b.dataset.sh; save(); vVideo(); });
}

const SEED = [
  { a: "А", who: "Участница", t: "Сделала котлеты по ГОСТу из книги. Муж просит ещё! Фото на стене 🙂" },
  { a: "М", who: "Участница", t: "А фарш через мясорубку или блендером?" },
  { a: "А", who: "Участница", t: "Блендером, как в шаге 3 — там видно, какая должна быть консистенция." },
  { a: "М", who: "Модератор", mod: true, t: "В пятницу тема стены работ — рождественская выпечка. Ждём ваши фото!" },
];
function vChat() {
  const wall = [...S.wall, "img/kotlety.jpg", "img/rozhdestvo.jpg", "img/rulety.jpg"].slice(0, 9);
  $("#view").innerHTML = `<h1>Общение</h1>
    <div class="lock" style="background:#fff;border-color:var(--line)">Здесь общаются участники, порядок держит модератор. <b style="display:inline">Ответы шефов и кураторов — в клубе Планета Х.</b></div>
    <h2>Стена работ недели</h2><div class="wall">${wall.map(s => `<img src="${s}" alt="Работа участницы">`).join("")}</div>
    <div class="row" style="margin-top:8px"><label class="btn ghost sm">+ Моё фото<input type="file" accept="image/*" id="ph" hidden></label></div>
    <h2>Чат участников</h2><div id="msgs">${[...SEED, ...S.chat].map(m => `<div class="msg${m.me ? " me" : ""}${m.mod ? " mod" : ""}">${m.me ? "" : `<span class="av">${m.a}</span>`}<div class="bb"><small>${m.me ? "Вы" : m.who}</small>${esc(m.t)}</div></div>`).join("")}</div>
    <form class="compose" id="cf"><input id="ci" placeholder="Написать участникам…" aria-label="Сообщение"><button class="btn" type="submit">→</button></form>
    <p class="note" style="margin-top:8px">В прототипе ваши сообщения и фото видны только на этом телефоне.</p>`;
  $("#cf").onsubmit = e => { e.preventDefault(); const t = $("#ci").value.trim(); if (!t) return; S.chat.push({ me: true, t }); save(); vChat(); };
  $("#ph").onchange = e => { const f = e.target.files[0]; if (!f) return; const img = new Image(); img.onload = () => {
    const c = document.createElement("canvas"), k = Math.min(1, 500 / Math.max(img.width, img.height)); c.width = img.width * k; c.height = img.height * k;
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); S.wall.unshift(c.toDataURL("image/jpeg", .75)); S.wall = S.wall.slice(0, 6); save(); vChat(); };
    img.src = URL.createObjectURL(f); };
}

function vMy(sub) {
  sub = sub || "books";
  let h = `<h1>Моя полка</h1><div class="seg">${[["books", "Книги"], ["menus", "Меню"], ["bm", "Закладки"], ["notes", "Заметки"]].map(([k, t]) => `<a href="#my/${k}" class="${k === sub ? "on" : ""}" style="text-decoration:none;display:flex;align-items:center;justify-content:center;min-height:42px;border-radius:20px;font-weight:700;${k === sub ? "background:var(--terra);color:#fff" : "color:var(--ink2)"}">${t}</a>`).join("")}</div>`;
  if (sub === "books") {
    const mine = D.books.filter(b => S.saved[b.slug]);
    h += mine.length ? `<div class="grid">${mine.map(card).join("")}</div>` : `<div class="empty">Пока пусто. На вкладке «Полки» нажмите «На полку» у книги — она сохранится в телефоне и будет работать без интернета.</div>`;
  }
  if (sub === "menus") {
    if (!plan().plus) h += `<div class="lock"><b>Мои меню и список покупок — в «фишках»</b>Одна полка с фишками — 990 ₽. <button class="btn sm" id="up" style="margin-top:8px">Посмотреть тарифы</button></div>`;
    else {
      h += `<div class="list">${S.menus.map(m => `<a class="li" href="#menu/${m.id}"><div class="t"><b>${esc(m.title)}</b><small>${m.items.length} блюд</small></div><span class="pill o">Открыть</span></a>`).join("") || `<div class="empty">Меню пока нет. Соберите меню к празднику: в любой книге у рецепта есть кнопка «+ В меню».</div>`}</div>
        <div class="row" style="margin-top:12px"><button class="btn" id="newMenu">+ Новое меню</button><button class="btn ghost" id="readyMenu">Готовое меню от Тианы</button></div>`;
    }
  }
  if (sub === "bm") {
    const rs = S.bm.map(id => R[id]).filter(Boolean);
    h += rs.length ? `<div class="list">${rs.map(r => li(r, `<button class="x" data-unbm="${r.id}" aria-label="Убрать">×</button>`)).join("")}</div>` : `<div class="empty">Закладок нет. В книге нажмите «☆ Закладка» у рецепта.</div>`;
  }
  if (sub === "notes") {
    const ns = Object.entries(S.notes).filter(([, t]) => t);
    h += ns.length ? `<div class="list">${ns.map(([id, t]) => R[id] ? li(R[id], "", esc(t)) : "").join("")}</div>` : `<div class="empty">Заметок нет. В книге у рецепта есть кнопка «✎ Заметка»: «сахара меньше», «в моей духовке 35 минут».</div>`;
  }
  $("#view").innerHTML = h;
  const up = $("#up"); if (up) up.onclick = () => $("#planBtn").click();
  const nm = $("#newMenu"); if (nm) nm.onclick = () => { const id = newMenu(prompt("Название меню", "Новогодний стол 2027") || "Моё меню"); location.hash = "#menu/" + id; };
  const rm = $("#readyMenu"); if (rm) rm.onclick = readyMenu;
  $("#view").querySelectorAll("[data-unbm]").forEach(b => b.onclick = e => { e.preventDefault(); S.bm = S.bm.filter(x => x !== b.dataset.unbm); save(); vMy("bm"); });
  $("#view").querySelectorAll("[data-dl]").forEach(b => b.onclick = () => saveBook(b.dataset.dl));
}
function li(r, right = "", extra = "") {
  return `<a class="li" href="${recUrl(r)}"><img src="${r.img}" alt="" loading="lazy"><div class="t"><b>${esc(r.title)}</b><small>${extra || esc(bookOf(r.book).title)}</small></div>${right}</a>`;
}
function newMenu(title) { const id = Date.now().toString(36); S.menus.push({ id, title, items: [] }); save(); return id; }
function readyMenu() {
  const pick = ["novyi-god", "kotlety", "rulety", "lenivaya", "rozhdestvo"].map(b => D.recipes.find(r => r.book === b && r.ings.length)).filter(Boolean);
  const id = newMenu("Новогодний стол от Тианы");
  const m = S.menus.find(x => x.id === id); m.items = pick.map((r, i) => ({ id: r.id, day: ["d0", "d1", "d1", "d1", "d7"][i] || "d0" })); save();
  toast("Меню добавлено — его можно менять под себя"); location.hash = "#menu/" + id;
}

const DAYS = { d7: "За неделю", d1: "За день", d0: "В сам день" };
function vMenu(id, tab) {
  const m = S.menus.find(x => x.id === id); if (!m) { location.hash = "#my/menus"; return; }
  tab = tab || "dishes";
  let h = `<a href="#my/menus" class="note" style="text-decoration:none">← Мои меню</a><h1>${esc(m.title)}</h1><p class="sub">${m.items.length} блюд</p>
    <div class="row" style="margin-bottom:12px"><button class="btn sm" id="share">Поделиться</button><button class="btn sm ghost" id="ren">Переименовать</button><button class="btn sm ghost" id="del">Удалить</button></div>
    <div class="seg">${[["dishes", "Блюда"], ["plan", "План"], ["shop", "Покупки"]].map(([k, t]) => `<a href="#menu/${id}/${k}" style="text-decoration:none;display:flex;align-items:center;justify-content:center;min-height:42px;border-radius:20px;font-weight:700;${k === tab ? "background:var(--terra);color:#fff" : "color:var(--ink2)"}">${t}</a>`).join("")}</div>`;
  const items = m.items.filter(it => R[it.id]);
  if (!items.length) h += `<div class="empty">В меню пока нет блюд. Откройте любую книгу на «Полках» и нажмите «+ В меню» у рецепта.</div>`;
  else if (tab === "dishes") h += `<div class="list">${items.map(it => li(R[it.id], `<select data-day="${it.id}" aria-label="Когда готовить">${Object.entries(DAYS).map(([k, t]) => `<option value="${k}" ${it.day === k ? "selected" : ""}>${t}</option>`).join("")}</select><button class="x" data-rm="${it.id}" aria-label="Убрать">×</button>`)).join("")}</div>`;
  else if (tab === "plan") h += Object.entries(DAYS).map(([k, t]) => { const xs = items.filter(it => (it.day || "d0") === k); return xs.length ? `<div class="grp">${t}</div><div class="list">${xs.map(it => li(R[it.id])).join("")}</div>` : ""; }).join("");
  else h += shopList(m, items);
  $("#view").innerHTML = h;
  $("#view").querySelectorAll("[data-day]").forEach(s => { s.onclick = e => e.preventDefault(); s.onchange = () => { m.items.find(x => x.id === s.dataset.day).day = s.value; save(); }; });
  $("#view").querySelectorAll("[data-rm]").forEach(b => b.onclick = e => { e.preventDefault(); m.items = m.items.filter(x => x.id !== b.dataset.rm); save(); vMenu(id, tab); });
  $("#view").querySelectorAll(".shop input").forEach(c => c.onchange = () => { S.shopDone[m.id + "|" + c.dataset.k] = c.checked; save(); c.closest("label").classList.toggle("done", c.checked); });
  $("#ren").onclick = () => { const t = prompt("Название меню", m.title); if (t) { m.title = t; save(); vMenu(id, tab); } };
  $("#del").onclick = () => { if (confirm("Удалить меню?")) { S.menus = S.menus.filter(x => x.id !== id); save(); location.hash = "#my/menus"; } };
  $("#share").onclick = () => shareMenu(m);
}
const CATS = [["Мясо, птица, рыба", /свин|говя|кури|фарш|мяс|филе|бекон|ветчин|телят|баран|индей|печен|рыб|лосос|кревет|колбас|грудин|шпик|сало|окорок|шея|утк/],
  ["Молочное и яйца", /молок|слив|сыр|творог|масло слив|сливочн|сметан|кефир|йогурт|яйц|желт|белк|маскарпоне|рикотт|моцарел/],
  ["Овощи, фрукты, зелень", /лук|морков|картоф|капуст|чеснок|томат|помидор|перец сл|огур|зелен|укроп|петруш|кинз|лимон|апельсин|яблок|груш|ягод|вишн|клюкв|изюм|цукат|орех|миндал|фундук|фисташ|чернослив|курага|финик|банан|гриб|свекл|кабач|баклаж|тыкв|сельдер|базилик|розмарин|тимьян|мята/],
  ["Бакалея и специи", /мук|сахар|соль|перец|крахмал|разрыхл|дрожж|ванил|корица|мускат|гвоздик|кардамон|какао|шоколад|мёд|мед|рис|круп|желат|агар|специ|паприк|кориандр|лавр|уксус|масло раст|оливк|соус|горчиц|майонез|сода|нитрит/]];
function catOf(n) { const s = n.toLowerCase(); for (const [c, re] of CATS) if (re.test(s)) return c; return "Прочее"; }
function shopList(m, items) {
  const agg = {};
  for (const it of items) for (const g of R[it.id].ings) {
    const name = g.n.replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim(); const k = (name.toLowerCase() + "|" + (g.u || "")).trim();
    const a = agg[k] || (agg[k] = { name, u: g.u, v: 0, num: false, txt: new Set(), from: new Set() });
    if (g.v != null) { a.v += g.v; a.num = true; } else if (g.q) a.txt.add(g.q);
    a.from.add(R[it.id].title);
  }
  const by = {};
  for (const [k, a] of Object.entries(agg)) (by[catOf(a.name)] = by[catOf(a.name)] || []).push([k, a]);
  const order = [...CATS.map(c => c[0]), "Прочее"];
  return `<div class="shop">${order.filter(c => by[c]).map(c => `<div class="grp">${c}</div><div class="list">${by[c].sort((x, y) => x[1].name.localeCompare(y[1].name, "ru")).map(([k, a]) => {
    const done = S.shopDone[m.id + "|" + k];
    const q = a.num ? `${+a.v.toFixed(2)} ${esc(a.u)}` : [...a.txt].join(", ");
    return `<label class="${done ? "done" : ""}"><input type="checkbox" data-k="${esc(k)}" ${done ? "checked" : ""}><span>${esc(a.name)}</span><span class="q">${q}</span></label>`; }).join("")}</div>`).join("")}</div>
    <p class="note" style="margin-top:10px">Список собран из всех блюд меню, одинаковые продукты сложены. Количества взяты из рецептов книг.</p>`;
}

function enc(o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function dec(s) { try { return JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))))); } catch (_) { return null; } }
async function shareMenu(m) {
  const url = location.href.split("#")[0] + "#share=" + enc({ t: m.title, r: m.items.map(i => i.id) });
  try { if (navigator.share) { await navigator.share({ title: m.title, text: "Моё меню в Кулинарном навигаторе", url }); return; } } catch (_) {}
  try { await navigator.clipboard.writeText(url); toast("Ссылка на меню скопирована"); } catch (_) { prompt("Ссылка на меню:", url); }
}
function vShare(code) {
  const o = dec(code); if (!o) { $("#view").innerHTML = `<div class="empty">Ссылка повреждена</div>`; return; }
  const rs = (o.r || []).map(id => R[id]).filter(Boolean);
  $("#view").innerHTML = `<span class="pill o">Книга участницы по ссылке</span><h1 style="margin-top:8px">${esc(o.t)}</h1><p class="sub">${rs.length} блюд из книг Кулинарного навигатора</p>
    ${rs[0] ? `<h2>Открыт для вас</h2><div class="list">${li(rs[0], `<span class="pill">Открыть</span>`)}</div>` : ""}
    <h2>Ещё в книге</h2><div class="list">${rs.slice(1).map(r => `<div class="li" style="opacity:.6"><img src="${r.img}" alt=""><div class="t"><b>${esc(r.title)}</b><small>🔒 откроется с подпиской</small></div></div>`).join("")}</div>
    <div class="card" style="margin-top:16px"><b>Открыть все рецепты</b><p class="note">Книга сохранится на полке и будет работать без интернета. В настоящем приложении здесь будет оплата; автору книги — месяц в подарок.</p>
    <div class="row"><button class="btn" id="take">Сохранить меню себе</button></div></div>`;
  $("#take").onclick = () => { const id = newMenu(o.t); S.menus.find(x => x.id === id).items = rs.map(r => ({ id: r.id, day: "d0" })); save(); toast("Меню сохранено в «Мою полку»"); location.hash = "#menu/" + id; };
}

// ——— офлайн: сохранение книги в телефон
async function swReady() { if (!("serviceWorker" in navigator) || !(location.protocol === "https:" || location.hostname === "localhost")) return null; try { return (await navigator.serviceWorker.ready).active; } catch (_) { return null; } }
async function saveBook(slug) {
  const sw = await swReady(); if (!sw) { toast("Сохранение без интернета работает на опубликованной версии (https)"); return; }
  if (!hasShelf(bookOf(slug).shelf)) { toast("Эта полка не в вашем тарифе"); return; }
  S.saved[slug] = true; dl[slug] = 0; save(); route();
  sw.postMessage({ type: "book", slug, urls: [`img/${slug}.jpg`, ...F[slug].lite, ...F[slug].video] });
}
async function refreshStatus() {
  const sw = await swReady(); if (!sw) return;
  const books = {}; for (const s of Object.keys(S.saved)) if (F[s]) books[s] = [`img/${s}.jpg`, ...F[s].lite, ...F[s].video];
  if (Object.keys(books).length) sw.postMessage({ type: "status", books });
}
if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", ({ data: m }) => {
  if (m.type === "progress") { dl[m.slug] = Math.floor(100 * m.done / m.total); const st = document.querySelector(`[data-st="${m.slug}"]`); if (st) st.innerHTML = dl[m.slug] >= 100 ? `<button class="dl ok" disabled>✓ На полке, без интернета</button>` : `<button class="dl" disabled>Загрузка ${dl[m.slug]}%</button>`; if (dl[m.slug] >= 100) toast("Книга сохранена — работает без интернета"); }
  if (m.type === "status") for (const [s, miss] of Object.entries(m.missing)) if (miss > 0 && !dl[s]) { // докачать, если что-то не успело
    swReady().then(sw => sw && sw.postMessage({ type: "book", slug: s, urls: [`img/${s}.jpg`, ...F[s].lite, ...F[s].video] })); }
});

// ——— маршруты
function route() {
  const h = location.hash.slice(1) || "shelves"; const [a, b, c] = h.split("/");
  document.querySelectorAll("#tabs a").forEach(x => x.classList.toggle("on", x.dataset.t === (a === "menu" ? "my" : a.startsWith("share") ? "" : a)));
  planBtn(); window.scrollTo(0, 0);
  if (a.startsWith("share=")) return vShare(h.slice(6));
  ({ shelves: vShelves, builders: vBuilders, video: vVideo, chat: vChat, my: () => vMy(b), menu: () => vMenu(b, c) }[a] || vShelves)();
}
addEventListener("hashchange", route);
(async () => {
  try { [D, F] = await Promise.all([fetch("data.json").then(r => r.json()), fetch("files.json").then(r => r.json())]); } catch (_) { $("#view").innerHTML = `<div class="empty">Нет интернета, а приложение ещё не сохранено в телефоне.</div>`; return; }
  for (const r of D.recipes) R[r.id] = r;
  if (/[?&]demo/.test(location.search) && !S.menus.length) {   // ?demo — заполненный пример для показа
    const pick = ["novyi-god", "kotlety", "rulety", "lenivaya", "rozhdestvo"].map(b => D.recipes.find(r => r.book === b && r.ings.length)).filter(Boolean);
    S.menus.push({ id: "demo", title: "Новогодний стол 2027", items: pick.map((r, i) => ({ id: r.id, day: ["d0", "d1", "d1", "d1", "d7"][i] })) });
    S.bm = pick.slice(0, 2).map(r => r.id); S.notes[pick[0].id] = "Делаю за час до гостей, сыр нарезаю кубиками"; save();
  }
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) navigator.serviceWorker.register("sw.js").catch(() => {});
  route();
  installHint();
})();

// ——— подсказка «добавить на экран»
function installHint() {
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone; let seen = false;
  try { seen = localStorage.getItem("nav-sheet") === "1"; } catch (_) {}
  if (standalone || seen) return;
  const IOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const INAPP = /Instagram|FBAN|FBAV|Telegram|VKClient|WhatsApp/i.test(navigator.userAgent);
  setTimeout(() => {
    sheet(`<h3>Навигатор на экран телефона</h3><p>Один значок — книги в один тап и без интернета.</p>
      ${INAPP ? `<p>Вы открыли ссылку внутри приложения. Откройте её в ${IOS ? "Safari" : "Chrome"}: «⋯» в углу → «Открыть в браузере».</p>`
        : IOS ? `<ol><li>Нажмите «Поделиться» внизу экрана (на новых iPhone сначала «⋯»)</li><li>Выберите «На экран Домой»</li><li>Нажмите «Добавить»</li></ol>`
        : `<ol><li>Меню браузера ⋮ вверху справа</li><li>«Добавить на главный экран» или «Установить»</li></ol>`}
      <button class="btn" id="later" style="width:100%;margin-top:8px">Понятно</button>`);
    $("#later").onclick = () => { closeSheet(); try { localStorage.setItem("nav-sheet", "1"); } catch (_) {} };
  }, 1500);
}
