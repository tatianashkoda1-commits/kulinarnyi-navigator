// Кулинарный навигатор — прототип. Всё хранится в телефоне (localStorage "nav1"), сервера нет.
const KEY = "nav1";
const PLANS = {
  shelf:   { t: "Одна полка", p: "690 ₽", plus: false, two: false, d: "Книги одной полки, все конструкторы, заметки, закладки, офлайн, общение" },
  plus:    { t: "Одна полка с фишками", p: "990 ₽", plus: true, two: false, d: "+ мои меню и план, список покупок, мои книги и обмен ими" },
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
function def() { return { plan: "plus", main: "cook", tab: "cook", saved: {}, bm: [], notes: {}, menus: [], shopDone: {}, chat: [], wall: [], cooked: {} }; }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) { toast("Память телефона заполнена"); } }
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function toast(t) { const el = $("#toast"); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => el.hidden = true, 2600); }
const plan = () => PLANS[S.plan];
const hasShelf = sh => plan().two || S.main === sh;
const bookOf = slug => D.books.find(b => b.slug === slug);
const recUrl = r => "#r/" + r.id;

function sheet(html) { const s = $("#sheet"); s.innerHTML = `<div class="box">${html}</div>`; s.hidden = false; s.onclick = e => { if (e.target === s) s.hidden = true; }; }
const closeSheet = () => $("#sheet").hidden = true;

// ——— тариф (для прототипа переключается вручную)
function planBtn() { $("#planBtn").textContent = "Тариф: " + plan().p; }
$("#planBtn").onclick = () => {
  sheet(`<h3>Тариф (в прототипе — переключатель)</h3><div class="opt">${Object.entries(PLANS).map(([k, p]) =>
    `<button data-p="${k}" class="${k === S.plan ? "on" : ""}"><b>${p.t} — ${p.p} в месяц</b><small>${p.d}</small></button>`).join("")}</div>
    <h3 style="margin-top:16px">Моя полка, если одна</h3><div class="seg">${Object.entries(SHELF).map(([k, t]) => `<button data-m="${k}" class="${S.main === k ? "on" : ""}">${t}</button>`).join("")}</div>
    <p class="note">В настоящем приложении тариф выбирается при оплате. Здесь можно переключать, чтобы посмотреть, что открывается в каждом.</p><button class="btn ghost" id="reset" style="width:100%;margin-top:8px">Обновить приложение (если что-то не грузится)</button>`);
  $("#reset").onclick = async () => { try { for (const k of await caches.keys()) await caches.delete(k); const rs = await navigator.serviceWorker.getRegistrations(); for (const r of rs) await r.unregister(); } catch (_) {} location.reload(); };
  $("#sheet").querySelectorAll("[data-p]").forEach(b => b.onclick = () => { S.plan = b.dataset.p; save(); planBtn(); closeSheet(); route(); });
  $("#sheet").querySelectorAll("[data-m]").forEach(b => b.onclick = () => { S.main = b.dataset.m; save(); closeSheet(); route(); });
};

