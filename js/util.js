// Tiện ích dùng chung: random có seed, lưu game, âm thanh, đồng hồ thực, thời tiết, giọng nói
window.G = window.G || {};

G.TS = 32;             // kích thước 1 ô (pixel thế giới)
G.RW = 48;             // số ô chiều ngang mỗi vùng đất
G.RH = 36;             // số ô chiều dọc mỗi vùng đất

G.mulberry = function (seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
G.hash2 = function (x, y) {
  let h = (x * 374761393 + y * 668265263) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
G.strHash = function (s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
G.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
G.pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
G.shuffle = function (arr, r = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
G.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- Lưu trữ ----------
G.SAVE_KEY = 'tech-english-quest-v1';
G.store = {
  load() {
    try { const s = localStorage.getItem(G.SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; }
  },
  save(state) {
    try { localStorage.setItem(G.SAVE_KEY, JSON.stringify(state)); return true; } catch (e) { return false; }
  },
  clear() { try { localStorage.removeItem(G.SAVE_KEY); } catch (e) { /* bỏ qua */ } },
};

// ---------- Âm thanh (WebAudio, không cần file) ----------
G.audio = {
  ctx: null,
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; }
  },
  tone(freq, dur, type = 'sine', vol = 0.12, delay = 0) {
    const c = this.ctx;
    if (!c || !G.state || !G.state.settings.sfx) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
  },
  sfx(name) {
    switch (name) {
      case 'pick': this.tone(880, 0.08, 'square', 0.06); this.tone(1320, 0.1, 'square', 0.05, 0.07); break;
      case 'good': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.1, i * 0.08)); break;
      case 'ok': [523, 659].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.08, i * 0.08)); break;
      case 'bad': this.tone(220, 0.2, 'sawtooth', 0.06); this.tone(160, 0.25, 'sawtooth', 0.06, 0.15); break;
      case 'level': [392, 523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.1, i * 0.09)); break;
      case 'coin': this.tone(988, 0.06, 'square', 0.05); this.tone(1319, 0.14, 'square', 0.05, 0.06); break;
      case 'click': this.tone(600, 0.04, 'square', 0.04); break;
      case 'door': this.tone(300, 0.08, 'triangle', 0.08); this.tone(450, 0.1, 'triangle', 0.08, 0.06); break;
      case 'bump': this.tone(120, 0.06, 'square', 0.04); break;
      case 'ring': [0, 0.18, 0.5, 0.68].forEach((d) => { this.tone(1200, 0.12, 'sine', 0.08, d); this.tone(1500, 0.12, 'sine', 0.05, d); }); break;
      case 'water': [900, 700, 800, 600].forEach((f, i) => this.tone(f, 0.06, 'sine', 0.05, i * 0.05)); break;
      case 'plant': this.tone(330, 0.1, 'triangle', 0.08); this.tone(440, 0.12, 'triangle', 0.08, 0.08); break;
      case 'harvest': [660, 880, 1100].forEach((f, i) => this.tone(f, 0.1, 'square', 0.05, i * 0.06)); break;
    }
  },
};

