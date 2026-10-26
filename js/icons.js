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

// Ảnh linh kiện cho giao diện HTML (cache dataURL)
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
  if (item) G.drawPart(x, item, size / 2, size / 2, size * 0.9);
  const url = c.toDataURL();
  G.icons.cache[key] = url;
  return url;
};

// ---------- Nhân vật ----------
// look: {skin, hair, shirt, pants, cap}
G.drawChar = function (ctx, x, y, dir, frame, look, scale = 1) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale, scale);
  const step = frame ? Math.sin(frame) : 0;
  const bob = Math.abs(step) * 1.5;
  // bóng
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ctx.beginPath(); ctx.ellipse(0, 1, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
  // chân
  ctx.fillStyle = look.pants;
  const l1 = step * 3, l2 = -step * 3;
  if (dir === 1 || dir === 2) { // trái/phải
    ctx.fillRect(-4 + l1, -8, 4, 8); ctx.fillRect(0 + l2, -8, 4, 8);
  } else {
    ctx.fillRect(-5, -8, 4, 8 + (step > 0 ? -1 : 0)); ctx.fillRect(1, -8, 4, 8 + (step < 0 ? -1 : 0));
  }
  ctx.fillStyle = '#3e2723';
  ctx.fillRect(-5, -1, 4, 2); ctx.fillRect(1, -1, 4, 2);
  ctx.translate(0, -bob);
  // thân
  ctx.fillStyle = look.shirt;
  rr(ctx, -7, -20, 14, 13, 3); ctx.fill();
  if (look.belt) { ctx.fillStyle = look.belt; ctx.fillRect(-7, -10, 14, 2); }
  // tay
  ctx.fillStyle = look.skin;
  const a = step * 3;
  if (dir === 0 || dir === 3) { ctx.fillRect(-10, -18 + a, 3, 9); ctx.fillRect(7, -18 - a, 3, 9); }
  else { ctx.fillRect(dir === 1 ? 1 + a : -4 - a, -18, 3, 9); }
  // đầu
  ctx.fillStyle = look.skin;
  ctx.beginPath(); ctx.arc(0, -27, 8, 0, Math.PI * 2); ctx.fill();
  // tóc / mũ
  ctx.fillStyle = look.cap || look.hair;
  if (dir === 3) { ctx.beginPath(); ctx.arc(0, -28, 8.5, 0, Math.PI * 2); ctx.fill(); }
  else {
    ctx.beginPath(); ctx.arc(0, -29, 8.5, Math.PI, 0); ctx.fill();
    if (look.cap) { // lưỡi trai
      ctx.fillStyle = look.cap;
      if (dir === 0) ctx.fillRect(-8, -30, 16, 3);
      else ctx.fillRect(dir === 2 ? 0 : -12, -30, 12, 3);
    }
  }
  if (look.long && dir !== 0) { ctx.fillStyle = look.hair; ctx.fillRect(-8, -28, 16, 9); }
  if (look.long && dir === 0) { ctx.fillStyle = look.hair; ctx.fillRect(-9, -28, 3, 10); ctx.fillRect(6, -28, 3, 10); }
  // mắt
  if (dir !== 3) {
    ctx.fillStyle = '#222';
    if (dir === 0) { ctx.fillRect(-4, -26, 2, 3); ctx.fillRect(2, -26, 2, 3); }
    else ctx.fillRect(dir === 2 ? 3 : -5, -26, 2, 3);
  }
  // logo áo
  if (look.logo && dir === 0) { ctx.fillStyle = look.logo; ctx.fillRect(1, -18, 4, 3); }
  // túi đồ nghề
  if (look.tool && dir !== 0) {
    ctx.fillStyle = '#ef6c00';
    if (dir === 3) rr(ctx, -6, -19, 12, 9, 2), ctx.fill();
    else ctx.fillRect(dir === 2 ? -9 : 5, -14, 4, 6);
  }
  ctx.restore();
};

G.PLAYER_LOOK = { skin: '#f2c7a0', hair: '#2b1d14', shirt: '#1565c0', pants: '#263238', cap: '#e53935', logo: '#fff', belt: '#0d47a1', tool: true };
G.NPC_LOOKS = [
  { skin: '#f1c27d', hair: '#3b2a1a', shirt: '#43a047', pants: '#5d4037' },
  { skin: '#e0ac69', hair: '#111', shirt: '#e91e63', pants: '#37474f', long: true },
  { skin: '#ffdbac', hair: '#6d4c41', shirt: '#ffb300', pants: '#1a237e' },
  { skin: '#c68642', hair: '#1b1b1b', shirt: '#8e24aa', pants: '#263238', long: true },
  { skin: '#f1c27d', hair: '#9e9e9e', shirt: '#795548', pants: '#424242' },
  { skin: '#ffdbac', hair: '#212121', shirt: '#00acc1', pants: '#4e342e', cap: '#00796b' },
  { skin: '#e0ac69', hair: '#4e342e', shirt: '#f4511e', pants: '#212121', long: true },
];
