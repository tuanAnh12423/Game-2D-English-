// ============================================================
// ĐỒ HOẠ PIXEL — dùng bộ Kenney Tiny Town + Tiny Farm (CC0, assets/kenney/).
// Mỗi ô Kenney 16×16 được phóng ×2 thành 1 ô game (G.TS = 32).
// Ô nào không có hình phù hợp (nước, cầu, đường nhựa…) thì trả về false
// để world.js vẽ theo kiểu pastel cũ. Bật/tắt trong ⚙️ Cài đặt → Đồ hoạ.
// ============================================================
G.pix = {
  ready: false,
  img: {},
  load(onDone) {
    let left = 2;
    ['town', 'farm'].forEach((k) => {
      const im = new Image();
      im.onload = () => { this.img[k] = im; if (--left === 0) { this.ready = true; if (onDone) onDone(); } };
      im.onerror = () => { left = -99; };
      im.src = 'assets/kenney/tiny-' + k + '.png';
    });
  },
  on() { return this.ready && (!G.state || (G.state.settings.gfx || 'pixel') === 'pixel'); },
  // vẽ ô số i của bộ k vào (x, y) cỡ w×h (mặc định 1 ô game); sx, sy, sw, sh: cắt một phần ô (đơn vị điểm ảnh gốc)
  put(ctx, k, i, x, y, w = G.TS, h = G.TS, sx = 0, sy = 0, sw = 16, sh = 16) {
    const im = this.img[k];
    if (!im) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(im, (i % 12) * 16 + sx, Math.floor(i / 12) * 16 + sy, sw, sh, x, y, w, h);
  },
  // viền cỏ quanh ô đất/đường: lấy dải mép của ô viền tương ứng
  edges(ctx, k, set, px, py, same) {
    const S = G.TS, e = 4, E = e * 2;
    if (!same(0, -1)) this.put(ctx, k, set.t, px, py, S, E, 0, 0, 16, e);
    if (!same(0, 1)) this.put(ctx, k, set.b, px, py + S - E, S, E, 0, 16 - e, 16, e);
    if (!same(-1, 0)) this.put(ctx, k, set.l, px, py, E, S, 0, 0, e, 16);
    if (!same(1, 0)) this.put(ctx, k, set.r, px + S - E, py, E, S, 16 - e, 0, e, 16);
  },
  DIRT: { c: 25, t: 13, b: 37, l: 24, r: 26 },
  // bảng màu lấy từ hình Kenney (viền #3f2631, đất #eaa56c, gỗ #bd6c4a, đá #c0cbdc)
  KC: {
    outline: '#3f2631', road: '#aab2c9', roadLo: '#98a0ba', roadHi: '#c0cbdc', curb: '#eef2f8', dash: '#fff0a8', zebra: '#f4f6fb',
    water: '#7ccfee', water2: '#77cbeb', ripple: '#c9efff', foam: '#e9f9ff', plank: '#eaa56c', plankDk: '#bd6c4a', plankHi: '#f6c08e',
  },
  STONE: { c: 109, t: 97, b: 121, l: 108, r: 110 },

  // ---------- Ô mặt đất ----------
  tile(world, ctx, t, tx, ty, px, py) {
    const T = G.T, S = G.TS, h = G.hash2(tx, ty);
    const nb = (a, b) => world.get(tx + a, ty + b);
    const reg = world.regionOfTile(tx, ty);
    const grass = () => this.put(ctx, 'town', h < 0.72 ? 0 : h < 0.93 ? 1 : 2, px, py);
    const tint = (c) => { ctx.fillStyle = c; ctx.fillRect(px, py, S, S); };
    const pathLike = (v) => v === T.PATH || v === T.DOOR || v === T.BRIDGE || v === T.BUILD;
    const roadLike = (v) => v === T.ROAD || v === T.BRIDGE;
    switch (t) {
      case T.GRASS: grass(); return true;
      case T.FLOWER: this.put(ctx, 'town', 2, px, py); return true;
      case T.DARK: this.put(ctx, 'town', h < 0.8 ? 0 : 1, px, py); tint('rgba(20,70,40,.18)'); return true;
      case T.SAND:
        this.put(ctx, 'town', 25, px, py); tint('rgba(255,236,190,.45)');
        if (h < 0.08) this.put(ctx, 'town', 40, px, py);
        return true;
      case T.PATH:
        if (reg && (reg.ground === 'city' || reg.ground === 'industrial')) { this.put(ctx, 'town', 109, px, py); tint('rgba(255,236,210,.35)'); return true; }
        this.put(ctx, 'town', 25, px, py);
        this.edges(ctx, 'town', this.DIRT, px, py, (a, b) => { const v = nb(a, b); return pathLike(v) || roadLike(v) || v === T.LAMP; });
        return true;
      case T.ROAD: {
        // đường nhựa vẽ theo lưới điểm ảnh 2 đơn vị, cùng bảng màu & viền tối của Kenney
        const K = this.KC;
        ctx.fillStyle = K.road; ctx.fillRect(px, py, S, S);
        for (let i = 0; i < 5; i++) { const hx = G.hash2(tx * 7 + i, ty * 3 - i); ctx.fillStyle = i % 2 ? K.roadLo : K.roadHi; ctx.fillRect(px + Math.floor(hx * 15) * 2, py + Math.floor(G.hash2(ty + i * 5, tx - i) * 15) * 2, 2, 2); }
        const open = (v) => roadLike(v) || v === T.PATH || v === T.DOOR; // lối rẽ vào nhà: không có bó vỉa
        const side = (a, b2, f) => { const v = nb(a, b2); if (open(v)) return; f(); };
        side(0, -1, () => { ctx.fillStyle = K.outline; ctx.fillRect(px, py, S, 2); ctx.fillStyle = K.curb; ctx.fillRect(px, py + 2, S, 2); });
        side(0, 1, () => { ctx.fillStyle = K.curb; ctx.fillRect(px, py + S - 4, S, 2); ctx.fillStyle = K.outline; ctx.fillRect(px, py + S - 2, S, 2); });
        side(-1, 0, () => { ctx.fillStyle = K.outline; ctx.fillRect(px, py, 2, S); ctx.fillStyle = K.curb; ctx.fillRect(px + 2, py, 2, S); });
        side(1, 0, () => { ctx.fillStyle = K.curb; ctx.fillRect(px + S - 4, py, 2, S); ctx.fillStyle = K.outline; ctx.fillRect(px + S - 2, py, 2, S); });
        // vạch giữa đường 2 làn & vạch qua đường (cùng vị trí với kiểu cũ)
        const lx = tx % G.RW, ly = ty % G.RH, horiz = ly === 17 || ly === 18, vert = lx === 23 || lx === 24;
        ctx.fillStyle = K.dash;
        const zebraH = horiz && !vert && (lx === 21 || lx === 26), zebraV = vert && !horiz && (ly === 15 || ly === 20);
        if (horiz && !vert && !zebraH && ly === 17 && tx % 2 === 0) ctx.fillRect(px + 8, py + S - 2, 16, 4);
        if (vert && !horiz && !zebraV && lx === 23 && ty % 2 === 0) ctx.fillRect(px + S - 2, py + 8, 4, 16);
        ctx.fillStyle = K.zebra;
        if (horiz && (lx === 21 || lx === 26) && !vert) for (let i = 0; i < 4; i++) ctx.fillRect(px + 4, py + 2 + i * 8, 24, 4);
        if (vert && (ly === 15 || ly === 20) && !horiz) for (let i = 0; i < 4; i++) ctx.fillRect(px + 2 + i * 8, py + 4, 4, 24);
        return true;
      }
      case T.WATER: {
        const K = this.KC, land = (a, b2) => { const v = nb(a, b2); return v !== T.WATER && v !== T.BRIDGE; };
        ctx.fillStyle = (tx + ty) % 2 ? K.water : K.water2; ctx.fillRect(px, py, S, S);
        ctx.fillStyle = K.ripple;
        for (let i = 0; i < 2; i++) { const wx = Math.floor(G.hash2(tx + i * 9, ty) * 10) * 2, wy = Math.floor(G.hash2(ty - i * 4, tx + 3) * 13) * 2; ctx.fillRect(px + wx, py + wy, 8, 2); ctx.fillRect(px + wx + 8, py + wy - 2, 4, 2); }
        if (land(0, -1)) { ctx.fillStyle = K.outline; ctx.fillRect(px, py, S, 2); ctx.fillStyle = K.foam; ctx.fillRect(px, py + 2, S, 2); for (let i = 0; i < 4; i++) ctx.fillRect(px + 2 + i * 8, py + 4, 4, 2); }
        if (land(0, 1)) { ctx.fillStyle = K.foam; ctx.fillRect(px, py + S - 4, S, 2); ctx.fillStyle = K.outline; ctx.fillRect(px, py + S - 2, S, 2); }
        if (land(-1, 0)) { ctx.fillStyle = K.outline; ctx.fillRect(px, py, 2, S); ctx.fillStyle = K.foam; ctx.fillRect(px + 2, py, 2, S); }
        if (land(1, 0)) { ctx.fillStyle = K.foam; ctx.fillRect(px + S - 4, py, 2, S); ctx.fillStyle = K.outline; ctx.fillRect(px + S - 2, py, 2, S); }
        return true;
      }
      case T.BRIDGE: {
        const K = this.KC, w = (a, b2) => nb(a, b2) === T.WATER;
        const across = w(0, -1) || w(0, 1); // nước ở trên/dưới → cầu nằm ngang, ván xếp dọc
        ctx.fillStyle = K.plank; ctx.fillRect(px, py, S, S);
        ctx.fillStyle = K.plankDk;
        for (let i = 0; i < 4; i++) across ? ctx.fillRect(px + i * 8 + 6, py, 2, S) : ctx.fillRect(px, py + i * 8 + 6, S, 2);
        ctx.fillStyle = K.plankHi;
        for (let i = 0; i < 4; i++) across ? ctx.fillRect(px + i * 8, py, 2, S) : ctx.fillRect(px, py + i * 8, S, 2);
        // lan can ở hai bên phía có nước
        const rail = (x, y, ww, hh) => { ctx.fillStyle = K.outline; ctx.fillRect(x, y, ww, hh); };
        if (w(0, -1)) { rail(px, py, S, 6); ctx.fillStyle = K.plankDk; ctx.fillRect(px, py + 2, S, 2); }
        if (w(0, 1)) { rail(px, py + S - 6, S, 6); ctx.fillStyle = K.plankDk; ctx.fillRect(px, py + S - 4, S, 2); }
        if (w(-1, 0)) { rail(px, py, 6, S); ctx.fillStyle = K.plankDk; ctx.fillRect(px + 2, py, 2, S); }
        if (w(1, 0)) { rail(px + S - 6, py, 6, S); ctx.fillStyle = K.plankDk; ctx.fillRect(px + S - 4, py, 2, S); }
        return true;
      }
      case T.PAVE: {
        this.put(ctx, 'town', 109, px, py);
        // gạch lát xen kẽ hồng – kem cho phố dễ thương hơn
        tint((tx + ty) % 2 ? 'rgba(255,170,205,.26)' : 'rgba(255,240,225,.35)');
        ctx.fillStyle = 'rgba(160,110,140,.18)'; ctx.fillRect(px, py + S - 1, S, 1); ctx.fillRect(px + S - 1, py, 1, S);
        return true;
      }
      case T.CONCRETE: this.put(ctx, 'town', 109, px, py); tint('rgba(90,90,120,.18)'); return true;
      case T.TREE: case T.PINE: {
        if (reg && reg.ground === 'sand') return false; // cây dừa: giữ kiểu cũ
        if (!world._noBase) { if (reg && reg.ground === 'forest') this.put(ctx, 'town', 0, px, py), tint('rgba(20,70,40,.18)'); else grass(); }
        const autumn = G.hash2(tx + 5, ty * 3) < 0.12;
        const i = t === T.PINE ? (autumn ? 3 : 4) : (h < 0.5 ? (autumn ? 15 : 16) : (autumn ? 27 : 28));
        this.put(ctx, 'town', i, px, py);
        return true;
      }
      case T.BUSH: grass(); this.put(ctx, 'town', 5, px, py); return true;
      case T.ROCK: grass(); this.put(ctx, 'farm', h < 0.5 ? 89 : 77, px, py); return true;
      case T.FENCE: {
        (reg && (reg.ground === 'city' || reg.ground === 'industrial')) ? this.put(ctx, 'town', 109, px, py) : grass();
        const L = nb(-1, 0) === T.FENCE, R = nb(1, 0) === T.FENCE, U = nb(0, -1) === T.FENCE, D = nb(0, 1) === T.FENCE;
        let i;
        if (L || R) i = L && R ? 81 : R ? 80 : 82;
        else i = U && D ? 59 : D ? 47 : U ? 71 : 47;
        this.put(ctx, 'town', i, px, py);
        return true;
      }
      case T.FARM: {
        const L = nb(-1, 0) === T.FARM, R = nb(1, 0) === T.FARM;
        this.put(ctx, 'farm', !L && !R ? 61 : !L ? 60 : !R ? 63 : (h < 0.5 ? 61 : 62), px, py);
        return true;
      }
      case T.LAMP: case T.BUILD: case T.DOOR: {
        const g = reg ? reg.ground : 'grass';
        if (g === 'city' || g === 'industrial') this.put(ctx, 'town', 109, px, py), tint(g === 'city' ? 'rgba(255,190,215,.16)' : 'rgba(90,90,120,.18)');
        else if (g === 'sand') this.put(ctx, 'town', 25, px, py), tint('rgba(255,236,190,.45)');
        else grass();
        return true;
      }
    }
    return false;
  },

  // ---------- Nhà cửa ----------
  BLUE: { service: 1, library: 1, hvac: 1, factory: 1, airport: 1, station: 1, hotel: 1, shop: 1 },
  STONE_WALL: { service: 1, library: 1, hvac: 1, factory: 1, airport: 1, station: 1, hotel: 1, shop: 1, mall: 1 },
  cache: {},
  building(b, night) {
    const key = b.idx + (night ? 'n' : 'd');
    if (this.cache[key]) return this.cache[key];
    const w = b.w, h = b.h, c = document.createElement('canvas');
    c.width = w * 16; c.height = h * 16;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    const P = (i, cx, cy) => this.put(x, 'town', i, cx * 16, cy * 16, 16, 16);
    const blue = this.BLUE[b.t], stone = this.STONE_WALL[b.t];
    const roofH = Math.max(1, Math.ceil(h * 0.5));
    const R0 = blue ? [48, 49, 50] : [52, 53, 54], R1 = blue ? [60, 61, 62] : [64, 65, 66];
    for (let r = 0; r < roofH; r++) for (let q = 0; q < w; q++) {
      const row = r === roofH - 1 && roofH > 1 ? R1 : R0;
      P(row[q === 0 ? 0 : q === w - 1 ? 2 : 1], q, r);
    }
    // tô màu mái theo loại toà nhà (giữ bóng đổ của hình gốc)
    const bt = BUILDING_TYPES[b.t] || BUILDING_TYPES.house;
    x.globalCompositeOperation = 'source-atop';
    x.globalAlpha = 0.42; x.fillStyle = bt.roof; x.fillRect(0, 0, w * 16, roofH * 16);
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    // tường, cửa sổ, cửa
    const W = stone ? { l: 76, m: 77, r: 79, win: 88, door: 90 } : { l: 72, m: 73, r: 75, win: 84, door: 86 };
    const doorCol = b.dx - b.x, wins = [];
    for (let r = roofH; r < h; r++) for (let q = 0; q < w; q++) {
      const last = r === h - 1;
      let i = q === 0 ? W.l : q === w - 1 ? W.r : W.m;
      if (last && q === doorCol) i = W.door;
      else if (q > 0 && q < w - 1 && Math.abs(q - doorCol) >= 2 && (q - doorCol) % 2 === 0 && (r === roofH || last)) { i = W.win; wins.push([q, r]); }
      P(i, q, r);
    }
    if (night) {
      x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(255,220,120,.45)';
      wins.forEach(([q, r]) => x.fillRect(q * 16 + 4, r * 16 + 4, 8, 8));
      x.globalCompositeOperation = 'source-over';
    }
    this.cache[key] = c;
    return c;
  },
  drawBuilding(ctx, b, night) {
    const S = G.TS, X = b.x * S, Y = b.y * S;
    ctx.fillStyle = 'rgba(60,40,60,.18)'; ctx.fillRect(X + 4, Y + b.h * S - 2, b.w * S, 6);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.building(b, night), X, Y, b.w * S, b.h * S);
    ctx.imageSmoothingEnabled = true;
  },

  // ---------- Cây trồng & vật nuôi ----------
  CROP_ROW: { carrot: 4, radish: 16, corn: 28, tomato: 40, lettuce: 52 },
  plant(ctx, cropId, stage, cx, cy) {
    const r = this.CROP_ROW[cropId];
    if (r === undefined || !this.on()) return false;
    const i = r + [0, 1, 2, 2][stage];
    this.put(ctx, 'farm', i, cx - 16, cy - 22);
    return true;
  },
  ANIMAL: { sheep: 120, cow: 121, chicken: 122 },
  // nơi gọi đã lật hình theo hướng đi, coi hình gốc là quay mặt sang trái;
  // hình nào gốc quay sang phải thì lật thêm một lần
  FACES_RIGHT: { sheep: 1, cow: 1 },
  animal(ctx, kind, x, y) {
    const i = this.ANIMAL[kind];
    if (i === undefined || !this.on()) return false;
    ctx.save(); ctx.translate(x, y); if (this.FACES_RIGHT[kind]) ctx.scale(-1, 1);
    this.put(ctx, 'farm', i, -16, -30);
    ctx.restore();
    return true;
  },
  // ---------- Sprite điểm ảnh từ hình vẽ vector ----------
  // Vẽ fn ở nửa độ phân giải (1 điểm ảnh = 2 đơn vị game, đúng cỡ điểm ảnh Kenney ×2),
  // làm sắc mép (bỏ điểm mờ) rồi thêm viền tối 1 điểm ảnh như hình Kenney.
  sprites: new Map(),
  OUTLINE: [63, 40, 50],
  sprite(key, W, H, ax, ay, fn, post) {
    let c = this.sprites.get(key);
    if (c) return c;
    const w = W / 2, h = H / 2;
    c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.scale(0.5, 0.5); x.translate(ax, ay);
    fn(x);
    const d = x.getImageData(0, 0, w, h), p = d.data, solid = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      if (p[i * 4 + 3] >= 110) { p[i * 4 + 3] = 255; solid[i] = 1; } else p[i * 4 + 3] = 0;
    }
    const [r, g, b] = this.OUTLINE;
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const i = yy * w + xx;
      if (solid[i]) continue;
      if ((xx > 0 && solid[i - 1]) || (xx < w - 1 && solid[i + 1]) || (yy > 0 && solid[i - w]) || (yy < h - 1 && solid[i + w])) {
        p[i * 4] = r; p[i * 4 + 1] = g; p[i * 4 + 2] = b; p[i * 4 + 3] = 255;
      }
    }
    if (post) post({ set: (xx, yy, col) => { if (xx < 0 || yy < 0 || xx >= w || yy >= h) return; const i = (yy * w + xx) * 4; p[i] = col[0]; p[i + 1] = col[1]; p[i + 2] = col[2]; p[i + 3] = 255; } });
    x.putImageData(d, 0, 0);
    c.ax = ax; c.ay = ay; c.W = W; c.H = H;
    this.sprites.set(key, c);
    if (this.sprites.size > 400) this.sprites.delete(this.sprites.keys().next().value);
    return c;
  },
  // Mặt nhân vật vẽ tay từng điểm ảnh (lưới sprite 18×29; tâm đầu ở cột 9, hàng ~10)
  FACE: { eye: [58, 34, 52], shine: [255, 255, 255], blush: [255, 140, 170], mouth: [190, 70, 100], lash: [58, 34, 52], glass: [123, 75, 106], sun: [60, 30, 60] },
  face(px, dir, look, bob) {
    if (dir === 3) return;
    const C = this.FACE, y0 = 11 - bob + (look.hat === 'sun' ? 1 : 0);
    const mx = dir === 1 ? (x) => 17 - x : (x) => x;
    const P = (x, y, c) => px.set(mx(x), y, c);
    const eye = (x) => { P(x, y0, C.shine); P(x + 1, y0, C.eye); P(x, y0 + 1, C.eye); P(x + 1, y0 + 1, C.eye); };
    if (dir === 0) {
      eye(5); eye(11);
      if (look.long) { P(4, y0, C.lash); P(13, y0, C.lash); }
      P(4, y0 + 2, C.blush); P(13, y0 + 2, C.blush);
      P(8, y0 + 3, C.mouth); P(9, y0 + 3, C.mouth);
      if (look.glasses === 'sun') { for (let x = 4; x <= 13; x++) if (x !== 7 && x !== 10) { P(x, y0, C.sun); P(x, y0 + 1, C.sun); } P(5, y0, C.shine); P(11, y0, C.shine); }
      else if (look.glasses) [4, 7, 10, 13].forEach((x) => { P(x, y0, C.glass); P(x, y0 + 1, C.glass); });
    } else {
      eye(11);
      if (look.long) P(13, y0, C.lash);
      P(12, y0 + 2, C.blush);
      P(14, y0 + 3, C.mouth);
      if (look.glasses === 'sun') { for (let x = 10; x <= 13; x++) { P(x, y0, C.sun); P(x, y0 + 1, C.sun); } P(11, y0, C.shine); }
      else if (look.glasses) { P(10, y0, C.glass); P(10, y0 + 1, C.glass); P(13, y0, C.glass); P(13, y0 + 1, C.glass); }
    }
  },
  blit(ctx, c, x, y, s = 1) {
    const sm = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(c, Math.round(x - c.ax * s), Math.round(y - c.ay * s), c.W * s, c.H * s);
    ctx.imageSmoothingEnabled = sm;
  },
  reset() { this.cache = {}; this.sprites.clear(); G.icons.cache = {}; if (G.world.chunks) G.world.chunks.clear(); },
};
