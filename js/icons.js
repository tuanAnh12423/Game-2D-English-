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
  if (item.emoji) {
    ctx.save(); ctx.font = Math.round(s * 0.78) + 'px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000'; ctx.fillText(item.emoji, cx, cy + s * 0.04); ctx.restore();
    return;
  }
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
  const OL = 'rgba(120,70,100,.55)';
  ctx.fillStyle = 'rgba(120,70,110,.16)'; ctx.beginPath(); ctx.ellipse(x + 3, y + 1, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f7c6d9'; rr(ctx, x - 4.5, y - 5, 9, 6, 3); ctx.fill();
  ctx.fillStyle = '#ffffff'; rr(ctx, x - 1.8, y - 36, 3.6, 33, 1.8); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#ffb3d1'; for (let k = 0; k < 4; k++) ctx.fillRect(x - 1.8, y - 31 + k * 7, 3.6, 2);
  // chụp đèn hình giọt có nơ
  ctx.fillStyle = on ? '#fff3b0' : '#fffafc';
  ctx.beginPath(); ctx.arc(x, y - 41, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.ellipse(x, y - 47, 6, 2.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  G.bow(ctx, x, y - 36, '#ff8fab');
  if (on) { ctx.fillStyle = 'rgba(255,236,170,.4)'; ctx.beginPath(); ctx.arc(x, y - 41, 11 + Math.sin(t * 3) * 0.8, 0, Math.PI * 2); ctx.fill(); }
};

// ---------- Nhân vật (có viền, đổ bóng, 4 hướng) ----------
// look: {skin, hair, shirt, pants, shoes, cap, long, glasses, logo, belt, tool,
//        top: tee|polo|shirt|hoodie|jacket|dress, bottom: pants|shorts|skirt,
//        shoeType: shoe|boot|sandal, hat: cap|sun|beanie, glasses: true|'sun', bag: màu ba lô}
G.drawChar = function (ctx, x, y, dir, frame, look, scale = 1) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale, scale);
  const step = frame ? Math.sin(frame) : 0;
  const bob = Math.abs(step) * 1.6;
  const OL = 'rgba(110,62,84,.78)'; // viền nâu tím mềm (dễ thương hơn viền đen)
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = 1.3; ctx.strokeStyle = OL;
  const box = (x0, y0, w, h, col, r = 2) => { ctx.fillStyle = col; rr(ctx, x0, y0, w, h, Math.min(r, w / 2, h / 2)); ctx.fill(); ctx.stroke(); };
  const top = look.top || 'tee', bottom = top === 'dress' ? 'none' : (look.bottom || 'pants');
  const shoeT = look.shoeType || 'shoe', shoes = look.shoes || '#8d6e63';
  const legCol = bottom === 'pants' ? look.pants : look.skin;
  // bóng
  ctx.fillStyle = 'rgba(120,70,110,.18)';
  ctx.beginPath(); ctx.ellipse(0, 1, 10, 3.6, 0, 0, Math.PI * 2); ctx.fill();

  if (dir === 1) ctx.scale(-1, 1); // vẽ hướng phải rồi lật
  const side = dir === 1 || dir === 2;
  // giày tròn tròn
  const shoe = (x0, y0) => {
    const w = side ? 6.5 : 5.5;
    if (shoeT === 'boot') box(x0, y0 - 3, w, 6.5, shoes, 2.5);
    else if (shoeT === 'sandal') { box(x0, y0 + 1, w, 2.4, shoes, 1.2); ctx.fillStyle = look.skin; ctx.fillRect(x0 + 1, y0, w - 2, 1.3); }
    else { box(x0, y0, w, 3.6, shoes, 1.8); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(x0 + 1, y0 + 0.7, w - 3, 1); }
  };
  const leg = (x0, y0, w, h) => {
    box(x0, y0, w, h, legCol, 2);
    if (bottom === 'shorts') box(x0, y0, w, 4, look.pants, 1.5);
  };
  // chân ngắn
  if (side) {
    const a = step * 3;
    leg(-3 - a, -9, 4.5, 8); shoe(-3.5 - a, -2.5);
    leg(-1.5 + a, -9, 4.5, 8); shoe(-1.5 + a, -2.5);
  } else {
    const l = step > 0 ? 1.4 : 0, r = step < 0 ? 1.4 : 0;
    leg(-5, -9, 4.3, 8 - l); leg(0.7, -9, 4.3, 8 - r);
    shoe(-5.6, -2.5 - l); shoe(0.2, -2.5 - r);
  }
  ctx.translate(0, -bob);
  const bw = side ? 11 : 14;

  const flare = (col, y0, y1) => {
    ctx.fillStyle = col; ctx.beginPath();
    ctx.moveTo(-bw / 2 + 0.5, y0); ctx.lineTo(bw / 2 - 0.5, y0); ctx.lineTo(bw / 2 + 3, y1); ctx.quadraticCurveTo(0, y1 + 2, -bw / 2 - 3, y1); ctx.closePath();
    ctx.fill(); ctx.stroke();
  };
  if (bottom === 'skirt') flare(look.pants, -11, -4);
  if (top === 'dress') flare(look.shirt, -12, -3.5);

  const bagCol = look.bag || (look.tool ? '#ffab76' : null);
  if (bagCol && side) box(-10, -18, 5, 8.5, bagCol, 2.5);
  if (top === 'hoodie' && !side && dir !== 3) { ctx.fillStyle = G.shade(look.shirt, -0.12); ctx.beginPath(); ctx.ellipse(0, -20, 7.5, 3.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }

  // thân tròn trịa
  box(-bw / 2, -20, bw, top === 'dress' ? 9 : 12.5, look.shirt, 4.5);
  ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.ellipse(-bw / 2 + 3.5, -16, 1.6, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  if (look.belt && bottom === 'pants') { ctx.fillStyle = look.belt; ctx.fillRect(-bw / 2 + 0.8, -9.8, bw - 1.6, 2); }
  if (dir === 0) {
    const light = G.shade(look.shirt, 0.5), dark = G.shade(look.shirt, -0.25);
    if (look.logo) {
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.moveTo(-3, -20); ctx.lineTo(0, -17); ctx.lineTo(3, -20); ctx.closePath(); ctx.fill();
      G.heart(ctx, 3.6, -15.5, 2.1, look.logo === '#fff' ? '#ff8fab' : look.logo);
    } else if (top === 'tee' || top === 'dress') {
      ctx.fillStyle = look.skin; ctx.beginPath(); ctx.arc(0, -20, 2.4, 0, Math.PI); ctx.fill();
      if (top === 'dress') { ctx.fillStyle = light; G.heart(ctx, 0, -14, 2, light); }
    } else if (top === 'polo' || top === 'shirt') {
      ctx.fillStyle = light;
      ctx.beginPath(); ctx.moveTo(-4, -20); ctx.lineTo(-0.5, -17.2); ctx.lineTo(-1.5, -20); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(4, -20); ctx.lineTo(0.5, -17.2); ctx.lineTo(1.5, -20); ctx.closePath(); ctx.fill();
      ctx.fillStyle = dark; const n = top === 'shirt' ? 3 : 2;
      for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(0, -16.5 + i * 2.7, 0.7, 0, Math.PI * 2); ctx.fill(); }
    } else if (top === 'hoodie') {
      ctx.fillStyle = dark; rr(ctx, -4.5, -14, 9, 4, 2); ctx.fill();
      ctx.strokeStyle = light; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-1.5, -19); ctx.lineTo(-1.5, -15.5); ctx.moveTo(1.5, -19); ctx.lineTo(1.5, -15.5); ctx.stroke(); ctx.strokeStyle = OL; ctx.lineWidth = 1.3;
    } else if (top === 'jacket') {
      ctx.fillStyle = '#fffafc'; ctx.fillRect(-2, -19.5, 4, 11);
      ctx.fillStyle = dark; ctx.fillRect(-2.6, -19.5, 0.8, 11); ctx.fillRect(1.8, -19.5, 0.8, 11);
    }
  }
  if (top === 'hoodie' && dir === 3) { ctx.fillStyle = G.shade(look.shirt, -0.12); rr(ctx, -6, -22, 12, 7, 3.5); ctx.fill(); ctx.stroke(); }
  // tay ngắn mũm mĩm
  const longSl = top === 'hoodie' || top === 'jacket' || top === 'shirt';
  const arm = (x0, y0) => {
    if (longSl) { box(x0, y0, 4, 8.5, look.shirt, 2); ctx.fillStyle = look.skin; ctx.beginPath(); ctx.arc(x0 + 2, y0 + 9, 2.1, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    else { box(x0, y0, 4, 4.8, look.shirt, 2); box(x0 + 0.3, y0 + 4.3, 3.4, 4.6, look.skin, 1.8); }
  };
  if (side) {
    ctx.save(); ctx.translate(0, -18.5); ctx.rotate(-step * 0.36);
    arm(-2, 0);
    ctx.restore();
  } else {
    const a = step * 2.2;
    arm(-9.5, -19 + a); arm(5.5, -19 - a);
  }
  if (bagCol && dir === 3) { box(-6, -19.5, 12, 10.5, bagCol, 3.5); ctx.fillStyle = 'rgba(255,255,255,.35)'; rr(ctx, -4, -16.5, 8, 2.2, 1); ctx.fill(); }

  // ĐẦU TO (chibi)
  const HY = -31, HR = 10.5;
  ctx.fillStyle = look.skin; ctx.beginPath(); ctx.arc(0, HY, HR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // tóc
  ctx.fillStyle = look.hair;
  if (dir === 3) {
    ctx.beginPath(); ctx.arc(0, HY - 0.5, HR + 0.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (look.long) { box(-9.5, HY, 19, 13, look.hair, 5); }
  } else if (side) {
    ctx.beginPath(); ctx.arc(0, HY - 1, HR + 0.6, Math.PI * 0.92, Math.PI * 2.08); ctx.lineTo(1, HY + 1); ctx.quadraticCurveTo(-4, HY + 3, -10.5, HY + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (look.long) box(-10.5, HY - 1, 7, 15, look.hair, 3.5);
  } else {
    // mái tóc bồng có răng cưa mềm
    ctx.beginPath(); ctx.arc(0, HY - 1, HR + 0.6, Math.PI, 0);
    ctx.lineTo(HR + 0.4, HY + 2);
    ctx.quadraticCurveTo(7, HY - 3, 4.5, HY - 1.5); ctx.quadraticCurveTo(2.5, HY - 4.5, 0, HY - 1.8);
    ctx.quadraticCurveTo(-2.5, HY - 4.5, -4.5, HY - 1.5); ctx.quadraticCurveTo(-7, HY - 3, -HR - 0.4, HY + 2);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    if (look.long) { box(-12, HY - 2, 4.5, 15, look.hair, 2.2); box(7.5, HY - 2, 4.5, 15, look.hair, 2.2); }
  }
  // ánh bóng trên tóc
  ctx.fillStyle = 'rgba(255,255,255,.32)'; ctx.beginPath(); ctx.ellipse(-4, HY - 7.5, 3.5, 1.4, -0.45, 0, Math.PI * 2); ctx.fill();
  // nơ xinh cho tóc dài (nữ)
  const hat = look.hat || (look.cap ? 'cap' : null);
  if (look.long && !hat && dir !== 3) G.bow(ctx, side ? -3 : 6.5, HY - 9, look.bowCol || '#ff8fab');
  if (look.long && !hat && dir === 3) G.bow(ctx, 0, HY - 4, look.bowCol || '#ff8fab');
  // mũ
  if (hat === 'cap') {
    ctx.fillStyle = look.cap;
    ctx.beginPath(); ctx.arc(0, HY - 2, HR + 0.6, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (dir === 0) box(-9, HY - 3, 18, 3.2, look.cap, 1.6);
    else if (side) box(3, HY - 3, 11, 3.2, look.cap, 1.6);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(-3, HY - 8.5, 3, 1.2, -0.3, 0, Math.PI * 2); ctx.fill();
    if (dir === 0) G.heart(ctx, 0, HY - 6.5, 2, '#fff');
  } else if (hat === 'sun') {
    ctx.fillStyle = look.cap;
    ctx.beginPath(); ctx.ellipse(side ? 1 : 0, HY - 4, 15.5, 4.4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, HY - 5, 8, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff8fab'; ctx.fillRect(-8, HY - 6.5, 16, 2.2);
    if (dir !== 3) G.flower(ctx, side ? -4 : 5.5, HY - 6, 2.4, '#fff59d');
  } else if (hat === 'beanie') {
    ctx.fillStyle = look.cap;
    ctx.beginPath(); ctx.arc(0, HY - 2, HR + 0.8, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    box(-HR - 0.8, HY - 3.5, 2 * HR + 1.6, 3.8, G.shade(look.cap, -0.12), 1.8);
    ctx.fillStyle = G.shade(look.cap, 0.4); ctx.beginPath(); ctx.arc(0, HY - 13.5, 2.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  // mặt dễ thương: mắt to long lanh, má hồng, miệng cười
  const eye = (ex, ey) => {
    ctx.fillStyle = '#4a2c3a'; ctx.beginPath(); ctx.ellipse(ex, ey, 1.9, 2.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex - 0.6, ey - 1, 0.85, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ex + 0.7, ey + 0.9, 0.4, 0, Math.PI * 2); ctx.fill();
  };
  const glass = (gx, gw) => {
    if (look.glasses === 'sun') { ctx.fillStyle = 'rgba(60,30,60,.88)'; rr(ctx, gx, HY - 0.8, gw, 4.2, 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(gx + 0.9, HY - 0.1, 1.3, 1); }
    else { ctx.strokeStyle = '#7b4b6a'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(gx + gw / 2, HY + 1.3, gw / 2, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = OL; ctx.lineWidth = 1.3; }
  };
  if (dir === 0) {
    eye(-4.2, HY + 1.3); eye(4.2, HY + 1.3);
    if (look.long) { ctx.strokeStyle = '#4a2c3a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-6.4, HY - 0.6); ctx.lineTo(-7.4, HY - 1.6); ctx.moveTo(6.4, HY - 0.6); ctx.lineTo(7.4, HY - 1.6); ctx.stroke(); ctx.strokeStyle = OL; ctx.lineWidth = 1.3; }
    ctx.fillStyle = 'rgba(255,120,150,.45)'; ctx.beginPath(); ctx.ellipse(-6.6, HY + 4.6, 2.1, 1.3, 0, 0, Math.PI * 2); ctx.ellipse(6.6, HY + 4.6, 2.1, 1.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#a0465f'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.arc(-1, HY + 5, 1.1, 0.1, Math.PI - 0.3); ctx.arc(1, HY + 5, 1.1, 0.3, Math.PI - 0.1); ctx.stroke();
    ctx.strokeStyle = OL; ctx.lineWidth = 1.3;
    if (look.glasses) { glass(-7, 5.6); glass(1.4, 5.6); }
  } else if (side) {
    eye(5, HY + 1.3);
    ctx.fillStyle = 'rgba(255,120,150,.45)'; ctx.beginPath(); ctx.ellipse(4.2, HY + 4.8, 2, 1.3, 0, 0, Math.PI * 2); ctx.fill();
    if (look.glasses) glass(2.4, 5.6);
  }
  ctx.restore();
};
// ngôi sao nhỏ
G.star = function (ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
  ctx.closePath(); ctx.fill();
};
// trái tim nhỏ
G.heart = function (ctx, x, y, s, col) {
  ctx.save(); ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.7, y - s * 1.3, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.7, y - s * 1.3, x + s * 1.6, y - s * 0.2, x, y + s * 0.9);
  ctx.fill(); ctx.restore();
};
// nơ buộc tóc
G.bow = function (ctx, x, y, col) {
  ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = 'rgba(150,60,90,.7)'; ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 5, y - 4, x - 5, y + 1); ctx.quadraticCurveTo(x - 4, y + 3.5, x, y); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 5, y - 4, x + 5, y + 1); ctx.quadraticCurveTo(x + 4, y + 3.5, x, y); ctx.fill(); ctx.stroke();
  ctx.fillStyle = G.shade(col, -0.15); ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
};
// bông hoa 5 cánh
G.flower = function (ctx, x, y, r, col, center) {
  ctx.save(); ctx.fillStyle = col;
  for (let k = 0; k < 5; k++) { const a = k * 1.2566 - 1.57; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.75, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = center || '#ffd54f'; ctx.beginPath(); ctx.arc(x, y, r * 0.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
};

// ---------- Thú cưng đi theo ----------
G.PETS = {
  cat: { vi: 'Mèo', icon: '🐱' }, dog: { vi: 'Cún', icon: '🐶' }, bunny: { vi: 'Thỏ', icon: '🐰' },
  hamster: { vi: 'Hamster', icon: '🐹' }, chick: { vi: 'Gà con', icon: '🐥' }, penguin: { vi: 'Cánh cụt', icon: '🐧' },
  fox: { vi: 'Cáo', icon: '🦊' }, panda: { vi: 'Gấu trúc', icon: '🐼' },
};
// hình dáng từng loài: màu thân, màu phụ, kiểu tai, kiểu đuôi
const PET_SHAPE = {
  cat: { col: '#ffcc99', dark: '#f4a261', ears: 'tri', tail: 'curl' },
  dog: { col: '#e6c09a', dark: '#a1785c', ears: 'flop', tail: 'wag' },
  bunny: { col: '#ffffff', dark: '#ffd1dc', ears: 'long', tail: 'puff' },
  hamster: { col: '#f6c28b', dark: '#fff3e0', ears: 'round', tail: 'none', belly: true, chubby: true },
  chick: { col: '#ffe066', dark: '#ffd23f', ears: 'none', tail: 'none', beak: true, wing: true },
  penguin: { col: '#46527a', dark: '#ffffff', ears: 'none', tail: 'none', beak: true, belly: true, wing: true, feet: '#ffa94d' },
  fox: { col: '#ff9a5a', dark: '#ffffff', ears: 'tri', tail: 'fox', muzzle: true },
  panda: { col: '#ffffff', dark: '#3b3b48', ears: 'round', tail: 'none', patches: true, chubby: true },
};
// thú cưng chạy theo sau chủ (lưu vị trí trong owner._pet)
G.petFollow = function (owner, x, y, dir, dt) {
  const off = [[17, -3], [16, -4], [-16, -4], [-17, 3]][dir] || [17, -3];
  const tx = x + off[0], ty = y + off[1] + 2;
  const pt = owner._pet || (owner._pet = { x: tx, y: ty, dir: 0, mv: false });
  const dx = tx - pt.x, dy = ty - pt.y, d = Math.hypot(dx, dy);
  if (d > 160) { pt.x = tx; pt.y = ty; }
  else if (d > 3) { const k = Math.min(1, (dt || 0.016) * 6); pt.x += dx * k; pt.y += dy * k; }
  pt.mv = d > 5;
  if (pt.mv) pt.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : (dy < 0 ? 3 : 0);
  return pt;
};
G.drawPet = function (ctx, x, y, kind, dir, t, moving) {
  const P = PET_SHAPE[kind];
  if (!P) return;
  const hop = moving ? Math.abs(Math.sin(t * 10)) * 3 : Math.abs(Math.sin(t * 2.5)) * 0.8;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y));
  ctx.fillStyle = 'rgba(120,70,110,.16)'; ctx.beginPath(); ctx.ellipse(0, 1, 7, 2.6, 0, 0, Math.PI * 2); ctx.fill();
  if (dir === 1) ctx.scale(-1, 1);
  ctx.translate(0, -hop);
  const OL = 'rgba(110,62,84,.75)'; ctx.strokeStyle = OL; ctx.lineWidth = 1.1; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const col = P.col, dark = P.dark;
  const back = dir === 3, front = dir === 0;
  const ell = (ex, ey, rx, ry, c, rot = 0, stroke = true) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(ex, ey, rx, ry, rot, 0, Math.PI * 2); ctx.fill(); if (stroke) ctx.stroke(); };
  // đuôi
  if (P.tail === 'curl') { ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-5, -4); ctx.quadraticCurveTo(-11, -6, -9, -13 + Math.sin(t * 4) * 1.5); ctx.stroke(); ctx.strokeStyle = OL; ctx.lineWidth = 1.1; }
  if (P.tail === 'wag') ell(-6, -7 + Math.sin(t * 12), 1.6, 3.2, dark, -0.7 + Math.sin(t * 12) * 0.3);
  if (P.tail === 'puff') ell(-6, -4, 2.4, 2.4, '#fff');
  if (P.tail === 'fox') { const w = Math.sin(t * 3) * 0.2; ell(-8, -6, 3.6, 6, col, -0.9 + w); ell(-10.5, -10, 1.8, 2.4, '#fff', -0.9 + w, false); }
  // chân chim cánh cụt / gà con
  if (P.feet || P.beak) { ctx.fillStyle = P.feet || '#ffa94d'; [-2.5, 2.5].forEach((fx) => { ctx.beginPath(); ctx.ellipse(fx, -0.6, 2, 1.1, 0, 0, Math.PI * 2); ctx.fill(); }); }
  // thân
  const chub = P.chubby ? 1.15 : 1;
  if (P.beak) {
    // thân chim tròn một khối
    ell(0, -7, 6.5, 7, col);
    if (P.belly) ell(front ? 0 : 1.5, -6, front ? 4 : 3.5, 5, dark, 0, false);
    if (P.wing) ell(front ? -6 : -1, -7, 1.8, 4, P.feet ? col : '#ffd23f', 0.3);
  } else {
    ell(0, -4.5, 6.5 * chub, 4.5 * chub, col);
    if (P.belly) ell(front ? 0 : 1.5, -3.8, 3.5, 2.6, dark, 0, false);
    if (P.patches) [-3.5, 3].forEach((lx) => ell(lx, -1.5, 2, 1.8, dark, 0, false));
  }
  // đầu
  const hx = front || back ? 0 : 4, hy = P.beak ? -15 : -11;
  ctx.fillStyle = col;
  if (P.ears === 'tri') [-1, 1].forEach((sx) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(hx + sx * 2, hy - 4); ctx.lineTo(hx + sx * 5.5, hy - (kind === 'fox' ? 10 : 8.5)); ctx.lineTo(hx + sx * 5.8, hy - 2.5); ctx.closePath(); ctx.fill(); ctx.stroke(); });
  if (P.ears === 'long') [-1, 1].forEach((sx) => { ell(hx + sx * 2.5, hy - 9, 1.9, 5, col, sx * 0.15); ell(hx + sx * 2.5, hy - 9, 0.9, 3.5, dark, sx * 0.15, false); });
  if (P.ears === 'round') [-1, 1].forEach((sx) => ell(hx + sx * 4.6, hy - 4.2, 2.2, 2.2, P.patches ? dark : col));
  if (P.beak) ell(hx, hy, 5.5, 5.2, col);
  else ell(hx, hy, 6 * (P.chubby ? 1.05 : 1), 6 * (P.chubby ? 0.95 : 1), col);
  if (P.ears === 'flop') [-1, 1].forEach((sx) => ell(hx + sx * 5.2, hy - 0.5, 2, 3.6, dark, sx * 0.3));
  if (P.beak && kind === 'penguin' && !back) ell(front ? hx : hx + 1.5, hy + 1, front ? 3.8 : 3, 3.4, '#ffffff', 0, false);
  if (P.muzzle && !back) ell(front ? hx : hx + 2.5, hy + 2.2, 3.2, 2.2, '#ffffff', 0, false);
  if (kind === 'chick') { ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.ellipse(hx, hy - 5.5, 1, 2, 0.3, 0, Math.PI * 2); ctx.fill(); }
  if (!back) {
    const ex = front ? [hx - 2.2, hx + 2.2] : [hx + 2.2];
    if (P.patches) ex.forEach((e) => ell(e, hy - 0.2, 1.9, 2.3, dark, front ? (e < hx ? 0.4 : -0.4) : 0.2, false));
    ex.forEach((e) => { ctx.fillStyle = P.patches ? '#fff' : '#4a2c3a'; ctx.beginPath(); ctx.arc(e, hy, P.patches ? 0.9 : 1.3, 0, Math.PI * 2); ctx.fill(); if (!P.patches) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(e - 0.4, hy - 0.5, 0.45, 0, Math.PI * 2); ctx.fill(); } });
    if (P.beak) { ctx.fillStyle = '#ffa94d'; ctx.beginPath(); const bx = front ? hx : hx + 5; ctx.moveTo(bx - 1.6, hy + 1.4); ctx.lineTo(bx + 1.6, hy + 1.4); ctx.lineTo(bx + (front ? 0 : 2), hy + 3.2); ctx.closePath(); ctx.fill(); }
    else { ctx.fillStyle = kind === 'bunny' ? '#ff8fab' : '#6d4c41'; ctx.beginPath(); ctx.arc(front ? hx : hx + 4.6, hy + 2, 0.9, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,120,150,.45)'; ctx.beginPath(); ctx.ellipse(front ? hx - 3.6 : hx + 1.5, hy + 2.4, 1.3, 0.8, 0, 0, Math.PI * 2); if (front) ctx.ellipse(hx + 3.6, hy + 2.4, 1.3, 0.8, 0, 0, Math.PI * 2); ctx.fill();
  }
  // chân
  if (!P.beak) { const lc = P.patches ? dark : col; [-3.5, 3].forEach((lx) => ell(lx, -0.8, 1.8, 1.4, lc)); }
  ctx.restore();
};

G.PLAYER_LOOK = { skin: '#ffe0c7', hair: '#5d3a2e', shirt: '#7ec8f0', pants: '#5c6b9a', shoes: '#8d6e63', cap: '#ff8fab', logo: '#fff', belt: '#5aa7d6', tool: true };

// Ngoại hình người chơi theo hồ sơ (tên, giới tính, màu da, tóc, áo)
G.LOOK_OPTS = {
  skin: ['#ffe0c7', '#f7cfae', '#e3a77f', '#b97a57'],
  hair: ['#5d3a2e', '#8d5a3b', '#d9a066', '#3b2a35', '#f5d1a8', '#c77dba'],
  shirt: ['#7ec8f0', '#8fd6a7', '#c3a6ff', '#ffab91', '#ff8fab'],
};
// nhân vật phụ phong cách pastel
G.NPC_LOOKS = [
  { skin: '#ffe0c7', hair: '#6d4c41', shirt: '#9ee09e', pants: '#8d7b9e' },
  { skin: '#f7cfae', hair: '#3b2a35', shirt: '#ffb3c6', pants: '#7d8bb8', long: true, bowCol: '#ff6f9f' },
  { skin: '#ffe0c7', hair: '#d9a066', shirt: '#ffd166', pants: '#8aa1d1', glasses: true },
  { skin: '#e3a77f', hair: '#3b2a35', shirt: '#c3a6ff', pants: '#6f7ba6', long: true, bowCol: '#ffd166' },
  { skin: '#f7cfae', hair: '#bdbdbd', shirt: '#d7b49e', pants: '#8d7b9e', glasses: true },
  { skin: '#ffe0c7', hair: '#4e342e', shirt: '#80deea', pants: '#a1887f', cap: '#81c784' },
  { skin: '#e3a77f', hair: '#8d5a3b', shirt: '#ffab91', pants: '#6f7ba6', long: true, bowCol: '#9ee09e' },
  { skin: '#ffe0c7', hair: '#c77dba', shirt: '#b39ddb', pants: '#7d8bb8', long: true, glasses: true, bowCol: '#fff59d' },
];
G.playerLook = function (pf) {
  const p = pf || (G.state && Object.assign({}, G.state.profile, { wear: G.state.wardrobe && G.state.wardrobe.wear })) || {};
  const o = G.LOOK_OPTS;
  const shirt = o.shirt[p.shirt || 0];
  const look = Object.assign({}, G.PLAYER_LOOK, { skin: o.skin[p.skin || 0], hair: o.hair[p.hair || 0], shirt, belt: G.shade(shirt, -0.3), long: p.gender === 'f' });
  return G.applyOutfit ? G.applyOutfit(look, p.wear || {}) : look;
};
