// APEX KARTS 64 - Cherry Grove Canyon
let rng = 12345;
function sr() { rng = (rng * 1103515245 + 12345) & 0x7fffffff; return rng / 0x7fffffff; }

const C = {
  w: 14, laps: 3, ms: 28, ac: 18, br: 25, fr: 6, ofr: 12,
  ss: 3.0, ms2: 0.65, ch: 8, cd: 14, cs: 4
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.FogExp2(0x87CEEB, 0.004);

const cam = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.5, 500);
const ren = new THREE.WebGLRenderer({ antialias: true });
ren.setSize(innerWidth, innerHeight);
ren.setPixelRatio(Math.min(devicePixelRatio, 2));
ren.shadowMap.enabled = true;
ren.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(ren.domElement);

scene.add(new THREE.AmbientLight(0xffeedd, 0.6));
const dl = new THREE.DirectionalLight(0xffffff, 0.8);
dl.position.set(40, 80, 30);
dl.castShadow = true;
dl.shadow.mapSize.set(2048, 2048);
dl.shadow.camera.left = -80;
dl.shadow.camera.right = 80;
dl.shadow.camera.top = 80;
dl.shadow.camera.bottom = -80;
dl.shadow.camera.far = 200;
scene.add(dl);
scene.add(new THREE.HemisphereLight(0x88ccff, 0x44aa22, 0.4));

// Ground
const gnd = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 400),
  new THREE.MeshLambertMaterial({ color: 0x44aa22 })
);
gnd.rotation.x = -Math.PI / 2;
gnd.position.y = -0.5;
gnd.receiveShadow = true;
scene.add(gnd);

// Ponds
[ { x: -65, z: 25, r: 12 }, { x: 55, z: 38, r: 8 } ].forEach(function(p) {
  var w = new THREE.Mesh(
    new THREE.CircleGeometry(p.r, 16),
    new THREE.MeshLambertMaterial({ color: 0x3388cc, transparent: true, opacity: 0.7 })
  );
  w.rotation.x = -Math.PI / 2;
  w.position.set(p.x, -0.2, p.z);
  scene.add(w);
});

// Track waypoints
var WP = [
  { x: 0, z: -60 }, { x: 30, z: -60 }, { x: 55, z: -58 },
  { x: 72, z: -48 }, { x: 82, z: -32 },
  { x: 78, z: -15 }, { x: 68, z: 0 }, { x: 80, z: 15 }, { x: 75, z: 35 },
  { x: 58, z: 50 }, { x: 35, z: 60 }, { x: 10, z: 58 },
  { x: -10, z: 52 }, { x: -28, z: 42 },
  { x: -40, z: 28 }, { x: -38, z: 10 }, { x: -48, z: -5 }, { x: -42, z: -22 },
  { x: -35, z: -38 }, { x: -20, z: -52 }, { x: -5, z: -58 }, { x: 0, z: -60 }
];
var tc = new THREE.CatmullRomCurve3(
  WP.map(function(p) { return new THREE.Vector3(p.x, 0, p.z); }),
  true, 'catmullrom', 0.5
);

