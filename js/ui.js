// Giao diện: hộp thoại, đố từ, kho đồ, cửa hàng, xưởng, hội thoại, từ điển, bản đồ...
G.ui = {
  el(id) { return document.getElementById(id); },
  isOpen() { return this.el('modal').classList.contains('on'); },

  open(html, opts = {}) {
    const m = this.el('modal'), p = this.el('panel');
    const keep = opts.keepScroll && this.isOpen() ? p.scrollTop : 0;
    p.className = 'panel' + (opts.cls ? ' ' + opts.cls : '');
    p.innerHTML = (opts.noClose ? '' : '<button class="x" data-close aria-label="Đóng">✕</button>') + html;
    m.classList.add('on');
    G.input.reset();
    document.getElementById('joy').classList.remove('on');
    p.scrollTop = keep;
    this.onClose = opts.onClose || null;
    p.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => { G.audio.sfx('click'); this.close(); }));
    this.bindSay(p);
    return p;
  },
  bindSay(root) { root.querySelectorAll('[data-say]').forEach((b) => { if (b.dataset.bound) return; b.dataset.bound = 1; b.addEventListener('click', (e) => { e.stopPropagation(); G.tts.speak(b.dataset.say); }); }); },
  close() {
    this.el('modal').classList.remove('on');
    const cb = this.onClose; this.onClose = null;
    if (G.game.state) { G.game.updateHud(true); this.renderHotbar(); }
    if (cb) cb();
    if (!this.isOpen() && this.toastQ && this.toastQ.length) { const q = this.toastQ.splice(0); q.forEach(([m, t], i) => setTimeout(() => this.toast(m, t), i * 700)); }
    if (!this.isOpen() && this.queue && this.queue.length) { const f = this.queue.shift(); setTimeout(() => { if (this.isOpen()) this.queue.unshift(f); else f(); }, 60); }
  },
  on(p, sel, fn) { p.querySelectorAll(sel).forEach((b) => b.addEventListener('click', (e) => { G.audio.sfx('click'); fn(b, e); })); },

  toast(msg, type) {
    if (this.isOpen()) { (this.toastQ = this.toastQ || []).push([msg, type]); if (this.toastQ.length > 4) this.toastQ.shift(); return; }
    const box = this.el('toasts');
    const d = document.createElement('div');
    d.className = 'toast' + (type ? ' ' + type : '');
    d.textContent = msg;
    box.appendChild(d);
    while (box.children.length > 3) box.removeChild(box.firstChild);
    setTimeout(() => d.classList.add('out'), 3400);
    setTimeout(() => d.remove(), 3900);
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
  stars(m, max = 5) { return '<span class="stars">' + '★'.repeat(Math.min(m, max)) + '<i>' + '★'.repeat(max - Math.min(m, max)) + '</i></span>'; },

  // ---------- Thanh đồ nhanh (6 ô đầu của balo) ----------
  renderHotbar() {
    const hb = this.el('hotbar'), s = G.state;
    if (!hb || !s || !s.inv) return;
    hb.style.display = G.feat.has('farm') ? '' : 'none';
    let html = '';
    for (let i = 0; i < 6; i++) {
      const sl = s.inv[i];
      html += `<button class="hslot${i === s.sel ? ' sel' : ''}" data-i="${i}">${sl ? `<img src="${G.partImg(sl.id, 36)}" alt=""><b>${sl.n > 1 ? sl.n : ''}</b>` : ''}</button>`;
    }
    if (hb.innerHTML !== html) hb.innerHTML = html;
  },
  hotbarTap(i) {
    const s = G.state;
    if (s.sel === i && s.inv[i]) { this.bag(false); return; }
    s.sel = i;
    this.renderHotbar();
    const sl = s.inv[i], nm = this.el('hbname');
    nm.textContent = sl ? G.items[sl.id].vi + ' · ' + G.items[sl.id].en : 'Ô trống';
    nm.classList.remove('show'); void nm.offsetWidth; nm.classList.add('show');
    G.audio.sfx('click');
  },

  // ---------- Giới thiệu ----------
  intro() {
    const nm = G.esc(G.state.profile.name);
    this.open(`
      <h2>👷 Chào mừng, ${nm}!</h2>
      <p>Bạn là kỹ thuật viên mới của <b>Trung Tâm Bảo Hành</b>. Hôm nay là ngày đầu tiên — cứ từ từ khám phá nhé!</p>
      <ul class="howto">
        <li>🕹️ <span>Kéo ngón tay ở <b>nửa trái</b> màn hình để đi lại.</span></li>
        <li>🟡 <span>Mũi tên vàng chỉ đường tới <b>nhiệm vụ hiện tại</b> (📜 ở góc trên).</span></li>
        <li><span class="orb">A</span> <span>Đi vào <b>quả cầu chữ</b> phát sáng để học từ tiếng Anh.</span></li>
        <li>🔓 <span>Mỗi nhiệm vụ hoàn thành sẽ <b>mở thêm tính năng mới</b>: trò chuyện, sửa chữa, trồng trọt, trà sữa, mua sắm...</span></li>
      </ul>
      <button class="btn big" data-close>Bắt đầu thôi! 🚀</button>`);
  },

  // hộp thoại chờ: mở ngay nếu đang rảnh, hoặc sau khi đóng hộp hiện tại
  later(fn) { if (this.isOpen()) (this.queue = this.queue || []).push(fn); else fn(); },
  unlocked(keys) {
    this.later(() => {
      G.audio.sfx('level');
      this.open(`<div class="center"><div class="big-emoji">🔓</div><h2>Mở khoá tính năng mới!</h2></div>
        ${keys.map((k) => FEATURES[k]).filter(Boolean).map((f) => `<div class="sec"><h4>${f.icon} ${G.esc(f.name)}</h4><p>${G.esc(f.how)}</p></div>`).join('')}
        <button class="btn big" data-close>Đã hiểu! 👍</button>`);
      keys.filter((k) => TUTORIALS[k]).forEach((k) => this.later(() => G.tutorial(k)));
    });
  },

  // ---------- Tạo / đổi nhân vật ----------
  createChar(onDone, isNew) {
    const s = G.state;
    const pf = Object.assign({}, s.profile);
    const owned = Object.keys((G.petshop.st()).owned).filter((k) => G.PETS[k]);
    const render = () => {
      const sw = (key, i, col) => `<button class="sw ${pf[key] === i ? 'on' : ''}" data-k="${key}" data-i="${i}" style="background:${col}"></button>`;
      const p = this.open(`<h2>${isNew ? '👋 Tạo nhân vật của bạn' : '🧑‍🔧 Đổi nhân vật'}</h2>
        <div class="cc"><canvas id="ccprev" width="300" height="180"></canvas>
        <div class="ccf">
          <label class="set">📝 Tên <input id="ccname" class="tin" maxlength="16" value="${G.esc(pf.name)}" autocomplete="off"></label>
          <div class="set">🚻 Giới tính <button class="tchip ${pf.gender === 'm' ? 'on' : ''}" data-g="m">👨 Nam</button><button class="tchip ${pf.gender === 'f' ? 'on' : ''}" data-g="f">👩 Nữ</button></div>
          <div class="set">🎨 Màu da ${G.LOOK_OPTS.skin.map((c, i) => sw('skin', i, c)).join('')}</div>
          <div class="set">💇 Tóc ${G.LOOK_OPTS.hair.map((c, i) => sw('hair', i, c)).join('')}</div>
          <div class="set">👕 Áo ${G.LOOK_OPTS.shirt.map((c, i) => sw('shirt', i, c)).join('')}</div>
          ${owned.length ? `<div class="set">🐾 Thú cưng <button class="tchip ${!pf.pet ? 'on' : ''}" data-pet="">Không</button>${owned.map((k) => [k, G.PETS[k]]).map(([k, v]) => `<button class="tchip ${pf.pet === k ? 'on' : ''}" data-pet="${k}">${v.icon} ${G.esc((s.pets.owned[k] && s.pets.owned[k].name) || v.vi)}</button>`).join('')}</div>` : ''}
        </div></div>
        <p class="hint">Tên sẽ được dùng trong các cuộc hội thoại tiếng Anh (“Nice to meet you, I’m …”), khi nhân viên trà sữa gọi tên, và khi khách hàng xưng hô (anh/chị).</p>
        <button class="btn big" id="ccok">${isNew ? 'Bắt đầu với nhân vật này ›' : 'Lưu'}</button>`, { noClose: isNew });
      const c = p.querySelector('#ccprev'), x = c.getContext('2d');
      x.scale(2, 2);
      const look = G.playerLook(pf);
      [0, 2, 3].forEach((d, k) => G.drawChar(x, pf.pet ? 24 + k * 37 : 30 + k * 45, 80, d, 0, look, 1.5));
      if (pf.pet) { x.save(); x.translate(134, 84); x.scale(1.4, 1.4); G.drawPet(x, 0, 0, pf.pet, 0, 0, false); x.restore(); }
      p.querySelector('#ccname').addEventListener('input', (e) => { pf.name = e.target.value; });
      p.querySelectorAll('[data-g]').forEach((b) => b.addEventListener('click', () => { pf.gender = b.dataset.g; G.audio.sfx('click'); render(); }));
      p.querySelectorAll('[data-pet]').forEach((b) => b.addEventListener('click', () => { pf.pet = b.dataset.pet || ''; G.audio.sfx('click'); render(); }));
      p.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => { pf[b.dataset.k] = +b.dataset.i; G.audio.sfx('click'); render(); }));
      this.on(p, '#ccok', () => {
        pf.name = (pf.name || '').trim().replace(/[<>{}]/g, '').slice(0, 16) || (pf.gender === 'f' ? 'Lan' : 'Minh');
        s.profile = pf;
        G.tts.speak('Nice to meet you, ' + pf.name + '!');
        G.game.save();
        this.close();
        if (onDone) onDone();
      });
    };
    render();
  },

  levelUp(L, opened) {
    if (this.isOpen()) { this.later(() => this.levelUp(L, opened)); return; }
    const txt = opened.length ? `<p>🔓 Mở khoá vùng đất: <b>${opened.map((r) => G.esc(r.name)).join(', ')}</b></p>` : '';
    const newCrops = CROPS.filter((c) => c.level === L);
    this.open(`<div class="center"><div class="big-emoji">🎀🎉💖</div><h2>LEVEL UP! Lv ${L}</h2>${txt}
      ${newCrops.length ? `<p>🌱 Hạt giống mới: <b>${newCrops.map((c) => G.esc(c.vi + ' (' + c.en + ')')).join(', ')}</b></p>` : ''}
      <p class="hint">Chợ linh kiện có hàng mới · Đơn sửa chữa mới đã mở.</p>
      <button class="btn big" data-close>Tuyệt vời!</button></div>`);
    G.game.refreshBoard(true);
  },

  // ---------- Đố từ khi nhặt quả cầu chữ ----------
  quizWord(w, done) {
    const s = G.state;
    const rec = s.words[w.en];
    const m = rec ? rec.m : 0;
    const types = m === 0 ? ['vi'] : m === 1 ? ['vi', 'en'] : m === 2 ? ['en', 'listen', 'blank'] : ['listen', 'blank', 'en'];
    let type = G.pick(types);
    if (type === 'blank' && !w.ex.toLowerCase().includes(w.en.toLowerCase())) type = 'en';
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
      const ok = opts[+b.dataset.i] === w;
      p.querySelectorAll('.opt').forEach((x, i) => { if (opts[i] === w) x.classList.add('right'); else if (x === b) x.classList.add('wrong'); x.disabled = true; });
      if (ok) { s.words[w.en] = { m: Math.min(5, m + 1), t: Date.now() }; s.stats.caught++; G.audio.sfx('good'); }
      else { if (rec) rec.m = Math.max(1, m - 1); s.stats.wrong++; G.audio.sfx('bad'); }
      G.tts.speak(w.ex);
      const res = this.el('qres');
      res.innerHTML = `
        <div class="res ${ok ? 'good' : 'bad'}">${ok ? (rec ? '✅ Chính xác! Độ thuộc tăng lên.' : '✅ Chính xác! Đã thêm vào Từ điển.') : '❌ Chưa đúng. Quả cầu đã bay đi, bạn sẽ gặp lại nó sau!'}</div>
        <div class="wcard">
          <div><b class="en">${G.esc(w.en)}</b> ${this.sayBtn(w.en)} <span class="ipa">${G.esc(w.ipa)}</span></div>
          <div class="vi">= ${G.esc(w.vi)}</div>
          <div class="ex">${G.esc(w.ex)} ${this.sayBtn(w.ex)}</div>
        </div>
        ${G.stt.supported ? `<button class="btn ghost" id="qmic">🎤 Luyện đọc từ này</button><div id="qmicres"></div>` : ''}
        <button class="btn big" id="qok">Tiếp tục</button>`;
      this.bindSay(res);
      const mic = this.el('qmic');
      if (mic) mic.addEventListener('click', () => this.speakPractice(w.en, this.el('qmicres')));
      this.el('qok').addEventListener('click', () => { G.audio.sfx('click'); this.close(); done && done(ok); });
    });
  },

  // ---------- Thẻ thông tin vật phẩm ----------
  partCard(id, isNew) { this.itemCard(id, isNew); },
  itemCard(id, isNew) {
    const it = G.itemInfo(id);
    if (!it) return;
    let body = '';
    if (it.kind === 'part') body = `
      <div class="sec"><h4>📘 Chức năng</h4><p>${G.esc(it.desc)}</p></div>
      <div class="sec"><h4>🔍 Cách kiểm tra</h4><p>${G.esc(it.test)}</p></div>
      <div class="sec"><h4>🏠 Thường gặp trong</h4><p>${G.esc(it.used)}</p></div>
      <p class="hint">Giá trị đo chỉ mang tính tham khảo — luôn đối chiếu tài liệu kỹ thuật của model.</p>`;
    else if (it.kind === 'mod') body = `<div class="sec"><h4>📘 Kiến thức</h4><p>${G.esc(it.learn)}</p></div>`;
    else body = `<div class="sec"><h4>📘 Mô tả</h4><p>${G.esc(it.desc || '')}</p></div>`;
    const sub = it.kind === 'part' ? '⭐'.repeat(it.rarity) + ' · Giá ' + it.price + ' 🪙'
      : it.kind === 'mod' ? 'Mô-đun lắp ráp · bán ' + it.price + ' 🪙'
        : it.kind === 'crop' ? 'Nông sản · bán ' + it.price + ' 🪙' : it.kind === 'seed' ? 'Hạt giống · ' + it.price + ' 🪙' : 'Dụng cụ';
    this.open(`
      ${isNew ? '<div class="tag gold">✨ Linh kiện mới được thêm vào Sổ tay!</div>' : ''}
      <div class="pcard">
        <img src="${G.partImg(id, 96)}" alt="">
        <div><h2>${G.esc(it.vi)}</h2><div class="en">${G.esc(it.en)} ${this.sayBtn(it.en)}</div><div class="rar">${sub}</div></div>
      </div>${body}
      <button class="btn big" data-close>OK</button>`);
    G.tts.speak(it.en);
  },

  // ---------- Luyện nói (nhận giọng nói) ----------
  speakPractice(text, box, cb) {
    if (!box) return;
    if (!G.stt.supported) { box.innerHTML = '<p class="hint">Thiết bị/trình duyệt này chưa hỗ trợ nhận giọng nói. Trên iPhone/iPad hãy mở bằng Safari (iOS 14.5 trở lên).</p>'; return; }
    box.innerHTML = '<div class="mic on">🎙️ Đang nghe... hãy đọc to: <b>' + G.esc(text) + '</b></div>';
    G.stt.listen((alts) => {
      const best = alts.map((a) => [a, G.similarity(a, text)]).sort((a, b) => b[1] - a[1])[0];
      const pct = Math.round(best[1] * 100);
      const msg = pct >= 85 ? '🌟 Tuyệt vời! Phát âm rất rõ.' : pct >= 70 ? '👍 Khá tốt!' : pct >= 45 ? '🙂 Gần đúng rồi, nghe mẫu 🔊 và thử lại nhé.' : '🔁 Máy chưa nghe rõ, hãy nói chậm và to hơn.';
      box.innerHTML = `<div class="mic ${pct >= 70 ? 'good' : 'bad'}"><b>${pct}%</b> ${msg}<br><small>Máy nghe được: “${G.esc(best[0])}”</small></div>`;
      if (pct >= 70) G.state.stats.spoke++;
      cb && cb(best[1]);
    }, (err) => {
      const m = err === 'not-allowed' || err === 'service-not-allowed' ? 'Bạn cần cho phép dùng micro và nhận dạng giọng nói (Cài đặt → Safari → Micro).'
        : err === 'nospeech' || err === 'no-speech' ? 'Không nghe thấy gì. Bấm 🎤 lại và nói to hơn nhé.' : 'Không nhận được giọng nói (' + err + ').';
      box.innerHTML = `<div class="mic bad">${m}</div>`;
    });
  },

  // ---------- Hội thoại ----------
  fill(text, ctx = {}) {
    const night = G.game.nightRaw() > 0.3, w = G.game.weather;
    const wt = WEATHER_TALK[w === 'sunny' && night ? 'night' : w] || WEATHER_TALK.sunny;
    return String(text).replace(/\{greet\}/g, G.clock.greet()).replace(/\{wrong\}/g, G.clock.wrongGreet())
      .replace(/\{weather_q\}/g, wt.q).replace(/\{weather_a\}/g, wt.a)
      .replace(/\{appliance\}/g, ctx.appliance || 'appliance').replace(/\{symptom\}/g, ctx.symptom || '')
      .replace(/\{symptom_vi\}/g, ctx.symptomVi || '')
      .replace(/\{name\}/g, G.state.profile.name).replace(/\{anh\}/g, G.state.profile.gender === 'f' ? 'chị' : 'anh')
      .replace(/\{Anh\}/g, G.state.profile.gender === 'f' ? 'Chị' : 'Anh')
      .replace(/\{hours\}/g, G.work.hoursEn()).replace(/\{days\}/g, G.work.daysEn()).replace(/\{next\}/g, G.work.nextWorkDayEn());
  },
  chatNpc(n) {
    const s = G.state;
    const theme = { street: 'street', service: 'street', shop: 'shop', travel: 'travel', factory: 'factory' }[n.r.dialog] || 'street';
    const list = CONVOS.filter((c) => c.theme === theme);
    const fresh = list.filter((c) => (s.convos[c.id] || 0) < 3);
    if (list.length && (fresh.length || Math.random() < 0.5)) this.convo(G.pick(fresh.length ? fresh : list), { who: n.name, look: n.look });
    else this.talk(n);
  },
  // Hội thoại nhiều lượt có chấm điểm
  convo(c, opts = {}) {
    const s = G.state, ctx = opts.ctx || {};
    const who = opts.who || c.who + (opts.phone ? ' 📞' : '');
    const look = opts.look || G.NPC_LOOKS[(c.look || 0) % G.NPC_LOOKS.length];
    const st = { i: 0, pts: 0, max: c.steps.length * 2, log: [] };
    const render = () => {
      if (st.i >= c.steps.length) return finish();
      const step = c.steps[st.i];
      const npc = this.fill(step.npc, ctx), vi = this.fill(step.vi, ctx);
      const options = G.shuffle(step.o.map((o) => ({ t: this.fill(o[0], ctx), sc: o[1], tip: o[2] })));
      let missed = 0, locked = false;
      const p = this.open(`
        <div class="tag">${opts.phone ? '📞 Cuộc gọi' : '💬 Hội thoại'} · ${G.esc(c.title)} · Lượt ${st.i + 1}/${c.steps.length}</div>
        ${st.log.length ? `<div class="chat">${st.log.map((l) => `<div class="msg ${l.me ? 'me' : 'them'}">${G.esc(l.t)}</div>`).join('')}</div>` : ''}
        <div class="talk">
          <canvas class="face${opts.phone ? ' phone' : ''}" width="128" height="128"></canvas>
          <div class="bubble"><b>${G.esc(who)}</b><div class="say-en">${G.esc(npc)} ${this.sayBtn(npc)}</div>
            <div class="say-vi ${s.settings.vi ? '' : 'hide'}">${G.esc(vi)}</div>
            ${s.settings.vi ? '' : '<button class="mini" id="showvi">Xem nghĩa</button>'}</div>
        </div>
        ${step.html || ''}
        <p class="qtxt">Chọn câu trả lời <b>tự nhiên & lịch sự</b> nhất${G.stt.supported ? ' — hoặc bấm 🎤 và nói' : ''}:</p>
        <div class="opts">${options.map((o, k) => `<button class="opt left" data-k="${k}">${G.esc(o.t)}</button>`).join('')}</div>
        ${G.stt.supported ? '<button class="btn small ghost" id="csay">🎤 Nói câu trả lời</button><div id="csayres"></div>' : ''}
        <div id="cres"></div>`, { onClose: opts.onCancel });
      const csay = this.el('csay');
      if (csay) csay.addEventListener('click', () => {
        const box = this.el('csayres');
        box.innerHTML = '<div class="mic on">🎙️ Đang nghe... đọc to câu trả lời bạn chọn</div>';
        G.stt.listen((alts) => {
          let best = -1, bs = 0, heard = alts[0] || '';
          options.forEach((o, k) => alts.forEach((a) => { const v = G.similarity(a, o.t); if (v > bs) { bs = v; best = k; heard = a; } }));
          const btn = p.querySelector('.opt[data-k="' + best + '"]');
          if (best >= 0 && bs >= 0.55 && btn && !btn.disabled) { box.innerHTML = `<div class="mic good">🎤 ${Math.round(bs * 100)}% — “${G.esc(heard)}”</div>`; btn.click(); }
          else box.innerHTML = `<div class="mic bad">Máy nghe được: “${G.esc(heard)}” — chưa khớp câu nào (${Math.round(bs * 100)}%). Nói lại rõ hơn nhé.</div>`;
        }, () => { box.innerHTML = '<div class="mic bad">Không nghe thấy gì. Kiểm tra quyền Micro rồi thử lại.</div>'; });
      });
      const fc = p.querySelector('.face').getContext('2d');
      fc.scale(2, 2);
      G.drawChar(fc, 32, 62, 0, 0, look, 1.55);
      if (opts.phone) { fc.font = '16px system-ui'; fc.fillText('📞', 42, 20); }
      const sv = this.el('showvi');
      if (sv) sv.addEventListener('click', () => { p.querySelector('.say-vi').classList.remove('hide'); sv.remove(); });
      setTimeout(() => G.tts.speak(npc), 200);
      this.on(p, '.opt', (b) => {
        if (locked) return;
        const o = options[+b.dataset.k];
        const res = this.el('cres');
        if (o.sc === 0) {
          missed++; b.classList.add('wrong'); b.disabled = true;
          G.audio.sfx('bad'); G.tts.speak("Sorry? I don't quite understand.");
          res.innerHTML = `<div class="res bad">❌ ${G.esc(o.tip)}<br><i>“Sorry? I don’t quite understand.”</i> — Hãy chọn lại.</div>`;
          return;
        }
        locked = true;
        const best = options.find((x) => x.sc === 2);
        st.pts += Math.max(0, o.sc - missed * 0.5);
        p.querySelectorAll('.opt').forEach((x, k) => { const oo = options[k]; if (oo === best) x.classList.add('right'); else if (x === b) x.classList.add('okish'); x.disabled = true; });
        s.phrases[best.t] = { th: c.theme, tip: best.tip, t: Date.now() };
        st.log.push({ t: npc }); st.log.push({ t: o.t, me: true });
        G.audio.sfx(o.sc === 2 ? 'good' : 'ok');
        G.tts.speak(best.t);
        res.innerHTML = `
          <div class="res ${o.sc === 2 ? 'good' : 'mid'}">${o.sc === 2 ? '✅ Rất tốt! ' : '🟡 Hiểu được, nhưng chưa hay. '}${G.esc(o.tip)}</div>
          ${o.sc === 2 ? '' : `<div class="wcard"><small>Câu hay hơn:</small><div class="en">${G.esc(best.t)} ${this.sayBtn(best.t)}</div><div class="ex">${G.esc(best.tip)}</div></div>`}
          ${G.stt.supported ? `<button class="btn ghost" id="cmic">🎤 Luyện nói câu mẫu</button><div id="cmicres"></div>` : ''}
          <button class="btn big" id="cnext">${st.i + 1 < c.steps.length ? 'Tiếp ›' : 'Kết thúc'}</button>`;
        this.bindSay(res);
        let spoke = false;
        const mic = this.el('cmic');
        if (mic) mic.addEventListener('click', () => this.speakPractice(best.t, this.el('cmicres'), (sc) => {
          if (sc >= 0.7 && !spoke) { spoke = true; G.game.addXp(5); }
        }));
        this.el('cnext').addEventListener('click', () => { G.audio.sfx('click'); st.i++; render(); });
        p.scrollTop = p.scrollHeight;
      });
    };
    const finish = () => {
      const ratio = st.pts / st.max;
      const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1;
      const prev = s.convos[c.id] || 0;
      s.convos[c.id] = Math.max(prev, stars);
      if (stars >= 2) s.stats.talks++;
      if (c.theme === 'service') s.stats.calls = (s.stats.calls || 0) + 1;
      if (stars >= 2 && c.theme === 'afterhours') s.stats.declined = (s.stats.declined || 0) + 1;
      const xp = Math.round(6 * c.steps.length * stars / 3) + (prev === 0 ? 10 : 0);
      const coins = stars * 2 + (opts.phone ? 10 : 0);
      if (opts.onEnd) {
        this.onClose = null;
        G.game.addXp(xp);
        opts.onEnd(stars);
        G.game.checkStory();
        return;
      }
      G.audio.sfx(stars === 3 ? 'level' : 'good');
      const p = this.open(`<div class="center"><div class="big-stars">${'⭐'.repeat(stars)}<i>${'⭐'.repeat(3 - stars)}</i></div>
        <h2>${stars === 3 ? 'Xuất sắc!' : stars === 2 ? 'Khá tốt!' : 'Cần luyện thêm'}</h2>
        <p>${G.esc(c.title)} · +${xp} XP · +${coins} 🪙</p></div>
        <h3>📝 Toàn bộ hội thoại</h3>
        <div class="chat full">${st.log.map((l) => `<div class="msg ${l.me ? 'me' : 'them'}">${G.esc(l.t)} ${this.sayBtn(l.t)}</div>`).join('')}</div>
        <p class="hint">📒 Các câu mẫu hay đã được lưu vào <b>Sổ tay mẫu câu</b> (📖 → Mẫu câu).</p>
        <div class="row2"><button class="btn ghost" id="again">🔁 Luyện lại</button><button class="btn" data-close>Xong</button></div>`);
      this.on(p, '#again', () => this.convo(c, opts));
      G.game.addXp(xp); G.game.addCoins(coins); G.game.checkStory();
    };
    render();
  },

  // Hội thoại nhanh 1 lượt (người đi đường đã nói chuyện nhiều lần)
  talk(n, themeOverride, after) {
    const theme = themeOverride || n.r.dialog || 'street';
    const list = DIALOGS[theme] || DIALOGS.street;
    const d = list[(n.talked++ + Math.floor(Math.random() * list.length)) % list.length];
    const right = d.o[d.ok];
    const opts = G.shuffle(d.o);
    const s = G.state;
    const p = this.open(`
      <div class="tag">💬 Chào hỏi nhanh</div>
      <div class="talk">
        <canvas class="face" width="128" height="128"></canvas>
        <div class="bubble"><b>${G.esc(n.name)}</b><div class="say-en">${G.esc(d.say)} ${this.sayBtn(d.say)}</div>
          <div class="say-vi ${s.settings.vi ? '' : 'hide'}">${G.esc(d.vi)}</div>
          ${s.settings.vi ? '' : '<button class="mini" id="showvi">Xem nghĩa</button>'}</div>
      </div>
      <p class="qtxt">Bạn sẽ trả lời thế nào?</p>
      <div class="opts">${opts.map((o, i) => `<button class="opt left" data-i="${i}">${G.esc(o)}</button>`).join('')}</div>
      <div id="tres"></div>`, { onClose: after });
    const fc = p.querySelector('.face').getContext('2d');
    fc.scale(2, 2);
    G.drawChar(fc, 32, 62, 0, 0, n.look, 1.55);
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
      if (ok) { s.stats.talks++; G.audio.sfx('good'); G.game.addXp(8); G.game.addCoins(3); s.phrases[right] = { th: theme, tip: 'Đáp lại: “' + d.say + '”', t: Date.now() }; }
      else G.audio.sfx('bad');
      const res = this.el('tres');
      res.innerHTML = `<div class="res ${ok ? 'good' : 'bad'}">${ok ? '✅ Rất tự nhiên! +8 XP, +3 🪙' : '❌ Câu đó chưa phù hợp. Câu đúng là: <b>' + G.esc(right) + '</b>'}</div>
        ${G.stt.supported ? `<button class="btn ghost" id="tmic">🎤 Luyện nói câu đúng</button><div id="tmicres"></div>` : ''}
        <button class="btn big" data-close2>Tạm biệt 👋</button>`;
      const mic = this.el('tmic');
      if (mic) mic.addEventListener('click', () => this.speakPractice(right, this.el('tmicres')));
      res.querySelector('[data-close2]').addEventListener('click', () => this.close());
      G.game.checkStory();
    });
  },

  // ---------- Toà nhà ----------
  building(b) {
    const need = G.feat.BUILD[b.t];
    if (need && !G.feat.has(need)) {
      const bt = BUILDING_TYPES[b.t];
      this.open(`<h2>${bt.icon} ${G.esc(b.name)} <small>🔒 Chưa mở</small></h2>
        <p>${G.esc(G.feat.lockedMsg(need))}</p><p class="hint">Cứ làm lần lượt các nhiệm vụ (📜) — mỗi nhiệm vụ xong sẽ mở thêm tính năng mới.</p>
        <button class="btn ghost" data-close>Quay lại sau</button>`);
      return;
    }
    if (G.events.door(b)) return;
    const f = this['b_' + b.t];
    if (f) f.call(this, b); else this.b_house(b);
  },
  head(b, sub) {
    const bt = BUILDING_TYPES[b.t];
    return `<h2>${bt.icon} ${G.esc(b.name)}</h2>${sub ? `<p class="sub">${sub}</p>` : ''}`;
  },

  b_home(b) {
    const s = G.state, g = G.game;
    const night = g.nightRaw() > 0.3;
    const p = this.open(`${this.head(b, night ? 'Good evening! Về nhà nghỉ ngơi sau một ngày làm việc.' : 'Home sweet home — Nhà là nơi để nghỉ ngơi.')}
      <div class="stats">
        <div>📖 Từ vựng<b>${g.ownedWords().length}/${G.allWords.length}</b></div>
        <div>📒 Mẫu câu<b>${Object.keys(s.phrases).length}</b></div>
        <div>🔩 Loại linh kiện<b>${Object.keys(s.seen).length}/${PARTS.length}</b></div>
        <div>🔧 Đơn đã sửa<b>${s.stats.jobs}</b></div>
        <div>🌾 Đã thu hoạch<b>${s.stats.harvested}</b></div>
        <div>💬 Hội thoại tốt<b>${s.stats.talks}</b></div>
        <div>📞 Cuộc gọi<b>${s.stats.calls}</b></div>
        <div>📅 Số ngày chơi<b>${s.days}</b></div>
        <div>🏢 Ngày đi làm<b>${s.stats.workdays || 0}</b></div>
        <div>🧋 Ly trà sữa<b>${s.stats.drinks || 0}</b></div>
      </div>
      <button class="btn big" id="chest">📦 Mở kho đồ (48 ô)</button>
      ${G.feat.has('cook') ? '<button class="btn" id="kitchen">🍳 Bếp nấu ăn (Kitchen)</button>' : ''}
      ${G.feat.has('mall') ? '<button class="btn" id="wardrobe">🪞 Tủ quần áo</button>' : ''}
      <button class="btn" id="save">💾 Lưu game</button>
      <button class="btn ghost" id="rest">${night ? '😴 Chúc ngủ ngon' : '☕ Nghỉ một chút'}</button>`);
    this.on(p, '#chest', () => this.bag(true));
    this.on(p, '#wardrobe', () => G.mall.wardrobe(true));
    this.on(p, '#kitchen', () => G.kitchen.panel());
    this.on(p, '#save', () => { g.save(); this.toast('💾 Đã lưu!'); this.close(); });
    this.on(p, '#rest', () => {
      const line = night ? 'Good night! Sleep well.' : 'Time for a short break.';
      G.tts.speak(line);
      this.close();
      this.toast((night ? '🌙 “Good night! Sleep well.” — Chúc ngủ ngon.' : '☕ “Time for a short break.” — Nghỉ ngơi một chút.') + ' Game theo giờ thực nên cây vẫn lớn khi bạn ngủ!');
    });
  },

  b_service(b) {
    const g = G.game, s = G.state;
    g.refreshBoard();
    const job = s.job ? g.jobById(s.job.id) : null;
    const jb = g.jobBuilding();
    const hasWork = G.feat.has('work'), hasJobs = G.feat.has('jobs');
    const ws = G.work.status(), open = !hasWork || ws.type === 'work';
    const ci = hasWork ? G.work.checkIn() : null;
    const nm = G.esc(s.profile.name);
    const sub = !open ? (ws.type === 'off' ? 'Bảo vệ: “Today is your day off, ' + nm + '. Go and relax!”' : ws.type === 'lunch' ? 'Bảo vệ: “Everyone is on lunch break. Come back at ' + G.work.hhmm(G.work.times().back) + '.”' : 'Bảo vệ: “The service center is closed now. Working hours are ' + G.esc(G.work.hoursEn()) + '.”')
      : ci && ci.late ? 'Quản lý <b>Ms. Lan</b>: “You’re late, ' + nm + '! Please be on time tomorrow.”' : 'Quản lý <b>Ms. Lan</b>: “' + G.esc(G.clock.greet()) + ', ' + nm + '!' + (hasJobs ? ' Here are today’s repair orders.”' : ' Welcome to the service center!”');
    let html = this.head(b, sub);
    if (!hasJobs) html += `<div class="res mid">Ms. Lan: “Welcome to the team, ${nm}! Before your first job, please collect some English words and electronic parts around town.” — Hãy hoàn thành nhiệm vụ hiện tại (📜) để được giao đơn.</div>`;
    if (hasWork) html += `<div class="job ${open ? 'active' : ''}"><div class="jt">📅 Lịch làm việc: ${G.esc(G.work.scheduleText())}</div><div>${G.work.label()}${ci ? ` · ✅ Đã chấm công${ci.late ? ' (đi muộn)' : ''} +${ci.pay} 🪙` : ''}</div></div>`;
    if (ci) { g.addCoins(ci.pay); if (ci.late) G.tts.speak('You are late, ' + s.profile.name + '!'); }
    if (hasWork && ws.type === 'work' && s.wardrobe && s.wardrobe.wear && s.wardrobe.wear.top) html += `<div class="res mid">👔 Ms. Lan: “Where is your uniform, ${nm}? Please wear it at work.” — Vào 🏠 Nhà → 🪞 Tủ quần áo để mặc đồng phục.</div>`;
    if (job) {
      html += `<div class="job active"><div class="jt">🔧 Đơn đang làm: ${G.esc(job.vi)}</div>
        <div class="jen">${G.esc(job.en)} ${this.sayBtn(job.en)}</div><div class="jvi">${G.esc(job.sv)}</div>
        <div>📍 ${G.esc(jb ? jb.name + ' — ' + jb.region.name : '?')}</div>
        <div class="need">Cần mang: ${Object.keys(job.need).map((id) => this.partChip(id, job.need[id])).join(' ')}</div>
        <button class="btn ghost small" id="drop">Huỷ đơn này</button></div>`;
    }
    if (hasJobs) html += '<h3>📋 Đơn sửa chữa hôm nay</h3>';
    if (hasJobs && !s.board.length) html += '<p class="hint">Hết đơn hôm nay rồi! Ngày mai (theo lịch thật) sẽ có đơn mới.</p>';
    (hasJobs ? s.board : []).forEach((id) => {
      const j = g.jobById(id);
      if (!j) return;
      html += `<div class="job"><div class="jt">${G.esc(j.vi)} · <span class="rew">+${j.coins} 🪙 +${j.xp} XP</span></div>
        <div class="jen">${G.esc(j.en)} ${this.sayBtn(j.en)}</div><div class="jvi">${G.esc(j.sv)}</div>
        <div class="need">Cần: ${Object.keys(j.need).map((pid) => this.partChip(pid, j.need[pid])).join(' ')}</div>
        <button class="btn small" data-take="${id}" ${job || !open || !hasJobs ? 'disabled' : ''}>${!hasJobs ? '🔒 Chưa được giao việc' : !open ? 'Chỉ nhận đơn trong giờ làm' : job ? 'Làm xong đơn hiện tại trước' : 'Nhận đơn'}</button></div>`;
    });
    if (G.feat.has('phone')) html += `<button class="btn ghost" id="cc">📞 Luyện nghe máy tổng đài (Call Center)</button>`;
    else html += '<button class="btn ghost" data-close>Ra ngoài</button>';
    const p = this.open(html);
    this.on(p, '[data-take]', (x) => { g.acceptJob(x.dataset.take); this.close(); });
    this.on(p, '#drop', () => { s.job = null; this.toast('Đã huỷ đơn.'); this.close(); });
    this.on(p, '#cc', () => this.convoMenu('service'));
  },

  b_house(b) {
    const g = G.game, s = G.state;
    const job = s.job && s.job.bkey === b.key ? g.jobById(s.job.id) : null;
    const look = G.NPC_LOOKS[G.strHash(b.key) % G.NPC_LOOKS.length];
    if (!job) {
      const p = this.open(`${this.head(b, '“' + G.esc(G.clock.greet()) + '! Everything is working fine here, thank you!”')}
        <p>Nhà này hiện không có thiết bị cần sửa. Hãy nhận đơn ở <b>Trung Tâm Bảo Hành</b>.</p>
        <button class="btn" id="chat">💬 Trò chuyện với chủ nhà</button><button class="btn ghost" data-close>Ra ngoài</button>`);
      this.on(p, '#chat', () => this.talk({ name: 'Chủ nhà', look, talked: Math.floor(Math.random() * 9), r: b.region }, 'service'));
      return;
    }
    let html = `${this.head(b, 'Khách hàng: “' + G.esc(job.en) + '” ' + this.sayBtn(job.en))}
      <div class="job active"><div class="jt">🔧 ${G.esc(job.appliance)} — ${G.esc(job.vi)}</div><div class="jvi">${G.esc(job.sv)}</div>
      <div class="need">Linh kiện cần thay: ${Object.keys(job.need).map((id) => this.partChip(id, job.need[id])).join(' ')}</div></div>`;
    if (!g.hasAll(job.need)) {
      html += `<div class="res bad">Bạn chưa đủ linh kiện trong balo! Hãy nhặt thêm, lấy trong 📦 Kho ở nhà, hoặc mua/lắp ráp ở <b>Chợ Linh Kiện</b>.</div>
        <button class="btn ghost" data-close>Đi chuẩn bị</button>`;
      this.open(html);
      setTimeout(() => G.tts.speak(job.en), 200);
      return;
    }
    html += `<p>Quy trình: <b>1.</b> Chào hỏi khách → <b>2.</b> Chẩn đoán → <b>3.</b> Bàn giao. Tất cả bằng tiếng Anh!</p>
      <button class="btn big" id="start">🔔 Bấm chuông & gặp khách</button>`;
    const p = this.open(html);
    const ctx = { appliance: job.appliance.toLowerCase(), symptom: job.en, symptomVi: job.sv };
    this.on(p, '#start', () => {
      const visit = CONVOS.find((c) => c.id === 'visit');
      this.convo(visit, { who: 'Khách hàng', look, ctx, onEnd: (st1) => this.diagnose(b, job, look, ctx, st1) });
    });
  },
  diagnose(b, job, look, ctx, st1) {
    const g = G.game, s = G.state;
    const p = this.open(`<div class="tag">🩺 Bước 2/3 · Chẩn đoán</div>
      <h3>${G.esc(job.appliance)} — ${G.esc(job.vi)}</h3>
      <div class="qsent">${G.esc(job.q.en)} ${this.sayBtn(job.q.en)}</div>
      <p class="hint">${G.esc(job.q.vi)}</p>
      <div class="opts">${job.q.o.map((o, i) => `<button class="opt left" data-i="${i}">${G.esc(o)}</button>`).join('')}</div><div id="jres"></div>`, { noClose: true });
    setTimeout(() => G.tts.speak(job.q.en), 200);
    let tries = 0, done = false;
    this.on(p, '.opt', (bt) => {
      if (done) return;
      const i = +bt.dataset.i;
      const res = this.el('jres');
      if (i !== job.q.a) {
        tries++; bt.classList.add('wrong'); bt.disabled = true; G.audio.sfx('bad');
        res.innerHTML = `<div class="res bad">❌ Chưa đúng, hãy suy nghĩ lại! (thưởng giảm 30%)</div>`;
        return;
      }
      done = true;
      bt.classList.add('right');
      G.audio.sfx('good');
      res.innerHTML = `<div class="res good">✅ Chẩn đoán đúng! ${G.esc(job.q.ex)}</div><button class="btn big" id="handover">Thay linh kiện & bàn giao ›</button>`;
      this.el('handover').addEventListener('click', () => {
        Object.keys(job.need).forEach((id) => g.addItem(id, -job.need[id]));
        const end = CONVOS.find((c) => c.id === 'visit_end');
        this.convo(end, { who: 'Khách hàng', look, ctx, onEnd: (st2) => {
          const bonus = (st1 + st2 - 2) * 4;
          const coins = Math.round(job.coins * (tries ? 0.7 : 1)) + bonus;
          s.job = null; s.stats.jobs++;
          G.audio.sfx('level');
          const thanks = 'Thank you so much! It works perfectly now.';
          this.open(`<div class="center"><div class="big-emoji">🎉</div><h2>Hoàn thành đơn sửa chữa!</h2></div>
            <div class="wcard"><div class="en">“${thanks}” ${this.sayBtn(thanks)}</div><div class="vi">Cảm ơn rất nhiều! Giờ máy chạy hoàn hảo rồi.</div></div>
            <div class="stats"><div>💬 Chào hỏi<b>${'⭐'.repeat(st1)}</b></div><div>🤝 Bàn giao<b>${'⭐'.repeat(st2)}</b></div><div>🪙 Tiền công<b>+${coins}</b></div><div>✨ Kinh nghiệm<b>+${job.xp}</b></div></div>
            <button class="btn big" data-close>Tuyệt vời!</button>`);
          G.tts.speak(thanks);
          g.addCoins(coins); g.addXp(job.xp); g.checkStory();
        } });
      });
    });
  },

  b_hvac(b) { G.hvac.open(b); },
  b_koi(b) { G.tea.open(b); },
  b_mall(b) { G.mall.open(b); },
  b_phela(b) { G.tea.open(b); },
  b_shop(b) { this.shop(b, 'buy'); },
  shop(b, tab, keep) {
    const g = G.game, s = G.state, L = g.level;
    const tier = L >= 7 ? 4 : L >= 4 ? 3 : L >= 2 ? 2 : 1;
    let body = '';
    if (tab === 'buy') {
      if (s.bagSize < 48) {
        const price = 80 * ((s.bagSize - 24) / 6 + 1);
        body += `<div class="row hl"><div class="big-emoji">🎒</div><div class="rn"><b>Nâng cấp balo +6 ô</b><small>Backpack upgrade · ${s.bagSize} → ${s.bagSize + 6} ô</small></div>
          <button class="btn small" id="bagup" ${s.coins < price ? 'disabled' : ''}>${price} 🪙</button></div>`;
      }
      body += PARTS.filter((x) => x.rarity <= tier).map((x) => `
        <div class="row"><img src="${G.partImg(x.id, 40)}" data-info="${x.id}"><div class="rn" data-info="${x.id}"><b>${G.esc(x.vi)}</b><small>${G.esc(x.en)} · có ${g.count(x.id)}</small></div>
        <button class="btn small" data-buy="${x.id}" ${s.coins < x.price ? 'disabled' : ''}>${x.price} 🪙</button></div>`).join('');
      if (tier < 4) body += `<p class="hint">Lên cấp để mở bán linh kiện hiếm hơn.</p>`;
    } else if (tab === 'sell') {
      body = this.sellRows((it) => it.kind === 'part' || it.kind === 'mod');
    } else {
      body = RECIPES.map((r) => {
        const lock = r.level > L, can = !lock && g.hasAll(r.need);
        return `<div class="recipe ${lock ? 'locked' : ''}"><div class="rh"><img src="${G.partImg(r.id, 44)}" data-info="${r.id}"><div><b>${G.esc(r.vi)}</b><small>${G.esc(r.en)} · có ${g.count(r.id)}</small></div></div>
          <div class="need">${Object.keys(r.need).map((id) => this.partChip(id, r.need[id])).join(' ')}</div>
          ${lock ? `<div class="hint">🔒 Cần Level ${r.level}</div>` : `<button class="btn small" data-craft="${r.id}" ${can ? '' : 'disabled'}>🧩 Lắp ráp (+${r.xp} XP)</button>`}</div>`;
      }).join('');
    }
    const p = this.open(`${this.head(b, 'Chủ tiệm: “' + G.esc(G.clock.greet()) + '! What are you looking for today?”')}
      <div class="coins">🪙 ${s.coins}</div>
      <div class="tabs"><button data-tab="buy" class="${tab === 'buy' ? 'on' : ''}">Mua</button><button data-tab="sell" class="${tab === 'sell' ? 'on' : ''}">Bán</button><button data-tab="craft" class="${tab === 'craft' ? 'on' : ''}">🧩 Xưởng lắp ráp</button></div>
      <div class="list">${body}</div>
      <button class="btn ghost" id="sh-talk">💬 Hỏi mua bằng tiếng Anh</button>`, { keepScroll: keep });
    this.on(p, '[data-tab]', (x) => this.shop(b, x.dataset.tab));
    this.on(p, '[data-info]', (x) => { this.itemCard(x.dataset.info); this.onClose = () => this.shop(b, tab); });
    this.on(p, '#bagup', () => {
      const price = 80 * ((s.bagSize - 24) / 6 + 1);
      if (s.coins < price) return;
      g.addCoins(-price); s.bagSize += 6; while (s.inv.length < s.bagSize) s.inv.push(null);
      G.audio.sfx('level'); G.tts.speak('Your backpack is bigger now!');
      this.shop(b, 'buy', true);
    });
    this.on(p, '[data-buy]', (x) => {
      const it = G.partById[x.dataset.buy];
      if (s.coins < it.price) return;
      g.addCoins(-it.price); g.addItem(it.id, 1);
      this.shop(b, 'buy', true); g.checkStory();
    });
    this.bindSell(p, () => this.shop(b, 'sell', true));
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
    this.on(p, '#sh-talk', () => this.convo(CONVOS.find((c) => c.id === 'shop_parts'), { who: 'Chủ tiệm', look: G.NPC_LOOKS[4], onCancel: () => {} }));
  },
  // các dòng bán đồ trong balo (gộp theo loại)
  sellRows(filter) {
    const g = G.game, s = G.state;
    const ids = [...new Set(s.inv.filter(Boolean).map((sl) => sl.id))].filter((id) => G.items[id] && filter(G.items[id]) && G.sellPrice(id) > 0);
    if (!ids.length) return '<p class="hint">Không có gì để bán trong balo.</p>';
    return ids.map((id) => {
      const x = G.items[id], pr = G.sellPrice(id), n = g.count(id);
      return `<div class="row"><img src="${G.partImg(id, 40)}" data-info="${id}"><div class="rn" data-info="${id}"><b>${G.esc(x.vi)}</b><small>${G.esc(x.en)} · có ${n} · ${pr} 🪙/cái</small></div>
        <button class="btn small" data-sell="${id}">+${pr}</button>${n > 1 ? `<button class="btn small ghost" data-sellall="${id}">Bán hết</button>` : ''}</div>`;
    }).join('');
  },
  bindSell(p, rerender) {
    const g = G.game;
    this.on(p, '[data-sell]', (x) => { const id = x.dataset.sell; if (g.count(id) <= 0) return; g.addItem(id, -1); g.addCoins(G.sellPrice(id)); rerender(); });
    this.on(p, '[data-sellall]', (x) => { const id = x.dataset.sellall, n = g.count(id); if (n <= 0) return; g.addItem(id, -n); g.addCoins(G.sellPrice(id) * n); rerender(); });
  },

  // ---------- Tiệm Nông Sản ----------
  b_farmshop(b) { this.farmshop(b, 'buy'); },
  b_ranch(b) { G.ranch.panel(b); },
  b_petshop(b) { G.petshop.panel(b); },
  farmshop(b, tab, keep) {
    const g = G.game, s = G.state, L = g.level;
    let body = '';
    if (tab === 'buy') {
      body = CROPS.map((c) => {
        const id = 'seed_' + c.id, lock = c.level > L;
        return `<div class="row ${lock ? 'locked' : ''}"><img src="${G.partImg(id, 40)}" data-info="${id}"><div class="rn" data-info="${id}"><b>Hạt ${G.esc(c.vi)}</b>
          <small>${G.esc(c.en)} seeds · ⏱ ${G.clock.fmtDur(c.min * 60000)} · bán ${c.sell} 🪙 · có ${g.count(id)}</small></div>
          ${lock ? `<span class="lockt">🔒 Lv ${c.level}</span>` : `<button class="btn small" data-seed="${c.id}" data-n="1" ${s.coins < c.seed ? 'disabled' : ''}>${c.seed} 🪙</button>
          <button class="btn small ghost" data-seed="${c.id}" data-n="5" ${s.coins < c.seed * 5 ? 'disabled' : ''}>×5</button>`}</div>`;
      }).join('');
      const can = g.slotsCount(s.inv, 'tool_can') + g.slotsCount(s.chest, 'tool_can');
      body += `<div class="row"><img src="${G.partImg('fert', 40)}" data-info="fert"><div class="rn" data-info="fert"><b>Phân bón</b><small>Fertilizer · cây lớn nhanh thêm 25% · có ${g.count('fert')}</small></div>
        <button class="btn small" data-fert ${s.coins < 15 ? 'disabled' : ''}>15 🪙</button></div>`;
      if (!can) body += `<div class="row"><img src="${G.partImg('tool_can', 40)}"><div class="rn"><b>Bình tưới</b><small>Watering can</small></div><button class="btn small" data-can ${s.coins < 20 ? 'disabled' : ''}>20 🪙</button></div>`;
    } else {
      body = this.sellRows((it) => it.kind === 'crop' || it.kind === 'seed' || it.kind === 'product' || it.kind === 'food');
      body += '<p class="hint">💡 Quán cà phê đặt mua nông sản mỗi ngày với giá cao hơn ~70%.</p>';
    }
    const p = this.open(`${this.head(b, 'Bác Ba: “' + G.esc(G.clock.greet()) + '! Fresh seeds, good harvest!”')}
      <div class="coins">🪙 ${s.coins}</div>
      <div class="tabs"><button data-tab="buy" class="${tab === 'buy' ? 'on' : ''}">🌱 Mua hạt giống</button><button data-tab="sell" class="${tab === 'sell' ? 'on' : ''}">🧺 Bán nông sản</button></div>
      <div class="list">${body}</div>
      <p class="hint">Cây lớn theo <b>thời gian thực</b> khi đất còn ẩm. Mỗi lần tưới giữ ẩm 4 giờ; trời mưa sẽ tự tưới.</p>
      <button class="btn ghost" id="fchat">💬 Trò chuyện với bác nông dân</button>`, { keepScroll: keep });
    this.on(p, '[data-tab]', (x) => this.farmshop(b, x.dataset.tab));
    this.on(p, '[data-info]', (x) => { this.itemCard(x.dataset.info); this.onClose = () => this.farmshop(b, tab); });
    this.on(p, '[data-seed]', (x) => {
      const c = G.cropById[x.dataset.seed], n = +x.dataset.n;
      if (s.coins < c.seed * n) return;
      g.addCoins(-c.seed * n); g.addItem('seed_' + c.id, n);
      this.farmshop(b, 'buy', true); g.checkStory();
    });
    this.on(p, '[data-fert]', () => { if (s.coins < 15) return; g.addCoins(-15); g.addItem('fert', 1); this.farmshop(b, 'buy', true); });
    this.on(p, '[data-can]', () => { if (s.coins < 20) return; g.addCoins(-20); g.addItem('tool_can', 1); this.farmshop(b, 'buy', true); });
    this.bindSell(p, () => this.farmshop(b, 'sell', true));
    this.on(p, '#fchat', () => this.convo(CONVOS.find((c) => c.id === 'farm_chat'), { who: 'Bác Ba (nông dân)', look: G.NPC_LOOKS[4], onEnd: (st) => {
      if (st >= 2 && s.gifts['fert:' + b.key] !== G.clock.dateKey()) { s.gifts['fert:' + b.key] = G.clock.dateKey(); g.addItem('fert', 2); this.toast('🎁 Bác Ba tặng bạn 2 túi phân bón! “That’s very kind of you!”'); }
      this.farmshop(b, 'buy');
    } }));
  },

  b_library(b) {
    const g = G.game;
    const own = g.ownedWords();
    const p = this.open(`${this.head(b, 'Yên tĩnh nào... Đây là nơi ôn tập.')}
      <p>Bạn đang có <b>${own.length}</b> từ. Mỗi lượt ôn gồm 8 câu, ưu tiên những từ bạn chưa thuộc. Thưởng <b>+3 🪙 và +6 XP</b> mỗi câu đúng.</p>
      <button class="btn big" id="rev" ${own.length < 4 ? 'disabled' : ''}>${own.length < 4 ? 'Cần ít nhất 4 từ để ôn tập' : '📝 Ôn tập từ vựng'}</button>
      <button class="btn" id="conv">🗣️ Luyện hội thoại (${CONVOS.filter((c) => !c.theme.startsWith('visit')).length} tình huống)</button>
      <button class="btn ghost" id="dict">📖 Từ điển & Sổ tay mẫu câu</button>
      <button class="btn ghost" id="parts">🔩 Sổ tay linh kiện</button>`);
    this.on(p, '#rev', () => this.review());
    this.on(p, '#conv', () => this.convoMenu());
    this.on(p, '#dict', () => this.dictionary());
    this.on(p, '#parts', () => this.handbook());
  },
  // danh sách tình huống hội thoại để luyện
  convoMenu(theme) {
    const s = G.state;
    const names = { service: '📞 Call Center', street: '🚶 Đường phố', shop: '🔌 Mua hàng', cafe: '☕ Quán cà phê', travel: '✈️ Du lịch', factory: '🏭 Nhà máy', farm: '🌱 Nông trại' };
    const list = CONVOS.filter((c) => !c.theme.startsWith('visit') && (!theme || c.theme === theme));
    const p = this.open(`<h2>🗣️ Luyện hội thoại</h2><p class="sub">Chọn tình huống. Đạt ⭐⭐⭐ khi chọn câu chuẩn ngay lần đầu ở mọi lượt. Lời chào đổi theo giờ thực: bây giờ nói <b>“${G.clock.greet()}”</b> (${G.clock.greetVi()}).</p>
      <div class="list">${list.map((c) => `<div class="row"><div class="big-emoji">${(names[c.theme] || '💬').split(' ')[0]}</div><div class="rn"><b>${G.esc(c.title)}</b><small>${names[c.theme] || ''} · ${c.steps.length} lượt · ${'⭐'.repeat(s.convos[c.id] || 0) || 'chưa luyện'}</small></div>
        <button class="btn small" data-cv="${c.id}">Luyện</button></div>`).join('')}</div>`);
    this.on(p, '[data-cv]', (x) => this.convo(CONVOS.find((c) => c.id === x.dataset.cv), { phone: CONVOS.find((c) => c.id === x.dataset.cv).theme === 'service' }));
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
      let type = G.pick(['vi', 'en', 'listen', 'blank']);
      if (type === 'blank' && !w.ex.toLowerCase().includes(w.en.toLowerCase())) type = 'vi';
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
    const g = G.game, s = G.state, L = g.level, today = G.clock.dateKey();
    let rq = s.reqs[b.key];
    if (!rq || rq.d !== today) {
      const pool = CROPS.filter((c) => c.level <= L);
      const rnd = G.mulberry(G.strHash(b.key + today));
      const c = G.pick(pool, rnd);
      rq = s.reqs[b.key] = { d: today, c: c.id, n: c.sell >= 60 ? 1 + Math.floor(rnd() * 2) : 2 + Math.floor(rnd() * 3), tpl: Math.floor(rnd() * CAFE_REQ.length), done: false };
    }
    const crop = G.cropById[rq.c], tpl = CAFE_REQ[rq.tpl];
    const word = rq.n > 1 ? crop.plural : crop.en;
    const en = tpl.en.replace('{n}', rq.n).replace('{crops}', word), vi = tpl.vi.replace('{n}', rq.n).replace('{vi}', crop.vi);
    const reward = Math.round(crop.sell * rq.n * 1.7), have = g.count('crop_' + crop.id);
    const p = this.open(`${this.head(b, 'Barista: “' + G.esc(G.clock.greet()) + '! What would you like to drink?”')}
      <div class="row"><div class="big-emoji">☕</div><div class="rn"><b>Cà phê sữa đá</b><small>Iced milk coffee · Đi nhanh hơn trong 3 phút</small></div><button class="btn small" id="cof" ${s.coins < 10 ? 'disabled' : ''}>10 🪙</button></div>
      <div class="job ${rq.done ? '' : 'active'}"><div class="jt">📋 Đơn đặt nông sản hôm nay ${rq.done ? '✅ Đã giao' : ''}</div>
        <div class="jen">“${G.esc(en)}” ${this.sayBtn(en)}</div><div class="jvi">${G.esc(vi)}</div>
        <div class="need">${this.partChip('crop_' + crop.id, rq.n)} <span class="rew">Thưởng +${reward} 🪙 +25 XP</span></div>
        ${rq.done ? '' : `<button class="btn small" id="deliver" ${have < rq.n ? 'disabled' : ''}>${have < rq.n ? 'Chưa đủ — hãy trồng thêm' : '🧺 Giao hàng'}</button>`}</div>
      <button class="btn" id="chat">💬 Gọi đồ bằng tiếng Anh</button>
      <button class="btn ghost" data-close>Ra ngoài</button>`);
    setTimeout(() => { if (!rq.done) G.tts.speak(en); }, 250);
    this.on(p, '#cof', () => {
      g.addCoins(-10); s.boost = Date.now() + 180000;
      G.tts.speak('One iced milk coffee, please.');
      this.close();
      this.toast('☕ “One iced milk coffee, please.” — Bạn đi nhanh hơn trong 3 phút!');
    });
    this.on(p, '#deliver', () => {
      if (g.count('crop_' + crop.id) < rq.n) return;
      g.addItem('crop_' + crop.id, -rq.n); rq.done = true;
      const thanks = 'Thank you! These ' + word + ' look so fresh!';
      G.tts.speak(thanks);
      g.addCoins(reward); g.addXp(25);
      this.close();
      this.toast('🧺 “' + thanks + '” +' + reward + ' 🪙');
    });
    this.on(p, '#chat', () => this.convo(CONVOS.find((c) => c.id === 'cafe_order'), { who: 'Barista', look: G.NPC_LOOKS[3] }));
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
      g.player.y = (t.dy + 1.7) * G.TS;
      G.tts.speak('Next stop, ' + t.region.en + '.');
      this.close();
    });
  },

  b_factory(b) { this.giftPlace(b, 'factory', 'Kỹ sư: “Welcome to our factory. Safety first!”', 'Nhận linh kiện mẫu (1 lần/ngày)'); },
  b_hotel(b) { this.giftPlace(b, 'travel', 'Lễ tân: “' + G.esc(G.clock.greet()) + '! How can I help you?”', 'Sửa giúp khách sạn, nhận quà (1 lần/ngày)'); },
  b_airport(b) { this.giftPlace(b, 'travel', 'Nhân viên: “Welcome to the International Airport!”', 'Nhận quà từ khách quốc tế (1 lần/ngày)'); },
  giftPlace(b, theme, sub, giftLabel) {
    const g = G.game, s = G.state, today = G.clock.dateKey();
    const got = s.gifts[b.key] === today;
    const p = this.open(`${this.head(b, sub)}
      <button class="btn big" id="gift" ${got ? 'disabled' : ''}>${got ? 'Hôm nay đã nhận rồi' : '🎁 ' + giftLabel}</button>
      <button class="btn" id="chat">💬 Trò chuyện</button>
      <button class="btn ghost" data-close>Ra ngoài</button>`);
    this.on(p, '#gift', () => {
      s.gifts[b.key] = today;
      const pool = b.region.parts.map((id) => G.partById[id]).filter((x) => x && x.rarity >= 2);
      const it = G.pick(pool.length ? pool : PARTS);
      const first = !s.seen[it.id];
      g.addItem(it.id, 1); g.addCoins(10); G.audio.sfx('good');
      this.close();
      if (first) this.itemCard(it.id, true); else this.toast('🎁 Nhận ' + it.vi + ' (' + it.en + ') và 10 🪙');
      g.checkStory();
    });
    const look = G.NPC_LOOKS[G.strHash(b.key) % G.NPC_LOOKS.length];
    this.on(p, '#chat', () => {
      const list = CONVOS.filter((c) => c.theme === theme);
      this.convo(G.pick(list), { who: b.name, look });
    });
  },

  // ---------- Balo & Kho đồ ----------
  bag(atHome, keep) {
    const s = G.state, g = G.game;
    const sel = this.invSel;
    const mv = this.moveFrom;
    const slotHtml = (arr, w) => arr.map((sl, i) => {
      const it = sl && G.items[sl.id];
      const cls = ['slot', w === 'inv' && i < 6 ? 'hb' : '', sel && sel.w === w && sel.i === i ? 'sel' : '', mv && mv.w === w && mv.i === i ? 'moving' : '', w === 'inv' && i === s.sel ? 'cur' : ''].join(' ');
      return `<button class="${cls}" data-w="${w}" data-i="${i}">${w === 'inv' && i < 6 ? `<span class="hk">${i + 1}</span>` : ''}${it ? `<img src="${G.partImg(sl.id, 40)}" alt=""><b>${sl.n > 1 ? sl.n : ''}</b>` : ''}</button>`;
    }).join('');
    let info = '';
    const selSlot = sel ? (sel.w === 'inv' ? s.inv : s.chest)[sel.i] : null;
    if (mv) info = `<div class="sinfo moving">↔️ Chạm vào ô muốn chuyển tới (đổi chỗ / gộp chồng). <button class="btn small ghost" id="mvcancel">Huỷ</button></div>`;
    else if (selSlot) {
      const it = G.items[selSlot.id];
      info = `<div class="sinfo"><img src="${G.partImg(selSlot.id, 44)}"><div class="rn"><b>${G.esc(it.vi)}</b> ×${selSlot.n}<small>${G.esc(it.en)} ${this.sayBtn(it.en)}</small></div>
        <div class="sbtns"><button class="btn small ghost" id="sinfo">ℹ️ Chi tiết</button><button class="btn small ghost" id="smove">↔️ Di chuyển</button>
        ${atHome ? `<button class="btn small" id="sxfer">${sel.w === 'inv' ? '⇩ Cất vào kho' : '⇧ Lấy về balo'}</button>` : ''}</div></div>`;
    }
    const p = this.open(`<h2>🎒 Balo <small>${g.bagUsed()}/${s.bagSize} ô</small></h2><div class="coins">🪙 ${s.coins}</div>
      <p class="hint">Hàng đầu (1–6) là <b>thanh đồ nhanh</b> dưới màn hình — đặt hạt giống, bình tưới, phân bón ở đây để làm nông nhanh.</p>
      <div class="slots">${slotHtml(s.inv, 'inv')}</div>
      ${info}
      ${atHome ? `<h3>📦 Kho đồ ở nhà <small>${s.chest.filter(Boolean).length}/48</small></h3><div class="slots">${slotHtml(s.chest, 'chest')}</div>`
        : '<p class="hint">📦 Kho đồ 48 ô nằm trong 🏠 Nhà của bạn (Làng Ven Sông). Mua thêm ô balo ở Chợ Linh Kiện.</p>'}
      <div class="row2"><button class="btn ghost" id="sort">↕️ Sắp xếp</button><button class="btn ghost" id="hb">🔩 Sổ tay linh kiện</button></div>`, { cls: 'wide', keepScroll: keep, onClose: () => { this.invSel = null; this.moveFrom = null; } });
    const rerender = () => this.bag(atHome, true);
    p.querySelectorAll('.slot').forEach((el) => el.addEventListener('click', () => {
      G.audio.sfx('click');
      const w = el.dataset.w, i = +el.dataset.i;
      if (this.moveFrom) { this.swapSlots(this.moveFrom, { w, i }); this.moveFrom = null; this.invSel = { w, i }; return rerender(); }
      this.invSel = { w, i };
      if (w === 'inv' && i < 6) { s.sel = i; this.renderHotbar(); }
      rerender();
    }));
    this.on(p, '#mvcancel', () => { this.moveFrom = null; rerender(); });
    this.on(p, '#sinfo', () => { const id = selSlot.id; this.itemCard(id); this.onClose = () => this.bag(atHome); });
    this.on(p, '#smove', () => { this.moveFrom = this.invSel; rerender(); });
    this.on(p, '#sxfer', () => {
      const from = sel.w === 'inv' ? s.inv : s.chest, to = sel.w === 'inv' ? s.chest : s.inv;
      const sl = from[sel.i];
      const left = g.slotsAdd(to, sl.id, sl.n);
      if (left) { sl.n = left; this.toast('Không đủ chỗ, còn lại ' + left); } else from[sel.i] = null;
      this.invSel = null; this.renderHotbar(); rerender();
    });
    this.on(p, '#sort', () => { this.sortSlots(s.inv); if (atHome) this.sortSlots(s.chest); this.invSel = null; this.renderHotbar(); rerender(); });
    this.on(p, '#hb', () => this.handbook());
  },
  swapSlots(a, b) {
    const s = G.state;
    const A = a.w === 'inv' ? s.inv : s.chest, B = b.w === 'inv' ? s.inv : s.chest;
    if (A === B && a.i === b.i) return;
    const x = A[a.i], y = B[b.i];
    if (x && y && x.id === y.id) {
      const total = x.n + y.n;
      B[b.i] = { id: x.id, n: Math.min(G.game.STACK, total) };
      A[a.i] = total > G.game.STACK ? { id: x.id, n: total - G.game.STACK } : null;
    } else { A[a.i] = y; B[b.i] = x; }
    this.renderHotbar();
  },
  sortSlots(arr) {
    const order = { tool: 0, seed: 1, fert: 2, crop: 3, part: 4, mod: 5 };
    const tot = {};
    arr.forEach((sl) => { if (sl) tot[sl.id] = (tot[sl.id] || 0) + sl.n; });
    arr.fill(null);
    Object.keys(tot).sort((a, b) => ((order[G.items[a].kind] ?? 9) - (order[G.items[b].kind] ?? 9)) || (G.items[a].price || 0) - (G.items[b].price || 0) || a.localeCompare(b))
      .forEach((id) => G.game.slotsAdd(arr, id, tot[id]));
  },
  handbook() {
    const s = G.state;
    const p = this.open(`<h2>🔩 Sổ tay linh kiện</h2><p class="sub">Đã sưu tầm ${Object.keys(s.seen).length}/${PARTS.length}. Chạm vào để xem chi tiết.</p>
      <div class="grid">${PARTS.map((x) => s.seen[x.id]
        ? `<button class="cell" data-info="${x.id}"><img src="${G.partImg(x.id, 44)}"><span>${G.esc(x.vi)}</span><small>${G.esc(x.en)}</small></button>`
        : `<div class="cell unk"><div class="q">?</div><span>???</span><small>${'⭐'.repeat(x.rarity)}</small></div>`).join('')}</div>`);
    this.on(p, '[data-info]', (x) => { this.itemCard(x.dataset.info); this.onClose = () => this.handbook(); });
  },

  // ---------- Từ điển / Mẫu câu / Hội thoại ----------
  dictionary(cat, tab = 'words') {
    const s = G.state;
    const tabs = `<div class="tabs"><button data-dt="words" class="${tab === 'words' ? 'on' : ''}">📖 Từ vựng</button><button data-dt="phrases" class="${tab === 'phrases' ? 'on' : ''}">📒 Mẫu câu</button><button data-dt="convos" class="${tab === 'convos' ? 'on' : ''}">🗣️ Hội thoại</button></div>`;
    if (tab === 'convos') { this.convoMenu(); return; }
    if (tab === 'phrases') {
      const names = { service: '📞 Call Center', street: '🚶 Đường phố', shop: '🔌 Mua hàng', cafe: '☕ Quán cà phê', travel: '✈️ Du lịch', factory: '🏭 Nhà máy', farm: '🌱 Nông trại', visit: '🔧 Tại nhà khách', visit_end: '🔧 Tại nhà khách' };
      const ph = Object.keys(s.phrases).sort((a, b) => (s.phrases[a].th || '').localeCompare(s.phrases[b].th || ''));
      const p = this.open(`<h2>📒 Sổ tay mẫu câu</h2>${tabs}<p class="sub">${ph.length} câu đã học từ các cuộc hội thoại. Chạm 🔊 để nghe, 🎤 để luyện nói.</p>
        <div class="dict">${ph.length ? ph.map((t, i) => `<div class="drow"><div class="tagline">${names[s.phrases[t].th] || '💬'}</div>
          <div><b class="ph">${G.esc(t)}</b> ${this.sayBtn(t)} ${G.stt.supported ? `<button class="say" data-mic="${i}">🎤</button>` : ''}</div>
          <div class="ex">${G.esc(s.phrases[t].tip || '')}</div><div id="pm${i}"></div></div>`).join('')
        : '<p class="hint">Chưa có mẫu câu nào. Hãy trò chuyện với mọi người, nghe điện thoại khách hàng, hoặc vào 🗣️ Hội thoại để luyện!</p>'}</div>`);
      this.on(p, '[data-dt]', (x) => this.dictionary(null, x.dataset.dt));
      p.querySelectorAll('[data-mic]').forEach((b) => b.addEventListener('click', () => { const i = +b.dataset.mic; this.speakPractice(ph[i], this.el('pm' + i)); }));
      return;
    }
    const cats = Object.keys(WORD_CATS);
    cat = cat || 'all';
    const list = G.allWords.filter((w) => s.words[w.en] && (cat === 'all' || w.cat === cat)).sort((a, b) => a.en.localeCompare(b.en));
    const p = this.open(`<h2>📖 Từ điển của bạn</h2>${tabs}<p class="sub">Đã thu thập ${Object.keys(s.words).length}/${G.allWords.length} từ · chạm vào từ để nghe</p>
      <div class="cats"><button data-cat="all" class="${cat === 'all' ? 'on' : ''}">Tất cả</button>${cats.map((c) => {
        const tot = WORD_CATS[c].words.length, own = WORD_CATS[c].words.filter((w) => s.words[w[0]]).length;
        return `<button data-cat="${c}" class="${cat === c ? 'on' : ''}">${WORD_CATS[c].icon} ${G.esc(WORD_CATS[c].name)} <small>${own}/${tot}</small></button>`;
      }).join('')}</div>
      <div class="dict">${list.length ? list.map((w) => `<div class="drow" data-say="${G.esc(w.en)}">
        <div><b>${G.esc(w.en)}</b> <span class="ipa">${G.esc(w.ipa)}</span> ${this.stars(s.words[w.en].m)}</div>
        <div class="vi">${G.esc(w.vi)}</div><div class="ex">${G.esc(w.ex)}</div></div>`).join('') : '<p class="hint">Chưa có từ nào trong nhóm này. Hãy đi tìm các quả cầu chữ phát sáng!</p>'}</div>`);
    this.on(p, '[data-cat]', (x) => this.dictionary(x.dataset.cat));
    this.on(p, '[data-dt]', (x) => this.dictionary(null, x.dataset.dt));
  },
  quests() {
    const s = G.state, g = G.game;
    const job = s.job ? g.jobById(s.job.id) : null, jb = g.jobBuilding();
    const cur = g.curQuest(), ci = STORY.indexOf(cur);
    const done = STORY.filter((q) => s.storyDone[q.id]);
    const next = ci >= 0 ? STORY.slice(ci + 1).find((q) => !s.storyDone[q.id]) : null;
    const rest = STORY.filter((q) => !s.storyDone[q.id]).length - (cur ? 1 : 0) - (next ? 1 : 0);
    const feats = Object.keys(FEATURES).filter((k) => G.feat.has(k));
    const card = (q, st) => {
      const pr = g.storyProgress(q);
      return `<div class="q ${st}"><div class="qt">${st === 'done' ? '✅' : '▶️'} ${G.esc(q.title)}</div>
        ${st === 'cur' ? `<div class="qd">${G.esc(q.desc)}</div><div class="bar"><i style="width:${Math.min(100, (pr.cur / pr.max) * 100)}%"></i></div>
        <small>${Math.min(pr.cur, pr.max)}/${pr.max} · Thưởng ${q.coins} 🪙 ${q.xp ? '+ ' + q.xp + ' XP' : ''}${q.unlock && q.unlock.length ? ' · 🔓 mở: ' + q.unlock.map((k) => FEATURES[k].icon + ' ' + FEATURES[k].name).join(', ') : ''}</small>` : ''}</div>`;
    };
    const p = this.open(`<h2>📜 Nhiệm vụ</h2>
      ${G.feat.has('events') ? '<button class="btn small ghost" id="qev">📢 Sự kiện & thông báo</button>' : ''}
      ${job ? `<div class="job active"><div class="jt">🔧 ${G.esc(job.vi)}: ${G.esc(job.sv)}</div><div>📍 ${G.esc(jb ? jb.name + ' — ' + jb.region.name : '')}</div>
        <div class="need">${Object.keys(job.need).map((id) => this.partChip(id, job.need[id])).join(' ')}</div></div>` : ''}
      <div class="qlist">${cur ? card(cur, 'cur') : '<div class="res good">🌟 Bạn đã hoàn thành toàn bộ cốt truyện!</div>'}
        ${next ? `<div class="q lock"><div class="qt">🔒 Nhiệm vụ tiếp theo: ???</div></div>` : ''}
        ${rest > 0 ? `<p class="hint">…và còn ${rest} nhiệm vụ nữa sẽ hiện ra dần dần.</p>` : ''}
        ${done.length ? `<h3>Đã hoàn thành (${done.length})</h3>` + done.slice().reverse().map((q) => card(q, 'done')).join('') : ''}</div>
      ${feats.length ? `<h3>🔓 Tính năng đã mở</h3><div class="need">${feats.map((k) => `<span class="chip ok">${FEATURES[k].icon} ${G.esc(FEATURES[k].name)}</span>`).join('')}</div>` : ''}`);
    this.on(p, '#qev', () => G.events.panel());
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
    if (gt) { x.fillStyle = '#ffd600'; x.beginPath(); x.arc(gt.x * k, gt.y * k, 4, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#000'; x.lineWidth = 1; x.stroke(); }
    x.fillStyle = '#fff'; x.strokeStyle = '#e53935'; x.lineWidth = 2;
    x.beginPath(); x.arc(g.player.x / G.TS * k, g.player.y / G.TS * k, 4, 0, Math.PI * 2); x.fill(); x.stroke();
  },
  settings() {
    const s = G.state.settings;
    const p = this.open(`<h2>⚙️ Cài đặt</h2>
      <label class="set"><input type="checkbox" id="s-tts" ${s.tts ? 'checked' : ''}> 🔊 Đọc phát âm tiếng Anh</label>
      <label class="set">🐢 Tốc độ đọc <input type="range" id="s-rate" min="0.5" max="1.2" step="0.1" value="${s.rate}"> <span id="s-rv">${s.rate}</span></label>
      <div class="set">🗣️ Giọng <button class="tchip ${(s.vpref || 'f') === 'f' ? 'on' : ''}" data-vp="f">👩 Nữ</button><button class="tchip ${s.vpref === 'm' ? 'on' : ''}" data-vp="m">👨 Nam</button></div>
      <label class="set">🎙️ Chọn giọng <select id="s-voice">${G.tts.ranked(s.vpref).filter((x) => x.s > -100).map((x) => `<option value="${G.esc(x.v.name)}" ${G.tts.voice && G.tts.voice.name === x.v.name ? 'selected' : ''}>${G.esc(x.v.name)} (${G.esc(x.v.lang)})${x.s >= 50 ? ' ⭐' : ''}</option>`).join('') || '<option>Máy chưa có giọng tiếng Anh</option>'}</select></label>
      <label class="set">🎵 Độ cao giọng <input type="range" id="s-pitch" min="0.8" max="1.3" step="0.05" value="${s.pitch || 1.05}"> <span id="s-pv">${s.pitch || 1.05}</span></label>
      <p class="hint">💡 Giọng hay nhất trên iPhone/iPad: vào <b>Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói → Tiếng Anh</b>, tải giọng <b>Ava (Cao cấp/Premium)</b> hoặc <b>Samantha (Nâng cao)</b>, rồi mở lại game và chọn ở đây. Các giọng có ⭐ là giọng chất lượng cao.</p>
      <label class="set"><input type="checkbox" id="s-sfx" ${s.sfx ? 'checked' : ''}> 🎵 Hiệu ứng âm thanh</label>
      <label class="set"><input type="checkbox" id="s-vi" ${s.vi ? 'checked' : ''}> 🇻🇳 Hiện nghĩa tiếng Việt khi nói chuyện</label>
      <label class="set"><input type="checkbox" id="s-calls" ${s.calls ? 'checked' : ''}> 📞 Khách hàng gọi điện bất chợt</label>
      <label class="set">🌙 Độ tối ban đêm <input type="range" id="s-night" min="0" max="1" step="0.1" value="${s.night}"> <span id="s-nv">${Math.round(s.night * 100)}%</span></label>
      <h3>📅 Lịch làm việc</h3>
      <div class="set">Ngày đi làm ${[1, 2, 3, 4, 5, 6, 0].map((d) => `<button class="tchip ${G.work.cfg().days.includes(d) ? 'on' : ''}" data-wd="${d}">${G.work.DAYS_VI[d]}</button>`).join('')}</div>
      <label class="set">Giờ vào ca <select id="s-start">${[6, 7, 8, 9, 10, 11, 12, 13, 14].map((h) => `<option value="${h}" ${G.work.cfg().start === h ? 'selected' : ''}>${G.work.hhmm(h)}</option>`).join('')}</select></label>
      <p class="hint" id="s-sched">${G.esc(G.work.scheduleText())}. Ngày không đi làm là ngày nghỉ. Ngoài giờ làm, Trung Tâm Bảo Hành đóng cửa và khách có thể gọi bắt bạn đến.</p>
      <button class="btn ghost" id="s-char">🧑‍🔧 Đổi tên / nhân vật / thú cưng 🐾</button>
      <p class="hint">⏰ Game chạy theo giờ thực của máy: bây giờ là ${G.esc(G.clock.label())} — lời chào đúng là “${G.clock.greet()}”.</p>
      <button class="btn" id="s-test">🔊 Thử giọng đọc</button>
      <button class="btn" id="s-mic">🎤 Thử luyện nói</button><div id="s-micres"></div>
      <button class="btn" id="s-save">💾 Lưu game ngay</button>
      <button class="btn danger" id="s-reset">🗑️ Chơi lại từ đầu</button>
      <p class="hint">Mẹo: Trên iPhone/iPad mở bằng Safari → nút Chia sẻ → “Thêm vào MH chính” để chơi toàn màn hình. Nếu không nghe tiếng, hãy tắt chế độ im lặng. Luyện nói cần cho phép Micro và Nhận dạng giọng nói.</p>`);
    this.on(p, '#s-test', () => G.tts.speak(G.clock.greet() + ', technician! Let us learn English and electronics together.'));
    this.on(p, '#s-mic', () => this.speakPractice('Hello, how can I help you?', this.el('s-micres')));
    p.querySelector('#s-tts').addEventListener('change', (e) => { s.tts = e.target.checked; });
    p.querySelector('#s-sfx').addEventListener('change', (e) => { s.sfx = e.target.checked; });
    p.querySelector('#s-vi').addEventListener('change', (e) => { s.vi = e.target.checked; });
    p.querySelector('#s-calls').addEventListener('change', (e) => { s.calls = e.target.checked; });
    p.querySelector('#s-rate').addEventListener('input', (e) => { s.rate = +e.target.value; this.el('s-rv').textContent = s.rate; });
    p.querySelectorAll('[data-vp]').forEach((b) => b.addEventListener('click', () => { s.vpref = b.dataset.vp; s.voice = ''; G.tts.choose(); G.tts.speak('Hello! This is my new voice.'); this.settings(); }));
    const vsel = p.querySelector('#s-voice');
    vsel.addEventListener('change', () => { s.voice = vsel.value; G.tts.choose(); G.tts.speak('Hello! How do I sound?'); });
    p.querySelector('#s-pitch').addEventListener('input', (e) => { s.pitch = +e.target.value; this.el('s-pv').textContent = s.pitch; });
    p.querySelector('#s-pitch').addEventListener('change', () => G.tts.speak('Nice to meet you!'));
    p.querySelector('#s-night').addEventListener('input', (e) => { s.night = +e.target.value; this.el('s-nv').textContent = Math.round(s.night * 100) + '%'; });
    this.on(p, '#s-save', () => { G.game.save(); this.toast('💾 Đã lưu!'); });
    this.on(p, '#s-char', () => this.createChar(() => this.settings(), false));
    p.querySelectorAll('[data-wd]').forEach((b) => b.addEventListener('click', () => {
      const w = G.work.cfg(), d = +b.dataset.wd;
      w.days = w.days.includes(d) ? w.days.filter((x) => x !== d) : w.days.concat(d);
      b.classList.toggle('on'); G.audio.sfx('click');
      this.el('s-sched').textContent = G.work.scheduleText() + '.';
    }));
    p.querySelector('#s-start').addEventListener('change', (e) => { G.work.cfg().start = +e.target.value; this.el('s-sched').textContent = G.work.scheduleText() + '.'; });
    this.on(p, '#s-reset', () => {
      if (!confirm('Xoá toàn bộ tiến trình và chơi lại từ đầu?')) return;
      G.store.clear(); this.close(); G.game.start(true);
    });
  },
};