// ——— экраны
function vShelves() {
  const sh = S.tab, own = hasShelf(sh), f = (S.f = S.f || {})[sh] || (S.f[sh] = { q: "", dish: "", theme: "", n: 24 });
  const all = D.recipes.filter(r => r.shelf === sh);
  const dishes = [...new Set(all.map(r => r.dish))], themes = [...new Set(all.flatMap(r => r.themes))];
  const q = f.q.trim().toLowerCase();
  const list = all.filter(r => (!f.dish || r.dish === f.dish) && (!f.theme || r.themes.includes(f.theme)) &&
    (!q || r.title.toLowerCase().includes(q) || r.ings.some(g => g.n.toLowerCase().includes(q))));
  const cols = D.books.filter(b => D.recipes.some(r => r.book === b.slug && r.shelf === sh));
  const m = sh === "cook" ? bookOf("novyi-god") : bookOf("rozhdestvo");
  const mine = S.menus.filter(x => x.items.length);
  let h = `<div class="hero"><h1>Кулинарная книга</h1><p class="sub">${D.recipes.length} рецептов шефов с видео каждого шага. Ищите по блюду или продукту.</p>
    <div class="seg">${Object.entries(SHELF).map(([k, t]) => `<button data-sh="${k}" class="${k === sh ? "on" : ""}">${t} · ${D.recipes.filter(r => r.shelf === k).length}</button>`).join("")}</div>
    <div class="sbox"><label class="sfield"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="q" type="search" placeholder="Что приготовить?" value="${esc(f.q)}" aria-label="Поиск по рецептам"></label>
      <button class="fbtn" id="filt" type="button"><svg viewBox="0 0 24 24"><path d="M4 6h16M7 12h10M10 18h4"/></svg>Фильтры${(f.dish ? 1 : 0) + (f.theme ? 1 : 0) ? ` <span class="dot">${(f.dish ? 1 : 0) + (f.theme ? 1 : 0)}</span>` : ""}</button></div>
    <div class="quick">${["", ...dishes].map(d => `<button class="${f.dish === d ? "on" : ""}" data-dish="${esc(d)}">${d || "Все"}</button>`).join("")}</div>
    ${f.theme ? `<div class="tags"><button data-theme="">${esc(f.theme)} ✕</button></div>` : ""}</div>`;
  if (!own) h += `<div class="lock"><b>Эта полка не входит в ваш тариф</b>Вторая полка — ещё 690 ₽ в месяц, фишки повторно не оплачиваются. <button class="btn sm" id="addShelf" style="margin-top:8px">Посмотреть тарифы</button></div>`;
  h += `<p class="note">${q || f.dish || f.theme ? "Найдено" : "Все рецепты"}: ${list.length}</p>
    <div class="grid">${list.slice(0, f.n).map(rcard).join("") || `<div class="empty" style="grid-column:1/-1">Ничего не нашлось. Попробуйте другое слово или сбросьте фильтры.</div>`}</div>
    ${list.length > f.n ? `<div class="row" style="justify-content:center;margin-top:12px"><button class="btn ghost" id="more">Показать ещё</button></div>` : ""}
    <h2 style="margin-top:30px">Подборки</h2>
    ${m ? `<a class="month" href="#c/${m.slug}"><img src="img/${m.slug}.jpg" alt=""><div><span class="pill">Подборка месяца</span><b>${esc(m.title)}</b><small>${esc(m.who)} · ${m.n} рецептов</small></div></a>` : ""}
    <div class="hs">${cols.filter(b => !m || b.slug !== m.slug).map(b => `<a class="col" href="#c/${b.slug}"><img src="img/${b.slug}.jpg" alt="" loading="lazy"><b>${esc(b.title)}</b><small>${b.n} рецептов</small></a>`).join("")}</div>
    ${mine.length ? `<h2>Мои книги</h2><div class="hs">${mine.map(x => { const r0 = R[x.items[0].id]; return `<a class="col" href="#menu/${x.id}"><img src="${r0 ? r0.img : ""}" alt=""><b>${esc(x.title)}</b><small>${x.items.length} блюд</small></a>`; }).join("")}</div>` : ""}
    ${sh === "pastry" ? `<h2>Готовится из архива</h2><div class="list">${SOON_PASTRY.map(([t, n]) => `<div class="li soon"><div class="t"><b>${t}</b><small>${n} рецептов переносятся из архива клуба</small></div><span class="pill o">Скоро</span></div>`).join("")}</div>` : ""}
    <p class="proto">Прототип Кулинарного навигатора · данные хранятся только в этом телефоне</p>`;
  $("#view").innerHTML = h;
  $("#view").querySelectorAll("[data-sh]").forEach(b => b.onclick = () => { S.tab = b.dataset.sh; save(); vShelves(); });
  $("#view").querySelectorAll("[data-dish]").forEach(b => b.onclick = () => { f.dish = b.dataset.dish; f.n = 24; save(); vShelves(); });
  $("#view").querySelectorAll("[data-theme]").forEach(b => b.onclick = () => { f.theme = b.dataset.theme; f.n = 24; save(); vShelves(); });
  $("#filt").onclick = () => {
    sheet(`<h3>Фильтры</h3><div class="grp">Тип блюда</div><div class="chips">${["", ...dishes].map(d => `<button class="chip ${f.dish === d ? "on" : ""}" data-fd="${esc(d)}">${d || "Все блюда"}</button>`).join("")}</div>
      <div class="grp">Повод</div><div class="chips">${["", ...themes].map(d => `<button class="chip ${f.theme === d ? "on" : ""}" data-ft="${esc(d)}">${d || "Любой"}</button>`).join("")}</div>
      <button class="btn" id="fok" style="width:100%;margin-top:10px">Показать рецепты</button>`);
    $("#sheet").querySelectorAll("[data-fd]").forEach(b => b.onclick = () => { f.dish = b.dataset.fd; $("#sheet").querySelectorAll("[data-fd]").forEach(x => x.classList.toggle("on", x === b)); });
    $("#sheet").querySelectorAll("[data-ft]").forEach(b => b.onclick = () => { f.theme = b.dataset.ft; $("#sheet").querySelectorAll("[data-ft]").forEach(x => x.classList.toggle("on", x === b)); });
    $("#fok").onclick = () => { f.n = 24; save(); closeSheet(); vShelves(); };
  };
  const qi = $("#q"); let tm; qi.oninput = () => { clearTimeout(tm); tm = setTimeout(() => { f.q = qi.value; f.n = 24; save(); const pos = qi.selectionStart; vShelves(); const n = $("#q"); n.focus(); n.setSelectionRange(pos, pos); }, 300); };
  const mo = $("#more"); if (mo) mo.onclick = () => { f.n += 24; save(); vShelves(); };
  const a = $("#addShelf"); if (a) a.onclick = () => $("#planBtn").click();
  wireCards();
}
function wireCards() {
  $("#view").querySelectorAll("[data-bm]").forEach(b => b.onclick = e => { e.preventDefault(); const id = b.dataset.bm; S.bm = S.bm.includes(id) ? S.bm.filter(x => x !== id) : [...S.bm, id]; save(); b.textContent = S.bm.includes(id) ? "★" : "☆"; toast(S.bm.includes(id) ? "В закладках" : "Убрано из закладок"); });
  $("#view").querySelectorAll("[data-add]").forEach(b => b.onclick = e => { e.preventDefault(); addToMenu(b.dataset.add); });
}
function rcard(r) {
  return `<div class="book"><a class="cv" href="#r/${r.id}"><img src="${r.img}" alt="" loading="lazy"><div class="bt"><span class="kk">${esc(r.dish)}</span><b>${esc(r.title)}</b><small>${r.steps} шагов с видео${cookLog(r.id).length ? ` · <span class="ck">✓ ${cookLog(r.id).length}</span>` : ""}</small></div></a>
    <div class="ra"><button data-bm="${r.id}" aria-label="Закладка">${S.bm.includes(r.id) ? "★" : "☆"}</button><button data-add="${r.id}">+ В мою книгу</button></div></div>`;
}
function dlBtn(b) {
  return S.saved[b.slug] ? (dl[b.slug] && dl[b.slug] < 100 ? `<button class="dl" disabled>Загрузка ${dl[b.slug]}%</button>` : `<button class="dl ok" disabled>✓ Сохранено без интернета</button>`)
    : `<button class="dl" data-dl="${b.slug}">↓ Сохранить без интернета</button>`;
}
function addToMenu(id) {
  if (!plan().plus) { toast("Мои книги и меню — в тарифе с фишками"); return; }
  sheet(`<h3>Добавить «${esc(R[id].title)}»</h3><div class="opt">${S.menus.map(m => `<button data-m="${m.id}"><b>${esc(m.title)}</b><small>${m.items.length} блюд</small></button>`).join("")}<button data-new="1" class="on"><b>+ Новая книга</b></button></div>`);
  $("#sheet").querySelectorAll("[data-m]").forEach(b => b.onclick = () => { const m = S.menus.find(x => x.id === b.dataset.m); if (!m.items.some(i => i.id === id)) m.items.push({ id, day: dayOf(R[id]) }); save(); closeSheet(); toast("Добавлено в книгу «" + m.title + "»"); });
  $("#sheet").querySelector("[data-new]").onclick = () => { const t = prompt("Название книги", "Мой новогодний стол"); if (!t) return; const nid = newMenu(t); S.menus.find(x => x.id === nid).items.push({ id, day: dayOf(R[id]) }); save(); closeSheet(); toast("Книга «" + t + "» создана"); };
}
const assets = r => [r.img, ...r.srows.map(s => s.v).filter(Boolean)];
const pl = (n, a, b, c) => n % 10 === 1 && n % 100 !== 11 ? a : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? b : c;
const cookLog = id => (S.cooked = S.cooked || {})[id] || [];
const fmtDate = d => new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
const stars = n => "★".repeat(n) + "☆".repeat(5 - n);
function avgStars(log) { const xs = log.filter(x => x.s); return xs.length ? (xs.reduce((a, x) => a + x.s, 0) / xs.length) : 0; }
function cookSheet(id, after) {
  let st = 0;
  sheet(`<h3>Я приготовила: ${esc(R[id].title)}</h3><p class="note">Как получилось в этот раз?</p>
    <div class="starpick">${[1, 2, 3, 4, 5].map(n => `<button data-s="${n}" aria-label="${n} из 5">☆</button>`).join("")}</div>
    <textarea id="cn" placeholder="Заметка к этому разу: меньше сахара, гости просили добавки…"></textarea>
    <button class="btn" id="csave" style="width:100%;margin-top:10px">Записать в дневник</button>`);
  const paint = () => $("#sheet").querySelectorAll("[data-s]").forEach(b => { b.textContent = +b.dataset.s <= st ? "★" : "☆"; b.classList.toggle("on", +b.dataset.s <= st); });
  $("#sheet").querySelectorAll("[data-s]").forEach(b => b.onclick = () => { st = +b.dataset.s; paint(); });
  $("#csave").onclick = () => { (S.cooked[id] = cookLog(id)).push({ d: Date.now(), s: st, n: $("#cn").value.trim() }); save(); closeSheet();
    const k = cookLog(id).length; toast(k >= 3 ? "Записано! Это уже ваше любимое блюдо ❤" : "Записано в кулинарный дневник"); after && after(); };
}
function vRecipe(id) {
  const r = R[id]; if (!r) { location.hash = "#shelves"; return; }
  const b = bookOf(r.book), sib = D.recipes.filter(x => x.book === r.book), i = sib.indexOf(r);
  const own = hasShelf(r.shelf), saved = S.saved["r:" + id];
  let groups = {}; r.ings.forEach(g => (groups[g.g || ""] = groups[g.g || ""] || []).push(g));
  let h = `<a href="#shelves" class="back">← Кулинарная книга</a>
    <div class="rh"><img src="${r.img}" alt=""><div class="rt"><span class="kk">${esc(r.dish)} · ${esc(r.kick)}</span><h1>${esc(r.title)}</h1>
    <a class="from" href="#c/${b.slug}">Из подборки «${esc(b.title)}» · ${esc(b.who)}</a></div></div>
    ${!own ? `<div class="lock"><b>Этот рецепт на другой полке</b>Вторая полка — ещё 690 ₽ в месяц. В прототипе рецепт открыт, чтобы посмотреть.</div>` : ""}
    <div class="acts"><button id="bm">${S.bm.includes(id) ? "★ В закладках" : "☆ Закладка"}</button><button id="add">+ В мою книгу</button><button id="nt">✎ Заметка</button><button id="sv" class="${saved ? "ok" : ""}">${saved ? "✓ Без интернета" : "↓ Сохранить"}</button><button id="vid" class="vid">▶ Видеоверсия</button></div>
    <div id="notebox" class="notebox" ${S.notes[id] ? "" : "hidden"}><textarea id="ta" placeholder="Моя заметка: сахара меньше, в моей духовке 35 минут">${esc(S.notes[id] || "")}</textarea><small>Видна только вам</small></div>
    ${r.intro ? `<p class="intro">${esc(r.intro)}</p>` : ""}
    ${r.badges.length ? `<div class="badges">${r.badges.map(x => `<span>${esc(x)}</span>`).join("")}</div>` : ""}
    <div class="rcols"><aside class="ingr"><h2>Ингредиенты</h2>${Object.entries(groups).map(([g, xs]) => `${g ? `<div class="grp">${esc(g)}</div>` : ""}<table>${xs.map(x => `<tr><td>${esc(x.n)}</td><td>${esc(x.q)}</td></tr>`).join("")}</table>`).join("")}
      ${r.tools ? `<p class="note"><b>Инвентарь:</b> ${esc(r.tools)}</p>` : ""}</aside>
    <section class="steps"><h2>Как готовить</h2>${r.srows.map((s, k) => `<div class="step"><div class="clip">${s.v ? `<video data-src="${s.v}" muted loop playsinline preload="none"></video>` : ""}<span class="n">${k + 1}</span></div><div class="tx"><b>${esc(s.h)}</b><p>${esc(s.p)}</p></div></div>`).join("")}</section></div>
    ${r.tips.length ? `<h2>Секреты шефа</h2><div class="tips">${r.tips.map(t => `<div class="tip"><b>${esc(t.b)}</b><p>${esc(t.t)}</p>${t.q ? `<q>${esc(t.q)}</q>` : ""}</div>`).join("")}</div>` : ""}
    ${r.qa.length ? `<h2>Шеф уточняет</h2><div class="qa">${r.qa.map(x => `<details><summary>${esc(x.q)}</summary><p>${esc(x.a)}</p></details>`).join("")}</div>` : ""}
    <h2>Готовое блюдо</h2><figure class="final"><img src="${r.img}" alt="${esc(r.title)} — готовое блюдо" loading="lazy"><figcaption>${esc(r.title)} · ${esc(b.who)}</figcaption></figure>
    <div class="cookbox" id="cookbox"></div>
    <div class="nav2">${i > 0 ? `<a href="#r/${sib[i - 1].id}">← ${esc(sib[i - 1].title)}</a>` : "<span></span>"}${i < sib.length - 1 ? `<a href="#r/${sib[i + 1].id}">${esc(sib[i + 1].title)} →</a>` : ""}</div>`;
  $("#view").innerHTML = h;
  // видео шагов: грузятся и играют, когда шаг на экране
  const io = new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); } else v.pause(); }), { rootMargin: "200px" });
  $("#view").querySelectorAll("video[data-src]").forEach(v => io.observe(v));
  $("#bm").onclick = () => { S.bm = S.bm.includes(id) ? S.bm.filter(x => x !== id) : [...S.bm, id]; save(); $("#bm").textContent = S.bm.includes(id) ? "★ В закладках" : "☆ Закладка"; };
  $("#add").onclick = () => addToMenu(id);
  $("#nt").onclick = () => { const nb = $("#notebox"); nb.hidden = !nb.hidden; if (!nb.hidden) $("#ta").focus(); };
  $("#ta").oninput = () => { S.notes[id] = $("#ta").value; save(); };
  $("#vid").onclick = () => { sheet(`<h3>Видеоверсия рецепта</h3><p>Шеф готовит это блюдо на видео от начала до конца.</p>
    <div class="opt"><button id="buy" class="on"><b>Купить видеоверсию</b><small>Цена уточняется · в прототипе не работает</small></button><button id="toclub"><b>Все видео — в клубе</b><small>2 000+ уроков и ответы шефов</small></button></div>`);
    $("#buy").onclick = () => { closeSheet(); toast("В прототипе покупка не подключена"); }; $("#toclub").onclick = () => { closeSheet(); location.hash = "#club"; }; };
  $("#sv").onclick = () => saveAssets("r:" + id, assets(r));
  const paintCook = () => { const log = cookLog(id), a = avgStars(log);
    $("#cookbox").innerHTML = `<div class="card"><div class="row" style="justify-content:space-between"><div><b>${log.length ? `Вы готовили ${log.length} ${log.length % 10 === 1 && log.length % 100 !== 11 ? "раз" : [2, 3, 4].includes(log.length % 10) && ![12, 13, 14].includes(log.length % 100) ? "раза" : "раз"}` : "Готовили это блюдо?"}</b>
      ${log.length >= 3 ? ` <span class="pill">❤ Моё любимое</span>` : ""}<br><span class="note">${log.length ? `последний раз ${fmtDate(log[log.length - 1].d)}${a ? ` · моя оценка ${a.toFixed(1).replace(".", ",")} ★` : ""}` : "Отметьте, как получилось — это ваш кулинарный дневник"}</span></div>
      <button class="btn sm" id="cookbtn">✓ Я приготовила</button></div>
      ${log.length ? `<div class="hist">${log.slice().reverse().map(x => `<div><span>${fmtDate(x.d)}</span><span class="st">${x.s ? stars(x.s) : ""}</span>${x.n ? `<p>${esc(x.n)}</p>` : ""}</div>`).join("")}</div>` : ""}</div>`;
    $("#cookbtn").onclick = () => cookSheet(id, paintCook); };
  paintCook();
}
function vCollection(slug) {
  const b = bookOf(slug); if (!b) { location.hash = "#shelves"; return; }
  const rs = D.recipes.filter(r => r.book === slug), key = "c:" + slug, saved = S.saved[key];
  $("#view").innerHTML = `<a href="#shelves" class="back">← Кулинарная книга</a>
    <div class="rh"><img src="img/${slug}.jpg" alt=""><div class="rt"><span class="kk">Подборка шефа</span><h1>${esc(b.title)}</h1><span class="from">${esc(b.who)} · ${rs.length} рецептов</span></div></div>
    <div class="acts"><button id="sv" class="${saved ? "ok" : ""}">${saved ? "✓ Вся подборка без интернета" : "↓ Сохранить подборку без интернета · " + b.mb + " МБ"}</button></div>
    <div class="grid">${rs.map(rcard).join("")}</div>`;
  wireCards();
  $("#sv").onclick = () => saveAssets(key, [`img/${slug}.jpg`, ...rs.flatMap(assets)]);
}
async function saveAssets(key, urls) {
  const sw = await swReady(); if (!sw) { toast("Сохранение без интернета работает на опубликованной версии"); return; }
  S.saved[key] = true; save(); toast("Сохраняю в телефон…");
  sw.postMessage({ type: "book", slug: key, urls });
}

