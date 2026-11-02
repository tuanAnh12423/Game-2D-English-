// ============================================================
// NHẢY MÚA & ĐỘNG TÁC (💃): nhân vật 3D múa may, mỗi động tác dạy 1 từ tiếng Anh.
// Có trò chơi “Nhảy theo lệnh”: nghe lệnh tiếng Anh (Jump! / Wave your hand!...) rồi bấm đúng động tác.
// ============================================================
window.EMOTES = [
  { id: 'dance', icon: '💃', en: 'dance', ipa: '/dæns/', vi: 'nhảy múa', say: "Let's dance! I love dancing!", cmd: 'Dance!', dur: 5.5 },
  { id: 'wave', icon: '👋', en: 'wave', ipa: '/weɪv/', vi: 'vẫy tay', say: 'Hello! Nice to see you!', cmd: 'Wave your hand!', dur: 2.4 },
  { id: 'jump', icon: '🦘', en: 'jump', ipa: '/dʒʌmp/', vi: 'nhảy lên', say: 'Jump, jump, jump!', cmd: 'Jump up high!', dur: 2.2 },
  { id: 'spin', icon: '🌀', en: 'spin', ipa: '/spɪn/', vi: 'xoay vòng', say: 'Look at me! I can spin around!', cmd: 'Spin around!', dur: 2 },
  { id: 'clap', icon: '👏', en: 'clap', ipa: '/klæp/', vi: 'vỗ tay', say: 'Well done! Let me clap for you!', cmd: 'Clap your hands!', dur: 2.4 },
  { id: 'cheer', icon: '🙌', en: 'cheer', ipa: '/tʃɪr/', vi: 'reo hò, cổ vũ', say: 'Hooray! We did it!', cmd: 'Put your hands up!', dur: 2.4 },
  { id: 'bow', icon: '🙇', en: 'bow', ipa: '/baʊ/', vi: 'cúi chào', say: 'Thank you very much!', cmd: 'Take a bow!', dur: 2.2 },
  { id: 'heart', icon: '🫶', en: 'heart', ipa: '/hɑːrt/', vi: 'trái tim', say: 'I love learning English!', cmd: 'Make a heart!', dur: 2.8 },
  { id: 'sit', icon: '🧘', en: 'sit down', ipa: '/sɪt daʊn/', vi: 'ngồi xuống', say: 'Let me sit down and relax.', cmd: 'Sit down, please!', dur: 4 },
  { id: 'sleep', icon: '😴', en: 'sleepy', ipa: '/ˈsliːpi/', vi: 'buồn ngủ', say: "I'm so sleepy. Good night!", cmd: 'Go to sleep!', dur: 3.5 },
];

