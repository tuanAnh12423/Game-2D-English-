// ============================================================
// CHĂN NUÔI · THÚ CƯNG · NẤU ĂN (dữ liệu trong js/data/animals.js)
// Mua con vật nào cũng phải hỏi bằng tiếng Anh: hội thoại + tự nói câu yêu cầu.
// ============================================================
const RANCH_H = 3600e3;

// ---------- Hướng dẫn tiếng Anh ----------
G.tutorial = function (key, onDone) {
  const t = TUTORIALS[key], ui = G.ui, s = G.state;
  if (!t) { if (onDone) onDone(); return; }
  s.tutSeen = s.tutSeen || {};
  s.tutSeen[key] = true;
  const p = ui.open(`<div class="tag">📘 English guide</div><h2>${G.esc(t.title)} ${ui.sayBtn(t.title)}</h2>
    <ol class="tut">${t.lines.map(([en, vi]) => `<li><div class="en">${G.esc(en)} ${ui.sayBtn(en)}</div><div class="say-vi ${s.settings.vi ? '' : 'hide'}">${G.esc(vi)}</div></li>`).join('')}</ol>
    ${s.settings.vi ? '' : '<button class="mini" id="tutvi">Xem nghĩa tiếng Việt</button>'}
    <div class="row2"><button class="btn ghost" id="tutall">🔊 Read all</button><button class="btn" id="tutok">Got it! 👍</button></div>`, { onClose: onDone });
  ui.on(p, '#tutvi', () => { p.querySelectorAll('.say-vi').forEach((e) => e.classList.remove('hide')); p.querySelector('#tutvi').remove(); });
  ui.on(p, '#tutall', () => {
    let i = 0;
    const next = () => { if (i >= t.lines.length || !ui.isOpen()) return; const u = G.tts.utter(t.lines[i++][0]); if (u) u.onend = () => setTimeout(next, 250); else setTimeout(next, 3500); };
    G.tts.stop(); next();
  });
  ui.on(p, '#tutok', () => { G.tts.stop(); ui.close(); });
  setTimeout(() => G.tts.speak(t.title), 200);
};
G.tutorialOnce = function (key, then) {
  const s = G.state;
  if (s.tutSeen && s.tutSeen[key]) return false;
  G.tutorial(key, then);
  return true;
};