// Build road
(function buildRoad() {
  var N = 300, V = [], N2 = [], U = [], I = [];
  for (var i = 0; i <= N; i++) {
    var t = i / N, p = tc.getPointAt(t), tg = tc.getTangentAt(t);
    var n = new THREE.Vector3(-tg.z, 0, tg.x);
    var l = p.clone().add(n.clone().multiplyScalar(C.w / 2));
    var r = p.clone().add(n.clone().multiplyScalar(-C.w / 2));
    V.push(l.x, 0.05, l.z, r.x, 0.05, r.z);
    N2.push(0, 1, 0, 0, 1, 0);
    U.push(0, t * 40, 1, t * 40);
    if (i < N) {
      var v = i * 2;
      I.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
    }
  }
  var g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(V, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N2, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  g.setIndex(I);
  g.computeVertexNormals();

  var cv = document.createElement('canvas');
  cv.width = 256; cv.height = 256;
  var cx = cv.getContext('2d');
  cx.fillStyle = '#666';
  cx.fillRect(0, 0, 256, 256);
  for (var i = 0; i < 3000; i++) {
    var gv = 80 + Math.floor(Math.random() * 30);
    cx.fillStyle = 'rgb(' + gv + ',' + gv + ',' + gv + ')';
    cx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  cx.fillStyle = '#fff';
  cx.fillRect(0, 0, 4, 256);
  cx.fillRect(252, 0, 4, 256);
  cx.fillStyle = '#ffcc00';
  for (var y = 0; y < 256; y += 32) cx.fillRect(126, y, 4, 16);
  for (var bx = 0; bx < 256; bx += 16) {
    cx.fillStyle = (bx / 16) % 2 == 0 ? '#fff' : '#000';
    cx.fillRect(bx, 0, 16, 8);
  }
  var tx = new THREE.CanvasTexture(cv);
  tx.wrapS = THREE.ClampToEdgeWrapping;
  tx.wrapT = THREE.RepeatWrapping;
  tx.repeat.set(1, 40);
  var rd = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: tx }));
  rd.receiveShadow = true;
  scene.add(rd);

  // Curbs
  var sides = [-1, 1];
  for (var si = 0; si < sides.length; si++) {
    var s = sides[si];
    var cv2 = [], ci2 = [];
    for (var i = 0; i <= N; i++) {
      var t = i / N, p = tc.getPointAt(t), tg = tc.getTangentAt(t);
      var n = new THREE.Vector3(-tg.z, 0, tg.x);
      var inn = C.w / 2 + 1.2 * s, out = C.w / 2 + 2 * s;
      cv2.push(p.x + n.x * inn, 0.08, p.z + n.z * inn, p.x + n.x * out, 0.15, p.z + n.z * out);
      if (i < N) {
        var v = i * 2;
        ci2.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
      }
    }
    var cg = new THREE.BufferGeometry();
    cg.setAttribute('position', new THREE.Float32BufferAttribute(cv2, 3));
    cg.setIndex(ci2);
    cg.computeVertexNormals();
    var curbColor = s === -1 ? 0xff3333 : 0xffffff;
    scene.add(new THREE.Mesh(cg, new THREE.MeshLambertMaterial({ color: curbColor })));
  }
})();

// Trees
function tree(x, z, s) {
  s = s || 1;
  var g = new THREE.Group();
  var tr = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3 * s, 0.5 * s, 2.5 * s, 6),
    new THREE.MeshLambertMaterial({ color: 0x886633 })
  );
  tr.position.y = 1.25 * s;
  tr.castShadow = true;
  g.add(tr);
  [0x228822, 0x33aa33, 0x229933].forEach(function(c, i) {
    var cn = new THREE.Mesh(
      new THREE.ConeGeometry((2.2 - i * 0.5) * s, (2.0 - i * 0.3) * s, 7),
      new THREE.MeshLambertMaterial({ color: c })
    );
    cn.position.y = (2.5 + i * 1.2) * s;
    cn.castShadow = true;
    g.add(cn);
  });
  g.position.set(x, 0, z);
  return g;
}

function rock(x, z, s) {
  s = s || 1;
  var r = new THREE.Mesh(
    new THREE.DodecahedronGeometry(1.2 * s, 0),
    new THREE.MeshLambertMaterial({ color: 0x888888 })
  );
  r.position.set(x, 0.4 * s, z);
  r.rotation.set(sr() * Math.PI, sr() * Math.PI, 0);
  r.castShadow = true;
  return r;
}

