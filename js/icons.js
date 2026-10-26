// Vẽ linh kiện, nhân vật bằng code (không cần file ảnh)
G.icons = {};

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
G.rr = rr;

function legs(ctx, xs, y0, y1, col = '#b0b0b0') {
  ctx.strokeStyle = col; ctx.lineWidth = 1.6;
  xs.forEach((x) => { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke(); });
}

// Vẽ linh kiện có tâm (cx, cy), kích thước s (khung 32x32 chuẩn)
G.drawPart = function (ctx, item, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s / 32, s / 32);
  const c = item.color || '#888';
  ctx.lineJoin = 'round';
  switch (item.sym) {
    case 'resistor': {
      ctx.strokeStyle = '#aaa'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(15, 0); ctx.stroke();
      ctx.fillStyle = c; rr(ctx, -9, -5, 18, 10, 4); ctx.fill();
      ['#6d4c41', '#111', '#ff9800', '#d4af37'].forEach((b, i) => { ctx.fillStyle = b; ctx.fillRect(-6 + i * 3.6, -5, 2, 10); });
      break;
    }
    case 'ceramic': {
      legs(ctx, [-3, 3], 2, 14);
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, -3, 8, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(-3, -5, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5a3a10'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('104', 0, -1);
      break;
    }
    case 'elcap': {
      legs(ctx, [-3, 3], 9, 15);
      ctx.fillStyle = c; rr(ctx, -7, -13, 14, 23, 3); ctx.fill();
      ctx.fillStyle = c === '#d8d8d8' ? '#9e9e9e' : '#cfd8dc'; ctx.fillRect(3, -13, 3, 23);
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-7, -13, 14, 2);
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-4, -12); ctx.lineTo(4, -12); ctx.stroke();
      break;
    }
    case 'diode': {
      ctx.strokeStyle = '#aaa'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(15, 0); ctx.stroke();
      ctx.fillStyle = c; rr(ctx, -8, -5, 16, 10, 3); ctx.fill();
      ctx.fillStyle = '#ddd'; ctx.fillRect(4, -5, 2.5, 10);
      break;
    }
    case 'led': {
      legs(ctx, [-3, 3], 4, 15); ctx.beginPath(); ctx.moveTo(3, 4); ctx.lineTo(3, 12); ctx.stroke();
      ctx.fillStyle = c; ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.arc(0, -4, 7, Math.PI, 0); ctx.lineTo(7, 5); ctx.lineTo(-7, 5); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(-3, -6, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c; ctx.fillRect(-8, 4, 16, 2);
      break;
    }
    case 'bridge': {
      legs(ctx, [-6, -2, 2, 6], 6, 15);
      ctx.fillStyle = c; rr(ctx, -11, -11, 22, 18, 2); ctx.fill();
      ctx.fillStyle = '#ccc'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('~ + ~ −', 0, 0);
      break;
    }
    case 'to92': {
      legs(ctx, [-4, 0, 4], 3, 15);
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-7, 4); ctx.lineTo(-7, -5); ctx.arc(0, -5, 7, Math.PI, 0); ctx.lineTo(7, 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#bbb'; ctx.font = '5px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('C1815', 0, 0);
      break;
    }
    case 'to220': {
      legs(ctx, [-5, 0, 5], 6, 15);
      ctx.fillStyle = '#b0b7bd'; rr(ctx, -9, -15, 18, 10, 2); ctx.fill();
      ctx.fillStyle = '#6b7378'; ctx.beginPath(); ctx.arc(0, -11, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c; rr(ctx, -9, -7, 18, 14, 1.5); ctx.fill();
      ctx.fillStyle = '#ccc'; ctx.font = '5px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(item.id === 'reg7805' ? '7805' : item.id === 'igbt' ? 'IGBT' : item.id === 'triac' ? 'BT136' : 'IRF', 0, 2);
      break;
    }
    case 'ic': {
      ctx.fillStyle = '#c0c0c0';
      for (let i = 0; i < 4; i++) { ctx.fillRect(-12, -8 + i * 5, 4, 2); ctx.fillRect(8, -8 + i * 5, 4, 2); }
      ctx.fillStyle = c; rr(ctx, -9, -11, 18, 22, 2); ctx.fill();
      ctx.fillStyle = c === '#f1f1f1' ? '#888' : '#555'; ctx.beginPath(); ctx.arc(-5, -7, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c === '#f1f1f1' ? '#333' : '#aaa'; ctx.font = '5px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(item.id === 'opto' ? 'PC817' : 'MCU', 0, 3);
      break;
    }
    case 'relay': {
      legs(ctx, [-6, -2, 2, 6], 9, 14);
      ctx.fillStyle = c; rr(ctx, -12, -11, 24, 20, 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = 'bold 5px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('RELAY', 0, -3); ctx.fillText('12VDC', 0, 4);
      break;
    }
    case 'fuse': {
      ctx.fillStyle = '#c9c9c9'; ctx.fillRect(-14, -5, 6, 10); ctx.fillRect(8, -5, 6, 10);
      ctx.fillStyle = 'rgba(220,240,255,.6)'; ctx.fillRect(-8, -4, 16, 8);
      ctx.strokeStyle = '#999'; ctx.lineWidth = 1; ctx.strokeRect(-8, -4, 16, 8);
      ctx.strokeStyle = item.id === 'tfuse' ? '#333' : '#777'; ctx.beginPath(); ctx.moveTo(-8, 0);
      for (let i = -6; i <= 8; i += 2) ctx.lineTo(i, i % 4 === 0 ? -1.5 : 1.5);
      ctx.stroke();
      if (item.id === 'tfuse') { ctx.fillStyle = c; ctx.fillRect(-8, -4, 16, 8); ctx.fillStyle = '#fff'; ctx.font = '5px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('72°C', 0, 2); }
      break;
    }
    case 'bead': {
      ctx.strokeStyle = '#c0c0c0'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(-6, 15); ctx.moveTo(2, 0); ctx.lineTo(6, 15); ctx.stroke();
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, -4, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#111'; ctx.fillRect(-12, -14, 24, 5); ctx.fillStyle = '#fff'; ctx.font = '4px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('NTC 10K', 0, -10.5);
      break;
    }
    case 'disc': {
      legs(ctx, [-4, 4], 4, 15);
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, -3, 10, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = (c === '#efefef') ? '#555' : '#ddd'; ctx.font = 'bold 5px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText({ ptc: 'PTC', olp: 'OLP', mov: '14D471', buzzer: '+ BZ' }[item.id] || '', 0, -1);
      break;
    }
    case 'coil': {
      ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = c; ctx.lineWidth = 3;
      for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 5, Math.sin(a) * 5); ctx.lineTo(Math.cos(a) * 12, Math.sin(a) * 12); ctx.stroke(); }
      ctx.fillStyle = '#ddd'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'transformer': {
      ctx.fillStyle = '#555'; ctx.fillRect(-13, -12, 26, 24);
      ctx.fillStyle = '#c0753a'; rr(ctx, -9, -9, 18, 18, 3); ctx.fill();
      ctx.strokeStyle = '#8d4e20'; ctx.lineWidth = 1;
      for (let i = -7; i < 9; i += 3) { ctx.beginPath(); ctx.moveTo(-9, i); ctx.lineTo(9, i); ctx.stroke(); }
      ctx.fillStyle = '#333'; ctx.fillRect(-13, -2, 26, 4);
      break;
    }
    case 'crystal': {
      legs(ctx, [-4, 4], 5, 15);
      ctx.fillStyle = c; rr(ctx, -10, -9, 20, 14, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(-6, -7, 8, 2);
      ctx.fillStyle = '#555'; ctx.font = '5px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('8.000', 0, 1);
      break;
    }
    case 'valve': {
      ctx.fillStyle = '#1e88e5'; ctx.fillRect(-14, -3, 8, 6);
      ctx.fillStyle = c; rr(ctx, -7, -11, 14, 18, 3); ctx.fill();
      ctx.fillStyle = '#9e9e9e'; ctx.fillRect(-7, 3, 14, 4);
      ctx.fillStyle = '#c62828'; ctx.fillRect(-4, -14, 3, 4); ctx.fillRect(1, -14, 3, 4);
      ctx.fillStyle = '#ddd'; ctx.fillRect(7, -2, 7, 4);
      break;
    }
    case 'sensor': {
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#90a4ae'; ctx.fillRect(-2, -16, 4, 6);
      ctx.fillStyle = '#ffb300'; ctx.fillRect(5, 4, 7, 5);
      ctx.fillStyle = '#607d8b'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('LEVEL', 0, 2);
      break;
    }
    case 'heater': {
      ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-14, -8);
      for (let i = 0; i < 4; i++) { ctx.lineTo(12, -8 + i * 5); ctx.lineTo(-12, -5.5 + i * 5); }
      ctx.stroke();
      ctx.fillStyle = '#e53935'; ctx.fillRect(-15, -11, 4, 6);
      break;
    }
    case 'pump': {
      ctx.fillStyle = c; rr(ctx, -12, -8, 16, 16, 3); ctx.fill();
      ctx.fillStyle = '#9e9e9e'; ctx.beginPath(); ctx.arc(8, 0, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#616161'; ctx.fillRect(12, -10, 4, 8);
      ctx.fillStyle = '#ffeb3b'; ctx.fillRect(-10, -12, 3, 4); ctx.fillRect(-5, -12, 3, 4);
      break;
    }
    case 'lock': {
      ctx.fillStyle = c; rr(ctx, -10, -12, 20, 24, 3); ctx.fill();
      ctx.strokeStyle = '#9e9e9e'; ctx.lineWidth = 1.5; ctx.strokeRect(-10, -12, 20, 24);
      ctx.fillStyle = '#424242'; ctx.fillRect(-4, -6, 8, 10);
      ctx.fillStyle = '#ffb300'; ctx.fillRect(-8, 8, 4, 4); ctx.fillRect(-2, 8, 4, 4); ctx.fillRect(4, 8, 4, 4);
      break;
    }
    case 'module': {
      ctx.fillStyle = c; rr(ctx, -14, -11, 28, 22, 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,215,0,.7)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-10, -6); ctx.lineTo(-2, -6); ctx.lineTo(2, 0); ctx.lineTo(10, 0); ctx.moveTo(-10, 6); ctx.lineTo(6, 6); ctx.stroke();
      ctx.fillStyle = '#111'; ctx.fillRect(-4, -9, 9, 7);
      ctx.fillStyle = '#2b4f9e'; ctx.fillRect(-11, 0, 5, 7);
      ctx.fillStyle = '#d9b77e'; ctx.fillRect(4, 3, 7, 3);
      ctx.fillStyle = '#ffeb3b'; ctx.beginPath(); ctx.arc(9, -7, 2, 0, Math.PI * 2); ctx.fill();
      break;
    }
    default: {
      ctx.fillStyle = c; rr(ctx, -10, -10, 20, 20, 4); ctx.fill();
    }
  }
  ctx.restore();
};

// ---------- Nông sản ----------
G.drawCropIcon = function (ctx, crop, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s / 32, s / 32);
  const OL = 'rgba(40,25,10,.55)';
  ctx.lineWidth = 1.2; ctx.strokeStyle = OL;
  const leaf = (x, y, a, l = 7, w = 3, col = '#43a047') => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, -l / 2, w, l / 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  };
  const shine = (x, y, r) => { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.6, -0.6, 0, Math.PI * 2); ctx.fill(); };
  switch (crop.id) {
    case 'radish':
      leaf(-3, -4, -0.5, 10); leaf(3, -4, 0.5, 10); leaf(0, -5, 0, 11, 3, '#66bb6a');
      ctx.fillStyle = crop.color; ctx.beginPath(); ctx.arc(0, 4, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-2, 11); ctx.lineTo(0, 15); ctx.lineTo(2, 11); ctx.fill();
      shine(-3, 1, 2.5); break;
    case 'lettuce':
      ['#9ccc65', '#8bc34a', '#7cb342', '#aed581'].forEach((c, i) => {
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(Math.cos(i * 1.6) * 5, 2 + Math.sin(i * 1.6) * 4, 8 - i, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      });
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.moveTo(0, 9); ctx.lineTo(0, -4); ctx.stroke(); break;
    case 'carrot':
      leaf(-2, -7, -0.4, 9); leaf(2, -7, 0.4, 9); leaf(0, -8, 0, 10, 2.5, '#66bb6a');
      ctx.fillStyle = crop.color; ctx.beginPath(); ctx.moveTo(-6, -7); ctx.lineTo(6, -7); ctx.lineTo(0.5, 15); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(120,50,0,.5)'; [[-3, -2], [2, 2], [-1, 7]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 3, y); ctx.stroke(); }); break;
    case 'tomato':
      ctx.fillStyle = crop.color; ctx.beginPath(); ctx.ellipse(0, 2, 11, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      for (let i = 0; i < 5; i++) leaf(0, -7, i * 1.256, 6, 2, '#2e7d32');
      shine(-4, -1, 3); break;
    case 'cucumber':
      ctx.save(); ctx.rotate(-0.6);
      ctx.fillStyle = crop.color; ctx.beginPath(); ctx.ellipse(0, 0, 5.5, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#a5d6a7'; [[-2, -6], [2, -1], [-1, 5], [2, 9], [-2, 1]].forEach(([x, y]) => ctx.fillRect(x, y, 1.5, 1.5));
      ctx.restore(); break;
    case 'corn':
      ctx.fillStyle = crop.color; ctx.beginPath(); ctx.ellipse(0, -1, 6, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(200,140,0,.5)';
      for (let y = -10; y < 10; y += 3) for (let x = -4; x <= 3; x += 3) ctx.fillRect(x, y, 2, 2);
      ctx.fillStyle = '#66bb6a';
      ctx.beginPath(); ctx.moveTo(-1, 13); ctx.quadraticCurveTo(-12, 4, -6, -10); ctx.quadraticCurveTo(-5, 5, 0, 13); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(1, 13); ctx.quadraticCurveTo(12, 4, 6, -10); ctx.quadraticCurveTo(5, 5, 0, 13); ctx.fill(); ctx.stroke(); break;
    case 'chili':
      ctx.fillStyle = crop.color; ctx.beginPath(); ctx.moveTo(-3, -8); ctx.quadraticCurveTo(10, -6, 6, 14); ctx.quadraticCurveTo(-2, 2, -3, -8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2e7d32'; ctx.fillRect(-6, -11, 6, 4); ctx.strokeRect(-6, -11, 6, 4);
      shine(1, -3, 2); break;
    case 'strawberry':
      ctx.fillStyle = crop.color; ctx.beginPath(); ctx.moveTo(-10, -4); ctx.quadraticCurveTo(0, -10, 10, -4); ctx.quadraticCurveTo(8, 8, 0, 14); ctx.quadraticCurveTo(-8, 8, -10, -4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffeb3b'; [[-5, -1], [0, -2], [5, -1], [-3, 4], [3, 4], [0, 9], [-6, 3], [6, 3]].forEach(([x, y]) => ctx.fillRect(x, y, 1.5, 2));
      for (let i = 0; i < 5; i++) leaf(0, -6, -1.2 + i * 0.6, 5, 2, '#2e7d32'); break;
    case 'pumpkin':
      ctx.fillStyle = crop.color;
      [-6, 6, 0].forEach((x) => { ctx.beginPath(); ctx.ellipse(x, 3, 7, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
      ctx.fillStyle = '#6d4c41'; ctx.fillRect(-1.5, -10, 3, 5); leaf(3, -7, 1, 6, 2.5);
      shine(-2, -1, 2.5); break;
    case 'watermelon':
      ctx.fillStyle = crop.color; ctx.beginPath(); ctx.ellipse(0, 2, 13, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#1b5e20'; ctx.lineWidth = 2;
      [-8, -3, 2, 7].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, -8); ctx.quadraticCurveTo(x + 3, 2, x, 12); ctx.stroke(); });
      shine(-5, -3, 3); break;
    default:
      ctx.fillStyle = crop.color; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
};

// Cây trên ruộng theo giai đoạn (0 hạt, 1 mầm, 2 đang lớn, 3 chín). (cx, cy) = tâm ô.
G.drawPlant = function (ctx, crop, stage, cx, cy, t) {
  ctx.save();
  ctx.translate(cx, cy + 9); ctx.scale(1.3, 1.3); ctx.translate(-cx, -(cy + 9));
  G.drawPlantInner(ctx, crop, stage, cx, cy, t);
  ctx.restore();
};
G.drawPlantInner = function (ctx, crop, stage, cx, cy, t) {
  const sway = Math.sin(t * 2 + cx * 0.1) * 0.08;
  const leafAt = (x, y, a, l, w, col) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a + sway);
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, -l / 2, w, l / 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(20,60,20,.45)'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.restore();
  };
  const by = cy + 9;
  if (stage === 0) {
    ctx.fillStyle = '#5d4037'; ctx.beginPath(); ctx.ellipse(cx, by - 2, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
    leafAt(cx - 1, by - 3, -0.7, 5, 1.6, '#81c784'); leafAt(cx + 1, by - 3, 0.7, 5, 1.6, '#81c784');
    return;
  }
  if (stage === 1) {
    leafAt(cx, by, -0.6, 10, 3, '#66bb6a'); leafAt(cx, by, 0.6, 10, 3, '#66bb6a'); leafAt(cx, by, 0, 12, 2.5, '#81c784');
    return;
  }
  const big = stage === 3;
  switch (crop.shape) {
    case 'root': case 'leafy':
      for (let i = 0; i < 5; i++) leafAt(cx, by, -1 + i * 0.5, big ? 16 : 13, 3.5, i % 2 ? '#43a047' : '#66bb6a');
      if (big) G.drawCropIcon(ctx, crop, cx, by - 3, crop.shape === 'leafy' ? 20 : 14);
      break;
    case 'tall':
      ctx.strokeStyle = '#558b2f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, by); ctx.lineTo(cx + sway * 20, by - (big ? 30 : 22)); ctx.stroke();
      for (let i = 0; i < 4; i++) leafAt(cx, by - 4 - i * 6, i % 2 ? 0.9 : -0.9, 14, 2.5, '#7cb342');
      if (big) G.drawCropIcon(ctx, crop, cx + 5, by - 18, 14);
      break;
    case 'vine': case 'big':
      for (let i = 0; i < 6; i++) leafAt(cx + (i - 2.5) * 3, by, -1.2 + i * 0.48, 12, 4, i % 2 ? '#388e3c' : '#4caf50');
      if (big) G.drawCropIcon(ctx, crop, cx + 2, by - 6, crop.shape === 'big' ? 22 : 16);
      break;
    case 'low':
      for (let i = 0; i < 6; i++) leafAt(cx, by - 2, i * 1.05, 9, 4, '#43a047');
      if (big) { G.drawCropIcon(ctx, crop, cx - 6, by - 4, 10); G.drawCropIcon(ctx, crop, cx + 6, by - 6, 10); G.drawCropIcon(ctx, crop, cx, by - 10, 10); }
      break;
    default: // bush
      ctx.fillStyle = '#388e3c'; ctx.beginPath(); ctx.arc(cx - 5, by - 10, 7, 0, Math.PI * 2); ctx.arc(cx + 5, by - 10, 7, 0, Math.PI * 2); ctx.arc(cx, by - 16, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#6d4c41'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, by); ctx.lineTo(cx, by - 8); ctx.stroke();
      if (big) [[-5, -9], [5, -11], [0, -17]].forEach(([x, y]) => G.drawCropIcon(ctx, crop, cx + x, by + y, 9));
  }
};

// ---------- Vật phẩm (dùng chung cho thế giới & giao diện) ----------
G.drawItem = function (ctx, item, cx, cy, s) {
  if (!item) return;
  if (item.kind === 'crop') return G.drawCropIcon(ctx, G.cropById[item.crop], cx, cy, s);
  if (item.kind === 'seed') {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s / 32, s / 32);
    ctx.fillStyle = '#f3e5c0'; rr(ctx, -10, -13, 20, 26, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(80,50,10,.5)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = item.color; ctx.fillRect(-10, -13, 20, 6);
    ctx.fillStyle = '#6d4c41'; [[-6, 9], [-2, 10], [3, 9], [6, 10]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(x, y, 1.4, 1, 0.4, 0, Math.PI * 2); ctx.fill(); });
    ctx.restore();
    G.drawCropIcon(ctx, G.cropById[item.crop], cx, cy - s * 0.02, s * 0.45);
    return;
  }
  if (item.sym === 'can') {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s / 32, s / 32);
    ctx.strokeStyle = 'rgba(0,40,70,.6)'; ctx.lineWidth = 1.3;
    ctx.fillStyle = '#0288d1'; ctx.beginPath(); ctx.moveTo(6, -1); ctx.lineTo(15, -9); ctx.lineTo(16, -7); ctx.lineTo(8, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = item.color; rr(ctx, -11, -6, 18, 17, 3); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#0277bd'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-2, -6, 7, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(-9, -4, 3, 12);
    ctx.fillStyle = '#4fc3f7'; ctx.beginPath(); ctx.arc(17, -4, 1.5, 0, Math.PI * 2); ctx.arc(14, 0, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return;
  }
  if (item.sym === 'fert') {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s / 32, s / 32);
    ctx.fillStyle = item.color; ctx.beginPath(); ctx.moveTo(-10, -9); ctx.lineTo(10, -9); ctx.lineTo(12, 13); ctx.lineTo(-12, 13); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(40,20,0,.55)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#a1887f'; ctx.fillRect(-10, -13, 20, 5);
    ctx.fillStyle = '#c5e1a5'; rr(ctx, -7, -3, 14, 10, 2); ctx.fill();
    ctx.fillStyle = '#33691e'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('NPK', 0, 4);
    ctx.restore();
    return;
  }
  G.drawPart(ctx, item, cx, cy, s);
};

// Ảnh vật phẩm cho giao diện HTML (cache dataURL)
G.icons.cache = {};
G.partImg = function (id, size = 48) {
  const key = id + '@' + size;
  if (G.icons.cache[key]) return G.icons.cache[key];
  const item = G.itemInfo(id);
  const c = document.createElement('canvas');
  const d = 2;
  c.width = c.height = size * d;
  const x = c.getContext('2d');
  x.scale(d, d);
  if (item) G.drawItem(x, item, size / 2, size / 2, size * 0.9);
  const url = c.toDataURL();
  G.icons.cache[key] = url;
  return url;
};

// ---------- Đèn đường ----------
G.drawLamp = function (ctx, x, y, on, t) {
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x + 3, y + 1, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#37474f'; rr(ctx, x - 4, y - 4, 8, 5, 2); ctx.fill();
  ctx.fillStyle = '#455a64'; ctx.fillRect(x - 1.5, y - 38, 3, 35);
  ctx.fillStyle = '#607d8b'; ctx.fillRect(x - 0.5, y - 38, 1, 35);
  ctx.fillStyle = '#37474f'; rr(ctx, x - 6, y - 44, 12, 4, 2); ctx.fill();
  ctx.fillStyle = on ? '#fff59d' : '#cfd8dc';
  ctx.beginPath(); ctx.moveTo(x - 5, y - 40); ctx.lineTo(x + 5, y - 40); ctx.lineTo(x + 3, y - 33); ctx.lineTo(x - 3, y - 33); ctx.closePath(); ctx.fill();
  if (on) { ctx.fillStyle = 'rgba(255,240,150,.35)'; ctx.beginPath(); ctx.arc(x, y - 37, 9 + Math.sin(t * 3) * 0.6, 0, Math.PI * 2); ctx.fill(); }
};

// ---------- Nhân vật (có viền, đổ bóng, 4 hướng) ----------
// look: {skin, hair, shirt, pants, shoes, cap, long, glasses, logo, belt, tool}
G.drawChar = function (ctx, x, y, dir, frame, look, scale = 1) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale, scale);
  const step = frame ? Math.sin(frame) : 0;
  const bob = Math.abs(step) * 1.4;
  const OL = 'rgba(28,22,38,.8)';
  ctx.lineJoin = 'round'; ctx.lineWidth = 1.2; ctx.strokeStyle = OL;
  const box = (x0, y0, w, h, col, r = 1.5) => { ctx.fillStyle = col; rr(ctx, x0, y0, w, h, r); ctx.fill(); ctx.stroke(); };
  const shoes = look.shoes || '#3e2723';
  // bóng
  ctx.fillStyle = 'rgba(0,0,0,.24)';
  ctx.beginPath(); ctx.ellipse(0, 1, 10, 3.6, 0, 0, Math.PI * 2); ctx.fill();

  if (dir === 1) ctx.scale(-1, 1); // vẽ hướng phải rồi lật
  const side = dir === 1 || dir === 2;

  // chân
  if (side) {
    const a = step * 3.5;
    box(-3 - a, -10, 4.5, 9, look.pants); box(-3.5 - a, -2.5, 6.5, 3.5, shoes, 1.5);
    box(-1.5 + a, -10, 4.5, 9, look.pants); box(-1.5 + a, -2.5, 6.5, 3.5, shoes, 1.5);
  } else {
    const l = step > 0 ? 1.5 : 0, r = step < 0 ? 1.5 : 0;
    box(-5.5, -10, 4.5, 9 - l, look.pants); box(1, -10, 4.5, 9 - r, look.pants);
    box(-6, -2.5 - l, 5.5, 3.5, shoes); box(0.5, -2.5 - r, 5.5, 3.5, shoes);
  }
  ctx.translate(0, -bob);

  // túi đồ nghề sau lưng
  if (look.tool && (dir === 3 || side)) {
    ctx.fillStyle = '#ef6c00';
    if (dir === 3) { box(-6, -20, 12, 10, '#ef6c00', 2); ctx.fillStyle = '#ffb74d'; ctx.fillRect(-4, -17, 8, 2); }
    else box(-10, -19, 5, 9, '#ef6c00', 1.5);
  }

  // thân
  const bw = side ? 11 : 15;
  box(-bw / 2, -22, bw, 14, look.shirt, 3.5);
  ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(bw / 2 - 3.5, -20, 2.5, 11);
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-bw / 2 + 1.5, -20, 2, 10);
  if (look.belt) { ctx.fillStyle = look.belt; ctx.fillRect(-bw / 2 + 0.6, -10.5, bw - 1.2, 2.2); }
  if (dir === 0) { // cổ áo
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    ctx.beginPath(); ctx.moveTo(-3, -22); ctx.lineTo(0, -18.5); ctx.lineTo(3, -22); ctx.closePath(); ctx.fill();
    if (look.logo) { ctx.fillStyle = look.logo; ctx.fillRect(2, -18, 3.5, 2.5); }
  }
  // tay
  if (side) {
    const a = -step * 3;
    ctx.save(); ctx.translate(0, -20); ctx.rotate(a * 0.12);
    box(-2, 0, 4.5, 6, look.shirt, 1.5); box(-1.8, 5, 4, 4.5, look.skin, 2);
    ctx.restore();
  } else {
    const a = step * 2.5;
    box(-10, -21 + a, 4, 6, look.shirt, 1.5); box(-9.8, -16 + a, 3.6, 4.5, look.skin, 2);
    box(6, -21 - a, 4, 6, look.shirt, 1.5); box(6.2, -16 - a, 3.6, 4.5, look.skin, 2);
  }

  // đầu
  ctx.fillStyle = look.skin; ctx.beginPath(); ctx.arc(0, -30, 8.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // tóc
  ctx.fillStyle = look.hair;
  if (dir === 3) {
    ctx.beginPath(); ctx.arc(0, -30.5, 8.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (look.long) { box(-8, -31, 16, 11, look.hair, 3); }
  } else if (side) {
    ctx.beginPath(); ctx.arc(0, -31, 8.8, Math.PI * 0.95, Math.PI * 2.05); ctx.lineTo(-2, -28); ctx.lineTo(-8.5, -27); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (look.long) box(-8.5, -31, 6, 12, look.hair, 2);
  } else {
    ctx.beginPath(); ctx.arc(0, -31, 8.8, Math.PI, 0); ctx.lineTo(8.5, -28);
    ctx.quadraticCurveTo(3, -31, 0, -28.5); ctx.quadraticCurveTo(-3, -31, -8.5, -28); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (look.long) { box(-9.5, -31, 3.5, 12, look.hair, 1.5); box(6, -31, 3.5, 12, look.hair, 1.5); }
  }
  ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.ellipse(-3, -36, 3, 1.5, -0.4, 0, Math.PI * 2); ctx.fill();
  // mũ lưỡi trai
  if (look.cap) {
    ctx.fillStyle = look.cap;
    ctx.beginPath(); ctx.arc(0, -32, 9, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (dir === 0) { box(-8, -33, 16, 3, look.cap, 1.5); }
    else if (side) { box(2, -33, 10, 3, look.cap, 1.5); }
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(-3, -39, 5, 2);
  }
  // mặt
  if (dir === 0) {
    ctx.fillStyle = '#1b1b1b';
    ctx.beginPath(); ctx.ellipse(-3.2, -28.5, 1.2, 1.7, 0, 0, Math.PI * 2); ctx.ellipse(3.2, -28.5, 1.2, 1.7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(-3.5, -29.6, 0.8, 0.8); ctx.fillRect(2.9, -29.6, 0.8, 0.8);
    ctx.fillStyle = 'rgba(255,110,110,.35)'; ctx.beginPath(); ctx.arc(-5.2, -25.8, 1.6, 0, Math.PI * 2); ctx.arc(5.2, -25.8, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(90,40,30,.8)'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(0, -26, 1.8, 0.2, Math.PI - 0.2); ctx.stroke();
    if (look.glasses) { ctx.strokeStyle = '#212121'; ctx.lineWidth = 0.9; ctx.strokeRect(-5.5, -30.5, 4.5, 3.6); ctx.strokeRect(1, -30.5, 4.5, 3.6); ctx.beginPath(); ctx.moveTo(-1, -29); ctx.lineTo(1, -29); ctx.stroke(); }
  } else if (side) {
    ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.ellipse(4.2, -28.5, 1.1, 1.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,110,110,.35)'; ctx.beginPath(); ctx.arc(3.5, -25.5, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = look.skin; ctx.beginPath(); ctx.arc(8.4, -27.5, 1.5, -1.2, 1.4); ctx.fill();
    if (look.glasses) { ctx.strokeStyle = '#212121'; ctx.lineWidth = 0.9; ctx.strokeRect(2.3, -30.5, 4.5, 3.6); }
  }
  ctx.restore();
};

G.PLAYER_LOOK = { skin: '#f6cba4', hair: '#2b1d14', shirt: '#1565c0', pants: '#263238', shoes: '#212121', cap: '#e53935', logo: '#fff', belt: '#0d47a1', tool: true };
G.NPC_LOOKS = [
  { skin: '#f1c27d', hair: '#3b2a1a', shirt: '#43a047', pants: '#5d4037' },
  { skin: '#e0ac69', hair: '#111', shirt: '#e91e63', pants: '#37474f', long: true },
  { skin: '#ffdbac', hair: '#6d4c41', shirt: '#ffb300', pants: '#1a237e', glasses: true },
  { skin: '#c68642', hair: '#1b1b1b', shirt: '#8e24aa', pants: '#263238', long: true },
  { skin: '#f1c27d', hair: '#9e9e9e', shirt: '#795548', pants: '#424242', glasses: true },
  { skin: '#ffdbac', hair: '#212121', shirt: '#00acc1', pants: '#4e342e', cap: '#00796b' },
  { skin: '#e0ac69', hair: '#4e342e', shirt: '#f4511e', pants: '#212121', long: true },
  { skin: '#f6cba4', hair: '#c0832f', shirt: '#5c6bc0', pants: '#37474f', long: true, glasses: true },
];