// ---------- Mua bằng tiếng Anh (dùng chung cho thú cưng & vật nuôi) ----------
G.buy = {
  fill(t, v) {
    const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
    return String(t).replace(/\{thing\}/g, v.thing).replace(/\{Thing\}/g, cap(v.thing)).replace(/\{things\}/g, v.things || v.thing)
      .replace(/\{Things\}/g, cap(v.things || v.thing)).replace(/\{price\}/g, v.price).replace(/\{age\}/g, v.age || '')
      .replace(/\{eat\}/g, v.eat || '').replace(/\{eat_vi\}/g, v.eatVi || v.eat || '').replace(/\{product\}/g, v.product || '')
      .replace(/\{product_vi\}/g, v.productVi || '');
  },
  // o: {kind:'pets'|'ranch', who, look, v:{thing, things, price…}, names:[từ chấp nhận], model, onDone}
  start(o) {
    const ui = G.ui, s = G.state;
    if (s.coins < o.v.price) { ui.toast('🪙 Bạn cần ' + o.v.price + ' xu (đang có ' + s.coins + ').'); return; }
    const steps = BUY_TALK[o.kind].map((st) => ({ npc: this.fill(st.npc, o.v), vi: this.fill(st.vi, o.v), o: st.o.map(([t, sc, tip]) => [this.fill(t, o.v), sc, tip]) }));
    ui.convo({ id: 'buy_' + o.kind, title: o.kind === 'pets' ? 'Adopting a pet' : 'Buying farm animals', who: o.who, steps }, {
      who: o.who, look: o.look,
      onEnd: (stars) => {
        if (stars < 2) {
          G.audio.sfx('bad');
          const p = ui.open(`<div class="center"><div class="big-emoji">🙅</div><h2>Người bán chưa yên tâm</h2>
            <p><b>${G.esc(o.who)}:</b> “I’m sorry, I don’t think you are ready yet.”</p>
            <p>Cuộc trò chuyện chỉ đạt ${'⭐'.repeat(stars)}. Cần ⭐⭐ trở lên — hãy trả lời lịch sự và đầy đủ hơn.</p></div>
            <button class="btn big" id="byagain">🔁 Thử lại</button><button class="btn ghost" data-close>Để sau</button>`);
          ui.on(p, '#byagain', () => this.start(o));
          return;
        }
        this.speak(o, 0);
      },
    });
  },
  // bước cuối: phải tự NÓI (hoặc gõ) câu yêu cầu mua
  check(text, o) {
    const t = ' ' + G.norm(text) + ' ';
    const name = o.names.some((n) => t.includes(' ' + G.norm(n) + ' ') || t.includes(' ' + G.norm(n) + 's '));
    const req = /\b(could i|can i|may i|i'd like|i would like|id like|i'll take|ill take|i will take|i want to (buy|adopt|take))\b/.test(t);
    const please = /\bplease\b/.test(t);
    const miss = [];
    if (!req) miss.push('mẫu câu yêu cầu lịch sự (Could I… / I’d like…)');
    if (!name) miss.push('tên con vật bằng tiếng Anh (“' + o.v.thing + '”)');
    if (!please) miss.push('từ “please”');
    return { ok: !miss.length, miss };
  },
  speak(o, fails, last) {
    const ui = G.ui;
    const p = ui.open(`<div class="tag">🎤 Bước cuối · tự nói bằng tiếng Anh</div>
      <div class="talk"><canvas class="face" width="128" height="128"></canvas>
        <div class="bubble"><b>${G.esc(o.who)}</b><div class="say-en">Great! So, what would you like? ${ui.sayBtn('Great! So, what would you like?')}</div>
        <div class="say-vi">Tuyệt! Vậy bạn muốn gì nào?</div></div></div>
      <p class="qtxt">Hãy <b>nói</b> câu hỏi mua ${G.esc(o.v.vi)} — không có câu mẫu sẵn. Câu cần có: lời yêu cầu lịch sự + tên con vật + “please”.</p>
      ${last ? `<div class="res bad">Nghe được: “${G.esc(last.heard)}”<br>Còn thiếu: ${G.esc(last.miss.join(', '))}</div>` : ''}
      ${fails >= 2 ? `<div class="wcard"><small>Gợi ý câu chuẩn:</small><div class="en">${G.esc(o.model)} ${ui.sayBtn(o.model)}</div></div>` : ''}
      <div id="bybox"></div>`);
    const fc = p.querySelector('.face').getContext('2d'); fc.scale(2, 2); G.drawChar(fc, 32, 62, 0, 0, o.look, 1.55);
    setTimeout(() => G.tts.speak('Great! So, what would you like?'), 200);
    G.tea.input(p.querySelector('#bybox'), (alts) => {
      const res = alts.map((a) => Object.assign({ heard: a }, this.check(a, o))).sort((a, b) => a.miss.length - b.miss.length)[0];
      if (!res.ok) { G.audio.sfx('bad'); G.tts.speak('Sorry, I didn’t catch that. Could you say it again?'); this.speak(o, fails + 1, res); return; }
      G.audio.sfx('good');
      G.state.phrases[res.heard] = { th: 'shop', tip: o.kind === 'pets' ? 'Hỏi mua thú cưng' : 'Mua vật nuôi', t: Date.now() };
      G.game.addCoins(-o.v.price);
      G.game.addXp(fails ? 10 : 20);
      o.onDone(res.heard);
    }, 'Bấm và nói câu hỏi mua');
  },
};

