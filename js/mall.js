// ============================================================
// TRUNG TÂM THƯƠNG MẠI & TỦ ĐỒ — chọn món, hỏi mua bằng tiếng Anh với nhân viên
// (hội thoại tự sinh theo món, màu, size bạn chọn), thử đồ, trả tiền, rồi mặc lên
// nhân vật. Bạn bè chơi online cũng thấy trang phục của bạn.
// ============================================================
G.CLOTH_BY = {};
CLOTHES.forEach((c) => { G.CLOTH_BY[c.id] = c; });

// Ghép trang phục đang mặc vào ngoại hình (ô trống = đồng phục kỹ thuật viên)
G.applyOutfit = function (look, wear) {
  const L = Object.assign({}, look);
  const get = (slot) => {
    const w = wear[slot];
    if (!w || w === 'none') return null;
    const it = G.CLOTH_BY[w.id];
    return it ? { it, hex: (CLOTH_COLORS[w.c] || {}).hex || '#888' } : null;
  };
  const t = get('top');
  if (t) { L.top = t.it.type; L.shirt = t.hex; L.logo = null; L.belt = null; L.tool = false; }
  const b = get('bottom');
  if (b) { L.bottom = b.it.type; L.pants = b.hex; }
  const sh = get('shoes');
  if (sh) { L.shoes = sh.hex; L.shoeType = sh.it.type; }
  if (wear.hat === 'none') { L.hat = null; L.cap = null; } else { const h = get('hat'); if (h) { L.hat = h.it.type; L.cap = h.hex; } }
  const gl = get('glasses');
  if (gl) L.glasses = gl.it.type === 'sun' ? 'sun' : true;
  if (wear.bag === 'none') L.bag = null; else { const bg = get('bag'); if (bg) L.bag = bg.hex; }
  if (!t && L.bag) L.tool = false;
  return L;
};

