// ============================================================
// HỌC VIỆN HVAC — nội dung khó, chỉ mở khi đạt Level 5 và sửa xong 5 đơn.
// Dữ liệu: js/data/hvac_questions.js (HVAC_QUIZ) và hvac_listening.js (HVAC_LISTEN),
// sinh từ data/hvac/*.json bằng tools/hvac_to_js.py.
// File MP3 (nếu có) đặt trong data/hvac/audio/ — không có thì game đọc bằng giọng máy.
// ============================================================

// Thuật ngữ trong các bài nghe → nhóm "HVAC" trong Từ điển (thêm khi hoàn thành bài nghe)
(function () {
  const words = [];
  HVAC_LISTEN.passages.forEach((p) => {
    const sents = p.transcript.map((t) => t.text).join(' ').split(/\n+|(?<=[.?!])\s+/);
    p.vocab.forEach((v) => {
      const core = v.term.replace(/\s*\(.*\)/, '').toLowerCase();
      const ex = sents.find((s) => s.toLowerCase().includes(core)) || sents.find((s) => s.toLowerCase().includes(core.split(' ')[0])) || '';
      words.push([v.term, '', v.meaning_vi, ex.trim()]);
    });
  });
  WORD_CATS.hvac = { name: 'HVAC & điều hòa', icon: '❄️', words };
})();

