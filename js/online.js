// ============================================================
// CHƠI CÙNG NHAU (online) — gặp nhau trong thế giới và chat theo thời gian thực.
// Không cần máy chủ riêng: dùng máy chủ MQTT công cộng (kết nối 2 máy chủ cùng
// lúc để dự phòng). Mọi tin nhắn được MÃ HOÁ AES-GCM bằng khoá sinh từ MÃ PHÒNG,
// nên chỉ người biết mã phòng mới đọc được. Hai người nhập cùng mã phòng là gặp nhau.
// Thêm ?broker=ws://may-chu:cong vào địa chỉ để dùng máy chủ MQTT riêng.
// ============================================================
G.online = {
  BROKERS: ['wss://broker.hivemq.com:8884/mqtt', 'wss://broker.emqx.io:8084/mqtt'],
  APP: 'tech-english-quest/v1',
  clients: [], peers: {}, seen: new Set(), key: null, topic: null, n: 0, unread: 0,
  status: 'off', lastSent: 0, lastPos: '', timer: null,

  cfg() {
    const s = G.state;
    s.online = s.online || {};
    const o = s.online;
    o.room = o.room || ''; o.auto = !!o.auto; o.history = o.history || []; o.engDay = o.engDay || {};
    if (!o.pid) o.pid = Math.random().toString(36).slice(2, 10);
    return o;
  },
  brokers() {
    const m = location.search.match(/[?&]broker=([^&]+)/);
    return m ? [decodeURIComponent(m[1])] : this.BROKERS;
  },
  connectedCount() { return this.clients.filter((c) => c.connected).length; },
  isOn() { return this.status !== 'off'; },
  onlinePeers() { return Object.values(this.peers).filter((p) => p.online); },

  // ---------- Mã hoá ----------
  b64(buf) { let s = ''; new Uint8Array(buf).forEach((b) => { s += String.fromCharCode(b); }); return btoa(s); },
  unb64(str) { const s = atob(str); const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; },
  async derive(room) {
    const enc = new TextEncoder();
    const base = await crypto.subtle.importKey('raw', enc.encode(room), 'PBKDF2', false, ['deriveKey']);
    this.key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: enc.encode(this.APP), iterations: 60000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    const h = await crypto.subtle.digest('SHA-256', enc.encode(this.APP + '|' + room));
    this.topic = this.APP + '/' + Array.from(new Uint8Array(h)).slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
  },
  async enc(obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, this.key, new TextEncoder().encode(JSON.stringify(obj)));
    const out = new Uint8Array(12 + ct.byteLength); out.set(iv); out.set(new Uint8Array(ct), 12);
    return this.b64(out);
  },
  async dec(str) {
    const a = this.unb64(str);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: a.slice(0, 12) }, this.key, a.slice(12));
    return JSON.parse(new TextDecoder().decode(pt));
  },

  loadLib() {
    if (window.mqtt) return Promise.resolve();
    return new Promise((res, rej) => {
      const sc = document.createElement('script');
      sc.src = 'js/vendor/mqtt.min.js';
      sc.onload = () => res(); sc.onerror = () => rej(new Error('Không tải được thư viện kết nối'));
      document.head.appendChild(sc);
    });
  },
  normRoom(r) { return String(r || '').trim().toUpperCase().replace(/\s+/g, '-'); },
  randomRoom() {
    const w = ['MANGO', 'LOTUS', 'KOI', 'OOLONG', 'PANDA', 'BUBBLE', 'SUNNY', 'STAR', 'HEART', 'TIGER'];
    return G.pick(w) + '-' + G.pick(w) + '-' + Math.floor(1000 + Math.random() * 9000);
  },

  // ---------- Kết nối ----------
  async connect(room) {
    const o = this.cfg();
    room = this.normRoom(room);
    if (room.length < 6) { G.ui.toast('Mã phòng cần ít nhất 6 ký tự.'); return false; }
    if (!window.crypto || !crypto.subtle) { G.ui.toast('Trình duyệt chưa hỗ trợ mã hoá (cần mở qua https).'); return false; }
    this.disconnect(true);
    o.room = room;
    this.status = 'connecting'; this.render();
    try { await this.loadLib(); await this.derive(room); } catch (e) { this.status = 'off'; G.ui.toast('⚠️ ' + e.message); this.render(); return false; }
    const bye = await this.enc({ t: 'bye', id: o.pid, n: 0 });
    this.clients = this.brokers().map((url) => {
      const c = mqtt.connect(url, {
        clientId: 'teq_' + o.pid + '_' + Math.random().toString(36).slice(2, 6), clean: true, keepalive: 30,
        reconnectPeriod: 5000, connectTimeout: 10000,
        will: { topic: this.topic + '/p/' + o.pid, payload: bye, qos: 0, retain: true },
      });
      c.on('connect', () => {
        c.subscribe(this.topic + '/#');
        this.status = 'on';
        this.sendPresence(true);
        this.render(); G.game.updateHud();
      });
      c.on('message', (t, payload) => this.onMsg(t, payload.toString()));
      c.on('close', () => { if (this.status !== 'off' && !this.connectedCount()) { this.status = 'connecting'; this.render(); } });
      c.on('error', () => {});
      return c;
    });
    if (!this.timer) this.timer = setInterval(() => this.tick(), 250);
    G.game.save();
    return true;
  },
  disconnect(silent) {
    if (this.clients.length && this.key) {
      // để lại vị trí cuối cùng cho người kia thấy "offline"
      this.publish('p/' + this.cfg().pid, this.presence('bye'), true);
    }
    const cs = this.clients;
    this.clients = [];
    setTimeout(() => cs.forEach((c) => { try { c.end(true); } catch (e) { /* bỏ qua */ } }), 300);
    this.peers = {};
    this.status = 'off';
    if (!silent) { this.render(); G.game.updateHud(); }
  },
  async publish(sub, obj, retain) {
    if (!this.key) return;
    obj.id = this.cfg().pid; obj.n = ++this.n;
    const payload = await this.enc(obj);
    this.clients.forEach((c) => { if (c.connected) c.publish(this.topic + '/' + sub, payload, { qos: 0, retain: !!retain }); });
  },
  presence(t = 'p') {
    const s = G.state, p = G.game.player, r = G.game.curRegion;
    return { t, name: s.profile.name, look: Object.assign({}, s.profile, { wear: (s.wardrobe && s.wardrobe.wear) || {} }), x: Math.round(p.x), y: Math.round(p.y), dir: p.dir, mv: p.moving ? 1 : 0, rg: r ? r.name : '', lv: G.game.level, at: Date.now() };
  },
  sendPresence(force) {
    if (this.status !== 'on' || !G.game.player) return;
    const p = G.game.player;
    const pos = Math.round(p.x / 4) + ',' + Math.round(p.y / 4) + ',' + p.dir + ',' + (p.moving ? 1 : 0);
    const now = Date.now();
    if (!force && pos === this.lastPos && now - this.lastSent < 5000) return;
    if (!force && now - this.lastSent < 200) return;
    this.lastPos = pos; this.lastSent = now;
    this.publish('p/' + this.cfg().pid, this.presence(), true);
  },
  async onMsg(topic, str) {
    if (!str || !this.key) return;
    let m;
    try { m = await this.dec(str); } catch (e) { return; }
    const me = this.cfg().pid;
    if (!m || m.id === me) return;
    const k = m.id + ':' + m.n + ':' + m.t;
    if (m.t !== 'p' && m.t !== 'bye') { if (this.seen.has(k)) return; this.seen.add(k); }
    let peer = this.peers[m.id];
    if (m.t === 'p' || m.t === 'bye') {
      if (peer && m.at && peer.at && m.at < peer.at) return; // tin cũ đến muộn từ máy chủ thứ 2
      const fresh = m.t === 'p' && Date.now() - (m.at || 0) < 20000;
      const wasOn = peer && peer.online;
      if (!peer) peer = this.peers[m.id] = { x: m.x, y: m.y, frame: 0 };
      const upd = { name: m.name, look: m.look, tx: m.x, ty: m.y, dir: m.dir, mv: m.mv, rg: m.rg, lv: m.lv, at: m.at };
      Object.keys(upd).forEach((k) => { if (upd[k] !== undefined && upd[k] !== null) peer[k] = upd[k]; });
      peer.online = fresh; peer.seen = Date.now(); peer.name = peer.name || 'Bạn'; peer.mv = fresh ? peer.mv : 0;
      if (peer.tx === undefined) { this.peers[m.id] = undefined; delete this.peers[m.id]; return; } // chưa biết vị trí → bỏ qua
      if (Math.hypot(peer.x - peer.tx, peer.y - peer.ty) > 400 || isNaN(peer.x)) { peer.x = peer.tx; peer.y = peer.ty; }
      if (fresh && !wasOn) { G.ui.toast('💞 ' + m.name + ' đang online' + (m.rg ? ' ở ' + m.rg : '') + '!'); G.audio.sfx('good'); }
      if (m.t === 'bye' && wasOn) G.ui.toast('👋 ' + (peer.name || 'Bạn ấy') + ' đã offline.');
      if (!!wasOn !== fresh || !this.shown || !this.shown[m.id]) { (this.shown = this.shown || {})[m.id] = true; this.render(); }
      return;
    }
    const name = (peer && peer.name) || m.name || 'Bạn';
    if (m.t === 'c') {
      this.addHistory({ from: m.id, name, text: String(m.text).slice(0, 300), at: m.at || Date.now() });
      if (peer) peer.bubble = { text: String(m.text).slice(0, 60), until: Date.now() + 6000 };
      if (!this.panelOpen) { this.unread++; G.ui.toast('💬 ' + name + ': ' + String(m.text).slice(0, 80)); }
      G.audio.sfx('coin');
      this.render(); this.badge();
    } else if (m.t === 'e') {
      if (peer) peer.bubble = { text: m.emo, until: Date.now() + 3500, emo: true };
      if (!this.panelOpen) G.ui.toast(name + ' gửi ' + m.emo);
    } else if (m.t === 'g' && m.to === me && G.items[m.item]) {
      const it = G.items[m.item], n = Math.max(1, Math.min(99, m.qty | 0));
      G.game.addItem(m.item, n);
      this.addHistory({ sys: true, text: '🎁 ' + name + ' tặng bạn ' + n + ' ' + it.vi + ' (' + it.en + ')', at: Date.now() });
      G.ui.toast('🎁 ' + name + ' tặng bạn ' + n + ' ' + it.vi + '!'); G.audio.sfx('level');
      this.render();
    }
  },
  addHistory(h) {
    const o = this.cfg();
    o.history.push(h);
    if (o.history.length > 100) o.history.splice(0, o.history.length - 100);
  },

  // ---------- Gửi ----------
  sendChat(text) {
    text = String(text || '').trim().slice(0, 300);
    if (!text || this.status !== 'on') return;
    const o = this.cfg();
    this.publish('c', { t: 'c', name: G.state.profile.name, text, at: Date.now() });
    this.addHistory({ from: o.pid, name: G.state.profile.name, text, at: Date.now(), me: true });
    G.game.playerBubble = { text: text.slice(0, 60), until: Date.now() + 6000 };
    // thưởng nhỏ khi chat bằng tiếng Anh (tối đa 15 tin/ngày)
    const day = G.clock.dateKey();
    if (/^[\x20-\x7E’‘“”…]+$/.test(text) && /[a-z]{2,}/i.test(text) && text.split(/\s+/).length >= 2) {
      o.engDay[day] = (o.engDay[day] || 0) + 1;
      if (o.engDay[day] <= 15) G.game.addXp(2);
    }
    this.render();
  },
  sendEmote(emo) {
    if (this.status !== 'on') return;
    this.publish('e', { t: 'e', emo });
    G.game.playerBubble = { text: emo, until: Date.now() + 3500, emo: true };
  },
  sendGift(peerId, item, qty) {
    if (this.status !== 'on' || G.game.count(item) < qty) return false;
    G.game.addItem(item, -qty);
    this.publish('g', { t: 'g', to: peerId, item, qty });
    const it = G.items[item], p = this.peers[peerId];
    this.addHistory({ sys: true, text: '🎁 Bạn tặng ' + (p ? p.name : '') + ' ' + qty + ' ' + it.vi, at: Date.now() });
    G.audio.sfx('coin');
    return true;
  },

  // ---------- Mỗi khung hình ----------
  tick() {
    if (this.status === 'on') this.sendPresence(false);
    const now = Date.now();
    Object.values(this.peers).forEach((p) => {
      if (p.online && now - p.seen > 20000) { p.online = false; this.render(); }
    });
  },
  update(dt) {
    Object.values(this.peers).forEach((p) => {
      const k = Math.min(1, dt * 8);
      const dx = p.tx - p.x, dy = p.ty - p.y;
      p.x += dx * k; p.y += dy * k;
      p.frame = (p.mv || Math.hypot(dx, dy) > 2) ? p.frame + dt * 12 : 0;
    });
  },
  // người chơi khác đứng gần (để bấm nút Chat)
  nearPeer() {
    const pl = G.game.player;
    let best = null, bd = 56;
    Object.entries(this.peers).forEach(([id, p]) => {
      if (!p.online) return;
      const d = Math.hypot(p.x - pl.x, p.y - pl.y);
      if (d < bd) { bd = d; best = Object.assign({ id }, p); }
    });
    return best;
  },
  draw(ctx, cam, ents) {
    const vis = (x, y) => x > cam.x - 60 && x < cam.x + cam.w + 60 && y > cam.y - 60 && y < cam.y + cam.h + 80;
    Object.values(this.peers).forEach((p) => {
      if (!vis(p.x, p.y) || (!p.online && !this.isOn())) return;
      ents.push({ y: p.y, d: () => {
        ctx.save();
        if (!p.online) ctx.globalAlpha = 0.45;
        G.drawChar(ctx, p.x, p.y, p.dir || 0, p.frame, G.playerLook(p.look || {}));
        ctx.restore();
        // đứng sát người chơi thì đẩy bảng tên lên cao để không đè nhau
        const me = G.game.player, near = Math.abs(p.x - me.x) < 80 && Math.abs(p.y - me.y) < 40;
        const off = near ? 16 : 0;
        this.drawTag(ctx, p.x, p.y - off, (p.online ? '💞 ' : '💤 ') + p.name, p.online ? '#ec407a' : '#78909c');
        if (p.bubble && p.bubble.until > Date.now()) this.drawBubble(ctx, p.x, p.y - 62 - off, p.bubble);
      } });
    });
  },
  drawTag(ctx, x, y, text, col) {
    ctx.font = 'bold 10px system-ui, sans-serif'; ctx.textAlign = 'center';
    const tw = ctx.measureText(text).width + 10;
    ctx.fillStyle = col; G.rr(ctx, x - tw / 2, y - 58, tw, 14, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText(text, x, y - 48);
  },
  drawBubble(ctx, x, y, b) {
    ctx.font = (b.emo ? '20px' : 'bold 11px') + ' system-ui, sans-serif'; ctx.textAlign = 'center';
    const lines = [];
    if (b.emo) lines.push(b.text);
    else { let cur = ''; String(b.text).split(' ').forEach((w) => { if ((cur + ' ' + w).trim().length > 22) { lines.push(cur.trim()); cur = w; } else cur += ' ' + w; }); if (cur.trim()) lines.push(cur.trim()); }
    const lh = b.emo ? 22 : 13, w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 14, h = lines.length * lh + 8;
    ctx.fillStyle = 'rgba(255,255,255,.96)'; G.rr(ctx, x - w / 2, y - h, w, h, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x, y + 6); ctx.lineTo(x + 5, y); ctx.fill();
    ctx.fillStyle = '#263238';
    lines.forEach((l, i) => ctx.fillText(l, x, y - h + 4 + (i + 1) * lh - (b.emo ? 4 : 3)));
  },
  badge() {
    const b = document.getElementById('mNet');
    if (!b) return;
    b.dataset.badge = this.unread ? String(Math.min(this.unread, 9)) : '';
    b.classList.toggle('live', this.status === 'on');
  },

  // ---------- Giao diện ----------
  QUICK: ['Hi! Where are you?', 'I’m at the farm.', 'Let’s meet at KOI Thé!', 'I’m on my way!', 'Wait for me!', 'What are you doing?', 'I miss you ❤️', 'Good night! Sleep well.', 'Good job!', 'See you later!'],
  EMOTES: ['👋', '❤️', '😂', '🎉', '😴', '🧋'],
  render() {
    this.badge();
    if (!this.panelOpen || !G.ui.isOpen()) return;
    const pl = G.ui.el('nplayers'), log = G.ui.el('nlog');
    if (this.status === this.panelStatus && pl && log) {
      pl.innerHTML = this.playersHtml();
      const atEnd = log.scrollTop + log.clientHeight >= log.scrollHeight - 30;
      log.innerHTML = this.logHtml();
      if (atEnd) log.scrollTop = log.scrollHeight;
      const st = G.ui.el('nstat'); if (st) st.innerHTML = this.statHtml();
      return;
    }
    this.panel(true);
  },
  statHtml() { return `${this.status === 'on' ? '🟢 Đã vào phòng' : '🟡 Đang kết nối...'} <b>${G.esc(this.cfg().room)}</b> <small>(${this.connectedCount()}/${this.clients.length} máy chủ)</small>`; },
  playersHtml() {
    const peers = Object.entries(this.peers);
    return peers.length ? peers.map(([id, p]) => `<div class="row"><div class="big-emoji">${p.online ? '💞' : '💤'}</div><div class="rn"><b>${G.esc(p.name)}</b><small>${p.online ? 'Online' : 'Offline'} · Lv ${p.lv || '?'} · ${G.esc(p.rg || '')}</small></div>
      <button class="btn small" data-goto="${id}">📍 Đi tới</button>${p.online ? `<button class="btn small ghost" data-gift="${id}">🎁 Tặng</button>` : ''}</div>`).join('')
      : '<p class="hint">Chưa có ai khác trong phòng. Gửi mã phòng cho người ấy nhé!</p>';
  },
  logHtml() {
    const hist = this.cfg().history.slice(-50);
    return hist.length ? hist.map((h) => h.sys ? `<div class="msg sys">${G.esc(h.text)}</div>` : `<div class="msg ${h.me ? 'me' : 'them'}"><small>${G.esc(h.name)}</small><br>${G.esc(h.text)}</div>`).join('') : '<p class="hint">Chưa có tin nhắn.</p>';
  },
  panel(keep) {
    const ui = G.ui, o = this.cfg(), s = G.state;
    this.panelOpen = true; this.unread = 0; this.badge();
    let body;
    if (this.status === 'off') {
      body = `<p class="sub">Chơi cùng người thân: hai người nhập <b>cùng một mã phòng</b> là sẽ thấy nhau trong thế giới, chat và tặng quà cho nhau theo thời gian thực.</p>
        <label class="set">🔑 Mã phòng <input id="nroom" class="tin" value="${G.esc(o.room)}" placeholder="VD: LOTUS-KOI-2026" autocomplete="off" autocapitalize="characters"></label>
        <div class="row2"><button class="btn ghost" id="nrand">🎲 Tạo mã mới</button><button class="btn" id="ngo">🌐 Vào phòng</button></div>
        <label class="set"><input type="checkbox" id="nauto" ${o.auto ? 'checked' : ''}> Tự vào phòng khi mở game</label>
        <div class="sec"><h4>Cách dùng cho 2 người</h4><p>1. Một người bấm “Tạo mã mới” rồi gửi mã cho người kia (Zalo/Messenger).<br>2. Cả hai nhập cùng mã và bấm “Vào phòng”.<br>3. Bấm 🗺️ hoặc nút “Đi tới chỗ bạn ấy” để gặp nhau. Đứng gần nhau thì nút tròn đổi thành 💬.</p></div>
        <p class="hint">🔒 Tin nhắn và vị trí được mã hoá bằng mã phòng trước khi gửi qua máy chủ công cộng — người không có mã không đọc được. Đừng dùng mã quá dễ đoán. Cần có Internet.</p>`;
    } else {
      body = `<div class="job ${this.status === 'on' ? 'active' : ''}"><div class="jt" id="nstat">${this.statHtml()}</div>
        <div class="sbtns"><button class="btn small ghost" id="ncopy">📋 Chép mã phòng</button><button class="btn small ghost" id="noff">⏏️ Rời phòng</button></div></div>
        <h3>💬 Trò chuyện <small>(+2 XP mỗi tin nhắn tiếng Anh, tối đa 15 tin/ngày)</small></h3>
        <div class="chat netlog" id="nlog">${this.logHtml()}</div>
        <div class="tchips">${this.EMOTES.map((e) => `<button class="tchip" data-emo="${e}">${e}</button>`).join('')}</div>
        <div class="tchips quick">${this.QUICK.map((q, i) => `<button class="tchip" data-q="${i}">${G.esc(q)}</button>`).join('')}</div>
        <div id="nbox"><input id="nmsg" class="tin" maxlength="300" placeholder="Nhắn tin (nên dùng tiếng Anh)..." autocomplete="off"><button class="btn small" id="nsend">Gửi</button></div>
        <h3>👥 Người chơi</h3>
        <div class="list" id="nplayers">${this.playersHtml()}</div>`;
    }
    const draft = keep && ui.el('nmsg') ? ui.el('nmsg').value : '';
    const p = ui.open(`<h2>🌐 Chơi cùng nhau</h2>${body}`, { cls: 'wide', keepScroll: keep, onClose: () => { this.panelOpen = false; } });
    this.panelStatus = this.status;
    const log = ui.el('nlog'); if (log) log.scrollTop = log.scrollHeight;
    if (!keep && log) { const box = ui.el('nbox'); if (box) box.scrollIntoView({ block: 'nearest' }); }
    ui.on(p, '#nrand', () => { ui.el('nroom').value = this.randomRoom(); });
    ui.on(p, '#ngo', () => { o.auto = ui.el('nauto').checked; this.connect(ui.el('nroom').value); });
    const auto = ui.el('nauto'); if (auto) auto.addEventListener('change', () => { o.auto = auto.checked; });
    ui.on(p, '#noff', () => { o.auto = false; this.disconnect(); });
    ui.on(p, '#ncopy', () => { try { navigator.clipboard.writeText(o.room); ui.toast('📋 Đã chép mã phòng: ' + o.room); } catch (e) { ui.toast('Mã phòng: ' + o.room); } });
    const pl = ui.el('nplayers');
    if (pl) pl.addEventListener('click', (e) => {
      const g = e.target.closest('[data-goto]'), f = e.target.closest('[data-gift]');
      if (g) { G.audio.sfx('click'); this.goto(g.dataset.goto); } else if (f) { G.audio.sfx('click'); this.giftPanel(f.dataset.gift); }
    });
    ui.on(p, '[data-emo]', (x) => this.sendEmote(x.dataset.emo));
    ui.on(p, '[data-q]', (x) => { const inp = ui.el('nmsg'); inp.value = this.QUICK[+x.dataset.q]; inp.focus(); });
    const inp = ui.el('nmsg');
    if (inp) {
      inp.value = draft;
      const send = () => { const v = inp.value; inp.value = ''; this.sendChat(v); };
      ui.el('nsend').addEventListener('click', send);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
    }
  },
  goto(id) {
    const p = this.peers[id], g = G.game;
    if (!p) return;
    const r = G.world.regionOfPx(p.tx, p.ty);
    if (r && r.level > g.level) { G.ui.toast('🔒 ' + p.name + ' đang ở ' + r.name + ' — bạn cần Level ' + r.level + ' để vào.'); return; }
    // đứng cạnh, tránh chỗ bị chặn
    for (const [dx, dy] of [[28, 0], [-28, 0], [0, 28], [0, -28], [0, 0]]) {
      if (!g.blocked(p.tx + dx, p.ty + dy)) { g.player.x = p.tx + dx; g.player.y = p.ty + dy; break; }
    }
    G.ui.close();
    G.ui.toast('📍 Bạn đã tới chỗ ' + p.name + '!');
  },
  giftPanel(id) {
    const ui = G.ui, s = G.state, p = this.peers[id];
    if (!p) return;
    const ids = [...new Set(s.inv.filter(Boolean).map((sl) => sl.id))].filter((x) => x !== 'tool_can');
    const pnl = ui.open(`<h2>🎁 Tặng quà cho ${G.esc(p.name)}</h2>
      <div class="list">${ids.length ? ids.map((x) => `<div class="row"><img src="${G.partImg(x, 40)}"><div class="rn"><b>${G.esc(G.items[x].vi)}</b><small>${G.esc(G.items[x].en)} · có ${G.game.count(x)}</small></div><button class="btn small" data-give="${x}">Tặng 1</button></div>`).join('') : '<p class="hint">Balo trống.</p>'}</div>
      <button class="btn ghost" id="gback">‹ Quay lại</button>`, { onClose: () => { this.panelOpen = false; } });
    ui.on(pnl, '[data-give]', (x) => { if (this.sendGift(id, x.dataset.give, 1)) { ui.toast('🎁 Đã tặng ' + G.items[x.dataset.give].vi + ' cho ' + p.name); this.giftPanel(id); } });
    ui.on(pnl, '#gback', () => this.panel());
  },
  autoStart() {
    const o = this.cfg();
    if (o.auto && o.room) this.connect(o.room);
  },
};
