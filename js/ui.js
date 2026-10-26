// Giao diện: hộp thoại, đố từ, cửa hàng, xưởng, từ điển, bản đồ...
G.ui = {
  stack: 0,
  el(id) { return document.getElementById(id); },
  isOpen() { return this.el('modal').classList.contains('on'); },

  open(html, opts = {}) {
    const m = this.el('modal'), p = this.el('panel');
    p.className = 'panel' + (opts.cls ? ' ' + opts.cls : '');
    p.innerHTML = (opts.noClose ? '' : '<button class="x" data-close>✕</button>') + html;
    m.classList.add('on');
    G.input.reset();
    document.getElementById('joy').classList.remove('on');
    p.scrollTop = 0;
    this.onClose = opts.onClose || null;
    p.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => { G.audio.sfx('click'); this.close(); }));
    p.querySelectorAll('[data-say]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); G.tts.speak(b.dataset.say); }));
    return p;
  },
  close() {
    this.el('modal').classList.remove('on');
    const cb = this.onClose; this.onClose = null;
    if (G.game.state) G.game.updateHud(true);
    if (cb) cb();
    if (!this.isOpen() && this.toastQ && this.toastQ.length) { const q = this.toastQ.splice(0); q.forEach(([m, t], i) => setTimeout(() => this.toast(m, t), i * 700)); }
    if (!this.isOpen() && this.pending) { const f = this.pending; this.pending = null; setTimeout(f, 60); }
  },
  on(p, sel, fn) { p.querySelectorAll(sel).forEach((b) => b.addEventListener('click', (e) => { G.audio.sfx('click'); fn(b, e); })); },

  toast(msg, type) {
    if (this.isOpen()) { (this.toastQ = this.toastQ || []).push([msg, type]); return; }
    const box = this.el('toasts');
    const d = document.createElement('div');
    d.className = 'toast' + (type ? ' ' + type : '');
    d.textContent = msg;
    box.appendChild(d);
    while (box.children.length > 3) box.removeChild(box.firstChild);
    setTimeout(() => d.classList.add('out'), 3200);
    setTimeout(() => d.remove(), 3700);
  },
  banner(name, en, isNew) {
    const b = this.el('banner');
    b.innerHTML = `<div class="bn">${G.esc(name)}</div><div class="be">${G.esc(en)}${isNew ? ' · <b>Vùng đất mới! +15 XP</b>' : ''}</div>`;
    b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  },
  sayBtn(text) { return `<button class="say" data-say="${G.esc(text)}" title="Nghe phát âm">🔊</button>`; },
  partChip(id, need) {
    const it = G.itemInfo(id), have = G.game.count(id);
    const ok = need === undefined || have >= need;
    return `<span class="chip ${ok ? 'ok' : 'miss'}"><img src="${G.partImg(id, 28)}" alt="">${G.esc(it.vi)}${need !== undefined ? ` <b>${have}/${need}</b>` : ''}</span>`;
  },

  // ---------- Màn hình giới thiệu ----------
  intro() {
    const p = this.open(`
      <h2>👷 Chào mừng, Kỹ thuật viên!</h2>
      <p>Bạn là <b>Minh</b>, một KTV trẻ vừa nhận việc ở <b>Trung Tâm Bảo Hành</b>. Thế giới rộng lớn đang chờ bạn khám phá:</p>
      <ul class="howto">
        <li><span class="orb">Aa</span> <b>Quả cầu chữ</b>: chạm vào để học từ tiếng Anh, trả lời đúng để thu thập.</li>
        <li><img src="${G.partImg('resistor', 28)}"> <b>Linh kiện</b>: nhặt điện trở, tụ, IC, rơ-le... và đọc cách đo kiểm.</li>
        <li>🛠️ <b>Đi làm</b>: nhận đơn ở Trung Tâm Bảo Hành, mang đủ linh kiện tới nhà khách để sửa.</li>
        <li>🔌 <b>Chợ Linh Kiện</b>: mua bán và <b>lắp ráp mạch</b> ở Xưởng.</li>
        <li>💬 <b>Nói chuyện</b> với người đi đường để luyện giao tiếp.</li>
        <li>⭐ Lên cấp để mở khoá vùng đất mới: biển, rừng, khu công nghiệp, sân bay...</li>
      </ul>
      <p class="hint">🕹️ Kéo ngón tay ở <b>nửa trái</b> màn hình để đi. Bấm nút tròn bên phải để <b>Vào nhà / Nói chuyện</b>.</p>
      <button class="btn big" data-close>Bắt đầu ngày làm việc! 🚀</button>`);
    return p;
  },

  levelUp(L, opened) {
    if (this.isOpen()) { const prev = this.pending; this.pending = () => { if (prev) prev(); this.levelUp(L, opened); }; return; }
    const txt = opened.length ? `<p>🔓 Mở khoá vùng đất: <b>${opened.map((r) => G.esc(r.name)).join(', ')}</b></p>` : '';
    const shopTier = [0, 1, 2, 2, 3, 3, 3, 4][Math.min(7, L)] || 4;
    this.open(`<div class="center"><div class="big-emoji">🎉</div><h2>LEVEL UP! Lv ${L}</h2>${txt}
      <p class="hint">Chợ linh kiện bán linh kiện độ hiếm ≤ ${shopTier} ⭐ · Đơn sửa chữa mới đã mở.</p>
      <button class="btn big" data-close>Tuyệt vời!</button></div>`);
    G.game.refreshBoard(true);
  },

  // ---------- Đố từ khi nhặt quả cầu chữ ----------
  quizWord(w, done) {
    const s = G.state;
    const rec = s.words[w.en];
    const m = rec ? rec.m : 0;
    // chọn kiểu câu hỏi theo độ thuộc
    const types = m === 0 ? ['vi'] : m === 1 ? ['vi', 'en'] : m === 2 ? ['en', 'listen', 'blank'] : ['listen', 'blank', 'en'];
    const type = G.pick(types);
    const sameCat = G.allWords.filter((x) => x.cat === w.cat && x.en !== w.en);
    const others = G.shuffle(sameCat.length >= 3 ? sameCat : G.allWords.filter((x) => x.en !== w.en)).slice(0, 3);
    const opts = G.shuffle([w, ...others]);
    let q = '', optText = (o) => o.vi;
    const blank = w.ex.replace(new RegExp(w.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '_____');
    if (type === 'vi') q = `<div class="qword">${G.esc(w.en)} ${this.sayBtn(w.en)}</div><div class="ipa">${G.esc(w.ipa)}</div><p class="qtxt">Nghĩa tiếng Việt là gì?</p>`;
    else if (type === 'en') { q = `<div class="qword vi">${G.esc(w.vi)}</div><p class="qtxt">Từ tiếng Anh nào có nghĩa như trên?</p>`; optText = (o) => o.en; }
    else if (type === 'listen') { q = `<div class="qword"><button class="say huge" data-say="${G.esc(w.en)}">🔊</button></div><p class="qtxt">Nghe và chọn từ đúng</p>`; optText = (o) => o.en; }
    else { q = `<div class="qsent">“${G.esc(blank)}”</div><p class="qtxt">Điền từ còn thiếu vào câu</p>`; optText = (o) => o.en; }
    const cat = WORD_CATS[w.cat];
    const p = this.open(`
      <div class="tag">${cat.icon} ${G.esc(cat.name)} ${rec ? '· ' + this.stars(m) : '· <b>Từ mới!</b>'}</div>
      ${q}
      <div class="opts">${opts.map((o, i) => `<button class="opt" data-i="${i}">${G.esc(optText(o))}</button>`).join('')}</div>
      <div id="qres"></div>`, { noClose: true });
    if (type !== 'en' && type !== 'blank') setTimeout(() => G.tts.speak(w.en), 250);
    let answered = false;
    this.on(p, '.opt', (b) => {
      if (answered) return;
      answered = true;
      const pick = opts[+b.dataset.i];
      const ok = pick === w;
      p.querySelectorAll('.opt').forEach((x, i) => { if (opts[i] === w) x.classList.add('right'); else if (x === b) x.classList.add('wrong'); x.disabled = true; });
      if (ok) {
        const nm = Math.min(5, m + 1);
        s.words[w.en] = { m: nm, t: Date.now() };
        s.stats.caught++;
        G.audio.sfx('good');
      } else {
        if (rec) rec.m = Math.max(1, m - 1);
        s.stats.wrong++;
        G.audio.sfx('bad');
      }
      G.tts.speak(w.ex);
      this.el('qres').innerHTML = `
        <div class="res ${ok ? 'good' : 'bad'}">${ok ? (rec ? '✅ Chính xác! Độ thuộc tăng lên.' : '✅ Chính xác! Đã thêm vào Từ điển.') : '❌ Chưa đúng. Quả cầu đã bay đi, bạn sẽ gặp lại nó sau!'}</div>
        <div class="wcard">
          <div><b class="en">${G.esc(w.en)}</b> ${this.sayBtn(w.en)} <span class="ipa">${G.esc(w.ipa)}</span></div>
          <div class="vi">= ${G.esc(w.vi)}</div>
          <div class="ex">${G.esc(w.ex)} ${this.sayBtn(w.ex)}</div>
        </div>
        <button class="btn big" id="qok">Tiếp tục</button>`;
      this.el('qres').querySelectorAll('[data-say]').forEach((x) => x.addEventListener('click', () => G.tts.speak(x.dataset.say)));
      this.el('qok').addEventListener('click', () => { G.audio.sfx('click'); this.close(); done && done(ok); });
    });
  },
  stars(m) { return '<span class="stars">' + '★'.repeat(Math.min(m, 5)) + '<i>' + '★'.repeat(5 - Math.min(m, 5)) + '</i></span>'; },

  // ---------- Thẻ thông tin linh kiện ----------
  partCard(id, isNew) {
    const it = G.itemInfo(id);
    const isMod = !!G.recipeById[id];
    const html = `
      ${isNew ? '<div class="tag gold">✨ Linh kiện mới được thêm vào Sổ tay!</div>' : ''}
      <div class="pcard">
        <img src="${G.partImg(id, 96)}" alt="">
        <div>
          <h2>${G.esc(it.vi)}</h2>
          <div class="en">${G.esc(it.en)} ${this.sayBtn(it.en)}</div>
          <div class="rar">${isMod ? 'Mô-đun lắp ráp' : '⭐'.repeat(it.rarity) + ' · Giá ' + it.price + ' 🪙'}</div>
        </div>
      </div>
      ${isMod ? `<div class="sec"><h4>📘 Kiến thức</h4><p>${G.esc(it.learn)}</p></div>` : `
      <div class="sec"><h4>📘 Chức năng</h4><p>${G.esc(it.desc)}</p></div>
      <div class="sec"><h4>🔍 Cách kiểm tra</h4><p>${G.esc(it.test)}</p></div>
      <div class="sec"><h4>🏠 Thường gặp trong</h4><p>${G.esc(it.used)}</p></div>
      <p class="hint">Giá trị đo chỉ mang tính tham khảo — luôn đối chiếu tài liệu kỹ thuật của model.</p>`}
      <button class="btn big" data-close>OK</button>`;
    this.open(html);
    G.tts.speak(it.en);
  },

  // ---------- Hội thoại với NPC ----------
  talk(n, themeOverride, after) {
    const theme = themeOverride || n.r.dialog || 'street';
    const list = DIALOGS[theme] || DIALOGS.street;
    const d = list[(n.talked++ + Math.floor(Math.random() * list.length)) % list.length];
    const right = d.o[d.ok];
    const opts = G.shuffle(d.o);
    const s = G.state;
    const p = this.open(`
      <div class="talk">
        <canvas class="face" width="64" height="64"></canvas>
        <div class="bubble"><b>${G.esc(n.name)}</b><div class="say-en">${G.esc(d.say)} ${this.sayBtn(d.say)}</div>
          <div class="say-vi ${s.settings.vi ? '' : 'hide'}">${G.esc(d.vi)}</div>
          ${s.settings.vi ? '' : '<button class="mini" id="showvi">Xem nghĩa</button>'}</div>
      </div>
      <p class="qtxt">Bạn sẽ trả lời thế nào?</p>
      <div class="opts">${opts.map((o, i) => `<button class="opt left" data-i="${i}">${G.esc(o)}</button>`).join('')}</div>
      <div id="tres"></div>`, { onClose: after });
    const fc = p.querySelector('.face').getContext('2d');
    G.drawChar(fc, 32, 62, 0, 0, n.look, 1.6);
    const sv = this.el('showvi');
    if (sv) sv.addEventListener('click', () => { p.querySelector('.say-vi').classList.remove('hide'); sv.remove(); });
    setTimeout(() => G.tts.speak(d.say), 200);
    let done = false;
    this.on(p, '.opt', (b) => {
      if (done) return;
      done = true;
      const ok = opts[+b.dataset.i] === right;
      p.querySelectorAll('.opt').forEach((x, i) => { if (opts[i] === right) x.classList.add('right'); else if (x === b) x.classList.add('wrong'); x.disabled = true; });
      G.tts.speak(right);
      if (ok) { s.stats.talks++; G.audio.sfx('good'); G.game.addXp(15); G.game.addCoins(3); }
      else G.audio.sfx('bad');
      this.el('tres').innerHTML = `<div class="res ${ok ? 'good' : 'bad'}">${ok ? '✅ Rất tự nhiên! +15 XP, +3 🪙' : '❌ Câu đó chưa phù hợp. Câu đúng là: <b>' + G.esc(right) + '</b>'}</div><button class="btn big" data-close2>Tạm biệt 👋</button>`;
      this.el('tres').querySelector('[data-close2]').addEventListener('click', () => this.close());
      G.game.checkStory();
    });
  },

  // ---------- Toà nhà ----------
  building(b) {
    const f = this['b_' + b.t];
    if (f) f.call(this, b); else this.b_house(b);
  },
  head(b, sub) {
    const bt = BUILDING_TYPES[b.t];
    return `<h2>${bt.icon} ${G.esc(b.name)}</h2>${sub ? `<p class="sub">${sub}</p>` : ''}`;
  },

  b_home(b) {
    const s = G.state, g = G.game;
    const p = this.open(`${this.head(b, 'Home sweet home — Nhà là nơi để nghỉ ngơi.')}
      <div class="stats">
        <div>📖 Từ vựng<b>${g.ownedWords().length}/${G.allWords.length}</b></div>
        <div>🔩 Loại linh kiện<b>${Object.keys(s.seen).length}/${PARTS.length}</b></div>
        <div>🔧 Đơn đã sửa<b>${s.stats.jobs}</b></div>
        <div>💬 Hội thoại<b>${s.stats.talks}</b></div>
        <div>🧩 Mạch đã lắp<b>${s.stats.crafts}</b></div>
        <div>🗺️ Vùng đã đến<b>${Object.keys(s.visited).length}/${G.world.regions.length}</b></div>
      </div>
      <button class="btn big" id="sleep">😴 Đi ngủ (sang ngày mới, lưu game)</button>
      <button class="btn ghost" data-close>Ra ngoài</button>`);
    this.on(p, '#sleep', () => { this.close(); g.sleep(false); });
  },

  b_service(b) {
    const g = G.game, s = G.state;
    g.refreshBoard();
    const job = s.job ? g.jobById(s.job.id) : null;
    const jb = g.jobBuilding();
    let html = this.head(b, 'Quản lý <b>Ms. Lan</b>: “Good morning! Here are today’s repair orders.”');
    if (job) {
      html += `<div class="job active"><div class="jt">🔧 Đơn đang làm: ${G.esc(job.vi)}</div>
        <div class="jen">${G.esc(job.en)} ${this.sayBtn(job.en)}</div><div class="jvi">${G.esc(job.sv)}</div>
        <div>📍 ${G.esc(jb ? jb.name + ' — ' + jb.region.name : '?')}</div>
        <div class="need">Cần mang: ${Object.keys(job.need).map((id) => this.partChip(id, job.need[id])).join(' ')}</div>
        <button class="btn ghost small" id="drop">Huỷ đơn này</button></div>`;
    }
    html += '<h3>📋 Đơn sửa chữa hôm nay</h3>';
    if (!s.board.length) html += '<p class="hint">Hết đơn hôm nay rồi! Về nhà ngủ để nhận đơn mới vào ngày mai.</p>';
    s.board.forEach((id) => {
      const j = g.jobById(id);
      if (!j) return;
      html += `<div class="job"><div class="jt">${G.esc(j.vi)} · <span class="rew">+${j.coins} 🪙 +${j.xp} XP</span></div>
        <div class="jen">${G.esc(j.en)} ${this.sayBtn(j.en)}</div><div class="jvi">${G.esc(j.sv)}</div>
        <div class="need">Cần: ${Object.keys(j.need).map((pid) => this.partChip(pid, j.need[pid])).join(' ')}</div>
        <button class="btn small" data-take="${id}" ${job ? 'disabled' : ''}>${job ? 'Làm xong đơn hiện tại trước' : 'Nhận đơn'}</button></div>`;
    });
    html += `<button class="btn ghost" id="mgr">💬 Luyện nói chuyện với khách (Call Center)</button>`;
    const p = this.open(html);
    this.on(p, '[data-take]', (x) => { g.acceptJob(x.dataset.take); this.close(); });
    this.on(p, '#drop', () => { s.job = null; this.toast('Đã huỷ đơn.'); this.close(); });
    this.on(p, '#mgr', () => this.talk({ name: 'Khách hàng (điện thoại)', look: G.NPC_LOOKS[1], talked: Math.floor(Math.random() * 9), r: b.region }, 'service'));
  },

  b_house(b) {
    const g = G.game, s = G.state;
    const job = s.job && s.job.bkey === b.key ? g.jobById(s.job.id) : null;
    if (!job) {
      const p = this.open(`${this.head(b, '“Hello! Everything is working fine here, thank you!”')}
        <p>Nhà này hiện không có thiết bị cần sửa. Hãy nhận đơn ở <b>Trung Tâm Bảo Hành</b>.</p>
        <button class="btn" id="chat">💬 Trò chuyện với chủ nhà</button><button class="btn ghost" data-close>Ra ngoài</button>`);
      this.on(p, '#chat', () => this.talk({ name: 'Chủ nhà', look: G.NPC_LOOKS[G.strHash(b.key) % G.NPC_LOOKS.length], talked: Math.floor(Math.random() * 9), r: b.region }, 'service'));
      return;
    }
    const hasAll = g.hasAll(job.need);
    let html = `${this.head(b, 'Khách hàng: “' + G.esc(job.en) + '” ' + this.sayBtn(job.en))}
      <div class="job active"><div class="jt">🔧 ${G.esc(job.appliance)} — ${G.esc(job.vi)}</div><div class="jvi">${G.esc(job.sv)}</div>
      <div class="need">Linh kiện cần thay: ${Object.keys(job.need).map((id) => this.partChip(id, job.need[id])).join(' ')}</div></div>`;
    if (!hasAll) {
      html += `<div class="res bad">Bạn chưa đủ linh kiện! Hãy nhặt thêm trên đường hoặc mua/lắp ráp ở <b>Chợ Linh Kiện</b>.</div>
        <button class="btn ghost" data-close>Đi chuẩn bị</button>`;
      this.open(html);
      setTimeout(() => G.tts.speak(job.en), 200);
      return;
    }
    html += `<h3>🩺 Chẩn đoán</h3><div class="qsent">${G.esc(job.q.en)} ${this.sayBtn(job.q.en)}</div>
      <p class="hint">${G.esc(job.q.vi)}</p>
      <div class="opts">${job.q.o.map((o, i) => `<button class="opt left" data-i="${i}">${G.esc(o)}</button>`).join('')}</div><div id="jres"></div>`;
    const p = this.open(html);
    setTimeout(() => G.tts.speak(job.q.en), 200);
    let tries = 0, done = false;
    this.on(p, '.opt', (bt) => {
      if (done) return;
      const i = +bt.dataset.i;
      if (i === job.q.a) {
        done = true;
        bt.classList.add('right');
        Object.keys(job.need).forEach((id) => g.addItem(id, -job.need[id]));
        const coins = Math.round(job.coins * (tries ? 0.7 : 1));
        s.job = null; s.stats.jobs++;
        G.audio.sfx('good');
        this.el('jres').innerHTML = `<div class="res good">✅ Sửa thành công! ${G.esc(job.q.ex)}</div>
          <div class="wcard"><div class="en">“Thank you so much! It works perfectly now.” ${this.sayBtn('Thank you so much! It works perfectly now.')}</div><div class="vi">Cảm ơn rất nhiều! Giờ máy chạy hoàn hảo rồi.</div></div>
          <p class="center"><b>+${coins} 🪙 · +${job.xp} XP</b></p><button class="btn big" data-close3>Hoàn thành 🎉</button>`;
        this.el('jres').querySelectorAll('[data-say]').forEach((x) => x.addEventListener('click', () => G.tts.speak(x.dataset.say)));
        this.el('jres').querySelector('[data-close3]').addEventListener('click', () => this.close());
        G.tts.speak('Thank you so much! It works perfectly now.');
        g.addCoins(coins); g.addXp(job.xp); g.checkStory();
      } else {
        tries++;
        bt.classList.add('wrong'); bt.disabled = true;
        G.audio.sfx('bad');
        this.el('jres').innerHTML = `<div class="res bad">❌ Chưa đúng, hãy suy nghĩ lại! (thưởng giảm 30%)</div>`;
      }
    });
  },

  b_shop(b) { this.shop(b, 'buy'); },
  shop(b, tab) {
    const g = G.game, s = G.state, L = g.level;
    const tier = L >= 7 ? 4 : L >= 4 ? 3 : L >= 2 ? 2 : 1;
    let body = '';
    if (tab === 'buy') {
      body = PARTS.filter((x) => x.rarity <= tier).map((x) => `
        <div class="row"><img src="${G.partImg(x.id, 40)}" data-info="${x.id}"><div class="rn" data-info="${x.id}"><b>${G.esc(x.vi)}</b><small>${G.esc(x.en)} · có ${g.count(x.id)}</small></div>
        <button class="btn small" data-buy="${x.id}" ${s.coins < x.price ? 'disabled' : ''}>${x.price} 🪙</button></div>`).join('');
      if (tier < 4) body += `<p class="hint">Lên cấp để mở bán linh kiện hiếm hơn.</p>`;
    } else if (tab === 'sell') {
      const ids = Object.keys(s.parts).concat(Object.keys(s.mods));
      body = ids.length ? ids.map((id) => { const x = G.itemInfo(id); const pr = Math.max(1, Math.floor(x.price * (G.recipeById[id] ? 1 : 0.5))); return `
        <div class="row"><img src="${G.partImg(id, 40)}" data-info="${id}"><div class="rn" data-info="${id}"><b>${G.esc(x.vi)}</b><small>${G.esc(x.en)} · có ${g.count(id)}</small></div>
        <button class="btn small" data-sell="${id}">+${pr} 🪙</button></div>`; }).join('') : '<p class="hint">Balo trống.</p>';
    } else {
      body = RECIPES.map((r) => {
        const lock = r.level > L, can = !lock && g.hasAll(r.need);
        return `<div class="recipe ${lock ? 'locked' : ''}"><div class="rh"><img src="${G.partImg(r.id, 44)}" data-info="${r.id}"><div><b>${G.esc(r.vi)}</b><small>${G.esc(r.en)} · có ${g.count(r.id)}</small></div></div>
          <div class="need">${Object.keys(r.need).map((id) => this.partChip(id, r.need[id])).join(' ')}</div>
          ${lock ? `<div class="hint">🔒 Cần Level ${r.level}</div>` : `<button class="btn small" data-craft="${r.id}" ${can ? '' : 'disabled'}>🧩 Lắp ráp (+${r.xp} XP)</button>`}</div>`;
      }).join('');
    }
    const p = this.open(`${this.head(b, 'Chủ tiệm: “Welcome! What are you looking for today?”')}
      <div class="coins">🪙 ${s.coins}</div>
      <div class="tabs"><button data-tab="buy" class="${tab === 'buy' ? 'on' : ''}">Mua</button><button data-tab="sell" class="${tab === 'sell' ? 'on' : ''}">Bán</button><button data-tab="craft" class="${tab === 'craft' ? 'on' : ''}">🧩 Xưởng lắp ráp</button></div>
      <div class="list">${body}</div>
      <button class="btn ghost" id="sh-talk">💬 Hỏi mua bằng tiếng Anh</button>`);
    this.on(p, '[data-tab]', (x) => this.shop(b, x.dataset.tab));
    this.on(p, '[data-info]', (x) => { const id = x.dataset.info; this.partCard(id); this.onClose = () => this.shop(b, tab); });
    this.on(p, '[data-buy]', (x) => {
      const it = G.partById[x.dataset.buy];
      if (s.coins < it.price) return;
      g.addCoins(-it.price); g.addItem(it.id, 1); G.audio.sfx('coin');
      this.toast('🛒 Đã mua ' + it.vi + ' — ' + it.en);
      this.shop(b, 'buy'); g.checkStory();
    });
    this.on(p, '[data-sell]', (x) => {
      const id = x.dataset.sell, it = G.itemInfo(id);
      const pr = Math.max(1, Math.floor(it.price * (G.recipeById[id] ? 1 : 0.5)));
      if (g.count(id) <= 0) return;
      g.addItem(id, -1); g.addCoins(pr);
      this.shop(b, 'sell');
    });
    this.on(p, '[data-craft]', (x) => {
      const r = G.recipeById[x.dataset.craft];
      if (!g.hasAll(r.need)) return;
      Object.keys(r.need).forEach((id) => g.addItem(id, -r.need[id]));
      g.addItem(r.id, 1); s.stats.crafts++;
      G.audio.sfx('level');
      this.open(`<div class="center"><div class="big-emoji">🧩</div><h2>Lắp ráp thành công!</h2>
        <img src="${G.partImg(r.id, 96)}" alt=""><h3>${G.esc(r.vi)}</h3><div class="en">${G.esc(r.en)} ${this.sayBtn(r.en)}</div></div>
        <div class="sec"><h4>📘 Bạn vừa học được</h4><p>${G.esc(r.learn)}</p></div>
        <button class="btn big" id="cok">Tiếp tục</button>`);
      G.tts.speak(r.en);
      this.el('cok').addEventListener('click', () => this.shop(b, 'craft'));
      g.addXp(r.xp); g.checkStory();
    });
    this.on(p, '#sh-talk', () => this.talk({ name: 'Chủ tiệm', look: G.NPC_LOOKS[4], talked: Math.floor(Math.random() * 9), r: b.region }, 'shop'));
  },

  b_library(b) {
    const g = G.game, s = G.state;
    const own = g.ownedWords();
    const p = this.open(`${this.head(b, 'Yên tĩnh nào... Đây là nơi ôn tập từ vựng.')}
      <p>Bạn đang có <b>${own.length}</b> từ. Mỗi lượt ôn gồm 8 câu, ưu tiên những từ bạn chưa thuộc.</p>
      <p>Thưởng: <b>+3 🪙 và +6 XP</b> cho mỗi câu đúng.</p>
      <button class="btn big" id="rev" ${own.length < 4 ? 'disabled' : ''}>${own.length < 4 ? 'Cần ít nhất 4 từ để ôn tập' : '📝 Bắt đầu ôn tập'}</button>
      <button class="btn" id="dict">📖 Mở Từ điển</button>
      <button class="btn ghost" id="parts">🔩 Sổ tay linh kiện</button>`);
    this.on(p, '#rev', () => this.review());
    this.on(p, '#dict', () => this.dictionary());
    this.on(p, '#parts', () => this.handbook());
  },
  review() {
    const s = G.state, g = G.game;
    const own = g.ownedWords().map((e) => G.wordByEn[e]).filter(Boolean);
    const sorted = own.slice().sort((a, b) => (s.words[a.en].m - s.words[b.en].m) || (s.words[a.en].t - s.words[b.en].t));
    const qs = G.shuffle(sorted.slice(0, Math.max(8, Math.ceil(sorted.length / 3)))).slice(0, 8);
    let i = 0, score = 0;
    const next = () => {
      if (i >= qs.length) {
        s.stats.reviews++;
        G.audio.sfx('level');
        this.open(`<div class="center"><div class="big-emoji">📚</div><h2>Kết quả: ${score}/${qs.length}</h2>
          <p>+${score * 3} 🪙 · +${score * 6} XP</p><button class="btn big" data-close>Xong</button></div>`);
        g.addCoins(score * 3); g.addXp(score * 6); g.checkStory();
        return;
      }
      const w = qs[i];
      const type = G.pick(['vi', 'en', 'listen', 'blank']);
      const others = G.shuffle(G.allWords.filter((x) => x.en !== w.en && x.cat === w.cat)).slice(0, 3);
      const opts = G.shuffle([w, ...others]);
      const blank = w.ex.replace(new RegExp(w.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '_____');
      const q = type === 'vi' ? `<div class="qword">${G.esc(w.en)} ${this.sayBtn(w.en)}</div><p class="qtxt">Nghĩa là gì?</p>`
        : type === 'en' ? `<div class="qword vi">${G.esc(w.vi)}</div><p class="qtxt">Tiếng Anh là gì?</p>`
          : type === 'listen' ? `<div class="qword"><button class="say huge" data-say="${G.esc(w.en)}">🔊</button></div><p class="qtxt">Nghe và chọn</p>`
            : `<div class="qsent">“${G.esc(blank)}”</div><p class="qtxt">Điền từ còn thiếu</p>`;
      const txt = (o) => (type === 'vi' ? o.vi : o.en);
      const p = this.open(`<div class="tag">Câu ${i + 1}/${qs.length} · Đúng ${score}</div>${q}
        <div class="opts">${opts.map((o, k) => `<button class="opt" data-k="${k}">${G.esc(txt(o))}</button>`).join('')}</div><div id="rres"></div>`, { noClose: true });
      if (type === 'vi' || type === 'listen') setTimeout(() => G.tts.speak(w.en), 200);
      let done = false;
      this.on(p, '.opt', (b) => {
        if (done) return;
        done = true;
        const ok = opts[+b.dataset.k] === w;
        p.querySelectorAll('.opt').forEach((x, k) => { if (opts[k] === w) x.classList.add('right'); else if (x === b) x.classList.add('wrong'); x.disabled = true; });
        const rec = s.words[w.en];
        if (ok) { score++; rec.m = Math.min(5, rec.m + 1); G.audio.sfx('good'); } else { rec.m = Math.max(1, rec.m - 1); G.audio.sfx('bad'); }
        rec.t = Date.now();
        G.tts.speak(w.en);
        this.el('rres').innerHTML = `<div class="wcard"><b class="en">${G.esc(w.en)}</b> <span class="ipa">${G.esc(w.ipa)}</span> = ${G.esc(w.vi)}<div class="ex">${G.esc(w.ex)}</div></div><button class="btn big" id="rnext">Câu tiếp ›</button>`;
        this.el('rnext').addEventListener('click', () => { i++; next(); });
      });
    };
    next();
  },

  b_cafe(b) {
    const g = G.game, s = G.state;
    const p = this.open(`${this.head(b, 'Barista: “Hi! What would you like to drink?”')}
      <div class="row"><div class="big-emoji">☕</div><div class="rn"><b>Cà phê sữa đá</b><small>Iced milk coffee · Đi nhanh hơn trong 3 phút</small></div><button class="btn small" id="cof" ${s.coins < 10 ? 'disabled' : ''}>10 🪙</button></div>
      <button class="btn" id="chat">💬 Trò chuyện với Barista</button>
      <button class="btn ghost" data-close>Ra ngoài</button>`);
    this.on(p, '#cof', () => {
      g.addCoins(-10); s.boost = Date.now() + 180000;
      G.tts.speak('One iced milk coffee, please.');
      this.toast('☕ “One iced milk coffee, please.” — Bạn đi nhanh hơn trong 3 phút!');
      this.close();
    });
    this.on(p, '#chat', () => this.talk({ name: 'Barista', look: G.NPC_LOOKS[3], talked: Math.floor(Math.random() * 9), r: b.region }, b.region.dialog === 'travel' ? 'travel' : 'street'));
  },

  b_station(b) {
    const g = G.game, s = G.state, L = g.level;
    const stations = G.world.buildings.filter((x) => x.t === 'station' && x !== b);
    const p = this.open(`${this.head(b, 'Bus driver: “Where would you like to go?” — Vé: 5 🪙')}
      <div class="list">${stations.map((x) => {
        const lock = x.region.level > L;
        return `<div class="row"><div class="big-emoji">${lock ? '🔒' : '🚌'}</div><div class="rn"><b>${G.esc(x.region.name)}</b><small>${G.esc(x.region.en)}${lock ? ' · cần Level ' + x.region.level : ''}</small></div>
          <button class="btn small" data-go="${x.idx}" ${lock || s.coins < 5 ? 'disabled' : ''}>Đi</button></div>`;
      }).join('')}</div>`);
    this.on(p, '[data-go]', (x) => {
      const t = G.world.buildings[+x.dataset.go];
      g.addCoins(-5);
      g.player.x = (t.dx + 0.5) * G.TS;
      g.player.y = (t.dy + (t.doorTop ? -0.6 : 1.7)) * G.TS;
      G.tts.speak('Next stop, ' + t.region.en + '.');
      this.close();
    });
  },

  b_factory(b) { this.giftPlace(b, 'factory', 'Kỹ sư: “Welcome to our factory. Safety first!”', 'Nhận linh kiện mẫu (1 lần/ngày)'); },
  b_hotel(b) { this.giftPlace(b, 'travel', 'Lễ tân: “Welcome! How can I help you?”', 'Sửa giúp khách sạn, nhận quà (1 lần/ngày)'); },
  b_airport(b) { this.giftPlace(b, 'travel', 'Nhân viên: “Welcome to the International Airport!”', 'Nhận quà từ khách quốc tế (1 lần/ngày)'); },
  giftPlace(b, theme, sub, giftLabel) {
    const g = G.game, s = G.state;
    const got = s.gifts[b.key] === s.day;
    const p = this.open(`${this.head(b, sub)}
      <button class="btn big" id="gift" ${got ? 'disabled' : ''}>${got ? 'Hôm nay đã nhận rồi' : '🎁 ' + giftLabel}</button>
      <button class="btn" id="chat">💬 Trò chuyện</button>
      <button class="btn ghost" data-close>Ra ngoài</button>`);
    this.on(p, '#gift', () => {
      s.gifts[b.key] = s.day;
      const pool = b.region.parts.map((id) => G.partById[id]).filter((x) => x && x.rarity >= 2);
      const it = G.pick(pool.length ? pool : PARTS);
      const first = !s.seen[it.id];
      g.addItem(it.id, 1); g.addCoins(10); G.audio.sfx('good');
      this.close();
      if (first) this.partCard(it.id, true); else this.toast('🎁 Nhận ' + it.vi + ' (' + it.en + ') và 10 🪙');
      g.checkStory();
    });
    this.on(p, '#chat', () => this.talk({ name: b.name, look: G.NPC_LOOKS[G.strHash(b.key) % G.NPC_LOOKS.length], talked: Math.floor(Math.random() * 9), r: b.region }, theme));
  },

  // ---------- Menu chính ----------
  bag() {
    const s = G.state, g = G.game;
    const parts = Object.keys(s.parts), mods = Object.keys(s.mods);
    const cell = (id) => `<button class="cell" data-info="${id}"><img src="${G.partImg(id, 44)}"><span>${G.esc(G.itemInfo(id).vi)}</span><b>×${g.count(id)}</b></button>`;
    const p = this.open(`<h2>🎒 Balo</h2><div class="coins">🪙 ${s.coins}</div>
      <h3>Linh kiện</h3><div class="grid">${parts.length ? parts.map(cell).join('') : '<p class="hint">Chưa có linh kiện. Nhặt các vật phát sáng trên đường nhé!</p>'}</div>
      ${mods.length ? `<h3>Mô-đun đã lắp</h3><div class="grid">${mods.map(cell).join('')}</div>` : ''}
      <button class="btn ghost" id="hb">🔩 Sổ tay linh kiện (${Object.keys(s.seen).length}/${PARTS.length})</button>`);
    this.on(p, '[data-info]', (x) => { this.partCard(x.dataset.info); this.onClose = () => this.bag(); });
    this.on(p, '#hb', () => this.handbook());
  },
  handbook() {
    const s = G.state;
    const p = this.open(`<h2>🔩 Sổ tay linh kiện</h2><p class="sub">Đã sưu tầm ${Object.keys(s.seen).length}/${PARTS.length}. Chạm vào để xem chi tiết.</p>
      <div class="grid">${PARTS.map((x) => s.seen[x.id]
        ? `<button class="cell" data-info="${x.id}"><img src="${G.partImg(x.id, 44)}"><span>${G.esc(x.vi)}</span><small>${G.esc(x.en)}</small></button>`
        : `<div class="cell unk"><div class="q">?</div><span>???</span><small>${'⭐'.repeat(x.rarity)}</small></div>`).join('')}</div>`);
    this.on(p, '[data-info]', (x) => { this.partCard(x.dataset.info); this.onClose = () => this.handbook(); });
  },
  dictionary(cat) {
    const s = G.state;
    const cats = Object.keys(WORD_CATS);
    cat = cat || 'all';
    const list = G.allWords.filter((w) => s.words[w.en] && (cat === 'all' || w.cat === cat))
      .sort((a, b) => a.en.localeCompare(b.en));
    const p = this.open(`<h2>📖 Từ điển của bạn</h2><p class="sub">Đã thu thập ${Object.keys(s.words).length}/${G.allWords.length} từ</p>
      <div class="cats"><button data-cat="all" class="${cat === 'all' ? 'on' : ''}">Tất cả</button>${cats.map((c) => {
        const tot = WORD_CATS[c].words.length, own = WORD_CATS[c].words.filter((w) => s.words[w[0]]).length;
        return `<button data-cat="${c}" class="${cat === c ? 'on' : ''}">${WORD_CATS[c].icon} ${G.esc(WORD_CATS[c].name)} <small>${own}/${tot}</small></button>`;
      }).join('')}</div>
      <div class="dict">${list.length ? list.map((w) => `<div class="drow" data-say="${G.esc(w.en)}">
        <div><b>${G.esc(w.en)}</b> <span class="ipa">${G.esc(w.ipa)}</span> ${this.stars(s.words[w.en].m)}</div>
        <div class="vi">${G.esc(w.vi)}</div><div class="ex">${G.esc(w.ex)}</div></div>`).join('') : '<p class="hint">Chưa có từ nào trong nhóm này. Hãy đi tìm các quả cầu chữ phát sáng!</p>'}</div>`);
    this.on(p, '[data-cat]', (x) => this.dictionary(x.dataset.cat));
  },
  quests() {
    const s = G.state, g = G.game;
    const job = s.job ? g.jobById(s.job.id) : null, jb = g.jobBuilding();
    const p = this.open(`<h2>📜 Nhiệm vụ</h2>
      ${job ? `<div class="job active"><div class="jt">🔧 ${G.esc(job.vi)}: ${G.esc(job.sv)}</div><div>📍 ${G.esc(jb ? jb.name + ' — ' + jb.region.name : '')}</div>
        <div class="need">${Object.keys(job.need).map((id) => this.partChip(id, job.need[id])).join(' ')}</div></div>` : ''}
      <div class="qlist">${STORY.map((q, i) => {
        const st = i < s.story ? 'done' : i === s.story ? 'cur' : 'lock';
        const pr = g.storyProgress(q);
        return `<div class="q ${st}"><div class="qt">${st === 'done' ? '✅' : st === 'cur' ? '▶️' : '🔒'} ${G.esc(q.title)}</div>
          ${st !== 'lock' ? `<div class="qd">${G.esc(q.desc)}</div>` : ''}
          ${st === 'cur' ? `<div class="bar"><i style="width:${Math.min(100, (pr.cur / pr.max) * 100)}%"></i></div><small>${Math.min(pr.cur, pr.max)}/${pr.max} · Thưởng ${q.coins} 🪙 ${q.xp ? '+ ' + q.xp + ' XP' : ''}</small>` : ''}</div>`;
      }).join('')}</div>`);
    return p;
  },
  map() {
    const g = G.game, L = g.level;
    const p = this.open(`<h2>🗺️ Bản đồ thế giới</h2><canvas id="bigmap"></canvas>
      <div class="legend">${G.world.regions.map((r) => `<div class="${r.level > L ? 'lock' : ''}">${r.level > L ? '🔒' : G.state.visited[r.id] ? '✅' : '❔'} <b>${G.esc(r.name)}</b> <small>${G.esc(r.en)} · Lv ${r.level}</small></div>`).join('')}</div>
      <p class="hint">Đi xe buýt ở các 🚌 Trạm xe buýt để di chuyển nhanh giữa các vùng.</p>`, { cls: 'wide' });
    const c = p.querySelector('#bigmap');
    const W = Math.min(p.clientWidth - 24, 700);
    const k = W / G.world.w;
    c.width = Math.round(W * 2); c.height = Math.round(G.world.h * k * 2);
    c.style.width = W + 'px'; c.style.height = G.world.h * k + 'px';
    const x = c.getContext('2d');
    x.scale(2, 2);
    x.imageSmoothingEnabled = false;
    x.drawImage(G.world.mini, 0, 0, G.world.w * k, G.world.h * k);
    G.world.regions.forEach((r) => {
      const X = r.gx * G.RW * k, Y = r.gy * G.RH * k, RW = G.RW * k, RH = G.RH * k;
      if (r.level > L) { x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(X, Y, RW, RH); }
      x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = 1; x.strokeRect(X + 0.5, Y + 0.5, RW - 1, RH - 1);
      x.font = 'bold 11px system-ui'; x.textAlign = 'center';
      x.lineWidth = 3; x.strokeStyle = 'rgba(0,0,0,.7)';
      const label = (r.level > L ? '🔒 ' : '') + r.name;
      x.strokeText(label, X + RW / 2, Y + 14); x.fillStyle = '#fff'; x.fillText(label, X + RW / 2, Y + 14);
    });
    G.world.buildings.forEach((b) => {
      if (b.t === 'house' || b.t === 'station') return;
      x.font = '10px system-ui'; x.fillText(BUILDING_TYPES[b.t].icon, (b.x + b.w / 2) * k, (b.y + b.h / 2) * k + 4);
    });
    const gt = g.guideTarget();
    if (gt) { x.fillStyle = '#ffd600'; x.beginPath(); x.arc(gt.b.dx * k, gt.b.dy * k, 4, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#000'; x.lineWidth = 1; x.stroke(); }
    x.fillStyle = '#fff'; x.strokeStyle = '#e53935'; x.lineWidth = 2;
    x.beginPath(); x.arc(g.player.x / G.TS * k, g.player.y / G.TS * k, 4, 0, Math.PI * 2); x.fill(); x.stroke();
  },
  settings() {
    const s = G.state.settings;
    const p = this.open(`<h2>⚙️ Cài đặt</h2>
      <label class="set"><input type="checkbox" id="s-tts" ${s.tts ? 'checked' : ''}> 🔊 Đọc phát âm tiếng Anh</label>
      <label class="set">🐢 Tốc độ đọc <input type="range" id="s-rate" min="0.5" max="1.2" step="0.1" value="${s.rate}"> <span id="s-rv">${s.rate}</span></label>
      <label class="set"><input type="checkbox" id="s-sfx" ${s.sfx ? 'checked' : ''}> 🎵 Hiệu ứng âm thanh</label>
      <label class="set"><input type="checkbox" id="s-vi" ${s.vi ? 'checked' : ''}> 🇻🇳 Hiện nghĩa tiếng Việt khi nói chuyện</label>
      <button class="btn" id="s-test">🔊 Thử giọng đọc</button>
      <button class="btn" id="s-save">💾 Lưu game ngay</button>
      <button class="btn danger" id="s-reset">🗑️ Chơi lại từ đầu</button>
      <p class="hint">Mẹo: Trên iPhone/iPad mở bằng Safari → nút Chia sẻ → “Thêm vào MH chính” để chơi toàn màn hình như ứng dụng. Nếu không nghe tiếng, hãy tắt chế độ im lặng.</p>`);
    this.on(p, '#s-test', () => G.tts.speak('Hello technician! Let us learn English and electronics together.'));
    p.querySelector('#s-tts').addEventListener('change', (e) => { s.tts = e.target.checked; });
    p.querySelector('#s-sfx').addEventListener('change', (e) => { s.sfx = e.target.checked; });
    p.querySelector('#s-vi').addEventListener('change', (e) => { s.vi = e.target.checked; });
    p.querySelector('#s-rate').addEventListener('input', (e) => { s.rate = +e.target.value; this.el('s-rv').textContent = s.rate; });
    this.on(p, '#s-save', () => { G.game.save(); this.toast('💾 Đã lưu!'); });
    this.on(p, '#s-reset', () => {
      if (!confirm('Xoá toàn bộ tiến trình và chơi lại từ đầu?')) return;
      G.store.clear(); this.close(); G.game.start(true);
    });
  },
};
