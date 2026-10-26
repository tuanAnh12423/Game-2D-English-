// Khởi động game
(function () {
  G.clock.init();
  G.weather.init();
  G.indexData();
  G.tts.init();
  G.world.build();
  G.input.init();
  G.game.resize();
  window.addEventListener('resize', () => G.game.resize());
  window.addEventListener('orientationchange', () => setTimeout(() => G.game.resize(), 200));

  const menu = (id, fn) => document.getElementById(id).addEventListener('click', () => { G.audio.unlock(); G.audio.sfx('click'); fn(); });
  menu('mDict', () => G.ui.dictionary());
  menu('mBag', () => G.ui.bag());
  menu('mQuest', () => G.ui.quests());
  menu('mMap', () => G.ui.map());
  menu('mSet', () => G.ui.settings());
  document.getElementById('mini').addEventListener('click', () => { G.audio.unlock(); G.ui.map(); });
  document.getElementById('hQuest').addEventListener('click', () => { G.audio.unlock(); G.ui.quests(); });
  document.getElementById('hotbar').addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-i]');
    if (!b) return;
    e.preventDefault(); G.audio.unlock();
    G.ui.hotbarTap(+b.dataset.i);
  });
  document.getElementById('phone').addEventListener('click', () => { G.audio.unlock(); if (!G.ui.isOpen()) G.game.answerPhone(); });

  // màn hình tiêu đề
  const title = document.getElementById('title');
  const hasSave = !!G.store.load();
  document.getElementById('tContinue').style.display = hasSave ? '' : 'none';
  document.getElementById('tNew').textContent = hasSave ? 'Chơi mới' : 'Bắt đầu chơi';
  if (!hasSave) document.getElementById('tNew').classList.remove('ghost');
  const go = (fresh) => {
    G.audio.unlock();
    if (fresh && hasSave && !confirm('Bắt đầu lại sẽ xoá tiến trình cũ. Tiếp tục?')) return;
    if (fresh) G.store.clear();
    title.classList.add('hide');
    G.game.start(fresh);
    G.tts.speak(fresh || !hasSave ? 'Welcome, technician!' : 'Welcome back!');
  };
  document.getElementById('tContinue').addEventListener('click', () => go(false));
  document.getElementById('tNew').addEventListener('click', () => go(true));

  const saveNow = () => { if (G.game.running) G.game.save(); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });
  window.addEventListener('pagehide', saveNow);

  requestAnimationFrame(G.game.loop);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