function mush(x, z) {
  var g = new THREE.Group();
  var st = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.2, 0.6, 6),
    new THREE.MeshLambertMaterial({ color: 0xeeeecc })
  );
  st.position.y = 0.3;
  g.add(st);
  var cp = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.5),
    new THREE.MeshLambertMaterial({ color: 0xdd2222 })
  );
  cp.position.y = 0.6;
  g.add(cp);
  for (var i = 0; i < 3; i++) {
    var sp = new THREE.Mesh(
      new THREE.CircleGeometry(0.08, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    sp.position.set((sr() - 0.5) * 0.5, 0.65 + sr() * 0.2, (sr() - 0.5) * 0.5);
    sp.rotation.x = -Math.PI / 2 + sr() * 0.3;
    sp.rotation.z = sr() * Math.PI;
    g.add(sp);
  }
  g.position.set(x, 0, z);
  return g;
}

// Scenery
for (var i = 0; i < 100; i++) {
  var t = i / 100, p = tc.getPointAt(t), tg = tc.getTangentAt(t);
  var n = new THREE.Vector3(-tg.z, 0, tg.x);
  var sides = [-1, 1];
  for (var si = 0; si < sides.length; si++) {
    var s = sides[si];
    var d = C.w / 2 + 3 + sr() * 8;
    scene.add(tree(p.x + n.x * d * s, p.z + n.z * d * s, 0.7 + sr() * 0.8));
  }
}
for (var i = 0; i < 40; i++) {
  var t = sr(), p = tc.getPointAt(t), tg = tc.getTangentAt(t);
  var n = new THREE.Vector3(-tg.z, 0, tg.x);
  var d = C.w / 2 + 2 + sr() * 15;
  var s = sr() > 0.5 ? 1 : -1;
  scene.add(sr() > 0.4 ? rock(p.x + n.x * d * s, p.z + n.z * d * s, 0.5 + sr()) : mush(p.x + n.x * d * s, p.z + n.z * d * s));
}
for (var i = 0; i < 12; i++) {
  var a = (i / 12) * Math.PI * 2, d = 100 + sr() * 40;
  var mx = Math.cos(a) * d, mz = Math.sin(a) * d, ms = 8 + sr() * 15;
  var m = new THREE.Mesh(
    new THREE.ConeGeometry(ms, ms * 1.5, 6),
    new THREE.MeshLambertMaterial({ color: new THREE.Color().setHSL(0.3, 0.3, 0.35 + sr() * 0.15) })
  );
  m.position.set(mx, ms * 0.75, mz);
  scene.add(m);
  if (sr() > 0.4) {
    var sn = new THREE.Mesh(
      new THREE.ConeGeometry(ms * 0.3, ms * 0.4, 6),
      new THREE.MeshLambertMaterial({ color: 0xeeeeff })
    );
    sn.position.set(mx, ms * 1.3, mz);
    scene.add(sn);
  }
}

// Checkpoints
var CPC = 8, cps = [];
for (var i = 0; i < CPC; i++) cps.push({ p: tc.getPointAt(i / CPC).clone(), passed: false });

// Kart
function mkKart(col) {
  col = col || 0xff4444;
  var k = new THREE.Group();
  var bd = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 2.2), new THREE.MeshLambertMaterial({ color: col }));
  bd.position.y = 0.55; bd.castShadow = true; k.add(bd);
  var ck = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.8), new THREE.MeshLambertMaterial({ color: 0x222 }));
  ck.position.set(0, 0.95, -0.3); ck.castShadow = true; k.add(ck);
  var hd = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), new THREE.MeshLambertMaterial({ color: 0xffcc88 }));
  hd.position.set(0, 1.35, -0.3); hd.castShadow = true; k.add(hd);
  var hl = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.55), new THREE.MeshLambertMaterial({ color: col }));
  hl.position.set(0, 1.38, -0.3); k.add(hl);
  k.wheels = [];
  var wg = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 10);
  var wm = new THREE.MeshLambertMaterial({ color: 0x111 });
  [ { x: -0.7, z: 0.75 }, { x: 0.7, z: 0.75 }, { x: -0.7, z: -0.75 }, { x: 0.7, z: -0.75 } ].forEach(function(p) {
    var w = new THREE.Mesh(wg, wm);
    w.rotation.z = Math.PI / 2;
    w.position.set(p.x, 0.35, p.z);
    w.castShadow = true;
    k.add(w);
    k.wheels.push(w);
  });
  var sp = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.4), new THREE.MeshLambertMaterial({ color: 0x333 }));
  sp.position.set(0, 1.15, -1); k.add(sp);
  [-0.5, 0.5].forEach(function(x) {
    var s = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.08), new THREE.MeshLambertMaterial({ color: 0x333 }));
    s.position.set(x, 0.95, -1); k.add(s);
  });
  var ex = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.5, 6), new THREE.MeshLambertMaterial({ color: 0x555 }));
  ex.rotation.x = Math.PI / 2; ex.position.set(0.4, 0.4, -1.2); k.add(ex);
  return k;
}

