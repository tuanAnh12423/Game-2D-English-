// Vòng lặp game, trạng thái người chơi, kho đồ, trồng trọt, thời gian thực
const NPC_NAMES = ['Anh Nam', 'Chị Hương', 'Bác Ba', 'Cô Thu', 'Anh Khoa', 'Chị Vy', 'Ông Tâm', 'Bé Bin', 'Anh Long', 'Chị Ngọc', 'Chú Hải', 'Cô Linh', 'Mr. John', 'Ms. Emma', 'Mr. Kenji', 'Ms. Sarah'];
// thứ tự nhiệm vụ của bản cũ (để chuyển đổi file lưu)
const OLD_STORY = ['q_work', 'q_words5', 'q_parts3', 'q_job1', 'q_talk3', 'q_shop', 'q_craft', 'q_words30', 'q_lv5', 'q_parts15', 'q_jobs10', 'q_regions', 'q_words100', 'q_partsall'];
const WET_MS = 12 * 3600e3; // mỗi lần tưới giữ ẩm 12 giờ (tưới sáng là đủ tới tối)

G.game = {
  state: null, player: null, npcs: [], items: [], floaters: [], fx: [], flies: [], drops: [],
  cam: { x: 0, y: 0, w: 0, h: 0 }, scale: 2, dpr: 1, t: 0, dt: 0.016, running: false, target: null,
  pushDoor: 0, bumpCd: 0, spawnCd: 0, saveCd: 15, hudCd: 0, rainCd: 0, dustCd: 0, curRegion: null,
  weather: 'sunny', phone: { ring: false, at: 0, until: 0, cd: 0 },
  STACK: 99,

  // ---------- Trạng thái ----------
  newState() {
    const home = G.world.regions[0];
    return {
      v: 2, xpv: 2, x: home.spawnPx.x, y: home.spawnPx.y, xp: 0, coins: 50, days: 1, lastDate: G.clock.dateKey(), lastSeen: G.clock.now(),
      words: {}, inv: new Array(24).fill(null), bagSize: 24, chest: new Array(48).fill(null), sel: 0, seen: {},
      stats: { jobs: 0, talks: 0, crafts: 0, caught: 0, wrong: 0, reviews: 0, planted: 0, harvested: 0, calls: 0, spoke: 0 },
      storyDone: {}, entered: {}, visited: {}, board: [], boardDay: '', job: null, gifts: {}, boost: 0,
      farm: {}, cropsMet: {}, convos: {}, phrases: {}, reqs: {},
      settings: { tts: true, sfx: true, rate: 0.9, vi: true, night: 0.8, calls: true, vpref: 'f', voice: '', pitch: 1.05 },
      profile: { name: 'Minh', gender: 'm', skin: 0, hair: 0, shirt: 0 },
      work: { days: [1, 2, 3, 4, 5], start: 8, log: {} },
    };
  },
  // Đường cong cấp độ (bản 2, dốc hơn): tổng XP cần để đạt Level L.
  // Lv2 = 120 · Lv3 ≈ 395 · Lv4 ≈ 850 · Lv5 ≈ 1.510 · Lv6 ≈ 2.390 · Lv7 ≈ 3.500 · Lv10 ≈ 8.040
  xpForLevel(L) { return L <= 1 ? 0 : Math.round(60 * Math.pow(L - 1, 2.2) + 60 * (L - 1)); },
  levelFromXp(xp) { let L = 1; while (xp >= this.xpForLevel(L + 1)) L++; return L; },
  get level() { return this.levelFromXp(this.state.xp); },

  start(fresh) {
    const saved = fresh ? null : G.store.load();
    const base = this.newState();
    this.state = saved ? Object.assign(base, saved, {
      settings: Object.assign(base.settings, saved.settings || {}),
      stats: Object.assign(base.stats, saved.stats || {}),
    }) : base;
    G.state = this.state;
    // bản lưu cũ chưa có xpv thì phải đổi XP sang đường cong mới (newState đã gán sẵn xpv: 2)
    if (saved && saved.xpv !== 2) this.state.xpv = 0;
    this.migrate(this.state);
    const s = this.state;
    s.profile = Object.assign({ name: 'Minh', gender: 'm', skin: 0, hair: 0, shirt: 0 }, s.profile || {});
    G.work.cfg();
    G.tts.choose();
    s.wardrobe = Object.assign({ owned: [], wear: {} }, s.wardrobe || {});
    if (G.feat.has('farm')) this.farmStarter();
    this.player = { x: s.x, y: s.y, dir: 0, frame: 0, moving: false };
    if (this.blocked(s.x, s.y)) { this.player.x = G.world.regions[0].spawnPx.x; this.player.y = G.world.regions[0].spawnPx.y; }
    this.camInit = false;
    this.items = []; this.fx = []; this.flies = []; this.petals = [];
    this.makeNpcs();
    G.world.regions.forEach((r) => { if (r.level <= this.level) this.fillRegion(r, true); });
    this.weather = G.weather.now();
    this.dayTick(true);
    this.refreshBoard();
    this.curRegion = null;
    this.phone = { ring: false, at: Date.now() + (150 + Math.random() * 150) * 1000, until: 0, cd: 0 };
    this.running = true;
    this.updateHud(true);
    G.ui.renderHotbar();
    // vắng mặt bao lâu?
    const away = G.clock.now() - (s.lastSeen || G.clock.now());
    if (saved && away > 20 * 60000) setTimeout(() => G.ui.later(() => G.ui.welcomeBack(away)), 900);
    if (!saved) setTimeout(() => G.ui.createChar(() => G.ui.intro(), true), 300);
    // tính năng mới mở cho người chơi cũ (bản cập nhật) → báo & hướng dẫn
    if (!s.featSeen) { s.featSeen = {}; Object.keys(FEATURES).forEach((k) => { if (G.feat.has(k) && !this.NEW_FEATS.includes(k)) s.featSeen[k] = true; }); }
    const newF = Object.keys(FEATURES).filter((k) => G.feat.has(k) && !s.featSeen[k]);
    if (newF.length) { newF.forEach((k) => { s.featSeen[k] = true; }); setTimeout(() => G.ui.unlocked(newF), 1500); }
  },
  NEW_FEATS: ['events', 'ranch', 'cook', 'pets'],
  // bình tưới + hạt giống khi mở khoá trồng trọt
  farmStarter() {
    const s = this.state;
    if (this.slotsCount(s.inv, 'tool_can') || this.slotsCount(s.chest, 'tool_can')) return false;
    this.addItem('tool_can', 1, true); this.addItem('seed_radish', 4, true); this.addItem('seed_lettuce', 2, true);
    return true;
  },
  // chuyển file lưu bản cũ sang bản mới
  migrate(s) {
    if (s.xpv !== 2) {
      const oldFor = (L) => 40 * L * (L - 1);
      let L = 1; while ((s.xp || 0) >= oldFor(L + 1)) L++;
      const frac = ((s.xp || 0) - oldFor(L)) / (oldFor(L + 1) - oldFor(L));
      s.xp = Math.round(this.xpForLevel(L) + frac * (this.xpForLevel(L + 1) - this.xpForLevel(L)));
      s.xpv = 2;
    }
    // thú cưng chọn miễn phí ở bản cũ: vẫn được giữ
    s.pets = s.pets || { owned: {} };
    if (s.profile && s.profile.pet && !s.pets.owned[s.profile.pet]) s.pets.owned[s.profile.pet] = { name: '', love: 1 };
    // người chơi cũ đã dùng tính năng nào thì giữ mở tính năng đó
    s.featForce = s.featForce || {};
    if (Object.keys(s.farm || {}).length || (s.stats && s.stats.planted)) s.featForce.farm = true;
    if (s.stats && s.stats.drinks) s.featForce.tea = true;
    if (!Array.isArray(s.inv)) s.inv = [];
    if (!Array.isArray(s.chest)) s.chest = [];
    s.bagSize = G.clamp(s.bagSize || 24, 24, 48);
    while (s.inv.length < s.bagSize) s.inv.push(null);
    while (s.chest.length < 48) s.chest.push(null);
    if (s.parts || s.mods) {
      const old = Object.assign({}, s.parts || {}, s.mods || {});
      Object.keys(old).forEach((id) => { if (G.items[id] && old[id] > 0) { const left = this.slotsAdd(s.inv, id, old[id]); if (left) this.slotsAdd(s.chest, id, left); } });
      delete s.parts; delete s.mods;
    }
    if (typeof s.story === 'number') {
      this.slotsAdd(s.inv, 'seed_radish', 4); // quà cho người chơi từ bản cũ để thử trồng trọt
      for (let i = 0; i < s.story; i++) s.storyDone[OLD_STORY[i]] = true;
      delete s.story;
    }
    if (typeof s.boardDay !== 'string') s.boardDay = '';
    Object.keys(s.gifts || {}).forEach((k) => { if (typeof s.gifts[k] !== 'string') delete s.gifts[k]; });
    if (s.day && s.v !== 2) s.days = s.day;
    delete s.time; delete s.day;
    s.v = 2;
  },
  save() {
    const s = this.state;
    s.x = Math.round(this.player.x); s.y = Math.round(this.player.y);
    s.lastSeen = G.clock.now();
    G.store.save(s);
  },
  dayTick(silent) {
    const s = this.state, k = G.clock.dateKey();
    if (k === s.lastDate) return;
    s.lastDate = k; s.days = (s.days || 1) + 1;
    this.refreshBoard(true);
    if (!silent) G.ui.toast('☀️ Ngày mới bắt đầu! ' + G.clock.greet() + '! Đơn sửa chữa mới đã có ở Trung Tâm Bảo Hành.');
  },

  // ---------- Kinh nghiệm & tiền ----------
  addXp(n, x, y) {
    if (!n) return;
    const before = this.level;
    this.state.xp += n;
    if (x !== undefined) this.float('+' + n + ' XP', x, y, '#c3a6ff');
    const after = this.level;
    if (after > before) {
      G.audio.sfx('level');
      const opened = G.world.regions.filter((r) => r.level > before && r.level <= after);
      opened.forEach((r) => this.fillRegion(r, true));
      this.hearts(this.player.x, this.player.y - 20, 18);
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
  float(text, x, y, color, big) { this.floaters.push({ text, x, y, color, t: 0, big }); },

  // ---------- Kho đồ dạng ô ----------
  slotsAdd(arr, id, n) {
    let left = n;
    for (let i = 0; i < arr.length && left > 0; i++) {
      const sl = arr[i];
      if (sl && sl.id === id && sl.n < this.STACK) { const k = Math.min(left, this.STACK - sl.n); sl.n += k; left -= k; }
    }
    for (let i = 0; i < arr.length && left > 0; i++) {
      if (!arr[i]) { const k = Math.min(left, this.STACK); arr[i] = { id, n: k }; left -= k; }
    }
    return left;
  },
  slotsRemove(arr, id, n) {
    let left = n;
    for (let i = arr.length - 1; i >= 0 && left > 0; i--) {
      const sl = arr[i];
      if (sl && sl.id === id) { const k = Math.min(left, sl.n); sl.n -= k; left -= k; if (sl.n <= 0) arr[i] = null; }
    }
    return n - left;
  },
  slotsCount(arr, id) { return arr.reduce((a, sl) => a + (sl && sl.id === id ? sl.n : 0), 0); },
  addItem(id, n = 1, quiet) {
    const s = this.state, it = G.items[id];
    if (!it) return n;
    if (n < 0) { this.slotsRemove(s.inv, id, -n); G.ui.renderHotbar(); return 0; }
    let left = this.slotsAdd(s.inv, id, n);
    if (left > 0) {
      const l2 = this.slotsAdd(s.chest, id, left);
      if (!quiet) G.ui.toast(l2 ? '⚠️ Balo và Kho đều đầy! Mất ' + l2 + ' ' + it.vi : '🎒 Balo đầy — ' + left + ' ' + it.vi + ' được gửi về 📦 Kho ở nhà');
      left = l2;
    }
    if (it.kind === 'part') s.seen[id] = true;
    G.ui.renderHotbar();
    return left;
  },
  count(id) { return this.slotsCount(this.state.inv, id); },
  hasAll(need) { return Object.keys(need).every((id) => this.count(id) >= need[id]); },
  selItem() { const sl = this.state.inv[this.state.sel]; return sl ? G.items[sl.id] : null; },
  firstOfKind(kind) { const sl = this.state.inv.find((x) => x && G.items[x.id] && G.items[x.id].kind === kind); return sl ? sl.id : null; },
  bagUsed() { return this.state.inv.filter(Boolean).length; },
  ownedWords() { return Object.keys(this.state.words); },
  learnWord(en) { // thêm từ vào Từ điển (khi thu hoạch lần đầu...)
    if (!G.wordByEn[en] || this.state.words[en]) return false;
    this.state.words[en] = { m: 1, t: Date.now() };
    return true;
  },

  // ---------- Bảng đơn sửa chữa theo ngày thật ----------
  refreshBoard(force) {
    const s = this.state, key = G.clock.dateKey();
    if (!force && s.boardDay === key) return;
    const L = this.level;
    const ok = JOBS.filter((j) => j.level <= L);
    const rnd = G.mulberry(G.strHash(key) + L);
    s.board = G.shuffle(ok, rnd).slice(0, 4).map((j) => j.id);
    s.boardDay = key;
  },
  jobById(id) { return JOBS.find((j) => j.id === id); },
  acceptJob(id) {
    const L = this.level;
    const houses = G.world.buildings.filter((b) => b.t === 'house' && b.region.level <= L);
    const pool = houses.filter((b) => b.region !== this.curRegion);
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
    if (this.level >= 3 && Math.random() < 0.04) return G.pick(PARTS.filter((p) => p.rarity >= 3)).id;
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
    let guard = 0;
    while (cnt('word') < 9 && guard++ < 40) { this.spawnIn(r, 'word'); if (!all) break; }
    guard = 0;
    while (cnt('part') < 5 && guard++ < 40) { this.spawnIn(r, 'part'); if (!all) break; }
  },

  // ---------- Trồng trọt (thời gian thực) ----------
  plotKey(tx, ty) { return tx + ',' + ty; },
  growPlot(pl, now) {
    const end = Math.min(now, pl.w || 0);
    if (end > pl.u) pl.g += end - pl.u;
    pl.u = Math.max(pl.u, now);
  },
  plotInfo(pl, now = G.clock.now()) {
    const c = G.cropById[pl.c];
    this.growPlot(pl, now);
    const total = c.min * 60000;
    const ready = pl.g >= total;
    const stage = ready ? 3 : pl.g < total * 0.12 ? 0 : pl.g < total * 0.55 ? 1 : 2;
    return { c, total, ready, stage, wet: (pl.w || 0) > now, left: Math.max(0, total - pl.g), pct: Math.min(1, pl.g / total) };
  },
  farmTarget() {
    if (!G.feat.has('farm')) return null;
    const p = this.player, S = G.TS;
    let tx = Math.floor(p.x / S), ty = Math.floor((p.y - 4) / S);
    if (G.world.get(tx, ty) === G.T.FARM) return { tx, ty };
    tx = Math.floor((p.x + [0, -22, 22, 0][p.dir]) / S); ty = Math.floor((p.y - 4 + [22, 0, 0, -26][p.dir]) / S);
    if (G.world.get(tx, ty) === G.T.FARM) return { tx, ty };
    return null;
  },
  farmPlan(ft) {
    const s = this.state, pl = s.farm[this.plotKey(ft.tx, ft.ty)];
    const sel = this.selItem();
    if (!pl) {
      const seedId = sel && sel.kind === 'seed' ? sel.id : this.firstOfKind('seed');
      if (!seedId) return { label: '🌱<small>Hạt?</small>', act: 'noseed' };
      return { label: '🌱<small>Gieo</small>', act: 'plant', seedId };
    }
    const info = this.plotInfo(pl);
    if (info.ready) return { label: '🧺<small>Thu</small>', act: 'harvest', info };
    if (sel && sel.kind === 'fert') return { label: '🧪<small>Bón</small>', act: 'fert', info };
    if (!info.wet) return { label: '💧<small>Tưới</small>', act: 'water', info };
    return { label: '⏳<small>' + G.clock.fmtDur(info.left).replace(' phút', 'p').replace(' giờ', 'h') + '</small>', act: 'info', info };
  },
  farmAct(ft, plan) {
    const s = this.state, key = this.plotKey(ft.tx, ft.ty), now = G.clock.now();
    const cx = (ft.tx + 0.5) * G.TS, cy = (ft.ty + 0.5) * G.TS;
    const say = (k, crop) => {
      const f = FARM_SAY[k];
      const line = f.say.replace('{crop}', crop.en).replace('{crops}', crop.plural);
      this.float(f.en + ' = ' + f.vi, cx, cy - 30, '#fff59d', true);
      G.tts.speak(line);
    };
    switch (plan.act) {
      case 'noseed':
        G.ui.toast('🌱 Bạn chưa có hạt giống. Mua ở 🌱 Tiệm Nông Sản (Làng Ven Sông).');
        break;
      case 'plant': {
        const crop = G.cropById[G.items[plan.seedId].crop];
        this.addItem(plan.seedId, -1);
        s.farm[key] = { c: crop.id, p: now, u: now, g: 0, w: 0 };
        s.stats.planted++;
        G.audio.sfx('plant');
        this.burst(cx, cy + 6, '#8d6e63', 10);
        say('plant', crop);
        G.ui.toast('🌱 Đã gieo ' + crop.vi + ' (' + crop.en + '). Nhớ 💧 tưới nước để cây lớn!');
        break;
      }
      case 'water': {
        if (!this.count('tool_can')) { G.ui.toast('💧 Cần có Bình tưới trong balo (lấy ở 📦 Kho nhà hoặc mua ở Tiệm Nông Sản).'); break; }
        const pl = s.farm[key];
        this.growPlot(pl, now);
        pl.w = now + WET_MS;
        G.audio.sfx('water');
        for (let i = 0; i < 12; i++) this.fx.push({ x: cx + (Math.random() - 0.5) * 20, y: cy - 12, vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 30, g: 160, life: 0.7, max: 0.7, c: '#4fc3f7', r: 2 });
        say('water', plan.info.c);
        break;
      }
      case 'fert': {
        const pl = s.farm[key];
        this.growPlot(pl, now);
        pl.g += plan.info.total * 0.25;
        this.addItem('fert', -1);
        G.audio.sfx('plant');
        this.burst(cx, cy, '#c5e1a5', 14);
        say('fert', plan.info.c);
        break;
      }
      case 'harvest': {
        const crop = plan.info.c;
        const n = 1 + (Math.random() < 0.35 ? 1 : 0);
        delete s.farm[key];
        this.addItem('crop_' + crop.id, n);
        s.stats.harvested += n;
        G.audio.sfx('harvest');
        this.burst(cx, cy, crop.color, 16); this.burst(cx, cy, '#66bb6a', 10);
        say('harvest', crop);
        this.float('+' + n + ' ' + crop.en, cx, cy - 46, '#fff');
        this.addXp(crop.xp, cx, cy - 60);
        if (!s.cropsMet[crop.id]) {
          s.cropsMet[crop.id] = true;
          if (this.learnWord(crop.en)) G.ui.toast('📖 Từ mới vào Từ điển: ' + crop.en + ' = ' + crop.vi);
        }
        break;
      }
      case 'info': {
        const i = plan.info;
        G.ui.toast(i.c.vi + ' (' + i.c.en + '): ' + Math.round(i.pct * 100) + '% · còn ' + G.clock.fmtDur(i.left) + ' · đất còn ẩm ' + G.clock.fmtDur(s.farm[key].w - now));
        break;
      }
    }
    this.checkStory();
  },
  rainWater() {
    const now = G.clock.now();
    Object.values(this.state.farm).forEach((pl) => { this.growPlot(pl, now); pl.w = Math.max(pl.w || 0, now + 2 * 3600e3); });
  },

  // ---------- Hiệu ứng ----------
  burst(x, y, c, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 30 + Math.random() * 70;
      this.fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: 140, life: 0.6 + Math.random() * 0.4, max: 1, c, r: 1.5 + Math.random() * 2 });
    }
  },
  sparkle(x, y) {
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      this.fx.push({ x, y, vx: Math.cos(a) * 80, vy: Math.sin(a) * 80, g: 0, life: 0.5, max: 0.5, c: i % 2 ? '#fff59d' : '#ffffff', r: 2, star: true });
    }
    this.hearts(x, y, 5);
  },
  hearts(x, y, n) {
    const cols = ['#ff8fab', '#ff6f9f', '#c3a6ff', '#ffc4d9'];
    for (let i = 0; i < n; i++) {
      this.fx.push({ x: x + (Math.random() - 0.5) * 24, y, vx: (Math.random() - 0.5) * 50, vy: -40 - Math.random() * 50, g: -10, life: 0.9 + Math.random() * 0.6, max: 1.5, c: cols[i % 4], r: 2.5 + Math.random() * 2, heart: true });
    }
  },
  drawPetals(ctx, cv) {
    const W = cv.width, H = cv.height, d = this.dpr;
    const want = this.nightRaw() > 0.5 ? 8 : 18;
    while (this.petals.length < want) this.petals.push({ x: Math.random() * W, y: Math.random() * H, v: (18 + Math.random() * 22) * d, s: (3 + Math.random() * 3) * d, ph: Math.random() * 6, c: G.pick(['#ffc4d9', '#ffb3d1', '#ffe3ee', '#fff']) });
    if (this.petals.length > want) this.petals.length = want;
    this.petals.forEach((q) => {
      q.ph += this.dt; q.y += q.v * this.dt; q.x += Math.sin(q.ph * 1.3) * 18 * d * this.dt - 6 * d * this.dt;
      if (q.y > H + 10) { q.y = -10; q.x = Math.random() * W * 1.1; }
      if (q.x < -10) q.x = W + 10;
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(Math.sin(q.ph * 2) * 0.9);
      ctx.globalAlpha = 0.85; ctx.fillStyle = q.c;
      ctx.beginPath(); ctx.ellipse(0, 0, q.s, q.s * 0.55, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
    ctx.globalAlpha = 1;
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
    // di chuyển
    const ax = G.input.axis();
    const speed = 150 * (s.boost > Date.now() ? 1.45 : 1);
    const mag = Math.hypot(ax.x, ax.y);
    p.moving = mag > 0.1;
    let pushingDoor = false;
    if (p.moving) {
      if (Math.abs(ax.x) > Math.abs(ax.y)) p.dir = ax.x > 0 ? 2 : 1; else p.dir = ax.y > 0 ? 0 : 3;
      const nx = p.x + ax.x * speed * dt, ny = p.y + ax.y * speed * dt;
      let hit = false;
      if (!this.blocked(nx, p.y)) p.x = nx; else hit = true;
      if (!this.blocked(p.x, ny)) p.y = ny; else hit = true;
      p.frame += dt * 12 * Math.min(1, mag + 0.3);
      this.dustCd -= dt;
      if (this.dustCd <= 0) { this.dustCd = 0.14; this.fx.push({ x: p.x + (Math.random() - 0.5) * 8, y: p.y, vx: -ax.x * 15, vy: -8, g: 0, life: 0.45, max: 0.45, c: 'rgba(210,200,180,.7)', r: 2.5, grow: true }); }
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
      if (!s.visited[r.id]) { s.visited[r.id] = true; G.ui.banner(r.name, r.en, true); this.addXp(10); }
      else G.ui.banner(r.name, r.en, false);
      this.fillRegion(r, true);
      this.updateHud(true);
    }

    // nhặt vật phẩm
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (Math.abs(it.x - p.x) < 22 && Math.abs(it.y - (p.y - 8)) < 24) {
        this.items.splice(i, 1);
        this.sparkle(it.x, it.y - 6);
        this.collect(it);
        return;
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
      if (Math.hypot(n.x - p.x, n.y - p.y) < 50) {
        n.dir = Math.abs(p.x - n.x) > Math.abs(p.y - n.y) ? (p.x > n.x ? 2 : 1) : (p.y > n.y ? 0 : 3);
        n.frame = 0; return;
      }
      if (n.vx || n.vy) {
        const nx = n.x + n.vx * 50 * dt, ny = n.y + n.vy * 50 * dt;
        if (G.world.regionOfPx(nx, ny) === n.r && !this.blocked(nx, ny)) { n.x = nx; n.y = ny; n.frame += dt * 10; }
        else { n.vx = -n.vx; n.vy = -n.vy; n.dir = [3, 2, 1, 0][n.dir] ?? 0; }
      } else n.frame = 0;
    });

    // mục tiêu tương tác: NPC > cửa > ô ruộng
    this.target = null;
    let best = 56;
    this.npcs.forEach((n) => { const d = Math.hypot(n.x - p.x, n.y - p.y); if (d < best) { best = d; this.target = { kind: 'npc', n }; } });
    const ptx = Math.floor(p.x / G.TS), pty = Math.floor((p.y - 4) / G.TS);
    for (let yy = pty - 1; yy <= pty + 1; yy++) for (let xx = ptx - 1; xx <= ptx + 1; xx++) {
      if (G.world.get(xx, yy) !== G.T.DOOR) continue;
      const d = Math.hypot((xx + 0.5) * G.TS - p.x, (yy + 0.5) * G.TS - p.y);
      if (d < 50 && d < best + 10) { best = d; this.target = { kind: 'door', b: G.world.buildingAt(xx, yy) }; }
    }
    if (G.online.isOn()) {
      const np = G.online.nearPeer();
      if (np && Math.hypot(np.x - p.x, np.y - p.y) < best) this.target = { kind: 'peer', peer: np };
    }
    if (!this.target) {
      const ft = this.farmTarget();
      if (ft) this.target = { kind: 'farm', ft, plan: this.farmPlan(ft) };
    }
    const btn = document.getElementById('btnA');
    const label = !this.target ? '✋<small>—</small>' : this.target.kind === 'door' ? '🚪<small>Vào</small>' : this.target.kind === 'npc' ? '💬<small>Nói</small>' : this.target.kind === 'peer' ? '💞<small>Chat</small>' : this.target.plan.label;
    if (btn.dataset.l !== label) { btn.innerHTML = label; btn.dataset.l = label; btn.classList.toggle('dim', !this.target); }

    this.pushDoor = pushingDoor ? this.pushDoor + dt : 0;
    if (G.input.takeAction() || this.pushDoor > 0.3) {
      this.pushDoor = 0;
      if (this.target) {
        if (this.target.kind === 'farm') this.farmAct(this.target.ft, this.target.plan);
        else { G.input.reset(); this.interact(this.target); return; }
      }
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
    // mưa tự tưới ruộng
    this.rainCd -= dt;
    if (this.rainCd <= 0) { this.rainCd = 10; if (this.weather === 'rain') this.rainWater(); }

    this.updateFx(dt);
    G.online.update(dt);
    this.phoneTick();

    this.saveCd -= dt;
    if (this.saveCd <= 0) { this.saveCd = 15; this.save(); }
    this.hudCd -= dt;
    if (this.hudCd <= 0) {
      this.hudCd = 0.5;
      const w = G.weather.now();
      if (w !== this.weather) {
        this.weather = w;
        if (w === 'rain') G.ui.toast('🌧️ It’s raining! — Trời mưa rồi! Ruộng được tưới tự động.');
        else if (w === 'cloudy') G.ui.toast('☁️ It’s cloudy. — Trời nhiều mây.');
        else G.ui.toast('☀️ The sun is out! — Trời nắng đẹp.');
      }
      this.dayTick();
      G.events.tick();
      this.updateHud(); this.checkStory();
    }
  },

  updateFx(dt) {
    this.fx.forEach((f) => { f.life -= dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vy += (f.g || 0) * dt; if (f.grow) f.r += dt * 6; });
    this.fx = this.fx.filter((f) => f.life > 0);
    this.floaters.forEach((f) => { f.t += dt; f.y -= 30 * dt; });
    this.floaters = this.floaters.filter((f) => f.t < 1.6);
    // bướm bay quanh người chơi (ban ngày, không mưa, vùng cỏ)
    if (!this.player) return;
    const day = this.nightRaw() < 0.15 && this.weather !== 'rain';
    const g = this.curRegion && (this.curRegion.ground === 'grass' || this.curRegion.ground === 'forest');
    if (day && g && this.flies.length < 4 && Math.random() < dt * 0.5) {
      const a = Math.random() * Math.PI * 2;
      this.flies.push({ x: this.player.x + Math.cos(a) * 250, y: this.player.y + Math.sin(a) * 180, ph: Math.random() * 6, c: G.pick(['#ffeb3b', '#ff80ab', '#80d8ff', '#fff']), life: 20 });
    }
    this.flies.forEach((b) => { b.ph += dt; b.life -= dt; b.x += Math.cos(b.ph * 0.7) * 25 * dt; b.y += Math.sin(b.ph * 1.3) * 18 * dt; });
    this.flies = this.flies.filter((b) => b.life > 0 && day && Math.hypot(b.x - this.player.x, b.y - this.player.y) < 600);
  },

  // ---------- Cuộc gọi khách hàng (thời gian thực) ----------
  phoneTick() {
    const s = this.state, ph = this.phone, now = Date.now(), btn = document.getElementById('phone');
    if (!s.settings.calls || !G.feat.has('phone')) { btn.classList.remove('on'); return; }
    if (!ph.ring) {
      if (now >= ph.at && !G.ui.isOpen()) {
        if (G.work.status().type === 'ready') { ph.at = now + 300000; return; }
        ph.ring = true; ph.until = now + 45000; ph.cd = 0;
        ph.kind = G.work.onShift() ? 'service' : 'afterhours';
        if (ph.kind === 'afterhours' && !G.feat.has('afterhours')) { ph.at = now + 300000; return; }
        btn.classList.add('on');
        G.ui.toast(ph.kind === 'service' ? '📞 Có khách hàng gọi đến! Bấm nút điện thoại để nghe máy.' : '📞 Khách gọi NGOÀI GIỜ LÀM! Nghe máy và từ chối khéo nhé.');
      }
      return;
    }
    if (now > ph.until) {
      ph.ring = false; btn.classList.remove('on');
      ph.at = now + (300 + Math.random() * 300) * 1000;
      G.ui.toast('📵 Cuộc gọi nhỡ. Khách sẽ gọi lại sau.');
      return;
    }
    if (now > ph.cd && !G.ui.isOpen()) { ph.cd = now + 2600; G.audio.sfx('ring'); }
  },
  answerPhone() {
    const ph = this.phone;
    if (!ph.ring) return;
    ph.ring = false; document.getElementById('phone').classList.remove('on');
    ph.at = Date.now() + (ph.kind === 'service' ? 360 + Math.random() * 360 : 600 + Math.random() * 600) * 1000;
    const offDay = !G.work.isWorkDay();
    const list = CONVOS.filter((c) => c.theme === (ph.kind || 'service') && (!c.when || c.when === (offDay ? 'off' : 'evening')));
    const fresh = list.filter((c) => (this.state.convos[c.id] || 0) < 3);
    const c = G.pick(fresh.length ? fresh : list);
    G.ui.convo(c, { phone: true });
    this.checkStory();
  },

  collect(it) {
    if (it.kind === 'word') {
      const isNew = !this.state.words[it.w.en];
      G.ui.quizWord(it.w, (ok) => {
        if (ok) { this.addXp(isNew ? 10 : 3, this.player.x, this.player.y - 40); this.addCoins(isNew ? 2 : 1, this.player.x, this.player.y - 40); }
        this.checkStory();
      });
    } else {
      G.audio.sfx('pick');
      const first = !this.state.seen[it.id];
      this.addItem(it.id, 1);
      const p = G.partById[it.id];
      this.float('+1 ' + p.vi, this.player.x, this.player.y - 44, '#fff');
      this.addXp(first ? 12 : 2);
      if (first) G.ui.partCard(it.id, true);
      else G.ui.toast('🔩 +1 ' + p.vi + ' (' + p.en + ') · đang có ' + this.count(it.id));
      this.checkStory();
    }
  },

  interact(tg) {
    if (tg.kind === 'npc') {
      if (!G.feat.has('talk')) { G.tts.speak('Hello! Nice to meet you!'); G.ui.toast('👋 “Hello!” — ' + G.feat.lockedMsg('talk')); return; }
      G.ui.chatNpc(tg.n); return;
    }
    if (tg.kind === 'peer') { G.online.panel(); return; }
    const b = tg.b;
    if (!b) return;
    G.audio.sfx('door');
    this.state.entered[b.t] = true;
    G.ui.building(b);
    this.checkStory();
  },

  // độ tối theo GIỜ THỰC (0 = ngày, 0.75 = đêm)
  nightRaw() {
    const h = G.clock.minutes() / 60;
    if (h < 5) return 0.75;
    if (h < 6.5) return 0.75 * (6.5 - h) / 1.5;
    if (h < 17.5) return 0;
    if (h < 19) return 0.75 * (h - 17.5) / 1.5;
    return 0.75;
  },
  nightLevel() { return this.nightRaw() * (this.state.settings.night ?? 0.8); },

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
      case 'plant': return { cur: s.stats.planted, max: q.n };
      case 'harvest': return { cur: s.stats.harvested, max: q.n };
      case 'calls': return { cur: s.stats.calls, max: q.n };
      case 'convo3': return { cur: Object.values(s.convos).filter((v) => v >= 3).length, max: q.n };
      case 'hvac': return { cur: G.hvac.passedCount(), max: q.n };
      case 'drinks': return { cur: s.stats.drinks || 0, max: q.n };
      case 'decline': return { cur: s.stats.declined || 0, max: q.n };
      case 'mall': return { cur: s.stats.clothes || 0, max: q.n };
      case 'animals': return { cur: s.stats.animals || 0, max: q.n };
      case 'collect': return { cur: s.stats.collected || 0, max: q.n };
      case 'cook': return { cur: s.stats.cooked || 0, max: q.n };
      case 'pets': return { cur: Object.keys((s.pets && s.pets.owned) || {}).length, max: q.n };
    }
    return { cur: 0, max: 1 };
  },
  curQuest() { return STORY.find((q) => !this.state.storyDone[q.id]); },
  checkStory() {
    const s = this.state;
    const q = this.curQuest();
    if (!q) return;
    const pr = this.storyProgress(q);
    if (pr.cur >= pr.max) {
      s.storyDone[q.id] = true;
      G.audio.sfx('good');
      G.ui.toast('🏆 Hoàn thành nhiệm vụ: ' + q.title + '  (+' + q.coins + ' 🪙' + (q.xp ? ', +' + q.xp + ' XP' : '') + ')', 'gold');
      this.addCoins(q.coins);
      this.addXp(q.xp);
      const nx = this.curQuest();
      if (nx) setTimeout(() => G.ui.toast('📜 Nhiệm vụ mới: ' + nx.title), 2200);
      if (q.unlock && q.unlock.length) {
        if (q.unlock.includes('farm')) this.farmStarter();
        q.unlock.forEach((k) => { s.featSeen[k] = true; });
        G.ui.unlocked(q.unlock);
        G.ui.renderHotbar();
      }
      this.save();
    }
    this.updateHud(true);
  },
  // mục tiêu cần chỉ đường → {x, y (ô), label}
  guideTarget() {
    const job = this.jobBuilding();
    if (job) return { x: job.dx, y: job.dy + 1, label: 'Khách hàng' };
    const evt = G.events.guideTarget();
    if (evt) return evt;
    const q = this.curQuest();
    if (!q) return null;
    let type = null;
    if (q.type === 'enter') type = q.target;
    else if (q.type === 'jobs') type = 'service';
    else if (q.type === 'craft') type = 'shop';
    else if (q.type === 'hvac') type = 'hvac';
    else if (q.type === 'drinks') type = 'koi';
    else if (q.type === 'mall') type = 'mall';
    else if (q.type === 'animals' || q.type === 'collect') type = 'ranch';
    else if (q.type === 'cook') type = 'home';
    else if (q.type === 'pets') type = 'petshop';
    else if (q.type === 'plant' || q.type === 'harvest') {
      if (q.type === 'plant' && !this.firstOfKind('seed')) type = 'farmshop';
      else {
        const f = G.world.farmTiles[0];
        return f ? { x: f.x + 2, y: f.y + 2, label: 'Ruộng' } : null;
      }
    }
    if (!type) return null;
    const L = this.level, p = this.player;
    let best = null, bd = 1e9;
    G.world.buildings.forEach((b) => {
      if (b.t !== type || b.region.level > L) return;
      const d = Math.hypot(b.dx * G.TS - p.x, b.dy * G.TS - p.y);
      if (d < bd) { bd = d; best = b; }
    });
    return best ? { x: best.dx, y: best.dy + 1, label: best.name } : null;
  },

  // ---------- HUD ----------
  updateHud() {
    const s = this.state;
    if (!s) return;
    const L = this.level, a = this.xpForLevel(L), b = this.xpForLevel(L + 1);
    const set = (id, v) => { const e = document.getElementById(id); if (e && e.textContent !== String(v)) e.textContent = v; };
    set('hLvl', L);
    set('hCoins', s.coins);
    set('hClock', G.weather.icon(this.weather, this.nightRaw() > 0.3) + ' ' + G.clock.label());
    document.getElementById('hXp').style.width = Math.min(100, ((s.xp - a) / (b - a)) * 100) + '%';
    set('hRegion', (this.curRegion ? this.curRegion.name : '') + (G.feat.has('work') ? ' · ' + G.work.label() : ''));
    const q = this.curQuest();
    let txt = '';
    if (s.job) { const j = this.jobById(s.job.id), bb = this.jobBuilding(); txt = '🔧 ' + j.vi + ': ' + j.sv + (bb ? ' → ' + bb.name : ''); }
    else if (q) { const pr = this.storyProgress(q); txt = '📜 ' + q.title + ' (' + Math.min(pr.cur, pr.max) + '/' + pr.max + ')'; }
    else txt = '🌟 Bạn đã hoàn thành cốt truyện! Tiếp tục khám phá nhé.';
    set('hQuest', txt);
    G.events.hud();
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
    G.world.setRes(G.clamp(Math.ceil(this.scale * this.dpr), 1, 3));
    this.lc = this.lc || document.createElement('canvas');
    this.lc.width = Math.ceil(cv.width / 2); this.lc.height = Math.ceil(cv.height / 2);
    this.lcx = this.lc.getContext('2d');
  },

  render() {
    const cv = document.getElementById('game');
    const ctx = cv.getContext('2d');
    const p = this.player, sc = this.scale * this.dpr, S = G.TS;
    const cam = this.cam;
    cam.w = this.vw / this.scale; cam.h = this.vh / this.scale;
    const ww = G.world.w * S, wh = G.world.h * S;
    const tx = G.clamp(p.x - cam.w / 2, 0, Math.max(0, ww - cam.w));
    const ty = G.clamp(p.y - 16 - cam.h / 2, 0, Math.max(0, wh - cam.h));
    // camera bám theo mượt
    if (!this.camInit || Math.hypot(tx - this.cx, ty - this.cy) > 300) { this.cx = tx; this.cy = ty; this.camInit = true; }
    const k = Math.min(1, this.dt * 9);
    this.cx += (tx - this.cx) * k; this.cy += (ty - this.cy) * k;
    cam.x = Math.round(this.cx * sc) / sc; cam.y = Math.round(this.cy * sc) / sc;
    const nl = this.nightLevel() + (this.weather === 'rain' ? 0.12 : this.weather === 'cloudy' ? 0.04 : 0);
    const night = this.nightRaw() > 0.3;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#8fd5f5'; ctx.fillRect(0, 0, cv.width, cv.height);
    G.world.drawGround(ctx, cam, sc);
    ctx.setTransform(sc, 0, 0, sc, -cam.x * sc, -cam.y * sc);
    ctx.imageSmoothingEnabled = true;
    this.drawWaterShimmer(ctx, cam);
    this.drawFarm(ctx, cam);
    G.world.drawBuildings(ctx, cam, this.t, night);

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

    // vòng sáng ở mục tiêu nhiệm vụ
    const gt = this.guideTarget();
    if (gt) {
      const gx = (gt.x + 0.5) * S, gy = (gt.y + 0.5) * S;
      const pr = 14 + Math.sin(this.t * 5) * 4;
      ctx.strokeStyle = 'rgba(255,111,159,.9)'; ctx.lineWidth = 3; ctx.setLineDash([6, 4]); ctx.lineDashOffset = -this.t * 12;
      ctx.beginPath(); ctx.ellipse(gx, gy, pr, pr * 0.5, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      G.heart(ctx, gx, gy - 26 + Math.sin(this.t * 4) * 3, 5, '#ff6f9f');
    }

    // nhân vật + đèn đường (sắp xếp theo chiều sâu)
    const vis = (x, y) => x > cam.x - 40 && x < cam.x + cam.w + 40 && y > cam.y - 20 && y < cam.y + cam.h + 60;
    const ents = this.npcs.filter((n) => vis(n.x, n.y)).map((n) => ({ y: n.y, d: () => G.drawChar(ctx, n.x, n.y, n.dir, n.frame, n.look) }));
    const look = G.playerLook();
    ents.push({ y: p.y, d: () => G.drawChar(ctx, p.x, p.y, p.dir, p.frame, look) });
    const pk = this.state.profile.pet;
    if (pk && G.PETS[pk]) {
      const pt = G.petFollow(this, p.x, p.y, p.dir, this.dt);
      ents.push({ y: pt.y, d: () => {
        G.drawPet(ctx, pt.x, pt.y, pk, pt.dir, this.t, pt.mv);
        if (!pt.mv && !p.moving && (this.t % 4) < 1.2) G.heart(ctx, pt.x + 6, pt.y - 22 - (this.t % 4) * 6, 3, '#ff8fab');
      } });
    }
    G.world.lamps.forEach((l) => {
      const lx = (l.x + 0.5) * S, ly = (l.y + 1) * S - 4;
      if (vis(lx, ly)) ents.push({ y: ly, d: () => G.drawLamp(ctx, lx, ly, nl > 0.12, this.t) });
    });
    G.ranch.draw(ctx, cam, ents, this.t, this.dt);
    G.online.draw(ctx, cam, ents);
    ents.sort((a, b) => a.y - b.y).forEach((e) => e.d());
    if (G.online.isOn()) G.online.drawTag(ctx, p.x, p.y, '⭐ ' + this.state.profile.name, '#8e6cd9');
    if (this.playerBubble && this.playerBubble.until > Date.now()) G.online.drawBubble(ctx, p.x, p.y - 62, this.playerBubble);

    // bướm
    this.flies.forEach((b) => {
      const f = Math.abs(Math.sin(b.ph * 14)) * 4 + 1;
      ctx.fillStyle = b.c;
      ctx.beginPath(); ctx.ellipse(b.x - f / 2, b.y - 20, f, 3, 0, 0, Math.PI * 2); ctx.ellipse(b.x + f / 2, b.y - 20, f, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#333'; ctx.fillRect(b.x - 0.5, b.y - 22, 1, 4);
    });
    // hạt hiệu ứng
    this.fx.forEach((f) => {
      ctx.globalAlpha = Math.max(0, f.life / f.max);
      ctx.fillStyle = f.c;
      if (f.heart) G.heart(ctx, f.x, f.y, f.r, f.c);
      else if (f.star) { ctx.fillRect(f.x - f.r, f.y - 0.6, f.r * 2, 1.2); ctx.fillRect(f.x - 0.6, f.y - f.r, 1.2, f.r * 2); }
      else { ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill(); }
    });
    ctx.globalAlpha = 1;

    // tên NPC
    if (this.target && this.target.kind === 'npc') {
      const n = this.target.n;
      ctx.font = '800 10px "Nunito", system-ui, sans-serif'; ctx.textAlign = 'center';
      const tw = ctx.measureText(n.name).width + 12;
      ctx.fillStyle = 'rgba(255,250,252,.95)'; G.rr(ctx, n.x - tw / 2, n.y - 58, tw, 14, 7); ctx.fill();
      ctx.strokeStyle = '#ffb3d1'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#6b3d5a'; ctx.fillText(n.name, n.x, n.y - 47.5);
      ctx.font = '14px system-ui'; ctx.fillText('💬', n.x + tw / 2 + 6, n.y - 46 + Math.sin(this.t * 6) * 2);
    }

    // bóng mây trôi
    const ca = this.weather === 'cloudy' ? 0.12 : this.weather === 'rain' ? 0.1 : 0.05;
    ctx.fillStyle = `rgba(120,80,150,${ca * 0.8})`;
    for (let i = 0; i < 6; i++) {
      const span = ww + 800;
      const x = ((G.hash2(i, 3) * span + this.t * (10 + i * 2)) % span) - 400;
      const y = G.hash2(i, 9) * wh;
      if (x < cam.x - 300 || x > cam.x + cam.w + 300 || y < cam.y - 200 || y > cam.y + cam.h + 200) continue;
      ctx.beginPath(); ctx.ellipse(x, y, 140, 60, 0, 0, Math.PI * 2); ctx.ellipse(x + 90, y + 20, 100, 50, 0, 0, Math.PI * 2); ctx.ellipse(x - 80, y + 25, 90, 45, 0, 0, Math.PI * 2); ctx.fill();
    }

    G.world.drawLocks(ctx, cam, this.level);

    // chữ bay
    ctx.textAlign = 'center';
    this.floaters.forEach((f) => {
      ctx.globalAlpha = Math.max(0, 1 - f.t / 1.6);
      ctx.font = '900 ' + (f.big ? 14 : 13) + 'px "Nunito", system-ui, sans-serif';
      ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(120,50,100,.75)'; ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;

    // ----- lớp màn hình -----
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.weather === 'rain') this.drawRain(ctx, cv);
    else this.drawPetals(ctx, cv);
    if (nl > 0.02) this.drawLighting(ctx, cam, sc, nl);
    if (gt) this.drawGuideArrow(ctx, gt, cam, sc);
    this.drawMini();
  },

  drawFarm(ctx, cam) {
    const S = G.TS, now = G.clock.now(), s = this.state;
    const ft = this.target && this.target.kind === 'farm' ? this.target.ft : null;
    G.world.farmTiles.forEach((f) => {
      const X = f.x * S, Y = f.y * S;
      if (X > cam.x + cam.w + S || Y > cam.y + cam.h + S || X + S < cam.x - S || Y + S < cam.y - S) return;
      const pl = s.farm[f.x + ',' + f.y];
      if (pl) {
        const info = this.plotInfo(pl, now);
        if (info.wet) { ctx.fillStyle = 'rgba(40,20,5,.35)'; ctx.fillRect(X + 2, Y + 2, S - 4, S - 4); }
        G.drawPlant(ctx, info.c, info.stage, X + S / 2, Y + S / 2, this.t);
        if (info.ready) {
          const k = (this.t * 2 + f.x) % 2;
          if (k < 0.6) { ctx.fillStyle = '#fff'; ctx.fillRect(X + 24, Y + 2, 2, 7); ctx.fillRect(X + 21.5, Y + 4.5, 7, 2); }
        } else if (!info.wet) {
          const by = Y - 2 + Math.sin(this.t * 4 + f.x) * 2;
          ctx.fillStyle = 'rgba(41,182,246,.9)'; ctx.beginPath(); ctx.moveTo(X + 25, by); ctx.quadraticCurveTo(X + 29, by + 6, X + 25, by + 8); ctx.quadraticCurveTo(X + 21, by + 6, X + 25, by); ctx.fill();
        }
      }
      if (ft && ft.tx === f.x && ft.ty === f.y) {
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.lineDashOffset = -this.t * 10;
        G.rr(ctx, X + 2, Y + 2, S - 4, S - 4, 5); ctx.stroke(); ctx.setLineDash([]);
      }
    });
    // bù nhìn ở góc ruộng đầu tiên mỗi vùng
    const seen = {};
    G.world.farmTiles.forEach((f) => {
      const r = G.world.regionOfTile(f.x, f.y);
      if (seen[r.id]) return; seen[r.id] = true;
      const X = f.x * S - 10, Y = f.y * S + 6;
      if (X < cam.x - 40 || X > cam.x + cam.w + 40 || Y < cam.y - 60 || Y > cam.y + cam.h + 40) return;
      ctx.fillStyle = '#6d4c41'; ctx.fillRect(X - 1.5, Y - 30, 3, 32); ctx.fillRect(X - 12, Y - 22, 24, 3);
      ctx.fillStyle = '#e53935'; G.rr(ctx, X - 7, Y - 24, 14, 13, 3); ctx.fill();
      ctx.fillStyle = '#ffe0b2'; ctx.beginPath(); ctx.arc(X, Y - 30, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fbc02d'; ctx.beginPath(); ctx.ellipse(X, Y - 35, 10, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(X - 5, Y - 42, 10, 7);
      ctx.fillStyle = '#333'; ctx.fillRect(X - 3, Y - 31, 1.5, 1.5); ctx.fillRect(X + 1.5, Y - 31, 1.5, 1.5);
    });
  },

  drawRain(ctx, cv) {
    const W = cv.width, H = cv.height, d = this.dpr;
    while (this.drops.length < 110) this.drops.push({ x: Math.random() * W, y: Math.random() * H, l: (10 + Math.random() * 12) * d, v: (500 + Math.random() * 300) * d });
    ctx.fillStyle = 'rgba(40,60,90,.12)'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(200,225,255,.55)'; ctx.lineWidth = 1.2 * d;
    ctx.beginPath();
    this.drops.forEach((r) => {
      r.y += r.v * this.dt; r.x -= r.v * 0.18 * this.dt;
      if (r.y > H) { r.y = -r.l; r.x = Math.random() * W * 1.2; }
      ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - r.l * 0.18, r.y + r.l);
    });
    ctx.stroke();
  },

  drawLighting(ctx, cam, sc, nl) {
    const lc = this.lc, lx = this.lcx, k = lc.width / ctx.canvas.width, S = G.TS;
    lx.globalCompositeOperation = 'source-over';
    lx.clearRect(0, 0, lc.width, lc.height);
    lx.fillStyle = `rgba(46,28,92,${Math.min(0.8, nl)})`;
    lx.fillRect(0, 0, lc.width, lc.height);
    lx.globalCompositeOperation = 'destination-out';
    const night = nl > 0.15;
    const glows = [];
    const light = (wx, wy, r, a, warm) => {
      const sx = (wx - cam.x) * sc * k, sy = (wy - cam.y) * sc * k, sr = r * sc * k;
      if (sx < -sr || sy < -sr || sx > lc.width + sr || sy > lc.height + sr) return;
      const g = lx.createRadialGradient(sx, sy, 0, sx, sy, sr);
      g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.55, `rgba(0,0,0,${a * 0.55})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      lx.fillStyle = g; lx.beginPath(); lx.arc(sx, sy, sr, 0, Math.PI * 2); lx.fill();
      if (warm) glows.push([sx / k, sy / k, sr / k * 0.7]);
    };
    const p = this.player;
    light(p.x, p.y - 16, 120, 0.8);
    if (night) {
      G.world.lamps.forEach((l) => light((l.x + 0.5) * S, (l.y + 1) * S - 34, 125, 0.95, true));
      G.world.buildings.forEach((b) => {
        light((b.dx + 0.5) * S, (b.dy + 0.6) * S, 70, 0.85, true);
        light((b.x + b.w / 2) * S, (b.y + b.h * 0.72) * S, b.w * S * 0.45, 0.45);
      });
    }
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(lc, 0, 0, ctx.canvas.width, ctx.canvas.height);
    if (glows.length) {
      ctx.globalCompositeOperation = 'lighter';
      glows.forEach(([x, y, r]) => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(255,180,200,${0.24 * Math.min(1, nl * 1.6)})`); g.addColorStop(1, 'rgba(255,180,200,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
    }
  },

  drawWordOrb(ctx, it, bob) {
    const x = it.x, y = it.y - 6 + bob;
    const owned = !!this.state.words[it.w.en];
    const c1 = owned ? '#bff0d0' : '#ffd1e3', c2 = owned ? '#7fd3a0' : '#ff8fb8', ink = owned ? '#2f7a52' : '#b8326a';
    ctx.fillStyle = 'rgba(120,70,110,.16)'; ctx.beginPath(); ctx.ellipse(it.x, it.y + 9, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
    const g = ctx.createRadialGradient(x, y, 4, x, y, 19);
    g.addColorStop(0, owned ? 'rgba(190,240,210,.55)' : 'rgba(255,190,215,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 19, 0, Math.PI * 2); ctx.fill();
    // bong bóng xà phòng
    const bg = ctx.createRadialGradient(x - 3, y - 4, 1, x, y, 11);
    bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.55, c1); bg.addColorStop(1, c2);
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.ellipse(x - 4.5, y - 5, 3, 1.8, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ink;
    ctx.font = '900 13px "Nunito", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(it.w.en[0].toUpperCase(), x, y + 1);
    ctx.textBaseline = 'alphabetic';
    const k = (this.t * 1.5 + it.ph) % 2;
    ctx.fillStyle = '#fff59d'; G.star(ctx, x + 10, y - 10, 3 + Math.sin(this.t * 5 + it.ph));
    if (k < 0.8) G.heart(ctx, x - 11, y - 9 - k * 4, 2.2, '#ff8fab');
  },

  drawWaterShimmer(ctx, cam) {
    const S = G.TS, pix = G.pix.on();
    const x0 = Math.max(0, Math.floor(cam.x / S)), y0 = Math.max(0, Math.floor(cam.y / S));
    const x1 = Math.min(G.world.w - 1, Math.floor((cam.x + cam.w) / S)), y1 = Math.min(G.world.h - 1, Math.floor((cam.y + cam.h) / S));
    ctx.fillStyle = 'rgba(255,255,255,.45)';
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (G.world.get(x, y) !== G.T.WATER) continue;
      const h = G.hash2(x, y);
      const ph = (this.t * 0.8 + h * 6) % 3;
      if (ph >= 0.8) continue;
      if (pix) ctx.fillRect(x * S + 6 + Math.round(h * 7) * 2, y * S + 10 + Math.round(((h * 97) % 1) * 6) * 2, Math.max(2, Math.round(5 * (1 - ph / 0.8)) * 2), 2);
      else ctx.fillRect(x * S + 6 + h * 14, y * S + 10 + ((h * 97) % 1) * 12, 9 * (1 - ph / 0.8), 1.6);
    }
  },

  drawGuideArrow(ctx, gt, cam, sc) {
    const p = this.player;
    const tx = (gt.x + 0.5) * G.TS, ty = (gt.y + 0.5) * G.TS;
    const sx = (tx - cam.x) * sc, sy = (ty - cam.y) * sc;
    const W = this.vw * this.dpr, H = this.vh * this.dpr;
    const m = 70 * this.dpr, mt = Math.min(150, this.vh * 0.22) * this.dpr, mb = Math.min(130, this.vh * 0.2) * this.dpr;
    if (sx > m && sx < W - m && sy > mt && sy < H - mb) return;
    const cx = W / 2, cy = (mt + H - mb) / 2;
    const ang = Math.atan2(sy - cy, sx - cx);
    const kx = (W / 2 - m) / Math.abs(Math.cos(ang) || 1e-6), ky = ((H - mt - mb) / 2) / Math.abs(Math.sin(ang) || 1e-6);
    const d = Math.min(kx, ky);
    const ax = cx + Math.cos(ang) * d, ay = cy + Math.sin(ang) * d;
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(ang);
    const s = this.dpr;
    ctx.fillStyle = 'rgba(255,111,159,.95)'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.moveTo(18 * s, 0); ctx.lineTo(-10 * s, -13 * s); ctx.lineTo(-4 * s, 0); ctx.lineTo(-10 * s, 13 * s); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
    const dist = Math.round(Math.hypot(tx - p.x, ty - p.y) / G.TS);
    ctx.font = `800 ${11 * s}px "Nunito", system-ui, sans-serif`; ctx.textAlign = 'center';
    const lx = ax - Math.cos(ang) * 34 * s, ly = ay - Math.sin(ang) * 34 * s;
    const lbl = gt.label + ' · ' + dist + 'm';
    const tw = ctx.measureText(lbl).width + 10 * s;
    ctx.fillStyle = 'rgba(255,250,252,.95)'; G.rr(ctx, lx - tw / 2, ly - 9 * s, tw, 17 * s, 8.5 * s); ctx.fill();
    ctx.strokeStyle = '#ffb3d1'; ctx.lineWidth = 1.5 * s; ctx.stroke();
    ctx.fillStyle = '#c2255c'; ctx.fillText(lbl, lx, ly + 4 * s);
  },

  drawMini() {
    const mc = document.getElementById('mini');
    if (!mc) return;
    const W = mc.width, H = mc.height;
    const x = mc.getContext('2d');
    const p = this.player;
    const z = 2 * (W / 120);
    const vw = W / z, vh = H / z;
    const ptx = p.x / G.TS, pty = p.y / G.TS;
    const sx = G.clamp(ptx - vw / 2, 0, Math.max(0, G.world.w - vw)), sy = G.clamp(pty - vh / 2, 0, Math.max(0, G.world.h - vh));
    x.imageSmoothingEnabled = false;
    x.fillStyle = '#8fd5f5'; x.fillRect(0, 0, W, H);
    x.drawImage(G.world.mini, sx, sy, vw, vh, 0, 0, W, H);
    G.world.regions.forEach((r) => {
      if (r.level <= this.level) return;
      x.fillStyle = 'rgba(90,60,110,.45)';
      x.fillRect((r.gx * G.RW - sx) * z, (r.gy * G.RH - sy) * z, G.RW * z, G.RH * z);
    });
    const gt = this.guideTarget();
    if (gt) {
      x.fillStyle = (Math.floor(this.t * 3) % 2) ? '#ffd166' : '#ff6f9f';
      x.beginPath(); x.arc((gt.x - sx) * z, (gt.y - sy) * z, 4 * (W / 120), 0, Math.PI * 2); x.fill();
    }
    x.fillStyle = '#fff'; x.strokeStyle = '#c2255c'; x.lineWidth = 1.8;
    x.beginPath(); x.arc((ptx - sx) * z, (pty - sy) * z, 3.5 * (W / 120), 0, Math.PI * 2); x.fill(); x.stroke();
  },

  loop(ts) {
    const self = G.game;
    const now = ts / 1000;
    const dt = Math.min(0.05, now - (self.last || now));
    self.last = now; self.dt = dt;
    if (self.running && !G.ui.isOpen()) self.update(dt);
    else if (self.running) { self.updateFx(dt); G.online.update(dt); self.phoneTick(); }
    if (self.running) self.render();
    requestAnimationFrame(self.loop);
  },
};

// ---------- Mở khoá tính năng theo tiến độ cốt truyện ----------
G.feat = {
  has(k) {
    const s = G.state;
    if (!s) return false;
    if (s.featForce && s.featForce[k]) return true;
    return STORY.some((q) => s.storyDone[q.id] && (q.unlock || []).includes(k));
  },
  quest(k) { return STORY.find((q) => (q.unlock || []).includes(k)); },
  lockedMsg(k) {
    const f = FEATURES[k], q = this.quest(k);
    return '🔒 ' + (f ? f.name : k) + ' sẽ mở khi bạn hoàn thành nhiệm vụ “' + (q ? q.title : '?') + '”.';
  },
  // toà nhà cần tính năng nào
  BUILD: { farmshop: 'farm', koi: 'tea', phela: 'tea', library: 'library', mall: 'mall', ranch: 'ranch', petshop: 'pets' },
};
