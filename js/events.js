// ============================================================
// SỰ KIỆN — lịch lặp hằng tuần theo giờ thật (dữ liệu trong js/data/events.js).
// Thông báo trước 3 ngày, nhắc trước 1 giờ, 10 phút, và khi bắt đầu.
// ?event=<id> trên đường dẫn: ép sự kiện đó đang diễn ra (để thử).
// ============================================================
G.events = {
  HOUR: 3600e3,
  force: null,
  init() { const m = location.search.match(/[?&]event=([a-z]+)/); if (m) this.force = { id: m[1], at: G.clock.now() - 5 * 60000 }; },
  st() {
    const s = G.state;
    s.events = s.events || {};
    const e = s.events;
    e.notified = e.notified || {}; e.done = e.done || {}; e.certs = e.certs || {}; e.attended = e.attended || {};
    e.stamps = e.stamps || {}; e.claimed = e.claimed || {}; e.booth = e.booth || {};
    return e;
  },
  on() { return G.feat.has('events'); },
  avail(ev) { return !ev.need || G.feat.has(ev.need); },
  list() { return EVENTS.filter((ev) => this.avail(ev)); },
  // các lần diễn ra trong khoảng [from, to]
  occ(ev, from, to) {
    const out = [], base = new Date(from - 864e5);
    base.setHours(0, 0, 0, 0);
    for (let d = 0; d <= Math.ceil((to - from) / 864e5) + 1; d++) {
      const day = new Date(base.getFullYear(), base.getMonth(), base.getDate() + d);
      if (!ev.days.includes(day.getDay())) continue;
      const start = day.getTime() + ev.start * this.HOUR, end = start + ev.dur * this.HOUR;
      if (end < from || start > to) continue;
      out.push(this.mk(ev, start, end, day));
    }
    if (this.force && this.force.id === ev.id) {
      const f = this.force.at, fe = f + ev.dur * this.HOUR;
      if (fe >= from && f <= to) out.unshift(this.mk(ev, f, fe, new Date(f)));
    }
    return out;
  },
  mk(ev, start, end, day) {
    const k = day.getFullYear() + '-' + String(day.getMonth() + 1).padStart(2, '0') + '-' + String(day.getDate()).padStart(2, '0');
    return { ev, start, end, key: ev.id + '@' + k };
  },
  // lần gần nhất chưa kết thúc của mỗi sự kiện
  nextOf(ev, now = G.clock.now()) { return this.occ(ev, now, now + 8 * 864e5)[0] || null; },
  upcoming(now = G.clock.now()) {
    return this.list().map((ev) => this.nextOf(ev, now)).filter(Boolean).sort((a, b) => a.start - b.start);
  },
  activeAll(now = G.clock.now()) { return this.on() ? this.upcoming(now).filter((o) => o.start <= now && now < o.end) : []; },
  activeFor(type) { return this.activeAll().find((o) => o.ev.place === type || o.ev.place2 === type) || null; },
  activeKind(kind) { return this.activeAll().find((o) => o.ev.kind === kind) || null; },
  teaMul() { return this.activeKind('teafest') ? 0.5 : 1; },
  sellMul(id) { const o = this.activeKind('market'); return o && G.items[id] && G.items[id].kind === 'crop' ? o.ev.sellMul : 1; },

  // ---------- Hiển thị thời gian ----------
  hhmm(h) { return G.work.hhmm(h); },
  dur(ms) {
    const m = Math.max(1, Math.round(ms / 60000));
    const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
    return d ? d + ' ngày' + (h ? ' ' + h + 'g' : '') : h ? h + 'g' + (mm ? String(mm).padStart(2, '0') + 'p' : '') : mm + 'p';
  },
  whenText(o) {
    const d = new Date(o.start), now = G.clock.date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dd = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - today) / 864e5);
    const day = dd === 0 ? 'Hôm nay' : dd === 1 ? 'Ngày mai' : G.work.DAYS_VI[d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth() + 1);
    const h0 = d.getHours() + d.getMinutes() / 60;
    return day + ' ' + this.hhmm(h0) + '–' + this.hhmm(h0 + o.ev.dur);
  },
  scheduleText(ev) {
    return ev.days.map((d) => (d === 0 ? 'Chủ nhật' : 'Thứ ' + (d + 1))).join(', ') + ' hằng tuần · ' + this.hhmm(ev.start) + '–' + this.hhmm(ev.start + ev.dur);
  },
  // toà nhà tổ chức gần người chơi nhất
  building(ev) {
    const p = G.game.player, L = G.game.level;
    let best = null, bd = 1e9;
    G.world.buildings.forEach((b) => {
      if (b.t !== ev.place && b.t !== ev.place2) return;
      const d = Math.hypot(b.dx * G.TS - p.x, b.dy * G.TS - p.y) + (b.region.level > L ? 1e6 : 0);
      if (d < bd) { bd = d; best = b; }
    });
    return best;
  },
  placeName(ev) {
    const b = this.building(ev);
    if (!b) return '?';
    const b2 = ev.place2 && G.world.buildings.find((x) => x.t === ev.place2);
    return b.name + (b2 && b2 !== b ? ' & ' + b2.name : '') + ' — ' + b.region.name;
  },

  // ---------- Thông báo theo thời gian thực ----------
  tick() {
    if (!this.on() || !G.game.running) return;
    const e = this.st(), now = G.clock.now(), H = this.HOUR, fresh = [];
    this.upcoming(now).forEach((o) => {
      const n = e.notified[o.key] || (e.notified[o.key] = {});
      const r = o.start - now, ev = o.ev;
      if (r <= 0) {
        if (!n.s) {
          n.s = n.m = n.h = n.a = 1;
          G.audio.sfx('good');
          G.ui.banner(ev.icon + ' ' + ev.name, 'Đang diễn ra · ' + this.placeName(ev));
          G.ui.toast('🎉 ' + ev.name + ' ĐÃ BẮT ĐẦU tại ' + this.placeName(ev) + '! Kết thúc lúc ' + this.hhmm(ev.start + ev.dur) + '.', 'gold');
        }
      } else if (r <= 10 * 60000) {
        if (!n.m) { n.m = n.h = n.a = 1; G.audio.sfx('ring'); G.ui.toast('🔔 Còn ' + this.dur(r) + ' nữa: ' + ev.icon + ' ' + ev.name + ' — bấm 📢 để được chỉ đường.', 'gold'); }
      } else if (r <= H) {
        if (!n.h) { n.h = n.a = 1; G.audio.sfx('ring'); G.ui.toast('⏰ Còn ' + this.dur(r) + ' nữa: ' + ev.icon + ' ' + ev.name + ' tại ' + this.placeName(ev) + '.'); }
      } else if (r <= EVENT_NOTICE_H * H && !n.a) fresh.push(o);
    });
    if (fresh.length && !G.ui.isOpen()) {
      fresh.forEach((o) => { e.notified[o.key].a = 1; });
      this.announce(fresh);
    }
    // dọn bản ghi cũ
    const keys = Object.keys(e.notified);
    if (keys.length > 60) keys.slice(0, keys.length - 40).forEach((k) => delete e.notified[k]);
  },
  announce(list) {
    G.audio.sfx('ok');
    const ui = G.ui;
    const p = ui.open(`<div class="center"><div class="big-emoji">📢</div><h2>Thông báo sự kiện sắp tới</h2></div>
      ${list.map((o) => `<div class="evcard soon"><div class="evh">${o.ev.icon} <b>${G.esc(o.ev.name)}</b> <small>${G.esc(o.ev.en)}</small></div>
        <div>🗓️ <b>${G.esc(this.whenText(o))}</b> · còn ${G.esc(this.dur(o.start - G.clock.now()))}</div>
        <div>📍 ${G.esc(this.placeName(o.ev))}</div><p class="hint">${G.esc(o.ev.desc)}</p></div>`).join('')}
      <p class="hint">Game sẽ nhắc lại trước 1 giờ và 10 phút. Muốn điện thoại tự nhắc kể cả khi tắt game? Thêm vào lịch nhé.</p>
      <div class="row2"><button class="btn ghost" id="evics">📅 Thêm vào lịch</button><button class="btn" data-close>Đã rõ 👍</button></div>`);
    ui.on(p, '#evics', () => this.ics(list.map((o) => o.ev)));
  },
  hud() {
    const el = document.getElementById('hEvent');
    if (!el) return;
    if (!this.on() || !G.game.running) { el.style.display = 'none'; return; }
    const now = G.clock.now(), o = this.upcoming(now)[0];
    let txt = '';
    if (o && o.start <= now) txt = '🎉 ' + o.ev.icon + ' ' + o.ev.name + ' · đang diễn ra (còn ' + this.dur(o.end - now) + ')';
    else if (o && o.start - now <= EVENT_NOTICE_H * this.HOUR) txt = '📢 ' + o.ev.icon + ' ' + o.ev.name + ' · ' + this.whenText(o).replace(/–.*/, '') + ' (còn ' + this.dur(o.start - now) + ')';
    el.style.display = txt ? 'block' : 'none';
    el.classList.toggle('live', !!(o && o.start <= now));
    if (el.textContent !== txt) el.textContent = txt;
  },

  // ---------- Chỉ đường ----------
  guideTarget() {
    if (!this.guide) return null;
    const ev = EVENTS.find((x) => x.id === this.guide);
    const o = ev && this.nextOf(ev);
    if (!o || this.st().done[o.key]) { this.guide = null; return null; }
    const b = this.building(ev);
    return b && b.region.level <= G.game.level ? { x: b.dx, y: b.dy + 1, label: ev.icon + ' ' + b.name } : null;
  },

  // ---------- Bảng sự kiện ----------
  panel() {
    const ui = G.ui, e = this.st(), now = G.clock.now();
    const locked = EVENTS.filter((ev) => !this.avail(ev));
    const card = (ev) => {
      const o = this.nextOf(ev), live = o && o.start <= now, done = o && e.done[o.key];
      const b = this.building(ev), far = b && b.region.level > G.game.level;
      return `<div class="evcard ${live ? 'live' : ''}"><div class="evh">${ev.icon} <b>${G.esc(ev.name)}</b> <small>${G.esc(ev.en)}</small>
          ${live ? '<span class="kind live">ĐANG DIỄN RA</span>' : ''}${done ? '<span class="kind ok">✅ Đã tham dự</span>' : ''}${e.certs[ev.id] ? '<span class="kind cert">🎓 Có chứng nhận</span>' : ''}</div>
        <div>🔁 ${G.esc(this.scheduleText(ev))}</div>
        ${o ? `<div>🗓️ Lần tới: <b>${G.esc(this.whenText(o))}</b> · ${live ? 'kết thúc sau ' + this.dur(o.end - now) : 'còn ' + this.dur(o.start - now)}</div>` : ''}
        <div>📍 ${G.esc(this.placeName(ev))}${far ? ` <small>(🔒 vùng này mở ở Lv ${b.region.level})</small>` : ''}</div>
        <p class="hint">${G.esc(ev.desc)}</p>
        <div class="sbtns"><button class="btn small" data-go="${ev.id}">📍 Chỉ đường</button><button class="btn small ghost" data-ics="${ev.id}">📅 Thêm vào lịch</button></div></div>`;
    };
    const p = ui.open(`<h2>📢 Sự kiện & Thông báo</h2>
      <p class="sub">Sự kiện diễn ra theo giờ thật, lặp lại mỗi tuần. Bạn sẽ được báo trước 3 ngày, nhắc trước 1 giờ và 10 phút.</p>
      ${this.list().sort((a, b) => (this.nextOf(a) || { start: 9e15 }).start - (this.nextOf(b) || { start: 9e15 }).start).map(card).join('')}
      ${locked.map((ev) => `<div class="evcard lockd"><div class="evh">🔒 <b>Sự kiện bí ẩn</b></div><p class="hint">${G.esc(G.feat.lockedMsg(ev.need))}</p></div>`).join('')}
      <button class="btn ghost" id="evall">📅 Thêm tất cả vào lịch điện thoại</button>
      <p class="hint">Lịch (.ics) có nhắc trước 1 giờ và 10 phút, hoạt động cả khi tắt game. Trên iPhone: mở tệp vừa tải → “Thêm tất cả”.</p>`, { cls: 'wide' });
    ui.on(p, '[data-go]', (x) => { this.guide = x.dataset.go; ui.close(); G.ui.toast('📍 Đi theo mũi tên hồng để tới nơi tổ chức.'); });
    ui.on(p, '[data-ics]', (x) => this.ics([EVENTS.find((ev) => ev.id === x.dataset.ics)]));
    ui.on(p, '#evall', () => this.ics(this.list()));
  },

  // tệp lịch .ics lặp hằng tuần, có 2 lời nhắc
  ics(evs) {
    const pad = (n) => String(n).padStart(2, '0');
    const loc = (d) => d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00';
    const esc = (t) => String(t).replace(/[\\;,]/g, (c) => '\\' + c).replace(/\n/g, '\\n');
    const BY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    const now = new Date(), stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TechEnglish Quest//Events//VI', 'CALSCALE:GREGORIAN'];
    evs.forEach((ev) => {
      const o = this.occ(ev, G.clock.now(), G.clock.now() + 8 * 864e5).filter((x) => !this.force || x.ev.id !== this.force.id || x.start !== this.force.at)[0];
      if (!o) return;
      const title = ev.icon + ' ' + ev.name + ' (game Hành Trình KTV)';
      lines.push('BEGIN:VEVENT', 'UID:' + ev.id + '@tech-english-quest', 'DTSTAMP:' + stamp, 'DTSTART:' + loc(new Date(o.start)),
        'DURATION:PT' + Math.round(ev.dur * 60) + 'M', 'RRULE:FREQ=WEEKLY;BYDAY=' + ev.days.map((d) => BY[d]).join(','),
        'SUMMARY:' + esc(title), 'LOCATION:' + esc(this.placeName(ev)), 'DESCRIPTION:' + esc(ev.desc));
      ['-PT1H', '-PT10M'].forEach((tr) => lines.push('BEGIN:VALARM', 'TRIGGER:' + tr, 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(title), 'END:VALARM'));
      lines.push('END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'su-kien-tech-english.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 20000);
    G.ui.toast('📅 Đã tạo tệp lịch — mở tệp để thêm vào Lịch của điện thoại.');
  },

  // ---------- Vào toà nhà khi đang có sự kiện ----------
  door(b) {
    if (!this.on()) return false;
    const o = this.activeFor(b.t);
    if (!o) return false;
    const k = o.ev.kind;
    if (k === 'workshop') this.workshop(o, b);
    else if (k === 'teafest') this.teafest(o, b);
    else if (k === 'market') this.market(o, b);
    else return false;
    return true;
  },
  head(o, sub) {
    const left = this.dur(o.end - G.clock.now());
    return `<div class="tag">${o.ev.icon} Sự kiện · ${G.esc(o.ev.en)} · còn ${left}</div><h2>${o.ev.icon} ${G.esc(o.ev.name)}</h2>${sub ? `<p class="sub">${sub}</p>` : ''}`;
  },
  face(p, ev) {
    const c = p.querySelector('.face');
    if (!c) return;
    const fc = c.getContext('2d'); fc.scale(2, 2);
    G.drawChar(fc, 32, 62, 0, 0, G.NPC_LOOKS[ev.look % G.NPC_LOOKS.length], 1.55);
  },

  // Hội thảo: nghe giảng (slide) → hỏi đáp → kiểm tra
  workshop(o, b) {
    const ui = G.ui, e = this.st(), ev = o.ev;
    if (e.done[o.key]) {
      ui.open(`${this.head(o)}<div class="center"><div class="big-emoji">🎓</div><p>Bạn đã hoàn thành buổi hội thảo hôm nay. Hẹn gặp lại lần sau!</p>
        <p class="hint">Lần tới: ${G.esc(this.scheduleText(ev))}</p></div>
        <div class="row2"><button class="btn ghost" id="evnorm">Vào ${G.esc(b.name)}</button><button class="btn" data-close>OK</button></div>`);
      ui.on(ui.el('panel'), '#evnorm', () => this.normal(b));
      return;
    }
    const p = ui.open(`${this.head(o, 'Diễn giả: ' + G.esc(ev.host))}
      <p>${G.esc(ev.desc)}</p>
      <div class="stats"><div>📑 Bài giảng<b>${ev.slides.length} slide</b></div><div>❓ Kiểm tra<b>${Math.min(6, ev.quiz.length)} câu</b></div><div>🏆 Thưởng<b>${e.certs[ev.id] ? ev.repeatXp + ' XP' : ev.xp + ' XP · ' + ev.coins + ' 🪙'}</b></div></div>
      <p class="hint">Nghe kỹ từng slide (bấm 🔊), cuối buổi trả lời đúng ≥ 80% để nhận chứng nhận 🎓${e.certs[ev.id] ? '' : ' và quà linh kiện'}.</p>
      <button class="btn big" id="evstart">🪑 Ngồi vào chỗ — bắt đầu</button>
      <button class="btn ghost" id="evnorm">Chỉ ghé ${G.esc(b.name)} thôi</button>`);
    ui.on(p, '#evstart', () => this.slide(o, 0));
    ui.on(p, '#evnorm', () => this.normal(b));
  },
  normal(b) {
    G.ui.close();
    const f = G.ui['b_' + b.t];
    if (f) f.call(G.ui, b); else G.ui.b_house(b);
  },
  slide(o, i) {
    const ui = G.ui, ev = o.ev, sl = ev.slides[i];
    if (!sl) return this.qa(o);
    const p = ui.open(`${this.head(o)}
      <div class="tag">📑 Slide ${i + 1}/${ev.slides.length}</div>
      <div class="talk"><canvas class="face" width="128" height="128"></canvas>
        <div class="bubble"><b>${G.esc(ev.host)}</b><div class="say-en">${G.esc(sl.en)} ${ui.sayBtn(sl.en)}</div>
        <div class="say-vi ${G.state.settings.vi ? '' : 'hide'}">${G.esc(sl.vi)}</div>${G.state.settings.vi ? '' : '<button class="mini" id="showvi">Xem nghĩa</button>'}</div></div>
      <div class="need">${sl.words.map((w) => `<span class="chip">${G.esc(w)} ${ui.sayBtn(w)}</span>`).join('')}</div>
      <div class="row2">${i ? '<button class="btn ghost" id="evprev">‹ Slide trước</button>' : ''}<button class="btn" id="evnext">${i + 1 < ev.slides.length ? 'Slide tiếp ›' : 'Phần hỏi đáp ›'}</button></div>`, { cls: 'wide' });
    this.face(p, ev);
    setTimeout(() => G.tts.speak(sl.en), 250);
    ui.on(p, '#showvi', () => { p.querySelector('.say-vi').classList.remove('hide'); p.querySelector('#showvi').remove(); });
    ui.on(p, '#evprev', () => this.slide(o, i - 1));
    ui.on(p, '#evnext', () => { G.tts.stop(); this.slide(o, i + 1); });
    G.state.phrases[sl.en] = G.state.phrases[sl.en] || { th: 'event', tip: ev.name, t: Date.now() };
  },
  qa(o) {
    const ev = o.ev;
    if (!ev.qa) return this.quiz(o);
    G.ui.convo({ id: 'ev_' + ev.id, title: 'Hỏi đáp · ' + ev.en, who: ev.host, steps: ev.qa }, {
      who: ev.host, look: G.NPC_LOOKS[ev.look % G.NPC_LOOKS.length], onEnd: () => this.quiz(o),
    });
  },
  quiz(o, qs, i = 0, right = 0) {
    const ui = G.ui, ev = o.ev;
    qs = qs || G.shuffle(ev.quiz.slice()).slice(0, 6);
    if (i >= qs.length) return this.result(o, right, qs.length);
    const q = qs[i], opts = G.shuffle([q.a, ...q.o]);
    const p = ui.open(`${this.head(o)}<div class="tag">❓ Câu ${i + 1}/${qs.length} · đúng ${right}</div>
      <p class="qtxt"><b>${G.esc(q.q)}</b> ${ui.sayBtn(q.q)}</p>
      <div class="opts">${opts.map((t, k) => `<button class="opt left" data-k="${k}">${G.esc(t)}</button>`).join('')}</div><div id="evres"></div>`);
    let locked = false;
    ui.on(p, '.opt', (x) => {
      if (locked) return; locked = true;
      const ok = opts[+x.dataset.k] === q.a;
      p.querySelectorAll('.opt').forEach((bt) => { bt.disabled = true; if (opts[+bt.dataset.k] === q.a) bt.classList.add('good'); });
      if (!ok) x.classList.add('bad');
      G.audio.sfx(ok ? 'good' : 'bad');
      ui.el('evres').innerHTML = `<div class="res ${ok ? 'good' : 'bad'}">${ok ? '✅ Chính xác!' : '❌ Đáp án đúng: ' + G.esc(q.a)}</div><button class="btn" id="evq">${i + 1 < qs.length ? 'Câu tiếp ›' : 'Xem kết quả ›'}</button>`;
      ui.on(p, '#evq', () => this.quiz(o, qs, i + 1, right + (ok ? 1 : 0)));
    });
  },
  result(o, right, n) {
    const ui = G.ui, g = G.game, e = this.st(), ev = o.ev;
    const pass = right >= Math.ceil(n * 0.8);
    if (!pass) {
      G.audio.sfx('bad');
      const p = ui.open(`${this.head(o)}<div class="center"><div class="big-emoji">📚</div><h2>Chưa đạt (${right}/${n})</h2>
        <p>Cần đúng ít nhất ${Math.ceil(n * 0.8)}/${n} câu. Xem lại slide rồi làm lại — sự kiện còn ${this.dur(o.end - G.clock.now())}.</p></div>
        <div class="row2"><button class="btn ghost" id="evre">📑 Xem lại slide</button><button class="btn" id="evagain">🔁 Làm lại bài kiểm tra</button></div>`);
      ui.on(p, '#evre', () => this.slide(o, 0));
      ui.on(p, '#evagain', () => this.quiz(o));
      return;
    }
    const first = !e.certs[ev.id];
    e.done[o.key] = true; e.certs[ev.id] = e.certs[ev.id] || G.clock.dateKey();
    e.attended[ev.id] = (e.attended[ev.id] || 0) + 1;
    const xp = first ? ev.xp : ev.repeatXp, coins = first ? ev.coins : Math.round(ev.coins / 2);
    if (first && ev.gift) g.addItem(ev.gift, 1, true);
    g.addCoins(coins); g.addXp(xp);
    g.hearts(g.player.x, g.player.y - 20, 14);
    G.audio.sfx('level');
    const gift = first && ev.gift && G.items[ev.gift];
    ui.open(`${this.head(o)}<div class="center"><div class="big-emoji">🎓</div><h2>Đạt ${right}/${n} — Xuất sắc!</h2>
      <div class="cert"><small>CERTIFICATE OF ATTENDANCE</small><b>${G.esc(G.state.profile.name)}</b><div>${G.esc(ev.en)}</div><small>${G.esc(G.clock.dateKey())} · ${G.esc(ev.host)}</small></div>
      <p><b>+${xp} XP · +${coins} 🪙</b>${gift ? ` · 🎁 Quà: ${G.esc(gift.vi || gift.name || ev.gift)}` : ''}</p>
      <p class="hint">Các câu trong bài giảng đã được lưu vào 📒 Sổ tay mẫu câu. Tham dự lại tuần sau để ôn và nhận thêm XP.</p></div>
      <button class="btn big" data-close>Cảm ơn diễn giả! 👏</button>`);
    G.tts.speak('Congratulations, ' + G.state.profile.name + '! Thank you for joining our workshop.');
    this.guide = null;
    g.checkStory();
  },

  // Ngày hội trà sữa: giảm giá, thẻ tích điểm, gian đố vui
  teafest(o, b) {
    const ui = G.ui, e = this.st(), ev = o.ev, n = e.stamps[o.key] || 0, need = ev.stamps;
    const claim = n >= need && !e.claimed[o.key];
    const p = ui.open(`${this.head(o, 'MC ' + G.esc(ev.host.replace(/^MC /, '')) + ': “Welcome to the Bubble Tea Festival! Everything is half price today!”')}
      <div class="stamps">${Array.from({ length: need }, (_, i) => `<span class="${i < n ? 'on' : ''}">${i < n ? '🧋' : '○'}</span>`).join('')}</div>
      <p class="center">Thẻ tích điểm: <b>${Math.min(n, need)}/${need}</b> ly order chuẩn tiếng Anh ${e.claimed[o.key] ? '· ✅ đã nhận quà' : ''}</p>
      ${claim ? '<button class="btn big" id="evclaim">🎁 Nhận quà ngày hội</button>' : ''}
      <button class="btn big ${claim ? 'ghost' : ''}" id="evorder">🧋 Order đồ uống (giảm 50%)</button>
      <button class="btn ghost" id="evbooth">🎯 Gian đố vui topping ${e.booth[o.key] ? '(đã chơi)' : '(+20 🪙)'}</button>
      <p class="hint">Mỗi ly order thành công ở KOI Thé hoặc Phê La trong ngày hội được 1 dấu. Đủ ${need} dấu nhận ${ev.xp} XP + ${ev.coins} 🪙.</p>`);
    G.tts.speak('Welcome to the Bubble Tea Festival! Everything is half price today!');
    ui.on(p, '#evclaim', () => {
      e.claimed[o.key] = true; e.attended[ev.id] = (e.attended[ev.id] || 0) + 1; e.done[o.key] = true;
      G.game.addCoins(ev.coins); G.game.addXp(ev.xp); G.game.hearts(G.game.player.x, G.game.player.y - 20, 16);
      G.audio.sfx('level'); ui.toast('🎁 Quà Ngày hội Trà Sữa: +' + ev.xp + ' XP, +' + ev.coins + ' 🪙!', 'gold');
      this.teafest(o, b);
    });
    ui.on(p, '#evorder', () => { ui.close(); G.tea.open(b); });
    ui.on(p, '#evbooth', () => this.booth(o, b));
  },
  booth(o, b, qs, i = 0, right = 0) {
    const ui = G.ui, e = this.st(), ev = o.ev;
    qs = qs || G.shuffle(ev.quiz.slice()).slice(0, 5);
    if (i >= qs.length) {
      const first = !e.booth[o.key], win = right >= 4;
      if (first) { e.booth[o.key] = true; G.game.addXp(right * 5); if (win) G.game.addCoins(20); }
      G.audio.sfx(win ? 'level' : 'ok');
      const p = ui.open(`${this.head(o)}<div class="center"><div class="big-emoji">${win ? '🏆' : '🎯'}</div><h2>Đúng ${right}/${qs.length}</h2>
        <p>${first ? '+' + right * 5 + ' XP' + (win ? ' · +20 🪙' : '') : 'Chơi lại để luyện thêm (không tính thưởng).'}</p></div>
        <button class="btn" id="evback">‹ Quay lại ngày hội</button>`);
      ui.on(p, '#evback', () => this.teafest(o, b));
      return;
    }
    const q = qs[i], opts = G.shuffle([q.a, ...q.o]);
    const p = ui.open(`${this.head(o)}<div class="tag">🎯 Gian đố vui · Câu ${i + 1}/${qs.length}</div>
      <p class="qtxt"><b>${G.esc(q.q)}</b></p><div class="opts">${opts.map((t, k) => `<button class="opt left" data-k="${k}">${G.esc(t)}</button>`).join('')}</div><div id="evres"></div>`);
    let locked = false;
    ui.on(p, '.opt', (x) => {
      if (locked) return; locked = true;
      const ok = opts[+x.dataset.k] === q.a;
      p.querySelectorAll('.opt').forEach((bt) => { bt.disabled = true; if (opts[+bt.dataset.k] === q.a) bt.classList.add('good'); });
      if (!ok) x.classList.add('bad');
      G.audio.sfx(ok ? 'good' : 'bad');
      ui.el('evres').innerHTML = `<button class="btn" id="evq">Tiếp ›</button>`;
      ui.on(p, '#evq', () => this.booth(o, b, qs, i + 1, right + (ok ? 1 : 0)));
    });
  },
  // gọi từ G.tea.serve khi phục vụ xong một ly
  onDrink() {
    const o = this.activeKind('teafest');
    if (!o) return;
    const e = this.st(), n = (e.stamps[o.key] || 0) + 1;
    e.stamps[o.key] = n;
    if (n <= o.ev.stamps) G.ui.toast('🧋 Thẻ tích điểm ngày hội: ' + n + '/' + o.ev.stamps + (n >= o.ev.stamps ? ' — vào quán bấm 🎁 Nhận quà!' : ''), n >= o.ev.stamps ? 'gold' : '');
  },

  // Chợ phiên: nông sản giá gấp đôi
  market(o, b) {
    const ui = G.ui, e = this.st(), ev = o.ev;
    const p = ui.open(`${this.head(o, G.esc(ev.host) + ': “Fresh vegetables! Come and buy!” 🥬🍓')}
      <p>Hôm nay Tiệm Nông Sản <b>mua nông sản giá ×${ev.sellMul}</b>. Bán ngay kẻo hết giờ!</p>
      <div class="wcard"><small>Câu chào hàng hay dùng ở chợ:</small>
        <div class="en">Fresh strawberries! Two for the price of one! ${ui.sayBtn('Fresh strawberries! Two for the price of one!')}</div>
        <div class="en">They were picked this morning. ${ui.sayBtn('They were picked this morning.')}</div>
        <div class="en">Would you like to try one? ${ui.sayBtn('Would you like to try one?')}</div></div>
      <button class="btn big" id="evshop">🌾 Vào tiệm bán nông sản (×${ev.sellMul})</button>`);
    if (!e.done[o.key]) { e.done[o.key] = true; e.attended[ev.id] = (e.attended[ev.id] || 0) + 1; G.game.addXp(15); }
    ui.on(p, '#evshop', () => this.normal(b));
  },

  // ---------- Trang trí toà nhà đang có sự kiện ----------
  decorate(ctx, b, t) {
    if (!this.on()) return;
    const o = this.activeFor(b.t);
    if (!o) return;
    const S = G.TS, X = b.x * S, Y = b.y * S, W = b.w * S;
    const roofH = Math.max(S, Math.floor(b.h * S * 0.5));
    const y0 = Y + roofH - 2;
    // dây cờ đuôi nheo
    ctx.strokeStyle = 'rgba(120,70,100,.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(X - 2, y0); ctx.quadraticCurveTo(X + W / 2, y0 + 14, X + W + 2, y0); ctx.stroke();
    const cols = ['#ff8fab', '#ffd166', '#8fd6a7', '#7ec8f0', '#c3a6ff'];
    const n = Math.max(5, Math.round(W / 14));
    for (let i = 1; i < n; i++) {
      const u = i / n, x = X - 2 + (W + 4) * u, y = y0 + 4 * (1 - (2 * u - 1) * (2 * u - 1)) * 3.5;
      ctx.fillStyle = cols[i % cols.length];
      ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 8 + Math.sin(t * 4 + i) * 1); ctx.closePath(); ctx.fill();
    }
    // bóng bay hai bên cửa
    [[b.dx * S - 6, '#ff6f9f'], [b.dx * S + 38, '#c3a6ff']].forEach(([bx, c], k) => {
      const by = b.dy * S - 4 + Math.sin(t * 2 + k * 2) * 3;
      ctx.strokeStyle = 'rgba(120,70,100,.5)'; ctx.beginPath(); ctx.moveTo(bx, by + 8); ctx.quadraticCurveTo(bx + 3, by + 18, bx, b.dy * S + 24); ctx.stroke();
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(bx, by, 6, 7.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(bx - 2, by - 3, 1.6, 2.4, -0.4, 0, Math.PI * 2); ctx.fill();
    });
    // biển “EVENT”
    ctx.font = '900 10px "Nunito", system-ui, sans-serif'; ctx.textAlign = 'center';
    const lbl = o.ev.icon + ' EVENT';
    const tw = ctx.measureText(lbl).width + 12, sx = b.dx * S + 16, sy = b.dy * S - 16 + Math.sin(t * 3) * 1.5;
    ctx.fillStyle = '#ff6f9f'; G.rr(ctx, sx - tw / 2, sy - 9, tw, 14, 7); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillText(lbl, sx, sy + 2);
  },
};