// ---------- Đọc phát âm tiếng Anh (Text-to-Speech có sẵn trên iOS/Android) ----------
G.tts = {
  voice: null, voices: [],
  // Giọng "vui nhộn"/robot có sẵn trên iPhone, iPad, Mac — nghe ồm, méo, rất khó chịu → loại bỏ
  BAD: /albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|grandma|grandpa|rocko|eddy|flo\b|reed|sandy|shelley|kathy|princess|bruce|agnes|vicki|victoria|pipe organ|novelty/i,
  FEMALE: /samantha|ava|allison|susan|zoe|joelle|nicky|karen|serena|moira|tessa|kate|stephanie|aria|jenny|michelle|emma|libby|sonia|natasha|catherine|fiona|veena|google us english|google uk english female|female|woman/i,
  MALE: /alex|daniel|aaron|evan|nathan|tom\b|oliver|arthur|guy|ryan|christopher|eric|davis|tony|rishi|google uk english male|\bmale|man\b/i,
  // chấm điểm giọng: càng cao càng tự nhiên
  score(v, pref) {
    if (!/^en([-_]|$)/i.test(v.lang)) return -999;
    const n = v.name;
    let s = 0;
    if (this.BAD.test(n)) s -= 500;
    if (/premium|enhanced|neural|natural|siri|online/i.test(n)) s += 40;
    if (/en[-_]US/i.test(v.lang)) s += 12; else if (/en[-_](GB|AU|CA|IE|NZ)/i.test(v.lang)) s += 8;
    const f = this.FEMALE.test(n), m = this.MALE.test(n) && !f;
    if ((pref || 'f') === 'f' ? f : m) s += 25;
    if (/^(samantha|ava|allison|google us english)/i.test(n)) s += 6;
    if (v.localService) s += 2;
    return s;
  },
  ranked(pref) {
    if (!('speechSynthesis' in window)) return [];
    return speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang)).map((v) => ({ v, s: this.score(v, pref) })).sort((a, b) => b.s - a.s);
  },
  choose() {
    const st = G.state ? G.state.settings : {};
    const r = this.ranked(st.vpref);
    this.voices = r;
    const want = st.voice && r.find((x) => x.v.name === st.voice);
    this.voice = want ? want.v : r.length && r[0].s > -100 ? r[0].v : null;
  },
  // giọng thứ 2 (khác giới) cho bài hội thoại 2 người
  second() {
    const st = G.state ? G.state.settings : {};
    const other = (st.vpref || 'f') === 'f' ? 'm' : 'f';
    const r = this.ranked(other).filter((x) => x.v !== this.voice && x.s > -100);
    return r.length ? r[0].v : this.voice;
  },
  init() {
    if (!('speechSynthesis' in window)) return;
    this.choose();
    speechSynthesis.onvoiceschanged = () => this.choose();
    // iOS đôi khi trả danh sách giọng trễ
    [300, 1000, 2500].forEach((t) => setTimeout(() => { if (!this.voice) this.choose(); }, t));
  },
  utter(text, opts = {}) {
    const st = G.state ? G.state.settings : {};
    const u = new SpeechSynthesisUtterance(text);
    const v = opts.voice || this.voice;
    u.lang = v ? v.lang : 'en-US';
    if (v) u.voice = v;
    u.rate = opts.rate || st.rate || 0.9;
    u.pitch = opts.pitch || st.pitch || 1.05;
    return u;
  },
  speak(text, rate) {
    if (!('speechSynthesis' in window) || !G.state || !G.state.settings.tts) return;
    try {
      if (!this.voice) this.choose();
      speechSynthesis.cancel();
      speechSynthesis.speak(this.utter(text, { rate }));
    } catch (e) { /* bỏ qua */ }
  },
  stop() { try { speechSynthesis.cancel(); } catch (e) { /* bỏ qua */ } },
};