G.mall = {
  SLOT_VI: { top: 'Áo / váy', bottom: 'Quần / chân váy', shoes: 'Giày dép', hat: 'Mũ', glasses: 'Kính', bag: 'Túi / ba lô' },
  imgCache: {},

  wr() {
    const s = G.state;
    s.wardrobe = s.wardrobe || {};
    s.wardrobe.owned = s.wardrobe.owned || [];
    s.wardrobe.wear = s.wardrobe.wear || {};
    return s.wardrobe;
  },
  owns(id, c) { return this.wr().owned.some((o) => o.id === id && o.c === c); },
  // ảnh nhân vật mặc thử (dùng cho thẻ món hàng & tủ đồ)
  img(wear, dirs = [0], size = 70) {
    const pf = Object.assign({}, G.state.profile, { wear });
    const key = JSON.stringify([pf, dirs, size]);
    if (this.imgCache[key]) return this.imgCache[key];
    const c = document.createElement('canvas'), d = 2, w = size * 0.8 * dirs.length;
    c.width = w * d; c.height = size * d;
    const x = c.getContext('2d');
    x.scale(d, d);
    const look = G.playerLook(pf);
    dirs.forEach((dir, i) => G.drawChar(x, size * 0.4 + i * size * 0.8, size - 4, dir, 0, look, size / 52));
    const url = c.toDataURL();
    this.imgCache[key] = url;
    return url;
  },
  tryWear(id, c) { const it = G.CLOTH_BY[id]; return Object.assign({}, this.wr().wear, { [it.slot]: { id, c } }); },

  // ---------- Cửa hàng ----------
  open(b, tab) {
    this.b = b;
    tab = tab || this.tab || 'fashion';
    this.tab = tab;
    if (tab === 'wardrobe') return this.wardrobe();
    const ui = G.ui, s = G.state;
    const floor = MALL_FLOORS.find((f) => f.id === tab);
    const items = CLOTHES.filter((c) => floor.slots.includes(c.slot));
    if (!this.sel || !floor.slots.includes(G.CLOTH_BY[this.sel.id].slot)) this.sel = { id: items[0].id, c: items[0].colors[0], size: null };
    const it = G.CLOTH_BY[this.sel.id];
    if (!it.colors.includes(this.sel.c)) this.sel.c = it.colors[0];
    const sizes = it.size ? CLOTH_SIZES[it.size] : null;
    if (sizes && !sizes.find((z) => z.id === this.sel.size)) this.sel.size = sizes[Math.floor(sizes.length / 2) - (it.size === 'clothes' ? 1 : 0)].id;
    if (!sizes) this.sel.size = null;
    const owned = this.owns(it.id, this.sel.c);
    const tabs = `<div class="tabs">${MALL_FLOORS.map((f) => `<button data-mt="${f.id}" class="${tab === f.id ? 'on' : ''}">${f.icon} ${f.name}</button>`).join('')}<button data-mt="wardrobe">🪞 Tủ đồ</button></div>`;
    const p = ui.open(`<h2>🛍️ ${G.esc(b.name)} <small>🪙 ${s.coins}</small></h2>
      <p class="sub">Chọn món bạn thích, rồi <b>hỏi mua bằng tiếng Anh</b> với nhân viên bán hàng. Bấm 🎤 trong lúc nói chuyện để trả lời bằng giọng nói.</p>
      ${tabs}
      <div class="cgrid">${items.map((c) => {
        const col = c.id === it.id ? this.sel.c : c.colors[0];
        return `<button class="ccard ${c.id === it.id ? 'sel' : ''}" data-it="${c.id}"><img src="${this.img(this.tryWear(c.id, col))}" alt=""><b>${G.esc(c.vi)}</b><small>${G.esc(c.en)}</small><span class="cprice">${c.price} 🪙</span></button>`;
      }).join('')}</div>
      <div class="job active cdetail">
        <img src="${this.img(this.tryWear(it.id, this.sel.c), [0, 2, 3], 80)}" alt="">
        <div class="rn"><div class="jt">${G.esc(it.vi)} — <i>${G.esc(it.en)}</i> ${ui.sayBtn(it.en)}</div>
          <div class="set">🎨 Màu ${it.colors.map((k) => `<button class="sw ${k === this.sel.c ? 'on' : ''}" data-col="${k}" title="${CLOTH_COLORS[k].vi}" style="background:${CLOTH_COLORS[k].hex}"></button>`).join('')} <small>${G.esc(CLOTH_COLORS[this.sel.c].vi)} — <i>${G.esc(CLOTH_COLORS[this.sel.c].en)}</i></small></div>
          ${sizes ? `<div class="set">📏 Size ${sizes.map((z) => `<button class="tchip ${z.id === this.sel.size ? 'on' : ''}" data-sz="${z.id}">${z.id}</button>`).join('')}</div>` : '<div class="hint">Món này không cần chọn size.</div>'}
        </div></div>
      <button class="btn big" id="mbuy" ${owned || s.coins < it.price ? 'disabled' : ''}>${owned ? '✅ Bạn đã có món này' : s.coins < it.price ? 'Không đủ xu (' + it.price + ' 🪙)' : '🛍️ Hỏi mua bằng tiếng Anh — ' + it.price + ' 🪙'}</button>
      <button class="btn ghost" data-close>Rời trung tâm</button>`, { cls: 'wide', keepScroll: this.keep });
    this.keep = false;
    const re = () => { this.keep = true; this.open(b, tab); };
    ui.on(p, '[data-mt]', (x) => { this.tab = x.dataset.mt; this.open(b, x.dataset.mt); });
    ui.on(p, '[data-it]', (x) => { const c = G.CLOTH_BY[x.dataset.it]; this.sel = { id: c.id, c: c.colors[0], size: null }; G.tts.speak(c.en); re(); });
    ui.on(p, '[data-col]', (x) => { this.sel.c = x.dataset.col; G.tts.speak(CLOTH_COLORS[this.sel.c].en); re(); });
    ui.on(p, '[data-sz]', (x) => { this.sel.size = x.dataset.sz; re(); });
    ui.on(p, '#mbuy', () => this.shopTalk());
  },

  // ---------- Hội thoại mua hàng (tự sinh theo món đã chọn) ----------
  steps(sel, tight) {
    const it = G.CLOTH_BY[sel.id], col = CLOTH_COLORS[sel.c], pl = !!it.plural;
    const obj = pl ? 'them' : 'it', Obj = pl ? 'They' : 'It';
    const art = (c) => (c.plural ? 'a pair of ' + c.en : (/^[aeiou]/i.test(c.en) ? 'an ' : 'a ') + c.en);
    const others = CLOTHES.filter((c) => c.id !== it.id);
    const other = G.pick(others.filter((c) => c.slot === it.slot).length ? others.filter((c) => c.slot === it.slot) : others);
    const wrongCol = CLOTH_COLORS[G.pick(Object.keys(CLOTH_COLORS).filter((k) => k !== sel.c))];
    const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
    const st = [];
    st.push({ npc: '{greet}! Welcome to Sao Mai Mall. Can I help you?', vi: 'Chào! Chào mừng đến Trung Tâm Thương Mại Sao Mai. Tôi giúp gì được ạ?',
      o: [[`Yes, please. I’m looking for ${art(it)}.`, 2, '“I’m looking for…” = tôi đang tìm… — mẫu câu mua sắm hay dùng nhất.' + (pl ? ' Quần, giày, kính là danh từ số nhiều nên nói “a pair of …”.' : '')],
        [cap(it.en) + '.', 1, 'Chỉ nói tên món nghe cụt lủn.'],
        [`I’m looking for ${art(other)}.`, 0, 'Bạn muốn mua ' + it.vi + ', không phải ' + other.vi + '.']] });
    if (it.size) {
      const sizes = CLOTH_SIZES[it.size], z = sizes.find((x) => x.id === sel.size), wz = G.pick(sizes.filter((x) => x.id !== sel.size));
      const say = (x) => (it.size === 'shoes' ? 'I’m a ' + x.en + '.' : 'I wear a ' + x.en + ' (' + x.id + ').');
      st.push({ npc: it.size === 'shoes' ? 'What size are you?' : 'What size do you wear?', vi: 'Bạn mặc / đi size bao nhiêu?',
        o: [[say(z), 2, it.size === 'shoes' ? '“I’m a size 40.” = tôi đi size 40.' : '“I wear a medium.” = tôi mặc size M. S = small, M = medium, L = large, XL = extra large.'],
          [z.id + '.', 1, 'Được nhưng nên nói thành câu.'],
          [say(wz), 0, 'Bạn đã chọn size ' + z.id + ', không phải ' + wz.id + '.']] });
    }
    st.push({ npc: 'What color would you like?', vi: 'Bạn thích màu nào?',
      o: [[`Do you have ${obj} in ${col.en}?`, 2, '“Do you have ' + obj + ' in + màu?” = có màu … không? (' + col.en + ' = ' + col.vi + ')'],
        [cap(col.en) + '.', 1, 'Chỉ nói màu, hơi cụt.'],
        [`Do you have ${obj} in ${wrongCol.en}?`, 0, 'Bạn đã chọn màu ' + col.vi + ', không phải ' + wrongCol.vi + '.']] });
    if (it.size) {
      st.push({ npc: `Yes, here you are. Would you like to try ${obj} on?`, vi: 'Có ạ, của bạn đây. Bạn có muốn mặc thử không?',
        o: [['Yes, please. Where is the fitting room?', 2, '“try on” = mặc thử; “fitting room” = phòng thử đồ.'], ['Yes.', 1, 'Được, nhưng hỏi thêm phòng thử đồ sẽ tự nhiên hơn.'], [`No, I’ll eat ${obj}.`, 0, 'Vô nghĩa.']] });
      const tryHtml = `<div class="tryon"><img src="${this.img(this.tryWear(sel.id, sel.c), [0, 2, 3], 90)}" alt=""><div>🪞 Bạn đang mặc thử <b>${G.esc(it.vi)}</b> màu ${G.esc(col.vi)}, size ${G.esc(sel.size)}.<br>${tight ? '😣 <b>Hơi chật!</b> Hãy xin size lớn hơn.' : '😊 <b>Vừa vặn!</b>'}</div></div>`;
      if (tight) {
        st.push({ npc: `How do ${obj === 'it' ? 'it' : 'they'} fit?`, vi: 'Mặc vừa không ạ?', html: tryHtml,
          o: [[`${pl ? 'They’re' : 'It’s'} a bit tight. Do you have a larger size?`, 2, '“a bit tight” = hơi chật; “a larger size” = size lớn hơn.'],
            ['Small.', 1, 'Khó hiểu — nên nói rõ là chật và xin size lớn hơn.'],
            [`${pl ? 'They fit' : 'It fits'} perfectly.`, 0, 'Bạn thấy chật mà lại nói vừa?']] });
        st.push({ npc: 'Of course. Here is a larger one. How about this one?', vi: 'Dạ được. Đây là size lớn hơn. Cái này thế nào ạ?',
          o: [[`${pl ? 'These fit' : 'This one fits'} perfectly. I’ll take ${obj}.`, 2, '“I’ll take it/them” = tôi lấy cái này.'], ['OK.', 1, 'Hơi cụt.'], ['It’s too big and too small.', 0, 'Mâu thuẫn.']] });
      } else {
        st.push({ npc: `How do ${obj === 'it' ? 'it' : 'they'} fit?`, vi: 'Mặc vừa không ạ?', html: tryHtml,
          o: [[`${pl ? 'They fit' : 'It fits'} perfectly. I’ll take ${obj}.`, 2, '“fit perfectly” = vừa khít; “I’ll take it/them” = tôi lấy cái này.'],
            ['Good.', 1, 'Được, nhưng nói rõ bạn sẽ mua.'],
            [`${pl ? 'They’re' : 'It’s'} too big. I’ll take ${obj}.`, 0, 'Thấy rộng mà vẫn lấy? Mâu thuẫn.']] });
      }
    } else {
      st.push({ npc: 'Here you are. Would you like to look in the mirror?', vi: 'Của bạn đây. Bạn có muốn soi gương không?',
        html: `<div class="tryon"><img src="${this.img(this.tryWear(sel.id, sel.c), [0, 2, 3], 90)}" alt=""><div>🪞 Trông bạn thật tuyệt với ${G.esc(it.vi)} màu ${G.esc(col.vi)}!</div></div>`,
        o: [[`Yes, please. ${Obj} look${pl ? '' : 's'} great! I’ll take ${obj}.`, 2, '“It looks great” = trông đẹp quá.'], ['OK.', 1, 'Hơi cụt.'], ['No, I hate mirrors.', 0, 'Không lịch sự.']] });
    }
    st.push({ npc: `Great choice! That’s ${it.price} coins. How would you like to pay?`, vi: 'Lựa chọn tuyệt vời! Hết ' + it.price + ' xu. Bạn muốn thanh toán thế nào?',
      o: [['Can I pay by card, please?', 2, '“pay by card / pay in cash” = trả bằng thẻ / tiền mặt.'], ['Card.', 1, 'Cụt lủn.'], ['By motorbike.', 0, 'Vô nghĩa.']] });
    st.push({ npc: 'Here’s your receipt. Thank you for shopping with us!', vi: 'Biên lai của bạn đây. Cảm ơn bạn đã mua sắm!',
      o: [['Thank you! Have a nice day.', 2, 'Đáp lời cảm ơn lịch sự khi rời cửa hàng. “receipt” đọc là /rɪˈsiːt/ (chữ p câm).'], ['Bye.', 1, 'Hơi cụt.'], ['Give me another one for free!', 0, 'Không lịch sự.']] });
    return st;
  },
  shopTalk() {
    const s = G.state, sel = Object.assign({}, this.sel), it = G.CLOTH_BY[sel.id];
    if (s.coins < it.price) return;
    const tight = !!it.size && Math.random() < 0.35;
    const conv = { id: 'mall_' + it.slot, theme: 'shop', title: 'Mua ' + it.vi.toLowerCase(), steps: this.steps(sel, tight) };
    G.ui.convo(conv, { who: 'Nhân viên bán hàng', look: G.NPC_LOOKS[7], onCancel: () => {}, onEnd: (stars) => this.bought(sel, stars) });
  },
  bought(sel, stars) {
    const ui = G.ui, g = G.game, s = G.state, it = G.CLOTH_BY[sel.id], col = CLOTH_COLORS[sel.c];
    g.addCoins(-it.price);
    this.wr().owned.push({ id: sel.id, c: sel.c });
    s.stats.clothes = (s.stats.clothes || 0) + 1;
    const learned = g.learnWord(it.en);
    G.audio.sfx('level');
    const p = ui.open(`<div class="center"><div class="big-emoji">🛍️</div><h2>Đã mua ${G.esc(it.vi)}!</h2>
      <p>${G.esc(it.en)} · ${G.esc(col.en)} (${G.esc(col.vi)})${sel.size ? ' · size ' + G.esc(sel.size) : ''} · ${'⭐'.repeat(stars)}</p>
      <img class="bigprev" src="${this.img(this.tryWear(sel.id, sel.c), [0, 2, 3], 100)}" alt="">
      ${learned ? `<p>📖 Từ mới vào Từ điển: <b>${G.esc(it.en)}</b> = ${G.esc(it.vi.toLowerCase())}</p>` : ''}</div>
      <div class="row2"><button class="btn" id="mwear">👕 Mặc ngay</button><button class="btn ghost" id="mback">Mua tiếp</button></div>`);
    ui.on(p, '#mwear', () => { this.wr().wear[it.slot] = { id: sel.id, c: sel.c }; G.online.sendPresence && G.online.sendPresence(true); ui.toast('👕 Bạn đang mặc ' + it.vi + ' ' + col.vi + '!'); this.open(this.b); });
    ui.on(p, '#mback', () => this.open(this.b));
    g.checkStory();
  },

  // ---------- Tủ đồ ----------
  wardrobe(fromHome) {
    const ui = G.ui, w = this.wr();
    const cur = (slot) => {
      const v = w.wear[slot];
      if (v === 'none') return 'Không đeo';
      if (!v) return slot === 'top' || slot === 'bottom' || slot === 'shoes' || slot === 'hat' ? 'Đồng phục' : 'Không có';
      const it = G.CLOTH_BY[v.id];
      return it ? it.vi + ' ' + CLOTH_COLORS[v.c].vi : '?';
    };
    const tabs = fromHome ? '' : `<div class="tabs">${MALL_FLOORS.map((f) => `<button data-mt="${f.id}">${f.icon} ${f.name}</button>`).join('')}<button data-mt="wardrobe" class="on">🪞 Tủ đồ</button></div>`;
    const p = ui.open(`<h2>🪞 Tủ đồ</h2>${tabs}
      <div class="center"><img class="bigprev" src="${this.img(w.wear, [0, 2, 3, 1], 100)}" alt=""></div>
      <button class="btn ghost" id="wuni">👔 Mặc đồng phục kỹ thuật viên</button>
      ${Object.keys(this.SLOT_VI).map((slot) => {
        const mine = w.owned.filter((o) => G.CLOTH_BY[o.id] && G.CLOTH_BY[o.id].slot === slot);
        const canNone = slot === 'hat' || slot === 'glasses' || slot === 'bag';
        const def = slot === 'glasses' || slot === 'bag' ? null : 'Đồng phục';
        return `<div class="job"><div class="jt">${G.esc(this.SLOT_VI[slot])}: <span class="rew">${G.esc(cur(slot))}</span></div><div class="tchips">
          ${def ? `<button class="tchip ${!w.wear[slot] ? 'on' : ''}" data-w="${slot}" data-v="def">${def}</button>` : ''}
          ${canNone ? `<button class="tchip ${w.wear[slot] === 'none' || (!def && !w.wear[slot]) ? 'on' : ''}" data-w="${slot}" data-v="none">Không</button>` : ''}
          ${mine.map((o, i) => { const v = w.wear[slot]; const on = v && v.id === o.id && v.c === o.c; return `<button class="tchip ${on ? 'on' : ''}" data-w="${slot}" data-v="${i}"><span class="dot" style="background:${CLOTH_COLORS[o.c].hex}"></span>${G.esc(G.CLOTH_BY[o.id].vi)} <i>${G.esc(G.CLOTH_BY[o.id].en)}</i></button>`; }).join('')}
          ${!mine.length ? '<span class="hint">Chưa có — mua ở Trung Tâm Thương Mại</span>' : ''}</div></div>`;
      }).join('')}`, { cls: 'wide', keepScroll: this.keepW });
    this.keepW = false;
    ui.on(p, '[data-mt]', (x) => { this.tab = x.dataset.mt; this.open(this.b, x.dataset.mt); });
    ui.on(p, '#wuni', () => { w.wear = {}; this.keepW = true; this.changed(); this.wardrobe(fromHome); });
    ui.on(p, '[data-w]', (x) => {
      const slot = x.dataset.w, v = x.dataset.v;
      if (v === 'def') delete w.wear[slot];
      else if (v === 'none') w.wear[slot] = 'none';
      else { const o = w.owned.filter((q) => G.CLOTH_BY[q.id] && G.CLOTH_BY[q.id].slot === slot)[+v]; w.wear[slot] = { id: o.id, c: o.c }; G.tts.speak(G.CLOTH_BY[o.id].en); }
      this.keepW = true; this.changed(); this.wardrobe(fromHome);
    });
  },
  changed() { if (G.online.isOn()) G.online.sendPresence(true); G.game.save(); },
};