var kart = mkKart();
scene.add(kart);

var sp0 = tc.getPointAt(0.02);
var stg0 = tc.getTangentAt(0.02);
var st = {
  pos: sp0.clone(),
  rot: Math.atan2(stg0.x, stg0.z),
  speed: 0, st2: 0, lap: 0, lt: 0, bl: Infinity, tt: 0,
  cCP: -1, cn: 0, fin: false, go: false, demo: false, raceStart: 0
};
kart.position.copy(st.pos);
kart.rotation.y = st.rot;

var keys = {};
document.addEventListener('keydown', function(e) {
  keys[e.code] = true;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(e.code) >= 0) e.preventDefault();
});
document.addEventListener('keyup', function(e) { keys[e.code] = false; });

function onTrack(pos) {
  var md = Infinity;
  for (var i = 0; i <= 100; i++) {
    var d = pos.distanceTo(tc.getPointAt(i / 100));
    if (d < md) md = d;
  }
  return md < C.w / 2 + 1;
}

// Minimap
var mc = document.getElementById('minimap');
mc.width = 160; mc.height = 160;
var mxc = mc.getContext('2d');
var mpts = tc.getPoints(100);
var minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
mpts.forEach(function(p) {
  minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
  minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
});
var mp = 10; minX -= mp; maxX += mp; minZ -= mp; maxZ += mp;
var msx = 160 / (maxX - minX), msz = 160 / (maxZ - minZ), mms = Math.min(msx, msz);

function drawMM() {
  mxc.fillStyle = 'rgba(0,0,0,0.8)';
  mxc.fillRect(0, 0, 160, 160);
  var cx0 = (minX + maxX) / 2, cz0 = (minZ + maxZ) / 2;
  function tx(x) { return (x - cx0) * mms + 80; }
  function tz(z) { return (z - cz0) * mms + 80; }
  mxc.strokeStyle = '#888'; mxc.lineWidth = 3; mxc.beginPath();
  mpts.forEach(function(p, i) {
    if (i === 0) mxc.moveTo(tx(p.x), tz(p.z));
    else mxc.lineTo(tx(p.x), tz(p.z));
  });
  mxc.closePath(); mxc.stroke();
  mxc.fillStyle = '#ff4444'; mxc.beginPath();
  mxc.arc(tx(st.pos.x), tz(st.pos.z), 4, 0, Math.PI * 2); mxc.fill();
  mxc.strokeStyle = '#ffcc00'; mxc.lineWidth = 2; mxc.beginPath();
  mxc.moveTo(tx(st.pos.x), tz(st.pos.z));
  mxc.lineTo(tx(st.pos.x) + Math.sin(st.rot) * 10, tz(st.pos.z) + Math.cos(st.rot) * 10);
  mxc.stroke();
}

function fmtTime(t) {
  var m = Math.floor(t / 60), s = (t % 60).toFixed(1);
  return ('0' + m).slice(-2) + ':' + ('00' + s).slice(-4);
}

