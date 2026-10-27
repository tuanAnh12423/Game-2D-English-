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
      case T.ROAD:
        this.put(ctx, 'town', 109, px, py); tint('rgba(150,140,190,.22)');
        // mép đường: viền mảnh màu kem như vỉa hè
        ctx.fillStyle = 'rgba(255,248,235,.95)';
        if (!roadLike(nb(0, -1))) ctx.fillRect(px, py, S, 3);
        if (!roadLike(nb(0, 1))) ctx.fillRect(px, py + S - 3, S, 3);
        if (!roadLike(nb(-1, 0))) ctx.fillRect(px, py, 3, S);
        if (!roadLike(nb(1, 0))) ctx.fillRect(px + S - 3, py, 3, S);
        // vạch kẻ giữa đường cho dễ nhận ra

        return true;
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
  reset() { this.cache = {}; if (G.world.chunks) G.world.chunks.clear(); },
};