G.hvac = {
  REQ_LEVEL: 5, REQ_JOBS: 5, PASS: 0.8, PER_QUIZ: 12,
  LISTEN_NEED: { 'Dễ': 0, 'Trung bình': 2, 'Khó': 4 }, // cần đậu cấp mấy để mở bài nghe
  INTERVIEW_NEED: 4,

  st() { const s = G.state; s.hvac = s.hvac || { best: {}, passed: {}, lis: {}, iv: {} }; return s.hvac; },
  unlocked() { return G.game.level >= this.REQ_LEVEL && G.state.stats.jobs >= this.REQ_JOBS; },
  passedCount() { return Object.keys(this.st().passed).length; },
  levelOpen(L) { return L === 1 || !!this.st().passed[L - 1]; },
  listenNeed(p) { return this.LISTEN_NEED[p.level] ?? 0; },
  listenOpen(p) { const n = this.listenNeed(p); return n === 0 || !!this.st().passed[n]; },
  interviewOpen() { return !!this.st().passed[this.INTERVIEW_NEED]; },
  choiceQs(L) { return HVAC_QUIZ.questions.filter((q) => q.l === L && !q.ans); },
  openQs(L) { return HVAC_QUIZ.questions.filter((q) => q.l === L && q.ans); },
  levelName(L) { return HVAC_QUIZ.levels[L] || 'Cấp ' + L; },
  stopAll() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.audio) { try { this.audio.pause(); } catch (e) { /* bỏ qua */ } this.audio = null; }
    G.tts.stop();
  },
  srcHtml(keys) {
    return (keys || []).map((k) => {
      const s = HVAC_QUIZ.sources[k];
      if (!s) return '';
      return s[1] ? `<a href="${G.esc(s[1])}" target="_blank" rel="noopener">${G.esc(s[0])}</a>` : G.esc(s[0]);
    }).filter(Boolean).join(' · ');
  },
  kindTag(k) { return `<span class="kind k-${k}">${G.esc(HVAC_QUIZ.kinds[k] || k)}</span>`; },
  disclaimer() {
    return `<p class="hint">⚠️ ${G.esc(HVAC_LISTEN.note || '')} Gói dữ liệu ghi: nội dung chưa đối chiếu giáo trình; không so CSPF với SEER như cùng thang đo. Mỗi câu có nhãn nguồn: <b>lấy từ nguồn</b> / <b>số tự tính</b> / <b>kiến thức chung</b> / <b>gợi ý</b>.</p>`;
  },

  // ---------- Toà nhà ----------
  open(b, tab) {
    this.stopAll();
    const ui = G.ui, g = G.game, s = G.state;
    this.b = b;
    if (!this.unlocked()) {
      const bar = (cur, max) => `<div class="bar"><i style="width:${Math.min(100, cur / max * 100)}%"></i></div>`;
      ui.open(`<h2>❄️ ${G.esc(b.name)} <small>🔒 Đang khoá</small></h2>
        <p class="sub">Nơi đào tạo chuyên sâu về điều hòa không khí (HVAC): chu trình lạnh, VRV, chiller, tải lạnh, môi chất, hồ sơ thầu — bằng tiếng Anh. Đây là phần khó, bạn cần đủ kinh nghiệm để vào học.</p>
        <div class="job"><div class="jt">Điều kiện mở khoá</div>
          <div>⭐ Đạt Level ${this.REQ_LEVEL} — hiện tại Lv ${g.level}</div>${bar(g.level, this.REQ_LEVEL)}
          <div>🔧 Hoàn thành ${this.REQ_JOBS} đơn sửa chữa — đã sửa ${s.stats.jobs}</div>${bar(s.stats.jobs, this.REQ_JOBS)}</div>
        <div class="sec"><h4>Bên trong có gì?</h4><p>📝 ${HVAC_QUIZ.questions.length} câu hỏi chia 5 cấp (đậu cấp trước mới mở cấp sau) · 🎧 ${HVAC_LISTEN.passages.length} bài nghe tiếng Anh · 🎤 ${HVAC_LISTEN.interview.length} câu luyện phỏng vấn · 🎓 Chứng chỉ Kỹ sư HVAC.</p></div>
        <button class="btn ghost" data-close>Quay lại sau</button>`);
      return;
    }
    tab = tab || this.tab || 'quiz';
    this.tab = tab;
    const tabs = `<div class="tabs"><button data-ht="quiz" class="${tab === 'quiz' ? 'on' : ''}">📝 Thi cấp</button><button data-ht="listen" class="${tab === 'listen' ? 'on' : ''}">🎧 Nghe</button><button data-ht="interview" class="${tab === 'interview' ? 'on' : ''}">🎤 Phỏng vấn</button><button data-ht="src" class="${tab === 'src' ? 'on' : ''}">📚 Nguồn</button></div>`;
    const h = this.st();
    const done = this.passedCount();
    let body = '';
    if (tab === 'quiz') {
      body = `<p class="sub">Đúng từ ${Math.round(this.PASS * 100)}% để đậu và mở cấp tiếp theo. Mỗi lượt thi tối đa ${this.PER_QUIZ} câu, đáp án được xáo trộn.</p><div class="list">` +
        [1, 2, 3, 4, 5].map((L) => {
          const open = this.levelOpen(L), nc = this.choiceQs(L).length, no = this.openQs(L).length;
          const best = h.best[L];
          return `<div class="row ${open ? '' : 'locked'}"><div class="big-emoji">${h.passed[L] ? '✅' : open ? '📘' : '🔒'}</div>
            <div class="rn"><b>${G.esc(this.levelName(L))}</b><small>${nc} câu trắc nghiệm${no ? ' · ' + no + ' câu tự luận' : ''}${best !== undefined ? ' · cao nhất ' + best + '%' : ''}${open ? '' : ' · đậu Cấp ' + (L - 1) + ' để mở'}</small></div>
            ${open ? `<button class="btn small" data-quiz="${L}">${h.passed[L] ? 'Thi lại' : 'Thi'}</button>${no ? `<button class="btn small ghost" data-essay="${L}">Tự luận</button>` : ''}` : ''}</div>`;
        }).join('') + '</div>';
    } else if (tab === 'listen') {
      body = `<p class="sub">Nghe bài nói tiếng Anh, rồi trả lời câu hỏi. ${this.hasAudioNote()}</p><div class="list">` +
        HVAC_LISTEN.passages.map((p) => {
          const open = this.listenOpen(p), d = h.lis[p.id];
          return `<div class="row ${open ? '' : 'locked'}"><div class="big-emoji">${d ? '✅' : open ? '🎧' : '🔒'}</div>
            <div class="rn"><b>${G.esc(p.title)}</b><small>${G.esc(p.vi)} · ${G.esc(p.level)} · ${G.esc(p.topic)} · ${Math.round(p.duration_s)}s${d ? ' · đúng ' + d.c + '/' + d.n : ''}${open ? '' : ' · đậu Cấp ' + this.listenNeed(p) + ' để mở'}</small></div>
            ${open ? `<button class="btn small" data-lis="${p.id}">Nghe</button>` : ''}</div>`;
        }).join('') + '</div>';
    } else if (tab === 'interview') {
      if (!this.interviewOpen()) body = `<div class="res bad">🔒 Đậu ${G.esc(this.levelName(this.INTERVIEW_NEED))} để mở luyện phỏng vấn.</div>`;
      else {
        const groups = [...new Set(HVAC_LISTEN.interview.map((i) => i.group))];
        body = `<p class="sub">Nghe câu hỏi, suy nghĩ tối đa 90 giây, trả lời bằng giọng nói, rồi so với câu trả lời mẫu. Phần trong [ngoặc vuông] bạn cần thay bằng thông tin thật của mình.</p>` +
          groups.map((gname) => `<h3>${G.esc(gname)}</h3><div class="list">` + HVAC_LISTEN.interview.filter((i) => i.group === gname).map((i) =>
            `<div class="row"><div class="big-emoji">${h.iv[i.id] ? '✅' : '🎤'}</div><div class="rn"><b>${G.esc(i.question)}</b><small>${G.esc(i.hint_vi)}</small></div><button class="btn small" data-iv="${i.id}">Luyện</button></div>`).join('') + '</div>').join('');
      }
    } else {
      body = `<div class="sec"><h4>Nhãn độ tin cậy</h4><p>${Object.keys(HVAC_QUIZ.kinds).map((k) => this.kindTag(k)).join(' ')}</p></div>
        <h3>Nguồn tham khảo (${Object.keys(HVAC_QUIZ.sources).length})</h3><div class="dict">${Object.keys(HVAC_QUIZ.sources).map((k) => `<div class="drow">${this.srcHtml([k])}</div>`).join('')}</div>`;
    }
    const p = ui.open(`<h2>❄️ ${G.esc(b.name)}</h2>
      <div class="stats"><div>🎓 Cấp đã đậu<b>${done}/5</b></div><div>🎧 Bài nghe<b>${Object.keys(h.lis).length}/${HVAC_LISTEN.passages.length}</b></div><div>🎤 Phỏng vấn<b>${Object.keys(h.iv).length}/${HVAC_LISTEN.interview.length}</b></div></div>
      ${done === 5 ? '<div class="res good">🎓 Bạn đã có Chứng chỉ Kỹ sư HVAC!</div>' : ''}
      ${tabs}${body}${this.disclaimer()}`, { cls: 'wide', onClose: () => this.stopAll() });
    ui.on(p, '[data-ht]', (x) => this.open(b, x.dataset.ht));
    ui.on(p, '[data-quiz]', (x) => this.quiz(+x.dataset.quiz));
    ui.on(p, '[data-essay]', (x) => this.essay(+x.dataset.essay));
    ui.on(p, '[data-lis]', (x) => this.passage(HVAC_LISTEN.passages.find((q) => q.id === x.dataset.lis)));
    ui.on(p, '[data-iv]', (x) => this.interview(HVAC_LISTEN.interview.find((q) => q.id === x.dataset.iv)));
  },
  back() { this.open(this.b, this.tab); },
  hasAudioNote() { return 'Có file MP3 trong data/hvac/audio/ thì phát MP3, nếu không game đọc bằng giọng máy.'; },

  // ---------- Thi trắc nghiệm theo cấp ----------
  quiz(L) {
    this.stopAll();
    const ui = G.ui, h = this.st();
    const qs = G.shuffle(this.choiceQs(L)).slice(0, this.PER_QUIZ);
    let i = 0, score = 0;
    const next = () => {
      if (i >= qs.length) return finish();
      const q = qs[i];
      const opts = G.shuffle(q.o.map((t, k) => ({ t, ok: k === 0 })));
      const p = ui.open(`<div class="tag">${G.esc(this.levelName(L))} · ${G.esc(q.t)} · Câu ${i + 1}/${qs.length} · Đúng ${score}</div>
        <div class="qsent left">${G.esc(q.q)}</div>
        <div class="opts">${opts.map((o, k) => `<button class="opt left" data-k="${k}">${G.esc(o.t)}</button>`).join('')}</div><div id="hres"></div>`, { noClose: true, cls: 'wide' });
      let done = false;
      ui.on(p, '.opt', (b) => {
        if (done) return;
        done = true;
        const o = opts[+b.dataset.k];
        if (o.ok) { score++; G.audio.sfx('good'); } else G.audio.sfx('bad');
        p.querySelectorAll('.opt').forEach((x, k) => { if (opts[k].ok) x.classList.add('right'); else if (x === b) x.classList.add('wrong'); x.disabled = true; });
        const res = ui.el('hres');
        res.innerHTML = `<div class="res ${o.ok ? 'good' : 'bad'}">${o.ok ? '✅ Chính xác!' : '❌ Chưa đúng.'}</div>
          <div class="sec"><h4>📘 Giải thích ${this.kindTag(q.k)}</h4><p>${G.esc(q.e)}</p><p class="hint">Nguồn: ${this.srcHtml(q.s)}</p></div>
          <button class="btn big" id="hnext">${i + 1 < qs.length ? 'Câu tiếp ›' : 'Xem kết quả'}</button>`;
        ui.el('hnext').addEventListener('click', () => { G.audio.sfx('click'); i++; next(); });
        res.scrollIntoView({ block: 'nearest' });
      });
    };
    const finish = () => {
      const pct = Math.round(score / qs.length * 100);
      const pass = pct >= this.PASS * 100;
      const first = pass && !h.passed[L];
      h.best[L] = Math.max(h.best[L] || 0, pct);
      let reward = '';
      if (first) {
        h.passed[L] = true;
        const coins = 60 * L, xp = 50 * L;
        G.game.addCoins(coins); G.game.addXp(xp);
        reward = `<p><b>+${coins} 🪙 · +${xp} XP</b></p>` + (L < 5 ? `<p>🔓 Đã mở <b>${G.esc(this.levelName(L + 1))}</b>${L === 2 ? ' và các bài nghe mức Trung bình' : ''}${L === 4 ? ', bài nghe mức Khó và luyện phỏng vấn' : ''}.</p>` : '');
        if (this.passedCount() === 5) { G.game.addCoins(300); reward += '<div class="res good">🎓 Chúc mừng! Bạn nhận <b>Chứng chỉ Kỹ sư HVAC</b> và thưởng thêm 300 🪙.</div>'; }
      } else if (pass) { G.game.addXp(20); reward = '<p>+20 XP (ôn tập)</p>'; }
      G.audio.sfx(pass ? 'level' : 'bad');
      const p = ui.open(`<div class="center"><div class="big-emoji">${pass ? '🎉' : '📚'}</div><h2>${pass ? 'ĐẬU' : 'Chưa đậu'} — ${score}/${qs.length} (${pct}%)</h2>
        <p>${G.esc(this.levelName(L))} · cần ${Math.round(this.PASS * 100)}% để đậu</p>${reward}</div>
        <div class="row2"><button class="btn ghost" id="hagain">🔁 Thi lại</button><button class="btn" id="hback">Về Học viện</button></div>`, { onClose: () => this.stopAll() });
      ui.on(p, '#hagain', () => this.quiz(L));
      ui.on(p, '#hback', () => this.back());
      G.game.checkStory();
    };
    next();
  },

  // ---------- Câu tự luận (không chấm điểm) ----------
  essay(L) {
    const ui = G.ui;
    const qs = this.openQs(L);
    const p = ui.open(`<h2>✍️ Tự luận · ${G.esc(this.levelName(L))}</h2>
      <p class="sub">Tự suy nghĩ (hoặc nói to) câu trả lời trước, rồi mới bấm xem gợi ý. Phần này không chấm điểm.</p>
      ${qs.map((q, k) => `<div class="job"><div class="jt">${G.esc(q.t)} ${this.kindTag(q.k)}</div><div>${G.esc(q.q)}</div>
        <button class="btn small ghost" data-show="${k}">Xem gợi ý đáp án</button>
        <div class="hide" id="ess${k}"><ul class="ans">${q.ans.map((a) => `<li>${G.esc(a)}</li>`).join('')}</ul>${q.note ? `<p class="hint">${G.esc(q.note)}</p>` : ''}<p class="hint">Nguồn: ${this.srcHtml(q.s)}</p></div></div>`).join('')}
      <button class="btn" id="hback">Về Học viện</button>`, { cls: 'wide' });
    ui.on(p, '[data-show]', (x) => { ui.el('ess' + x.dataset.show).classList.remove('hide'); x.remove(); });
    ui.on(p, '#hback', () => this.back());
  },

  // ---------- Phát âm thanh: MP3 nếu có, không thì giọng máy ----------
  playAudio(src, fallbackSegs, onEnd) {
    this.stopAll();
    const tts = () => this.speakSegs(fallbackSegs, onEnd);
    if (!src) return tts();
    const au = new Audio('data/hvac/' + src);
    au.playbackRate = this.rate || 1;
    this.audio = au;
    let fell = false;
    const fall = () => { if (fell || this.audio !== au) return; fell = true; this.audio = null; tts(); };
    au.onerror = fall;
    au.onended = () => onEnd && onEnd();
    const pr = au.play();
    if (pr && pr.catch) pr.catch(fall);
  },
  speakSegs(segs, onEnd) {
    if (!('speechSynthesis' in window)) return;
    G.tts.stop();
    if (!G.tts.voice) G.tts.choose();
    const va = G.tts.voice, vb = G.tts.second();
    const who = {};
    const list = [];
    segs.forEach((sg) => {
      if (!(sg.speaker in who)) who[sg.speaker] = Object.keys(who).length % 2;
      sg.text.split(/\n+/).forEach((part) => part.split(/(?<=[.?!])\s+/).forEach((t) => { if (t.trim()) list.push({ t: t.trim(), alt: who[sg.speaker] }); }));
    });
    list.forEach((it, k) => {
      const u = G.tts.utter(it.t, { voice: it.alt ? vb : va, rate: (this.rate || 1) * 0.92 });
      if (it.alt && vb === va) u.pitch = Math.min(1.4, u.pitch + 0.2);
      if (k === list.length - 1 && onEnd) u.onend = onEnd;
      speechSynthesis.speak(u);
    });
  },

  // ---------- Bài nghe ----------
  passage(p, state) {
    this.stopAll();
    const ui = G.ui, h = this.st();
    const st = state || { marks: {}, showT: false };
    const qhtml = p.questions.map((q, k) => {
      const m = st.marks[k];
      return `<div class="job ${m === true ? 'ok' : m === false ? 'no' : ''}"><div class="jt">${k + 1}. ${G.esc(q.q)} ${ui.sayBtn(q.q)}</div>
        <div class="sbtns">${G.stt.supported ? `<button class="btn small ghost" data-mic="${k}">🎤 Trả lời</button>` : ''}<button class="btn small ghost" data-ans="${k}">Xem đáp án</button></div>
        <div id="lm${k}"></div>
        <div class="${m !== undefined ? '' : 'hide'}" id="la${k}"><div class="wcard"><div class="en">${G.esc(q.answer)} ${ui.sayBtn(q.answer)}</div><div class="ex">${G.esc(q.hint_vi)}</div></div>
          ${m === undefined ? `<div class="sbtns"><button class="btn small" data-mark="${k}:1">✅ Tôi trả lời đúng</button><button class="btn small ghost" data-mark="${k}:0">❌ Chưa đúng</button></div>` : ''}</div></div>`;
    }).join('');
    const pnl = ui.open(`<div class="tag">🎧 ${G.esc(p.level)} · ${G.esc(p.topic)} · ${Math.round(p.duration_s)}s</div>
      <h2>${G.esc(p.title)}</h2><p class="sub">${G.esc(p.vi)}</p>
      <div class="row2"><button class="btn" id="lplay">▶ Nghe bài</button><button class="btn ghost" id="lstop">⏹ Dừng</button><button class="btn ghost" id="lrate">${(this.rate || 1) === 1 ? '🐢 Chậm' : '🐇 Bình thường'}</button></div>
      <button class="btn ghost" id="ltr">${st.showT ? '🙈 Ẩn lời thoại' : '📄 Hiện lời thoại'}</button>
      <div class="${st.showT ? '' : 'hide'}">${p.transcript.map((t) => `<div class="drow"><div class="tagline">${G.esc(t.speaker)}</div>${t.text.split(/\n+/).map((par) => `<p class="tr">${G.esc(par)} ${ui.sayBtn(par)}</p>`).join('')}</div>`).join('')}</div>
      <h3>📚 Từ vựng</h3><div class="need">${p.vocab.map((v) => `<span class="chip">${G.esc(v.term)} = ${G.esc(v.meaning_vi)} ${ui.sayBtn(v.term)}</span>`).join('')}</div>
      <h3>❓ Câu hỏi (${Object.keys(st.marks).length}/${p.questions.length})</h3>${qhtml}
      <button class="btn" id="hback">Về Học viện</button>`, { cls: 'wide', keepScroll: !!state, onClose: () => this.stopAll() });
    const again = () => this.passage(p, st);
    ui.on(pnl, '#lplay', () => this.playAudio(p.audio, p.transcript));
    ui.on(pnl, '#lstop', () => this.stopAll());
    ui.on(pnl, '#lrate', () => { this.rate = (this.rate || 1) === 1 ? 0.8 : 1; again(); });
    ui.on(pnl, '#ltr', () => { st.showT = !st.showT; again(); });
    ui.on(pnl, '[data-ans]', (x) => { ui.el('la' + x.dataset.ans).classList.remove('hide'); });
    ui.on(pnl, '[data-mic]', (x) => {
      const k = +x.dataset.mic;
      ui.speakPractice(p.questions[k].answer, ui.el('lm' + k), () => ui.el('la' + k).classList.remove('hide'));
    });
    ui.on(pnl, '[data-mark]', (x) => {
      const [k, v] = x.dataset.mark.split(':');
      st.marks[+k] = v === '1';
      if (Object.keys(st.marks).length === p.questions.length) return this.finishPassage(p, st);
      again();
    });
    ui.on(pnl, '#hback', () => this.back());
  },
  finishPassage(p, st) {
    const ui = G.ui, h = this.st(), g = G.game;
    const c = Object.values(st.marks).filter(Boolean).length, n = p.questions.length;
    const first = !h.lis[p.id];
    h.lis[p.id] = { c: Math.max(c, (h.lis[p.id] || {}).c || 0), n };
    const learned = p.vocab.filter((v) => g.learnWord(v.term)).map((v) => v.term);
    const xp = (first ? 40 : 10) + c * 8;
    g.addXp(xp); if (first) g.addCoins(30);
    G.audio.sfx('level');
    const pnl = ui.open(`<div class="center"><div class="big-emoji">🎧</div><h2>Hoàn thành bài nghe!</h2><p>${G.esc(p.title)} · tự chấm đúng ${c}/${n}</p><p><b>+${xp} XP${first ? ' · +30 🪙' : ''}</b></p></div>
      ${learned.length ? `<div class="res good">📖 Thêm vào Từ điển (nhóm ❄️ HVAC): ${learned.map(G.esc).join(', ')}</div>` : ''}
      <div class="row2"><button class="btn ghost" id="lagain">🔁 Nghe lại</button><button class="btn" id="hback">Về Học viện</button></div>`);
    ui.on(pnl, '#lagain', () => this.passage(p));
    ui.on(pnl, '#hback', () => this.back());
    g.checkStory();
  },

  // ---------- Luyện phỏng vấn ----------
  interview(it) {
    this.stopAll();
    const ui = G.ui, h = this.st();
    const model = G.esc(it.model_answer).replace(/\[([^\]]+)\]/g, '<mark>[$1]</mark>');
    const p = ui.open(`<div class="tag">🎤 Phỏng vấn · ${G.esc(it.group)}</div>
      <div class="qsent">${G.esc(it.question)} ${ui.sayBtn(it.question)}</div>
      <div class="timer"><div class="bar"><i id="ivbar" style="width:100%"></i></div><span id="ivt">${it.think_time_s}s</span> suy nghĩ</div>
      <div class="sbtns">${G.stt.supported ? '<button class="btn small" id="ivmic">🎤 Trả lời bằng giọng nói</button>' : ''}<button class="btn small ghost" id="ivhint">💡 Gợi ý</button><button class="btn small ghost" id="ivmodel">📄 Câu trả lời mẫu</button></div>
      <div id="ivmicres"></div>
      <div class="hide" id="ivh"><div class="sec"><p>${G.esc(it.hint_vi)}</p></div></div>
      <div class="hide" id="ivm"><div class="wcard"><div class="ex model">${model}</div><button class="btn small ghost" id="ivplay">🔊 Nghe câu mẫu</button></div>
        <p class="hint">Phần <mark>[ngoặc vuông]</mark> là chỗ bạn thay bằng thông tin thật của mình.</p></div>
      <div class="row2"><button class="btn ghost" id="ivnext">Câu khác ›</button><button class="btn" id="hback">Về Học viện</button></div>`, { cls: 'wide', onClose: () => this.stopAll() });
    const mark = () => { if (!h.iv[it.id]) { h.iv[it.id] = true; G.game.addXp(15); } };
    this.playAudio(it.question_audio, [{ speaker: 'Q', text: it.question }]);
    let left = it.think_time_s;
    this.timer = setInterval(() => {
      left--;
      const t = ui.el('ivt'), bar = ui.el('ivbar');
      if (!t) { clearInterval(this.timer); this.timer = null; return; }
      t.textContent = Math.max(0, left) + 's';
      bar.style.width = Math.max(0, left / it.think_time_s * 100) + '%';
      if (left <= 0) { clearInterval(this.timer); this.timer = null; t.textContent = 'Hết giờ — hãy trả lời!'; G.audio.sfx('ok'); }
    }, 1000);
    ui.on(p, '#ivhint', () => ui.el('ivh').classList.remove('hide'));
    ui.on(p, '#ivmodel', () => { ui.el('ivm').classList.remove('hide'); mark(); });
    ui.on(p, '#ivplay', () => this.playAudio(it.answer_audio, [{ speaker: 'A', text: it.model_answer.replace(/\[[^\]]*\]/g, '') }]));
    ui.on(p, '#ivmic', () => {
      const box = ui.el('ivmicres');
      box.innerHTML = '<div class="mic on">🎙️ Đang nghe... hãy trả lời bằng tiếng Anh</div>';
      G.stt.listen((alts) => {
        const said = alts[0] || '';
        const nWords = G.norm(said).split(' ').filter(Boolean).length;
        box.innerHTML = `<div class="mic ${nWords >= 15 ? 'good' : 'bad'}"><b>${nWords} từ</b> — ${nWords >= 25 ? 'Câu trả lời khá đầy đủ!' : nWords >= 15 ? 'Ổn, hãy thử nói dài và chi tiết hơn.' : 'Hơi ngắn — buổi phỏng vấn thật nên trả lời 3–5 câu.'}<br><small>Máy nghe được: “${G.esc(said)}”</small></div>`;
        mark();
      }, (err) => { box.innerHTML = `<div class="mic bad">Không nhận được giọng nói (${G.esc(err)}). Kiểm tra quyền Micro.</div>`; });
    });
    ui.on(p, '#ivnext', () => {
      const list = HVAC_LISTEN.interview;
      const rest = list.filter((x) => !h.iv[x.id] && x !== it);
      this.interview(G.pick(rest.length ? rest : list.filter((x) => x !== it)));
    });
    ui.on(p, '#hback', () => this.back());
  },
};