function updateHUD() {
  document.getElementById('hud-lap').textContent = Math.min(st.lap + 1, C.laps) + '/' + C.laps;
  document.getElementById('hud-time').textContent = fmtTime(st.tt);
  document.getElementById('speed-bar').style.width = (Math.abs(st.speed) / C.ms * 100) + '%';
}

function checkCP() {
  var ni = (st.cCP + 1) % CPC;
  if (st.pos.distanceTo(cps[ni].p) < C.w * 0.7) {
    st.cCP = ni;
    st.cn++;
    if (st.cCP === 0 && st.cn > CPC) {
      st.lap++;
      if (st.tt < st.bl) st.bl = st.tt;
      st.cn = 1;
      var fl = document.getElementById('lap-flash');
      fl.textContent = st.lap >= C.laps ? 'FINISH!' : 'LAP ' + (st.lap + 1);
      fl.style.display = 'block';
      fl.style.color = st.lap >= C.laps ? '#ffcc00' : '#44ff44';
      setTimeout(function() { fl.style.display = 'none'; }, 1500);
      if (st.lap >= C.laps) {
        st.fin = true; st.go = false;
        showFinish();
      }
    }
  }
}

function demoAI() {
  var ni = (st.cCP + 1) % CPC, t = cps[ni].p;
  var dx = t.x - st.pos.x, dz = t.z - st.pos.z;
  var ta = Math.atan2(dx, dz);
  var d = ta - st.rot;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return { s: Math.max(-1, Math.min(1, d * 3)), a: Math.abs(d) > 0.5 ? 0.3 : 0.8, b: Math.abs(d) > 0.8 ? 0.3 : 0 };
}

function showFinish() {
  var f = document.getElementById('finish-overlay');
  f.style.display = 'flex';
  document.getElementById('finish-time').textContent = 'Total: ' + fmtTime(st.tt);
  if (st.bl < Infinity) document.getElementById('finish-best').textContent = 'Best Lap: ' + fmtTime(st.bl);
}

function reset(demo) {
  st.pos.copy(sp0); st.pos.y = 0;
  st.rot = Math.atan2(stg0.x, stg0.z);
  st.speed = 0; st.st2 = 0; st.lap = 0; st.lt = 0; st.bl = Infinity;
  st.tt = 0; st.cCP = -1; st.cn = 0; st.fin = false;
  st.go = false; st.demo = !!demo; st.raceStart = 0;
  cps.forEach(function(c) { c.passed = false; });
  kart.position.copy(st.pos); kart.rotation.y = st.rot;
}

function startCD(cb) {
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('finish-overlay').style.display = 'none';
  var cd = document.getElementById('countdown');
  cd.style.display = 'block'; cd.style.color = '#ffcc00';
  var p = 3; cd.textContent = p;
  var iv = setInterval(function() {
    p--;
    if (p > 0) cd.textContent = p;
    else if (p === 0) { cd.textContent = 'GO!'; cd.style.color = '#44ff44'; }
    else {
      clearInterval(iv);
      cd.style.display = 'none';
      cd.style.color = '#ffcc00';
      cb();
    }
  }, 1000);
}

document.getElementById('btn-start').addEventListener('click', function() {
  reset(false);
  startCD(function() { st.go = true; st.raceStart = Date.now(); });
});
document.getElementById('btn-demo').addEventListener('click', function() {
  reset(true);
  startCD(function() { st.go = true; st.raceStart = Date.now(); });
});
document.getElementById('btn-restart').addEventListener('click', function() {
  document.getElementById('finish-overlay').style.display = 'none';
  reset(false);
  startCD(function() { st.go = true; st.raceStart = Date.now(); });
});
document.getElementById('btn-demo2').addEventListener('click', function() {
  document.getElementById('finish-overlay').style.display = 'none';
  reset(true);
  startCD(function() { st.go = true; st.raceStart = Date.now(); });
});

