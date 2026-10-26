// Tiện ích dùng chung: random có seed, lưu game, âm thanh, đọc tiếng Anh
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
      case 'bad': this.tone(220, 0.2, 'sawtooth', 0.06); this.tone(160, 0.25, 'sawtooth', 0.06, 0.15); break;
      case 'level': [392, 523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.1, i * 0.09)); break;
      case 'coin': this.tone(988, 0.06, 'square', 0.05); this.tone(1319, 0.14, 'square', 0.05, 0.06); break;
      case 'click': this.tone(600, 0.04, 'square', 0.04); break;
      case 'door': this.tone(300, 0.08, 'triangle', 0.08); this.tone(450, 0.1, 'triangle', 0.08, 0.06); break;
      case 'bump': this.tone(120, 0.06, 'square', 0.04); break;
    }
  },
};

// ---------- Đọc phát âm tiếng Anh (Text-to-Speech có sẵn trên iOS/Android) ----------
G.tts = {
  voice: null,
  init() {
    if (!('speechSynthesis' in window)) return;
    const choose = () => {
      const vs = speechSynthesis.getVoices();
      this.voice = vs.find((v) => /en[-_]US/i.test(v.lang) && /Samantha|Google|Premium|Enhanced/i.test(v.name)) ||
        vs.find((v) => /en[-_]US/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
    };
    choose();
    speechSynthesis.onvoiceschanged = choose;
  },
  speak(text, rate) {
    if (!('speechSynthesis' in window) || !G.state || !G.state.settings.tts) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      if (this.voice) u.voice = this.voice;
      u.rate = rate || G.state.settings.rate || 0.9;
      speechSynthesis.speak(u);
    } catch (e) { /* bỏ qua */ }
  },
};

// ---------- Tra cứu dữ liệu ----------
G.partById = {};
G.recipeById = {};
G.wordByEn = {};
G.allWords = [];
G.indexData = function () {
  PARTS.forEach((p) => { G.partById[p.id] = p; });
  RECIPES.forEach((r) => { G.recipeById[r.id] = r; });
  Object.keys(WORD_CATS).forEach((cat) => {
    WORD_CATS[cat].words.forEach((w) => {
      if (G.wordByEn[w[0]]) return; // trùng từ: giữ bản đầu tiên
      const o = { en: w[0], ipa: w[1], vi: w[2], ex: w[3], cat };
      G.wordByEn[w[0]] = o;
      G.allWords.push(o);
    });
  });
};
G.itemInfo = function (id) { return G.partById[id] || G.recipeById[id]; };
