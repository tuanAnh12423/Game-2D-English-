// Tạo thế giới từ dữ liệu REGIONS, vẽ ô đất, toà nhà và bản đồ nhỏ
const T = {
  GRASS: 0, ROAD: 1, SAND: 2, WATER: 3, TREE: 4, FLOWER: 5, ROCK: 6, PAVE: 7,
  BUILD: 8, DOOR: 9, FENCE: 10, DARK: 11, CONCRETE: 12, BRIDGE: 13, BUSH: 14, PATH: 15, PINE: 16,
};
G.T = T;
const SOLID = new Set([T.WATER, T.TREE, T.ROCK, T.BUILD, T.DOOR, T.FENCE, T.BUSH, T.PINE]);
G.SOLID = SOLID;
const GROUND_TILE = { grass: T.GRASS, city: T.PAVE, sand: T.SAND, forest: T.DARK, industrial: T.CONCRETE };

G.world = {
  w: 0, h: 0, tiles: null, regionGrid: [], regions: [], buildings: [], chunks: new Map(),

  build() {
    const RW = G.RW, RH = G.RH;
    let maxX = 0, maxY = 0;
    REGIONS.forEach((r) => { maxX = Math.max(maxX, r.gx); maxY = Math.max(maxY, r.gy); });
    this.gw = maxX + 1; this.gh = maxY + 1;
    this.w = this.gw * RW; this.h = this.gh * RH;
    this.tiles = new Uint8Array(this.w * this.h).fill(T.WATER);
    this.bmap = new Int16Array(this.w * this.h).fill(-1); // ô thuộc toà nhà nào
    this.regionGrid = [];
    for (let y = 0; y < this.gh; y++) this.regionGrid.push(new Array(this.gw).fill(null));
    this.regions = REGIONS.map((r, i) => Object.assign({ idx: i }, r));
    this.regions.forEach((r) => { this.regionGrid[r.gy][r.gx] = r; });
    this.buildings = [];
    this.regions.forEach((r) => this.genRegion(r));
    this.chunks.clear();
    this.buildMinimap();
  },

  regionAt(gx, gy) { return gy >= 0 && gy < this.gh && gx >= 0 && gx < this.gw ? this.regionGrid[gy][gx] : null; },
  regionOfTile(tx, ty) { return this.regionAt(Math.floor(tx / G.RW), Math.floor(ty / G.RH)); },
  regionOfPx(x, y) { return this.regionOfTile(Math.floor(x / G.TS), Math.floor(y / G.TS)); },
  get(tx, ty) { return tx < 0 || ty < 0 || tx >= this.w || ty >= this.h ? T.WATER : this.tiles[ty * this.w + tx]; },
  set(tx, ty, v) { if (tx >= 0 && ty >= 0 && tx < this.w && ty < this.h) this.tiles[ty * this.w + tx] = v; },

  genRegion(r) {
    const RW = G.RW, RH = G.RH, ox = r.gx * RW, oy = r.gy * RH;
    const rnd = G.mulberry(G.strHash(r.id) + 7);
    const base = GROUND_TILE[r.ground] ?? T.GRASS;
    const L = (x, y, v) => this.set(ox + x, oy + y, v);
    const g = (x, y) => this.get(ox + x, oy + y);
    for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) L(x, y, base);

    // mảng cỏ trong thành phố cho đỡ đơn điệu
    if (r.ground === 'city' || r.ground === 'industrial') {
      for (let k = 0; k < 6; k++) {
        const cx = Math.floor(rnd() * RW), cy = Math.floor(rnd() * RH), rw = 2 + Math.floor(rnd() * 4), rh = 2 + Math.floor(rnd() * 3);
        for (let y = cy; y < cy + rh; y++) for (let x = cx; x < cx + rw; x++) if (x < RW && y < RH) L(x, y, T.GRASS);
      }
    }
    // biển
    if (r.sea) {
      for (let x = 0; x < RW; x++) {
        const top = 28 + Math.round(Math.sin(x * 0.4) * 1.2 + rnd() * 0.8);
        for (let y = top; y < RH; y++) L(x, y, T.WATER);
      }
    }
    // hồ
    for (let k = 0; k < (r.ponds || 0); k++) {
      const cx = 4 + Math.floor(rnd() * (RW - 8)), cy = 4 + Math.floor(rnd() * (RH - 8));
      const rx = 2 + rnd() * 2.5, ry = 1.5 + rnd() * 2;
      for (let y = -4; y <= 4; y++) for (let x = -5; x <= 5; x++) {
        if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) {
          const X = cx + x, Y = cy + y;
          if (X > 0 && Y > 0 && X < RW - 1 && Y < RH - 1 && !(Y >= 15 && Y <= 20) && !(X >= 21 && X <= 26)) L(X, Y, T.WATER);
        }
      }
    }
    // sông dọc
    if (r.river) for (let y = 0; y < RH; y++) for (let x = r.river.x; x < r.river.x + r.river.w; x++) L(x, y, T.WATER);

    // đường nối các vùng
    const hasL = !!this.regionAt(r.gx - 1, r.gy), hasR = !!this.regionAt(r.gx + 1, r.gy);
    const hasU = !!this.regionAt(r.gx, r.gy - 1), hasD = !!this.regionAt(r.gx, r.gy + 1);
    const road = (x, y) => L(x, y, g(x, y) === T.WATER ? T.BRIDGE : T.ROAD);
    for (let x = hasL ? 0 : 20; x <= (hasR ? RW - 1 : 27); x++) { road(x, 17); road(x, 18); }
    for (let y = hasU ? 0 : 14; y <= (hasD ? RH - 1 : 21); y++) { road(23, y); road(24, y); }

    // viền thế giới
    const edge = (r.ground === 'city' || r.ground === 'industrial') ? T.FENCE : T.TREE;
    if (!hasL) for (let y = 0; y < RH; y++) if (g(0, y) !== T.WATER) L(0, y, edge);
    if (!hasR) for (let y = 0; y < RH; y++) if (g(RW - 1, y) !== T.WATER) L(RW - 1, y, edge);
    if (!hasU) for (let x = 0; x < RW; x++) if (g(x, 0) !== T.WATER) L(x, 0, edge);
    if (!hasD) for (let x = 0; x < RW; x++) if (g(x, RH - 1) !== T.WATER) L(x, RH - 1, edge);

    // toà nhà
    r.buildings.forEach((b, bi) => {
      const bx = ox + b.x, by = oy + b.y;
      const doorTop = b.y > 18;
      const dx = bx + Math.floor(b.w / 2), dy = doorTop ? by : by + b.h - 1;
      const bld = { ...b, region: r, rid: r.id, key: r.id + ':' + bi, x: bx, y: by, dx, dy, doorTop, idx: this.buildings.length };
      this.buildings.push(bld);
      for (let y = by; y < by + b.h; y++) for (let x = bx; x < bx + b.w; x++) {
        this.set(x, y, T.BUILD); this.bmap[y * this.w + x] = bld.idx;
      }
      this.set(dx, dy, T.DOOR);
      // lối đi từ cửa ra đường lớn
      const step = doorTop ? -1 : 1;
      let y = dy + step;
      for (let n = 0; n < 40; n++, y += step) {
        const t = this.get(dx, y);
        if (t === T.ROAD || t === T.BRIDGE || t === T.BUILD || t === T.DOOR) break;
        if (y < oy || y >= oy + RH) break;
        this.set(dx, y, t === T.WATER ? T.BRIDGE : T.PATH);
        if (this.get(dx + 1, y) === T.WATER) this.set(dx + 1, y, T.BRIDGE);
      }
      // sân trước cửa
      for (let x = dx - 1; x <= dx + 1; x++) {
        const t = this.get(x, dy + step);
        if (t !== T.BUILD && t !== T.DOOR && t !== T.ROAD && t !== T.BRIDGE) this.set(x, dy + step, T.PATH);
      }
    });

    // trang trí (cây, hoa, đá, bụi)
    const d = r.deco || {};
    const near = (x, y) => {
      for (let yy = y - 2; yy <= y + 2; yy++) for (let xx = x - 2; xx <= x + 2; xx++) {
        const t = g(xx, yy);
        if (t === T.BUILD || t === T.DOOR || t === T.PATH || t === T.ROAD || t === T.BRIDGE) return true;
      }
      return false;
    };
    for (let y = 1; y < RH - 1; y++) for (let x = 1; x < RW - 1; x++) {
      const t = g(x, y);
      if (t !== base && t !== T.GRASS) continue;
      if (near(x, y)) continue;
      const v = rnd();
      let acc = 0;
      if (v < (acc += d.tree || 0)) L(x, y, r.ground === 'forest' && rnd() < 0.6 ? T.PINE : T.TREE);
      else if (v < (acc += d.flower || 0)) L(x, y, T.FLOWER);
      else if (v < (acc += d.rock || 0)) L(x, y, T.ROCK);
      else if (v < (acc += d.bush || 0)) L(x, y, T.BUSH);
    }
    // điểm xuất hiện
    r.spawnPx = r.spawn ? { x: (ox + r.spawn.x + 0.5) * G.TS, y: (oy + r.spawn.y + 0.5) * G.TS }
      : { x: (ox + 24) * G.TS, y: (oy + 18) * G.TS };
  },

  isSolidTile(tx, ty) { return SOLID.has(this.get(tx, ty)); },
  buildingAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return null;
    const i = this.bmap[ty * this.w + tx];
    return i >= 0 ? this.buildings[i] : null;
  },
  walkable(tx, ty) {
    const t = this.get(tx, ty);
    return !SOLID.has(t);
  },
  // ô trống để thả vật phẩm
  randomFreeTile(r, rnd = Math.random) {
    const ox = r.gx * G.RW, oy = r.gy * G.RH;
    for (let k = 0; k < 60; k++) {
      const x = ox + 2 + Math.floor(rnd() * (G.RW - 4)), y = oy + 2 + Math.floor(rnd() * (G.RH - 4));
      const t = this.get(x, y);
      if (t === T.GRASS || t === T.SAND || t === T.PAVE || t === T.DARK || t === T.CONCRETE || t === T.FLOWER) {
        // tránh ô bị bao kín
        let open = 0;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { if (this.walkable(x + a, y + b)) open++; });
        if (open >= 2) return { x, y };
      }
    }
    return null;
  },

  // ---------- Vẽ ô đất ----------
  drawTile(ctx, t, tx, ty, px, py) {
    const S = G.TS, h = G.hash2(tx, ty), h2 = G.hash2(ty + 91, tx + 17);
    const grass = (dark) => {
      ctx.fillStyle = dark ? (h < 0.5 ? '#3f7d3a' : '#3a7536') : (h < 0.5 ? '#6abe4f' : '#64b74a');
      ctx.fillRect(px, py, S, S);
      ctx.fillStyle = dark ? '#356b30' : '#58a842';
      for (let i = 0; i < 3; i++) {
        const gx = px + Math.floor(G.hash2(tx * 3 + i, ty) * 28) + 2, gy = py + Math.floor(G.hash2(tx, ty * 3 + i) * 28) + 2;
        ctx.fillRect(gx, gy, 2, 3);
      }
    };
    switch (t) {
      case T.GRASS: grass(false); break;
      case T.DARK: grass(true); break;
      case T.SAND:
        ctx.fillStyle = h < 0.5 ? '#f1dc9a' : '#eed693'; ctx.fillRect(px, py, S, S);
        ctx.fillStyle = '#dcc47e'; ctx.fillRect(px + Math.floor(h2 * 26) + 3, py + Math.floor(h * 26) + 3, 2, 2);
        break;
      case T.WATER: {
        ctx.fillStyle = '#2f8fd8'; ctx.fillRect(px, py, S, S);
        ctx.fillStyle = '#4aa6ea';
        ctx.fillRect(px + Math.floor(h * 18) + 2, py + Math.floor(h2 * 24) + 4, 10, 2);
        // bờ cát
        const land = (a, b) => { const n = this.get(tx + a, ty + b); return n !== T.WATER && n !== T.BRIDGE; };
        ctx.fillStyle = 'rgba(255,255,255,.35)';
        if (land(0, -1)) ctx.fillRect(px, py, S, 3);
        if (land(0, 1)) ctx.fillRect(px, py + S - 3, S, 3);
        if (land(-1, 0)) ctx.fillRect(px, py, 3, S);
        if (land(1, 0)) ctx.fillRect(px + S - 3, py, 3, S);
        break;
      }
      case T.ROAD: {
        ctx.fillStyle = '#5d6166'; ctx.fillRect(px, py, S, S);
        ctx.fillStyle = '#676b70'; ctx.fillRect(px + Math.floor(h * 26), py + Math.floor(h2 * 26), 4, 3);
        const lx = tx % G.RW, ly = ty % G.RH;
        ctx.fillStyle = '#f5f5f5';
        if ((ly === 17 || ly === 18) && !(lx === 23 || lx === 24) && lx % 3 !== 0) ctx.fillRect(px, ly === 17 ? py + S - 2 : py, S, 2);
        if ((lx === 23 || lx === 24) && !(ly === 17 || ly === 18) && ly % 3 !== 0) ctx.fillRect(lx === 23 ? px + S - 2 : px, py, 2, S);
        break;
      }
      case T.PAVE: {
        ctx.fillStyle = (tx + ty) % 2 ? '#cfcac0' : '#d6d1c7'; ctx.fillRect(px, py, S, S);
        ctx.strokeStyle = '#bdb7ab'; ctx.lineWidth = 1; ctx.strokeRect(px + 0.5, py + 0.5, S - 1, S - 1);
        break;
      }
      case T.CONCRETE: {
        ctx.fillStyle = h < 0.5 ? '#a9adb1' : '#a3a7ab'; ctx.fillRect(px, py, S, S);
        ctx.fillStyle = '#9a9ea2'; ctx.fillRect(px + Math.floor(h2 * 24), py + Math.floor(h * 24), 6, 2);
        if (tx % 4 === 0) { ctx.fillStyle = '#95999d'; ctx.fillRect(px, py, 1, S); }
        break;
      }
      case T.PATH:
        ctx.fillStyle = '#d8c3a0'; ctx.fillRect(px, py, S, S);
        ctx.fillStyle = '#cbb48e'; ctx.fillRect(px + 4, py + 4, 10, 8); ctx.fillRect(px + 18, py + 18, 10, 8);
        break;
      case T.BRIDGE:
        ctx.fillStyle = '#2f8fd8'; ctx.fillRect(px, py, S, S);
        ctx.fillStyle = '#9c6b3f'; ctx.fillRect(px, py + 1, S, S - 2);
        ctx.fillStyle = '#835731';
        for (let i = 0; i < 4; i++) ctx.fillRect(px + i * 8, py + 1, 1, S - 2);
        break;
      case T.FLOWER: {
        grass(false);
        const cols = ['#ff5252', '#ffeb3b', '#e040fb', '#ffffff', '#ff9800'];
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = cols[Math.floor(G.hash2(tx + i, ty - i) * cols.length)];
          const fx = px + 5 + Math.floor(G.hash2(tx * 7 + i, ty) * 22), fy = py + 5 + Math.floor(G.hash2(tx, ty * 7 + i) * 22);
          ctx.fillRect(fx - 2, fy, 5, 1); ctx.fillRect(fx, fy - 2, 1, 5);
        }
        break;
      }
      case T.TREE: case T.PINE: {
        const reg = this.regionOfTile(tx, ty);
        reg && (reg.ground === 'sand') ? (ctx.fillStyle = '#f1dc9a', ctx.fillRect(px, py, S, S)) :
          reg && (reg.ground === 'city' || reg.ground === 'industrial') ? (ctx.fillStyle = '#cfcac0', ctx.fillRect(px, py, S, S)) :
            grass(reg && reg.ground === 'forest');
        ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(px + 16, py + 27, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#6d4c41'; ctx.fillRect(px + 13, py + 18, 6, 10);
        if (reg && reg.ground === 'sand') { // cây dừa
          ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 3;
          for (let i = 0; i < 5; i++) { const a = -Math.PI + i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(px + 16, py + 8); ctx.quadraticCurveTo(px + 16 + Math.cos(a) * 10, py + 4 + Math.sin(a) * 8, px + 16 + Math.cos(a) * 15, py + 10 + Math.sin(a) * 6 + 4); ctx.stroke(); }
          ctx.fillStyle = '#795548'; ctx.fillRect(px + 14, py + 8, 4, 12);
        } else if (t === T.PINE) {
          ctx.fillStyle = '#1b5e20';
          ctx.beginPath(); ctx.moveTo(px + 16, py - 2); ctx.lineTo(px + 28, py + 22); ctx.lineTo(px + 4, py + 22); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#2e7d32';
          ctx.beginPath(); ctx.moveTo(px + 16, py + 2); ctx.lineTo(px + 24, py + 16); ctx.lineTo(px + 8, py + 16); ctx.closePath(); ctx.fill();
        } else {
          ctx.fillStyle = h < 0.5 ? '#2e7d32' : '#388e3c';
          ctx.beginPath(); ctx.arc(px + 16, py + 12, 12, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#43a047'; ctx.beginPath(); ctx.arc(px + 12, py + 9, 6, 0, Math.PI * 2); ctx.fill();
          if (h2 < 0.25) { ctx.fillStyle = '#e53935'; ctx.fillRect(px + 18, py + 12, 3, 3); ctx.fillRect(px + 9, py + 15, 3, 3); }
        }
        break;
      }
      case T.ROCK: {
        const reg = this.regionOfTile(tx, ty);
        if (reg && reg.ground === 'sand') { ctx.fillStyle = '#f1dc9a'; ctx.fillRect(px, py, S, S); }
        else if (reg && (reg.ground === 'industrial')) { ctx.fillStyle = '#a9adb1'; ctx.fillRect(px, py, S, S); }
        else grass(reg && reg.ground === 'forest');
        ctx.fillStyle = '#8d8d8d'; ctx.beginPath(); ctx.ellipse(px + 16, py + 19, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#a7a7a7'; ctx.beginPath(); ctx.ellipse(px + 13, py + 16, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case T.BUSH: {
        const reg = this.regionOfTile(tx, ty);
        if (reg && (reg.ground === 'city')) { ctx.fillStyle = '#cfcac0'; ctx.fillRect(px, py, S, S); }
        else if (reg && reg.ground === 'sand') { ctx.fillStyle = '#f1dc9a'; ctx.fillRect(px, py, S, S); }
        else if (reg && reg.ground === 'industrial') { ctx.fillStyle = '#a9adb1'; ctx.fillRect(px, py, S, S); }
        else grass(reg && reg.ground === 'forest');
        ctx.fillStyle = '#2e7d32'; ctx.beginPath(); ctx.arc(px + 10, py + 20, 8, 0, Math.PI * 2); ctx.arc(px + 22, py + 20, 8, 0, Math.PI * 2); ctx.arc(px + 16, py + 13, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#4caf50'; ctx.beginPath(); ctx.arc(px + 13, py + 12, 3, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case T.FENCE: {
        ctx.fillStyle = '#cfcac0'; ctx.fillRect(px, py, S, S);
        ctx.fillStyle = '#8d6e63'; ctx.fillRect(px, py + 10, S, 4); ctx.fillRect(px, py + 20, S, 4);
        ctx.fillStyle = '#6d4c41'; ctx.fillRect(px + 4, py + 4, 5, 24); ctx.fillRect(px + 20, py + 4, 5, 24);
        break;
      }
      case T.BUILD: case T.DOOR:
        ctx.fillStyle = '#777'; ctx.fillRect(px, py, S, S); // được vẽ đè bởi drawBuildings
        break;
    }
  },

  CH: 16, // ô mỗi chunk
  getChunk(cx, cy) {
    const key = cx + ',' + cy;
    let c = this.chunks.get(key);
    if (c) { this.chunks.delete(key); this.chunks.set(key, c); return c; } // LRU
    const S = G.TS, n = this.CH;
    c = document.createElement('canvas');
    c.width = c.height = n * S;
    const ctx = c.getContext('2d');
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const tx = cx * n + x, ty = cy * n + y;
      if (tx >= this.w || ty >= this.h) { ctx.fillStyle = '#2f8fd8'; ctx.fillRect(x * S, y * S, S, S); continue; }
      this.drawTile(ctx, this.get(tx, ty), tx, ty, x * S, y * S);
    }
    this.chunks.set(key, c);
    while (this.chunks.size > 36) this.chunks.delete(this.chunks.keys().next().value);
    return c;
  },

  drawGround(ctx, cam) {
    const S = G.TS, n = this.CH, cs = n * S;
    const x0 = Math.floor(cam.x / cs), y0 = Math.floor(cam.y / cs);
    const x1 = Math.floor((cam.x + cam.w) / cs), y1 = Math.floor((cam.y + cam.h) / cs);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      if (cx < 0 || cy < 0 || cx * n >= this.w || cy * n >= this.h) continue;
      ctx.drawImage(this.getChunk(cx, cy), cx * cs, cy * cs);
    }
  },

  drawBuildings(ctx, cam, t) {
    const S = G.TS;
    this.buildings.forEach((b) => {
      const X = b.x * S, Y = b.y * S, W = b.w * S, H = b.h * S;
      if (X > cam.x + cam.w || Y - 40 > cam.y + cam.h || X + W < cam.x || Y + H < cam.y - 40) return;
      const bt = BUILDING_TYPES[b.t] || BUILDING_TYPES.house;
      // bóng
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(X + 6, Y + 8, W, H);
      const roofH = Math.max(S, Math.floor(H * 0.5));
      // tường
      ctx.fillStyle = bt.wall; ctx.fillRect(X, Y + roofH - 6, W, H - roofH + 6);
      ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(X, Y + H - 6, W, 6);
      // cửa sổ
      const winY = b.doorTop ? Y + roofH + 6 : Y + roofH + 4;
      const wh = Math.min(16, H - roofH - 22);
      if (wh > 6) {
        const night = G.game && G.game.nightLevel() > 0.25;
        for (let wx = X + 10; wx < X + W - 20; wx += 30) {
          if (Math.abs(wx + 8 - (b.dx * S + 16)) < 22) continue;
          ctx.fillStyle = night ? '#ffe082' : '#90caf9'; ctx.fillRect(wx, winY, 16, wh);
          ctx.fillStyle = '#ffffff'; ctx.fillRect(wx + 7, winY, 2, wh);
        }
      }
      // mái
      ctx.fillStyle = bt.roof;
      ctx.beginPath(); ctx.moveTo(X - 6, Y + roofH); ctx.lineTo(X + 12, Y - 6); ctx.lineTo(X + W - 12, Y - 6); ctx.lineTo(X + W + 6, Y + roofH); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.15)';
      for (let ry = Y + 2; ry < Y + roofH - 4; ry += 8) ctx.fillRect(X + 4, ry, W - 8, 2);
      if (b.t === 'factory') { // ống khói
        ctx.fillStyle = '#78909c'; ctx.fillRect(X + W - 40, Y - 30, 14, 30);
        ctx.fillStyle = 'rgba(200,200,200,.6)';
        const p = (t * 0.6) % 1;
        ctx.beginPath(); ctx.arc(X + W - 33, Y - 36 - p * 20, 6 + p * 6, 0, Math.PI * 2); ctx.fill();
      }
      // cửa ra vào
      const DX = b.dx * S, DY = b.dy * S;
      ctx.fillStyle = '#5d4037'; G.rr(ctx, DX + 6, DY + (b.doorTop ? 2 : 4), 20, 26, 3); ctx.fill();
      ctx.fillStyle = '#ffca28'; ctx.fillRect(DX + 21, DY + 16, 3, 3);
      // biển hiệu
      const label = bt.icon + ' ' + b.name;
      ctx.font = 'bold 12px system-ui, sans-serif';
      const tw = ctx.measureText(label).width + 12;
      const sx = X + W / 2 - tw / 2, sy = Y + roofH * 0.35 - 9;
      ctx.fillStyle = 'rgba(255,255,255,.92)'; G.rr(ctx, sx, sy, tw, 18, 5); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#263238'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, X + W / 2, sy + 9.5);
      ctx.textBaseline = 'alphabetic';
    });
  },

  // lớp sương che vùng chưa mở khoá
  drawLocks(ctx, cam, level) {
    const S = G.TS;
    this.regions.forEach((r) => {
      if (r.level <= level) return;
      const X = r.gx * G.RW * S, Y = r.gy * G.RH * S, W = G.RW * S, H = G.RH * S;
      if (X > cam.x + cam.w || Y > cam.y + cam.h || X + W < cam.x || Y + H < cam.y) return;
      ctx.fillStyle = 'rgba(20,24,40,.55)'; ctx.fillRect(X, Y, W, H);
      ctx.strokeStyle = 'rgba(255,214,0,.8)'; ctx.setLineDash([12, 8]); ctx.lineWidth = 4;
      ctx.strokeRect(X + 2, Y + 2, W - 4, H - 4); ctx.setLineDash([]);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 28px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('🔒 ' + r.name, X + W / 2, Y + H / 2 - 10);
      ctx.font = 'bold 20px system-ui, sans-serif'; ctx.fillStyle = '#ffd600';
      ctx.fillText('Cần đạt Level ' + r.level, X + W / 2, Y + H / 2 + 22);
    });
  },

  // ---------- Bản đồ nhỏ ----------
  buildMinimap() {
    const c = document.createElement('canvas');
    c.width = this.w; c.height = this.h;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(this.w, this.h);
    const col = {
      [T.GRASS]: [106, 190, 79], [T.ROAD]: [93, 97, 102], [T.SAND]: [241, 220, 154], [T.WATER]: [47, 143, 216],
      [T.TREE]: [46, 125, 50], [T.PINE]: [27, 94, 32], [T.FLOWER]: [140, 200, 90], [T.ROCK]: [141, 141, 141], [T.PAVE]: [207, 202, 192],
      [T.BUILD]: [200, 80, 60], [T.DOOR]: [255, 202, 40], [T.FENCE]: [141, 110, 99], [T.DARK]: [63, 125, 58], [T.CONCRETE]: [169, 173, 177],
      [T.BRIDGE]: [156, 107, 63], [T.BUSH]: [46, 125, 50], [T.PATH]: [216, 195, 160],
    };
    for (let i = 0; i < this.tiles.length; i++) {
      let c3 = col[this.tiles[i]] || [0, 0, 0];
      if (this.tiles[i] === T.BUILD) {
        const b = this.buildings[this.bmap[i]];
        const hex = (BUILDING_TYPES[b.t] || BUILDING_TYPES.house).roof;
        c3 = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
      }
      img.data[i * 4] = c3[0]; img.data[i * 4 + 1] = c3[1]; img.data[i * 4 + 2] = c3[2]; img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    this.mini = c;
  },
};
