// ============================================================
// LỊCH LÀM VIỆC — theo giờ thực. Mặc định: Thứ 2–Thứ 6, 8:00–17:00
// (nghỉ trưa 12:00–13:00) = đúng 8 tiếng làm. Chỉnh trong ⚙️ Cài đặt.
// ============================================================
G.work = {
  DAYS_VI: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  DAYS_EN: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  cfg() {
    const s = G.state;
    s.work = s.work || {};
    if (!Array.isArray(s.work.days)) s.work.days = [1, 2, 3, 4, 5];
    if (typeof s.work.start !== 'number') s.work.start = 8;
    s.work.log = s.work.log || {};
    // flex: ca 8 tiếng tính từ lúc chấm công (6:00–20:00) · fixed: giờ cố định
    if (s.work.mode !== 'fixed' && s.work.mode !== 'flex') s.work.mode = 'flex';
    return s.work;
  },
  hhmm(h) { const m = Math.round(h * 60); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); },
  times() { const st = this.cfg().start; return { start: st, lunch: st + 4, back: st + 5, end: st + 9 }; },
  isWorkDay(d = G.clock.date()) { return this.cfg().days.includes(d.getDay()); },
  flex() { return this.cfg().mode === 'flex'; },
  FLEX_FROM: 6, FLEX_TO: 20, SHIFT_H: 8,
  // ca linh hoạt hôm nay (nếu đã chấm công)
  flexShift() {
    const c = this.cfg(), f = c.flexAt;
    if (!f || f.day !== G.clock.dateKey()) return null;
    return { start: f.at, end: f.at + this.SHIFT_H * 3600e3 };
  },
  // trạng thái hiện tại: work | lunch | before | after | off
  status() {
    const d = G.clock.date(), h = d.getHours() + d.getMinutes() / 60, t = this.times();
    if (this.flex()) {
      const sh = this.flexShift(), now = G.clock.now();
      if (sh && now < sh.end) return { type: 'work', left: (sh.end - now) / 60000 };
      if (sh) return { type: 'after' };
      if (!this.isWorkDay(d)) return { type: 'off' };
      if (h >= this.FLEX_FROM && h < this.FLEX_TO) return { type: 'ready' };
      return { type: h < this.FLEX_FROM ? 'before' : 'after', left: (this.FLEX_FROM - h) * 60 };
    }
    if (!this.isWorkDay(d)) return { type: 'off' };
    if (h < t.start) return { type: 'before', left: (t.start - h) * 60 };
    if (h < t.lunch) return { type: 'work', left: (t.lunch - h) * 60 };
    if (h < t.back) return { type: 'lunch', left: (t.back - h) * 60 };
    if (h < t.end) return { type: 'work', left: (t.end - h) * 60 };
    return { type: 'after' };
  },
  onShift() { return this.status().type === 'work'; },
  label() {
    const st = this.status(), t = this.times();
    const dur = (m) => (m >= 60 ? Math.floor(m / 60) + 'h' : '') + String(Math.floor(m % 60)).padStart(m >= 60 ? 2 : 1, '0') + 'p';
    switch (st.type) {
      case 'work': return this.flex() ? '🟢 Trong ca · tan ca sau ' + dur(st.left) : '🟢 Trong ca · ' + (G.clock.date().getHours() < t.lunch ? 'nghỉ trưa' : 'tan ca') + ' sau ' + dur(st.left);
      case 'ready': return '🛠️ Vào Trung Tâm Bảo Hành để bắt đầu ca';
      case 'lunch': return '🍱 Nghỉ trưa · còn ' + dur(st.left);
      case 'before': return '⏰ Vào ca lúc ' + this.hhmm(this.flex() ? this.FLEX_FROM : t.start);
      case 'after': return '🌙 Hết giờ làm';
      default: return '🏖️ Ngày nghỉ';
    }
  },
  scheduleText() {
    const c = this.cfg(), t = this.times();
    const days = [1, 2, 3, 4, 5, 6, 0].filter((d) => c.days.includes(d)).map((d) => this.DAYS_VI[d]).join(', ') || 'không có ngày nào';
    if (this.flex()) {
      const sh = this.flexShift();
      return `${days} · ca linh hoạt 8 tiếng, bắt đầu khi bạn chấm công (${this.hhmm(this.FLEX_FROM)}–${this.hhmm(this.FLEX_TO)})` + (sh ? ` · hôm nay: ${this.hhmm(new Date(sh.start).getHours() + new Date(sh.start).getMinutes() / 60)}–${this.hhmm((new Date(sh.start).getHours() + new Date(sh.start).getMinutes() / 60 + this.SHIFT_H) % 24)}` : '');
    }
    return `${days} · ${this.hhmm(t.start)}–${this.hhmm(t.end)} (nghỉ trưa ${this.hhmm(t.lunch)}–${this.hhmm(t.back)}, làm 8 tiếng)`;
  },
  // dùng trong hội thoại tiếng Anh
  hoursEn() { const t = this.times(); const f = (h) => { const hr = Math.floor(h) % 12 || 12; return hr + (h < 12 ? ' a.m.' : ' p.m.'); }; return f(t.start) + ' to ' + f(t.end); },
  daysEn() {
    const c = this.cfg().days.slice().sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
    if (!c.length) return 'no days';
    const cont = c.every((d, i) => i === 0 || (c[i - 1] + 1) % 7 === d);
    return cont && c.length > 2 ? this.DAYS_EN[c[0]] + ' to ' + this.DAYS_EN[c[c.length - 1]] : c.map((d) => this.DAYS_EN[d]).join(', ');
  },
  nextWorkDayEn() {
    const d = G.clock.date();
    for (let i = 1; i <= 7; i++) { const n = new Date(d.getTime() + i * 864e5); if (this.isWorkDay(n)) return i === 1 ? 'tomorrow' : this.DAYS_EN[n.getDay()]; }
    return 'tomorrow';
  },
  // chấm công khi vào Trung Tâm Bảo Hành trong giờ làm
  checkIn() {
    const c = this.cfg(), key = G.clock.dateKey();
    if (this.flex()) {
      if (c.log[key] || this.status().type !== 'ready') return null;
      c.flexAt = { day: key, at: G.clock.now() };
      c.log[key] = 'ok';
      G.state.stats.workdays = (G.state.stats.workdays || 0) + 1;
      return { late: false, pay: 25, start: true };
    }
    if (c.log[key] || !this.onShift()) return null;
    const d = G.clock.date(), h = d.getHours() + d.getMinutes() / 60;
    const late = h > this.times().start + 0.25 && h < this.times().lunch;
    c.log[key] = late ? 'late' : 'ok';
    G.state.stats.workdays = (G.state.stats.workdays || 0) + 1;
    return { late, pay: late ? 10 : 25 };
  },
};