function card(b) {
  return `<div class="book"><a class="cv" href="#c/${b.slug}"><img src="img/${b.slug}.jpg" alt="" loading="lazy"><div class="bt"><b>${esc(b.title)}</b><small>${esc(b.who)} · ${b.n} рецептов</small></div></a><div class="st" data-st="${b.slug}">${dlBtn(b)}</div></div>`;
}

function vBuilders() {
  $("#view").innerHTML = `<h1>Конструкторы</h1><p class="sub">Партия этого месяца. Конструкторы открыты в любом тарифе, каждый месяц приходит новая партия.</p>
    <div class="list">${BUILDERS.map(b => b.live
      ? `<a class="li" href="${b.url}" target="_blank" rel="noopener"><img src="${b.img}" alt=""><div class="t"><b>${b.t}</b><small>${b.d}</small></div><span class="pill">Открыть</span></a>`
      : `<div class="li soon"><div class="t"><b>${b.t}</b><small>${b.d}</small></div><span class="pill o">Скоро</span></div>`).join("")}</div>
    <p class="note" style="margin-top:14px">Конструкторы открываются в новой вкладке. Картинка блюда от ИИ генерируется по коду доступа команды.</p>`;
}

function vClub() {
  $("#view").innerHTML = `<h1>Клуб Планета Х</h1><p class="sub">Видеоуроки шефов и живое общение с ними — это клуб. Приложение — библиотека и инструменты, клуб — школа.</p>
    <div class="card" style="border-color:var(--terra)"><div class="list" style="gap:10px">
      <div><b>2 000+ видеоуроков</b><br><span class="note">Весь архив клуба: смотреть, как готовит шеф, с объяснениями</span></div>
      <div><b>Свежие уроки каждый месяц</b><br><span class="note">8 или 16 уроков от шефов клуба</span></div>
      <div><b>Ответы шефов и кураторов</b><br><span class="note">Обратная связь по вашим блюдам</span></div>
      <div><b>Розыгрыши ценной техники</b><br><span class="note">На ПРО — двойные шансы</span></div>
    </div></div>
    <h2>Тарифы клуба</h2><div class="list">
      <div class="li"><div class="t"><b>Стандарт — 1 490 ₽ в месяц</b><small>8 уроков в месяц, поддержка шефов и кураторов, розыгрыши</small></div></div>
      <div class="li"><div class="t"><b>ПРО — 2 490 ₽ в месяц</b><small>16 уроков в месяц, всё из стандарта, двойные шансы в розыгрышах</small></div></div></div>
    <div class="row" style="margin-top:14px"><a class="btn" href="https://xplanet.club" target="_blank" rel="noopener">Перейти в клуб</a></div>
    <h2>Видеоверсия рецепта</h2><p class="note">Не нужен весь клуб — у каждого рецепта есть кнопка «▶ Видеоверсия», её можно купить отдельно.</p>
    <p class="note" style="margin-top:10px">Как участники клуба получают приложение, ещё решается.</p>`;
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
  let h = `<h1>Моя полка</h1><div class="seg">${[["books", "Скачано"], ["menus", "Мои книги"], ["bm", "Закладки"], ["notes", "Дневник"]].map(([k, t]) => `<a href="#my/${k}" class="${k === sub ? "on" : ""}" style="text-decoration:none;display:flex;align-items:center;justify-content:center;min-height:42px;border-radius:20px;font-weight:700;${k === sub ? "background:var(--terra);color:#fff" : "color:var(--ink2)"}">${t}</a>`).join("")}</div>`;
  if (sub === "books") {
    const rs = Object.keys(S.saved).filter(k => k.startsWith("r:")).map(k => R[k.slice(2)]).filter(Boolean);
    const cs = Object.keys(S.saved).filter(k => k.startsWith("c:")).map(k => bookOf(k.slice(2))).filter(Boolean);
    h += (cs.length ? `<h2>Подборки</h2><div class="hs">${cs.map(b => `<a class="col" href="#c/${b.slug}"><img src="img/${b.slug}.jpg" alt=""><b>${esc(b.title)}</b><small>${b.n} рецептов</small></a>`).join("")}</div>` : "")
      + (rs.length ? `<h2>Рецепты</h2><div class="list">${rs.map(r => li(r)).join("")}</div>` : "")
      || `<div class="empty">Пока пусто. Откройте рецепт или подборку и нажмите «↓ Сохранить» — они будут открываться без интернета.</div>`;
  }
  if (sub === "menus") {
    if (!plan().plus) h += `<div class="lock"><b>Мои книги, меню и список покупок — в «фишках»</b>Одна полка с фишками — 990 ₽. <button class="btn sm" id="up" style="margin-top:8px">Посмотреть тарифы</button></div>`;
    else {
      h += `<div class="list">${S.menus.map(m => `<a class="li" href="#menu/${m.id}"><div class="t"><b>${esc(m.title)}</b><small>${m.items.length} блюд</small></div><span class="pill o">Открыть</span></a>`).join("") || `<div class="empty">Своих книг пока нет. В «Книге» у любого рецепта есть кнопка «+ В мою книгу»: соберите меню к празднику или книгу любимых блюд.</div>`}</div>
        <div class="row" style="margin-top:12px"><button class="btn" id="newMenu">+ Новая книга</button><button class="btn ghost" id="readyMenu">Готовое меню от Тианы</button></div>`;
    }
  }
  if (sub === "bm") {
    const rs = S.bm.map(id => R[id]).filter(Boolean);
    h += rs.length ? `<div class="list">${rs.map(r => li(r, `<button class="x" data-unbm="${r.id}" aria-label="Убрать">×</button>`)).join("")}</div>` : `<div class="empty">Закладок нет. В книге нажмите «☆ Закладка» у рецепта.</div>`;
  }
  if (sub === "notes") {
    const ck = Object.entries(S.cooked || {}).filter(([id, l]) => l.length && R[id]).sort((a, b) => b[1][b[1].length - 1].d - a[1][a[1].length - 1].d);
    const total = ck.reduce((a, [, l]) => a + l.length, 0);
    h += `<div class="card" style="margin-bottom:12px"><b>Мой кулинарный дневник</b><br><span class="note">${total ? `Приготовлено ${total} ${pl(total, "раз", "раза", "раз")} · ${ck.length} ${pl(ck.length, "блюдо", "блюда", "блюд")} · любимых: ${ck.filter(([, l]) => l.length >= 3).length}` : "Пока пусто. В конце любого рецепта есть кнопка «✓ Я приготовила»."}</span></div>`;
    if (ck.length) h += `<h2>Я готовила</h2><div class="list">${ck.map(([id, l]) => li(R[id], l.length >= 3 ? `<span class="pill">❤</span>` : "", `${l.length} × · последний раз ${fmtDate(l[l.length - 1].d)}${avgStars(l) ? " · " + avgStars(l).toFixed(1).replace(".", ",") + " ★" : ""}`)).join("")}</div>`;
    const ns = Object.entries(S.notes).filter(([, t]) => t);
    if (ns.length) h += `<h2>Мои заметки</h2><div class="list">${ns.map(([id, t]) => R[id] ? li(R[id], "", esc(t)) : "").join("")}</div>`;
  }
  $("#view").innerHTML = h;
  const up = $("#up"); if (up) up.onclick = () => $("#planBtn").click();
  const nm = $("#newMenu"); if (nm) nm.onclick = () => { const id = newMenu(prompt("Название книги", "Новогодний стол 2027") || "Моя книга"); location.hash = "#menu/" + id; };
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
  const m = S.menus.find(x => x.id === id); m.items = pick.map(r => ({ id: r.id, day: dayOf(r) })); save();
  toast("Меню добавлено — его можно менять под себя"); location.hash = "#menu/" + id;
}

