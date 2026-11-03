// ============================================================
// NGƯỜI THẬT CÓ KHUNG XƯƠNG (chế độ “Như thật”)
// Người mẫu + tóc: Quaternius “Universal Base Characters”; động tác: “Universal Animation Library” (CC0).
// Quần áo được “vẽ” lên cơ thể bằng shader theo vùng (thân, tay, chân, bàn chân) dựa vào vị trí xương,
// nên đổi áo / quần / giày trong Tủ đồ là nhân vật đổi theo ngay. Mũ, kính, ba lô gắn theo xương đầu / lưng.
// ============================================================
(function () {
  'use strict';
  if (!window.THREE || !THREE.GLTFLoader) return;
  const P = G.people = { ready: false, loading: false };
  const DIR = 'assets/people/';
  const TARGET_H = 1.5; // chiều cao trong game (1 ô = 1 đơn vị)
  const tpl = {}, hairT = {}, clips = {};
  const V = new THREE.Vector3(), Q = new THREE.Quaternion(), M4 = new THREE.Matrix4();

  P.load = function (onReady) {
    if (P.ready || P.loading) return;
    P.loading = true;
    const L = new THREE.GLTFLoader();
    const one = (f) => L.loadAsync(DIR + f);
    const hairs = ['hair_long', 'hair_buns', 'hair_simpleparted', 'hair_buzzed', 'hair_beard'];
    Promise.all([one('female.gltf'), one('male.gltf'), ...hairs.map((h) => one(h + '.gltf')), fetch(DIR + 'anims.json').then((r) => r.json())])
      .then((res) => {
        prep('f', res[0]); prep('m', res[1]);
        hairs.forEach((h, i) => { hairT[h] = res[2 + i]; });
        res[2 + hairs.length].forEach((j) => { const c = THREE.AnimationClip.parse(j); clips[c.name] = c; });
        P.ready = true; P.loading = false;
        if (onReady) onReady();
      })
      .catch((e) => { P.loading = false; P.error = String(e); console.warn('people load failed', e); });
  };

  // đo chiều cao, trục đứng và vị trí khớp ở tư thế gốc để biết đâu là thân / tay / chân
  function prep(sex, gltf) {
    const scene = gltf.scene;
    scene.updateMatrixWorld(true);
    let body = null;
    scene.traverse((o) => { if (o.isSkinnedMesh && /Superhero/i.test(o.name)) body = o; });
    if (!body) scene.traverse((o) => { if (o.isSkinnedMesh && !body) body = o; });
    const bb = new THREE.Box3().setFromObject(scene);
    const h = bb.max.y - bb.min.y;
    // vị trí khớp trong không gian lưới của thân (tư thế gốc)
    const sk = body.skeleton, bp = {};
    sk.bones.forEach((b, i) => { M4.copy(sk.boneInverses[i]).invert(); bp[b.name] = new THREE.Vector3().setFromMatrixPosition(M4); });
    // trục đứng của lưới: trục có khoảng chênh lớn nhất giữa đầu và chân
    const d = new THREE.Vector3().subVectors(bp.Head, bp.foot_l);
    const ax = Math.abs(d.x) > Math.abs(d.y) && Math.abs(d.x) > Math.abs(d.z) ? 'x' : Math.abs(d.y) > Math.abs(d.z) ? 'y' : 'z';
    const up = new THREE.Vector3(); up[ax] = Math.sign(d[ax]);
    // trục ngang: hướng từ vai phải sang vai trái
    const side = new THREE.Vector3().subVectors(bp.upperarm_l, bp.upperarm_r); side.sub(up.clone().multiplyScalar(side.dot(up))).normalize();
    const U = (n) => bp[n].dot(up), X = (n) => Math.abs(bp[n].dot(side) - bp.pelvis.dot(side));
    const footY = Math.min(U('ball_l'), U('foot_l')) - (U('foot_l') - U('ball_l')) * 0.6;
    const headTop = U('Head') + (U('Head') - U('neck_01')) * 2.2;
    const meshH = headTop - footY;
    // hướng mặt: từ xương đầu tới tâm hai mắt
    let eyes = null; scene.traverse((o) => { if (o.isMesh && /Eye/i.test(o.name) && !/brow/i.test(o.name)) eyes = o; });
    const fwd = new THREE.Vector3().crossVectors(up, side);
    if (eyes) {
      eyes.geometry.computeBoundingBox(); const ec = new THREE.Vector3(); eyes.geometry.boundingBox.getCenter(ec);
      const df = ec.sub(bp.Head); if (df.dot(fwd) < 0) fwd.negate();
    }
    fwd.normalize();
    tpl[sex] = {
      gltf, scale: TARGET_H / h, up, side, fwd, bp,
      J: { foot: footY, ankle: U('foot_l'), knee: U('calf_l'), hip: U('thigh_l'), neck: U('neck_01'), head: U('Head'), sh: X('upperarm_l'), el: X('lowerarm_l'), wr: X('hand_l'), H: meshH,
        cx: bp.pelvis.dot(side), f0: bp.pelvis.dot(fwd), hw: Math.abs(bp.thigh_l.dot(side) - bp.thigh_r.dot(side)) / 2 },
    };
  }

  // ---------- shader quần áo (thời trang) ----------
  const FAB = { denim: 0, jersey: 1, knit: 2, leather: 3, linen: 4, velvet: 5, wool: 6, boucle: 7, gingham: 8, jacquard: 9 };
  const PAT = { stripes: 1, dots: 2, plaid: 3, floral: 4, sport: 5 };
  const NECK = { round: 0, V: 1, collar: 2, turtle: 3, mandarin: 4 };
  let fabTex = null;
  const fabric = () => fabTex || (fabTex = (() => { const t = new THREE.TextureLoader().load('assets/fabric/atlas.jpg'); t.colorSpace = THREE.NoColorSpace; t.anisotropy = 4; return t; })());

  function clothe(mat, t) {
    const J = t.J;
    const v4 = () => new THREE.Vector4(), c = () => new THREE.Color();
    const u = {
      uUp: { value: t.up }, uSide: { value: t.side }, uFwd: { value: t.fwd }, uFab: { value: fabric() },
      uJ: { value: new THREE.Vector4(J.hip, J.knee, J.ankle, J.neck) },
      uJ2: { value: new THREE.Vector4(J.sh, J.el, J.wr, J.H) },
      uJ3: { value: new THREE.Vector4(J.foot, J.cx, J.hw, J.f0) },
      uShirt: { value: c() }, uShirt2: { value: c() }, uPants: { value: c() }, uPants2: { value: c() },
      uShoes: { value: c() }, uSole: { value: c() }, uBelt: { value: c() }, uTie: { value: c() }, uSkin: { value: new THREE.Color(1, 1, 1) },
      uT: { value: v4() }, uT2: { value: v4() }, uB: { value: v4() }, uX: { value: v4() },
    };
    mat.userData.u = u;
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = 'varying vec3 vBP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vBP = position;');
      sh.fragmentShader = `varying vec3 vBP;
uniform vec3 uUp, uSide, uFwd; uniform sampler2D uFab;
uniform vec4 uJ, uJ2, uJ3, uT, uT2, uB, uX;
uniform vec3 uShirt, uShirt2, uPants, uPants2, uShoes, uSole, uBelt, uTie, uSkin;
float clothK; float clothR;
float hsh(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
vec3 fabK(float idx, vec2 uv) {
  if (idx < -0.5) return vec3(1.0);
  vec2 tl = vec2(mod(idx, 4.0), floor(idx / 4.0));
  vec2 f = fract(uv * 7.0);
  vec2 a = vec2((tl.x + 0.03 + f.x * 0.94) / 4.0, 1.0 - (tl.y + 0.03 + f.y * 0.94) / 3.0);
  return vec3(texture2D(uFab, a).r / 0.78);
}
vec3 patt(float p, vec2 uv, vec3 c1, vec3 c2) {
  if (p > 0.5 && p < 1.5) return mix(c1, c2, step(0.5, fract(uv.y * 34.0)));
  if (p > 1.5 && p < 2.5) return length(fract(uv * 46.0) - 0.5) < 0.2 ? c2 : c1;
  if (p > 2.5 && p < 3.5) { float a = step(0.72, fract(uv.x * 16.0)), b = step(0.72, fract(uv.y * 16.0)); float th = step(0.93, fract(uv.x * 48.0)) + step(0.93, fract(uv.y * 48.0)); return mix(mix(c1, c2, max(a, b) * 0.55), c1 * 0.55, a * b * 0.6) * (1.0 - 0.12 * min(th, 1.0)); }
  if (p > 3.5 && p < 4.5) { vec2 g = fract(uv * 30.0) - 0.5; float r = length(g); float ang = atan(g.y, g.x); float pet = 0.17 + 0.07 * cos(ang * 5.0); return r < 0.06 ? vec3(1.0, 0.85, 0.35) : r < pet ? c2 : c1; }
  return c1;
}
` + sh.fragmentShader
        .replace('#include <map_fragment>', `#include <map_fragment>
  {
    float y = dot(vBP, uUp), H = uJ2.w, sx = dot(vBP, uSide) - uJ3.y, ax = abs(sx), f = dot(vBP, uFwd) - uJ3.w;
    float hip = uJ.x, knee = uJ.y, ankle = uJ.z, neck = uJ.w, foot = uJ3.x, hw = uJ3.z;
    bool front = f > 0.0;
    bool arm = ax > uJ2.x * 0.92 && y > hip - 0.02 * H;
    vec2 uv = vMapUv;
    vec3 c = vec3(-1.0); float region = 0.0; clothR = 0.88;
    float neckT = uT.y;
    // ---- áo ----
    float topY = ax > uJ2.x * 0.45 ? neck + 0.03 * H : neck - 0.012 * H;
    if (neckT > 1.5 && neckT < 2.5 && ax < 0.075 * H) topY = neck + 0.012 * H;            // cổ sơ mi
    if (neckT > 2.5 && ax < 0.075 * H) topY = neck + (neckT > 3.5 ? 0.028 : 0.05) * H;     // cổ lọ / cổ áo dài
    if (y > hip - 0.015 * H && y < topY) {
      bool cov = !arm || (uT.x > 1.5 ? ax < uJ2.z * 0.97 : uT.x > 0.5 ? ax < uJ2.x + (uJ2.y - uJ2.x) * 0.45 : ax < uJ2.x * 1.02);
      if (cov) { c = uShirt; region = 1.0; }
      if (neckT > 0.5 && neckT < 1.5 && front && !arm && (neck + 0.012 * H - y) < (0.085 * H - ax * 1.4)) { c = vec3(-1.0); region = 0.0; } // cổ tim
      if (uT2.y > 0.5 && !arm && y < hip + 0.11 * H) { c = vec3(-1.0); region = 0.0; }                                // croptop
    }
    if (region > 0.5) {
      c = patt(uT.z, uv, uShirt, uShirt2);
      if (uT.z > 4.5 && abs(f) < 0.009 * H && (arm || ax > hw * 0.9)) c = uShirt2;                                    // sọc thể thao
      if (neckT > 1.5 && neckT < 2.5 && y > neck - 0.03 * H && ax < 0.075 * H && !arm) c = uT2.x > 0.5 ? uShirt * 0.85 : mix(uShirt, vec3(1.0), 0.15); // cổ áo
      if (uT2.x > 0.5 && front && !arm && ax < 0.038 * H) { c = uShirt2; region = 3.0; if (neckT > 0.5 && neckT < 1.5 && (neck + 0.012 * H - y) < (0.085 * H - ax * 1.4)) region = 4.0; } // vạt mở → áo trong
      if (uT2.x > 0.5 && front && !arm && ax > 0.038 * H && ax < 0.044 * H) c = uShirt * 0.7;                         // mép ve áo
      if (uT2.z > 0.5 && front && !arm && abs(ax - (uT2.x > 0.5 ? 0.047 * H : 0.0)) < 0.0045 * H && fract((neck - y) / (0.05 * H)) < 0.2 && y < neck - 0.04 * H) c = vec3(0.12); // hàng cúc
      if (uX.y > 0.5 && front && !arm && y > hip + 0.06 * H && y < neck - 0.008 * H && ax < 0.008 * H + (neck - y) * 0.06) { c = uTie; region = 5.0; } // cà vạt
      c *= region < 2.5 ? fabK(uT.w, uv) : vec3(1.0);
      if (uT.w > 2.5 && uT.w < 3.5) clothR = 0.45;   // da
      if (uT.w > 4.5 && uT.w < 5.5) clothR = 0.98;   // nhung
    }
    if (uX.x > 0.5 && !arm && y > hip - 0.005 * H && y < hip + 0.018 * H) { c = uBelt; region = 6.0; }   // thắt lưng đồng phục
    // ---- phần dưới ----
    if (y <= hip - 0.015 * H) {
      bool cov = false;
      if (uT2.w > 0.5 && uT2.w < 1.5) cov = y > knee + 0.02 * H;                 // váy liền
      else if (uB.x > 1.5) cov = y > knee + 0.05 * H;                            // chân váy
      else if (uB.x > 0.5) cov = y > knee + 0.035 * H;                           // quần short
      else cov = y > ankle + 0.012 * H;                                          // quần dài
      if (cov) {
        bool dressLow = uT2.w > 0.5 && uT2.w < 1.5;
        c = dressLow ? patt(uT.z, uv, uShirt, uShirt2) * fabK(uT.w, uv) : patt(uB.y, uv, uPants, uPants2) * fabK(uB.z, uv);
        if (!dressLow && uB.y > 4.5 && abs(f) < 0.009 * H) c = uPants2;
        if (!dressLow && uB.w > 0.5 && front && abs(y - knee) < 0.028 * H && hsh(floor(vBP * 600.0)) > 0.25) c = mix(vec3(-1.0), vec3(0.92), step(0.85, hsh(floor(vBP * 900.0)))); // rách gối
        region = 7.0;
      }
    }
    // ---- giày ----
    if (y < ankle + 0.022 * H) { c = y < foot + 0.008 * H ? uSole : uShoes; region = 8.0; clothR = uX.z > 0.5 ? 0.3 : 0.6; }
    // bộ hoá trang: ẩn thân dưới cổ (thay bằng mô hình trang phục)
    if (uX.w > 0.5 && y < neck - 0.01 * H) discard;
    clothK = c.r >= 0.0 ? 1.0 : 0.0;
    if (clothK > 0.5) diffuseColor.rgb = c * (0.95 + 0.05 * hsh(floor(vBP * 900.0)));
    else diffuseColor.rgb *= uSkin;
  }`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = clothK > 0.5 ? clothR : 0.55;');
    };
    mat.customProgramCacheKey = () => 'clothes-v2';
    mat.needsUpdate = true;
  }

  const SKIN_BASE = new THREE.Color('#ffe0c7');
  function setOutfit(u, look) {
    const r3 = look.r3 || {}, T3 = r3.top || {}, B3 = r3.bottom || {}, S3 = r3.shoes || {};
    const top = look.top, bottom = look.bottom;
    u.uShirt.value.set(look.shirt || '#7ec8f0');
    const skc = new THREE.Color(look.skin || '#ffe0c7');
    const dc = Math.abs(u.uShirt.value.r - skc.r) + Math.abs(u.uShirt.value.g - skc.g) + Math.abs(u.uShirt.value.b - skc.b);
    if (dc < 0.45 && !T3.fab) u.uShirt.value.set('#5f86b0'); // áo trùng màu da → đổi màu cho khỏi giống cởi trần
    u.uShirt2.value.set(T3.c2 || '#f5f5f5');
    u.uPants.value.set(look.aodaiPants || look.pants || '#5c6b9a');
    u.uPants2.value.set(B3.c2 || '#f5f5f5');
    u.uShoes.value.set(look.shoes || '#5d4037');
    u.uSole.value.set(S3.sole || '#3e2b22');
    u.uBelt.value.set(look.belt || '#3b4a6b');
    const neck = r3.neck;
    u.uTie.value.set(neck && neck.type === 'tie' ? neck.hex : '#c62828');
    u.uSkin.value.setRGB(Math.min(1.1, skc.r / SKIN_BASE.r), Math.min(1.1, skc.g / SKIN_BASE.g), Math.min(1.1, skc.b / SKIN_BASE.b));
    const sleeve = T3.sleeve ?? (top === 'tee' || top === 'polo' || top === 'dress' ? 1 : 2);
    const neckT = NECK[T3.neck] ?? 0;
    u.uT.value.set(sleeve, neckT, PAT[T3.pat] || 0, T3.fab ? FAB[T3.fab] : -1);
    const dress = T3.aodai ? 2 : top === 'dress' ? 1 : 0;
    u.uT2.value.set(T3.open ? 1 : 0, T3.crop ? 1 : 0, T3.btn ? 1 : 0, dress);
    const low = dress === 1 ? 0 : bottom === 'shorts' ? 1 : bottom === 'skirt' ? 2 : 0;
    u.uB.value.set(low, PAT[B3.pat] || 0, B3.fab ? FAB[B3.fab] : -1, B3.rip ? 1 : 0);
    u.uX.value.set(!top && look.belt ? 1 : 0, neck && neck.type === 'tie' ? 1 : 0, S3.heel ? 1 : 0, r3.costume ? 1 : 0);
  }

  // ảnh hoa văn cho món đồ 3D rời (chân váy, tà áo dài)
  const patC = {};
  function patTex(pat, c1, c2) {
    const k = pat + c1 + c2;
    if (patC[k]) return patC[k];
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d');
    x.fillStyle = c1; x.fillRect(0, 0, 128, 128);
    x.fillStyle = c2;
    if (pat === 'plaid') { x.globalAlpha = 0.5; for (let i = 0; i < 128; i += 32) { x.fillRect(i, 0, 9, 128); x.fillRect(0, i, 128, 9); } x.globalAlpha = 0.25; x.fillStyle = '#000'; for (let i = 16; i < 128; i += 32) { x.fillRect(i, 0, 2, 128); x.fillRect(0, i, 128, 2); } }
    else if (pat === 'dots') for (let i = 8; i < 128; i += 16) for (let j = 8; j < 128; j += 16) { x.beginPath(); x.arc(i + (j % 32 ? 8 : 0), j, 3.2, 0, 7); x.fill(); }
    else if (pat === 'floral') for (let i = 10; i < 128; i += 21) for (let j = 10; j < 128; j += 21) { for (let a = 0; a < 5; a++) { x.beginPath(); x.arc(i + Math.cos(a * 1.257) * 3.2, j + Math.sin(a * 1.257) * 3.2, 2.4, 0, 7); x.fill(); } x.fillStyle = '#ffd95a'; x.beginPath(); x.arc(i, j, 1.6, 0, 7); x.fill(); x.fillStyle = c2; }
    else if (pat === 'stripes') for (let j = 0; j < 128; j += 16) x.fillRect(0, j, 128, 8);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 2);
    return (patC[k] = t);
  }

  // món đồ 3D rời có da (skinned) theo xương hông – đùi: chân váy xoè / xếp ly, tà áo dài
  function skinnedPiece(body, t, kind, color, pat, c2, fab) {
    const J = t.J, U = t.up, X = t.side, F = t.fwd, H = J.H;
    const bones = body.skeleton.bones, bi = (n) => bones.findIndex((b) => b.name === n);
    const iP = bi('pelvis'), iL = bi('thigh_l'), iR = bi('thigh_r');
    const base = t.bp.pelvis.clone().sub(U.clone().multiplyScalar(t.bp.pelvis.dot(U)));
    const pos = [], uvs = [], si = [], sw = [], idx = [];
    const vert = (p, uu, vv, wP, wL, wR) => { pos.push(p.x, p.y, p.z); uvs.push(uu, vv); const s = wP + wL + wR; si.push(iP, iL, iR, 0); sw.push(wP / s, wL / s, wR / s, 0); };
    const P3 = (yy, cx, cf) => base.clone().add(U.clone().multiplyScalar(yy)).add(X.clone().multiplyScalar(cx)).add(F.clone().multiplyScalar(cf));
    if (kind === 'skirt' || kind === 'dress') {
      const y0 = J.hip + (kind === 'dress' ? 0.0 : 0.012) * H, y1 = J.knee + (kind === 'dress' ? -0.01 : 0.04) * H;
      const rT = J.hw * 1.5, rB = rT * (fab === 'pleat' ? 1.45 : 1.75), N = 40, R = 6;
      for (let r = 0; r <= R; r++) {
        const tt = r / R, yy = y0 + (y1 - y0) * tt;
        for (let j = 0; j <= N; j++) {
          const th = j / N * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th);
          let rad = rT + (rB - rT) * Math.pow(tt, 1.3);
          if (fab === 'pleat') rad *= 1 + 0.045 * tt * Math.sign(Math.sin(th * 22));
          const p = P3(yy, cs * rad, sn * rad * 0.82 + J.f0 - base.dot(F));
          const side = (cs + 1) / 2, w = tt * 0.75;
          vert(p, j / N, 1 - tt, 1 - w, w * side, w * (1 - side));
        }
      }
      for (let r = 0; r < R; r++) for (let j = 0; j < N; j++) { const a = r * (N + 1) + j, b = a + N + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    } else if (kind === 'aodai') {
      // hai tà trước / sau từ eo xuống gần mắt cá
      const y0 = J.hip + 0.07 * H, y1 = J.ankle + 0.1 * H, wd = J.hw * 1.55, N = 8, R = 10;
      [1, -1].forEach((sd) => {
        const off = pos.length / 3;
        for (let r = 0; r <= R; r++) {
          const tt = r / R, yy = y0 + (y1 - y0) * tt;
          for (let j = 0; j <= N; j++) {
            const u2 = j / N * 2 - 1, half = wd * (0.85 + 0.25 * tt);
            const depth = J.hw * (0.82 + 0.35 * tt) * (1 - 0.35 * u2 * u2);
            const p = P3(yy, u2 * half, sd * depth + J.f0 - base.dot(F));
            const w = 0.25 + tt * 0.45;
            vert(p, j / N, 1 - tt, 1 - w, w * (u2 + 1) / 2, w * (1 - u2) / 2);
          }
        }
        for (let r = 0; r < R; r++) for (let j = 0; j < N; j++) { const a = off + r * (N + 1) + j, b = a + N + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      });
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
    g.setIndex(idx); g.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ color: pat ? '#ffffff' : color, map: pat ? patTex(pat, color, c2 || '#ffffff') : null, roughness: fab === 'velvet' ? 0.95 : 0.8, side: THREE.DoubleSide });
    const m = new THREE.SkinnedMesh(g, mat);
    m.bind(body.skeleton, body.bindMatrix);
    m.position.copy(body.position); m.quaternion.copy(body.quaternion); m.scale.copy(body.scale);
    m.frustumCulled = false;
    body.parent.add(m);
    return m;
  }

  // ---------- đồ hoá trang (mô hình 3D thật) ----------
  const costumeT = {}, costumeWait = {};
  P.costume = function (name, sex, cb) {
    const k = (sex === 'f' ? 'female_' : 'male_') + name.toLowerCase();
    if (costumeT[k]) return costumeT[k];
    if (!costumeWait[k]) {
      costumeWait[k] = true;
      new THREE.GLTFLoader().loadAsync('assets/costumes/' + k + '.gltf').then((g) => { costumeT[k] = g; if (P.onChange) P.onChange(); if (cb) cb(); }).catch((e) => console.warn('costume', e));
    }
    return null;
  };
  function attachCostume(root, bonesByName, gltf) {
    const list = [];
    gltf.scene.traverse((o) => { if (o.isSkinnedMesh) list.push(o); });
    list.forEach((src) => {
      const m = new THREE.SkinnedMesh(src.geometry, src.material);
      const bones = src.skeleton.bones.map((b) => bonesByName[b.name]);
      m.bind(new THREE.Skeleton(bones, src.skeleton.boneInverses), src.bindMatrix);
      m.frustumCulled = false;
      root.add(m);
    });
    return list.some((o) => /Hood/i.test(o.name));
  }

  // gắn tóc (lưới có xương riêng) vào khung xương của người
  function attachHair(root, bonesByName, name, color) {
    const src = hairT[name]; if (!src) return null;
    let hm = null;
    src.scene.traverse((o) => { if (o.isSkinnedMesh && !hm) hm = o; });
    if (!hm) return null;
    const m = new THREE.SkinnedMesh(hm.geometry, hm.material.clone());
    m.material.color = new THREE.Color(color);
    m.material.roughness = 0.6; m.material.side = THREE.DoubleSide;
    const bones = hm.skeleton.bones.map((b) => bonesByName[b.name]);
    m.bind(new THREE.Skeleton(bones, hm.skeleton.boneInverses), hm.bindMatrix);
    m.frustumCulled = false;
    root.add(m);
    return m;
  }

  // ---------- tạo 1 người ----------
  const geoC = {}, gg = (k, f) => geoC[k] || (geoC[k] = f());
  P.make = function (look, opt) {
    look = look || {};
    const sex = look.long ? 'f' : 'm';
    const t = tpl[sex];
    const g = new THREE.Group();
    const root = THREE.SkeletonUtils.clone(t.gltf.scene);
    root.scale.setScalar(t.scale);
    g.add(root);
    const bonesByName = {};
    let body = null;
    root.traverse((o) => {
      if (o.isBone) bonesByName[o.name] = o;
      if (o.isSkinnedMesh) {
        o.frustumCulled = false;
        if (/Superhero/i.test(o.name)) { body = o; o.material = o.material.clone(); clothe(o.material, t); }
        else if (/Eyebrow/i.test(o.name)) { o.material = o.material.clone(); o.material.color = new THREE.Color(look.hair || '#4a3020'); }
      }
    });
    setOutfit(body.material.userData.u, look);
    const r3 = look.r3 || {}, T3 = r3.top || {}, B3 = r3.bottom || {};
    // đồ hoá trang: tải riêng khi cần; chưa tải xong thì mặc đồ thường
    const cg = r3.costume ? P.costume(r3.costume, sex) : null;
    let hood = false;
    if (cg) hood = attachCostume(root, bonesByName, cg); else body.material.userData.u.uX.value.w = 0;
    // món đồ rời: tà áo dài, váy xoè, chân váy xếp ly
    if (!cg) {
      if (T3.aodai) skinnedPiece(body, t, 'aodai', look.shirt, T3.pat, T3.c2, T3.fab);
      else if (look.top === 'dress' && T3.flare) skinnedPiece(body, t, 'dress', look.shirt, T3.pat, T3.c2, T3.fab);
      else if (look.bottom === 'skirt' && B3.flare && look.top !== 'dress') skinnedPiece(body, t, 'skirt', look.pants, B3.pat, B3.c2, B3.flare === 2 ? 'pleat' : B3.fab);
    }
    // tóc theo kiểu nhân vật
    const hairName = sex === 'f' ? (look.bowCol || look.hat === 'beanie' ? 'hair_buns' : 'hair_long') : (look.hair === '#bdbdbd' ? 'hair_buzzed' : 'hair_simpleparted');
    const hc = look.hair || '#4a3020';
    if (!hood) attachHair(root, bonesByName, hairName, hc);
    if (sex === 'm' && look.glasses && look.hair === '#bdbdbd') attachHair(root, bonesByName, 'hair_beard', hc);

    // phụ kiện bám theo xương đầu / lưng (tính lại mỗi khung hình)
    const head = bonesByName.Head, spine = bonesByName.spine_03;
    const acc = [];
    const k = TARGET_H; // kích thước theo chiều cao người
    const stdM = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o || {}));
    const hatT = look.hat || (look.cap ? 'cap' : null);
    const addAcc = (bone, obj, off) => { g.add(obj); acc.push({ bone, obj, off }); };
    if (hatT && look.cap && !cg) {
      const hat = new THREE.Group(), mat = stdM(look.cap, { roughness: 0.85 });
      if (hatT === 'sun') {
        const br = new THREE.Mesh(gg('sbr', () => new THREE.CylinderGeometry(0.2 * k * 0.6, 0.2 * k * 0.6, 0.006 * k, 24)), mat); br.position.y = 0.0; hat.add(br);
        const cr = new THREE.Mesh(gg('scr', () => new THREE.SphereGeometry(0.075 * k, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2)), mat); hat.add(cr);
        const band = new THREE.Mesh(gg('sbd', () => new THREE.TorusGeometry(0.074 * k, 0.006 * k, 6, 20)), stdM('#ffffff')); band.rotation.x = Math.PI / 2; band.position.y = 0.012 * k; hat.add(band);
      } else if (hatT === 'beanie') {
        const bn = new THREE.Mesh(gg('bn', () => new THREE.SphereGeometry(0.078 * k, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55)), mat); bn.position.y = -0.012 * k; hat.add(bn);
        const pom = new THREE.Mesh(gg('pom', () => new THREE.SphereGeometry(0.02 * k, 8, 6)), stdM('#ffffff')); pom.position.y = 0.068 * k; hat.add(pom);
      } else {
        const cp = new THREE.Mesh(gg('cp', () => new THREE.SphereGeometry(0.077 * k, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.5)), mat); cp.position.y = -0.008 * k; hat.add(cp);
        const brim = new THREE.Mesh(gg('cbr', () => new THREE.CylinderGeometry(0.05 * k, 0.05 * k, 0.005 * k, 14, 1, false, -Math.PI / 2, Math.PI)), mat); brim.position.set(0, -0.006 * k, 0.065 * k); brim.rotation.x = 0.12; hat.add(brim);
      }
      addAcc(head, hat, new THREE.Vector3(0, 0.086 * k, -0.004 * k));
    }
    if (look.glasses && !hood) {
      const gl = new THREE.Group();
      const fm = stdM('#222222', { roughness: 0.3, metalness: 0.6 });
      const lm = look.glasses === 'sun' ? stdM('#141418', { roughness: 0.05, metalness: 0.4 }) : new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.05, transparent: true, opacity: 0.18 });
      [-1, 1].forEach((s) => {
        const r = new THREE.Mesh(gg('gr', () => new THREE.TorusGeometry(0.017 * k, 0.0025 * k, 6, 16)), fm); r.position.x = s * 0.022 * k; gl.add(r);
        const l = new THREE.Mesh(gg('gl', () => new THREE.CircleGeometry(0.016 * k, 16)), lm); l.position.set(s * 0.022 * k, 0, 0.001 * k); gl.add(l);
      });
      addAcc(head, gl, new THREE.Vector3(0, 0.018 * k, 0.07 * k));
    }
    if (look.bag && !cg) {
      const bp = new THREE.Mesh(gg('bag', () => new THREE.BoxGeometry(0.2 * k * 0.6, 0.24 * k * 0.6, 0.08 * k * 0.6)), stdM(look.bag, { roughness: 0.9 }));
      addAcc(spine, bp, new THREE.Vector3(0, -0.02 * k, -0.11 * k));
    }
    const neckB = bonesByName.neck_01, handB = bonesByName.hand_r;
    if (r3.neck && !cg) {
      const n3 = r3.neck;
      if (n3.type === 'scarf') {
        const sc = new THREE.Group(), m = stdM(n3.hex, { roughness: 0.95 });
        const ring = new THREE.Mesh(gg('scarf', () => new THREE.TorusGeometry(0.052 * k, 0.019 * k, 10, 24)), m); ring.rotation.x = Math.PI / 2 - 0.25; ring.scale.set(1, 0.85, 1); sc.add(ring);
        const end = new THREE.Mesh(gg('scend', () => new THREE.BoxGeometry(0.035 * k, 0.12 * k, 0.012 * k)), m); end.position.set(0.02 * k, -0.07 * k, 0.05 * k); end.rotation.z = 0.12; sc.add(end);
        addAcc(neckB, sc, new THREE.Vector3(0, -0.005 * k, 0.004 * k));
      } else if (n3.type === 'necklace') {
        const nk = new THREE.Group(), m = stdM(n3.hex, { roughness: 0.2, metalness: 1 });
        const ring = new THREE.Mesh(gg('neckl', () => new THREE.TorusGeometry(0.058 * k, 0.0022 * k, 6, 32)), m); ring.rotation.x = Math.PI / 2 - 0.55; nk.add(ring);
        const pend = new THREE.Mesh(gg('pend', () => new THREE.OctahedronGeometry(0.008 * k, 0)), stdM('#e8f4ff', { roughness: 0.05, metalness: 0.3 })); pend.position.set(0, -0.03 * k, 0.055 * k); nk.add(pend);
        addAcc(neckB, nk, new THREE.Vector3(0, -0.02 * k, 0.008 * k));
      }
    }
    if (r3.hand && r3.hand.type === 'handbag' && !cg) {
      const hb = new THREE.Group(), m = stdM(r3.hand.hex, { roughness: 0.45 });
      const bx = new THREE.Mesh(gg('hbag', () => new THREE.BoxGeometry(0.1 * k, 0.075 * k, 0.035 * k)), m); bx.position.y = -0.07 * k; hb.add(bx);
      const hd = new THREE.Mesh(gg('hbh', () => new THREE.TorusGeometry(0.03 * k, 0.004 * k, 6, 16, Math.PI)), m); hd.position.y = -0.032 * k; hb.add(hd);
      const clasp = new THREE.Mesh(gg('hbc', () => new THREE.BoxGeometry(0.02 * k, 0.012 * k, 0.004 * k)), stdM('#d4af37', { metalness: 1, roughness: 0.25 })); clasp.position.set(0, -0.05 * k, 0.019 * k); hb.add(clasp);
      addAcc(handB, hb, new THREE.Vector3(0, -0.01 * k, 0.0));
    }
    // bóng tròn dưới chân
    const blob = new THREE.Mesh(gg('blob', () => new THREE.CircleGeometry(0.3, 18)), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.22, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2; blob.position.y = 0.015; g.add(blob);

    // tư thế gốc của xương đầu / lưng (để phụ kiện xoay theo)
    g.updateMatrixWorld(true);
    const bind = new Map();
    const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
    acc.forEach((a) => { if (!bind.has(a.bone)) { const m = new THREE.Matrix4().multiplyMatrices(inv, a.bone.matrixWorld); const q = new THREE.Quaternion(); m.decompose(new THREE.Vector3(), q, new THREE.Vector3()); bind.set(a.bone, q.invert()); } });

    // ---------- động tác ----------
    const mixer = new THREE.AnimationMixer(root);
    const acts = {};
    const act = (n) => acts[n] || (acts[n] = clips[n] ? mixer.clipAction(clips[n]) : null);
    let cur = null, curName = '';
    const play = (n, fade) => {
      if (n === curName) return;
      const a = act(n); if (!a) return;
      a.reset().setEffectiveWeight(1).play();
      if (cur) cur.crossFadeTo(a, fade ?? 0.25, false);
      cur = a; curName = n;
    };
    play('Idle_Loop', 0);
    mixer.update(Math.random() * 2);
    const EMO = { dance: 'Dance_Loop', spin: 'Dance_Loop', wave: 'Idle_Talking_Loop', heart: 'Idle_Talking_Loop', clap: 'Interact', cheer: 'Spell_Simple_Shoot', bow: 'PickUp_Table', jump: 'Jump_Loop', sit: 'Sitting_Idle_Loop', sleep: 'Crouch_Idle_Loop' };
    const tmpM = new THREE.Matrix4(), tq = new THREE.Quaternion(), tp = new THREE.Vector3(), ts = new THREE.Vector3();

    return {
      g, human: true,
      anim(dt, moving, emo, speed) {
        let name = 'Idle_Loop', ts2 = 1;
        if (moving) {
          const sp = speed || 1.5;
          if (sp > 3.2) { name = 'Jog_Fwd_Loop'; ts2 = THREE.MathUtils.clamp(sp / 4.2, 0.7, 1.5); }
          else { name = 'Walk_Loop'; ts2 = THREE.MathUtils.clamp(sp / 1.5, 0.6, 1.6); }
        } else if (emo) name = EMO[emo.id] || 'Idle_Loop';
        play(name);
        if (cur) cur.timeScale = ts2;
        mixer.update(dt);
        // nhảy / xoay / ngồi: thêm chuyển động cả người
        root.position.y = 0; root.rotation.y = 0;
        if (emo && !moving) {
          if (emo.id === 'jump') root.position.y = Math.abs(Math.sin(emo.t * Math.PI * 1.4)) * 0.35 / t.scale * t.scale;
          if (emo.id === 'spin') root.rotation.y = (1 - Math.cos(Math.min(1, emo.t / (emo.dur * 0.85)) * Math.PI)) * Math.PI * 2;
          if (emo.id === 'sit') root.position.y = -0.33;
        }
        // phụ kiện bám theo xương
        if (acc.length) {
          g.updateMatrixWorld(true);
          const invG = new THREE.Matrix4().copy(g.matrixWorld).invert();
          acc.forEach((a) => {
            tmpM.multiplyMatrices(invG, a.bone.matrixWorld); tmpM.decompose(tp, tq, ts);
            tq.multiply(bind.get(a.bone));
            a.obj.quaternion.copy(tq);
            a.obj.position.copy(a.off).applyQuaternion(tq).add(tp);
          });
        }
      },
    };
  };
})();