// ---------- Trại chăn nuôi ----------
G.ranch = {
  mob: {},
  st() {
    const s = G.state;
    s.ranch = s.ranch || { animals: [], uid: 1 };
    return s.ranch;
  },
  def(kind) { return ANIMALS.find((a) => a.id === kind); },
  grow(a, now = G.clock.now()) {
    const d = this.def(a.kind);
    const dt = Math.max(0, now - (a.last || now));
    const fedPart = G.clamp((a.fed || 0) - (a.last || now), 0, dt);
    a.ready = +a.ready || 0;
    if (a.ready < RANCH_STORE) {
      a.prog = (a.prog || 0) + fedPart;
      while (a.prog >= d.cycle * RANCH_H && a.ready < RANCH_STORE) { a.ready++; a.prog -= d.cycle * RANCH_H; }
      if (a.ready >= RANCH_STORE) a.prog = 0;
    }
    a.last = now;
  },
  hungry(a) { return (a.fed || 0) <= G.clock.now(); },
  growAll() { const now = G.clock.now(); this.st().animals.forEach((a) => this.grow(a, now)); },
  hasFood() { const g = G.game; if (g.count('feed') > 0) return 'feed'; const c = G.state.inv.find((sl) => sl && G.items[sl.id] && G.items[sl.id].kind === 'crop'); return c ? c.id : null; },
  feed(a) {
    const g = G.game, d = this.def(a.kind), now = G.clock.now();
    this.grow(a, now);
    if ((a.fed || 0) > now + 12 * RANCH_H) return G.ui.toast('😊 ' + d.vi + ' còn no ' + G.clock.fmtDur(a.fed - now) + ' nữa.');
    const f = this.hasFood();
    if (!f) return G.ui.toast('🌾 Hết thức ăn! Mua “Animal feed” ở trại, hoặc dùng nông sản trong balo.');
    g.addItem(f, -1);
    a.fed = now + d.feedH * RANCH_H; a.love = Math.min(10, (a.love || 0) + 0.5);
    G.state.stats.fed = (G.state.stats.fed || 0) + 1;
    G.audio.sfx('plant');
    this.say('I feed the ' + d.en + ' with ' + (f === 'feed' ? 'some animal feed' : 'a fresh ' + G.items[f].en) + '.');
    g.addXp(2);
  },
  collect(a) {
    const g = G.game, d = this.def(a.kind), it = G.items[d.product];
    this.grow(a);
    if (!a.ready) return;
    const n = a.ready * (1 + ((a.love || 0) >= 8 ? 1 : 0));
    if (g.addItem(d.product, n) > 0) return;
    a.ready = 0;
    G.state.stats.collected = (G.state.stats.collected || 0) + n;
    G.audio.sfx('harvest');
    const verb = { egg: 'collect the eggs', duck_egg: 'collect the duck eggs', milk: 'milk the cow', wool: 'shear the sheep', truffle: 'find a truffle with my pig' }[d.product];
    this.say('I ' + verb + '! (+' + n + ' ' + it.en + ')');
    g.addXp(6); g.checkStory();
  },
  pet(a) {
    const d = this.def(a.kind), k = G.clock.dateKey();
    if (a.petDay === k) return this.say('The ' + d.en + ' is already happy today. ' + d.sound);
    a.petDay = k; a.love = Math.min(10, (a.love || 0) + 1);
    G.game.addXp(2);
    this.say('I gently pet the ' + d.en + '. ' + d.sound);
  },
  say(en) { G.ui.toast('🗣️ ' + en); G.tts.speak(en.replace(/\(.*\)/, '')); },

  panel(b, keep) {
    if (!keep && G.tutorialOnce('ranch', () => this.panel(b))) return;
    const ui = G.ui, g = G.game, s = G.state, r = this.st(), now = G.clock.now(), L = g.level;
    this.growAll();
    const list = r.animals.map((a, i) => {
      const d = this.def(a.kind), it = G.items[d.product];
      const pr = a.ready >= RANCH_STORE ? 100 : Math.min(100, (a.prog || 0) / (d.cycle * RANCH_H) * 100);
      const hungry = this.hungry(a);
      return `<div class="acard"><div class="aemo">${d.emoji}</div><div class="rn"><b>${G.esc(a.name || d.vi)}</b> <small>${G.esc(d.en)} · ${'💗'.repeat(Math.max(1, Math.round((a.love || 0) / 2)))}</small>
          <small>${hungry ? '😋 <b>Hungry!</b> Đang đói — sản phẩm ngừng lớn' : '😊 Full · no thêm ' + G.clock.fmtDur(a.fed - now)}</small>
          <div class="bar"><i style="width:${pr}%"></i></div><small>${a.ready ? '✅ ' + it.emoji.repeat(a.ready) + ' ' + G.esc(it.en) + ' ×' + a.ready + ' chờ thu' + (a.ready >= RANCH_STORE ? ' (đầy kho — thu để tiếp tục)' : '') : it.emoji + ' ' + G.esc(it.en) + ' · ' + Math.round(pr) + '%'}</small></div>
        <div class="sbtns"><button class="btn small" data-feed="${i}" ${a.fed < now + 12 * RANCH_H ? '' : 'disabled'}>🌾 Feed</button>
          <button class="btn small ${a.ready ? '' : 'ghost'}" data-col="${i}" ${a.ready ? '' : 'disabled'}>🧺 Collect</button>
          <button class="btn small ghost" data-pet="${i}">💗 Pet</button></div></div>`;
    }).join('') || '<p class="hint">Trại còn trống. Hãy hỏi mua con vật đầu tiên bên dưới!</p>';
    const shop = ANIMALS.map((d) => {
      const lock = d.level > L, it = G.items[d.product];
      return `<div class="row ${lock ? 'locked' : ''}"><div class="aemo sm">${d.emoji}</div><div class="rn"><b>${G.esc(d.vi)}</b><small>${G.esc(d.en)} · ${it.emoji} ${G.esc(it.en)} mỗi ${d.cycle} giờ · cho ăn 1 lần/ngày</small></div>
        ${lock ? `<span class="lockt">🔒 Lv ${d.level}</span>` : `<button class="btn small" data-buy="${d.id}" ${s.coins < d.price || r.animals.length >= RANCH_MAX ? 'disabled' : ''}>${d.price} 🪙</button>`}</div>`;
    }).join('');
    const p = ui.open(`${ui.head(b, 'Bác Năm: “' + G.esc(G.clock.greet()) + '! Happy animals, fresh eggs!”')}
      <div class="coins">🪙 ${s.coins} · 🌾 Thức ăn: ${g.count('feed')}</div>
      <h3>🐾 Vật nuôi của bạn (${r.animals.length}/${RANCH_MAX})</h3><div class="list">${list}</div>
      <div class="row"><div class="aemo sm">🌾</div><div class="rn"><b>Thức ăn gia súc</b><small>Animal feed · 4 🪙/bao</small></div>
        <button class="btn small" data-fd="5" ${s.coins < 20 ? 'disabled' : ''}>×5 · 20 🪙</button><button class="btn small ghost" data-fd="15" ${s.coins < 60 ? 'disabled' : ''}>×15</button></div>
      <h3>🛒 Mua vật nuôi <small>(phải hỏi mua bằng tiếng Anh)</small></h3><div class="list">${shop}</div>
      <h3>🧺 Bán sản phẩm</h3><div class="list">${ui.sellRows((it) => it.kind === 'product')}</div>
      <button class="btn ghost" id="rtut">📘 English guide</button>`, { keepScroll: keep, cls: 'wide' });
    const re = () => this.panel(b, true);
    ui.on(p, '[data-feed]', (x) => { this.feed(r.animals[+x.dataset.feed]); re(); });
    ui.on(p, '[data-col]', (x) => { this.collect(r.animals[+x.dataset.col]); re(); });
    ui.on(p, '[data-pet]', (x) => { this.pet(r.animals[+x.dataset.pet]); re(); });
    ui.on(p, '[data-fd]', (x) => { const n = +x.dataset.fd; if (s.coins < n * 4) return; g.addCoins(-n * 4); g.addItem('feed', n); re(); });
    ui.on(p, '[data-buy]', (x) => this.buy(b, this.def(x.dataset.buy)));
    ui.on(p, '#rtut', () => G.tutorial('ranch', () => this.panel(b)));
    ui.bindSell(p, re);
  },
  buy(b, d) {
    const it = G.items[d.product];
    G.buy.start({
      kind: 'ranch', who: 'Bác Năm (chủ trại)', look: G.NPC_LOOKS[5],
      v: { thing: d.en, things: d.plural, price: d.price, eat: d.eats, eatVi: d.eatsVi, product: it.en + (d.product === 'milk' || d.product === 'wool' ? '' : 's'), productVi: it.vi, vi: d.vi },
      names: [d.en, d.plural, d.id], model: 'Could I buy a ' + d.en + ', please?',
      onDone: () => {
        const r = this.st(), now = G.clock.now();
        const first = !r.animals.length;
        r.animals.push({ uid: r.uid++, kind: d.id, name: '', fed: now + d.feedH * RANCH_H, last: now, prog: 0, ready: first ? 1 : 0, love: 1 });
        G.state.stats.animals = (G.state.stats.animals || 0) + 1;
        if (first) G.game.addItem('feed', 5, true);
        G.audio.sfx('level');
        const p = G.ui.open(`<div class="center"><div class="big-emoji">${d.emoji}</div><h2>Bạn đã có ${G.esc(d.vi)}!</h2>
          <p><b>Bác Năm:</b> “Here is your ${G.esc(d.en)}. Take good care of it!” ${G.ui.sayBtn('Here is your ' + d.en + '. Take good care of it!')}</p>
          ${first ? '<p>🎁 Quà cho chủ trại mới: 5 bao thức ăn, và con vật đầu tiên đã có sẵn sản phẩm để bạn thu ngay!</p>' : ''}
          <p class="hint">Con vật sống trong chuồng rào trắng ngay dưới Trại Chăn Nuôi.</p></div>
          <button class="btn big" id="rok">Tuyệt! 🥰</button>`);
        G.tts.speak('Here is your ' + d.en + '. Take good care of it!');
        G.ui.on(p, '#rok', () => this.panel(b, true));
        G.game.checkStory();
      },
    });
  },

  // vẽ con vật đi lại trong chuồng
  draw(ctx, cam, ents, t, dt) {
    if (!G.feat.has('ranch')) return;
    const pen = G.world.pens[0], S = G.TS;
    if (!pen) return;
    const X0 = pen.x * S + 8, Y0 = pen.y * S + 14, X1 = (pen.x + pen.w) * S - 8, Y1 = (pen.y + pen.h) * S - 4;
    if (X1 < cam.x - 40 || X0 > cam.x + cam.w + 40 || Y1 < cam.y - 40 || Y0 > cam.y + cam.h + 60) return;
    this.st().animals.forEach((a) => {
      const d = this.def(a.kind);
      const m = this.mob[a.uid] || (this.mob[a.uid] = { x: X0 + Math.random() * (X1 - X0), y: Y0 + Math.random() * (Y1 - Y0), tx: 0, ty: 0, w: 0, dir: 1 });
      m.w -= dt;
      if (m.w <= 0) { m.tx = X0 + Math.random() * (X1 - X0); m.ty = Y0 + Math.random() * (Y1 - Y0); m.w = 2 + Math.random() * 4; }
      const dx = m.tx - m.x, dy = m.ty - m.y, dd = Math.hypot(dx, dy), mv = dd > 2;
      if (mv) { const v = Math.min(dd, 14 * dt); m.x += dx / dd * v; m.y += dy / dd * v; if (Math.abs(dx) > 1) m.dir = dx > 0 ? 1 : -1; }
      ents.push({ y: m.y, d: () => {
        ctx.fillStyle = 'rgba(120,70,110,.16)'; ctx.beginPath(); ctx.ellipse(m.x, m.y + 1, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
        const hop = mv ? Math.abs(Math.sin(t * 8 + a.uid)) * 2 : 0;
        const big = a.kind === 'cow' || a.kind === 'pig' || a.kind === 'sheep' ? 24 : 18;
        ctx.save(); ctx.translate(m.x, m.y - big * 0.45 - hop); ctx.scale(-m.dir, 1);
        ctx.font = big + 'px system-ui, "Apple Color Emoji", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000';
        if (!G.pix.animal(ctx, a.kind, 0, big * 0.45)) {
          if (G.pix.on()) {
            const W = big + 10;
            G.pix.blit(ctx, G.pix.sprite('e' + d.emoji + big, W, W, W / 2, W / 2, (c) => { c.font = big + 'px system-ui, "Apple Color Emoji", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000'; c.fillText(d.emoji, 0, 0); }), 0, 0);
          } else ctx.fillText(d.emoji, 0, 0);
        }
        ctx.restore();
        const it = G.items[d.product];
        if (a.ready || this.hungry(a)) {
          const by = m.y - big - 8 + Math.sin(t * 4 + a.uid) * 1.5;
          ctx.fillStyle = 'rgba(255,250,252,.95)'; G.rr(ctx, m.x - 9, by - 9, 18, 16, 8); ctx.fill();
          ctx.strokeStyle = a.ready ? '#8fd6a7' : '#ffb3d1'; ctx.lineWidth = 1.2; ctx.stroke();
          ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = '#000'; ctx.fillText(a.ready ? it.emoji : '🌾', m.x, by - 1); ctx.textBaseline = 'alphabetic';
        }
      } });
    });
  },
};

// ---------- Tiệm thú cưng ----------
G.petshop = {
  st() { const s = G.state; s.pets = s.pets || { owned: {} }; s.pets.owned = s.pets.owned || {}; return s.pets; },
  img(kind, size = 56) {
    const key = 'pet_' + kind + '@' + size;
    if (G.icons.cache[key]) return G.icons.cache[key];
    const c = document.createElement('canvas'); c.width = c.height = size * 2;
    const x = c.getContext('2d'); x.scale(2 * size / 32, 2 * size / 32);
    G.drawPet(x, 16, 27, kind, 0, 0, false);
    return (G.icons.cache[key] = c.toDataURL());
  },
  panel(b, keep) {
    if (!keep && G.tutorialOnce('pets', () => this.panel(b))) return;
    const ui = G.ui, s = G.state, st = this.st(), L = G.game.level, act = s.profile.pet;
    const mine = Object.keys(st.owned).filter((k) => G.PETS[k]);
    const p = ui.open(`${ui.head(b, 'Cô Mochi: “' + G.esc(G.clock.greet()) + '! Every pet deserves a loving home.”')}
      <div class="coins">🪙 ${s.coins}</div>
      ${mine.length ? `<h3>💞 Thú cưng của bạn</h3><div class="list">${mine.map((k) => {
        const o = st.owned[k], dd = PET_SHOP.find((x) => x.id === k);
        return `<div class="row ${act === k ? 'sel' : ''}"><img src="${this.img(k)}"><div class="rn"><b>${G.esc(o.name || G.PETS[k].vi)}</b><small>${G.esc(dd ? dd.en : k)} · ${'💗'.repeat(Math.max(1, Math.round((o.love || 0) / 2)))}${act === k ? ' · đang đi theo bạn' : ''}</small></div>
          ${act === k ? '<button class="btn small ghost" data-home>🏠 Để ở nhà</button>' : `<button class="btn small" data-walk="${k}">🐾 Dẫn đi</button>`}
          <button class="btn small ghost" data-treat="${k}">🍪 Treat</button></div>`;
      }).join('')}</div>` : ''}
      <h3>🛒 Nhận nuôi <small>(phải hỏi bằng tiếng Anh)</small></h3>
      <div class="list">${PET_SHOP.filter((d) => G.PETS[d.id]).map((d) => {
        const lock = d.level > L, own = !!st.owned[d.id];
        return `<div class="row ${lock ? 'locked' : ''}"><img src="${this.img(d.id)}"><div class="rn"><b>${G.esc(d.vi)}</b><small>${G.esc(d.en)} · ${G.esc(d.age)}</small></div>
          ${own ? '<span class="lockt">✅ Đã có</span>' : lock ? `<span class="lockt">🔒 Lv ${d.level}</span>` : `<button class="btn small" data-adopt="${d.id}" ${s.coins < d.price ? 'disabled' : ''}>${d.price} 🪙</button>`}</div>`;
      }).join('')}</div>
      <button class="btn ghost" id="ptut">📘 English guide</button>`, { keepScroll: keep, cls: 'wide' });
    const re = () => this.panel(b, true);
    ui.on(p, '[data-walk]', (x) => { s.profile.pet = x.dataset.walk; G.ui.toast('🐾 ' + (st.owned[x.dataset.walk].name || G.PETS[x.dataset.walk].vi) + ' sẽ đi theo bạn!'); G.online.announce && G.online.announce(); re(); });
    ui.on(p, '[data-home]', () => { s.profile.pet = ''; re(); });
    ui.on(p, '[data-treat]', (x) => { this.treat(x.dataset.treat); re(); });
    ui.on(p, '[data-adopt]', (x) => this.adopt(b, PET_SHOP.find((d) => d.id === x.dataset.adopt)));
    ui.on(p, '#ptut', () => G.tutorial('pets', () => this.panel(b)));
  },
  treat(k) {
    const o = this.st().owned[k], day = G.clock.dateKey(), dd = PET_SHOP.find((x) => x.id === k);
    if (o.treatDay === day) { G.ui.toast('🍪 Hôm nay bé đã được ăn vặt rồi — mai quay lại nhé!'); return; }
    o.treatDay = day; o.love = Math.min(10, (o.love || 0) + 1);
    G.game.addXp(3); G.game.hearts(G.game.player.x, G.game.player.y - 20, 8);
    const en = 'Here is a treat for you, ' + (o.name || 'my little ' + (dd ? dd.en : k)) + '. Good job!';
    G.ui.toast('🗣️ ' + en); G.tts.speak(en);
  },
  adopt(b, d) {
    G.buy.start({
      kind: 'pets', who: 'Cô Mochi (chủ tiệm)', look: G.NPC_LOOKS[1],
      v: { thing: d.en, price: d.price, age: d.age, eat: d.eat, eatVi: d.eatVi, vi: d.vi },
      names: [d.en, d.en.split(' ').pop()], model: 'Could I adopt this ' + d.en + ', please?',
      onDone: () => this.name(b, d),
    });
  },
  name(b, d) {
    const ui = G.ui, s = G.state, st = this.st();
    G.audio.sfx('level');
    const p = ui.open(`<div class="center"><img class="petbig" src="${this.img(d.id, 96)}"><h2>Chúc mừng! 🎉</h2>
      <p><b>Cô Mochi:</b> “Congratulations! What will you name your ${G.esc(d.en)}?” ${ui.sayBtn('Congratulations! What will you name your ' + d.en + '?')}</p></div>
      <label class="set">📝 Tên bé <input id="pname" class="tin" maxlength="12" autocomplete="off" placeholder="${G.esc(G.PETS[d.id].vi)}"></label>
      <button class="btn big" id="pok">🐾 Dẫn bé về nhà</button>`);
    G.tts.speak('Congratulations! What will you name your ' + d.en + '?');
    ui.on(p, '#pok', () => {
      const nm = (p.querySelector('#pname').value || '').trim().replace(/[<>{}]/g, '').slice(0, 12);
      st.owned[d.id] = { name: nm, love: 1, at: G.clock.now() };
      s.profile.pet = d.id;
      G.game.hearts(G.game.player.x, G.game.player.y - 20, 16);
      G.game.checkStory(); G.game.save();
      this.panel(b, true);
    });
  },
};

// ---------- Bếp nấu ăn (trong nhà) ----------
G.kitchen = {
  ingChip(id, n) {
    const it = G.items[id], have = G.game.count(id);
    return `<span class="chip ${have >= n ? 'ok' : 'no'}"><img src="${G.partImg(id, 22)}"> ${G.esc(it.en)} ${have}/${n}</span>`;
  },
  panel(keep) {
    if (!keep && G.tutorialOnce('cook', () => this.panel())) return;
    const ui = G.ui, g = G.game, s = G.state;
    s.cooked = s.cooked || {};
    const foods = [...new Set(s.inv.filter(Boolean).map((sl) => sl.id))].filter((id) => G.items[id] && G.items[id].kind === 'food');
    const p = ui.open(`<h2>🍳 Bếp nhà bạn <small>Kitchen</small></h2>
      <p class="sub">Chọn món, kiểm tra nguyên liệu trong balo rồi nấu theo các bước tiếng Anh.</p>
      <div class="list">${DISHES.map((d) => {
        const ok = g.hasAll(d.ing), st = s.cooked[d.id] || 0;
        return `<div class="row dish"><div class="aemo sm">${d.emoji}</div><div class="rn"><b>${G.esc(d.vi)}</b> <small>${G.esc(d.en)} ${st ? '· ' + '⭐'.repeat(st) : ''}</small>
          <div class="need">${Object.keys(d.ing).map((id) => this.ingChip(id, d.ing[id])).join(' ')}</div></div>
          <button class="btn small" data-cook="${d.id}" ${ok ? '' : 'disabled'}>👩‍🍳 Cook</button></div>`;
      }).join('')}</div>
      ${foods.length ? `<h3>🍽️ Món đã nấu trong balo</h3><div class="list">${foods.map((id) => `<div class="row"><img src="${G.partImg(id, 40)}"><div class="rn"><b>${G.esc(G.items[id].vi)}</b><small>${G.esc(G.items[id].en)} · có ${g.count(id)} · bán ${G.sellPrice(id)} 🪙 ở Tiệm Nông Sản</small></div>
        <button class="btn small" data-eat="${id}">😋 Eat</button></div>`).join('')}</div>` : ''}
      <p class="hint">Nguyên liệu: trứng/sữa/nấm từ 🐔 Trại Chăn Nuôi, rau củ từ ruộng. Ăn một món: đi nhanh hơn 15 phút.</p>
      <button class="btn ghost" id="ktut">📘 English guide</button>`, { keepScroll: keep, cls: 'wide' });
    ui.on(p, '[data-cook]', (x) => this.cook(DISHES.find((d) => d.id === x.dataset.cook)));
    ui.on(p, '[data-eat]', (x) => this.eat(x.dataset.eat));
    ui.on(p, '#ktut', () => G.tutorial('cook', () => this.panel()));
  },
  eat(id) {
    const g = G.game, it = G.items[id];
    if (g.count(id) <= 0) return;
    g.addItem(id, -1);
    G.state.boost = Date.now() + 15 * 60000;
    g.addXp(5); g.hearts(g.player.x, g.player.y - 20, 6);
    const en = 'Yum! This ' + it.en + ' is delicious!';
    G.ui.toast('😋 ' + en + ' ⚡ Đi nhanh hơn 15 phút'); G.tts.speak(en);
    this.panel(true);
  },
  // sắp xếp các bước theo đúng thứ tự
  cook(d) {
    const ui = G.ui, n = d.steps.length;
    const order = G.shuffle(d.steps.map((_, i) => i));
    const st = { done: [], miss: 0 };
    const render = () => {
      const p = ui.open(`<div class="tag">🍳 Cooking · ${G.esc(d.en)} · bước ${st.done.length + 1 > n ? n : st.done.length + 1}/${n} · sai ${st.miss}</div>
        <h2>${d.emoji} ${G.esc(d.vi)}</h2>
        <ol class="steps">${st.done.map((i) => { const [en, vi, verb] = d.steps[i]; return `<li class="good"><span class="en">${this.hl(en, verb)}</span> ${ui.sayBtn(en)}<small>${G.esc(vi)}</small></li>`; }).join('')}</ol>
        ${st.done.length < n ? `<p class="qtxt">Bước <b>${st.done.length + 1}</b> là gì? Chạm đúng câu tiếng Anh:</p>
          <div class="opts">${order.filter((i) => !st.done.includes(i)).map((i) => `<button class="opt left" data-s="${i}">${G.esc(d.steps[i][0])}</button>`).join('')}</div>` : ''}`, { cls: 'wide' });
      p.scrollTop = p.scrollHeight;
      ui.on(p, '[data-s]', (x) => {
        const i = +x.dataset.s;
        if (i === st.done.length) { st.done.push(i); G.audio.sfx('ok'); G.tts.speak(d.steps[i][0]); if (st.done.length === n) setTimeout(() => this.finish(d, st.miss), 600); render(); }
        else { st.miss++; G.audio.sfx('bad'); x.classList.add('bad'); x.disabled = true; }
      });
    };
    render();
  },
  hl(en, verb) {
    const e = G.esc(en), v = G.esc(verb);
    const k = e.toLowerCase().indexOf(v.toLowerCase());
    return k < 0 ? e : e.slice(0, k) + '<b class="verb">' + e.slice(k, k + v.length) + '</b>' + e.slice(k + v.length);
  },
  finish(d, miss) {
    const ui = G.ui, g = G.game, s = G.state;
    if (!g.hasAll(d.ing)) { ui.toast('Thiếu nguyên liệu!'); return; }
    Object.keys(d.ing).forEach((id) => g.addItem(id, -d.ing[id]));
    g.addItem(d.id, 1);
    const stars = miss === 0 ? 3 : miss <= 2 ? 2 : 1;
    const first = !s.cooked[d.id];
    s.cooked[d.id] = Math.max(s.cooked[d.id] || 0, stars);
    s.stats.cooked = (s.stats.cooked || 0) + 1;
    const xp = Math.round(d.xp * stars / 3) + (first ? 20 : 0);
    g.addXp(xp); g.hearts(g.player.x, g.player.y - 20, 10);
    d.steps.forEach(([en, vi]) => { s.phrases[en] = s.phrases[en] || { th: 'cook', tip: d.vi + ' — ' + vi, t: Date.now() }; });
    G.audio.sfx(stars === 3 ? 'level' : 'good');
    const p = ui.open(`<div class="center"><div class="big-emoji">${d.emoji}</div><div class="big-stars">${'⭐'.repeat(stars)}<i>${'⭐'.repeat(3 - stars)}</i></div>
      <h2>${G.esc(d.vi)} đã xong!</h2><p class="en">“Your ${G.esc(d.en)} is ready. Enjoy your meal!”</p>
      <p><b>+${xp} XP</b>${first ? ' (món mới +20)' : ''} · sai ${miss} lần</p>
      <div class="wcard"><small>Động từ nấu ăn trong món này:</small><div class="need">${[...new Set(d.steps.map((x) => x[2]))].map((v) => `<span class="chip">${G.esc(v)} ${ui.sayBtn(v)}</span>`).join('')}</div></div></div>
      <button class="btn big" id="kback">‹ Về bếp</button>`);
    G.tts.speak('Your ' + d.en + ' is ready. Enjoy your meal!');
    ui.on(p, '#kback', () => this.panel(true));
    g.checkStory();
  },
};