const DAYS = { d7: "За неделю", d1: "Накануне", d0: "В день подачи" };
// автоплан: когда готовить блюдо, по типу блюда и по тексту рецепта (выдержка, ночь в холодильнике, созревание)
function autoDay(r) {
  const t = (r.title + " " + r.badges.join(" ") + " " + r.srows.map(x => x.h + " " + x.p).join(" ")).toLowerCase();
  if (r.dish === "Колбасы и деликатесы") return ["d7", "долгая выдержка — начать заранее"];
  if (/штоллен|кекс|панфорте|цукат|рикотт/.test(r.title.toLowerCase())) return ["d7", "созревает и хранится — печь заранее"];
  if (/ёлк|канапе|тарталет|брускет/.test(r.title.toLowerCase())) return ["d0", "собрать перед подачей, чтобы всё было свежим"];
  if (/сутк|на ночь|ночь в|12\s?ч|24\s?ч|8\s?ч|не менее \d+ ч|дн(я|ей) в холод/.test(t)) return ["d1", r.shelf === "pastry" || /десерт|торт|тирамису/.test(r.dish.toLowerCase() + r.title.toLowerCase()) ? "тесту или крему нужно время в холодильнике — начать накануне" : "начать накануне: маринад или выдержка в холодильнике"];
  if (["Торты", "Пирожные и десерты", "Закуски и рулеты", "Печенье"].includes(r.dish)) return ["d1", "вкуснее, когда постоит, — сделать накануне"];
  if (r.dish === "Салаты") return ["d0", "собрать перед подачей, овощи можно отварить накануне"];
  if (r.dish === "Напитки и коктейли") return ["d0", "смешать перед подачей"];
  return ["d0", "готовить в день подачи — подаётся горячим или свежим"];
}
const dayOf = r => autoDay(r)[0];
function vMenu(id, tab) {
  const m = S.menus.find(x => x.id === id); if (!m) { location.hash = "#my/menus"; return; }
  tab = tab || "dishes";
  let h = `<a href="#my/menus" class="note" style="text-decoration:none">← Мои книги</a><h1>${esc(m.title)}</h1><p class="sub">${m.items.length} блюд</p>
    <div class="row" style="margin-bottom:12px"><button class="btn sm" id="share">Поделиться</button><button class="btn sm ghost" id="ren">Переименовать</button><button class="btn sm ghost" id="del">Удалить</button></div>
    <div class="seg">${[["dishes", "Блюда"], ["plan", "План"], ["shop", "Покупки"]].map(([k, t]) => `<a href="#menu/${id}/${k}" style="text-decoration:none;display:flex;align-items:center;justify-content:center;min-height:42px;border-radius:20px;font-weight:700;${k === tab ? "background:var(--terra);color:#fff" : "color:var(--ink2)"}">${t}</a>`).join("")}</div>`;
  const items = m.items.filter(it => R[it.id]);
  if (!items.length) h += `<div class="empty">В меню пока нет блюд. Откройте любую книгу на «Полках» и нажмите «+ В меню» у рецепта.</div>`;
  else if (tab === "dishes") h += `<div class="list">${items.map(it => li(R[it.id], `<select data-day="${it.id}" aria-label="Когда готовить">${Object.entries(DAYS).map(([k, t]) => `<option value="${k}" ${it.day === k ? "selected" : ""}>${t}</option>`).join("")}</select><button class="x" data-rm="${it.id}" aria-label="Убрать">×</button>`)).join("")}</div>`;
  else if (tab === "plan") h += `<div class="card plancard"><b>Навигатор может составить план сам</b><p class="note">Разложит блюда по дням: что сделать за неделю, что накануне, что в день подачи. Потом можно поменять.</p><button class="btn" id="auto">✨ Составить план</button></div>` + Object.entries(DAYS).map(([k, t]) => { const xs = items.filter(it => (it.day || "d0") === k); return xs.length ? `<div class="grp">${t}</div><div class="list">${xs.map(it => li(R[it.id], "", esc(autoDay(R[it.id])[1]))).join("")}</div>` : ""; }).join("");
  else h += shopList(m, items);
  $("#view").innerHTML = h;
  $("#view").querySelectorAll("[data-day]").forEach(s => { s.onclick = e => e.preventDefault(); s.onchange = () => { m.items.find(x => x.id === s.dataset.day).day = s.value; save(); }; });
  $("#view").querySelectorAll("[data-rm]").forEach(b => b.onclick = e => { e.preventDefault(); m.items = m.items.filter(x => x.id !== b.dataset.rm); save(); vMenu(id, tab); });
  $("#view").querySelectorAll(".shop input").forEach(c => c.onchange = () => { S.shopDone[m.id + "|" + c.dataset.k] = c.checked; save(); c.closest("label").classList.toggle("done", c.checked); });
  $("#ren").onclick = () => { const t = prompt("Название меню", m.title); if (t) { m.title = t; save(); vMenu(id, tab); } };
  $("#del").onclick = () => { if (confirm("Удалить меню?")) { S.menus = S.menus.filter(x => x.id !== id); save(); location.hash = "#my/menus"; } };
  $("#share").onclick = () => shareMenu(m);
  const au = $("#auto"); if (au) au.onclick = () => { m.items.forEach(it => { if (R[it.id]) it.day = dayOf(R[it.id]); }); save(); toast("План составлен — можно поменять у блюда во вкладке «Блюда»"); vMenu(id, "plan"); };
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
  $("#take").onclick = () => { const id = newMenu(o.t); S.menus.find(x => x.id === id).items = rs.map(r => ({ id: r.id, day: dayOf(r) })); save(); toast("Меню сохранено в «Мою полку»"); location.hash = "#menu/" + id; };
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
  if (m.type === "progress") { dl[m.slug] = Math.floor(100 * m.done / m.total); const st = document.querySelector(`[data-st="${m.slug}"]`); if (st) st.innerHTML = dl[m.slug] >= 100 ? `<button class="dl ok" disabled>✓ На полке</button>` : `<button class="dl" disabled>Загрузка ${dl[m.slug]}%</button>`; if (dl[m.slug] >= 100) toast("Сохранено — открывается без интернета"); }
  if (m.type === "status") for (const [s, miss] of Object.entries(m.missing)) if (miss > 0 && !dl[s]) { // докачать, если что-то не успело
    swReady().then(sw => sw && sw.postMessage({ type: "book", slug: s, urls: [`img/${s}.jpg`, ...F[s].lite, ...F[s].video] })); }
});

