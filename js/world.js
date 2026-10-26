// Tạo thế giới từ dữ liệu REGIONS, vẽ ô đất, toà nhà và bản đồ nhỏ
const T = {
  GRASS: 0, ROAD: 1, SAND: 2, WATER: 3, TREE: 4, FLOWER: 5, ROCK: 6, PAVE: 7,
  BUILD: 8, DOOR: 9, FENCE: 10, DARK: 11, CONCRETE: 12, BRIDGE: 13, BUSH: 14, PATH: 15, PINE: 16, LAMP: 17, FARM: 18,
};
G.T = T;
const SOLID = new Set([T.WATER, T.TREE, T.ROCK, T.BUILD, T.DOOR, T.FENCE, T.BUSH, T.PINE, T.LAMP]);
G.SOLID = SOLID;
const GROUND_TILE = { grass: T.GRASS, city: T.PAVE, sand: T.SAND, forest: T.DARK, industrial: T.CONCRETE };

G.world = {
  w: 0, h: 0, tiles: null, regionGrid: [], regions: [], buildings: [], lamps: [], farmTiles: [], chunks: new Map(),
  R: 2, // độ phân giải khi vẽ sẵn mặt đất (tăng theo màn hình Retina)

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
    this.buildings = []; this.lamps = []; this.farmTiles = [];
    this.regions.forEach((r) => this.genRegion(r));
    this.chunks.clear();
    this.buildMinimap();
  },
  setRes(R) {
    if (R === this.R) return;
    this.R = R; this.chunks.clear();
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

    // ruộng
    (r.farms || []).forEach((f) => {
      for (let y = f.y; y < f.y + f.h; y++) for (let x = f.x; x < f.x + f.w; x++) {
        L(x, y, T.FARM); this.farmTiles.push({ x: ox + x, y: oy + y });
      }
    });

    // toà nhà (cửa luôn ở mặt trước = hàng dưới cùng)
    r.buildings.forEach((b, bi) => {
      const bx = ox + b.x, by = oy + b.y;
      const dx = bx + Math.floor(b.w / 2), dy = by + b.h - 1;
      const bld = { ...b, region: r, rid: r.id, key: r.id + ':' + bi, x: bx, y: by, dx, dy, idx: this.buildings.length };
      this.buildings.push(bld);
      for (let y = by; y < by + b.h; y++) for (let x = bx; x < bx + b.w; x++) {
        this.set(x, y, T.BUILD); this.bmap[y * this.w + x] = bld.idx;
      }
      this.set(dx, dy, T.DOOR);
    });
    // lối đi từ cửa ra đường lớn
    this.buildings.filter((b) => b.region === r).forEach((b) => this.carvePath(b, ox, oy));

    // đèn đường dọc hai bên đường lớn
    if (r.ground !== 'forest') {
      const okLamp = (x, y) => {
        const t = g(x, y);
        if (t !== base && t !== T.GRASS) return false;
        for (let yy = y - 1; yy <= y + 1; yy++) for (let xx = x - 1; xx <= x + 1; xx++) {
          const n = g(xx, yy);
          if (n === T.PATH || n === T.DOOR || n === T.LAMP || n === T.FARM) return false;
        }
        return true;
      };
      const put = (x, y) => { if (okLamp(x, y)) { L(x, y, T.LAMP); this.lamps.push({ x: ox + x, y: oy + y }); } };
      for (let x = 3; x < RW - 2; x += 7) { if (x >= 20 && x <= 27) continue; if (g(x, 17) === T.ROAD) { put(x, 16); put(x + 3, 19); } }
      for (let y = 3; y < RH - 2; y += 7) { if (y >= 14 && y <= 21) continue; if (g(23, y) === T.ROAD) { put(22, y); put(25, y + 3); } }
    }

    // trang trí (cây, hoa, đá, bụi)
    const d = r.deco || {};
    const near = (x, y) => {
      for (let yy = y - 2; yy <= y + 2; yy++) for (let xx = x - 2; xx <= x + 2; xx++) {
        const t = g(xx, yy);
        if (t === T.BUILD || t === T.DOOR || t === T.PATH || t === T.ROAD || t === T.BRIDGE || t === T.FARM || t === T.LAMP) return true;
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

  // Lối đi: toà nhà phía trên đường đi thẳng xuống; phía dưới đường thì
  // đi xuống 1 ô, vòng sang bên cạnh toà nhà rồi đi lên đường lớn.
  carvePath(b, ox, oy) {
    const isRoad = (t) => t === T.ROAD || t === T.BRIDGE;
    const blocked = (t) => t === T.BUILD || t === T.DOOR;
    const paint = (x, y) => { const t = this.get(x, y); if (!isRoad(t) && !blocked(t)) this.set(x, y, t === T.WATER ? T.BRIDGE : T.PATH); };
    const roadRow = oy + 17;
    const sx = b.dx, sy = b.dy + 1;
    // sân trước cửa
    for (let x = sx - 1; x <= sx + 1; x++) paint(x, sy);
    if (b.dy < roadRow) {
      for (let y = sy; y < oy + G.RH && !isRoad(this.get(sx, y)) && !blocked(this.get(sx, y)); y++) paint(sx, y);
      return;
    }
    const center = ox + 23.5;
    const sides = (b.x + b.w / 2 < center) ? [b.x + b.w, b.x - 1] : [b.x - 1, b.x + b.w];
    for (const col of sides) {
      const cells = [];
      const step = col > sx ? 1 : -1;
      for (let x = sx; x !== col + step; x += step) cells.push([x, sy]);
      let ok = true, reached = false;
      for (let y = sy - 1; y >= oy; y--) {
        const t = this.get(col, y);
        if (isRoad(t)) { reached = true; break; }
        if (blocked(t)) { ok = false; break; }
        cells.push([col, y]);
      }
      if (!ok || !reached || cells.some(([x, y]) => blocked(this.get(x, y)))) continue;
      cells.forEach(([x, y]) => paint(x, y));
      return;
    }
  },

  isSolidTile(tx, ty) { return SOLID.has(this.get(tx, ty)); },
  buildingAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return null;
    const i = this.bmap[ty * this.w + tx];
    return i >= 0 ? this.buildings[i] : null;
  },
  walkable(tx, ty) { return !SOLID.has(this.get(tx, ty)); },
  // ô trống để thả vật phẩm
  randomFreeTile(r, rnd = Math.random) {
    const ox = r.gx * G.RW, oy = r.gy * G.RH;
    for (let k = 0; k < 60; k++) {
      const x = ox + 2 + Math.floor(rnd() * (G.RW - 4)), y = oy + 2 + Math.floor(rnd() * (G.RH - 4));
      const t = this.get(x, y);
      if (t === T.GRASS || t === T.SAND || t === T.PAVE || t === T.DARK || t === T.CONCRETE || t === T.FLOWER) {
        let open = 0;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { if (this.walkable(x + a, y + b)) open++; });
        if (open >= 2) return { x, y };
      }
    }
    return null;
  },

  // ---------- Vẽ ô đất ----------
  baseGround(ctx, tx, ty, px, py) {
    const reg = this.regionOfTile(tx, ty);
    const t = reg ? (GROUND_TILE[reg.ground] ?? T.GRASS) : T.GRASS;
    this.drawTile(ctx, t, tx, ty, px, py);
  },
  drawTile(ctx, t, tx, ty, px, py) {
    const S = G.TS, h = G.hash2(tx, ty), h2 = G.hash2(ty + 91, tx + 17);
    const H = (i) => G.hash2(tx * 13 + i, ty * 7 - i);
    const nb = (a, b) => this.get(tx + a, ty + b);
    const grass = (dark) => {
      ctx.fillStyle = dark ? (h < 0.5 ? '#3e7b38' : '#3a7534') : (h < 0.5 ? '#68ba4d' : '#63b449');
      ctx.fillRect(px, py, S, S);
      ctx.fillStyle = dark ? 'rgba(20,60,20,.25)' : 'rgba(60,130,40,.35)';
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(px + H(i) * S, py + H(i + 9) * S, 3 + H(i + 4) * 4, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = dark ? 'rgba(120,200,110,.25)' : 'rgba(170,230,120,.45)';
      for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.arc(px + H(i + 20) * S, py + H(i + 30) * S, 2 + H(i + 40) * 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = dark ? '#2f6329' : '#4f9b39'; ctx.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) {
        const gx = px + 3 + H(i + 50) * 26, gy = py + 6 + H(i + 60) * 22;
        ctx.beginPath(); ctx.moveTo(gx - 2, gy - 3); ctx.lineTo(gx, gy); ctx.lineTo(gx + 2, gy - 3.5); ctx.stroke();
      }
      if (!dark && h2 < 0.07) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px + 8 + h * 16, py + 8 + h2 * 200 % 16, 1.6, 0, Math.PI * 2); ctx.fill(); }
    };
    switch (t) {
      case T.GRASS: grass(false); break;
      case T.DARK: grass(true); break;
      case T.SAND:
        ctx.fillStyle = h < 0.5 ? '#f2db99' : '#efd794'; ctx.fillRect(px, py, S, S);
        ctx.fillStyle = 'rgba(200,170,100,.35)';
        for (let i = 0; i < 4; i++) ctx.fillRect(px + H(i) * 30, py + H(i + 5) * 30, 2, 2);
        ctx.strokeStyle = 'rgba(210,180,110,.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(px + 16, py + 40 + h * 10, 22, Math.PI * 1.3, Math.PI * 1.7); ctx.stroke();
        if (h2 < 0.05) { ctx.fillStyle = '#ffccbc'; ctx.beginPath(); ctx.arc(px + 20, py + 12, 2.5, Math.PI, 0); ctx.fill(); }
        break;
      case T.WATER: {
        ctx.fillStyle = '#2b86d1'; ctx.fillRect(px, py, S, S);
        ctx.fillStyle = 'rgba(20,90,170,.35)'; ctx.beginPath(); ctx.arc(px + H(1) * S, py + H(2) * S, 9, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(140,205,255,.55)'; ctx.lineWidth = 1.4;
        for (let i = 0; i < 2; i++) {
          const wx = px + 4 + H(i + 3) * 18, wy = py + 6 + H(i + 7) * 20;
          ctx.beginPath(); ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + 3, wy - 2.5, wx + 6, wy); ctx.quadraticCurveTo(wx + 9, wy + 2.5, wx + 12, wy); ctx.stroke();
        }
        const land = (a, b) => { const n = nb(a, b); return n !== T.WATER && n !== T.BRIDGE; };
        ctx.fillStyle = 'rgba(255,255,255,.6)';
        const foam = (x, y, w, hh) => { ctx.fillRect(x, y, w, hh); };
        if (land(0, -1)) { foam(px, py, S, 3); for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(px + 4 + i * 8, py + 3, 2, 0, Math.PI); ctx.fill(); } }
        if (land(0, 1)) foam(px, py + S - 3, S, 3);
        if (land(-1, 0)) foam(px, py, 3, S);
        if (land(1, 0)) foam(px + S - 3, py, 3, S);
        break;
      }
      case T.ROAD: {
        ctx.fillStyle = '#585d63'; ctx.fillRect(px, py, S, S);
        for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.12)'; ctx.fillRect(px + H(i) * 30, py + H(i + 8) * 30, 2, 2); }
        const lx = tx % G.RW, ly = ty % G.RH;
        const horiz = ly === 17 || ly === 18, vert = lx === 23 || lx === 24;
        ctx.fillStyle = '#f2f2f2';
        if (horiz && (lx === 21 || lx === 26) && !vert) { for (let i = 0; i < 4; i++) ctx.fillRect(px + 4, py + 1 + i * 8, 24, 4); }
        else if (vert && (ly === 15 || ly === 20) && !horiz) { for (let i = 0; i < 4; i++) ctx.fillRect(px + 1 + i * 8, py + 4, 4, 24); }
        else {
          ctx.fillStyle = '#f5d742';
          if (horiz && !vert && lx % 2 === 0) ctx.fillRect(px + 4, ly === 17 ? py + S - 1.5 : py - 0.5, 20, 2);
          if (vert && !horiz && ly % 2 === 0) ctx.fillRect(lx === 23 ? px + S - 1.5 : px - 0.5, py + 4, 2, 20);
        }
        // lề đường
        const notRoad = (a, b) => { const n = nb(a, b); return n !== T.ROAD && n !== T.BRIDGE; };
        const curb = (x, y, w, hh, hx, hy, hw, hh2) => { ctx.fillStyle = '#b9bdc1'; ctx.fillRect(x, y, w, hh); ctx.fillStyle = '#e1e3e5'; ctx.fillRect(hx, hy, hw, hh2); };
        if (notRoad(0, -1)) curb(px, py, S, 4, px, py, S, 1.5);
        if (notRoad(0, 1)) curb(px, py + S - 4, S, 4, px, py + S - 4, S, 1.5);
        if (notRoad(-1, 0)) curb(px, py, 4, S, px, py, 1.5, S);
        if (notRoad(1, 0)) curb(px + S - 4, py, 4, S, px + S - 4, py, 1.5, S);
        break;
      }
      case T.PAVE: {
        for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
          const v = G.hash2(tx * 2 + i, ty * 2 + j);
          ctx.fillStyle = v < 0.33 ? '#d6d1c7' : v < 0.66 ? '#d0cbc0' : '#dad5cb';
          const x = px + i * 16, y = py + j * 16;
          ctx.fillRect(x, y, 16, 16);
          ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(x, y, 16, 1.2); ctx.fillRect(x, y, 1.2, 16);
          ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x, y + 14.8, 16, 1.2); ctx.fillRect(x + 14.8, y, 1.2, 16);
        }
        break;
      }
      case T.CONCRETE: {
        ctx.fillStyle = h < 0.5 ? '#a8acb0' : '#a2a6aa'; ctx.fillRect(px, py, S, S);
        ctx.fillStyle = 'rgba(0,0,0,.06)'; ctx.beginPath(); ctx.arc(px + H(1) * 30, py + H(2) * 30, 4 + H(3) * 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.18)';
        if (tx % 4 === 0) ctx.fillRect(px, py, 1, S);
        if (ty % 4 === 0) ctx.fillRect(px, py, S, 1);
        if (h2 < 0.06) { ctx.fillStyle = 'rgba(30,30,40,.18)'; ctx.beginPath(); ctx.ellipse(px + 16, py + 16, 8, 5, h * 3, 0, Math.PI * 2); ctx.fill(); }
        break;
      }
      case T.PATH: {
        ctx.fillStyle = '#d6c09b'; ctx.fillRect(px, py, S, S);
        const stone = (x, y, w, hh) => {
          ctx.fillStyle = '#e6d6b8'; G.rr(ctx, x, y, w, hh, 3); ctx.fill();
          ctx.strokeStyle = 'rgba(140,110,70,.45)'; ctx.lineWidth = 1; ctx.stroke();
        };
        stone(px + 3, py + 3, 12, 10); stone(px + 17, py + 5, 12, 9); stone(px + 6, py + 17, 11, 11); stone(px + 19, py + 18, 10, 10);
        break;
      }
      case T.BRIDGE: {
        ctx.fillStyle = '#2b86d1'; ctx.fillRect(px, py, S, S);
        const vertical = nb(-1, 0) === T.WATER && nb(1, 0) === T.WATER;
        ctx.fillStyle = '#a5754a'; ctx.fillRect(px, py, S, S);
        ctx.fillStyle = '#8a5d36';
        for (let i = 0; i < 4; i++) vertical ? ctx.fillRect(px, py + i * 8, S, 1.2) : ctx.fillRect(px + i * 8, py, 1.2, S);
        ctx.fillStyle = 'rgba(255,255,255,.12)';
        for (let i = 0; i < 4; i++) vertical ? ctx.fillRect(px, py + i * 8 + 1.5, S, 1) : ctx.fillRect(px + i * 8 + 1.5, py, 1, S);
        ctx.fillStyle = '#6d4426';
        if (nb(0, -1) === T.WATER) ctx.fillRect(px, py, S, 3);
        if (nb(0, 1) === T.WATER) ctx.fillRect(px, py + S - 3, S, 3);
        if (nb(-1, 0) === T.WATER) ctx.fillRect(px, py, 3, S);
        if (nb(1, 0) === T.WATER) ctx.fillRect(px + S - 3, py, 3, S);
        break;
      }
      case T.FLOWER: {
        grass(false);
        const cols = ['#ff5252', '#ffeb3b', '#e040fb', '#ffffff', '#ff9800', '#40c4ff'];
        for (let i = 0; i < 3; i++) {
          const c = cols[Math.floor(H(i + 70) * cols.length)];
          const fx = px + 6 + H(i + 80) * 20, fy = py + 6 + H(i + 90) * 20;
          ctx.strokeStyle = '#3d8b2e'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy + 5); ctx.stroke();
          ctx.fillStyle = c;
          for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(fx + Math.cos(k * 1.57) * 2.2, fy + Math.sin(k * 1.57) * 2.2, 1.8, 0, Math.PI * 2); ctx.fill(); }
          ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.arc(fx, fy, 1.3, 0, Math.PI * 2); ctx.fill();
        }
        break;
      }
      case T.TREE: case T.PINE: {
        if (!this._noBase) this.baseGround(ctx, tx, ty, px, py);
        const reg = this.regionOfTile(tx, ty);
        ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(px + 18, py + 27, 12, 4.5, 0, 0, Math.PI * 2); ctx.fill();
        const OL = 'rgba(20,45,20,.65)';
        if (reg && reg.ground === 'sand') { // cây dừa
          ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(px + 15, py + 28); ctx.quadraticCurveTo(px + 20, py + 18, px + 16, py + 8); ctx.stroke();
          ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 3.2;
          for (let i = 0; i < 6; i++) {
            const a = -Math.PI + i * Math.PI / 5;
            ctx.beginPath(); ctx.moveTo(px + 16, py + 8); ctx.quadraticCurveTo(px + 16 + Math.cos(a) * 9, py + 2 + Math.sin(a) * 8, px + 16 + Math.cos(a) * 15, py + 12 + Math.sin(a) * 5); ctx.stroke();
          }
          ctx.fillStyle = '#6d4c41'; ctx.beginPath(); ctx.arc(px + 14, py + 10, 2.2, 0, Math.PI * 2); ctx.arc(px + 18, py + 10.5, 2.2, 0, Math.PI * 2); ctx.fill();
        } else if (t === T.PINE) {
          ctx.fillStyle = '#5d4037'; ctx.fillRect(px + 14, py + 22, 4, 7);
          ctx.strokeStyle = OL; ctx.lineWidth = 1.2;
          [['#1b5e20', 2, 24, 13], ['#256d2a', -2, 17, 11], ['#2e7d32', -6, 10, 8]].forEach(([c, top, bot, w]) => {
            ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(px + 16, py + top); ctx.lineTo(px + 16 + w, py + bot); ctx.lineTo(px + 16 - w, py + bot); ctx.closePath(); ctx.fill(); ctx.stroke();
          });
          ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.beginPath(); ctx.moveTo(px + 16, py - 5); ctx.lineTo(px + 19, py + 6); ctx.lineTo(px + 15, py + 6); ctx.fill();
        } else {
          ctx.fillStyle = '#6d4c41'; ctx.fillRect(px + 13, py + 17, 6, 11);
          ctx.fillStyle = '#5d4037'; ctx.fillRect(px + 16.5, py + 17, 2.5, 11);
          ctx.strokeStyle = OL; ctx.lineWidth = 1.2;
          const c1 = h < 0.5 ? '#2e7d32' : '#33873a';
          ctx.fillStyle = c1;
          ctx.beginPath(); ctx.arc(px + 16, py + 11, 12, 0, Math.PI * 2); ctx.arc(px + 9, py + 15, 7, 0, Math.PI * 2); ctx.arc(px + 23, py + 15, 7, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(px + 16, py + 11, 12, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#43a047'; ctx.beginPath(); ctx.arc(px + 13, py + 8, 7, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(200,255,170,.3)'; ctx.beginPath(); ctx.arc(px + 11, py + 5, 3.5, 0, Math.PI * 2); ctx.fill();
          if (h2 < 0.25) { ctx.fillStyle = '#e53935'; [[19, 12], [9, 15], [15, 17]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(px + a, py + b, 1.8, 0, Math.PI * 2); ctx.fill(); }); }
        }
        break;
      }
      case T.ROCK: {
        this.baseGround(ctx, tx, ty, px, py);
        ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(px + 18, py + 25, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8a8f94'; ctx.beginPath(); ctx.moveTo(px + 5, py + 24); ctx.lineTo(px + 8, py + 13); ctx.lineTo(px + 16, py + 9); ctx.lineTo(px + 25, py + 13); ctx.lineTo(px + 28, py + 24); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(40,40,50,.6)'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.fillStyle = '#aeb3b8'; ctx.beginPath(); ctx.moveTo(px + 9, py + 14); ctx.lineTo(px + 16, py + 10.5); ctx.lineTo(px + 19, py + 16); ctx.lineTo(px + 11, py + 19); ctx.closePath(); ctx.fill();
        if (h < 0.4) { ctx.fillStyle = 'rgba(100,170,60,.6)'; ctx.beginPath(); ctx.arc(px + 22, py + 21, 3, 0, Math.PI * 2); ctx.fill(); }
        break;
      }
      case T.BUSH: {
        this.baseGround(ctx, tx, ty, px, py);
        ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(px + 17, py + 27, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2e7d32'; ctx.strokeStyle = 'rgba(20,50,20,.6)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(px + 10, py + 20, 8, 0, Math.PI * 2); ctx.arc(px + 22, py + 20, 8, 0, Math.PI * 2); ctx.arc(px + 16, py + 13, 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + 16, py + 13, 8, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
        ctx.fillStyle = '#4caf50'; ctx.beginPath(); ctx.arc(px + 13, py + 12, 3.5, 0, Math.PI * 2); ctx.arc(px + 8, py + 18, 2.5, 0, Math.PI * 2); ctx.fill();
        if (h2 < 0.3) { ctx.fillStyle = '#7e57c2'; [[20, 17], [24, 21], [12, 22]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(px + a, py + b, 1.6, 0, Math.PI * 2); ctx.fill(); }); }
        break;
      }
      case T.FENCE: {
        this.baseGround(ctx, tx, ty, px, py);
        ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(px, py + 26, S, 3);
        ctx.fillStyle = '#a1887f'; ctx.fillRect(px, py + 11, S, 4); ctx.fillRect(px, py + 20, S, 4);
        ctx.fillStyle = '#795548';
        [4, 20].forEach((x) => { ctx.fillRect(px + x, py + 5, 6, 23); ctx.beginPath(); ctx.moveTo(px + x, py + 5); ctx.lineTo(px + x + 3, py + 2); ctx.lineTo(px + x + 6, py + 5); ctx.fill(); });
        ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(px + 4, py + 5, 1.5, 23); ctx.fillRect(px + 20, py + 5, 1.5, 23);
        break;
      }
      case T.FARM: {
        ctx.fillStyle = '#7a5638'; ctx.fillRect(px, py, S, S);
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = '#8d6544'; ctx.fillRect(px + 1, py + 2 + i * 8, S - 2, 4);
          ctx.fillStyle = '#5d4029'; ctx.fillRect(px + 1, py + 6 + i * 8, S - 2, 1.5);
        }
        ctx.fillStyle = 'rgba(0,0,0,.18)';
        for (let i = 0; i < 4; i++) ctx.fillRect(px + H(i) * 28, py + H(i + 4) * 28, 2, 2);
        ctx.fillStyle = '#a1887f';
        if (nb(0, -1) !== T.FARM) ctx.fillRect(px, py, S, 3);
        if (nb(0, 1) !== T.FARM) ctx.fillRect(px, py + S - 3, S, 3);
        if (nb(-1, 0) !== T.FARM) ctx.fillRect(px, py, 3, S);
        if (nb(1, 0) !== T.FARM) ctx.fillRect(px + S - 3, py, 3, S);
        break;
      }
      case T.LAMP: case T.BUILD: case T.DOOR:
        this.baseGround(ctx, tx, ty, px, py); // phần trên được vẽ riêng
        break;
    }
  },

  CH: 8, // ô mỗi chunk
  getChunk(cx, cy) {
    const key = cx + ',' + cy;
    let c = this.chunks.get(key);
    if (c) { this.chunks.delete(key); this.chunks.set(key, c); return c; } // LRU
    const S = G.TS, n = this.CH, R = this.R;
    c = document.createElement('canvas');
    c.width = c.height = n * S * R;
    const ctx = c.getContext('2d');
    ctx.scale(R, R);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const tx = cx * n + x, ty = cy * n + y;
      if (tx >= this.w || ty >= this.h) { ctx.fillStyle = '#2b86d1'; ctx.fillRect(x * S, y * S, S, S); continue; }
      const t = this.get(tx, ty);
      ctx.save();
      ctx.beginPath(); ctx.rect(x * S - 0.5, y * S - 0.5, S + 1, S + 1); ctx.clip();
      if (t === T.TREE || t === T.PINE) this.baseGround(ctx, tx, ty, x * S, y * S);
      else this.drawTile(ctx, t, tx, ty, x * S, y * S);
      ctx.restore();
    }
    // tán cây tràn sang ô bên cạnh: vẽ lại cây sau cùng, không cắt
    for (let y = 0; y <= n; y++) for (let x = 0; x < n; x++) {
      const tx = cx * n + x, ty = cy * n + y, t = this.get(tx, ty);
      if (t === T.TREE || t === T.PINE) { ctx.save(); ctx.beginPath(); ctx.rect(x * S - 8, y * S - 8, S + 16, S + 8); ctx.clip(); this.drawTreeTop(ctx, t, tx, ty, x * S, y * S); ctx.restore(); }
    }
    this.chunks.set(key, c);
    const cap = R >= 3 ? 28 : R === 2 ? 48 : 80;
    while (this.chunks.size > cap) this.chunks.delete(this.chunks.keys().next().value);
    return c;
  },
  // vẽ lại riêng phần cây (không vẽ nền) để tán không bị cắt bởi ô kế bên
  drawTreeTop(ctx, t, tx, ty, px, py) {
    this._noBase = true;
    this.drawTile(ctx, t, tx, ty, px, py);
    this._noBase = false;
  },

  // Vẽ mặt đất trong hệ toạ độ màn hình (khớp điểm ảnh, không bị viền giữa các chunk)
  drawGround(ctx, cam, sc) {
    const S = G.TS, n = this.CH, cs = n * S;
    const x0 = Math.floor(cam.x / cs), y0 = Math.floor(cam.y / cs);
    const x1 = Math.floor((cam.x + cam.w) / cs), y1 = Math.floor((cam.y + cam.h) / cs);
    ctx.imageSmoothingEnabled = true;
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      if (cx < 0 || cy < 0 || cx * n >= this.w || cy * n >= this.h) continue;
      const sx0 = Math.round((cx * cs - cam.x) * sc), sx1 = Math.round(((cx + 1) * cs - cam.x) * sc);
      const sy0 = Math.round((cy * cs - cam.y) * sc), sy1 = Math.round(((cy + 1) * cs - cam.y) * sc);
      ctx.drawImage(this.getChunk(cx, cy), sx0, sy0, sx1 - sx0, sy1 - sy0);
    }
  },

  drawBuildings(ctx, cam, t, night) {
    const S = G.TS;
    this.buildings.forEach((b) => {
      const X = b.x * S, Y = b.y * S, W = b.w * S, H = b.h * S;
      if (X - 20 > cam.x + cam.w || Y - 50 > cam.y + cam.h || X + W + 20 < cam.x || Y + H + 10 < cam.y) return;
      const bt = BUILDING_TYPES[b.t] || BUILDING_TYPES.house;
      const roofH = Math.max(S, Math.floor(H * 0.5));
      const wallTop = Y + roofH - 4;
      // bóng đổ
      ctx.fillStyle = 'rgba(0,0,0,.2)';
      ctx.beginPath(); ctx.moveTo(X + 4, Y + H); ctx.lineTo(X + W + 10, Y + H); ctx.lineTo(X + W + 10, Y + 10); ctx.lineTo(X + W, Y); ctx.closePath(); ctx.fill();
      // tường
      const wg = ctx.createLinearGradient(0, wallTop, 0, Y + H);
      wg.addColorStop(0, bt.wall); wg.addColorStop(1, shade(bt.wall, -0.1));
      ctx.fillStyle = wg; ctx.fillRect(X, wallTop, W, Y + H - wallTop);
      ctx.fillStyle = shade(bt.wall, -0.18); ctx.fillRect(X, Y + H - 6, W, 6);
      ctx.fillStyle = 'rgba(0,0,0,.07)'; ctx.fillRect(X, wallTop, 4, Y + H - wallTop); ctx.fillRect(X + W - 4, wallTop, 4, Y + H - wallTop);
      ctx.strokeStyle = 'rgba(40,30,30,.45)'; ctx.lineWidth = 1.2; ctx.strokeRect(X + 0.5, wallTop, W - 1, Y + H - wallTop - 0.5);
      // cửa sổ
      const DX = b.dx * S, DY = b.dy * S;
      const wh = Math.min(15, Y + H - wallTop - 22);
      const winY = wallTop + Math.max(6, (Y + H - wallTop - wh) / 2 - 6);
      if (wh > 6) {
        for (let wx = X + 9; wx < X + W - 22; wx += 30) {
          if (Math.abs(wx + 8 - (DX + 16)) < 24) continue;
          ctx.fillStyle = '#5d4037'; ctx.fillRect(wx - 2, winY - 2, 20, wh + 4);
          if (night) { ctx.fillStyle = '#ffe082'; ctx.fillRect(wx, winY, 16, wh); ctx.fillStyle = 'rgba(255,200,80,.5)'; ctx.fillRect(wx, winY + wh / 2, 16, wh / 2); }
          else { const gg = ctx.createLinearGradient(wx, winY, wx + 16, winY + wh); gg.addColorStop(0, '#bbdefb'); gg.addColorStop(1, '#64b5f6'); ctx.fillStyle = gg; ctx.fillRect(wx, winY, 16, wh); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(wx + 2, winY + 2, 3, wh - 4); }
          ctx.fillStyle = '#5d4037'; ctx.fillRect(wx + 7.2, winY, 1.6, wh); ctx.fillRect(wx, winY + wh / 2 - 0.8, 16, 1.6);
          ctx.fillStyle = '#fafafa'; ctx.fillRect(wx - 3, winY + wh + 2, 22, 2.5);
          if (b.t === 'house' || b.t === 'home') { // bồn hoa dưới cửa sổ
            ctx.fillStyle = '#8d6e63'; ctx.fillRect(wx - 1, winY + wh + 4.5, 18, 4);
            ['#e91e63', '#ffeb3b', '#ff5722', '#e91e63'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(wx + 2 + i * 4.3, winY + wh + 4, 1.8, 0, Math.PI * 2); ctx.fill(); });
          }
        }
      }
      // mái
      const rg = ctx.createLinearGradient(0, Y - 6, 0, Y + roofH);
      rg.addColorStop(0, shade(bt.roof, 0.18)); rg.addColorStop(1, shade(bt.roof, -0.12));
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.moveTo(X - 6, Y + roofH); ctx.lineTo(X + 10, Y - 6); ctx.lineTo(X + W - 10, Y - 6); ctx.lineTo(X + W + 6, Y + roofH); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(30,20,20,.55)'; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.save(); ctx.clip();
      ctx.strokeStyle = 'rgba(0,0,0,.14)'; ctx.lineWidth = 1;
      for (let ry = Y + 2, row = 0; ry < Y + roofH; ry += 7, row++) {
        ctx.beginPath(); ctx.moveTo(X - 6, ry); ctx.lineTo(X + W + 6, ry); ctx.stroke();
        for (let rx = X - 6 + (row % 2) * 6; rx < X + W + 6; rx += 12) { ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx, ry + 7); ctx.stroke(); }
      }
      ctx.restore();
      ctx.fillStyle = shade(bt.roof, 0.3); ctx.fillRect(X + 10, Y - 7, W - 20, 3);
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(X, Y + roofH, W, 4);
      if (b.t === 'factory') { // ống khói
        ctx.fillStyle = '#78909c'; ctx.fillRect(X + W - 40, Y - 30, 14, 30);
        ctx.fillStyle = '#e53935'; ctx.fillRect(X + W - 40, Y - 26, 14, 3);
        for (let k = 0; k < 3; k++) {
          const p = ((t * 0.5) + k / 3) % 1;
          ctx.fillStyle = `rgba(220,220,220,${0.55 * (1 - p)})`;
          ctx.beginPath(); ctx.arc(X + W - 33 + p * 10, Y - 36 - p * 30, 5 + p * 8, 0, Math.PI * 2); ctx.fill();
        }
      } else if (b.t === 'home' || b.t === 'house') {
        ctx.fillStyle = '#8d6e63'; ctx.fillRect(X + W - 26, Y - 14, 9, 14); ctx.fillStyle = '#6d4c41'; ctx.fillRect(X + W - 27, Y - 16, 11, 3);
      }
      // mái hiên cửa hàng
      if (b.t === 'shop' || b.t === 'cafe' || b.t === 'farmshop') {
        const aw = W - 16, ay = wallTop + 2;
        for (let i = 0; i < aw; i += 10) { ctx.fillStyle = (i / 10) % 2 ? '#fff' : bt.roof; ctx.fillRect(X + 8 + i, ay, Math.min(10, aw - i), 8); }
        ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(X + 8, ay + 8, aw, 2);
      }
      // cửa ra vào
      ctx.fillStyle = '#4e342e'; ctx.fillRect(DX + 4, DY + 1, 24, 30);
      ctx.fillStyle = '#795548'; G.rr(ctx, DX + 6, DY + 3, 20, 27, 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(DX + 8, DY + 6, 7, 9); ctx.fillRect(DX + 17, DY + 6, 7, 9); ctx.fillRect(DX + 8, DY + 18, 7, 9); ctx.fillRect(DX + 17, DY + 18, 7, 9);
      ctx.fillStyle = '#ffca28'; ctx.beginPath(); ctx.arc(DX + 22, DY + 17, 1.8, 0, Math.PI * 2); ctx.fill();
      if (night) { ctx.fillStyle = 'rgba(255,230,140,.9)'; ctx.beginPath(); ctx.arc(DX + 16, DY - 1, 2.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = shade(bt.roof, -0.05); ctx.beginPath(); ctx.moveTo(DX + 1, DY + 2); ctx.lineTo(DX + 31, DY + 2); ctx.lineTo(DX + 28, DY - 4); ctx.lineTo(DX + 4, DY - 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#bdbdbd'; ctx.fillRect(DX + 3, DY + 30, 26, 3);
      // chậu cây hai bên cửa
      if (b.w >= 5) [DX - 7, DX + 33].forEach((px) => {
        ctx.fillStyle = '#a1887f'; ctx.fillRect(px - 4, DY + 22, 8, 8);
        ctx.fillStyle = '#388e3c'; ctx.beginPath(); ctx.arc(px, DY + 19, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#66bb6a'; ctx.beginPath(); ctx.arc(px - 2, DY + 17, 2.5, 0, Math.PI * 2); ctx.fill();
      });
      if (b.t === 'farmshop') { // thùng rau
        ctx.fillStyle = '#a1887f'; ctx.fillRect(X + 4, Y + H - 16, 18, 12); ctx.fillStyle = '#e53935'; [6, 11, 16].forEach((x) => { ctx.beginPath(); ctx.arc(X + x + 2, Y + H - 16, 3, 0, Math.PI * 2); ctx.fill(); });
      }
      // biển hiệu
      const label = bt.icon + ' ' + b.name;
      ctx.font = 'bold 12px system-ui, sans-serif';
      const tw = ctx.measureText(label).width + 14;
      const sx = X + W / 2 - tw / 2, sy = Y + roofH * 0.35 - 10;
      ctx.fillStyle = 'rgba(0,0,0,.25)'; G.rr(ctx, sx + 1.5, sy + 2, tw, 19, 6); ctx.fill();
      ctx.fillStyle = '#fffdf6'; G.rr(ctx, sx, sy, tw, 19, 6); ctx.fill();
      ctx.strokeStyle = shade(bt.roof, -0.2); ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#263238'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, X + W / 2, sy + 10);
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
      [T.BRIDGE]: [156, 107, 63], [T.BUSH]: [46, 125, 50], [T.PATH]: [216, 195, 160], [T.LAMP]: [90, 100, 110], [T.FARM]: [122, 86, 56],
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

// làm sáng (+) hoặc tối (−) một màu hex
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (k >= 0) { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; } else { r *= 1 + k; g *= 1 + k; b *= 1 + k; }
  return 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')';
}
G.shade = shade;
