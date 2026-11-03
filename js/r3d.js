// ============================================================
// ĐỒ HOẠ 3D cho game (Three.js). Toàn bộ logic game vẫn chạy theo toạ độ pixel cũ
// (G.TS = 32 px mỗi ô); ở đây chỉ đọc trạng thái và vẽ lại bằng 3D.
// 1 ô = 1 đơn vị 3D: điểm (px, py) của game → (px/32, y, py/32).
// Canvas 2D #game cũ được giữ làm lớp phủ trong suốt (chữ bay, bảng tên, mũi tên chỉ đường, mưa).
// Tối ưu cho điện thoại: bóng đổ tĩnh (chỉ vẽ lại khi đi xa), mặt đất gộp thành 1 khối/vùng,
// không dùng đèn điểm, tự giảm độ phân giải khi máy chậm.
// ============================================================
(function () {
  'use strict';
  const S = G.TS;
  const R3 = G.r3d = { ok: false };
  if (!window.THREE) return;

  let renderer, scene, camera, hemi, sun, waterMat, winMat, bulbMat, poolMat, soilMesh, lockGroup;
  let T, W;
  const dummy = new THREE.Object3D(), col = new THREE.Color(), V = new THREE.Vector3(), V2 = new THREE.Vector3();
  const SKY = { day: new THREE.Color('#bfe9ff'), eve: new THREE.Color('#ffc9b0'), night: new THREE.Color('#3a3f7c'), rain: new THREE.Color('#aab8cc') };
  // REAL = chế độ “Như thật”: vật liệu vật lý (PBR), ảnh chất liệu, ánh sáng môi trường, tone mapping
  let REAL = false;
  const pbr = (c, o) => { o = Object.assign({}, o || {}); delete o.flatShading; return new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.82, metalness: 0 }, o)); };
  const toon = (c, o) => REAL ? pbr(c, o) : new THREE.MeshToonMaterial(Object.assign({ color: c }, o || {}));
  const lam = (c, o) => REAL ? pbr(c, o) : new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
  // ảnh chất liệu (assets/real/*), lặp liền mạch
  const TL = new THREE.TextureLoader(), texC = {};
  function tex(name, rep, srgb) {
    const k = name + '|' + rep;
    if (texC[k]) return texC[k];
    const base = texC[name] || (texC[name] = TL.load('assets/real/' + name, () => { R3.texLoaded = (R3.texLoaded || 0) + 1; if (renderer) renderer.shadowMap.needsUpdate = true; }));
    const t = base.clone(); // dùng chung ảnh, chỉ khác độ lặp
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rep, rep);
    t.anisotropy = renderer ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 4;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    texC[k] = t;
    return t;
  }
  // ảnh chụp thật Poly Haven (CC0) có thêm bản đồ độ nhám *_r.jpg
  const ROUGH = new Set(['dirt', 'sand', 'asphalt', 'paving', 'concrete', 'soil', 'plaster', 'brick', 'rooftile', 'wood', 'bark']);
  const surf = (name, o) => {
    const rep = (o && o.rep) || 1;
    const m = pbr('#ffffff', Object.assign({ map: tex(name + '_c.jpg', rep, true), normalMap: tex(name + '_n.jpg', rep), roughness: 1 }, o && o.m));
    if (ROUGH.has(name) && !(o && o.m && 'roughness' in o.m)) m.roughnessMap = tex(name + '_r.jpg', rep);
    return m;
  };
  const realRoof = (hex) => { const c = new THREE.Color(hex), h = {}; c.getHSL(h); return new THREE.Color().setHSL(h.h, h.s * 0.45, Math.min(0.42, h.l * 0.55)); };
  const basic = (c, o) => new THREE.MeshBasicMaterial(Object.assign({ color: c }, o || {}));

  // ---------- tiện ích ----------
  function inst(geo, mat, list, opt) {
    opt = opt || {};
    if (!list.length) return null;
    const m = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((p, i) => {
      dummy.position.set(p.x, p.y || 0, p.z);
      dummy.rotation.set(p.rx || 0, p.ry || 0, 0);
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

  const texCache = new Map();
  function canvasTex(key, w, h, draw) {
    if (texCache.has(key)) return texCache.get(key);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 2;
    t.userData = { w, h };
    texCache.set(key, t);
    return t;
  }
  function pill(text, opt) {
    opt = opt || {};
    const fs = 44;
    const font = `800 ${fs}px "Nunito", -apple-system, "Segoe UI", Roboto, sans-serif`;
    const key = 'pill|' + text + '|' + (opt.bg || '') + (opt.fg || '');
    const meas = document.createElement('canvas').getContext('2d'); meas.font = font;
    const w = Math.ceil(meas.measureText(text).width) + 44, h = fs + 26;
    return canvasTex(key, w, h, (ctx) => {
      ctx.font = font;
      ctx.fillStyle = opt.bg || '#fffafc'; ctx.strokeStyle = opt.border || '#ffb3d1'; ctx.lineWidth = 6;
      const r = h / 2 - 3;
      ctx.beginPath(); ctx.moveTo(3 + r, 3); ctx.arcTo(w - 3, 3, w - 3, h - 3, r); ctx.arcTo(w - 3, h - 3, 3, h - 3, r); ctx.arcTo(3, h - 3, 3, 3, r); ctx.arcTo(3, 3, w - 3, 3, r); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = opt.fg || '#6b3d5a'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
      ctx.fillText(text, w / 2, h / 2 + 2);
    });
  }
  function sprite(tex, height, opt) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true, fog: !(opt && opt.nofog) }));
    const k = height / tex.userData.h;
    sp.scale.set(tex.userData.w * k, height, 1);
    if (opt && opt.center) sp.center.set(opt.center[0], opt.center[1]);
    return sp;
  }
  const label = (text, h, opt) => sprite(pill(text, opt), h, opt);
  const emojiTex = (e, px) => canvasTex('emo|' + e, px || 96, px || 96, (ctx, w, h) => {
    ctx.font = Math.round(w * 0.78) + 'px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000'; ctx.fillText(e, w / 2, h / 2 + w * 0.05);
  });
  // vẽ hình vector 2D cũ (cây trồng, linh kiện) thành ảnh dán lên “tấm bảng” luôn quay về camera
  function vecTex(key, w, h, fn) {
    return canvasTex(key, w * 3, h * 3, (ctx) => {
      ctx.scale(3, 3);
      const old = G.pix && G.pix.on; if (old) G.pix.on = () => false;
      try { fn(ctx); } catch (e) { /* bỏ qua */ }
      if (old) G.pix.on = old;
    });
  }

  // ---------- nhân vật chibi 3D ----------
  const geoC = {};
  const gget = (k, f) => geoC[k] || (geoC[k] = f());
  const matC = new Map();
  const tm = (c) => { if (!matC.has(c)) matC.set(c, toon(c)); return matC.get(c); };
  const EYE = basic('#3b2533'), HI = basic('#ffffff'), BLUSH = basic('#ff9fb8', { transparent: true, opacity: 0.7 });
  const SHADOW = basic('#3c2840', { transparent: true, opacity: 0.18, depthWrite: false });

  function blob(r) {
    const s = new THREE.Mesh(gget('blob', () => new THREE.CircleGeometry(1, 18)), SHADOW);
    s.rotation.x = -Math.PI / 2; s.position.y = 0.015; s.scale.setScalar(r); s.renderOrder = 1;
    return s;
  }

  function chibi(look) {
    look = look || {};
    const g = new THREE.Group(), root = new THREE.Group(); g.add(root);
    const skin = tm(look.skin || '#ffe0c7'), hairM = tm(look.hair || '#5d3a2e'), shirt = tm(look.shirt || '#7ec8f0'), pants = tm(look.pants || '#5c6b9a');
    const shoes = tm(look.shoes || '#8d6e63');
    const dress = look.top === 'dress', skirt = look.bottom === 'skirt', shorts = look.bottom === 'shorts';
    const legMat = dress || skirt ? skin : pants;
    // thân + áo
    const body = new THREE.Mesh(gget('body', () => new THREE.CylinderGeometry(0.17, 0.23, 0.4, 10)), shirt); body.position.y = 0.43; root.add(body);
    if (dress) { const sk = new THREE.Mesh(gget('dress', () => new THREE.CylinderGeometry(0.2, 0.36, 0.3, 14)), shirt); sk.position.y = 0.24; root.add(sk); }
    else if (skirt) { const sk = new THREE.Mesh(gget('skirt', () => new THREE.CylinderGeometry(0.22, 0.32, 0.2, 14)), pants); sk.position.y = 0.26; root.add(sk); }
    if (!look.top) { // đồng phục kỹ thuật viên: logo + thắt lưng
      if (look.belt) { const bl = new THREE.Mesh(gget('belt', () => new THREE.CylinderGeometry(0.205, 0.215, 0.05, 10)), tm(look.belt)); bl.position.y = 0.3; root.add(bl); }
      const logo = new THREE.Mesh(gget('logo', () => new THREE.CircleGeometry(0.045, 10)), basic('#ffffff')); logo.position.set(0.08, 0.5, 0.2); logo.rotation.x = -0.15; root.add(logo);
    } else if (look.top === 'shirt' || look.top === 'polo') {
      const col = new THREE.Mesh(gget('collar', () => new THREE.TorusGeometry(0.13, 0.03, 5, 14)), look.top === 'shirt' ? tm('#ffffff') : shirt); col.rotation.x = Math.PI / 2; col.position.y = 0.63; root.add(col);
    } else if (look.top === 'hoodie') {
      const hood = new THREE.Mesh(gget('hood', () => new THREE.TorusGeometry(0.15, 0.06, 6, 14)), shirt); hood.rotation.x = Math.PI / 2 - 0.5; hood.position.set(0, 0.64, -0.06); root.add(hood);
      const pk = new THREE.Mesh(gget('pocket', () => new THREE.BoxGeometry(0.2, 0.08, 0.02)), tm(G.shade ? G.shade(look.shirt, -0.12) : look.shirt)); pk.position.set(0, 0.36, 0.215); root.add(pk);
    } else if (look.top === 'jacket') {
      const inner = new THREE.Mesh(gget('inner', () => new THREE.BoxGeometry(0.1, 0.36, 0.02)), tm('#ffffff')); inner.position.set(0, 0.44, 0.205); inner.rotation.x = -0.15; root.add(inner);
    }
    if (look.bag) { const bp = new THREE.Mesh(gget('bag', () => new THREE.BoxGeometry(0.28, 0.3, 0.13)), tm(look.bag)); bp.position.set(0, 0.47, -0.25); root.add(bp); }
    // chân
    const legs = [-1, 1].map((s) => {
      const l = new THREE.Group(); l.position.set(s * 0.085, 0.25, 0); root.add(l);
      const lg = new THREE.Mesh(gget('leg', () => new THREE.CapsuleGeometry(0.065, 0.12, 3, 8)), shorts ? skin : legMat); lg.position.y = -0.1; l.add(lg);
      if (shorts) { const sp = new THREE.Mesh(gget('short', () => new THREE.CylinderGeometry(0.08, 0.08, 0.1, 8)), pants); sp.position.y = -0.02; l.add(sp); }
      const st = look.shoeType;
      const sh = new THREE.Mesh(st === 'boot' ? gget('boot', () => new THREE.CylinderGeometry(0.075, 0.08, 0.16, 8)) : gget('shoe', () => new THREE.SphereGeometry(0.075, 8, 6)), shoes);
      if (st === 'boot') sh.position.set(0, -0.16, 0.01); else { sh.scale.set(1, st === 'sandal' ? 0.4 : 0.7, 1.3); sh.position.set(0, -0.2, 0.02); }
      l.add(sh);
      return l;
    });
    const arms = [-1, 1].map((s) => {
      const a = new THREE.Group(); a.position.set(s * 0.22, 0.58, 0); a.rotation.z = s * 0.28; root.add(a);
      const am = new THREE.Mesh(gget('arm', () => new THREE.CapsuleGeometry(0.052, 0.15, 3, 8)), look.top === 'tee' || look.top === 'polo' || dress ? skin : shirt); am.position.y = -0.1; a.add(am);
      if (look.top === 'tee' || look.top === 'polo' || dress) { const sl = new THREE.Mesh(gget('sleeve', () => new THREE.SphereGeometry(0.068, 8, 6)), shirt); sl.position.y = -0.01; a.add(sl); }
      const hd = new THREE.Mesh(gget('hand', () => new THREE.SphereGeometry(0.055, 8, 6)), skin); hd.position.y = -0.22; a.add(hd);
      return a;
    });
    // đầu
    const head = new THREE.Group(); head.position.y = 0.9; root.add(head);
    const hd = new THREE.Mesh(gget('head', () => new THREE.SphereGeometry(0.31, 18, 14)), skin); hd.scale.set(1.06, 0.96, 1); head.add(hd);
    const hair = new THREE.Mesh(gget('hairtop', () => new THREE.SphereGeometry(0.335, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52)), hairM);
    hair.rotation.x = -0.38; hair.position.set(0, 0.03, -0.02); hair.scale.set(1.05, 1, 1.05); head.add(hair);
    const back = new THREE.Mesh(gget('hairback', () => new THREE.SphereGeometry(0.31, 14, 10)), hairM); back.position.set(0, -0.02, -0.09); back.scale.set(1.06, 0.98, 0.9); head.add(back);
    if (look.long) {
      const lh = new THREE.Mesh(gget('hairlong', () => new THREE.CapsuleGeometry(0.2, 0.25, 4, 10)), hairM); lh.position.set(0, -0.25, -0.16); lh.scale.set(1.25, 1, 0.7); head.add(lh);
      [-1, 1].forEach((s) => { const bun = new THREE.Mesh(gget('bun', () => new THREE.SphereGeometry(0.1, 10, 8)), hairM); bun.position.set(s * 0.29, 0.1, -0.06); head.add(bun); });
      if (!look.hat) { const bow = new THREE.Mesh(gget('bow', () => new THREE.TorusGeometry(0.06, 0.03, 6, 12)), tm(look.bowCol || '#ff6f9f')); bow.position.set(0.19, 0.27, 0.06); bow.rotation.y = 0.5; head.add(bow); }
    }
    const hatT = look.hat || (look.cap ? 'cap' : null);
    if (hatT && look.cap) {
      const hm = tm(look.cap);
      if (hatT === 'sun') {
        const brim = new THREE.Mesh(gget('sunbrim', () => new THREE.CylinderGeometry(0.42, 0.42, 0.025, 20)), hm); brim.position.y = 0.19; brim.rotation.x = -0.3; head.add(brim);
        const crown = new THREE.Mesh(gget('suncrown', () => new THREE.SphereGeometry(0.3, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2)), hm); crown.position.y = 0.15; crown.rotation.x = -0.12; head.add(crown);
        const band = new THREE.Mesh(gget('band', () => new THREE.TorusGeometry(0.29, 0.022, 5, 18)), tm('#ffffff')); band.rotation.x = Math.PI / 2 - 0.12; band.position.y = 0.19; head.add(band);
      } else if (hatT === 'beanie') {
        const bn = new THREE.Mesh(gget('beanie', () => new THREE.SphereGeometry(0.345, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.42)), hm); bn.position.y = 0.03; bn.rotation.x = -0.15; head.add(bn);
        const pom = new THREE.Mesh(gget('pom', () => new THREE.SphereGeometry(0.07, 8, 6)), tm('#ffffff')); pom.position.set(0, 0.38, -0.05); head.add(pom);
      } else {
        const cap = new THREE.Mesh(gget('cap', () => new THREE.SphereGeometry(0.345, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.36)), hm); cap.position.y = 0.04; cap.rotation.x = -0.2; head.add(cap);
        const brim = new THREE.Mesh(gget('brim', () => new THREE.CylinderGeometry(0.2, 0.2, 0.03, 12, 1, false, -Math.PI / 2, Math.PI)), hm); brim.position.set(0, 0.17, 0.2); brim.rotation.x = 0.15; head.add(brim);
      }
    }
    // khuôn mặt
    [-1, 1].forEach((s) => {
      const e = new THREE.Mesh(gget('eye', () => new THREE.SphereGeometry(0.056, 10, 8)), EYE); e.scale.set(0.85, 1.2, 0.45); e.position.set(s * 0.115, -0.03, 0.285); head.add(e);
      const h = new THREE.Mesh(gget('hi', () => new THREE.SphereGeometry(0.019, 6, 5)), HI); h.position.set(s * 0.115 + 0.02, 0.0, 0.31); head.add(h);
      const bl = new THREE.Mesh(gget('blush', () => new THREE.CircleGeometry(0.05, 12)), BLUSH); bl.position.set(s * 0.2, -0.11, 0.255); bl.rotation.y = s * 0.6; bl.scale.y = 0.6; head.add(bl);
      if (look.glasses === 'sun') { const gl = new THREE.Mesh(gget('lens', () => new THREE.CircleGeometry(0.075, 14)), basic('#2a2230')); gl.position.set(s * 0.115, -0.02, 0.315); head.add(gl); }
      else if (look.glasses) { const gl = new THREE.Mesh(gget('glass', () => new THREE.TorusGeometry(0.07, 0.012, 5, 14)), EYE); gl.position.set(s * 0.115, -0.03, 0.3); head.add(gl); }
    });
    if (look.glasses) { const br = new THREE.Mesh(gget('bridge', () => new THREE.BoxGeometry(0.07, 0.012, 0.012)), EYE); br.position.set(0, -0.02, 0.31); head.add(br); }
    const mouth = new THREE.Mesh(gget('mouth', () => new THREE.TorusGeometry(0.03, 0.01, 5, 10, Math.PI)), EYE); mouth.position.set(0, -0.12, 0.29); mouth.rotation.z = Math.PI; head.add(mouth);
    g.add(blob(0.3));
    g.scale.setScalar(1.15);
    let ph = Math.random() * 6;
    const ease = (t, d) => Math.min(1, t / 0.25, (d - t) / 0.3);
    return {
      g,
      // emo = { id, t, dur } khi đang làm động tác
      anim(dt, moving, emo) {
        ph += dt * (moving ? 11 : 2);
        // tư thế gốc
        root.rotation.set(0, 0, 0); root.position.y = 0; head.rotation.set(0, 0, 0);
        arms.forEach((a, i) => { a.rotation.set(0, 0, (i ? 1 : -1) * 0.28); });
        legs.forEach((l) => l.rotation.set(0, 0, 0));
        if (emo && !moving) {
          const t = emo.t, k = Math.max(0, ease(t, emo.dur)), S2 = (i) => (i ? 1 : -1);
          switch (emo.id) {
            case 'dance': {
              const b = t * 8;
              root.position.y = Math.abs(Math.sin(b)) * 0.08 * k; root.rotation.y = Math.sin(b / 2) * 0.6 * k; root.rotation.z = Math.sin(b) * 0.08 * k;
              arms.forEach((a, i) => { a.rotation.z = S2(i) * (0.28 + k * (1.6 + Math.sin(b + i * Math.PI) * 0.9)); });
              legs.forEach((l, i) => { l.rotation.x = Math.sin(b + i * Math.PI) * 0.45 * k; });
              head.rotation.z = Math.sin(b) * 0.18 * k; break;
            }
            case 'wave': arms[1].rotation.z = 0.28 + k * (2.4 + Math.sin(t * 14) * 0.35); head.rotation.z = -0.1 * k; root.rotation.z = Math.sin(t * 7) * 0.03; break;
            case 'jump': { const j = Math.abs(Math.sin(t * Math.PI * 1.4)); root.position.y = j * 0.5 * k; arms.forEach((a, i) => { a.rotation.z = S2(i) * (0.28 + j * 2.2 * k); }); legs.forEach((l, i) => { l.rotation.x = -j * 0.5 * k * (i ? 1 : 0.6); }); break; }
            case 'spin': { const u = Math.min(1, t / (emo.dur * 0.85)); root.rotation.y = (1 - Math.cos(u * Math.PI)) * Math.PI * 2; arms.forEach((a, i) => { a.rotation.z = S2(i) * (0.28 + 1.2 * k); }); root.position.y = Math.sin(u * Math.PI) * 0.1; break; }
            case 'clap': arms.forEach((a, i) => { a.rotation.x = -1.35 * k; a.rotation.z = -S2(i) * (0.05 + Math.abs(Math.sin(t * 9)) * 0.3) * k; }); root.position.y = Math.abs(Math.sin(t * 9)) * 0.02; break;
            case 'cheer': { const j = Math.abs(Math.sin(t * 6)); root.position.y = j * 0.15 * k; arms.forEach((a, i) => { a.rotation.z = S2(i) * (0.28 + 2.5 * k) + Math.sin(t * 12 + i) * 0.15; }); break; }
            case 'bow': root.rotation.x = 0.55 * k; arms.forEach((a, i) => { a.rotation.z = S2(i) * 0.1; }); break;
            case 'heart': arms.forEach((a, i) => { a.rotation.z = S2(i) * (0.28 + 2.55 * k); a.rotation.x = -0.25 * k; }); head.rotation.z = Math.sin(t * 3) * 0.1; root.position.y = Math.abs(Math.sin(t * 3)) * 0.03; break;
            case 'sit': root.position.y = -0.2 * k; legs.forEach((l) => { l.rotation.x = -1.45 * k; }); arms.forEach((a, i) => { a.rotation.x = -0.6 * k; }); head.rotation.z = Math.sin(t * 1.5) * 0.06; break;
            case 'sleep': head.rotation.z = 0.35 * k; head.rotation.x = 0.2 * k; root.rotation.z = Math.sin(t * 1.6) * 0.05 * k; arms.forEach((a, i) => { a.rotation.z = S2(i) * 0.12; }); break;
          }
          return;
        }
        const s = moving ? Math.sin(ph) : 0;
        legs[0].rotation.x = s * 0.75; legs[1].rotation.x = -s * 0.75;
        arms[0].rotation.x = -s * 0.8; arms[1].rotation.x = s * 0.8;
        root.position.y = moving ? Math.abs(Math.sin(ph)) * 0.05 : Math.sin(ph) * 0.01;
        head.rotation.z = moving ? 0 : Math.sin(ph * 0.5) * 0.05;
      },
    };
  }

  // ---------- thú cưng 3D theo hình dáng PET_SHAPE ----------
  function pet3d(kind) {
    const P = (typeof PET_SHAPE !== 'undefined' && PET_SHAPE[kind]) || { col: '#ffcc99', dark: '#f4a261', ears: 'tri', tail: 'curl' };
    const g = new THREE.Group(), root = new THREE.Group(); g.add(root);
    const cm = tm(P.col), dm = tm(P.dark), wm = tm('#ffffff');
    const ch = P.chubby ? 1.15 : 1;
    const sph = (r, m, x, y, z, sx, sy, sz) => { const o = new THREE.Mesh(gget('ps', () => new THREE.SphereGeometry(1, 12, 10)), m); o.scale.set(r * (sx || 1), r * (sy || 1), r * (sz || 1)); o.position.set(x, y, z); root.add(o); return o; };
    let headY;
    if (P.beak) {
      sph(0.17, cm, 0, 0.2, 0, 1, 1.05, 1);
      if (P.belly) sph(0.13, dm, 0, 0.19, 0.07, 1, 1.1, 0.8);
      if (P.wing) [-1, 1].forEach((s) => sph(0.06, P.feet ? cm : tm('#ffd23f'), s * 0.16, 0.21, 0, 0.6, 1.3, 1));
      headY = 0.42;
      sph(0.14, cm, 0, headY, 0.02);
      if (kind === 'penguin') sph(0.1, wm, 0, headY - 0.01, 0.07, 1, 0.9, 0.8);
      const bk = new THREE.Mesh(gget('beak', () => new THREE.ConeGeometry(0.04, 0.08, 6)), tm('#ffa94d')); bk.rotation.x = Math.PI / 2; bk.position.set(0, headY - 0.02, 0.17); root.add(bk);
      [-1, 1].forEach((s) => sph(0.04, tm(P.feet || '#ffa94d'), s * 0.06, 0.02, 0.04, 1, 0.4, 1.4));
      if (kind === 'chick') sph(0.03, tm('#ffd23f'), 0, headY + 0.15, 0, 0.7, 1.4, 0.7);
    } else {
      sph(0.15 * ch, cm, 0, 0.17, -0.02, 0.95, 0.85, 1.2);
      if (P.belly) sph(0.1, dm, 0, 0.15, 0.08, 1, 0.9, 0.7);
      [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([a, b]) => sph(0.045, P.patches ? dm : cm, a * 0.08, 0.04, b * 0.09 - 0.02));
      headY = 0.33;
      sph(0.15 * (P.chubby ? 1.05 : 1), cm, 0, headY, 0.14);
      if (P.muzzle) sph(0.07, wm, 0, headY - 0.04, 0.27, 1, 0.75, 0.8);
      if (P.patches) [-1, 1].forEach((s) => sph(0.04, dm, s * 0.06, headY + 0.01, 0.27, 1, 1.2, 0.5));
      if (P.ears === 'tri') [-1, 1].forEach((s) => { const e = new THREE.Mesh(gget('ear', () => new THREE.ConeGeometry(0.05, kind === 'fox' ? 0.13 : 0.1, 4)), cm); e.position.set(s * 0.085, headY + 0.15, 0.12); e.rotation.z = -s * 0.25; root.add(e); });
      if (P.ears === 'long') [-1, 1].forEach((s) => sph(0.045, cm, s * 0.055, headY + 0.2, 0.1, 0.8, 2.4, 0.6));
      if (P.ears === 'round') [-1, 1].forEach((s) => sph(0.05, P.patches ? dm : cm, s * 0.11, headY + 0.11, 0.12));
      if (P.ears === 'flop') [-1, 1].forEach((s) => sph(0.05, dm, s * 0.15, headY + 0.0, 0.13, 0.6, 1.4, 0.8));
      const nose = new THREE.Mesh(gget('nose', () => new THREE.SphereGeometry(0.018, 6, 5)), basic(kind === 'bunny' ? '#ff8fab' : '#6d4c41')); nose.position.set(0, headY - 0.01, 0.29); root.add(nose);
      if (P.tail === 'curl' || P.tail === 'wag') { const t = new THREE.Mesh(gget('tail', () => new THREE.CapsuleGeometry(0.03, 0.16, 3, 6)), P.tail === 'wag' ? dm : cm); t.position.set(0, 0.26, -0.2); t.rotation.x = -0.7; root.add(t); g.userData.tail = t; }
      if (P.tail === 'puff') sph(0.05, wm, 0, 0.2, -0.2);
      if (P.tail === 'fox') { const t = sph(0.07, cm, 0, 0.22, -0.24, 0.9, 0.9, 1.9); g.userData.tail = t; sph(0.04, wm, 0, 0.25, -0.36); }
    }
    // mắt
    [-1, 1].forEach((s) => {
      const e = new THREE.Mesh(gget('peye', () => new THREE.SphereGeometry(0.024, 8, 6)), P.patches ? HI : EYE);
      e.position.set(s * 0.055, headY + 0.02, P.beak ? 0.13 : 0.275); root.add(e);
    });
    g.add(blob(0.2));
    let ph = Math.random() * 6;
    return { g, anim(dt, mv) { ph += dt * (mv ? 14 : 3); root.position.y = mv ? Math.abs(Math.sin(ph)) * 0.05 : Math.abs(Math.sin(ph * 0.8)) * 0.01; if (g.userData.tail) g.userData.tail.rotation.z = Math.sin(ph * 0.7) * 0.5; } };
  }

  // ---------- vật nuôi trong trại ----------
  function animal3d(kind) {
    const g = new THREE.Group(), root = new THREE.Group(); g.add(root);
    const sph = (r, c, x, y, z, sx, sy, sz) => { const o = new THREE.Mesh(gget('ps', () => new THREE.SphereGeometry(1, 12, 10)), tm(c)); o.scale.set(r * (sx || 1), r * (sy || 1), r * (sz || 1)); o.position.set(x, y, z); root.add(o); return o; };
    const leg = (c, x, z, h) => { const o = new THREE.Mesh(gget('aleg', () => new THREE.CylinderGeometry(0.045, 0.04, 1, 6)), tm(c)); o.scale.y = h; o.position.set(x, h / 2, z); root.add(o); };
    const eyes = (y, z, sp) => [-1, 1].forEach((s) => { const e = new THREE.Mesh(gget('peye', () => new THREE.SphereGeometry(0.024, 8, 6)), EYE); e.position.set(s * sp, y, z); root.add(e); });
    if (kind === 'chicken' || kind === 'duck') {
      const duck = kind === 'duck';
      const c = duck ? '#fff7e0' : '#ffffff';
      sph(0.17, c, 0, 0.22, 0, 1, 0.9, 1.15);
      sph(0.11, c, 0, 0.42, 0.12);
      sph(0.05, c, 0, 0.26, -0.18, 1, 1.4, 1);
      if (!duck) sph(0.035, '#ff5a5a', 0, 0.54, 0.12, 0.6, 1.2, 1.2);
      const bk = new THREE.Mesh(duck ? gget('bill', () => new THREE.BoxGeometry(0.09, 0.03, 0.09)) : gget('beak', () => new THREE.ConeGeometry(0.04, 0.08, 6)), tm('#ffa94d'));
      if (!duck) bk.rotation.x = Math.PI / 2; bk.position.set(0, 0.41, 0.25); root.add(bk);
      leg('#ffa94d', -0.06, 0, 0.1); leg('#ffa94d', 0.06, 0, 0.1);
      eyes(0.45, 0.21, 0.05);
    } else if (kind === 'pig') {
      sph(0.22, '#ffb8c8', 0, 0.3, 0, 0.95, 0.85, 1.3);
      sph(0.17, '#ffb8c8', 0, 0.38, 0.27);
      const sn = new THREE.Mesh(gget('snout', () => new THREE.CylinderGeometry(0.065, 0.065, 0.06, 12)), tm('#ff94ad')); sn.rotation.x = Math.PI / 2; sn.position.set(0, 0.35, 0.44); root.add(sn);
      [-1, 1].forEach((s) => sph(0.05, '#ff94ad', s * 0.1, 0.53, 0.26, 1, 0.6, 0.6));
      [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([a, b]) => leg('#ff94ad', a * 0.1, b * 0.16, 0.14));
      eyes(0.42, 0.42, 0.07);
    } else if (kind === 'sheep') {
      for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; sph(0.13, '#ffffff', Math.cos(a) * 0.12, 0.38 + Math.sin(i * 2) * 0.04, Math.sin(a) * 0.15); }
      sph(0.19, '#ffffff', 0, 0.42, 0);
      sph(0.12, '#5b4a55', 0, 0.42, 0.28, 0.9, 1, 1);
      [-1, 1].forEach((s) => sph(0.04, '#5b4a55', s * 0.13, 0.45, 0.25, 1.4, 0.6, 0.6));
      [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([a, b]) => leg('#5b4a55', a * 0.1, b * 0.13, 0.22));
      [-1, 1].forEach((s) => { const e = new THREE.Mesh(gget('peye', () => new THREE.SphereGeometry(0.024, 8, 6)), HI); e.position.set(s * 0.05, 0.45, 0.38); root.add(e); });
    } else if (kind === 'cow') {
      sph(0.26, '#ffffff', 0, 0.48, 0, 0.95, 0.85, 1.35);
      [[0.15, 0.55, 0.1], [-0.18, 0.45, -0.12], [0.05, 0.62, -0.2]].forEach(([x, y, z]) => sph(0.09, '#3b3b48', x, y, z, 1, 0.8, 1.2));
      sph(0.17, '#ffffff', 0, 0.62, 0.36);
      sph(0.1, '#ffc2cc', 0, 0.56, 0.5, 1.1, 0.75, 0.6);
      [-1, 1].forEach((s) => { sph(0.05, '#3b3b48', s * 0.17, 0.68, 0.33, 1.4, 0.6, 0.6); const h = new THREE.Mesh(gget('horn', () => new THREE.ConeGeometry(0.025, 0.08, 5)), tm('#fff3c4')); h.position.set(s * 0.09, 0.8, 0.33); root.add(h); });
      [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([a, b]) => leg('#ffffff', a * 0.13, b * 0.2, 0.3));
      eyes(0.66, 0.5, 0.075);
    } else {
      const d = (typeof ANIMALS !== 'undefined' && ANIMALS.find((x) => x.id === kind)) || {};
      const sp = sprite(emojiTex(d.emoji || '🐾'), 0.6, { center: [0.5, 0] }); root.add(sp);
    }
    g.add(blob(kind === 'cow' ? 0.36 : kind === 'pig' || kind === 'sheep' ? 0.3 : 0.2));
    let ph = Math.random() * 6;
    return { g, anim(dt, mv) { ph += dt * (mv ? 9 : 2); root.position.y = mv ? Math.abs(Math.sin(ph)) * 0.04 : 0; root.rotation.x = mv ? 0 : Math.sin(ph) * 0.03; } };
  }

  // ============================================================
  // DỰNG THẾ GIỚI TĨNH
  // ============================================================
  const BASE_OF = () => ({ grass: T.GRASS, city: T.PAVE, sand: T.SAND, forest: T.DARK, industrial: T.CONCRETE });
  let fadeList = [], doorList = [], lampSpots = [], evDeco = [], lockSprites = [], farmIdx = new Map(), cropSprites = [], scarecrows = [];

  function groundColor(t, tx, ty) {
    const v = G.hash2(tx, ty), odd = (tx + ty) % 2;
    switch (t) {
      case T.GRASS: return odd ? (v < 0.5 ? '#a6e38e' : '#a0de88') : (v < 0.5 ? '#9bd985' : '#96d580');
      case T.DARK: return odd ? '#86c97f' : '#7fc279';
      case T.SAND: return v < 0.5 ? '#ffe7b8' : '#fde2ae';
      case T.PAVE: return odd ? '#fde6ee' : '#f6d9e4';
      case T.CONCRETE: return odd ? '#e3dcef' : '#dad2e8';
      case T.PATH: return v < 0.5 ? '#ffe9cf' : '#fbe2c4';
      case T.FARM: return '#c69273';
      case T.ROAD: return '#b4b9cf';
      default: return '#9bd985';
    }
  }

  // mặt đất chế độ Như thật: mỗi loại nền 1 khối, toạ độ ảnh theo thế giới (liền mạch giữa các ô)
  function buildGroundReal(r, BASE) {
    const ox = r.gx * G.RW, oy = r.gy * G.RH;
    const groups = {};
    const K = (t) => t === T.SAND ? 'sand' : t === T.PAVE ? 'paving' : t === T.CONCRETE ? 'concrete' : t === T.PATH ? 'dirt' : t === T.ROAD ? 'asphalt' : t === T.FARM ? 'soil' : 'grass';
    const isWet = (t) => t === T.WATER || t === T.BRIDGE;
    const quad = (key, a, b, c, d, shade) => {
      const gq = groups[key] || (groups[key] = { pos: [], uv: [], col: [] });
      const side = a[1] !== b[1] || a[1] !== c[1];
      [a, b, c, a, c, d].forEach((p) => {
        gq.pos.push(p[0], p[1], p[2]);
        if (side) gq.uv.push((p[0] + p[2]) / 3, p[1] / 3); else gq.uv.push(p[0] / 3, p[2] / 3);
        gq.col.push(shade[0], shade[1], shade[2]);
      });
    };
    for (let ty = oy; ty < oy + G.RH; ty++) for (let tx = ox; tx < ox + G.RW; tx++) {
      const t = W.get(tx, ty);
      if (isWet(t)) continue;
      const base = BASE[r.ground] ?? T.GRASS;
      const under = (t === T.TREE || t === T.BUSH || t === T.ROCK || t === T.FLOWER || t === T.LAMP || t === T.FENCE || t === T.PINE || t === T.BUILD || t === T.DOOR) ? (base === T.PAVE || base === T.CONCRETE ? (t === T.TREE || t === T.FLOWER || t === T.BUSH ? T.GRASS : base) : base) : t;
      const v = 0.9 + G.hash2(tx, ty) * 0.14;
      const sh = under === T.DARK || under === T.PINE ? [v * 0.78, v * 0.86, v * 0.8] : [v, v, v];
      const key = K(under);
      quad(key, [tx, 0, ty + 1], [tx + 1, 0, ty + 1], [tx + 1, 0, ty], [tx, 0, ty], sh);
      const sk = under === T.SAND ? 'sand' : 'dirt', ss = [0.75, 0.72, 0.7];
      if (isWet(W.get(tx, ty + 1))) quad(sk, [tx, -0.55, ty + 1], [tx + 1, -0.55, ty + 1], [tx + 1, 0, ty + 1], [tx, 0, ty + 1], ss);
      if (isWet(W.get(tx, ty - 1))) quad(sk, [tx + 1, -0.55, ty], [tx, -0.55, ty], [tx, 0, ty], [tx + 1, 0, ty], ss);
      if (isWet(W.get(tx + 1, ty))) quad(sk, [tx + 1, -0.55, ty + 1], [tx + 1, -0.55, ty], [tx + 1, 0, ty], [tx + 1, 0, ty + 1], ss);
      if (isWet(W.get(tx - 1, ty))) quad(sk, [tx, -0.55, ty], [tx, -0.55, ty + 1], [tx, 0, ty + 1], [tx, 0, ty], ss);
    }
    Object.entries(groups).forEach(([key, gq]) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(gq.pos, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(gq.uv, 2));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(gq.col, 3));
      geo.computeVertexNormals(); geo.computeBoundingSphere();
      const m = new THREE.Mesh(geo, R3.gmat[key]);
      m.receiveShadow = true;
      scene.add(m);
    });
  }

  // gộp nhiều hình thành 1 (dùng cho tán lá, búi cỏ)
  function merge(list) {
    const pos = [], uv = [], nor = [];
    list.forEach((g) => { const n = g.index ? g.toNonIndexed() : g; const P = n.attributes.position.array, U = n.attributes.uv.array; for (let i = 0; i < P.length; i++) pos.push(P[i]); for (let i = 0; i < U.length; i++) uv.push(U[i]); });
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    out.computeVertexNormals();
    return out;
  }
  // tán lá: nhiều tấm lá đan chéo, pháp tuyến hướng ra ngoài như khối cầu → ánh sáng mềm tự nhiên
  function clumpGeo(cards, rad, seed) {
    const r = G.mulberry(seed), parts = [];
    for (let i = 0; i < cards; i++) {
      const pl = new THREE.PlaneGeometry(rad * 1.25, rad * 1.25);
      pl.rotateX((r() - 0.5) * Math.PI); pl.rotateY(r() * Math.PI); pl.rotateZ((r() - 0.5) * Math.PI);
      const a = r() * Math.PI * 2, e = (r() - 0.5) * 1.4, d = rad * 0.45 * r();
      pl.translate(Math.cos(a) * Math.cos(e) * d, Math.sin(e) * d * 0.8, Math.sin(a) * Math.cos(e) * d);
      parts.push(pl);
    }
    const g = merge(parts);
    const P = g.attributes.position, N = g.attributes.normal;
    for (let i = 0; i < P.count; i++) { V.set(P.getX(i), P.getY(i) + rad * 0.25, P.getZ(i)).normalize(); N.setXYZ(i, V.x, V.y, V.z); }
    return g;
  }
  function tuftGeo() {
    const a = new THREE.PlaneGeometry(0.55, 0.32); a.translate(0, 0.16, 0);
    const b = a.clone(); b.rotateY(Math.PI / 2);
    const c = a.clone(); c.rotateY(Math.PI / 4);
    const g = merge([a, b, c]);
    const N = g.attributes.normal; for (let i = 0; i < N.count; i++) N.setXYZ(i, 0, 1, 0);
    return g;
  }

  function buildGround(r, BASE) {
    const ox = r.gx * G.RW, oy = r.gy * G.RH;
    const pos = [], cols = [];
    const c3 = new THREE.Color();
    const quad = (a, b, c, d, color) => { // 4 đỉnh theo thứ tự ngược kim đồng hồ khi nhìn từ phía mặt
      c3.set(color);
      [a, b, c, a, c, d].forEach((p) => { pos.push(p[0], p[1], p[2]); cols.push(c3.r, c3.g, c3.b); });
    };
    const isWet = (t) => t === T.WATER || t === T.BRIDGE;
    for (let ty = oy; ty < oy + G.RH; ty++) for (let tx = ox; tx < ox + G.RW; tx++) {
      const t = W.get(tx, ty);
      if (isWet(t)) continue;
      const base = BASE[r.ground] ?? T.GRASS;
      const under = (t === T.TREE || t === T.BUSH || t === T.ROCK || t === T.FLOWER || t === T.LAMP || t === T.FENCE || t === T.PINE || t === T.BUILD || t === T.DOOR) ? (base === T.PAVE || base === T.CONCRETE ? (t === T.TREE || t === T.FLOWER || t === T.BUSH ? T.GRASS : base) : base) : t;
      const cc = groundColor(under, tx, ty);
      quad([tx, 0, ty + 1], [tx + 1, 0, ty + 1], [tx + 1, 0, ty], [tx, 0, ty], cc);
      // bờ đất khi giáp nước
      const side = under === T.SAND ? '#e8c48f' : under === T.PAVE || under === T.CONCRETE || under === T.ROAD ? '#c9bfd8' : '#c79a72';
      if (isWet(W.get(tx, ty + 1))) quad([tx, -0.55, ty + 1], [tx + 1, -0.55, ty + 1], [tx + 1, 0, ty + 1], [tx, 0, ty + 1], side);
      if (isWet(W.get(tx, ty - 1))) quad([tx + 1, -0.55, ty], [tx, -0.55, ty], [tx, 0, ty], [tx + 1, 0, ty], side);
      if (isWet(W.get(tx + 1, ty))) quad([tx + 1, -0.55, ty + 1], [tx + 1, -0.55, ty], [tx + 1, 0, ty], [tx + 1, 0, ty + 1], side);
      if (isWet(W.get(tx - 1, ty))) quad([tx, -0.55, ty], [tx, -0.55, ty + 1], [tx, 0, ty + 1], [tx, 0, ty], side);
    }
    if (REAL) return buildGroundReal(r, BASE);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    const m = new THREE.Mesh(geo, R3.groundMat);
    m.receiveShadow = true;
    scene.add(m);
  }

  function buildRegionProps(r) {
    const ox = r.gx * G.RW, oy = r.gy * G.RH, h2 = G.hash2;
    const isRoad = (t) => t === T.ROAD;
    const L = { lines: [], zebra: [], curbs: [], trunks: [], trees: [], blossoms: [], pines: [], bushes: [], rocks: [], stems: [], flowers: [], posts: [], rails: [], lamps: [], bulbs: [], pools: [], planks: [], brails: [] };
    for (let ty = oy; ty < oy + G.RH; ty++) for (let tx = ox; tx < ox + G.RW; tx++) {
      const t = W.get(tx, ty), x = tx + 0.5, z = ty + 0.5, v = h2(tx * 7 + 3, ty * 11 + 5);
      if (t === T.BRIDGE) {
        L.planks.push({ x, y: 0.0, z, sx: 1.0, sy: 0.1, sz: 1.0, c: v < 0.5 ? '#eaa56c' : '#e19a62' });
        const hz = W.get(tx - 1, ty) !== T.WATER && W.get(tx + 1, ty) !== T.WATER;
        const wet = (a, b) => W.get(tx + a, ty + b) === T.WATER;
        if (hz) { if (wet(0, -1)) L.brails.push({ x, y: 0.25, z: z - 0.45, sx: 1, sy: 0.07, sz: 0.08 }); if (wet(0, 1)) L.brails.push({ x, y: 0.25, z: z + 0.45, sx: 1, sy: 0.07, sz: 0.08 }); }
        else { if (wet(-1, 0)) L.brails.push({ x: x - 0.45, y: 0.25, z, sx: 0.08, sy: 0.07, sz: 1 }); if (wet(1, 0)) L.brails.push({ x: x + 0.45, y: 0.25, z, sx: 0.08, sy: 0.07, sz: 1 }); }
        continue;
      }
      if (t === T.ROAD) {
        const rd = (a, b) => { const n = W.get(tx + a, ty + b); return isRoad(n) || n === T.BRIDGE; };
        const horiz = (a, b) => rd(a - 1, b) && rd(a + 1, b), vert = (a, b) => rd(a, b - 1) && rd(a, b + 1);
        const inter = (a, b) => rd(a, b) && horiz(a, b) && vert(a, b);
        const U = rd(0, -1), D = rd(0, 1), Lf = rd(-1, 0), Rt = rd(1, 0);
        if (!inter(0, 0)) {
          if (horiz(0, 0) && U && !D && tx % 2 === 0) L.lines.push({ x, y: 0.006, z: z - 0.5, sx: 0.5, sy: 1, sz: 0.08 });
          if (vert(0, 0) && Lf && !Rt && ty % 2 === 0) L.lines.push({ x: x - 0.5, y: 0.006, z, sx: 0.08, sy: 1, sz: 0.5 });
          if (horiz(0, 0) && (inter(-1, 0) || inter(1, 0))) for (let k = -0.36; k <= 0.37; k += 0.24) L.zebra.push({ x, y: 0.005, z: z + k, sx: 0.8, sy: 1, sz: 0.12 });
          if (vert(0, 0) && (inter(0, -1) || inter(0, 1))) for (let k = -0.36; k <= 0.37; k += 0.24) L.zebra.push({ x: x + k, y: 0.005, z, sx: 0.12, sy: 1, sz: 0.8 });
        }
        const curb = (a, b, px, pz, sx, sz) => { const n = W.get(tx + a, ty + b); if (!isRoad(n) && n !== T.BRIDGE && n !== T.PATH && n !== T.DOOR && n !== T.WATER) L.curbs.push({ x: x + px, y: 0.04, z: z + pz, sx, sy: 0.08, sz }); };
        curb(0, -1, 0, -0.46, 1, 0.08); curb(0, 1, 0, 0.46, 1, 0.08); curb(-1, 0, -0.46, 0, 0.08, 1); curb(1, 0, 0.46, 0, 0.08, 1);
      } else if (t === T.TREE) {
        const s = 0.8 + v * 0.45, pink = h2(tx, ty * 3) < 0.18;
        L.trunks.push({ x, y: 0.3 * s, z, sx: s, c: '#b07a5a' });
        const arr = pink ? L.blossoms : L.trees;
        arr.push({ x, y: 0.95 * s, z, sx: s * 1.05, sy: s * 0.95, sz: s * 1.05, ry: v * 6, c: pink ? (v < 0.5 ? '#ffb7d0' : '#ffc6da') : (v < 0.33 ? '#7ccf7c' : v < 0.66 ? '#86d685' : '#71c477') });
        arr.push({ x: x + 0.18, y: 1.3 * s, z: z - 0.08, sx: s * 0.62, ry: v * 3, c: pink ? '#ffd2e2' : '#98e08f' });
      } else if (t === T.PINE) {
        const s = 0.85 + v * 0.4;
        L.trunks.push({ x, y: 0.25 * s, z, sx: s * 0.9, c: '#9a6a4e' });
        L.pines.push({ x, y: 0.85 * s, z, sx: s, c: '#5fb57a' });
        L.pines.push({ x, y: 1.35 * s, z, sx: s * 0.72, c: '#6cc285' });
      } else if (t === T.BUSH) {
        L.bushes.push({ x, y: 0.22, z, sx: 0.9 + v * 0.3, sy: 0.7, sz: 0.85, ry: v * 6, c: v < 0.5 ? '#8bd683' : '#7fcd7a' });
        if (v < 0.4) L.flowers.push({ x: x + 0.15, y: 0.5, z: z + 0.2, sx: 0.7, c: '#ff9ec2' });
      } else if (t === T.ROCK) {
        L.rocks.push({ x, y: 0.15, z, sx: 0.5 + v * 0.25, sy: 0.4, sz: 0.45, ry: v * 6, c: v < 0.5 ? '#c9bfdc' : '#bdb2d3' });
      } else if (t === T.FLOWER) {
        const pal = ['#ff8fb8', '#ffd76b', '#ffffff', '#c9a7ff', '#ff9f8a'];
        for (let k = 0; k < 3; k++) {
          const a = h2(tx * 13 + k, ty * 17), b = h2(tx * 5 + k * 3, ty * 29);
          const fx = x + (a - 0.5) * 0.7, fz = z + (b - 0.5) * 0.7;
          L.stems.push({ x: fx, y: 0.08, z: fz, sx: 1 });
          L.flowers.push({ x: fx, y: 0.18, z: fz, sx: 0.9 + a * 0.4, c: pal[Math.floor(b * pal.length)] });
        }
      } else if (t === T.FENCE) {
        L.posts.push({ x, y: 0.25, z, sx: 1 });
        const f = (a, b) => W.get(tx + a, ty + b) === T.FENCE;
        if (f(1, 0)) L.rails.push({ x: x + 0.5, y: 0.32, z, sx: 1 });
        if (f(0, 1)) L.rails.push({ x, y: 0.32, z: z + 0.5, sx: 1, ry: Math.PI / 2 });
      } else if (t === T.LAMP) {
        L.lamps.push({ x, y: 0.6, z, sx: 1 });
        L.bulbs.push({ x, y: 1.22, z, sx: 1 });
        L.pools.push({ x, y: 0.02, z, sx: 1.6, rx: -Math.PI / 2 });
        lampSpots.push({ x, z });
      }
    }
    const G3 = R3.geo, M3 = R3.mat;
    if (REAL) {
      // cây thật hơn: thân vân gỗ + tán lá nhiều lớp, búi cỏ trên nền cỏ
      L.trees.forEach((p) => { p.c = null; }); L.blossoms.forEach((p) => { p.c = null; });
      L.bushes.forEach((p) => { p.c = null; p.sy = p.sx * 0.75; });
      L.rocks.forEach((p) => { p.c = null; });
      L.pines.forEach((p) => { p.c = null; });
      L.tufts = [];
      for (let ty = oy; ty < oy + G.RH; ty++) for (let tx = ox; tx < ox + G.RW; tx++) {
        const t = W.get(tx, ty);
        if (t !== T.GRASS && t !== T.DARK && t !== T.FLOWER && t !== T.TREE) continue;
        const n = Math.floor(h2(tx * 3, ty * 5) * 1.8);
        for (let k = 0; k < n; k++) { const a = h2(tx * 17 + k, ty * 13), b = h2(tx * 7, ty * 19 + k); L.tufts.push({ x: tx + 0.15 + a * 0.7, y: 0, z: ty + 0.15 + b * 0.7, sx: 0.45 + a * 0.35, sy: 0.4 + b * 0.45, sz: 0.45 + a * 0.35, ry: a * 6 }); }
      }
      inst(G3.tuft, M3.tuft, L.tufts, { receive: true });
    }
    inst(G3.flat, M3.line, L.lines);
    inst(G3.flat, M3.zebra, L.zebra);
    inst(G3.box, M3.curb, L.curbs);
    inst(G3.box, REAL ? M3.wood : M3.plank, L.planks, { cast: true });
    inst(G3.box, M3.brail, L.brails, { cast: true });
    inst(G3.trunk, REAL ? M3.bark : M3.white, L.trunks, { cast: true });
    inst(G3.foliage, M3.leaf, L.trees, { cast: true });
    inst(G3.foliage, REAL ? M3.blossom : M3.leaf, L.blossoms, { cast: true });
    inst(G3.cone, REAL ? M3.pine : M3.leaf, L.pines, { cast: true });
    inst(REAL ? G3.foliage : G3.bush, REAL ? M3.leaf : M3.white, L.bushes, { cast: true });
    inst(G3.rock, REAL ? M3.rock : M3.leaf, L.rocks, { cast: true });
    inst(G3.stem, M3.stem, L.stems);
    inst(G3.flower, M3.white, L.flowers);
    inst(G3.post, REAL ? M3.wood : M3.white, L.posts, { cast: true });
    inst(G3.rail, REAL ? M3.wood : M3.white, L.rails, { cast: true });
    inst(G3.lamp, M3.lamp, L.lamps, { cast: true });
    inst(G3.bulb, bulbMat, L.bulbs);
    const pm = inst(G3.pool, poolMat, L.pools, { receive: false });
    if (pm) pm.renderOrder = 2;
  }

  function gableRoof(w, d, h) {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
    g.translate(0, 0, -d / 2);
    return g;
  }

  function buildBuildings() {
    const BIG = new Set(['service', 'shop', 'library', 'factory', 'hotel', 'airport', 'mall', 'hvac']);
    const AWN = new Set(['cafe', 'koi', 'phela', 'farmshop', 'petshop', 'shop', 'mall']);
    const doorMat = REAL ? surf('wood') : toon('#b9785a'), frameMat = toon('#ffffff'), acMat = toon('#f4f6fb', REAL ? { roughness: 0.35, metalness: 0.4 } : {}), fanMat = toon('#8f9bb5'), baseMat = REAL ? surf('concrete') : toon('#ecdcd2');
    const BRICK = new Set(['shop', 'factory', 'library', 'station', 'cafe', 'ranch']);
    const wallsC = {}, roofsC = {};
    const winGeo = new THREE.BoxGeometry(0.4, 0.36, 0.05), wfGeo = new THREE.BoxGeometry(0.5, 0.46, 0.04);
    W.buildings.forEach((b) => {
      const bt = BUILDING_TYPES[b.t] || BUILDING_TYPES.house;
      const g = new THREE.Group();
      const cx = b.x + b.w / 2, cz = b.y + b.h / 2;
      g.position.set(cx, 0, cz);
      let wallMat = tm(bt.wall), roofMat = tm(bt.roof);
      if (REAL) {
        const wk = (BRICK.has(b.t) ? 'brick' : 'plaster') + bt.wall;
        wallMat = wallsC[wk] || (wallsC[wk] = BRICK.has(b.t) ? surf('brick', { m: { color: '#ffffff' } }) : surf('plaster', { m: { color: new THREE.Color(bt.wall).lerp(new THREE.Color('#ffffff'), 0.3) } }));
        const big = BIG.has(b.t) || b.w >= 7;
        const rk = big ? 'flat' : bt.roof;
        // mái nhà thật: ngói đỏ đất nung (pha chút màu riêng của từng loại nhà); nhà lớn mái bằng bê tông
        roofMat = roofsC[rk] || (roofsC[rk] = big ? surf('concrete', { m: { color: '#9a958e' } })
          : surf('rooftile', { rep: 1, m: { color: new THREE.Color('#ffffff').lerp(realRoof(bt.roof), 0.12) } }));
      }
      let signY = 2.3, front = b.h / 2;
      if (b.t === 'station') {
        const roof = new THREE.Mesh(new THREE.BoxGeometry(b.w - 0.2, 0.12, b.h - 0.3), roofMat); roof.position.y = 1.3; roof.castShadow = true; g.add(roof);
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, c]) => { const p = new THREE.Mesh(R3.geo.pole, frameMat); p.position.set(a * (b.w / 2 - 0.3), 0.65, c * (b.h / 2 - 0.3)); g.add(p); });
        const bench = new THREE.Mesh(new THREE.BoxGeometry(b.w - 1, 0.12, 0.4), tm('#7ec8f0')); bench.position.set(0, 0.4, -0.2); bench.castShadow = true; g.add(bench);
        signY = 1.75;
      } else {
        const big = BIG.has(b.t) || b.w >= 7;
        const H = big ? 1.9 + Math.min(1.2, (b.w - 6) * 0.2) : 1.35;
        const ww = b.w - 0.3, dd = b.h - 0.5;
        const walls = new THREE.Mesh(new THREE.BoxGeometry(ww, H, dd), wallMat); walls.position.set(0, H / 2, -0.1); walls.castShadow = walls.receiveShadow = true; g.add(walls);
        const base = new THREE.Mesh(new THREE.BoxGeometry(ww + 0.06, 0.18, dd + 0.06), baseMat); base.position.set(0, 0.09, -0.1); g.add(base);
        front = -0.1 + dd / 2;
        if (big) {
          const slab = new THREE.Mesh(new THREE.BoxGeometry(ww + 0.2, 0.22, dd + 0.2), roofMat); slab.position.set(0, H + 0.11, -0.1); slab.castShadow = true; g.add(slab);
          for (let k = 0; k < Math.min(3, Math.floor(b.w / 4)); k++) { // cục nóng điều hoà trên mái
            const ac = new THREE.Mesh(R3.geo.ac, acMat); ac.position.set(-ww / 2 + 0.8 + k * 1.1, H + 0.45, -0.1 - dd / 4); ac.castShadow = true; g.add(ac);
            const fan = new THREE.Mesh(R3.geo.fan, fanMat); fan.rotation.x = Math.PI / 2; fan.position.set(ac.position.x - 0.1, ac.position.y, ac.position.z + 0.18); g.add(fan);
          }
          signY = H + 0.75;
        } else {
          const roof = new THREE.Mesh(gableRoof(ww + 0.35, dd + 0.35, 0.95), roofMat); roof.position.set(0, H, -0.1); roof.castShadow = true; g.add(roof);
          if (b.t === 'home' || b.t === 'house') { const ch = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.25), tm('#e8968c')); ch.position.set(ww / 4, H + 0.6, -0.1 - dd / 5); ch.castShadow = true; g.add(ch); }
          signY = H + 1.25;
        }
        const dxl = b.dx + 0.5 - cx;
        const fr = new THREE.Mesh(R3.geo.dframe, frameMat); fr.position.set(dxl, 0.5, front + 0.02); g.add(fr);
        const door = new THREE.Mesh(R3.geo.door, doorMat); door.position.set(dxl, 0.45, front + 0.03); g.add(door);
        const knob = new THREE.Mesh(R3.geo.knob, tm('#ffd76b')); knob.position.set(dxl + 0.18, 0.45, front + 0.08); g.add(knob);
        const rows = big ? Math.max(1, Math.floor((H - 0.4) / 0.75)) : 1;
        for (let rr = 0; rr < rows; rr++) for (let wx = -ww / 2 + 0.6; wx < ww / 2 - 0.4; wx += 1.0) {
          if (rr === 0 && Math.abs(wx - dxl) < 0.75) continue;
          const y = big ? 0.85 + rr * 0.75 : 0.78;
          const wf = new THREE.Mesh(wfGeo, frameMat); wf.position.set(wx, y, front + 0.01); g.add(wf);
          const wi = new THREE.Mesh(winGeo, winMat); wi.position.set(wx, y, front + 0.02); g.add(wi);
        }
        if (AWN.has(b.t)) {
          const aw = Math.min(ww - 0.4, 3);
          const a = new THREE.Mesh(new THREE.BoxGeometry(aw, 0.06, 0.55), roofMat); a.position.set(dxl, 1.12, front + 0.25); a.rotation.x = 0.3; a.castShadow = true; g.add(a);
          for (let k = -1; k <= 1; k += 2) { const st = new THREE.Mesh(new THREE.BoxGeometry(aw / 4, 0.065, 0.56), frameMat); st.position.set(dxl + k * aw / 4, 1.12, front + 0.25); st.rotation.x = 0.3; g.add(st); }
        }
        // trang trí sự kiện (ẩn, chỉ hiện khi có sự kiện ở toà nhà này)
        const ev = new THREE.Group(); ev.visible = false;
        [[-0.55, '#ff6f9f'], [0.55, '#c3a6ff']].forEach(([dx, c]) => {
          const bal = new THREE.Mesh(R3.geo.balloon, tm(c)); bal.position.set(dxl + dx, 1.45, front + 0.25); bal.scale.set(1, 1.2, 1); ev.add(bal);
          const str = new THREE.Mesh(R3.geo.string, basic('#a07090')); str.position.set(dxl + dx, 0.95, front + 0.25); ev.add(str);
        });
        const flagCols = ['#ff8fab', '#ffd166', '#8fd6a7', '#7ec8f0', '#c3a6ff'];
        const n = Math.max(5, Math.round(ww * 1.6));
        for (let i = 0; i < n; i++) {
          const u = (i + 0.5) / n, fx = -ww / 2 + ww * u;
          const f = new THREE.Mesh(R3.geo.flag, tm(flagCols[i % 5])); f.position.set(fx, H - 0.12 - Math.sin(u * Math.PI) * 0.2, front + 0.06); f.rotation.x = Math.PI; ev.add(f);
        }
        g.add(ev);
        evDeco.push({ b, ev, g, dxl, front, H, lbl: null, icon: null });
      }
      const sign = label((bt.icon ? bt.icon + ' ' : '') + b.name, 0.42);
      sign.position.set(b.t === 'station' ? 0 : b.dx + 0.5 - cx, signY, front);
      if (REAL && b.t !== 'station') { g.scale.y = 1.6; sign.scale.y /= 1.6; sign.position.y += 0.2; }
      // mỗi nhà có vật liệu riêng để làm mờ khi che mất người chơi
      const mats = [];
      g.traverse((o) => { if (o.isMesh && o.material && !o.material.isSpriteMaterial) { o.material = o.material.clone(); mats.push(o.material); } });
      fadeList.push({ b, mats, op: 1 });
      g.add(sign);
      scene.add(g);
      doorList.push(b);
    });
  }

  function buildFarm() {
    const list = W.farmTiles.map((f) => ({ x: f.x + 0.5, y: 0.03, z: f.y + 0.5, sx: 0.92, sy: 0.06, sz: 0.92, c: '#b98262' }));
    soilMesh = inst(R3.geo.box, REAL ? surf('soil', { m: { roughness: 1 } }) : lam('#ffffff'), list);
    W.farmTiles.forEach((f, i) => {
      farmIdx.set(f.x + ',' + f.y, i);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: true, alphaTest: 0.3 }));
      sp.center.set(0.5, 0.08); sp.position.set(f.x + 0.5, 0.05, f.y + 0.62); sp.visible = false;
      scene.add(sp);
      const tag = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false })); tag.visible = false; scene.add(tag);
      cropSprites.push({ f, sp, tag, key: '', tagKey: '' });
    });
    // bù nhìn ở góc ruộng đầu tiên mỗi vùng
    const seen = {};
    W.farmTiles.forEach((f) => {
      const r = W.regionOfTile(f.x, f.y);
      if (!r || seen[r.id]) return; seen[r.id] = true;
      const g = new THREE.Group(); g.position.set(f.x - 0.3, 0, f.y + 0.5);
      const pole = new THREE.Mesh(R3.geo.pole, tm('#8d6e63')); pole.position.y = 0.65; g.add(pole);
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.06), tm('#8d6e63')); bar.position.y = 0.85; g.add(bar);
      const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.38, 0.18), tm('#e57373')); shirt.position.y = 0.8; shirt.castShadow = true; g.add(shirt);
      const head = new THREE.Mesh(gget('ps', () => new THREE.SphereGeometry(1, 12, 10)), tm('#ffe0b2')); head.scale.setScalar(0.16); head.position.y = 1.14; g.add(head);
      const hat = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.22, 10), tm('#fbc02d')); hat.position.y = 1.32; hat.castShadow = true; g.add(hat);
      scene.add(g);
    });
  }

  function buildLocks() {
    lockGroup = new THREE.Group(); scene.add(lockGroup);
    const mat = new THREE.MeshBasicMaterial({ color: '#6e508c', transparent: true, opacity: 0.38, depthWrite: false });
    W.regions.forEach((r) => {
      if (!r.level || r.level <= 1) return;
      const g = new THREE.Group();
      const m = new THREE.Mesh(new THREE.BoxGeometry(G.RW, 3.2, G.RH), mat);
      m.position.set(r.gx * G.RW + G.RW / 2, 1.6, r.gy * G.RH + G.RH / 2);
      g.add(m);
      const l1 = label('🔒 ' + r.name, 1.6, { bg: '#fff', fg: '#6b3d5a' }); l1.position.set(m.position.x, 4.2, m.position.z); g.add(l1);
      const l2 = label('Cần đạt Level ' + r.level, 1.0, { bg: '#ffe3ee', fg: '#a03a6a' }); l2.position.set(m.position.x, 3.0, m.position.z); g.add(l2);
      g.userData.level = r.level;
      lockGroup.add(g);
    });
  }

  // ============================================================
  // KHỞI TẠO
  // ============================================================
  R3.init = function () {
    try {
      W = G.world; T = G.T;
      const cv = document.createElement('canvas');
      cv.id = 'game3d';
      const gl = cv.getContext('webgl2', { antialias: true, powerPreference: 'high-performance' }) || cv.getContext('webgl', { antialias: true });
      if (!gl) return false;
      renderer = new THREE.WebGLRenderer({ canvas: cv, context: gl, antialias: true });
    } catch (e) { return false; }
    const over = document.getElementById('game');
    over.parentNode.insertBefore(renderer.domElement, over);
    try { const sv = G.store && G.store.load(); const q = location.search.match(/[?&]style=(real|cute)/); REAL = q ? q[1] === 'real' : !(sv && sv.settings && sv.settings.style3 === 'cute'); /* mặc định: Như thật */ } catch (e) { REAL = false; }
    R3.real = REAL;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = REAL ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    if (REAL) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; }
    renderer.shadowMap.autoUpdate = false;
    R3.quality = 2; // 2 đẹp, 1 vừa, 0 nhẹ — tự giảm khi máy chậm

    scene = new THREE.Scene();
    scene.background = SKY.day.clone();
    scene.fog = new THREE.Fog(scene.background.clone(), 26, 58);
    camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.5, 80);
    hemi = new THREE.HemisphereLight('#ffffff', '#c8e6a8', 1.15); scene.add(hemi);
    sun = new THREE.DirectionalLight('#fff3df', 1.7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(REAL ? 2048 : 1024, REAL ? 2048 : 1024);
    Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 50 });
    sun.shadow.bias = -0.001; sun.shadow.normalBias = 0.03;
    scene.add(sun, sun.target);

    R3.groundMat = lam('#ffffff', { vertexColors: true });
    winMat = new THREE.MeshLambertMaterial({ color: '#bfe6ff', emissive: '#ffd77a', emissiveIntensity: 0 });
    bulbMat = new THREE.MeshLambertMaterial({ color: '#fff6c8', emissive: '#ffe08a', emissiveIntensity: 0.2 });
    poolMat = new THREE.MeshBasicMaterial({ color: '#ffd58a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
      map: canvasTex('pool', 64, 64, (c) => { const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); }) });
    R3.geo = {
      box: new THREE.BoxGeometry(1, 1, 1), flat: new THREE.BoxGeometry(1, 0.01, 1),
      trunk: new THREE.CylinderGeometry(0.08, 0.11, 0.6, 6), foliage: new THREE.IcosahedronGeometry(0.5, 1), cone: new THREE.ConeGeometry(0.48, 0.8, 7),
      bush: new THREE.SphereGeometry(0.4, 9, 7), rock: new THREE.DodecahedronGeometry(0.5, 0), stem: new THREE.CylinderGeometry(0.012, 0.012, 0.16, 3),
      flower: new THREE.IcosahedronGeometry(0.06, 0), post: new THREE.BoxGeometry(0.1, 0.5, 0.1), rail: new THREE.BoxGeometry(1, 0.07, 0.05),
      lamp: new THREE.CylinderGeometry(0.04, 0.06, 1.2, 6), bulb: new THREE.SphereGeometry(0.13, 10, 8), pool: new THREE.CircleGeometry(1, 20),
      pole: new THREE.CylinderGeometry(0.05, 0.05, 1.3, 6), ac: new THREE.BoxGeometry(0.7, 0.45, 0.35), fan: new THREE.CylinderGeometry(0.15, 0.15, 0.02, 12),
      dframe: new THREE.BoxGeometry(0.72, 1.0, 0.06), door: new THREE.BoxGeometry(0.58, 0.9, 0.08), knob: new THREE.SphereGeometry(0.035, 6, 5),
      balloon: new THREE.SphereGeometry(0.15, 10, 8), string: new THREE.CylinderGeometry(0.006, 0.006, 0.9, 3), flag: new THREE.ConeGeometry(0.09, 0.18, 3),
      orb: new THREE.IcosahedronGeometry(0.22, 2), ring: new THREE.TorusGeometry(0.3, 0.025, 5, 22), guide: new THREE.RingGeometry(0.42, 0.56, 28),
    };
    if (REAL) {
      R3.geo.foliage = clumpGeo(14, 0.62, 5);
      R3.geo.cone = new THREE.ConeGeometry(0.5, 0.85, 10, 3);
      R3.geo.trunk = new THREE.CylinderGeometry(0.07, 0.12, 0.62, 8);
      R3.geo.rock = new THREE.DodecahedronGeometry(0.5, 1);
      R3.geo.tuft = tuftGeo();
      R3.gmat = {};
      ['grass', 'sand', 'paving', 'concrete', 'dirt', 'asphalt', 'soil'].forEach((k) => { R3.gmat[k] = surf(k, { m: { vertexColors: true } }); });
      const noFlip = (m) => { m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', THREE.ShaderChunk.normal_fragment_begin.replace('normal *= faceDirection;', '')); }; m.customProgramCacheKey = () => 'noflip'; return m; };
      R3.noFlip = noFlip;
      const leafM = (img) => noFlip(pbr('#ffffff', { map: tex(img, 1, true), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.75 }));
      R3.realMat = { leaf: leafM('leaves.png'), blossom: leafM('blossom.png') };
    }
    R3.mat = {
      white: toon('#ffffff'), leaf: toon('#ffffff', { flatShading: true }), line: lam('#fff4b0'), zebra: lam('#ffffff'), curb: lam('#f4f2fa'),
      plank: toon('#ffffff'), brail: toon('#bd6c4a'), stem: lam('#5fae5a'), lamp: toon('#ffb3d1'),
    };
    if (REAL) Object.assign(R3.mat, {
      leaf: R3.realMat.leaf, blossom: R3.realMat.blossom, pine: surf('bark', { m: { map: tex('pineleaf.png', 2, true), normalMap: null, color: '#ffffff', roughness: 0.85 } }),
      bark: surf('bark'), wood: surf('wood'), rock: surf('concrete', { m: { color: '#b8b4ae' } }), curb: surf('concrete'),
      line: pbr('#f2e7a0', { roughness: 0.6 }), zebra: pbr('#f4f4f4', { roughness: 0.6 }), brail: surf('wood'),
      lamp: pbr('#4a4f57', { roughness: 0.35, metalness: 0.8 }), stem: pbr('#3f6b2a'),
      tuft: R3.noFlip(pbr('#e6f0d0', { map: tex('grasstuft.png', 1, true), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 })),
    });

    // nước + đáy
    const big = 140;
    waterMat = REAL
      ? new THREE.MeshStandardMaterial({ color: '#1f5d72', roughness: 0.06, metalness: 0.15, transparent: true, opacity: 0.88, normalMap: tex('water_n.jpg', 24), normalScale: new THREE.Vector2(0.6, 0.6) })
      : new THREE.MeshLambertMaterial({ color: '#7ccfee', transparent: true, opacity: 0.86 });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(W.w + big, W.h + big), waterMat);
    water.rotation.x = -Math.PI / 2; water.position.set(W.w / 2, -0.14, W.h / 2); water.receiveShadow = true;
    scene.add(water);
    const bed = new THREE.Mesh(new THREE.PlaneGeometry(W.w + big, W.h + big), REAL ? surf('sand', { rep: 60, m: { color: '#6d8c86' } }) : lam('#6fb3d6'));
    bed.rotation.x = -Math.PI / 2; bed.position.set(W.w / 2, -0.55, W.h / 2);
    scene.add(bed);

    if (REAL) {
      winMat = new THREE.MeshStandardMaterial({ color: '#5d7f99', roughness: 0.05, metalness: 0.9, emissive: '#ffd77a', emissiveIntensity: 0 });
      R3.pmrem = new THREE.PMREMGenerator(renderer);
      R3.skyScene = new THREE.Scene();
      R3.skyMat = new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false,
        uniforms: { top: { value: new THREE.Color('#5d9be0') }, hor: { value: new THREE.Color('#dce9f2') }, gnd: { value: new THREE.Color('#6d7a5c') }, sunDir: { value: new THREE.Vector3(-0.4, 0.8, 0.35).normalize() }, sunCol: { value: new THREE.Color('#fff2d6') } },
        vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: 'uniform vec3 top; uniform vec3 hor; uniform vec3 gnd; uniform vec3 sunDir; uniform vec3 sunCol; varying vec3 vD; void main(){ float y = vD.y; vec3 c = y > 0.0 ? mix(hor, top, pow(y, 0.6)) : mix(hor, gnd, pow(-y, 0.4)); float s = max(dot(normalize(vD), sunDir), 0.0); c += sunCol * (pow(s, 600.0) * 8.0 + pow(s, 12.0) * 0.35); gl_FragColor = vec4(c, 1.0); }',
      });
      R3.skyScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), R3.skyMat));
      R3.envKey = '';
    }
    if (REAL && G.people) G.people.load(() => {
      // tải xong → dựng lại nhân vật bằng người thật
      R3.ents.forEach((e) => scene.remove(e.obj.g)); R3.ents.clear();
      if (G.mall) G.mall.imgCache = {};
    });
    if (REAL && G.people) G.people.onChange = () => { // tải xong 1 bộ hoá trang → dựng lại nhân vật, ảnh tủ đồ
      R3.ents.forEach((e) => scene.remove(e.obj.g)); R3.ents.clear();
      if (G.mall) { G.mall.imgCache = {}; const pv = document.querySelector('#panel .bigprev'); if (pv && G.ui.isOpen()) { G.mall.keepW = true; G.mall.wardrobe(!document.querySelector('#panel [data-mt]')); } }
    };
    const BASE = BASE_OF();
    W.regions.forEach((r) => { buildGround(r, BASE); buildRegionProps(r); });
    buildBuildings();
    buildFarm();
    buildLocks();

    // vòng chỉ đường
    R3.guide = new THREE.Group();
    const gr = new THREE.Mesh(R3.geo.guide, new THREE.MeshBasicMaterial({ color: '#ff6f9f', transparent: true, opacity: 0.9, depthWrite: false }));
    gr.rotation.x = -Math.PI / 2; gr.position.y = 0.04; R3.guide.add(gr);
    const heart = sprite(emojiTex('💗'), 0.55); heart.position.y = 1.1; R3.guide.add(heart);
    R3.guide.userData = { gr, heart };
    scene.add(R3.guide);
    // ô ruộng đang chọn
    R3.farmSel = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.48, 4, 1), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9, depthWrite: false }));
    R3.farmSel.rotation.x = -Math.PI / 2; R3.farmSel.rotation.z = Math.PI / 4; R3.farmSel.scale.setScalar(1.35); R3.farmSel.visible = false; scene.add(R3.farmSel);

    R3.ents = new Map();   // nhân vật / thú động: khoá → {obj, seen}
    R3.items = new Map();  // vật phẩm trên đất
    R3.ok = true;
    R3.frame = 0; R3.slow = 0; R3.fast = 0; R3.shadowAt = null;
    R3.resize();
    return true;
  };

  // ảnh chân dung 3D (dùng cho tủ đồ / cửa hàng quần áo): dirs 0 trước, 1 trái, 2 phải, 3 sau
  R3.portrait = function (look, dirs, size) {
    const n = dirs.length, w = Math.round(size * 0.8), h = size, sc = 2;
    const rt = new THREE.WebGLRenderTarget(w * n * sc, h * sc, { samples: 4 });
    const sc2 = new THREE.Scene();
    if (REAL) sc2.environment = scene.environment;
    sc2.add(new THREE.HemisphereLight('#ffffff', '#e8d6e8', 1.25));
    const dl = new THREE.DirectionalLight('#ffffff', 1.4); dl.position.set(2, 4, 5); sc2.add(dl);
    dirs.forEach((d, i) => {
      const c = person(look); c.anim(0.016, false);
      c.g.position.set((i - (n - 1) / 2) * 1.2, 0, 0);
      c.g.rotation.y = [0, -Math.PI / 2, Math.PI / 2, Math.PI][d] || 0;
      c.g.children[c.g.children.length - 1].visible = false;
      sc2.add(c.g);
    });
    const cam = new THREE.OrthographicCamera(-n * 0.6, n * 0.6, 1.5, 0, 0.1, 20);
    cam.position.set(0, 0.85, 6); cam.lookAt(0, 0.75, 0); cam.top = 0.78; cam.bottom = -0.72; cam.updateProjectionMatrix();
    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(sc2, cam);
    const px = new Uint8Array(w * n * sc * h * sc * 4);
    renderer.readRenderTargetPixels(rt, 0, 0, w * n * sc, h * sc, px);
    renderer.setRenderTarget(prev); renderer.setClearColor(0x000000, 1);
    rt.dispose();
    const cv = document.createElement('canvas'); cv.width = w * n * sc; cv.height = h * sc;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(cv.width, cv.height), row = cv.width * 4;
    const lut = new Uint8Array(256); // ảnh render ra là màu tuyến tính → đổi sang sRGB cho đúng màu
    for (let i = 0; i < 256; i++) { const v = i / 255; lut[i] = Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)); }
    for (let i = 0; i < px.length; i += 4) { px[i] = lut[px[i]]; px[i + 1] = lut[px[i + 1]]; px[i + 2] = lut[px[i + 2]]; }
    for (let y = 0; y < cv.height; y++) img.data.set(px.subarray((cv.height - 1 - y) * row, (cv.height - y) * row), y * row);
    ctx.putImageData(img, 0, 0);
    return cv.toDataURL();
  };
  R3.emote = function (id, dur) { R3.emo = { id, t: 0, dur: dur || 2.5 }; };
  R3.setQuality = function (q) {
    R3.quality = q;
    const dpr = window.devicePixelRatio || 1;
    renderer.setPixelRatio(q >= 2 ? Math.min(dpr, 1.75) : q === 1 ? Math.min(dpr, 1.3) : 1);
    const sh = q >= 1;
    if (renderer.shadowMap.enabled !== sh) {
      renderer.shadowMap.enabled = sh;
      scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { m.needsUpdate = true; }); });
    }
    renderer.shadowMap.needsUpdate = true;
    R3.resize();
  };
  R3.resize = function () {
    if (!renderer) return;
    const st = G.state && G.state.settings;
    if (st && st.q3 !== undefined && R3.quality !== st.q3 && !R3._inQ) { R3._inQ = true; R3.setQuality(st.q3); R3._inQ = false; }
    else if (!R3._qInit) { R3._qInit = true; R3.setQuality(R3.quality); return; }
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  };

  // ---------- đồng bộ đối tượng động ----------
  function ent(key, make) {
    let e = R3.ents.get(key);
    if (!e) { e = make(); e.seen = 0; scene.add(e.obj.g); R3.ents.set(key, e); }
    e.seen = R3.frame;
    return e;
  }
  function placeWalker(e, x, y, dt, faceDir, emo) {
    const g = e.obj.g;
    const nx = x / S, nz = y / S;
    const dx = nx - g.position.x, dz = nz - g.position.z, d = Math.hypot(dx, dz);
    const moving = d > 0.004 && d < 3;
    if (d > 0.004) e.ang = Math.atan2(dx, dz);
    else if (faceDir !== undefined && !moving) e.ang = [0, -Math.PI / 2, Math.PI / 2, Math.PI][faceDir] ?? e.ang;
    g.position.set(nx, 0, nz);
    if (e.ang !== undefined) { let dr = e.ang - g.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); g.rotation.y += dr * Math.min(1, dt * 12); }
    e.mvT = moving ? 0.12 : Math.max(0, (e.mvT || 0) - dt);
    if (dt > 0 && d < 3) e.spd = (e.spd || 0) * 0.8 + (d / dt) * 0.2;
    e.obj.anim(dt, e.mvT > 0 && !(emo && emo.pet), emo && !emo.pet ? emo : undefined, e.spd);
  }
  const lookKey = (l) => JSON.stringify(l);
  // người thật (chế độ Như thật, khi đã tải xong) hoặc chibi
  const person = (look) => (REAL && G.people && G.people.ready ? G.people.make(look) : chibi(look));

  function syncWorld(game, dt) {
    const s = game.state, p = game.player;
    R3.frame++;
    // người chơi
    const look = G.playerLook(); const lk = lookKey(look);
    let me = R3.ents.get('me');
    if (me && me.lk !== lk) { scene.remove(me.obj.g); R3.ents.delete('me'); me = null; }
    me = ent('me', () => ({ obj: person(look), lk }));
    if (me.ang === undefined) me.obj.g.position.set(p.x / S, 0, p.y / S);
    const emo = R3.emo;
    if (emo) { emo.t += dt; if (emo.t > emo.dur || p.moving) R3.emo = null; }
    placeWalker(me, p.x, p.y, dt, p.dir, R3.emo);
    if (R3.emo && (R3.emo.id === 'heart' || R3.emo.id === 'dance') && (R3.emo.hz = (R3.emo.hz || 0) - dt) <= 0) { R3.emo.hz = 0.45; game.hearts(p.x, p.y - 44, 2); }
    if (R3.emo && R3.emo.id === 'sleep' && (R3.emo.hz = (R3.emo.hz || 0) - dt) <= 0) { R3.emo.hz = 1.1; game.float('💤', p.x + 12, p.y - 50, '#ffffff'); }
    // thú cưng
    const pk = s.profile.pet;
    if (pk && G.PETS[pk]) {
      const pt = G.petFollow(game, p.x, p.y, p.dir, dt);
      const e = ent('pet:' + pk, () => ({ obj: pet3d(pk) }));
      placeWalker(e, pt.x, pt.y, dt, pt.dir);
      if (R3.emo) { e.obj.anim(dt, true); e.obj.g.rotation.y = Math.atan2(p.x / S - e.obj.g.position.x, p.y / S - e.obj.g.position.z); }
    }
    // NPC (chỉ những ai ở gần)
    game.npcs.forEach((n, i) => {
      if (Math.abs(n.x - p.x) > (REAL ? 18 : 30) * S || Math.abs(n.y - p.y) > (REAL ? 15 : 24) * S) return;
      const e = ent('npc:' + i + ':' + (n.name || ''), () => ({ obj: person(n.look) }));
      // người chơi nhảy ở gần → NPC nhảy theo
      const near = R3.emo && (R3.emo.id === 'dance' || R3.emo.id === 'cheer' || R3.emo.id === 'clap') && Math.hypot(n.x - p.x, n.y - p.y) < 4 * S;
      placeWalker(e, n.x, n.y, dt, n.dir, near ? { id: R3.emo.id, t: R3.emo.t + i * 0.13, dur: R3.emo.dur } : undefined);
    });
    // người chơi online
    if (G.online && G.online.peers) Object.entries(G.online.peers).forEach(([id, pr]) => {
      if (!pr.online && !G.online.isOn()) return;
      if (Math.abs(pr.x - p.x) > 30 * S || Math.abs(pr.y - p.y) > 24 * S) return;
      const e = ent('peer:' + id + lookKey(pr.look || {}), () => ({ obj: person(G.playerLook(pr.look || {})) }));
      placeWalker(e, pr.x, pr.y, dt, pr.dir || 0);
      const ppk = pr.look && pr.look.pet;
      if (ppk && G.PETS[ppk]) { const pt = G.petFollow(pr, pr.x, pr.y, pr.dir || 0, dt); placeWalker(ent('ppet:' + id + ppk, () => ({ obj: pet3d(ppk) })), pt.x, pt.y, dt, pt.dir); }
    });
    // vật nuôi trong trại — cho G.ranch tự tính chỗ đứng rồi đọc lại
    if (G.ranch && G.feat.has('ranch') && W.pens[0]) {
      const big = { x: -1e6, y: -1e6, w: 1e7, h: 1e7 };
      try { G.ranch.draw(null, big, [], game.t, dt); } catch (e) { /* bỏ qua */ }
      const st = G.ranch.st();
      (st.animals || []).forEach((a) => {
        const m = G.ranch.mob[a.uid]; if (!m) return;
        const e = ent('ani:' + a.uid, () => ({ obj: animal3d(a.kind) }));
        placeWalker(e, m.x, m.y, dt);
      });
    }
    // xoá những gì không còn thấy
    R3.ents.forEach((e, k) => { if (e.seen !== R3.frame) { scene.remove(e.obj.g); R3.ents.delete(k); } });

    // vật phẩm (quả cầu chữ, linh kiện)
    const alive = new Set();
    game.items.forEach((it) => {
      if (Math.abs(it.x - p.x) > 28 * S || Math.abs(it.y - p.y) > 22 * S) return;
      alive.add(it);
      let o = R3.items.get(it);
      const owned = it.kind === 'word' && !!s.words[it.w.en];
      if (!o || o.owned !== owned) {
        if (o) scene.remove(o.g);
        o = { g: new THREE.Group(), owned };
        if (it.kind === 'word') {
          const c = owned ? '#8fe0b0' : '#ff9ec4';
          const m = new THREE.Mesh(R3.geo.orb, new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.45, transparent: true, opacity: 0.9 }));
          o.g.add(m); o.spin = m;
          const ring = new THREE.Mesh(R3.geo.ring, basic('#ffffff')); ring.rotation.x = Math.PI / 2; o.g.add(ring); o.ring = ring;
          const lt = sprite(pill(it.w.en[0].toUpperCase(), { fg: owned ? '#2f7a52' : '#b8326a', border: owned ? '#8fe0b0' : '#ffb3d1' }), 0.34); lt.position.y = 0.48; o.g.add(lt);
        } else {
          const part = G.partById[it.id];
          const rar = part ? part.rarity : 1;
          const tex = vecTex('part|' + it.id, 32, 32, (ctx) => G.drawPart(ctx, part, 16, 16, 24));
          const sp = sprite(tex, 0.7); o.g.add(sp); o.spin = null;
          const gc = ['#ffffff', '#ffffff', '#78c8ff', '#c878ff', '#ffc83c'][rar] || '#fff';
          const halo = new THREE.Mesh(R3.geo.ring, basic(gc, { transparent: true, opacity: 0.8 })); halo.rotation.x = Math.PI / 2; halo.position.y = -0.3; o.g.add(halo); o.ring = halo;
        }
        o.g.add(blob(0.2)); o.g.children[o.g.children.length - 1].position.y = -0.58;
        scene.add(o.g); R3.items.set(it, o);
      }
      const bob = Math.sin(game.t * 3 + it.ph) * 0.09;
      o.g.position.set(it.x / S, 0.6 + bob, (it.y + 4) / S);
      o.g.children[o.g.children.length - 1].position.y = -0.58 - bob;
      if (o.spin) o.spin.rotation.y += dt * 1.2;
      if (o.ring) o.ring.rotation.z += dt;
    });
    R3.items.forEach((o, it) => { if (!alive.has(it)) { scene.remove(o.g); R3.items.delete(it); } });

    // ruộng
    if (R3.frame % 10 === 1) syncFarm(game);
    const ft = game.target && game.target.kind === 'farm' ? game.target.ft : null;
    R3.farmSel.visible = !!ft;
    if (ft) { R3.farmSel.position.set(ft.tx + 0.5, 0.08, ft.ty + 0.5); R3.farmSel.material.opacity = 0.6 + Math.sin(game.t * 6) * 0.3; }
    cropSprites.forEach((c) => { if (c.tag.visible) c.tag.position.y = c.tagY + Math.sin(game.t * 4 + c.f.x) * 0.05; });

    // vòng chỉ đường
    const gt = game.guideTarget();
    R3.gt = gt;
    R3.guide.visible = !!gt;
    if (gt) {
      R3.guide.position.set(gt.x + 0.5, 0, gt.y + 0.5);
      const k = 1 + Math.sin(game.t * 5) * 0.12; R3.guide.userData.gr.scale.set(k, k, k);
      R3.guide.userData.heart.position.y = 1.1 + Math.sin(game.t * 4) * 0.1;
    }

    // khu vực bị khoá + trang trí sự kiện (mỗi giây)
    if (R3.frame % 30 === 2) {
      lockGroup.children.forEach((g) => { g.visible = g.userData.level > game.level; });
      const on = G.events && G.events.on();
      evDeco.forEach((d) => {
        const o = on ? G.events.activeFor(d.b.t) : null;
        d.ev.visible = !!o;
        if (o && d.icon !== o.ev.icon) {
          if (d.lbl) d.g.remove(d.lbl);
          d.icon = o.ev.icon;
          d.lbl = label(o.ev.icon + ' EVENT', 0.36, { bg: '#ff6f9f', fg: '#ffffff', border: '#ffffff' });
          d.lbl.position.set(d.dxl, 1.6, d.front + 0.3); d.g.add(d.lbl);
        }
        if (d.lbl) d.lbl.visible = !!o;
      });
    }
  }

  function syncFarm(game) {
    const s = game.state, now = G.clock.now();
    cropSprites.forEach((c, i) => {
      const f = c.f, pl = s.farm[f.x + ',' + f.y];
      let soil = '#b98262', key = '', tagKey = '';
      if (pl) {
        const info = game.plotInfo(pl, now);
        if (info.wet) soil = '#8f5f45';
        key = info.c.id + '|' + info.stage;
        if (c.key !== key) {
          c.sp.material.map = vecTex('crop|' + key, 40, 48, (ctx) => { ctx.translate(20, 44); ctx.scale(1.3, 1.3); G.drawPlantInner(ctx, info.c, info.stage, 0, -9, 0); });
          c.sp.material.needsUpdate = true;
          const tx = c.sp.material.map;
          c.sp.scale.set(0.95 * tx.userData.w / tx.userData.h, 0.95, 1);
        }
        tagKey = info.ready ? '✨' : !info.wet ? '💧' : '';
      }
      c.sp.visible = !!pl;
      c.key = key;
      if (c.tagKey !== tagKey) {
        c.tagKey = tagKey;
        c.tag.visible = !!tagKey;
        if (tagKey) { c.tag.material.map = emojiTex(tagKey, 64); c.tag.material.needsUpdate = true; c.tag.scale.set(0.32, 0.32, 1); c.tagY = 1.05; c.tag.position.set(f.x + 0.75, c.tagY, f.y + 0.4); }
      }
      if (soilMesh && c.soil !== soil) { c.soil = soil; soilMesh.setColorAt(i, col.set(soil)); soilMesh.instanceColor.needsUpdate = true; }
    });
  }

  // ---------- ánh sáng theo giờ thật & thời tiết ----------
  function applyLight(game) {
    const n = game.nightRaw() / 0.75 * Math.min(1, (game.state.settings.night ?? 0.8) / 0.8 + 0.2); // 0 ngày → 1 đêm
    const h = G.clock.minutes() / 60;
    const eve = Math.max(0, 1 - Math.abs(h - 18) / 1.5) * (1 - n * 0.6) + Math.max(0, 1 - Math.abs(h - 6) / 1.2) * 0.5 * (1 - n);
    const wet = game.weather === 'rain' ? 1 : game.weather === 'cloudy' ? 0.45 : 0;
    const sky = scene.background;
    sky.copy(SKY.day).lerp(SKY.eve, Math.min(1, eve)).lerp(SKY.rain, wet * 0.6 * (1 - n)).lerp(SKY.night, n);
    scene.fog.color.copy(sky);
    hemi.intensity = 1.15 - n * 0.72 - wet * 0.2;
    hemi.color.setRGB(1 - n * 0.35, 1 - n * 0.3, 1);
    sun.intensity = (1.7 - wet * 0.8) * (1 - n * 0.85);
    sun.color.setRGB(1, 0.95 - eve * 0.2 - n * 0.1, 0.87 - eve * 0.3 + n * 0.1);
    winMat.emissiveIntensity = Math.max(0, n * 1.1 - 0.1) + eve * 0.2;
    bulbMat.emissiveIntensity = 0.15 + n * 1.5;
    poolMat.opacity = n * 0.45;
    if (REAL) {
      hemi.intensity = (0.55 - n * 0.4) * (1 - wet * 0.3);
      sun.intensity = (3.2 - wet * 1.6) * (1 - n * 0.9);
      renderer.toneMappingExposure = 1.0 - n * 0.25;
      waterMat.color.setHSL(0.53, 0.55, 0.26 - n * 0.14);
      if (waterMat.normalMap) { waterMat.normalMap.offset.x = game.t * 0.006; waterMat.normalMap.offset.y = game.t * 0.004; }
      // bản đồ ánh sáng môi trường (bầu trời) — tạo lại khi trời đổi màu rõ
      const key = [Math.round(n * 10), Math.round(eve * 10), Math.round(wet * 4)].join(',');
      if (key !== R3.envKey && (!R3.envAt || game.t - R3.envAt > 1.5)) {
        R3.envKey = key; R3.envAt = game.t;
        const u = R3.skyMat.uniforms;
        u.top.value.set('#4f8fd8').lerp(new THREE.Color('#e08a6a'), eve * 0.5).lerp(new THREE.Color('#8a96a8'), wet * 0.7).lerp(new THREE.Color('#0d1330'), n);
        u.hor.value.set('#dfeaf2').lerp(new THREE.Color('#ffb07a'), eve).lerp(new THREE.Color('#b8c0c8'), wet * 0.7).lerp(new THREE.Color('#29305a'), n);
        u.gnd.value.set('#66745a').lerp(new THREE.Color('#1a1d24'), n);
        u.sunCol.value.set('#fff2d6').lerp(new THREE.Color('#ff9a5a'), eve).multiplyScalar(1 - n * 0.95 - wet * 0.6);
        const old = scene.environment;
        scene.environment = R3.pmrem.fromScene(R3.skyScene, 0.02).texture;
        if (old) old.dispose();
      }
      return;
    }
    waterMat.color.setHSL(0.54, 0.7, 0.7 - n * 0.28 + Math.sin(game.t * 1.2) * 0.012);
  }

  // ---------- camera + chiếu toạ độ ra màn hình ----------
  function updateCamera(game, dt) {
    const p = game.player;
    const zoom = [0.78, 1, 1.28][game.state.settings.z3 ?? 1] || 1;
    const k = camera.aspect < 1 ? Math.pow(1 / camera.aspect, 0.5) : 1;
    const px = p.x / S, pz = p.y / S;
    const tx = px, ty = 10 * zoom * k, tz = pz + 8.6 * zoom * k;
    if (!R3.camInit || Math.abs(camera.position.x - tx) > 12 || Math.abs(camera.position.z - tz) > 12) { camera.position.set(tx, ty, tz); R3.camInit = true; R3.look = new THREE.Vector3(px, 0.5, pz); }
    const a = Math.min(1, dt * 7);
    camera.position.x += (tx - camera.position.x) * a; camera.position.y += (ty - camera.position.y) * a; camera.position.z += (tz - camera.position.z) * a;
    R3.look.x += (px - R3.look.x) * a; R3.look.z += (pz - R3.look.z) * a;
    camera.lookAt(R3.look.x, 0.5, R3.look.z);
    // bóng đổ tĩnh: chỉ vẽ lại khi đi xa khỏi tâm cũ
    const c = R3.shadowAt;
    if (!c || Math.abs(c.x - px) > 6 || Math.abs(c.z - pz) > 6) {
      const sx = Math.round(px), sz = Math.round(pz);
      R3.shadowAt = { x: sx, z: sz };
      sun.position.set(sx - 8, 18, sz + 7); sun.target.position.set(sx, 0, sz); sun.target.updateMatrixWorld();
      renderer.shadowMap.needsUpdate = true;
    }
  }
  // toạ độ game (px, py, độ cao theo ô) → điểm ảnh thật trên canvas phủ
  function proj(x, y, h) {
    V.set(x / S, h || 0, y / S).project(camera);
    const cv = R3.cv || (R3.cv = document.getElementById('game'));
    return { x: (V.x + 1) / 2 * cv.width, y: (1 - V.y) / 2 * cv.height, z: V.z };
  }
  R3.proj = proj;

  // ---------- lớp phủ 2D ----------
  function overlay(game) {
    const cv = document.getElementById('game'), ctx = cv.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    const p = game.player;
    // tỉ lệ: bao nhiêu điểm ảnh màn hình cho 1 px game (đo ở chỗ người chơi)
    const a = proj(p.x, p.y, 0), b = proj(p.x, p.y, 1);
    const k = Math.abs(a.y - b.y) / S;
    const at = (x, y, h, fn) => { const q = proj(x, y, h); if (q.z > 1) return; ctx.setTransform(k, 0, 0, k, q.x - x * k, q.y - y * k); fn(); };
    // khung chiếu mặt đất gần đúng quanh người chơi (cho hạt hiệu ứng, bướm)
    const ex = proj(p.x + S, p.y, 0), ey = proj(p.x, p.y + S, 0);
    const m = [(ex.x - a.x) / S, (ex.y - a.y) / S, (ey.x - a.x) / S, (ey.y - a.y) / S];
    const ground = () => ctx.setTransform(m[0], m[1], m[2], m[3], a.x - m[0] * p.x - m[2] * p.y, a.y - m[1] * p.x - m[3] * p.y);
    ground();
    game.flies.forEach((bf) => {
      const f = Math.abs(Math.sin(bf.ph * 14)) * 4 + 1;
      ctx.fillStyle = bf.c;
      ctx.beginPath(); ctx.ellipse(bf.x - f / 2, bf.y - 30, f, 3, 0, 0, Math.PI * 2); ctx.ellipse(bf.x + f / 2, bf.y - 30, f, 3, 0, 0, Math.PI * 2); ctx.fill();
    });
    game.fx.forEach((f) => {
      ctx.globalAlpha = Math.max(0, f.life / f.max);
      ctx.fillStyle = f.c;
      if (f.heart) G.heart(ctx, f.x, f.y, f.r, f.c);
      else if (f.star) { ctx.fillRect(f.x - f.r, f.y - 0.6, f.r * 2, 1.2); ctx.fillRect(f.x - 0.6, f.y - f.r, 1.2, f.r * 2); }
      else { ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill(); }
    });
    ctx.globalAlpha = 1;
    // bóng chat / bảng tên người chơi online
    if (G.online && G.online.peers) Object.values(G.online.peers).forEach((pr) => {
      if ((!pr.online && !G.online.isOn()) || Math.abs(pr.x - p.x) > 20 * S || Math.abs(pr.y - p.y) > 16 * S) return;
      at(pr.x, pr.y, 0, () => {
        G.online.drawTag(ctx, pr.x, pr.y, (pr.online ? '💞 ' : '💤 ') + pr.name, pr.online ? '#ff6f9f' : '#b9a7b5');
        if (pr.bubble && pr.bubble.until > Date.now()) G.online.drawBubble(ctx, pr.x, pr.y - 62, pr.bubble);
      });
    });
    if (G.online && G.online.isOn()) at(p.x, p.y, 0, () => G.online.drawTag(ctx, p.x, p.y, '⭐ ' + game.state.profile.name, '#8e6cd9'));
    if (game.playerBubble && game.playerBubble.until > Date.now()) at(p.x, p.y, 0, () => G.online.drawBubble(ctx, p.x, p.y - 62, game.playerBubble));
    // tên NPC đang đứng gần
    if (game.target && game.target.kind === 'npc') {
      const n = game.target.n;
      at(n.x, n.y, 0, () => {
        ctx.font = '800 10px "Nunito", system-ui, sans-serif'; ctx.textAlign = 'center';
        const tw = ctx.measureText(n.name).width + 12;
        ctx.fillStyle = 'rgba(255,250,252,.95)'; G.rr(ctx, n.x - tw / 2, n.y - 62, tw, 14, 7); ctx.fill();
        ctx.strokeStyle = '#ffb3d1'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.fillStyle = '#6b3d5a'; ctx.fillText(n.name, n.x, n.y - 51.5);
        ctx.font = '14px system-ui'; ctx.fillText('💬', n.x + tw / 2 + 6, n.y - 50 + Math.sin(game.t * 6) * 2);
      });
    }
    // bong bóng trạng thái vật nuôi (đói / có sản phẩm)
    if (G.ranch && G.feat.has('ranch')) {
      (G.ranch.st().animals || []).forEach((an) => {
        const mb = G.ranch.mob[an.uid]; if (!mb || !(an.ready || G.ranch.hungry(an))) return;
        if (Math.abs(mb.x - p.x) > 16 * S || Math.abs(mb.y - p.y) > 12 * S) return;
        const d = G.ranch.def(an.kind), it = G.items[d.product];
        const hh = an.kind === 'cow' ? 1.25 : an.kind === 'pig' || an.kind === 'sheep' ? 0.95 : 0.8;
        at(mb.x, mb.y, hh, () => {
          const by = mb.y - 8 + Math.sin(game.t * 4 + an.uid) * 1.5;
          ctx.fillStyle = 'rgba(255,250,252,.95)'; G.rr(ctx, mb.x - 9, by - 9, 18, 16, 8); ctx.fill();
          ctx.strokeStyle = an.ready ? '#8fd6a7' : '#ffb3d1'; ctx.lineWidth = 1.2; ctx.stroke();
          ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = '#000'; ctx.fillText(an.ready ? it.emoji : '🌾', mb.x, by - 1); ctx.textBaseline = 'alphabetic';
        });
      });
    }
    // chữ bay (+XP, +xu, …): neo ở chỗ xuất hiện, bay lên theo màn hình
    ctx.textAlign = 'center';
    game.floaters.forEach((f) => {
      const q = proj(f.x, f.y + f.t * 30 + 30, 1.4);
      ctx.setTransform(k, 0, 0, k, q.x - f.x * k, q.y - f.y * k - f.t * 30 * k);
      ctx.globalAlpha = Math.max(0, 1 - f.t / 1.6);
      ctx.font = '900 ' + (f.big ? 14 : 13) + 'px "Nunito", system-ui, sans-serif';
      ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(120,50,100,.75)'; ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (game.weather === 'rain') game.drawRain(ctx, cv); else if (!REAL) game.drawPetals(ctx, cv);
    if (R3.gt) guideArrow(game, ctx, R3.gt);
  }

  function guideArrow(game, ctx, gt) {
    const p = game.player, dpr = game.dpr;
    const tx = (gt.x + 0.5) * S, ty = (gt.y + 0.5) * S;
    const q = proj(tx, ty, 0.5);
    const Wd = game.vw * dpr, Hd = game.vh * dpr;
    const m = 70 * dpr, mt = Math.min(150, game.vh * 0.22) * dpr, mb = Math.min(130, game.vh * 0.2) * dpr;
    let sx = q.x, sy = q.y;
    if (q.z > 1) { sx = Wd - sx; sy = Hd * 2; } // phía sau camera
    if (sx > m && sx < Wd - m && sy > mt && sy < Hd - mb) return;
    const cx = Wd / 2, cy = (mt + Hd - mb) / 2;
    const ang = Math.atan2(sy - cy, sx - cx);
    const kx = (Wd / 2 - m) / Math.abs(Math.cos(ang) || 1e-6), ky = ((Hd - mt - mb) / 2) / Math.abs(Math.sin(ang) || 1e-6);
    const d = Math.min(kx, ky);
    const ax = cx + Math.cos(ang) * d, ay = cy + Math.sin(ang) * d;
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(ang);
    const s = dpr;
    ctx.fillStyle = 'rgba(255,111,159,.95)'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.moveTo(18 * s, 0); ctx.lineTo(-10 * s, -13 * s); ctx.lineTo(-4 * s, 0); ctx.lineTo(-10 * s, 13 * s); ctx.closePath();
    ctx.fill(); ctx.stroke(); ctx.restore();
    const dist = Math.round(Math.hypot(tx - p.x, ty - p.y) / S);
    ctx.font = `800 ${11 * s}px "Nunito", system-ui, sans-serif`; ctx.textAlign = 'center';
    const lx = ax - Math.cos(ang) * 34 * s, ly = ay - Math.sin(ang) * 34 * s;
    const lbl = gt.label + ' · ' + dist + 'm';
    const tw = ctx.measureText(lbl).width + 10 * s;
    ctx.fillStyle = 'rgba(255,250,252,.95)'; G.rr(ctx, lx - tw / 2, ly - 9 * s, tw, 17 * s, 8.5 * s); ctx.fill();
    ctx.strokeStyle = '#ffb3d1'; ctx.lineWidth = 1.5 * s; ctx.stroke();
    ctx.fillStyle = '#c2255c'; ctx.fillText(lbl, lx, ly + 4 * s);
  }

  // nhà nằm giữa camera và người chơi → làm mờ để luôn thấy nhân vật
  function fadeBuildings(game, dt) {
    const px = game.player.x / S, pz = game.player.y / S;
    fadeList.forEach((f) => {
      const b = f.b;
      const hide = px > b.x - 0.8 && px < b.x + b.w + 0.8 && b.y + b.h > pz - 0.3 && b.y < pz + 6;
      const want = hide ? 0.28 : 1;
      if (Math.abs(f.op - want) < 0.01) return;
      f.op += (want - f.op) * Math.min(1, dt * 8);
      if (Math.abs(f.op - want) < 0.01) f.op = want;
      f.mats.forEach((m) => { const tr = f.op < 0.99; if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; } m.opacity = f.op * (m.userData.baseOp ?? (m.userData.baseOp = 1)); m.depthWrite = !tr; });
    });
  }

  // ---------- tự giảm chất lượng khi máy chậm ----------
  function perf(dt) {
    const st = G.state && G.state.settings;
    if (st && st.q3 !== undefined) return; // người chơi đã tự chọn
    if (dt > 0.028) R3.slow += dt; else R3.slow = Math.max(0, R3.slow - dt * 0.5);
    if (R3.slow > 2.5 && R3.quality > 0) { R3.slow = 0; R3.setQuality(R3.quality - 1); }
    else if (REAL && R3.quality === 0 && R3.slow > 5 && !R3.hinted) { R3.hinted = true; G.ui.toast('🐢 Máy hơi yếu với đồ hoạ Như thật — vào ⚙️ Cài đặt → Phong cách 3D → 🌸 Hoạt hình để chơi mượt hơn.'); }
  }

  // ============================================================
  // VẼ MỖI KHUNG HÌNH (gọi thay cho G.game.render 2D)
  // ============================================================
  R3.render = function (game) {
    const dt = game.dt || 0.016;
    const busy = G.ui && G.ui.isOpen();
    // khi đang mở bảng (từ điển, hội thoại…) thì vẽ thưa lại cho đỡ nóng máy
    R3.skip = (R3.skip || 0) + 1;
    if (busy && R3.skip % 4) return;
    if (!busy) perf(dt);
    syncWorld(game, busy ? dt * 4 : dt);
    applyLight(game);
    updateCamera(game, dt);
    fadeBuildings(game, dt);
    renderer.render(scene, camera);
    overlay(game);
    game.drawMini();
  };
})();
