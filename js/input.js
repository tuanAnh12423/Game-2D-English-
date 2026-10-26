// Điều khiển cảm ứng: cần điều khiển ảo (nửa trái màn hình) + nút hành động.
// Bàn phím (WASD / mũi tên / Space) để thử trên máy tính.
G.input = {
  vx: 0, vy: 0, joyId: null, keys: {}, actionPressed: false,

  init() {
    const zone = document.getElementById('joyzone');
    const base = document.getElementById('joy');
    const knob = document.getElementById('joyknob');
    const R = 52;
    let ox = 0, oy = 0;
    const move = (e) => {
      const dx = e.clientX - ox, dy = e.clientY - oy;
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / R);
      this.vx = (dx / d) * k; this.vy = (dy / d) * k;
      if (d < 8) { this.vx = 0; this.vy = 0; }
      knob.style.transform = `translate(${(dx / d) * k * R}px, ${(dy / d) * k * R}px)`;
    };
    zone.addEventListener('pointerdown', (e) => {
      G.audio.unlock();
      if (this.joyId !== null) return;
      this.joyId = e.pointerId;
      zone.setPointerCapture(e.pointerId);
      ox = e.clientX; oy = e.clientY;
      base.style.left = ox + 'px'; base.style.top = oy + 'px';
      base.classList.add('on');
      knob.style.transform = 'translate(0,0)';
      e.preventDefault();
    });
    zone.addEventListener('pointermove', (e) => { if (e.pointerId === this.joyId) { move(e); e.preventDefault(); } });
    const end = (e) => {
      if (e.pointerId !== this.joyId) return;
      this.joyId = null; this.vx = 0; this.vy = 0;
      base.classList.remove('on');
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
    zone.addEventListener('lostpointercapture', end);

    document.getElementById('btnA').addEventListener('pointerdown', (e) => {
      e.preventDefault(); G.audio.unlock(); this.actionPressed = true;
    });

    window.addEventListener('keydown', (e) => {
      if (G.ui && G.ui.isOpen()) { if (e.key === 'Escape') G.ui.close(); return; }
      this.keys[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key === 'e' || e.key === 'Enter') { this.actionPressed = true; e.preventDefault(); }
    });
    window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
    // chặn zoom/cuộn trên iOS
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('dblclick', (e) => e.preventDefault());
  },

  axis() {
    let x = this.vx, y = this.vy;
    const k = this.keys;
    const kx = (k['arrowright'] || k['d'] ? 1 : 0) - (k['arrowleft'] || k['a'] ? 1 : 0);
    const ky = (k['arrowdown'] || k['s'] ? 1 : 0) - (k['arrowup'] || k['w'] ? 1 : 0);
    if (kx || ky) { const d = Math.hypot(kx, ky); x = kx / d; y = ky / d; }
    return { x, y };
  },
  takeAction() { const a = this.actionPressed; this.actionPressed = false; return a; },
  reset() { this.vx = 0; this.vy = 0; this.keys = {}; this.actionPressed = false; },
};
