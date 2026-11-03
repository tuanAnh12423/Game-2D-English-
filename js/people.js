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
    tpl[sex] = {
      gltf, scale: TARGET_H / h, up, side,
      J: { foot: footY, ankle: U('foot_l'), knee: U('calf_l'), hip: U('thigh_l'), neck: U('neck_01'), head: U('Head'), sh: X('upperarm_l'), el: X('lowerarm_l'), wr: X('hand_l'), H: meshH, cx: bp.pelvis.dot(side) },
    };
  }

  // ---------- shader quần áo ----------
  function clothe(mat, t) {
    const J = t.J;
    const u = {
      uUp: { value: t.up }, uSide: { value: t.side },
      uJ: { value: new THREE.Vector4(J.hip, J.knee, J.ankle, J.neck) },
      uJ2: { value: new THREE.Vector4(J.sh, J.el, J.wr, J.H) },
      uJ3: { value: new THREE.Vector4(J.foot, J.cx, J.head, 0) },
      uShirt: { value: new THREE.Color() }, uPants: { value: new THREE.Color() }, uShoes: { value: new THREE.Color() }, uBelt: { value: new THREE.Color() },
      uSkin: { value: new THREE.Color(1, 1, 1) },
      uMode: { value: new THREE.Vector4(2, 0, 0, 0) }, // tay áo (0 không,1 ngắn,2 dài), quần (0 dài,1 short,2 váy), váy liền, thắt lưng
    };
    mat.userData.u = u;
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = 'varying vec3 vBP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vBP = position;');
      sh.fragmentShader = 'varying vec3 vBP;\nuniform vec3 uUp; uniform vec3 uSide; uniform vec4 uJ; uniform vec4 uJ2; uniform vec4 uJ3; uniform vec3 uShirt; uniform vec3 uPants; uniform vec3 uShoes; uniform vec3 uBelt; uniform vec3 uSkin; uniform vec4 uMode; float clothK;\n'
        + sh.fragmentShader
          .replace('#include <map_fragment>', `#include <map_fragment>
  {
    float y = dot(vBP, uUp), H = uJ2.w, ax = abs(dot(vBP, uSide) - uJ3.y);
    float hip = uJ.x, knee = uJ.y, ankle = uJ.z, neck = uJ.w;
    bool arm = ax > uJ2.x * 0.92 && y > hip - 0.02 * H;
    vec3 c = vec3(-1.0);
    // áo / tay áo
    float topY = ax > uJ2.x * 0.45 ? neck + 0.03 * H : neck - 0.012 * H; // vai cao hơn cổ áo
    if (y > hip - 0.015 * H && y < topY) {
      if (!arm) c = uShirt;
      else if (uMode.x > 1.5 ? ax < uJ2.z * 0.97 : uMode.x > 0.5 ? ax < uJ2.x + (uJ2.y - uJ2.x) * 0.45 : false) c = uShirt;
    }
    // thắt lưng (đồng phục)
    if (uMode.w > 0.5 && !arm && y > hip - 0.005 * H && y < hip + 0.018 * H) c = uBelt;
    // phần dưới
    if (y <= hip - 0.015 * H) {
      if (uMode.z > 0.5) { if (y > knee + 0.02 * H) c = uShirt; }                   // váy liền
      else if (uMode.y > 1.5) { if (y > knee + 0.05 * H) c = uPants; }             // chân váy
      else if (uMode.y > 0.5) { if (y > knee + 0.035 * H) c = uPants; }            // quần short
      else if (y > ankle + 0.012 * H) c = uPants;                                   // quần dài
    }
    // giày
    if (y < ankle + 0.022 * H) c = uShoes;
    clothK = c.r >= 0.0 ? 1.0 : 0.0;
    if (clothK > 0.5) {
      float n = fract(sin(dot(floor(vBP * 900.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453);
      diffuseColor.rgb = c * (0.93 + 0.07 * n);
    } else diffuseColor.rgb *= uSkin;
  }`)
          .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = clothK > 0.5 ? 0.88 : 0.55;');
    };
    mat.customProgramCacheKey = () => 'clothes-v1';
    mat.needsUpdate = true;
  }

  const SKIN_BASE = new THREE.Color('#ffe0c7');
  function setOutfit(u, look) {
    const top = look.top, bottom = look.bottom;
    u.uShirt.value.set(look.shirt || '#7ec8f0');
    // áo trùng màu da thì nhìn như cởi trần → làm đậm màu áo
    const skc = new THREE.Color(look.skin || '#ffe0c7');
    const dc = Math.abs(u.uShirt.value.r - skc.r) + Math.abs(u.uShirt.value.g - skc.g) + Math.abs(u.uShirt.value.b - skc.b);
    if (dc < 0.45) u.uShirt.value.set('#5f86b0');
    u.uPants.value.set(look.pants || '#5c6b9a');
    u.uShoes.value.set(look.shoes || '#5d4037');
    u.uBelt.value.set(look.belt || '#3b4a6b');
    const sk = new THREE.Color(look.skin || '#ffe0c7');
    u.uSkin.value.setRGB(Math.min(1.1, sk.r / SKIN_BASE.r), Math.min(1.1, sk.g / SKIN_BASE.g), Math.min(1.1, sk.b / SKIN_BASE.b));
    const sleeve = top === 'tee' || top === 'polo' || top === 'dress' ? 1 : 2;
    const low = top === 'dress' ? 0 : bottom === 'shorts' ? 1 : bottom === 'skirt' ? 2 : 0;
    u.uMode.value.set(sleeve, low, top === 'dress' ? 1 : 0, !top && look.belt ? 1 : 0);
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
    // tóc theo kiểu nhân vật
    const hairName = sex === 'f' ? (look.bowCol || look.hat === 'beanie' ? 'hair_buns' : 'hair_long') : (look.hair === '#bdbdbd' ? 'hair_buzzed' : 'hair_simpleparted');
    const hc = look.hair || '#4a3020';
    attachHair(root, bonesByName, hairName, hc);
    if (sex === 'm' && look.glasses && look.hair === '#bdbdbd') attachHair(root, bonesByName, 'hair_beard', hc);

    // phụ kiện bám theo xương đầu / lưng (tính lại mỗi khung hình)
    const head = bonesByName.Head, spine = bonesByName.spine_03;
    const acc = [];
    const k = TARGET_H; // kích thước theo chiều cao người
    const stdM = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o || {}));
    const hatT = look.hat || (look.cap ? 'cap' : null);
    const addAcc = (bone, obj, off) => { g.add(obj); acc.push({ bone, obj, off }); };
    if (hatT && look.cap) {
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
    if (look.glasses) {
      const gl = new THREE.Group();
      const fm = stdM('#222222', { roughness: 0.3, metalness: 0.6 });
      const lm = look.glasses === 'sun' ? stdM('#141418', { roughness: 0.05, metalness: 0.4 }) : new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.05, transparent: true, opacity: 0.18 });
      [-1, 1].forEach((s) => {
        const r = new THREE.Mesh(gg('gr', () => new THREE.TorusGeometry(0.017 * k, 0.0025 * k, 6, 16)), fm); r.position.x = s * 0.022 * k; gl.add(r);
        const l = new THREE.Mesh(gg('gl', () => new THREE.CircleGeometry(0.016 * k, 16)), lm); l.position.set(s * 0.022 * k, 0, 0.001 * k); gl.add(l);
      });
      addAcc(head, gl, new THREE.Vector3(0, 0.018 * k, 0.07 * k));
    }
    if (look.bag) {
      const bp = new THREE.Mesh(gg('bag', () => new THREE.BoxGeometry(0.2 * k * 0.6, 0.24 * k * 0.6, 0.08 * k * 0.6)), stdM(look.bag, { roughness: 0.9 }));
      addAcc(spine, bp, new THREE.Vector3(0, -0.02 * k, -0.11 * k));
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