window.addEventListener('resize', function() {
  cam.aspect = innerWidth / innerHeight;
  cam.updateProjectionMatrix();
  ren.setSize(innerWidth, innerHeight);
});

// Game loop
var prevTime = performance.now();
var frameCount = 0;

function update(dt) {
  if (dt > 0.1) dt = 0.1;

  var accel = 0, steerIn = 0, brake = 0;

  if (st.go && st.demo) {
    var ai = demoAI();
    steerIn = ai.s; accel = ai.a; brake = ai.b;
  } else if (st.go) {
    if (keys.ArrowUp || keys.KeyW) accel = 1;
    if (keys.ArrowDown || keys.KeyS) accel = -1;
    if (keys.ArrowLeft || keys.KeyA) steerIn = -1;
    if (keys.ArrowRight || keys.KeyD) steerIn = 1;
    if (keys.Space) brake = 1;
  }

  // Reset
  if (keys.KeyR && !st.demo) {
    var sn = st.cCP >= 0 ? st.cCP / CPC : 0.02;
    var rp = tc.getPointAt(sn), rt = tc.getTangentAt(sn);
    st.pos.copy(rp); st.pos.y = 0;
    st.rot = Math.atan2(rt.x, rt.z);
    st.speed = 0; keys.KeyR = false;
  }

  // Steering
  if (steerIn !== 0 && Math.abs(st.speed) > 0.1) {
    st.st2 += steerIn * C.ss * dt * (st.speed >= 0 ? 1 : -1);
    st.st2 = Math.max(-C.ms2, Math.min(C.ms2, st.st2));
  } else {
    st.st2 *= 0.9;
  }
  if (Math.abs(st.st2) > 0.005 && Math.abs(st.speed) > 0.1) {
    st.rot += st.st2 * st.speed / C.ms * dt * 3;
  }

  // Speed
  if (accel > 0 && st.go) st.speed += C.ac * accel * dt;
  if (accel < 0) st.speed += C.ac * accel * dt;
  if (brake > 0) st.speed -= st.speed > 0 ? C.br * dt : -C.br * 0.5 * dt;

  var ot = !onTrack(st.pos);
  var fric = ot ? C.ofr : C.fr;
  if (st.speed > 0) st.speed = Math.max(0, st.speed - fric * dt);
  else st.speed = Math.min(0, st.speed + fric * dt);
  st.speed = Math.max(-C.ms * 0.4, Math.min(C.ms, st.speed));

  // Move
  var fdx = Math.sin(st.rot), fdz = Math.cos(st.rot);
  st.pos.x += fdx * st.speed * dt;
  st.pos.z += fdz * st.speed * dt;
  st.pos.y = 0;

  if (st.go) {
    st.tt = (Date.now() - st.raceStart) / 1000;
    checkCP();
  }

  // Kart mesh
  kart.position.copy(st.pos);
  kart.rotation.y = st.rot;
  kart.wheels.forEach(function(w) { w.rotation.x += st.speed * dt * 3; });

  // Camera follow
  var camTX = st.pos.x - fdx * C.cd;
  var camTY = C.ch;
  var camTZ = st.pos.z - fdz * C.cd;
  var factor = 1 - Math.exp(-C.cs * dt);
  cam.position.x += (camTX - cam.position.x) * factor;
  cam.position.y += (camTY - cam.position.y) * factor;
  cam.position.z += (camTZ - cam.position.z) * factor;
  cam.lookAt(st.pos.x, st.pos.y + 2, st.pos.z);

  // Move light
  dl.position.set(st.pos.x + 40, 80, st.pos.z + 30);
  dl.target.copy(st.pos);

  updateHUD();
  drawMM();
  frameCount++;
}

function animate() {
  requestAnimationFrame(animate);
  var now = performance.now(), dt = (now - prevTime) / 1000;
  prevTime = now;
  update(dt);
  ren.render(scene, cam);
}

animate();