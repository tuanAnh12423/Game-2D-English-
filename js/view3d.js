// Bản thử 3D: dựng lại đúng bản đồ của game (G.world) bằng Three.js.
// Mỗi ô = 1 đơn vị. Ô (tx, ty) nằm ở x = tx + 0.5, z = ty + 0.5. Mặt đất cao y = 0.
(function () {
  'use strict';
  const W = G.world, T = G.T;
  G.state = G.state || { settings: { tts: true } };
  try { G.tts.init(); } catch (e) { /* bỏ qua */ }
  W.build();

  // ---------- Khung cảnh ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById('app').appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const SKY_DAY = new THREE.Color('#bfe9ff'), SKY_EVE = new THREE.Color('#ffc3a8'), SKY_NIGHT = new THREE.Color('#3a3f7c');
  scene.background = SKY_DAY.clone();
  scene.fog = new THREE.Fog(scene.background, 30, 75);
  const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.3, 200);

  const hemi = new THREE.HemisphereLight('#ffffff', '#c8e6a8', 1.15);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff3df', 1.7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 60 });
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);

  const rnd = G.mulberry(20261102);
  const toon = (c, o = {}) => new THREE.MeshToonMaterial(Object.assign({ color: c }, o));
  const std = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.9 }, o));
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();

  // Tạo InstancedMesh từ danh sách {x,y,z,sx,sy,sz,ry,c}
  function inst(geo, mat, list, opt = {}) {
    if (!list.length) return null;
    const m = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((p, i) => {
      dummy.position.set(p.x, p.y || 0, p.z);
      dummy.rotation.set(0, p.ry || 0, 0);
      dummy.scale.set(p.sx ?? 1, p.sy ?? p.sx ?? 1, p.sz ?? p.sx ?? 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      if (p.c) m.setColorAt(i, col.set(p.c));
    });
    m.castShadow = !!opt.cast;
    m.receiveShadow = opt.receive !== false;
    m.computeBoundingSphere();
    scene.add(m);
    return m;
  }

  // ---------- Mặt đất ----------
  const BASE = { grass: T.GRASS, city: T.PAVE, sand: T.SAND, forest: T.DARK, industrial: T.CONCRETE };
  const baseOf = (tx, ty) => { const r = W.regionOfTile(tx, ty); return r ? (BASE[r.ground] ?? T.GRASS) : T.GRASS; };
  const isRoad = (t) => t === T.ROAD;
  const h2 = G.hash2;

  function groundColor(t, tx, ty) {
    const v = h2(tx, ty);
    switch (t) {
      case T.GRASS: case T.FLOWER: case T.TREE: case T.BUSH: case T.ROCK: case T.LAMP:
        return (tx + ty) % 2 ? (v < 0.5 ? '#a6e38e' : '#a0de88') : (v < 0.5 ? '#9bd985' : '#96d580');
      case T.DARK: case T.PINE: return (tx + ty) % 2 ? '#86c97f' : '#7fc279';
      case T.SAND: return v < 0.5 ? '#ffe7b8' : '#fde2ae';
      case T.PAVE: return (tx + ty) % 2 ? '#fde6ee' : '#f6d9e4';
      case T.CONCRETE: return (tx + ty) % 2 ? '#e3dcef' : '#dad2e8';
      case T.PATH: return v < 0.5 ? '#ffe9cf' : '#fbe2c4';
      case T.FARM: return '#c69273';
      case T.ROAD: return '#b4b9cf';
      default: return '#9bd985';
    }
  }

  const ground = [], roadLines = [], zebra = [], curbs = [];
  const trees = [], blossoms = [], trunks = [], pines = [], bushes = [], rocks = [], flowers = [], stems = [];
  const posts = [], rails = [], lamps = [], bulbs = [], crops = [], planks = [], bridgeRails = [], seabed = [];
  const lampSpots = [];

  for (let ty = 0; ty < W.h; ty++) for (let tx = 0; tx < W.w; tx++) {
    const t = W.get(tx, ty), x = tx + 0.5, z = ty + 0.5, v = h2(tx * 7 + 3, ty * 11 + 5);
    if (t === T.WATER || t === T.BRIDGE) {
      seabed.push({ x, y: -0.55, z, sx: 1, sy: 0.3, sz: 1, c: '#79b9d8' });
      if (t === T.BRIDGE) {
        planks.push({ x, y: 0.02, z, sx: 1.0, sy: 0.12, sz: 1.0, c: v < 0.5 ? '#eaa56c' : '#e19a62' });
        const hz = W.get(tx - 1, ty) === T.BRIDGE || W.get(tx + 1, ty) === T.BRIDGE || isRoad(W.get(tx - 1, ty)) || isRoad(W.get(tx + 1, ty));
        // lan can hai bên cầu
        const side = (a, b) => { const n = W.get(tx + a, ty + b); return n === T.WATER; };
        if (hz) { if (side(0, -1)) bridgeRails.push({ x, y: 0.28, z: z - 0.45, sx: 1, sy: 0.08, sz: 0.08 }); if (side(0, 1)) bridgeRails.push({ x, y: 0.28, z: z + 0.45, sx: 1, sy: 0.08, sz: 0.08 }); }
        else { if (side(-1, 0)) bridgeRails.push({ x: x - 0.45, y: 0.28, z, sx: 0.08, sy: 0.08, sz: 1 }); if (side(1, 0)) bridgeRails.push({ x: x + 0.45, y: 0.28, z, sx: 0.08, sy: 0.08, sz: 1 }); }
      }
      continue;
    }
    const under = (t === T.TREE || t === T.BUSH || t === T.ROCK || t === T.FLOWER || t === T.LAMP || t === T.FENCE || t === T.PINE || t === T.BUILD || t === T.DOOR) ? baseOf(tx, ty) : t;
    const top = t === T.ROAD ? -0.04 : t === T.FARM ? -0.02 : 0;
    ground.push({ x, y: top - 0.25, z, sx: 1, sy: 0.5, sz: 1, c: groundColor(under === T.GRASS && (t === T.TREE || t === T.FLOWER) ? T.GRASS : under, tx, ty) });

    if (t === T.ROAD) {
      const L = isRoad(W.get(tx - 1, ty)) || W.get(tx - 1, ty) === T.BRIDGE, R = isRoad(W.get(tx + 1, ty)) || W.get(tx + 1, ty) === T.BRIDGE;
      const U = isRoad(W.get(tx, ty - 1)) || W.get(tx, ty - 1) === T.BRIDGE, D = isRoad(W.get(tx, ty + 1)) || W.get(tx, ty + 1) === T.BRIDGE;
      // vạch giữa đường (đường rộng 2 ô → vạch nằm giữa 2 ô) và vạch đi bộ cạnh ngã tư
      const rd = (a, b) => { const n = W.get(tx + a, ty + b); return isRoad(n) || n === T.BRIDGE; };
      const horiz = (a, b) => rd(a - 1, b) && rd(a + 1, b), vert = (a, b) => rd(a, b - 1) && rd(a, b + 1);
      const inter = (a, b) => rd(a, b) && horiz(a, b) && vert(a, b);
      if (!inter(0, 0)) {
        if (horiz(0, 0) && U && !D && tx % 2 === 0) roadLines.push({ x, y: -0.035, z: z - 0.5, sx: 0.5, sy: 0.01, sz: 0.08 });
        if (vert(0, 0) && L && !R && ty % 2 === 0) roadLines.push({ x: x - 0.5, y: -0.035, z, sx: 0.08, sy: 0.01, sz: 0.5 });
        if (horiz(0, 0) && (inter(-1, 0) || inter(1, 0))) for (let k = -0.36; k <= 0.37; k += 0.24) zebra.push({ x, y: -0.035, z: z + k, sx: 0.8, sy: 0.01, sz: 0.12 });
        if (vert(0, 0) && (inter(0, -1) || inter(0, 1))) for (let k = -0.36; k <= 0.37; k += 0.24) zebra.push({ x: x + k, y: -0.035, z, sx: 0.12, sy: 0.01, sz: 0.8 });
      }
      // vỉa hè (bó vỉa) ở mép không giáp đường
      const curb = (a, b, px, pz, sx, sz) => { const n = W.get(tx + a, ty + b); if (!isRoad(n) && n !== T.BRIDGE && n !== T.PATH && n !== T.DOOR && n !== T.WATER) curbs.push({ x: x + px, y: 0.0, z: z + pz, sx, sy: 0.1, sz }); };
      curb(0, -1, 0, -0.46, 1, 0.08); curb(0, 1, 0, 0.46, 1, 0.08); curb(-1, 0, -0.46, 0, 0.08, 1); curb(1, 0, 0.46, 0, 0.08, 1);
    } else if (t === T.TREE) {
      const s = 0.8 + v * 0.45, pink = h2(tx, ty * 3) < 0.18;
      trunks.push({ x, y: 0.3 * s, z, sx: s, c: '#b07a5a' });
      (pink ? blossoms : trees).push({ x, y: 0.95 * s, z, sx: s * 1.05, sy: s * 0.95, sz: s * 1.05, ry: v * 6, c: pink ? (v < 0.5 ? '#ffb7d0' : '#ffc6da') : (v < 0.33 ? '#7ccf7c' : v < 0.66 ? '#86d685' : '#71c477') });
      (pink ? blossoms : trees).push({ x: x + 0.18, y: 1.3 * s, z: z - 0.08, sx: s * 0.62, ry: v * 3, c: pink ? '#ffd2e2' : '#98e08f' });
    } else if (t === T.PINE) {
      const s = 0.85 + v * 0.4;
      trunks.push({ x, y: 0.25 * s, z, sx: s * 0.9, c: '#9a6a4e' });
      pines.push({ x, y: 0.85 * s, z, sx: s, c: '#5fb57a' });
      pines.push({ x, y: 1.35 * s, z, sx: s * 0.72, c: '#6cc285' });
    } else if (t === T.BUSH) {
      bushes.push({ x, y: 0.22, z, sx: 0.9 + v * 0.3, sy: 0.7, sz: 0.85, ry: v * 6, c: v < 0.5 ? '#8bd683' : '#7fcd7a' });
      if (v < 0.4) flowers.push({ x: x + 0.15, y: 0.5, z: z + 0.2, sx: 0.7, c: '#ff9ec2' });
    } else if (t === T.ROCK) {
      rocks.push({ x, y: 0.15, z, sx: 0.5 + v * 0.25, sy: 0.4, sz: 0.45, ry: v * 6, c: v < 0.5 ? '#c9bfdc' : '#bdb2d3' });
    } else if (t === T.FLOWER) {
      const pal = ['#ff8fb8', '#ffd76b', '#ffffff', '#c9a7ff', '#ff9f8a'];
      for (let k = 0; k < 4; k++) {
        const a = h2(tx * 13 + k, ty * 17), b = h2(tx * 5 + k * 3, ty * 29);
        const fx = x + (a - 0.5) * 0.7, fz = z + (b - 0.5) * 0.7;
        stems.push({ x: fx, y: 0.08, z: fz, sx: 1 });
        flowers.push({ x: fx, y: 0.18, z: fz, sx: 0.9 + a * 0.4, c: pal[Math.floor(b * pal.length)] });
      }
    } else if (t === T.FENCE) {
      posts.push({ x, y: 0.25, z, sx: 1 });
      const f = (a, b) => W.get(tx + a, ty + b) === T.FENCE;
      if (f(1, 0)) rails.push({ x: x + 0.5, y: 0.32, z, sx: 1, sy: 1, sz: 1 });
      if (f(0, 1)) rails.push({ x, y: 0.32, z: z + 0.5, sx: 1, sy: 1, sz: 1, ry: Math.PI / 2 });
    } else if (t === T.LAMP) {
      lamps.push({ x, y: 0.6, z, sx: 1 });
      bulbs.push({ x, y: 1.22, z, sx: 1 });
      lampSpots.push(new THREE.Vector3(x, 1.2, z));
    } else if (t === T.FARM) {
      if (ty % 2 === 0) crops.push({ x, y: 0.12, z, sx: 0.8 + v * 0.3, c: v < 0.3 ? '#ffb347' : v < 0.6 ? '#7fd67a' : '#a8e06b' });
    }
  }

  const box = new THREE.BoxGeometry(1, 1, 1);
  inst(box, std('#ffffff'), ground);
  inst(box, std('#ffffff'), seabed);
  inst(box, std('#fff7c2', { emissive: '#3a3520' }), roadLines);
  inst(box, std('#ffffff'), zebra);
  inst(box, std('#f4f2fa'), curbs);
  inst(box, toon('#ffffff'), planks, { cast: true });
  inst(box, toon('#bd6c4a'), bridgeRails, { cast: true });

  const foliage = new THREE.IcosahedronGeometry(0.5, 1);
  inst(new THREE.CylinderGeometry(0.08, 0.11, 0.6, 7), toon('#ffffff'), trunks, { cast: true });
  inst(foliage, toon('#ffffff', { flatShading: true }), trees, { cast: true });
  inst(foliage, toon('#ffffff', { flatShading: true }), blossoms, { cast: true });
  inst(new THREE.ConeGeometry(0.48, 0.8, 7), toon('#ffffff', { flatShading: true }), pines, { cast: true });
  inst(new THREE.SphereGeometry(0.4, 10, 8), toon('#ffffff'), bushes, { cast: true });
  inst(new THREE.DodecahedronGeometry(0.5, 0), toon('#ffffff', { flatShading: true }), rocks, { cast: true });
  inst(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 4), toon('#5fae5a'), stems);
  inst(new THREE.IcosahedronGeometry(0.06, 0), toon('#ffffff'), flowers);
  inst(new THREE.BoxGeometry(0.1, 0.5, 0.1), toon('#ffffff'), posts, { cast: true });
  inst(new THREE.BoxGeometry(1, 0.07, 0.05), toon('#ffffff'), rails, { cast: true });
  inst(new THREE.CylinderGeometry(0.04, 0.06, 1.2, 8), toon('#ffb3d1'), lamps, { cast: true });
  const bulbMat = new THREE.MeshStandardMaterial({ color: '#fff6c8', emissive: '#ffe08a', emissiveIntensity: 0.2 });
  inst(new THREE.SphereGeometry(0.13, 12, 10), bulbMat, bulbs);
  inst(new THREE.IcosahedronGeometry(0.16, 0), toon('#ffffff', { flatShading: true }), crops, { cast: true });

  // mặt nước chung cho cả bản đồ (đất nằm cao hơn nên che đi chỗ không phải nước)
  const waterMat = new THREE.MeshStandardMaterial({ color: '#7ccfee', roughness: 0.15, metalness: 0.05, transparent: true, opacity: 0.88 });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(W.w + 120, W.h + 120, 1, 1), waterMat);
  water.rotation.x = -Math.PI / 2; water.position.set(W.w / 2, -0.12, W.h / 2); water.receiveShadow = true;
  scene.add(water);

  // ---------- Chữ nổi (bảng tên) ----------
  function label(text, opt = {}) {
    const c = document.createElement('canvas'), ctx = c.getContext('2d');
    const fs = 44, pad = 22;
    ctx.font = `700 ${fs}px -apple-system, Segoe UI, Roboto, sans-serif`;
    const w = Math.ceil(ctx.measureText(text).width) + pad * 2, h = fs + 26;
    c.width = w; c.height = h;
    ctx.font = `700 ${fs}px -apple-system, Segoe UI, Roboto, sans-serif`;
    ctx.fillStyle = opt.bg || '#ffffff'; ctx.strokeStyle = opt.border || '#f3a6c4'; ctx.lineWidth = 6;
    const r = h / 2;
    ctx.beginPath(); ctx.moveTo(r, 3); ctx.arcTo(w - 3, 3, w - 3, h - 3, r - 3); ctx.arcTo(w - 3, h - 3, 3, h - 3, r - 3); ctx.arcTo(3, h - 3, 3, 3, r - 3); ctx.arcTo(3, 3, w - 3, 3, r - 3); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = opt.fg || '#7a3b5c'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    ctx.fillText(text, w / 2, h / 2 + 2);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false }));
    const k = (opt.size || 0.42) / h;
    sp.scale.set(w * k, h * k, 1);
    return sp;
  }

  // ---------- Toà nhà ----------
  const winMat = new THREE.MeshStandardMaterial({ color: '#bfe6ff', roughness: 0.2, emissive: '#ffd77a', emissiveIntensity: 0 });
  const doorMat = toon('#b9785a'), frameMat = toon('#ffffff'), acMat = toon('#f4f6fb'), acFan = toon('#8f9bb5');
  const BIG = new Set(['service', 'shop', 'library', 'factory', 'hotel', 'airport', 'mall', 'hvac']);
  const AWNING = new Set(['cafe', 'koi', 'phela', 'farmshop', 'petshop', 'shop', 'mall']);
  const doors = [];

  function gableRoof(w, d, h) {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
    g.translate(0, 0, -d / 2);
    return g;
  }

  W.buildings.forEach((b) => {
    const ty = BUILDING_TYPES[b.t] || BUILDING_TYPES.house;
    const g = new THREE.Group();
    const cx = b.x + b.w / 2, cz = b.y + b.h / 2;
    g.position.set(cx, 0, cz);
    const wallMat = toon(ty.wall), roofMat = toon(ty.roof);
    if (b.t === 'station') {
      // trạm xe buýt: mái che + ghế
      const roof = new THREE.Mesh(new THREE.BoxGeometry(b.w - 0.2, 0.12, b.h - 0.3), roofMat);
      roof.position.y = 1.3; roof.castShadow = true; g.add(roof);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, c]) => {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 6), frameMat);
        p.position.set(a * (b.w / 2 - 0.3), 0.65, c * (b.h / 2 - 0.3)); p.castShadow = true; g.add(p);
      });
      const bench = new THREE.Mesh(new THREE.BoxGeometry(b.w - 1, 0.12, 0.4), toon('#7ec8f0'));
      bench.position.set(0, 0.4, -0.2); bench.castShadow = true; g.add(bench);
    } else {
      const big = BIG.has(b.t) || b.w >= 7;
      const H = big ? 1.9 + Math.min(1.2, (b.w - 6) * 0.2) : 1.35;
      const ww = b.w - 0.3, dd = b.h - 0.5;
      const walls = new THREE.Mesh(new THREE.BoxGeometry(ww, H, dd), wallMat);
      walls.position.set(0, H / 2, -0.1); walls.castShadow = walls.receiveShadow = true; g.add(walls);
      // chân tường
      const base = new THREE.Mesh(new THREE.BoxGeometry(ww + 0.06, 0.18, dd + 0.06), toon('#e9d6cc'));
      base.position.set(0, 0.09, -0.1); g.add(base);
      const front = -0.1 + dd / 2;
      if (big) {
        const slab = new THREE.Mesh(new THREE.BoxGeometry(ww + 0.2, 0.22, dd + 0.2), roofMat);
        slab.position.set(0, H + 0.11, -0.1); slab.castShadow = true; g.add(slab);
        // cục nóng điều hoà trên mái — đúng chủ đề kỹ thuật điện lạnh
        for (let k = 0; k < Math.min(3, Math.floor(b.w / 4)); k++) {
          const ac = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.35), acMat);
          ac.position.set(-ww / 2 + 0.8 + k * 1.1, H + 0.45, -0.1 - dd / 4); ac.castShadow = true; g.add(ac);
          const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 14), acFan);
          fan.rotation.x = Math.PI / 2; fan.position.set(ac.position.x - 0.1, ac.position.y, ac.position.z + 0.18); g.add(fan);
        }
      } else {
        const roof = new THREE.Mesh(gableRoof(ww + 0.35, dd + 0.35, 0.95), roofMat);
        roof.position.set(0, H, -0.1); roof.castShadow = true; g.add(roof);
        // ống khói nhỏ
        if (b.t === 'home' || b.t === 'house') {
          const ch = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.25), toon('#e8968c'));
          ch.position.set(ww / 4, H + 0.6, -0.1 - dd / 5); ch.castShadow = true; g.add(ch);
        }
      }
      // cửa ra vào (mặt trước, đúng ô cửa của bản đồ)
      const dxl = b.dx + 0.5 - cx;
      const fr = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.0, 0.06), frameMat); fr.position.set(dxl, 0.5, front + 0.02); g.add(fr);
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.9, 0.08), doorMat); door.position.set(dxl, 0.45, front + 0.03); g.add(door);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), toon('#ffd76b')); knob.position.set(dxl + 0.18, 0.45, front + 0.08); g.add(knob);
      // cửa sổ
      const rows = big ? Math.max(1, Math.floor((H - 0.4) / 0.75)) : 1;
      for (let r = 0; r < rows; r++) for (let wx = -ww / 2 + 0.6; wx < ww / 2 - 0.4; wx += 1.0) {
        if (r === 0 && Math.abs(wx - dxl) < 0.75) continue;
        const y = big ? 0.85 + r * 0.75 : 0.78;
        const wf = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.46, 0.04), frameMat); wf.position.set(wx, y, front + 0.01); g.add(wf);
        const wi = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.36, 0.05), winMat); wi.position.set(wx, y, front + 0.02); g.add(wi);
      }
      if (AWNING.has(b.t)) {
        const aw = new THREE.Mesh(new THREE.BoxGeometry(Math.min(ww - 0.4, 3), 0.06, 0.55), toon(ty.roof));
        aw.position.set(dxl, 1.12, front + 0.25); aw.rotation.x = 0.3; aw.castShadow = true; g.add(aw);
        for (let k = -1; k <= 1; k += 2) {
          const st = new THREE.Mesh(new THREE.BoxGeometry(Math.min(ww - 0.4, 3) / 4, 0.065, 0.56), toon('#ffffff'));
          st.position.set(dxl + k * Math.min(ww - 0.4, 3) / 4, 1.12, front + 0.25); st.rotation.x = 0.3; g.add(st);
        }
      }
      const sign = label((ty.icon ? ty.icon + ' ' : '') + b.name, { size: 0.42 });
      sign.position.set(dxl, (big ? H + 0.75 : H + 1.25), front);
      g.add(sign);
    }
    scene.add(g);
    doors.push({ b, x: b.dx + 0.5, z: b.dy + 1.0 });
  });

  // ---------- Nhân vật chibi ----------
  function chibi(o) {
    const g = new THREE.Group();
    const skin = toon(o.skin || '#ffe1cf'), hairM = toon(o.hair || '#6b3f2e'), shirt = toon(o.shirt || '#ff9ec4'), pants = toon(o.pants || '#7fa8e8');
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.38, 12), shirt); body.position.y = 0.42; body.castShadow = true; g.add(body);
    const legs = [-1, 1].map((s) => { const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.14, 4, 8), pants); l.position.set(s * 0.08, 0.15, 0); l.castShadow = true; g.add(l); return l; });
    const arms = [-1, 1].map((s) => { const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.16, 4, 8), skin); a.position.set(s * 0.22, 0.44, 0); a.rotation.z = s * 0.25; a.castShadow = true; g.add(a); return a; });
    const head = new THREE.Group(); head.position.y = 0.86; g.add(head);
    const hd = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), skin); hd.scale.set(1.05, 0.95, 1); hd.castShadow = true; head.add(hd);
    // tóc: chỏm đầu + mái
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), hairM);
    hair.rotation.x = -0.35; hair.position.set(0, 0.02, -0.02); hair.scale.set(1.04, 1, 1.04); hair.castShadow = true; head.add(hair);
    const back = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), hairM); back.position.set(0, -0.02, -0.08); back.scale.set(1.05, 0.95, 0.9); head.add(back);
    if (o.girl) { // 2 búi tóc + nơ
      [-1, 1].forEach((s) => { const bun = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), hairM); bun.position.set(s * 0.27, 0.12, -0.05); head.add(bun); });
      const bow = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.03, 6, 12), toon('#ff6f9f')); bow.position.set(0.18, 0.27, 0.05); bow.rotation.y = 0.5; head.add(bow);
    }
    // mắt to, có điểm sáng, má hồng
    const eyeM = new THREE.MeshBasicMaterial({ color: '#3b2533' }), hiM = new THREE.MeshBasicMaterial({ color: '#ffffff' }), blushM = new THREE.MeshBasicMaterial({ color: '#ff9fb8', transparent: true, opacity: 0.75 });
    [-1, 1].forEach((s) => {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), eyeM); e.scale.set(0.85, 1.15, 0.5); e.position.set(s * 0.11, -0.03, 0.27); head.add(e);
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), hiM); h.position.set(s * 0.11 + 0.018, 0.0, 0.3); head.add(h);
      const bl = new THREE.Mesh(new THREE.CircleGeometry(0.05, 14), blushM); bl.position.set(s * 0.19, -0.1, 0.245); bl.rotation.y = s * 0.55; bl.scale.y = 0.6; head.add(bl);
    });
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.01, 6, 12, Math.PI), eyeM); mouth.position.set(0, -0.11, 0.285); mouth.rotation.z = Math.PI; head.add(mouth);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.28, 20), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.16, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.01; g.add(shadow);
    let ph = 0;
    return {
      g, head,
      anim(dt, moving) {
        ph += dt * (moving ? 11 : 2);
        const s = moving ? Math.sin(ph) : 0;
        legs[0].rotation.x = s * 0.7; legs[1].rotation.x = -s * 0.7;
        arms[0].rotation.x = -s * 0.8; arms[1].rotation.x = s * 0.8;
        g.children[0].position.y = 0.42 + (moving ? Math.abs(Math.sin(ph)) * 0.04 : Math.sin(ph) * 0.008);
        head.position.y = 0.86 + (moving ? Math.abs(Math.sin(ph)) * 0.05 : Math.sin(ph) * 0.012);
        head.rotation.z = moving ? 0 : Math.sin(ph * 0.5) * 0.05;
      },
    };
  }

  function cat() {
    const g = new THREE.Group(), fur = toon('#ffcf9e'), dark = toon('#f2a96b');
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), fur); body.scale.set(0.9, 0.8, 1.2); body.position.y = 0.16; body.castShadow = true; g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 12), fur); head.position.set(0, 0.32, 0.15); head.castShadow = true; g.add(head);
    [-1, 1].forEach((s) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 4), dark); ear.position.set(s * 0.08, 0.46, 0.14); ear.rotation.z = -s * 0.25; g.add(ear);
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), new THREE.MeshBasicMaterial({ color: '#3b2533' })); e.position.set(s * 0.055, 0.33, 0.285); g.add(e);
    });
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff7fa6' })); nose.position.set(0, 0.3, 0.3); g.add(nose);
    const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.2, 4, 6), dark); tail.position.set(0, 0.27, -0.2); tail.rotation.x = -0.6; g.add(tail);
    let ph = 0;
    return { g, anim(dt, mv) { ph += dt * (mv ? 14 : 3); tail.rotation.z = Math.sin(ph * 0.6) * 0.5; g.position.y = mv ? Math.abs(Math.sin(ph)) * 0.05 : 0; } };
  }

  // ---------- Người chơi + thú cưng + NPC ----------
  const home = W.buildings.find((b) => b.t === 'home') || W.buildings[0];
  const P = { x: home.dx + 0.5, z: home.dy + 1.6, dir: 0, speed: 3.3 };
  const me = chibi({ girl: true, hair: '#5a3426', shirt: '#ff9ec4', pants: '#8fb5f0' });
  scene.add(me.g);
  const pet = cat(); pet.g.position.set(P.x - 0.8, 0, P.z); scene.add(pet.g);

  const free = (x, z, r = 0.22) => W.walkable(Math.floor(x - r), Math.floor(z - r)) && W.walkable(Math.floor(x + r), Math.floor(z - r)) && W.walkable(Math.floor(x - r), Math.floor(z + r)) && W.walkable(Math.floor(x + r), Math.floor(z + r));

  const NPC_STYLE = [
    { shirt: '#9fd8ff', hair: '#2f2230', pants: '#5a6d9a' }, { shirt: '#ffd36b', hair: '#8a4b2f', pants: '#7aa46a', girl: true },
    { shirt: '#b9a0f2', hair: '#3b2a24', pants: '#6a5a8a' }, { shirt: '#8fd6a7', hair: '#c98a5a', pants: '#a08070', girl: true },
  ];
  const npcs = [];
  W.regions.forEach((r, i) => {
    for (let k = 0; k < 3; k++) {
      const t = W.randomFreeTile(r, rnd);
      if (!t) continue;
      const c = chibi(NPC_STYLE[(i + k) % NPC_STYLE.length]);
      c.g.scale.setScalar(0.95);
      const n = { c, x: t.x + 0.5, z: t.y + 0.5, tx: t.x + 0.5, tz: t.y + 0.5, wait: rnd() * 3, r };
      c.g.position.set(n.x, 0, n.z); scene.add(c.g); npcs.push(n);
    }
  });

  // ---------- Quả cầu từ vựng ----------
  const orbs = [];
  const ORB_COL = ['#ff9ec4', '#9fd8ff', '#ffd36b', '#b9a0f2', '#8fd6a7'];
  const orbGeo = new THREE.IcosahedronGeometry(0.2, 2);
  function spawnOrb(r) {
    const cats = (r.words || []).filter((k) => WORD_CATS[k]);
    if (!cats.length) return;
    const ck = G.pick(cats, rnd), w = G.pick(WORD_CATS[ck].words, rnd);
    const t = W.randomFreeTile(r, rnd); if (!t) return;
    const cc = ORB_COL[orbs.length % ORB_COL.length];
    const g = new THREE.Group();
    const m = new THREE.Mesh(orbGeo, new THREE.MeshStandardMaterial({ color: cc, emissive: cc, emissiveIntensity: 0.55, roughness: 0.3, transparent: true, opacity: 0.92 }));
    m.castShadow = true; g.add(m);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.025, 6, 24), new THREE.MeshBasicMaterial({ color: '#ffffff' })); ring.rotation.x = Math.PI / 2; g.add(ring);
    const lb = label('✨ ' + w[0], { size: 0.32 }); lb.position.y = 0.55; g.add(lb);
    g.position.set(t.x + 0.5, 0.6, t.y + 0.5);
    scene.add(g);
    orbs.push({ g, m, ring, w, ck, r, ph: rnd() * 6 });
  }
  W.regions.forEach((r) => { for (let k = 0; k < 6; k++) spawnOrb(r); });

  // ---------- Giao diện ----------
  const $ = (id) => document.getElementById(id);
  const card = $('card'), toastEl = $('toast');
  let learned = 0, toastT = 0;
  function toast(msg, s = 2.2) { toastEl.textContent = msg; toastEl.style.display = 'block'; toastT = s; }
  function say(t) { try { G.tts.speak(t); } catch (e) { /* bỏ qua */ } }
  function showWord(o) {
    const [en, ipa, vi, ex] = o.w;
    const cat = WORD_CATS[o.ck];
    card.innerHTML = `<div class="cat">${cat.icon || ''} ${cat.name}</div><div><span class="en">${en}</span><span class="ipa">${ipa || ''}</span></div><div class="vi">${vi}</div>${ex ? `<div class="ex">${ex}</div>` : ''}<div class="row"><button class="b" id="cSay">🔊 Nghe</button>${ex ? '<button class="b" id="cEx">🔊 Câu</button>' : ''}<button class="b" id="cOk">Đã thuộc ✓</button></div>`;
    card.style.display = 'block';
    say(en);
    $('cSay').onclick = () => say(en);
    if (ex) $('cEx').onclick = () => say(ex);
    $('cOk').onclick = () => {
      card.style.display = 'none'; learned++;
      toast(`+1 từ mới 🌸 (đã học ${learned} từ)`);
      scene.remove(o.g); orbs.splice(orbs.indexOf(o), 1);
      setTimeout(() => spawnOrb(o.r), 15000);
    };
  }

  // ---------- Điều khiển ----------
  const keys = {};
  addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
  addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
  let target = null, down = false;
  const pts = new Map();
  let pinch0 = 0, zoom0 = 1;
  function pick(e) {
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const os = ray.intersectObjects(orbs.map((o) => o.m), false);
    if (os.length) { const o = orbs.find((q) => q.m === os[0].object); if (o && Math.hypot(o.g.position.x - P.x, o.g.position.z - P.z) < 3) { showWord(o); return true; } }
    if (ray.ray.intersectPlane(plane, hit)) target = { x: hit.x, z: hit.z };
    return false;
  }
  const cv = renderer.domElement;
  cv.addEventListener('pointerdown', (e) => {
    pts.set(e.pointerId, e);
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); zoom0 = cam.zoom; down = false; target = null; return; }
    card.style.display = 'none';
    down = !pick(e);
  });
  cv.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, e);
    if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); cam.zoom = G.clamp(zoom0 * pinch0 / Math.max(20, d), 0.55, 1.8); return; }
    if (down) pick(e);
  });
  const up = (e) => { pts.delete(e.pointerId); down = false; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', (e) => { cam.zoom = G.clamp(cam.zoom * (e.deltaY > 0 ? 1.1 : 0.9), 0.55, 1.8); }, { passive: true });

  const cam = { zoom: 1.15, yaw: 0, yawT: 0 };
  $('bIn').onclick = () => { cam.zoom = G.clamp(cam.zoom * 0.8, 0.55, 1.8); };
  $('bOut').onclick = () => { cam.zoom = G.clamp(cam.zoom * 1.25, 0.55, 1.8); };
  $('bRot').onclick = () => { cam.yawT += Math.PI / 4; };
  $('bBack').onclick = () => { location.href = 'index.html'; };

  // ---------- Ngày / đêm ----------
  const hr = new Date().getHours();
  let mode = hr >= 18 || hr < 6 ? 2 : hr >= 16 ? 1 : 0; // 0 ngày, 1 hoàng hôn, 2 đêm
  const lampLights = [];
  for (let i = 0; i < 6; i++) { const l = new THREE.PointLight('#ffd58a', 0, 6, 1.6); scene.add(l); lampLights.push(l); }
  function applyTime() {
    const night = mode === 2, eve = mode === 1;
    const sky = night ? SKY_NIGHT : eve ? SKY_EVE : SKY_DAY;
    scene.background.copy(sky); scene.fog.color.copy(sky);
    hemi.intensity = night ? 0.7 : eve ? 0.9 : 1.15;
    hemi.color.set(night ? '#8f9cff' : eve ? '#ffd2b8' : '#ffffff');
    sun.intensity = night ? 0.45 : eve ? 1.2 : 1.7;
    sun.color.set(night ? '#9fb0ff' : eve ? '#ffb27a' : '#fff3df');
    winMat.emissiveIntensity = night ? 1.0 : eve ? 0.35 : 0;
    bulbMat.emissiveIntensity = night ? 1.6 : eve ? 0.7 : 0.15;
    lampLights.forEach((l) => { l.intensity = night ? 2.2 : eve ? 0.8 : 0; });
    $('bTime').textContent = night ? '🌙' : eve ? '🌇' : '☀️';
  }
  $('bTime').onclick = () => { mode = (mode + 1) % 3; applyTime(); };
  applyTime();
  function placeLampLights() {
    if (mode === 0) return;
    const p = new THREE.Vector3(P.x, 1, P.z);
    const near = lampSpots.map((v) => ({ v, d: v.distanceToSquared(p) })).sort((a, b) => a.d - b.d).slice(0, lampLights.length);
    lampLights.forEach((l, i) => { if (near[i]) l.position.copy(near[i].v); });
  }

  // ---------- Vòng lặp ----------
  let last = performance.now(), regionId = null, lampT = 0, doorT = 0;
  function resize() { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
  addEventListener('resize', resize);

  function step(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    // di chuyển
    let mx = 0, mz = 0;
    if (keys.arrowleft || keys.a) mx -= 1; if (keys.arrowright || keys.d) mx += 1;
    if (keys.arrowup || keys.w) mz -= 1; if (keys.arrowdown || keys.s) mz += 1;
    if (mx || mz) {
      target = null;
      const c = Math.cos(cam.yaw), s = Math.sin(cam.yaw);
      const rx = mx * c + mz * s, rz = -mx * s + mz * c; mx = rx; mz = rz;
    } else if (target) {
      const dx = target.x - P.x, dz = target.z - P.z, d = Math.hypot(dx, dz);
      if (d < 0.08) target = null; else { mx = dx / d; mz = dz / d; }
    }
    const moving = !!(mx || mz);
    if (moving) {
      const l = Math.hypot(mx, mz); mx /= l; mz /= l;
      const sp = P.speed * dt;
      const nx = P.x + mx * sp, nz = P.z + mz * sp;
      let moved = false;
      if (free(nx, P.z)) { P.x = nx; moved = true; }
      if (free(P.x, nz)) { P.z = nz; moved = true; }
      if (!moved && target) target = null;
      P.dir = Math.atan2(mx, mz);
    }
    me.g.position.set(P.x, 0, P.z);
    let dr = P.dir - me.g.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr));
    me.g.rotation.y += dr * Math.min(1, dt * 12);
    me.anim(dt, moving);

    // thú cưng chạy theo
    const bx = P.x - Math.sin(P.dir) * 0.7, bz = P.z - Math.cos(P.dir) * 0.7;
    const pdx = bx - pet.g.position.x, pdz = bz - pet.g.position.z, pd = Math.hypot(pdx, pdz);
    const pm = pd > 0.15;
    if (pm) { const k = Math.min(1, dt * 5); pet.g.position.x += pdx * k; pet.g.position.z += pdz * k; pet.g.rotation.y = Math.atan2(pdx, pdz); }
    pet.anim(dt, pm);

    // NPC đi dạo
    npcs.forEach((n) => {
      if (n.wait > 0) { n.wait -= dt; n.c.anim(dt, false); return; }
      const dx = n.tx - n.x, dz = n.tz - n.z, d = Math.hypot(dx, dz);
      if (d < 0.1) {
        n.wait = 1.5 + rnd() * 4;
        const a = rnd() * Math.PI * 2, L = 1 + rnd() * 3;
        n.tx = n.x + Math.cos(a) * L; n.tz = n.z + Math.sin(a) * L;
        return;
      }
      const sp = 1.2 * dt, nx = n.x + dx / d * sp, nz = n.z + dz / d * sp;
      if (free(nx, nz) && W.regionOfTile(Math.floor(nx), Math.floor(nz)) === n.r) { n.x = nx; n.z = nz; } else { n.tx = n.x; n.tz = n.z; }
      n.c.g.position.set(n.x, 0, n.z); n.c.g.rotation.y = Math.atan2(dx, dz); n.c.anim(dt, true);
    });

    // quả cầu từ vựng lơ lửng; đi tới gần là mở thẻ từ
    orbs.forEach((o) => {
      o.ph += dt * 2; o.g.position.y = 0.6 + Math.sin(o.ph) * 0.1; o.m.rotation.y += dt; o.ring.rotation.z += dt * 0.8;
    });
    if (card.style.display !== 'block') {
      const o = orbs.find((q) => Math.hypot(q.g.position.x - P.x, q.g.position.z - P.z) < 0.55);
      if (o) { target = null; showWord(o); }
    }

    // gần cửa nhà
    doorT -= dt;
    if (doorT <= 0) {
      const d = doors.find((q) => Math.hypot(q.x - P.x, q.z - P.z) < 0.6);
      if (d) { toast(`🚪 ${d.b.name}\n(bản thử 3D chưa vào nhà được — vào nhà ở bản 2D)`, 2.5); doorT = 3; }
    }

    // vùng hiện tại
    const reg = W.regionOfTile(Math.floor(P.x), Math.floor(P.z));
    if (reg && reg.id !== regionId) { regionId = reg.id; $('region').innerHTML = `${reg.name}<small>${reg.en} · đã học ${learned} từ</small>`; }
    else if (reg && now % 1000 < 20) $('region').innerHTML = `${reg.name}<small>${reg.en} · đã học ${learned} từ</small>`;

    // camera nghiêng đi theo người chơi
    cam.yaw += (cam.yawT - cam.yaw) * Math.min(1, dt * 6);
    const k = camera.aspect < 1 ? Math.pow(1 / camera.aspect, 0.55) : 1;
    const dist = 9 * cam.zoom * k, hgt = 10 * cam.zoom * k;
    const cx = P.x + Math.sin(cam.yaw) * dist, cz = P.z + Math.cos(cam.yaw) * dist;
    camera.position.lerp(new THREE.Vector3(cx, hgt, cz), Math.min(1, dt * 6));
    camera.lookAt(P.x, 0.5, P.z);
    sun.position.set(P.x - 8, 18, P.z + 6); sun.target.position.set(P.x, 0, P.z);
    waterMat.color.setHSL(0.54, 0.75, (mode === 2 ? 0.42 : 0.7) + Math.sin(now / 900) * 0.015);

    lampT -= dt; if (lampT <= 0) { lampT = 0.5; placeLampLights(); }
    if (toastT > 0) { toastT -= dt; if (toastT <= 0) toastEl.style.display = 'none'; }

    renderer.render(scene, camera);
    requestAnimationFrame(step);
  }
  camera.position.set(P.x, 9.5, P.z + 10.5);
  document.getElementById('load').style.display = 'none';
  requestAnimationFrame(step);
  window.V3 = { P, cam, scene, renderer, orbs, setMode(m) { mode = m; applyTime(); } };
})();
