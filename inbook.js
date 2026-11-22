// Встраивается в каждую живую книгу: кнопка «← Навигатор» и у каждого рецепта — закладка, «в меню», заметка.
(() => {
  const KEY = "nav1", slug = window.NAV_BOOK;
  const PLUS = { shelf: false, plus: true, two: false, twoplus: true }, TWO = { two: true, twoplus: true };
  const PASTRY = ["rozhdestvo"];
  let S; try { S = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (_) { S = {}; }
  S.plan = S.plan || "plus"; S.main = S.main || "cook"; S.bm = S.bm || []; S.notes = S.notes || {}; S.menus = S.menus || [];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) {} };
  const toast = t => { const d = document.createElement("div"); d.className = "nav-toast"; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 2400); };
  const back = document.createElement("a"); back.href = "../../#shelves"; back.className = "nav-back"; back.textContent = "← Навигатор"; document.body.appendChild(back);
  // полка не в тарифе — прототип показывает замок, но даёт посмотреть
  const shelf = PASTRY.includes(slug) ? "pastry" : "cook";
  if (!TWO[S.plan] && S.main !== shelf && !sessionStorage.getItem("nav-peek-" + slug)) {
    const l = document.createElement("div"); l.className = "nav-lockpage";
    l.innerHTML = `<div class="in"><h2 style="margin:0 0 8px">Эта книга на другой полке</h2><p>Вторая полка — ещё 690 ₽ в месяц, фишки повторно не оплачиваются.</p><a href="../../#shelves">Вернуться</a><a class="g" href="#" id="peek">Посмотреть в прототипе</a></div>`;
    document.body.appendChild(l); l.querySelector("#peek").onclick = e => { e.preventDefault(); sessionStorage.setItem("nav-peek-" + slug, "1"); l.remove(); };
  }
  function sheet(html) { const s = document.createElement("div"); s.className = "nav-sheet"; s.innerHTML = `<div class="box">${html}</div>`; s.onclick = e => { if (e.target === s) s.remove(); }; document.body.appendChild(s); return s; }
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  document.querySelectorAll("article.recipe").forEach(a => {
    const id = slug + "-" + a.id, title = (a.querySelector("h2") || {}).textContent || "";
    const bar = document.createElement("div"); bar.className = "nav-bar";
    const bm = document.createElement("button"), mn = document.createElement("button"), nt = document.createElement("button");
    const paint = () => { const on = S.bm.includes(id); bm.textContent = on ? "★ В закладках" : "☆ Закладка"; bm.classList.toggle("on", on); nt.textContent = S.notes[id] ? "✎ Моя заметка" : "✎ Заметка"; nt.classList.toggle("on", !!S.notes[id]); };
    mn.textContent = "+ В сборник";
    const vid = document.createElement("button"); vid.textContent = "▶ Видеоверсия";
    vid.onclick = () => { const s = sheet(`<h3>Видеоверсия рецепта</h3><p>Шеф готовит это блюдо на видео от начала до конца.</p>
      <button class="pri" id="buy">Купить видеоверсию · цена уточняется</button><button id="club">Все видео — в клубе</button><p style="font-size:12px;color:#7A6F65">В прототипе покупка не работает.</p>`);
      s.querySelector("#buy").onclick = () => { s.remove(); toast("В прототипе покупка не подключена"); };
      s.querySelector("#club").onclick = () => { location.href = "../../#club"; }; };
    bm.onclick = () => { S.bm = S.bm.includes(id) ? S.bm.filter(x => x !== id) : [...S.bm, id]; save(); paint(); toast(S.bm.includes(id) ? "Добавлено в закладки" : "Убрано из закладок"); };
    const box = document.createElement("div"); box.className = "nav-note";
    box.innerHTML = `<textarea placeholder="Например: сахара меньше, в моей духовке 35 минут">${esc(S.notes[id] || "")}</textarea><small>Заметка видна только вам и сохраняется в «Моей полке»</small>`;
    const ta = box.querySelector("textarea"); ta.oninput = () => { S.notes[id] = ta.value; save(); paint(); };
    nt.onclick = () => { box.classList.toggle("open"); if (box.classList.contains("open")) ta.focus(); };
    mn.onclick = () => {
      if (!PLUS[S.plan]) { toast("Свои сборники и меню — в тарифе с фишками"); return; }
      const s = sheet(`<h3>Добавить «${esc(title)}» в сборник</h3>${S.menus.map(m => `<button data-m="${m.id}">${esc(m.title)} · ${m.items.length} блюд</button>`).join("")}<button class="pri" data-new="1">+ Новый сборник</button>`);
      s.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { const m = S.menus.find(x => x.id === b.dataset.m); if (!m.items.some(i => i.id === id)) m.items.push({ id, day: "d0" }); save(); s.remove(); toast("Добавлено в «" + m.title + "»"); });
      s.querySelector("[data-new]").onclick = () => { const t = prompt("Название меню", "Новогодний стол 2027"); if (!t) return; S.menus.push({ id: Date.now().toString(36), title: t, items: [{ id, day: "d0" }] }); save(); s.remove(); toast("Меню «" + t + "» создано"); };
    };
    bar.append(bm, mn, nt, vid); paint();
    const cap = a.querySelector(".rhero .cap") || a.querySelector("header") || a;
    cap.appendChild(bar); cap.appendChild(box);
  });
})();
