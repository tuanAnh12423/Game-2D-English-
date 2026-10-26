// ============================================================
// QUÁN TRÀ SỮA KOI Thé & Phê La — chọn món rồi NÓI order bằng tiếng Anh.
// Nhân viên rất khó tính: thiếu tên món, size, độ ngọt, đá (hoặc quên
// "please") là bị nhắc; sai 2 lần sẽ bị TỪ CHỐI PHỤC VỤ cho tới khi học lại.
// ============================================================
G.tea = {
  MAX_STRIKES: 2,

  st(id) {
    const s = G.state;
    s.tea = s.tea || {};
    s.tea[id] = s.tea[id] || { ban: false, ok: 0, fails: 0, drunk: {}, learned: false };
    return s.tea[id];
  },
  // ---------- Chuẩn hoá câu nói ----------
  norm(t) {
    let x = ' ' + String(t).toLowerCase().replace(/[’‘]/g, "'").replace(/%/g, ' percent ').replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ') + ' ';
    [['one hundred', '100'], ['a hundred', '100'], ['hundred', '100'], ['zero', '0'], ['thirty', '30'], ['fifty', '50'], ['seventy', '70']]
      .forEach(([w, n]) => { x = x.split(' ' + w + ' ').join(' ' + n + ' '); });
    ['koi the', 'koi tea', 'koi thay', 'phe la', 'phela'].forEach((b) => { x = x.split(' ' + b + ' ').join(' '); });
    return x.replace(/\s+/g, ' ');
  },
  has(x, k) { return x.includes(' ' + this.norm(k).trim() + ' '); },
  any(x, list) { return list.some((k) => this.has(x, k)); },
  drinkMatch(x, d) { return d.keys.every((g) => this.any(x, g)) && !(d.not || []).some((k) => this.has(x, k)); },

  // Chấm một câu order so với món đã chọn
  check(text, o, shop) {
    const x = this.norm(text);
    const d = shop.drinks.find((v) => v.id === o.drink);
    const items = [];
    // tên món
    let ok = this.drinkMatch(x, d), note = '';
    if (!ok) { const other = shop.drinks.find((v) => v !== d && this.drinkMatch(x, v)); if (other) note = 'Bạn nói “' + other.en + '” nhưng đã chọn “' + d.en + '”.'; }
    items.push({ vi: 'Tên món', want: d.en, ok, note });
    // size, độ ngọt, đá: phải nói đúng và không nói lẫn lựa chọn khác
    const pickOne = (label, list, cur) => {
      const want = list.find((v) => v.id === cur);
      const said = list.filter((v) => this.any(x, v.keys));
      const good = said.includes(want) && said.length === 1;
      let nt = '';
      if (!good && said.length) nt = 'Bạn nói “' + said.map((v) => v.en).join(' / ') + '” — đã chọn “' + want.en + '”.';
      items.push({ vi: label, want: want.en, ok: good, note: nt });
    };
    pickOne('Size', shop.sizes, o.size);
    pickOne('Độ ngọt', TEA_SUGAR, o.sugar);
    pickOne('Đá', TEA_ICE, o.ice);
    const tp = shop.toppings.find((v) => v.id === o.top);
    if (tp && tp.id !== 'none') items.push({ vi: 'Topping', want: 'with ' + tp.en, ok: tp.keys.every((g) => this.any(x, g)), note: '' });
    items.push({ vi: 'Lịch sự', want: 'please', ok: this.has(x, 'please'), note: 'Nhân viên ở đây chỉ phục vụ khách nói “please”.' });
    items.forEach((it) => { if (it.ok) it.note = ''; });
    return { items, pass: items.every((it) => it.ok), score: items.filter((it) => it.ok).length };
  },
  best(alts, o, shop) {
    return alts.map((a) => Object.assign({ heard: a }, this.check(a, o, shop))).sort((a, b) => b.score - a.score)[0];
  },
  price(shop, o) {
    const d = shop.drinks.find((v) => v.id === o.drink), si = shop.sizes.findIndex((v) => v.id === o.size);
    const tp = shop.toppings.find((v) => v.id === o.top);
    return Math.max(1, Math.round((Math.round(d.price[si] / 2) + ((tp && tp.coins) || 0)) * G.events.teaMul()));
  },
  orderVi(shop, o) {
    const d = shop.drinks.find((v) => v.id === o.drink), sz = shop.sizes.find((v) => v.id === o.size);
    const tp = shop.toppings.find((v) => v.id === o.top);
    return `${d.vi} · ${sz.vi} · ${TEA_SUGAR.find((v) => v.id === o.sugar).vi} · ${TEA_ICE.find((v) => v.id === o.ice).vi}${tp && tp.id !== 'none' ? ' · ' + tp.vi : ''}`;
  },
  orderEn(shop, o) {
    const d = shop.drinks.find((v) => v.id === o.drink), sz = shop.sizes.find((v) => v.id === o.size);
    const tp = shop.toppings.find((v) => v.id === o.top);
    const name = d.en.replace(/\s*\(.*\)/, '');
    return `Can I get a ${sz.en} ${name}${tp && tp.id !== 'none' ? ' with ' + tp.en : ''}, ${TEA_SUGAR.find((v) => v.id === o.sugar).en}, ${TEA_ICE.find((v) => v.id === o.ice).en}, please?`;
  },

  // ---------- Ô nói / gõ ----------
  input(box, onAlts, label) {
    const ui = G.ui;
    box.innerHTML = `<div class="sbtns">${G.stt.supported ? `<button class="btn" id="tmic">🎤 ${label || 'Bấm và nói tiếng Anh'}</button>` : ''}<button class="btn small ghost" id="ttype">⌨️ Gõ thay</button></div>
      <div id="tmicst"></div><div class="${G.stt.supported ? 'hide' : ''}" id="ttbox"><input id="ttin" class="tin" placeholder="Gõ câu tiếng Anh..." autocomplete="off"><button class="btn small" id="ttok">Gửi</button></div>
      ${G.stt.supported ? '' : '<p class="hint">Thiết bị này chưa hỗ trợ nhận giọng nói (Safari iOS 14.5+ / Chrome Android mới có). Hãy gõ câu tiếng Anh — vẫn được chấm khắt khe như khi nói.</p>'}`;
    const mic = box.querySelector('#tmic');
    if (mic) mic.addEventListener('click', () => {
      G.audio.sfx('click');
      const stl = box.querySelector('#tmicst');
      stl.innerHTML = '<div class="mic on">🎙️ Đang nghe... nói to và rõ</div>';
      G.stt.listen((alts) => { stl.innerHTML = ''; onAlts(alts); }, (err) => {
        stl.innerHTML = `<div class="mic bad">${err === 'not-allowed' || err === 'service-not-allowed' ? 'Chưa được phép dùng micro (Cài đặt → Safari → Micro & Nhận dạng giọng nói).' : 'Không nghe thấy gì, hãy bấm và nói lại.'} Bạn cũng có thể ⌨️ gõ thay.</div>`;
      });
    });
    box.querySelector('#ttype').addEventListener('click', () => { box.querySelector('#ttbox').classList.remove('hide'); box.querySelector('#ttin').focus(); });
    const send = () => { const v = box.querySelector('#ttin').value.trim(); if (v) onAlts([v]); };
    box.querySelector('#ttok').addEventListener('click', send);
    box.querySelector('#ttin').addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
    ui.bindSay(box);
  },
  face(p, shop, mood) {
    const c = p.querySelector('.face');
    if (!c) return;
    const fc = c.getContext('2d');
    fc.scale(2, 2);
    G.drawChar(fc, 32, 62, 0, 0, G.NPC_LOOKS[shop.look % G.NPC_LOOKS.length], 1.55);
    if (mood) { fc.font = '15px system-ui'; fc.fillText(mood, 44, 18); }
  },
  head(shop, line, strikes) {
    const hearts = '❤️'.repeat(this.MAX_STRIKES - strikes) + '🤍'.repeat(strikes);
    return `<h2>${shop.icon} ${G.esc(shop.name)} <small>Kiên nhẫn của nhân viên: ${hearts}</small></h2>
      <div class="talk"><canvas class="face" width="128" height="128"></canvas>
      <div class="bubble"><b>${G.esc(shop.staff)}</b><div class="say-en">${G.esc(line)} ${G.ui.sayBtn(line)}</div></div></div>`;
  },

  // ---------- Vào quán ----------
  open(b) {
    const shopId = b.t;
    const shop = TEA_SHOPS[shopId], st = this.st(shopId);
    if (st.ban) return this.banned(shopId);
    this.o = this.o && this.o.shop === shopId ? this.o : { shop: shopId, drink: shop.drinks[0].id, size: shop.sizes[shop.sizes.length > 2 ? 1 : 0].id, sugar: 50, ice: 'less', top: 'none' };
    this.menu(shopId);
  },
  menu(shopId) {
    const ui = G.ui, s = G.state, shop = TEA_SHOPS[shopId], o = this.o, st = this.st(shopId);
    const chip = (grp, val, label, on) => `<button class="tchip ${on ? 'on' : ''}" data-g="${grp}" data-v="${val}">${label}</button>`;
    const si = shop.sizes.findIndex((v) => v.id === o.size);
    const price = this.price(shop, o);
    const tops = shop.toppings.filter((t) => !(t.noFor || []).includes(o.drink));
    if (!tops.find((t) => t.id === o.top)) o.top = 'none';
    const p = ui.open(`${this.head(shop, shop.greet, 0)}
      <p class="hint">${G.esc(shop.about)}</p>
      <h3>1. Chọn món <small>(giá tham khảo · nghìn đồng)</small></h3>
      <div class="list">${shop.drinks.map((d) => `<button class="row trow ${d.id === o.drink ? 'sel' : ''}" data-g="drink" data-v="${d.id}">
        <div class="rn"><b>${G.esc(d.en)}</b><small>${G.esc(d.vi)} · ${shop.sizes.map((z, i) => z.id + ' ' + d.price[i] + 'k').join(' / ')}</small></div>${st.drunk[d.id] ? `<span class="lockt">đã uống ${st.drunk[d.id]}</span>` : ''}</button>`).join('')}</div>
      <h3>2. Size</h3><div class="tchips">${shop.sizes.map((z) => chip('size', z.id, z.vi + ' — <i>' + z.en + '</i>', z.id === o.size)).join('')}</div>
      <h3>3. Độ ngọt</h3><div class="tchips">${TEA_SUGAR.map((v) => chip('sugar', v.id, v.vi + ' — <i>' + v.en + '</i>', v.id === o.sugar)).join('')}</div>
      <h3>4. Đá</h3><div class="tchips">${TEA_ICE.map((v) => chip('ice', v.id, v.vi + ' — <i>' + v.en + '</i>', v.id === o.ice)).join('')}</div>
      <h3>5. Topping</h3><div class="tchips">${tops.map((t) => chip('top', t.id, t.vi + (t.en ? ' — <i>' + t.en + '</i>' : '') + (t.coins ? ' (+' + t.coins + '🪙)' : ''), t.id === o.top)).join('')}</div>
      <div class="job active"><div class="jt">🧾 Order của bạn: ${G.esc(this.orderVi(shop, o))}</div><div>Giá trong game: <b>${price} 🪙</b> (bạn có ${s.coins} 🪙)</div></div>
      <p class="hint">⚠️ Bạn phải tự NÓI order bằng tiếng Anh: tên món + size + độ ngọt + đá${o.top !== 'none' ? ' + topping' : ''} + “please”. Nhân viên chỉ kiên nhẫn ${this.MAX_STRIKES} lần — sai nữa sẽ bị từ chối phục vụ!</p>
      <button class="btn big" id="tgo" ${s.coins < price ? 'disabled' : ''}>${s.coins < price ? 'Không đủ xu' : '🎤 Đến quầy order'}</button>
      <div class="row2"><button class="btn ghost" id="tlearn">📖 Học cách order</button><button class="btn ghost" data-close>Rời quán</button></div>`, { cls: 'wide', keepScroll: this.keep });
    this.keep = false;
    this.face(p, shop, '🙂');
    p.querySelectorAll('[data-g]').forEach((el) => el.addEventListener('click', () => {
      G.audio.sfx('click');
      const g = el.dataset.g, v = el.dataset.v;
      o[g] = g === 'sugar' ? +v : v;
      if (g === 'drink' || g === 'size' || g === 'top') { const d = shop.drinks.find((x) => x.id === o.drink); G.tts.speak(g === 'drink' ? d.en.replace(/\s*\(.*\)/, '') : g === 'size' ? shop.sizes.find((z) => z.id === o.size).en : ''); }
      else G.tts.speak(g === 'sugar' ? TEA_SUGAR.find((x) => x.id === o.sugar).en : TEA_ICE.find((x) => x.id === o.ice).en);
      this.keep = true;
      this.menu(shopId);
    }));
    ui.on(p, '#tgo', () => this.counter(shopId, 0));
    ui.on(p, '#tlearn', () => this.lesson(shopId, 0));
    void si;
  },

  // ---------- Tại quầy: nói order ----------
  counter(shopId, strikes, lastRes) {
    const ui = G.ui, shop = TEA_SHOPS[shopId], o = this.o;
    const line = strikes ? TEA_STERN[Math.min(strikes, TEA_STERN.length) - 1] : shop.greet;
    const resHtml = lastRes ? `<div class="res bad">❌ Nhân viên không chấp nhận order này.</div>
      <div class="sec"><h4>Máy nghe được: “${G.esc(lastRes.heard)}”</h4><ul class="check">${lastRes.items.map((it) => `<li class="${it.ok ? 'ok' : 'no'}">${it.ok ? '✅' : '❌'} <b>${it.vi}</b>: ${it.ok ? 'đã nói' : 'chưa đúng'}${it.note ? ' — ' + G.esc(it.note) : ''}</li>`).join('')}</ul></div>` : '';
    const p = ui.open(`${this.head(shop, line, strikes)}
      <div class="job active"><div class="jt">🧾 Bạn muốn: ${G.esc(this.orderVi(shop, o))}</div></div>
      ${resHtml}
      <p class="qtxt">Hãy nói order bằng tiếng Anh (không có câu mẫu!)</p>
      <div id="tin"></div>
      <button class="btn ghost" id="tback">↩️ Đổi món</button>`, { cls: 'wide', onClose: () => G.tts.stop() });
    this.face(p, shop, strikes ? '😠' : '🙂');
    setTimeout(() => G.tts.speak(line), 200);
    this.input(ui.el('tin'), (alts) => {
      const r = this.best(alts, o, shop);
      if (r.pass) { G.audio.sfx('good'); return this.confirm(shopId, strikes); }
      G.audio.sfx('bad');
      const st = this.st(shopId);
      st.fails++;
      if (strikes + 1 >= this.MAX_STRIKES) return this.refuse(shopId, r);
      this.counter(shopId, strikes + 1, r);
    }, 'Bấm và nói order');
    ui.on(p, '#tback', () => this.menu(shopId));
  },
  refuse(shopId, r) {
    const ui = G.ui, shop = TEA_SHOPS[shopId], st = this.st(shopId);
    st.ban = true;
    const line = TEA_STERN[TEA_STERN.length - 1] + ' Sorry, I can’t serve you. Please learn how to order and come back.';
    const p = ui.open(`${this.head(shop, line, this.MAX_STRIKES)}
      <div class="res bad">⛔ Bạn bị TỪ CHỐI PHỤC VỤ. Nhân viên không hiểu order của bạn.</div>
      ${r ? `<div class="sec"><h4>Lần cuối máy nghe được: “${G.esc(r.heard)}”</h4><ul class="check">${r.items.map((it) => `<li class="${it.ok ? 'ok' : 'no'}">${it.ok ? '✅' : '❌'} <b>${it.vi}</b>${it.note ? ' — ' + G.esc(it.note) : ''}</li>`).join('')}</ul></div>` : ''}
      <p>Muốn được phục vụ lại, bạn phải hoàn thành <b>📖 Lớp học order</b> và vượt qua bài thi cuối.</p>
      <button class="btn big" id="tlearn">📖 Học lại cách order</button><button class="btn ghost" data-close>Rời quán</button>`, { cls: 'wide' });
    this.face(p, shop, '😤');
    setTimeout(() => G.tts.speak(line), 200);
    ui.on(p, '#tlearn', () => this.lesson(shopId, 0));
  },
  banned(shopId) {
    const ui = G.ui, shop = TEA_SHOPS[shopId];
    const line = 'You again? Sorry, I can’t take your order until you can order properly in English.';
    const p = ui.open(`${this.head(shop, line, this.MAX_STRIKES)}
      <div class="res bad">⛔ Nhân viên vẫn từ chối phục vụ bạn.</div>
      <button class="btn big" id="tlearn">📖 Học lại cách order</button><button class="btn ghost" data-close>Rời quán</button>`, { cls: 'wide' });
    this.face(p, shop, '😤');
    setTimeout(() => G.tts.speak(line), 200);
    ui.on(p, '#tlearn', () => this.lesson(shopId, 0));
  },
  // xác nhận + hỏi uống tại quán hay mang đi
  confirm(shopId, strikes) {
    const ui = G.ui, shop = TEA_SHOPS[shopId], o = this.o, price = this.price(shop, o);
    const d = shop.drinks.find((v) => v.id === o.drink), sz = shop.sizes.find((v) => v.id === o.size);
    const line = `One ${sz.en} ${d.en.replace(/\s*\(.*\)/, '')}, ${TEA_SUGAR.find((v) => v.id === o.sugar).en}, ${TEA_ICE.find((v) => v.id === o.ice).en}. That’s ${price} coins. For here or to go?`;
    const p = ui.open(`${this.head(shop, line, strikes)}
      <div class="res good">✅ Nhân viên đã hiểu order của bạn!</div>
      <p class="qtxt">Trả lời: uống tại quán hay mang đi?</p><div id="tin"></div>`, { cls: 'wide', onClose: () => G.tts.stop() });
    this.face(p, shop, '🙂');
    setTimeout(() => G.tts.speak(line), 200);
    this.input(ui.el('tin'), (alts) => {
      const x = alts.map((a) => this.norm(a)).join(' | ');
      const here = this.any(x, ['for here', 'here', 'eat in', 'drink here']), go = this.any(x, ['to go', 'take away', 'takeaway', 'take out', 'takeout']);
      if (!here && !go) {
        G.audio.sfx('bad');
        ui.el('tin').insertAdjacentHTML('afterbegin', '<div class="res bad">😠 “Sorry? For here or to go?” — hãy nói “For here, please.” hoặc “To go, please.”</div>');
        G.tts.speak('Sorry? For here or to go?');
        return;
      }
      this.askName(shopId, strikes, go);
    }, 'Bấm và trả lời');
  },
  askName(shopId, strikes, togo) {
    const ui = G.ui, shop = TEA_SHOPS[shopId];
    const line = 'Can I have your name for the order?';
    const p = ui.open(`${this.head(shop, line, strikes)}
      <p class="qtxt">Nói tên của bạn (ví dụ: “My name is ${G.esc(G.state.profile.name)}.”)</p><div id="tin"></div>`, { cls: 'wide', onClose: () => G.tts.stop() });
    this.face(p, shop, '🙂');
    setTimeout(() => G.tts.speak(line), 200);
    this.input(ui.el('tin'), (alts) => {
      const said = alts[0] || '';
      const x = this.norm(said);
      if (!this.any(x, ['name', "it's", 'its', 'i am', "i'm", 'im', 'call me']) && x.trim().split(' ').length < 1) return;
      this.serve(shopId, togo, said);
    }, 'Bấm và nói tên');
  },
  serve(shopId, togo, said) {
    const ui = G.ui, g = G.game, s = G.state, shop = TEA_SHOPS[shopId], o = this.o, st = this.st(shopId);
    const d = shop.drinks.find((v) => v.id === o.drink), price = this.price(shop, o);
    g.addCoins(-price);
    const first = !st.drunk[d.id];
    st.drunk[d.id] = (st.drunk[d.id] || 0) + 1; st.ok++;
    s.stats.drinks = (s.stats.drinks || 0) + 1;
    s.boost = Date.now() + 10 * 60000;
    const xp = first ? 25 : 8;
    const name = s.profile.name;
    const line = `${name}! Your ${d.en.replace(/\s*\(.*\)/, '')} is ready${togo ? ' to go' : ''}. Enjoy!`;
    G.audio.sfx('level');
    const p = ui.open(`${this.head(shop, line, 0)}
      <div class="center"><div class="big-emoji">${shop.icon}</div><h2>${G.esc(d.vi)}</h2><div class="en">${G.esc(d.en)}</div>
      <p class="hint">Nhân viên ghi tên trên ly: “${G.esc(said)}”</p>
      <p><b>−${price} 🪙 · +${xp} XP</b> · ⚡ Tràn năng lượng: đi nhanh hơn trong 10 phút!</p></div>
      <div class="wcard"><small>Câu order chuẩn bạn vừa nói được:</small><div class="en">${G.esc(this.orderEn(shop, o))} ${ui.sayBtn(this.orderEn(shop, o))}</div></div>
      <button class="btn big" data-close>Cảm ơn! 👋</button>`, { cls: 'wide' });
    this.face(p, shop, '😊');
    setTimeout(() => G.tts.speak(line), 200);
    s.phrases[this.orderEn(shop, o)] = { th: 'cafe', tip: 'Order trà sữa ở ' + shop.name, t: Date.now() };
    g.addXp(xp);
    G.events.onDrink();
    g.checkStory();
  },

  // ---------- Lớp học order ----------
  lesson(shopId, i) {
    const ui = G.ui, shop = TEA_SHOPS[shopId], name = G.state.profile.name;
    if (i >= TEA_LESSON.length) return this.exam(shopId);
    const L = TEA_LESSON[i], en = L.en.replace('{name}', name), vi = L.vi.replace('{name}', name);
    const p = ui.open(`<div class="tag">📖 Lớp học order · ${G.esc(shop.name)} · Bước ${i + 1}/${TEA_LESSON.length + 1}</div>
      <div class="qsent">${G.esc(en)} ${ui.sayBtn(en)}</div><p class="center">${G.esc(vi)}</p>
      <div class="sec"><p>💡 ${G.esc(L.tip)}</p></div>
      <p class="qtxt">Nghe 🔊 rồi nói lại (cần giống ≥ 70%)</p><div id="tin"></div><div id="lres"></div>
      <button class="btn ghost" id="lskip">Bỏ qua bước này ›</button>`, { cls: 'wide' });
    setTimeout(() => G.tts.speak(en), 200);
    this.input(ui.el('tin'), (alts) => {
      const b = alts.map((a) => [a, G.similarity(a, en)]).sort((a, c) => c[1] - a[1])[0];
      const pct = Math.round(b[1] * 100), ok = pct >= 70;
      G.audio.sfx(ok ? 'good' : 'bad');
      ui.el('lres').innerHTML = `<div class="mic ${ok ? 'good' : 'bad'}"><b>${pct}%</b> ${ok ? 'Đạt!' : 'Chưa đạt, nghe lại và nói chậm hơn.'}<br><small>“${G.esc(b[0])}”</small></div>${ok ? '<button class="btn big" id="lnext">Bước tiếp ›</button>' : ''}`;
      const nx = ui.el('lnext');
      if (nx) nx.addEventListener('click', () => this.lesson(shopId, i + 1));
    }, 'Bấm và nói lại');
    ui.on(p, '#lskip', () => this.lesson(shopId, i + 1));
  },
  exam(shopId, tries = 0, last) {
    const ui = G.ui, shop = TEA_SHOPS[shopId], st = this.st(shopId);
    if (!this.examOrder || this.examOrder.shop !== shopId || !last) {
      const d = G.pick(shop.drinks), tops = shop.toppings.filter((t) => !(t.noFor || []).includes(d.id));
      this.examOrder = { shop: shopId, drink: d.id, size: G.pick(shop.sizes).id, sugar: G.pick(TEA_SUGAR).id, ice: G.pick(TEA_ICE).id, top: G.pick(tops).id };
    }
    const o = this.examOrder;
    const p = ui.open(`<div class="tag">🎓 Bài thi cuối · ${G.esc(shop.name)}</div>
      <h3>Hãy order đúng món sau bằng tiếng Anh:</h3>
      <div class="job active"><div class="jt">🧾 ${G.esc(this.orderVi(shop, o))}</div></div>
      ${last ? `<div class="sec"><h4>Máy nghe được: “${G.esc(last.heard)}”</h4><ul class="check">${last.items.map((it) => `<li class="${it.ok ? 'ok' : 'no'}">${it.ok ? '✅' : '❌'} <b>${it.vi}</b>${it.ok ? '' : ': cần “' + G.esc(it.want) + '”'}${it.note ? ' — ' + G.esc(it.note) : ''}</li>`).join('')}</ul></div>` : ''}
      <div id="tin"></div>
      ${tries >= 2 ? `<button class="btn ghost" id="lhint">💡 Xem câu mẫu (sau 2 lần sai)</button><div id="lh"></div>` : ''}
      <button class="btn ghost" id="lnew">🔀 Đổi đề khác</button>`, { cls: 'wide' });
    this.input(ui.el('tin'), (alts) => {
      const r = this.best(alts, o, shop);
      if (!r.pass) { G.audio.sfx('bad'); return this.exam(shopId, tries + 1, r); }
      const wasBan = st.ban;
      st.ban = false; st.learned = true;
      G.audio.sfx('level');
      G.game.addXp(wasBan ? 40 : 20);
      const p2 = ui.open(`<div class="center"><div class="big-emoji">🎓</div><h2>Đậu bài thi order!</h2>
        <p>${wasBan ? 'Nhân viên ' + G.esc(shop.name) + ' đã đồng ý phục vụ bạn trở lại.' : 'Bạn đã sẵn sàng order thật.'} +${wasBan ? 40 : 20} XP</p></div>
        <button class="btn big" id="lgo">${shop.icon} Quay lại quầy order</button>`);
      ui.on(p2, '#lgo', () => this.menu(shopId));
      G.game.checkStory();
    }, 'Bấm và nói order');
    ui.on(p, '#lhint', () => { const en = this.orderEn(shop, o); ui.el('lh').innerHTML = `<div class="wcard"><div class="en">${G.esc(en)} ${ui.sayBtn(en)}</div></div>`; ui.bindSay(ui.el('lh')); G.tts.speak(en); });
    ui.on(p, '#lnew', () => { this.examOrder = null; this.exam(shopId, 0); });
  },
};