// ——— маршруты
function route() {
  const h = location.hash.slice(1) || "shelves"; const [a, b, c] = h.split("/");
  document.querySelectorAll("#tabs a").forEach(x => x.classList.toggle("on", x.dataset.t === (a === "menu" ? "my" : (a === "r" || a === "c") ? "shelves" : a.startsWith("share") ? "" : a)));
  planBtn(); window.scrollTo(0, 0);
  if (a.startsWith("share=")) return vShare(h.slice(6));
  ({ shelves: vShelves, builders: vBuilders, club: vClub, chat: vChat, my: () => vMy(b), menu: () => vMenu(b, c), r: () => vRecipe(b), c: () => vCollection(b) }[a] || vShelves)();
}
addEventListener("hashchange", route);
(async () => {
  try { [D, F] = await Promise.all([fetch("data.json").then(r => r.json()), fetch("files.json").then(r => r.json())]); } catch (_) { $("#view").innerHTML = `<div class="empty">Нет интернета, а приложение ещё не сохранено в телефоне.</div>`; return; }
  for (const r of D.recipes) R[r.id] = r;
  if (/[?&]demo/.test(location.search) && !S.menus.length) {   // ?demo — заполненный пример для показа
    const pick = ["novyi-god", "kotlety", "rulety", "lenivaya", "rozhdestvo"].map(b => D.recipes.find(r => r.book === b && r.ings.length)).filter(Boolean);
    S.menus.push({ id: "demo", title: "Новогодний стол 2027", items: pick.map(r => ({ id: r.id, day: dayOf(r) })) });
    S.bm = pick.slice(0, 2).map(r => r.id); S.notes[pick[0].id] = "Делаю за час до гостей, сыр нарезаю кубиками"; S.cooked = { [pick[1].id]: [{ d: Date.now() - 864e5 * 40, s: 4, n: "" }, { d: Date.now() - 864e5 * 12, s: 5, n: "Взяла больше лука — вышло сочнее" }, { d: Date.now() - 864e5 * 2, s: 5, n: "" }] }; save();
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
