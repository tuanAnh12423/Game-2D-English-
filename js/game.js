// Vòng lặp game, trạng thái người chơi, nhân vật, vật phẩm
const NPC_NAMES = ['Anh Nam', 'Chị Hương', 'Bác Ba', 'Cô Thu', 'Anh Khoa', 'Chị Vy', 'Ông Tâm', 'Bé Bin', 'Anh Long', 'Chị Ngọc', 'Chú Hải', 'Cô Linh', 'Mr. John', 'Ms. Emma', 'Mr. Kenji', 'Ms. Sarah'];

G.game = {
  state: null, player: null, npcs: [], items: [], floaters: [], cam: { x: 0, y: 0, w: 0, h: 0 },
  scale: 2, dpr: 1, t: 0, running: false, target: null, pushDoor: 0, bumpCd: 0, spawnCd: 0, saveCd: 15, hudCd: 0,
  curRegion: null,

  // ---------- Trạng thái ----------
  newState() {
    const home = G.world.regions[0];
    return {
      v: 1, x: home.spawnPx.x, y: home.spawnPx.y, xp: 0, coins: 50, day: 1, time: 6 * 60 + 30,
      words: {}, parts: {}, mods: {}, seen: {}, stats: { jobs: 0, talks: 0, crafts: 0, caught: 0, wrong: 0, reviews: 0 },
      story: 0, entered: {}, visited: {}, board: [], boardDay: 0, job: null, gifts: {}, boost: 0,
      settings: { tts: true, sfx: true, rate: 0.9, vi: true },
    };
  },
  levelFromXp(xp) { let L = 1; while (xp >= 40 * (L + 1) * L) L++; return L; },
  xpForLevel(L) { return 40 * L * (L - 1); },
  get level() { return this.levelFromXp(this.state.xp); },

  start(fresh) {
    const saved = fresh ? null : G.store.load();
    const base = this.newState();
    this.state = saved ? Object.assign(base, saved, { settings: Object.assign(base.settings, saved.settings || {}), stats: Object.assign(base.stats, saved.stats || {}) }) : base;
    G.state = this.state;
    const s = this.state;
    this.player = { x: s.x, y: s.y, dir: 0, frame: 0, moving: false };
    if (this.blocked(s.x, s.y)) { this.player.x = G.world.regions[0].spawnPx.x; this.player.y = G.world.regions[0].spawnPx.y; }
    this.items = [];
    this.makeNpcs();
    G.world.regions.forEach((r) => { if (r.level <= this.level) this.fillRegion(r, true); });
    this.refreshBoard();
    this.curRegion = null;
    this.running = true;
    this.updateHud(true);
    if (!saved) setTimeout(() => G.ui.intro(), 300);
  },
  save() {
    const s = this.state;
    s.x = Math.round(this.player.x); s.y = Math.round(this.player.y);
    G.store.save(s);
  },

  // ---------- Kinh nghiệm & tiền ----------
  addXp(n, x, y) {
    if (!n) return;
    const before = this.level;
    this.state.xp += n;
    if (x !== undefined) this.float('+' + n + ' XP', x, y, '#7cf');
    const after = this.level;
    if (after > before) {
      G.audio.sfx('level');
      const opened = G.world.regions.filter((r) => r.level > before && r.level <= after);
      opened.forEach((r) => this.fillRegion(r, true));
      G.ui.levelUp(after, opened);
    }
    this.updateHud(true);
  },
  addCoins(n, x, y) {
    if (!n) return;
    this.state.coins = Math.max(0, this.state.coins + n);
    if (x !== undefined && n > 0) this.float('+' + n + ' 🪙', x, y - 16, '#ffd54f');
    if (n > 0) G.audio.sfx('coin');
    this.updateHud(true);
  },
  addItem(id, n = 1) {
    const isMod = !!G.recipeById[id];
    const bag = isMod ? this.state.mods : this.state.parts;
    bag[id] = (bag[id] || 0) + n;
    if (bag[id] <= 0) delete bag[id];
    if (!isMod && n > 0) this.state.seen[id] = true;
  },
  count(id) { return (G.recipeById[id] ? this.state.mods[id] : this.state.parts[id]) || 0; },
  hasAll(need) { return Object.keys(need).every((id) => this.count(id) >= need[id]); },
  float(text, x, y, color) { this.floaters.push({ text, x, y, color, t: 0 }); },
  ownedWords() { return Object.keys(this.state.words); },

  // ---------- Bảng đơn sửa chữa theo ngày ----------
  refreshBoard(force) {
    const s = this.state;
    if (!force && s.boardDay === s.day && s.board.length) return;
    const L = this.level;
    const ok = JOBS.filter((j) => j.level <= L);
    const rnd = G.mulberry(s.day * 977 + L);
    s.board = G.shuffle(ok, rnd).slice(0, 4).map((j) => j.id);
    s.boardDay = s.day;
  },
  jobById(id) { return JOBS.find((j) => j.id === id); },
  acceptJob(id) {
    const L = this.level;
    const houses = G.world.buildings.filter((b) => b.t === 'house' && b.region.level <= L);
    const cur = this.curRegion;
    const pool = houses.filter((b) => b.region !== cur);
    const b = G.pick(pool.length ? pool : houses);
    this.state.job = { id, bkey: b.key };
    this.state.board = this.state.board.filter((x) => x !== id);
    G.ui.toast('📋 Đã nhận đơn: tới ' + b.name + ' (' + b.region.name + ')');
  },
  jobBuilding() { const j = this.state.job; return j ? G.world.buildings.find((b) => b.key === j.bkey) : null; },

  // ---------- Nhân vật phụ ----------
  makeNpcs() {
    this.npcs = [];
    G.world.regions.forEach((r) => {
      const rnd = G.mulberry(G.strHash(r.id) + 99);
      for (let i = 0; i < (r.npcs || 0); i++) {
        const tile = G.world.randomFreeTile(r, rnd);
        if (!tile) continue;
        this.npcs.push({
          x: (tile.x + 0.5) * G.TS, y: (tile.y + 0.5) * G.TS, dir: 0, frame: 0, r,
          look: G.NPC_LOOKS[Math.floor(rnd() * G.NPC_LOOKS.length)], name: G.pick(NPC_NAMES, rnd),
          vx: 0, vy: 0, timer: rnd() * 3, talked: 0,
        });
      }
    });
  },

  // ---------- Vật phẩm rơi ----------
  pickWord(r) {
    const s = this.state;
    const active = new Set(this.items.filter((i) => i.kind === 'word').map((i) => i.w.en));
    const pool = [];
    r.words.forEach((c) => (WORD_CATS[c] ? WORD_CATS[c].words : []).forEach((w) => { const o = G.wordByEn[w[0]]; if (o && !active.has(o.en)) pool.push(o); }));
    if (!pool.length) return null;
    const fresh = pool.filter((w) => !s.words[w.en]);
    if (fresh.length && Math.random() < 0.75) return G.pick(fresh);
    const sorted = pool.slice().sort((a, b) => ((s.words[a.en] || {}).m || 0) - ((s.words[b.en] || {}).m || 0));
    return G.pick(sorted.slice(0, Math.max(3, Math.ceil(sorted.length / 2))));
  },
  pickPart(r) {
    if (this.level >= 3 && Math.random() < 0.04) {
      const rare = PARTS.filter((p) => p.rarity >= 3);
      return G.pick(rare).id;
    }
    const list = r.parts.map((id) => G.partById[id]).filter(Boolean);
    let sum = 0;
    const ws = list.map((p) => (sum += 1 / Math.pow(p.rarity, 1.6)));
    const v = Math.random() * sum;
    return list[ws.findIndex((w) => w >= v)].id;
  },
  spawnIn(r, kind) {
    const tile = G.world.randomFreeTile(r);
    if (!tile) return;
    const x = (tile.x + 0.5) * G.TS, y = (tile.y + 0.5) * G.TS;
    if (Math.hypot(x - this.player.x, y - this.player.y) < 90) return;
    if (this.items.some((i) => Math.abs(i.x - x) < 4 && Math.abs(i.y - y) < 4)) return;
    if (kind === 'word') { const w = this.pickWord(r); if (w) this.items.push({ kind, w, x, y, r, ph: Math.random() * 6 }); }
    else this.items.push({ kind, id: this.pickPart(r), x, y, r, ph: Math.random() * 6 });
  },
  fillRegion(r, all) {
    const cnt = (k) => this.items.filter((i) => i.r === r && i.kind === k).length;
    const maxW = 9, maxP = 5;
    let guard = 0;
    while (cnt('word') < maxW && guard++ < 40) { this.spawnIn(r, 'word'); if (!all) break; }
    guard = 0;
    while (cnt('part') < maxP && guard++ < 40) { this.spawnIn(r, 'part'); if (!all) break; }
  },

  // ---------- Va chạm ----------
  blockedTile(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= G.world.w || ty >= G.world.h) return true;
    if (G.world.isSolidTile(tx, ty)) return true;
    const r = G.world.regionOfTile(tx, ty);
    return !r || r.level > this.level;
  },
  blocked(x, y) {
    const S = G.TS;
    const pts = [[x - 8, y - 7], [x + 8, y - 7], [x - 8, y + 3], [x + 8, y + 3]];
    return pts.some(([px, py]) => this.blockedTile(Math.floor(px / S), Math.floor(py / S)));
  },
  lockedAhead(x, y) {
    const r = G.world.regionOfPx(x, y);
    return r && r.level > this.level ? r : null;
  },

  // ---------- Cập nhật ----------
  update(dt) {
    const s = this.state, p = this.player;
    this.t += dt;
    // đồng hồ trong game: 1 giây = 1 phút
    s.time += dt;
    if (s.time >= 24 * 60) {
      this.sleep(true);
      return;
    }
    // di chuyển
    const ax = G.input.axis();
    const speed = 150 * (s.boost > Date.now() ? 1.45 : 1);
    const mag = Math.hypot(ax.x, ax.y);
    p.moving = mag > 0.1;
    let pushingDoor = false;
    if (p.moving) {
      if (Math.abs(ax.x) > Math.abs(ax.y)) p.dir = ax.x > 0 ? 2 : 1; else p.dir = ax.y > 0 ? 0 : 3;
      const dx = ax.x * speed * dt, dy = ax.y * speed * dt;
      const nx = p.x + dx, ny = p.y + dy;
      let hit = false;
      if (!this.blocked(nx, p.y)) p.x = nx; else hit = true;
      if (!this.blocked(p.x, ny)) p.y = ny; else hit = true;
      p.frame += dt * 12 * Math.min(1, mag + 0.3);
      if (hit) {
        const lk = this.lockedAhead(p.x + ax.x * 20, p.y + ax.y * 20);
        if (lk && this.bumpCd <= 0) { G.ui.toast('🔒 ' + lk.name + ' — cần Level ' + lk.level + '. Hãy học thêm từ và làm đơn sửa chữa!'); this.bumpCd = 3; G.audio.sfx('bump'); }
        const fx = Math.floor((p.x + ax.x * 18) / G.TS), fy = Math.floor((p.y - 2 + ax.y * 18) / G.TS);
        if (G.world.get(fx, fy) === G.T.DOOR) pushingDoor = true;
      }
    } else p.frame = 0;
    this.bumpCd -= dt;

    // vùng đất hiện tại
    const r = G.world.regionOfPx(p.x, p.y);
    if (r && r !== this.curRegion) {
      this.curRegion = r;
      if (!s.visited[r.id]) { s.visited[r.id] = true; G.ui.banner(r.name, r.en, true); this.addXp(15); }
      else G.ui.banner(r.name, r.en, false);
      this.fillRegion(r, true);
      this.updateHud(true);
    }

    // nhặt vật phẩm
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (Math.abs(it.x - p.x) < 22 && Math.abs(it.y - (p.y - 8)) < 24) {
        this.items.splice(i, 1);
        this.collect(it);
        return; // mở hộp thoại, dừng khung hình này
      }
    }

    // nhân vật phụ
    this.npcs.forEach((n) => {
      if (Math.abs(n.x - p.x) > 900 || Math.abs(n.y - p.y) > 700) return;
      n.timer -= dt;
      if (n.timer <= 0) {
        n.timer = 1.5 + Math.random() * 3;
        if (Math.random() < 0.45) { n.vx = 0; n.vy = 0; }
        else { const a = Math.floor(Math.random() * 4); n.vx = [0, -1, 1, 0][a]; n.vy = [1, 0, 0, -1][a]; n.dir = a; }
      }
      const near = Math.hypot(n.x - p.x, n.y - p.y) < 50;
      if (near) { // đứng lại nhìn người chơi
        n.dir = Math.abs(p.x - n.x) > Math.abs(p.y - n.y) ? (p.x > n.x ? 2 : 1) : (p.y > n.y ? 0 : 3);
        n.frame = 0; return;
      }
      if (n.vx || n.vy) {
        const nx = n.x + n.vx * 50 * dt, ny = n.y + n.vy * 50 * dt;
        const nr = G.world.regionOfPx(nx, ny);
        if (nr === n.r && !this.blocked(nx, ny)) { n.x = nx; n.y = ny; n.frame += dt * 10; } else { n.vx = -n.vx; n.vy = -n.vy; n.dir = [0, 2, 1, 3][n.dir] ?? 0; }
      } else n.frame = 0;
    });

    // tìm mục tiêu tương tác
    this.target = null;
    let best = 56;
    this.npcs.forEach((n) => { const d = Math.hypot(n.x - p.x, n.y - p.y); if (d < best) { best = d; this.target = { kind: 'npc', n }; } });
    const ptx = Math.floor(p.x / G.TS), pty = Math.floor((p.y - 4) / G.TS);
    for (let yy = pty - 1; yy <= pty + 1; yy++) for (let xx = ptx - 1; xx <= ptx + 1; xx++) {
      if (G.world.get(xx, yy) !== G.T.DOOR) continue;
      const d = Math.hypot((xx + 0.5) * G.TS - p.x, (yy + 0.5) * G.TS - p.y);
      if (d < 50 && d < best + 10) { best = d; this.target = { kind: 'door', b: G.world.buildingAt(xx, yy) }; }
    }
    const btn = document.getElementById('btnA');
    const label = this.target ? (this.target.kind === 'door' ? '🚪<small>Vào</small>' : '💬<small>Nói</small>') : '✋<small>—</small>';
    if (btn.dataset.l !== label) { btn.innerHTML = label; btn.dataset.l = label; btn.classList.toggle('dim', !this.target); }

    this.pushDoor = pushingDoor ? this.pushDoor + dt : 0;
    if (G.input.takeAction() || this.pushDoor > 0.3) {
      this.pushDoor = 0;
      if (this.target) { G.input.reset(); this.interact(this.target); return; }
    }

    // sinh vật phẩm mới
    this.spawnCd -= dt;
    if (this.spawnCd <= 0) {
      this.spawnCd = 3;
      if (r) for (let gy = r.gy - 1; gy <= r.gy + 1; gy++) for (let gx = r.gx - 1; gx <= r.gx + 1; gx++) {
        const rr = G.world.regionAt(gx, gy);
        if (rr && rr.level <= this.level) this.fillRegion(rr, false);
      }
    }
    // chữ bay
    this.floaters.forEach((f) => { f.t += dt; f.y -= 30 * dt; });
    this.floaters = this.floaters.filter((f) => f.t < 1.4);

    this.saveCd -= dt;
    if (this.saveCd <= 0) { this.saveCd = 15; this.save(); }
    this.hudCd -= dt;
    if (this.hudCd <= 0) { this.hudCd = 0.5; this.updateHud(); this.checkStory(); }
  },

  collect(it) {
    if (it.kind === 'word') {
      G.ui.quizWord(it.w, (ok) => {
        if (ok) { this.addXp(10, this.player.x, this.player.y - 40); this.addCoins(2, this.player.x, this.player.y - 40); }
        this.checkStory();
      });
    } else {
      G.audio.sfx('pick');
      const first = !this.state.seen[it.id];
      this.addItem(it.id, 1);
      const p = G.partById[it.id];
      this.float('+1 ' + p.vi, this.player.x, this.player.y - 44, '#fff');
      this.addXp(first ? 15 : 4);
      if (first) G.ui.partCard(it.id, true);
      else G.ui.toast('🔩 +1 ' + p.vi + ' (' + p.en + ') · đang có ' + this.count(it.id));
      this.checkStory();
    }
  },

  interact(tg) {
    if (tg.kind === 'npc') { G.ui.talk(tg.n); return; }
    const b = tg.b;
    if (!b) return;
    G.audio.sfx('door');
    this.state.entered[b.t] = true;
    G.ui.building(b);
    this.checkStory();
  },

  sleep(forced) {
    const s = this.state;
    s.day += 1; s.time = 6 * 60;
    const home = G.world.buildings.find((b) => b.t === 'home');
    if (home) { this.player.x = (home.dx + 0.5) * G.TS; this.player.y = (home.dy + 1.6) * G.TS; this.player.dir = 0; }
    this.refreshBoard(true);
    this.save();
    G.ui.toast(forced ? '🌙 Quá nửa đêm! Bạn được đưa về nhà ngủ. Ngày ' + s.day + ' bắt đầu.' : '☀️ Chào buổi sáng! Ngày ' + s.day + ' — Good morning!');
    this.updateHud(true);
  },

  nightLevel() {
    const h = this.state.time / 60;
    if (h < 5) return 0.55;
    if (h < 7) return 0.55 * (7 - h) / 2;
    if (h < 17) return 0;
    if (h < 19.5) return 0.5 * (h - 17) / 2.5;
    return 0.55;
  },

  // ---------- Cốt truyện ----------
  storyProgress(q) {
    const s = this.state;
    switch (q.type) {
      case 'enter': return { cur: s.entered[q.target] ? 1 : 0, max: 1 };
      case 'words': return { cur: this.ownedWords().length, max: q.n };
      case 'parts': return { cur: Object.keys(s.seen).length, max: q.n || PARTS.length };
      case 'jobs': return { cur: s.stats.jobs, max: q.n };
      case 'craft': return { cur: s.stats.crafts, max: q.n };
      case 'talk': return { cur: s.stats.talks, max: q.n };
      case 'level': return { cur: this.level, max: q.n };
      case 'regions': return { cur: Object.keys(s.visited).length, max: G.world.regions.length };
    }
    return { cur: 0, max: 1 };
  },
  checkStory() {
    const s = this.state;
    const q = STORY[s.story];
    if (!q) return;
    const pr = this.storyProgress(q);
    if (pr.cur >= pr.max) {
      s.story++;
      G.audio.sfx('good');
      G.ui.toast('🏆 Hoàn thành nhiệm vụ: ' + q.title + '  (+' + q.coins + ' 🪙' + (q.xp ? ', +' + q.xp + ' XP' : '') + ')', 'gold');
      this.addCoins(q.coins);
      this.addXp(q.xp);
      const nx = STORY[s.story];
      if (nx) setTimeout(() => G.ui.toast('📜 Nhiệm vụ mới: ' + nx.title), 2200);
      this.save();
    }
    this.updateHud(true);
  },
  // mục tiêu cần chỉ đường
  guideTarget() {
    const job = this.jobBuilding();
    if (job) return { b: job, label: 'Khách hàng' };
    const q = STORY[this.state.story];
    if (!q) return null;
    let type = null;
    if (q.type === 'enter') type = q.target;
    else if (q.type === 'jobs') type = 'service';
    else if (q.type === 'craft') type = 'shop';
    if (!type) return null;
    const L = this.level, p = this.player;
    let best = null, bd = 1e9;
    G.world.buildings.forEach((b) => {
      if (b.t !== type || b.region.level > L) return;
      const d = Math.hypot(b.dx * G.TS - p.x, b.dy * G.TS - p.y);
      if (d < bd) { bd = d; best = b; }
    });
    return best ? { b: best, label: best.name } : null;
  },

  // ---------- HUD ----------
  updateHud(force) {
    const s = this.state;
    if (!s) return;
    const L = this.level, a = this.xpForLevel(L), b = this.xpForLevel(L + 1);
    const set = (id, v) => { const e = document.getElementById(id); if (e && e.textContent !== String(v)) e.textContent = v; };
    set('hLvl', L);
    set('hCoins', s.coins);
    const hh = Math.floor(s.time / 60), mm = Math.floor(s.time % 60);
    const ic = hh >= 6 && hh < 18 ? '☀️' : '🌙';
    set('hClock', ic + ' ' + String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0') + ' · Ngày ' + s.day);
    document.getElementById('hXp').style.width = Math.min(100, ((s.xp - a) / (b - a)) * 100) + '%';
    set('hRegion', this.curRegion ? this.curRegion.name : '');
    const q = STORY[s.story];
    let txt = '';
    if (s.job) { const j = this.jobById(s.job.id), bb = this.jobBuilding(); txt = '🔧 ' + j.vi + ': ' + j.sv + (bb ? ' → ' + bb.name : ''); }
    else if (q) { const pr = this.storyProgress(q); txt = '📜 ' + q.title + ' (' + Math.min(pr.cur, pr.max) + '/' + pr.max + ')'; }
    else txt = '🌟 Bạn đã hoàn thành cốt truyện! Tiếp tục khám phá nhé.';
    set('hQuest', txt);
  },

  // ---------- Vẽ ----------
  resize() {
    const cv = document.getElementById('game');
    const w = window.innerWidth, h = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * this.dpr); cv.height = Math.round(h * this.dpr);
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    this.vw = w; this.vh = h;
    this.scale = G.clamp(Math.min(w, h) / (11 * G.TS), 1.1, 2.4);
  },

  render() {
    const cv = document.getElementById('game');
    const ctx = cv.getContext('2d');
    const p = this.player, sc = this.scale * this.dpr;
    const cam = this.cam;
    cam.w = this.vw / this.scale; cam.h = this.vh / this.scale;
    const ww = G.world.w * G.TS, wh = G.world.h * G.TS;
    cam.x = G.clamp(p.x - cam.w / 2, 0, Math.max(0, ww - cam.w));
    cam.y = G.clamp(p.y - 16 - cam.h / 2, 0, Math.max(0, wh - cam.h));
    // làm tròn theo điểm ảnh màn hình để không bị viền
    cam.x = Math.round(cam.x * sc) / sc; cam.y = Math.round(cam.y * sc) / sc;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#2f8fd8'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.setTransform(sc, 0, 0, sc, -cam.x * sc, -cam.y * sc);
    ctx.imageSmoothingEnabled = false;
    G.world.drawGround(ctx, cam);
    // sóng nước lấp lánh
    this.drawWaterShimmer(ctx, cam);
    G.world.drawBuildings(ctx, cam, this.t);

    // vật phẩm
    this.items.forEach((it) => {
      if (it.x < cam.x - 40 || it.x > cam.x + cam.w + 40 || it.y < cam.y - 40 || it.y > cam.y + cam.h + 40) return;
      const bob = Math.sin(this.t * 3 + it.ph) * 3;
      if (it.kind === 'word') this.drawWordOrb(ctx, it, bob);
      else {
        ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(it.x, it.y + 9, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
        const glow = 0.35 + Math.sin(this.t * 4 + it.ph) * 0.15;
        const rar = G.partById[it.id].rarity;
        ctx.fillStyle = ['', 'rgba(255,255,255,', 'rgba(120,200,255,', 'rgba(200,120,255,', 'rgba(255,200,60,'][rar] + glow + ')';
        ctx.beginPath(); ctx.arc(it.x, it.y - 4 + bob, 14, 0, Math.PI * 2); ctx.fill();
        G.drawPart(ctx, G.partById[it.id], it.x, it.y - 4 + bob, 22);
      }
    });

    // mục tiêu nhiệm vụ: vòng sáng ở cửa
    const gt = this.guideTarget();
    if (gt) {
      const gx = (gt.b.dx + 0.5) * G.TS, gy = (gt.b.dy + (gt.b.doorTop ? -0.5 : 1.5)) * G.TS;
      const pr = 14 + Math.sin(this.t * 5) * 4;
      ctx.strokeStyle = 'rgba(255,214,0,.9)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(gx, gy, pr, pr * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
    }

    // nhân vật (sắp xếp theo y)
    const ents = this.npcs.filter((n) => n.x > cam.x - 40 && n.x < cam.x + cam.w + 40 && n.y > cam.y - 60 && n.y < cam.y + cam.h + 40)
      .map((n) => ({ y: n.y, d: () => { G.drawChar(ctx, n.x, n.y, n.dir, n.frame, n.look); } }));
    ents.push({ y: p.y, d: () => G.drawChar(ctx, p.x, p.y, p.dir, p.frame, G.PLAYER_LOOK) });
    ents.sort((a, b) => a.y - b.y).forEach((e) => e.d());

    // tên NPC / dấu hiệu tương tác
    if (this.target && this.target.kind === 'npc') {
      const n = this.target.n;
      ctx.font = 'bold 10px system-ui, sans-serif'; ctx.textAlign = 'center';
      const tw = ctx.measureText(n.name).width + 10;
      ctx.fillStyle = 'rgba(0,0,0,.6)'; G.rr(ctx, n.x - tw / 2, n.y - 56, tw, 14, 5); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText(n.name, n.x, n.y - 46);
      ctx.font = '14px system-ui'; ctx.fillText('💬', n.x + tw / 2 + 6, n.y - 44 + Math.sin(this.t * 6) * 2);
    }

    G.world.drawLocks(ctx, cam, this.level);

    // chữ bay
    ctx.textAlign = 'center';
    this.floaters.forEach((f) => {
      ctx.globalAlpha = Math.max(0, 1 - f.t / 1.4);
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;

    // ngày / đêm
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const nl = this.nightLevel();
    if (nl > 0.02) {
      const sx = (p.x - cam.x) * sc, sy = (p.y - 20 - cam.y) * sc;
      const g = ctx.createRadialGradient(sx, sy, 40 * sc, sx, sy, 220 * sc);
      g.addColorStop(0, `rgba(10,18,60,${nl * 0.25})`);
      g.addColorStop(1, `rgba(10,18,60,${nl})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height);
    }
    // mũi tên chỉ đường
    if (gt) this.drawGuideArrow(ctx, gt, cam, sc);
    this.drawMini();
  },

  drawWordOrb(ctx, it, bob) {
    const x = it.x, y = it.y - 6 + bob;
    const owned = !!this.state.words[it.w.en];
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(it.x, it.y + 9, 10, 3, 0, 0, Math.PI * 2); ctx.fill();
    const g = ctx.createRadialGradient(x, y, 2, x, y, 18);
    g.addColorStop(0, owned ? 'rgba(200,255,200,.95)' : 'rgba(255,255,255,.95)');
    g.addColorStop(0.5, owned ? 'rgba(76,175,80,.7)' : 'rgba(255,193,7,.75)');
    g.addColorStop(1, 'rgba(255,193,7,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = owned ? '#1b5e20' : '#5d4037';
    ctx.font = 'bold 12px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.fillText(it.w.en[0].toUpperCase(), x, y + 1);
    ctx.textBaseline = 'alphabetic';
    // tia lấp lánh
    const k = (this.t * 2 + it.ph) % 2;
    if (k < 0.5) { ctx.fillStyle = '#fff'; ctx.fillRect(x + 9, y - 12, 2, 6); ctx.fillRect(x + 7, y - 10, 6, 2); }
  },

  drawWaterShimmer(ctx, cam) {
    const S = G.TS;
    const x0 = Math.max(0, Math.floor(cam.x / S)), y0 = Math.max(0, Math.floor(cam.y / S));
    const x1 = Math.min(G.world.w - 1, Math.floor((cam.x + cam.w) / S)), y1 = Math.min(G.world.h - 1, Math.floor((cam.y + cam.h) / S));
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (G.world.get(x, y) !== G.T.WATER) continue;
      const h = G.hash2(x, y);
      const ph = (this.t * 0.8 + h * 6) % 3;
      if (ph < 0.6) ctx.fillRect(x * S + 6 + h * 14, y * S + 10 + ((h * 97) % 1) * 12, 8 * (1 - ph), 2);
    }
  },

  drawGuideArrow(ctx, gt, cam, sc) {
    const p = this.player;
    const tx = (gt.b.dx + 0.5) * G.TS, ty = (gt.b.dy + 0.5) * G.TS;
    const sx = (tx - cam.x) * sc, sy = (ty - cam.y) * sc;
    const W = this.vw * this.dpr, H = this.vh * this.dpr;
    const m = 70 * this.dpr, mt = 150 * this.dpr, mb = 120 * this.dpr;
    if (sx > m && sx < W - m && sy > mt && sy < H - mb) return; // đang trong màn hình
    const cx = W / 2, cy = (mt + H - mb) / 2;
    const ang = Math.atan2(sy - cy, sx - cx);
    const kx = (W / 2 - m) / Math.abs(Math.cos(ang) || 1e-6), ky = ((H - mt - mb) / 2) / Math.abs(Math.sin(ang) || 1e-6);
    const d = Math.min(kx, ky);
    const ax = cx + Math.cos(ang) * d, ay = cy + Math.sin(ang) * d;
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(ang);
    const s = this.dpr;
    ctx.fillStyle = 'rgba(255,214,0,.95)'; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.moveTo(18 * s, 0); ctx.lineTo(-10 * s, -13 * s); ctx.lineTo(-4 * s, 0); ctx.lineTo(-10 * s, 13 * s); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
    const dist = Math.round(Math.hypot(tx - p.x, ty - p.y) / G.TS);
    ctx.font = `bold ${11 * s}px system-ui, sans-serif`; ctx.textAlign = 'center';
    const lx = ax - Math.cos(ang) * 34 * s, ly = ay - Math.sin(ang) * 34 * s;
    const lbl = gt.label + ' · ' + dist + 'm';
    const tw = ctx.measureText(lbl).width + 10 * s;
    ctx.fillStyle = 'rgba(0,0,0,.6)'; G.rr(ctx, lx - tw / 2, ly - 9 * s, tw, 17 * s, 6 * s); ctx.fill();
    ctx.fillStyle = '#ffd600'; ctx.fillText(lbl, lx, ly + 4 * s);
  },

  drawMini() {
    const mc = document.getElementById('mini');
    if (!mc) return;
    const W = mc.width, H = mc.height;
    const x = mc.getContext('2d');
    const p = this.player;
    const z = 2 * (W / 120); // điểm ảnh mỗi ô
    const vw = W / z, vh = H / z;
    const ptx = p.x / G.TS, pty = p.y / G.TS;
    const sx = G.clamp(ptx - vw / 2, 0, Math.max(0, G.world.w - vw)), sy = G.clamp(pty - vh / 2, 0, Math.max(0, G.world.h - vh));
    x.imageSmoothingEnabled = false;
    x.fillStyle = '#2f8fd8'; x.fillRect(0, 0, W, H);
    x.drawImage(G.world.mini, sx, sy, vw, vh, 0, 0, W, H);
    // vùng khoá
    G.world.regions.forEach((r) => {
      if (r.level <= this.level) return;
      x.fillStyle = 'rgba(0,0,0,.5)';
      x.fillRect((r.gx * G.RW - sx) * z, (r.gy * G.RH - sy) * z, G.RW * z, G.RH * z);
    });
    const job = this.guideTarget();
    if (job) {
      x.fillStyle = (Math.floor(this.t * 3) % 2) ? '#ffd600' : '#ff1744';
      x.beginPath(); x.arc((job.b.dx - sx) * z, (job.b.dy - sy) * z, 4 * (W / 120), 0, Math.PI * 2); x.fill();
    }
    x.fillStyle = '#fff'; x.strokeStyle = '#000'; x.lineWidth = 1.5;
    x.beginPath(); x.arc((ptx - sx) * z, (pty - sy) * z, 3.5 * (W / 120), 0, Math.PI * 2); x.fill(); x.stroke();
  },

  loop(ts) {
    const self = G.game;
    const now = ts / 1000;
    const dt = Math.min(0.05, now - (self.last || now));
    self.last = now;
    if (self.running && !G.ui.isOpen()) self.update(dt);
    if (self.running) self.render();
    requestAnimationFrame(self.loop);
  },
};