// ---------- Nhận giọng nói để luyện nói (Safari iOS 14.5+, Chrome Android) ----------
G.stt = {
  get supported() { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); },
  listen(onResult, onEnd) {
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!R) { onEnd && onEnd('unsupported'); return null; }
    G.tts.stop();
    let done = false;
    const r = new R();
    r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 3; r.continuous = false;
    r.onresult = (e) => { done = true; onResult(Array.from(e.results[0]).map((a) => a.transcript)); };
    r.onerror = (e) => { if (!done) { done = true; onEnd && onEnd(e.error || 'error'); } };
    r.onend = () => { if (!done) { done = true; onEnd && onEnd('nospeech'); } };
    try { r.start(); } catch (e) { onEnd && onEnd('error'); return null; }
    return r;
  },
};
G.norm = (s) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
// Độ giống nhau theo từ (0..1)
G.similarity = function (a, b) {
  const A = G.norm(a).split(' ').filter(Boolean), B = G.norm(b).split(' ').filter(Boolean);
  if (!A.length || !B.length) return 0;
  const dp = Array.from({ length: B.length + 1 }, (_, j) => j);
  for (let i = 1; i <= A.length; i++) {
    let prev = dp[0]; dp[0] = i;
    for (let j = 1; j <= B.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (A[i - 1] === B[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return Math.max(0, 1 - dp[B.length] / Math.max(A.length, B.length));
};

// ---------- Đồng hồ THỜI GIAN THỰC ----------
// Thêm ?hour=21 vào địa chỉ để thử giờ khác (chỉ dùng khi kiểm tra).
G.clock = {
  offset: 0,
  init() {
    const m = location.search.match(/[?&]hour=(\d{1,2})(?::(\d{2}))?/);
    if (m) { const d = new Date(), t = new Date(d); t.setHours(+m[1], +(m[2] || 0), 0, 0); this.offset = t - d; }
  },
  now() { return Date.now() + this.offset; },
  date() { return new Date(this.now()); },
  minutes() { const d = this.date(); return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60; },
  dateKey() {
    const d = this.date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },
  greet() { const h = this.date().getHours(); return h >= 4 && h < 12 ? 'Good morning' : h >= 12 && h < 18 ? 'Good afternoon' : 'Good evening'; },
  wrongGreet() { return this.greet() === 'Good morning' ? 'Good evening' : 'Good morning'; },
  greetVi() { return { 'Good morning': 'chào buổi sáng (4h–12h)', 'Good afternoon': 'chào buổi chiều (12h–18h)', 'Good evening': 'chào buổi tối (sau 18h)' }[this.greet()]; },
  label() {
    const d = this.date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ' · ' + days[d.getDay()] + ', ' + d.getDate() + ' ' + mon[d.getMonth()];
  },
  fmtDur(ms) {
    const m = Math.max(1, Math.ceil(ms / 60000));
    if (m < 60) return m + ' phút';
    const h = Math.floor(m / 60), r = m % 60;
    return h + ' giờ' + (r ? ' ' + r + ' phút' : '');
  },
};

// ---------- Thời tiết (đổi mỗi 2 giờ thực, giống nhau trên mọi máy) ----------
G.weather = {
  SLOT: 2 * 3600e3,
  force: null,
  init() { const m = location.search.match(/[?&]weather=(sunny|cloudy|rain)/); if (m) this.force = m[1]; },
  at(ts) {
    if (this.force) return this.force;
    const h = G.hash2(Math.floor(ts / this.SLOT), 4242);
    return h < 0.14 ? 'rain' : h < 0.36 ? 'cloudy' : 'sunny';
  },
  now() { return this.at(G.clock.now()); },
  icon(w, night) { return w === 'rain' ? '🌧️' : w === 'cloudy' ? '☁️' : night ? '🌙' : '☀️'; },
  en: { sunny: 'sunny', cloudy: 'cloudy', rain: 'rainy' },
};

// ---------- Tra cứu dữ liệu ----------
G.partById = {};
G.recipeById = {};
G.cropById = {};
G.items = {};
G.wordByEn = {};
G.allWords = [];
G.indexData = function () {
  PARTS.forEach((p) => { G.partById[p.id] = p; G.items[p.id] = Object.assign({ kind: 'part' }, p); });
  RECIPES.forEach((r) => { G.recipeById[r.id] = r; G.items[r.id] = Object.assign({ kind: 'mod' }, r); });
  CROPS.forEach((c) => {
    G.cropById[c.id] = c;
    G.items['seed_' + c.id] = { id: 'seed_' + c.id, kind: 'seed', crop: c.id, en: c.en + ' seeds', vi: 'Hạt ' + c.vi, price: c.seed, color: c.color,
      desc: 'Gieo ở ruộng (đất nâu có luống). Chín sau ' + G.clock.fmtDur(c.min * 60000) + ' thời gian thực, nếu đất luôn được tưới ẩm.' };
    G.items['crop_' + c.id] = { id: 'crop_' + c.id, kind: 'crop', crop: c.id, en: c.en, vi: c.vi, price: c.sell, color: c.color,
      desc: 'Nông sản tươi. Bán ở Tiệm Nông Sản, hoặc giao cho quán cà phê khi họ đặt hàng để được giá cao hơn.' };
  });
  FARM_ITEMS.forEach((t) => { G.items[t.id] = Object.assign({}, t); });
  Object.keys(WORD_CATS).forEach((cat) => {
    WORD_CATS[cat].words.forEach((w) => {
      if (G.wordByEn[w[0]]) return; // trùng từ: giữ bản đầu tiên
      const o = { en: w[0], ipa: w[1], vi: w[2], ex: w[3], cat };
      G.wordByEn[w[0]] = o;
      G.allWords.push(o);
    });
  });
};
G.itemInfo = function (id) { return G.items[id]; };
// giá bán lại
G.sellPrice = function (id) {
  const it = G.items[id];
  if (!it || !it.price) return 0;
  if (it.kind === 'mod' || it.kind === 'crop') return it.price;
  return Math.max(1, Math.floor(it.price * 0.5));
};