G.emote = {
  open: false,
  by(id) { return EMOTES.find((e) => e.id === id); },
  init() {
    const btn = document.getElementById('btnEmo');
    if (!btn) return;
    btn.addEventListener('click', (e) => { e.stopPropagation(); G.audio.unlock(); G.audio.sfx('click'); this.toggle(); });
    document.addEventListener('pointerdown', (e) => { if (this.open && !e.target.closest('#emoPop') && !e.target.closest('#btnEmo')) this.close(); });
  },
  toggle() { if (this.open) this.close(); else this.menu(); },
  close() { this.open = false; this.game = null; const p = document.getElementById('emoPop'); p.classList.remove('on'); p.innerHTML = ''; },
  menu() {
    const p = document.getElementById('emoPop');
    this.open = true;
    p.innerHTML = `<div class="emh">💃 Động tác <small>chạm để làm · học từ mới</small></div>
      <div class="emg">${EMOTES.map((e) => `<button data-em="${e.id}"><b>${e.icon}</b><span>${e.en}</span><i>${e.vi}</i></button>`).join('')}</div>
      <button class="btn emgame" id="emGame">🎵 Trò chơi: Nhảy theo lệnh tiếng Anh</button>`;
    p.classList.add('on');
    p.querySelectorAll('[data-em]').forEach((b) => b.addEventListener('click', () => { this.play(b.dataset.em, true); }));
    p.querySelector('#emGame').addEventListener('click', () => this.startGame());
  },

  // làm động tác
  play(id, learn) {
    const e = this.by(id); if (!e || !G.game.running) return;
    if (G.r3d && G.r3d.ok) G.r3d.emote(id, e.dur);
    else G.game.playerBubble = { text: e.icon, until: Date.now() + e.dur * 1000, emo: true };
    if (G.online.isOn()) G.online.sendEmote(e.icon);
    if (id === 'dance') this.music(e.dur);
    else if (id === 'clap') [0, 0.35, 0.7, 1.05, 1.4].forEach((d) => G.audio.tone(1800, 0.05, 'square', 0.04, d));
    else if (id === 'jump') [0, 0.6, 1.2].forEach((d) => { G.audio.tone(440, 0.12, 'sine', 0.07, d); G.audio.tone(880, 0.1, 'sine', 0.05, d + 0.08); });
    const p = G.game.player;
    if (id === 'heart' || id === 'dance') G.game.hearts(p.x, p.y - 40, 8);
    if (!learn) return;
    G.tts.say(e.say);
    G.ui.toast(`${e.icon} ${e.en} ${e.ipa} — ${e.vi} · “${e.say}”`);
    // lần đầu mỗi ngày làm động tác này: +3 XP
    const s = G.state, day = new Date().toDateString();
    s.emo = s.emo && s.emo.day === day ? s.emo : { day, done: {}, games: 0 };
    if (!s.emo.done[id]) { s.emo.done[id] = 1; G.game.addXp(3, p.x, p.y - 50); }
  },

  // nhạc nền vui tai khi nhảy (tự phát bằng Web Audio, không cần tải file)
  music(sec) {
    const mel = [523, 659, 784, 659, 880, 784, 659, 587, 523, 587, 659, 523, 784, 659, 523, 392];
    const bass = [131, 131, 196, 196, 175, 175, 196, 196];
    const beat = 0.25, n = Math.floor(sec / beat);
    for (let i = 0; i < n; i++) {
      G.audio.tone(mel[i % mel.length], 0.18, 'triangle', 0.06, i * beat);
      if (i % 2 === 0) G.audio.tone(bass[(i / 2) % bass.length], 0.22, 'sine', 0.08, i * beat);
      if (i % 4 === 2) G.audio.tone(2400, 0.03, 'square', 0.02, i * beat);
    }
  },

  // ---------- Trò chơi: Nhảy theo lệnh ----------
  startGame() {
    const s = G.state, day = new Date().toDateString();
    s.emo = s.emo && s.emo.day === day ? s.emo : { day, done: {}, games: 0 };
    this.game = { round: 0, score: 0, combo: 0, total: 8, paid: s.emo.games < 3 };
    this.next();
  },
  next() {
    const g = this.game; if (!g || !this.open) return;
    const p = document.getElementById('emoPop');
    if (g.round >= g.total) return this.endGame();
    g.round++;
    const pool = G.shuffle(EMOTES.slice());
    const ans = pool[0], opts = G.shuffle(pool.slice(0, 4));
    g.ans = ans; g.locked = false;
    const lim = Math.max(2.8, 5 - g.round * 0.25); // càng về sau càng nhanh
    p.innerHTML = `<div class="emh">🎵 Nhảy theo lệnh <small>Vòng ${g.round}/${g.total} · ⭐ ${g.score}${g.combo > 1 ? ' · 🔥x' + g.combo : ''}</small></div>
      <div class="emcmd"><button class="tchip" id="emRe">🔊 Nghe lại</button> <span id="emTxt">🎧 Hãy nghe…</span></div>
      <div class="embar"><i id="emBar"></i></div>
      <div class="emg emg4">${opts.map((e) => `<button data-ans="${e.id}"><b>${e.icon}</b><span>${e.en}</span></button>`).join('')}</div>
      <button class="tchip" id="emQuit">✖ Thoát</button>`;
    const speakCmd = () => G.tts.say(ans.cmd, { rate: 0.95 });
    speakCmd();
    // hiện chữ sau 1,5 giây (để luyện nghe trước)
    const showT = setTimeout(() => { const t = document.getElementById('emTxt'); if (t) t.textContent = '“' + ans.cmd + '”'; }, 1500);
    p.querySelector('#emRe').addEventListener('click', speakCmd);
    p.querySelector('#emQuit').addEventListener('click', () => { this.game = null; this.menu(); });
    const t0 = performance.now();
    const tick = () => {
      if (this.game !== g || g.locked) return;
      const k = 1 - (performance.now() - t0) / 1000 / lim;
      const bar = document.getElementById('emBar'); if (bar) bar.style.width = Math.max(0, k * 100) + '%';
      if (k <= 0) return this.answer(null, showT);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    p.querySelectorAll('[data-ans]').forEach((b) => b.addEventListener('click', () => this.answer(b.dataset.ans, showT, b)));
  },
  answer(id, showT, btn) {
    const g = this.game; if (!g || g.locked) return;
    g.locked = true; clearTimeout(showT);
    const ok = id === g.ans.id;
    const t = document.getElementById('emTxt'); if (t) t.innerHTML = `“${g.ans.cmd}” = ${g.ans.icon} <b>${g.ans.en}</b> (${g.ans.vi})`;
    if (ok) { g.score++; g.combo++; G.audio.sfx('good'); this.play(g.ans.id, false); if (btn) btn.classList.add('ok'); }
    else { g.combo = 0; G.audio.sfx('bad'); if (btn) btn.classList.add('no'); const r = document.querySelector(`[data-ans="${g.ans.id}"]`); if (r) r.classList.add('ok'); }
    setTimeout(() => this.next(), ok ? 1500 : 2000);
  },
  endGame() {
    const g = this.game, s = G.state, p = document.getElementById('emoPop'), pl = G.game.player;
    const stars = g.score >= 7 ? 3 : g.score >= 5 ? 2 : g.score >= 3 ? 1 : 0;
    let rew = '';
    if (g.paid && g.score > 0) {
      s.emo.games++;
      const xp = g.score * 2, coins = g.score * 3 + (stars === 3 ? 10 : 0);
      G.game.addXp(xp, pl.x, pl.y - 50); G.game.addCoins(coins, pl.x, pl.y - 30);
      rew = `+${xp} XP · +${coins} 🪙`;
    } else rew = 'Hôm nay đã nhận thưởng 3 lần — chơi tiếp để luyện nghe nhé!';
    G.audio.sfx(stars >= 2 ? 'level' : 'ok');
    if (stars === 3 && G.r3d && G.r3d.ok) { G.r3d.emote('dance', 5.5); this.music(5.5); }
    G.tts.say(stars === 3 ? 'Amazing! You are a great dancer!' : stars >= 1 ? 'Good job! Keep practicing!' : 'Nice try! Listen carefully and try again!');
    p.innerHTML = `<div class="emh">🎵 Kết quả</div>
      <div class="emres">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}<br><b>${g.score}/${g.total}</b> lệnh đúng<br><small>${rew}</small></div>
      <button class="btn" id="emAgain">🔁 Chơi lại</button><button class="tchip" id="emBack">↩ Động tác</button>`;
    this.game = null;
    p.querySelector('#emAgain').addEventListener('click', () => this.startGame());
    p.querySelector('#emBack').addEventListener('click', () => this.menu());
  },
};
