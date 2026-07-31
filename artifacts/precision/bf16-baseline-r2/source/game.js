// ============================================================
//  APEX KARTS 64 - Game Module
// ============================================================
import * as THREE from 'three';

// --- SEEDED RANDOM ---
function createRNG(seed) {
  let s = seed | 0;
  return function() {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}
const SEED = 42;
let rng = createRNG(SEED);

// --- CONSTANTS ---
const TRACK_WIDTH = 12;
const MAX_SPEED = 45;
const ACCEL = 28;
const BRAKE_F = 40;
const REV_SPEED = 15;
const STEER_SPD = 3.2;
const FRICTION = 0.985;
const OFF_ROAD = 0.92;
const CP_COUNT = 8;

// --- TRACK WAYPOINTS ---
const TP = [
  new THREE.Vector3(0,0,-60), new THREE.Vector3(30,0,-65),
  new THREE.Vector3(60,0,-55), new THREE.Vector3(80,0,-35),
  new THREE.Vector3(88,0,0), new THREE.Vector3(80,0,35),
  new THREE.Vector3(60,0,55), new THREE.Vector3(35,0,65),
  new THREE.Vector3(0,0,60), new THREE.Vector3(-30,0,65),
  new THREE.Vector3(-55,0,55), new THREE.Vector3(-75,0,35),
  new THREE.Vector3(-82,0,0), new THREE.Vector3(-75,0,-30),
  new THREE.Vector3(-55,0,-55), new THREE.Vector3(-30,0,-65),
];
const trackCurve = new THREE.CatmullRomCurve3(TP, true, 'centripetal', 0.5);
const tSamples = trackCurve.getSpacedPoints(600);
let totalLen = 0;
const tDists = [];
for (let i = 0; i < tSamples.length; i++) {
  tDists.push(totalLen);
  if (i > 0) totalLen += tSamples[i].distanceTo(tSamples[i-1]);
}

// --- THREE.JS SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 90, 260);
const camera = new THREE.PerspectiveCamera(65, innerWidth/innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0x88aacc, 0.6));
const sun = new THREE.DirectionalLight(0xfff5dd, 1.3);
sun.position.set(40, 60, 30); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const ssc = sun.shadow.camera;
ssc.left=-100; ssc.right=100; ssc.top=100; ssc.bottom=-100;
scene.add(sun);
scene.add(new THREE.HemisphereLight(0x88ccff, 0x44aa22, 0.4));

// --- BUILD ROAD ---
function buildTrack() {
  const g = new THREE.Group();
  const N = 300;
  const pts = [];
  for (let i=0;i<=N;i++) {
    const t=i/N, p=trackCurve.getPointAt(t), tan=trackCurve.getTangentAt(t);
    const n = new THREE.Vector3(-tan.z,0,tan.x).normalize();
    pts.push({t,p,tan,n});
  }
  // Road mesh
  const rv=[],ri=[];
  for(let i=0;i<=N;i++){
    const s=pts[i];
    rv.push(s.p.x+s.n.x*TRACK_WIDTH/2,0.02,s.p.z+s.n.z*TRACK_WIDTH/2);
    rv.push(s.p.x-s.n.x*TRACK_WIDTH/2,0.02,s.p.z-s.n.z*TRACK_WIDTH/2);
    if(i<N){const a=i*2,b=i*2+1,c=(i+1)*2,d=(i+1)*2+1;ri.push(a,c,b,b,c,d);}
  }
  const rg=new THREE.BufferGeometry();
  rg.setAttribute('position',new THREE.Float32BufferAttribute(rv,3));
  rg.setIndex(ri); rg.computeVertexNormals();

  // Road texture
  const rc=document.createElement('canvas');rc.width=256;rc.height=256;
  const rx=rc.getContext('2d');
  rx.fillStyle='#555';rx.fillRect(0,0,256,256);
  for(let i=0;i<3000;i++){const sh=60+rng()*30;rx.fillStyle=`rgb(${sh},${sh},${sh})`;rx.fillRect(rng()*256,rng()*256,2,2);}
  rx.strokeStyle='#fff';rx.lineWidth=3;rx.setLineDash([15,20]);
  rx.beginPath();rx.moveTo(128,0);rx.lineTo(128,256);rx.stroke();
  rx.setLineDash([]);rx.strokeStyle='#ffcc00';rx.lineWidth=5;
  rx.beginPath();rx.moveTo(10,0);rx.lineTo(10,256);rx.stroke();
  rx.beginPath();rx.moveTo(246,0);rx.lineTo(246,256);rx.stroke();
  const rt=new THREE.CanvasTexture(rc);
  rt.wrapS=rt.wrapT=THREE.RepeatWrapping;rt.repeat.set(1,25);
  g.add(new THREE.Mesh(rg,new THREE.MeshStandardMaterial({map:rt,roughness:0.8})));
  g.children[0].receiveShadow=true;

  // Curbs
  for(let side=-1;side<=1;side+=2){
    const cv=[],ci=[];
    for(let i=0;i<=N;i++){
      const s=pts[i],off=TRACK_WIDTH/2+0.6;
      const om=s.p.clone().add(s.n.clone().multiplyScalar(side*(off+0.3)));
      const im=s.p.clone().add(s.n.clone().multiplyScalar(side*(off-0.3)));
      cv.push(im.x,0.04,im.z,om.x,0.04,om.z);
      if(i<N){
        const a=i*4,e=(i+1)*4;
        ci.push(a,e,a+1,a+1,e,a+2,a+2,e,a+3,a+3,e+1,e+1,e+2,e+2,e+3);
      }
    }
    const cg=new THREE.BufferGeometry();
    cg.setAttribute('position',new THREE.Float32BufferAttribute(cv,3));
    cg.setIndex(ci);cg.computeVertexNormals();
    const cc=document.createElement('canvas');cc.width=64;cc.height=64;
    const cx=cc.getContext('2d');cx.fillStyle='#ff2200';cx.fillRect(0,0,64,32);cx.fillStyle='#fff';cx.fillRect(0,32,64,32);
    const ct=new THREE.CanvasTexture(cc);ct.wrapT=THREE.RepeatWrapping;ct.repeat.set(1,45);
    g.add(new THREE.Mesh(cg,new THREE.MeshStandardMaterial({map:ct,roughness:0.7})));
  }

  // Start/finish line
  const sp=tSamples[0],st=trackCurve.getTangentAt(0);
  const sn=new THREE.Vector3(-st.z,0,st.x).normalize();
  const sc2=document.createElement('canvas');sc2.width=128;sc2.height=128;
  const sx=sc2.getContext('2d');
  for(let x=0;x<128;x+=16)for(let y=0;y<128;y+=16){sx.fillStyle=((x/16+y/16)%2===0)?'#fff':'#222';sx.fillRect(x,y,16,16);}
  const sfM=new THREE.Mesh(new THREE.PlaneGeometry(TRACK_WIDTH+2,4),new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(sc2),roughness:0.5}));
  sfM.rotation.x=-Math.PI/2;sfM.position.set(sp.x,0.06,sp.z);sfM.rotation.z=Math.atan2(st.x,st.z);
  g.add(sfM);

  // Gate poles
  for(let side=-1;side<=1;side+=2){
    const pp=sp.clone().add(sn.clone().multiplyScalar(side*(TRACK_WIDTH/2+0.5)));
    const pg=document.createElement('canvas');pg.width=64;pg.height=128;
    const px=pg.getContext('2d');
    for(let y=0;y<128;y+=16){px.fillStyle=(y/16)%2===0?'#ff0000':'#fff';px.fillRect(0,y,64,16);}
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,6,8),new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(pg)}));
    pole.position.set(pp.x,3,pp.z);pole.castShadow=true;g.add(pole);
  }

  // Banner arch
  const angle=Math.atan2(st.x,st.z);
  const bar=new THREE.Mesh(new THREE.BoxGeometry(TRACK_WIDTH+3,0.6,0.6),new THREE.MeshStandardMaterial({color:0xffcc00,roughness:0.4}));
  bar.position.set(sp.x,5.5,sp.z);bar.rotation.y=angle;bar.castShadow=true;g.add(bar);

  return g;
}
scene.add(buildTrack());

// --- TERRAIN ---
function buildTerrain() {
  const tg=new THREE.PlaneGeometry(400,400,25,25);
  const tp=tg.attributes.position;
  for(let i=0;i<tp.count;i++){const x=tp.getX(i),y=tp.getY(i);tp.setZ(i,Math.sin(x*0.05)*Math.cos(y*0.05)*1.5);}
  tg.computeVertexNormals();
  const gc=document.createElement('canvas');gc.width=256;gc.height=256;
  const gx=gc.getContext('2d');gx.fillStyle='#33aa22';gx.fillRect(0,0,256,256);
  for(let i=0;i<8000;i++){const g2=100+rng()*100;gx.fillStyle=`rgb(${30+rng()*40},${g2},${20+rng()*30})`;gx.fillRect(rng()*256,rng()*256,2,3);}
  const gt=new THREE.CanvasTexture(gc);gt.wrapS=gt.wrapT=THREE.RepeatWrapping;gt.repeat.set(25,25);
  const terrain=new THREE.Mesh(tg,new THREE.MeshStandardMaterial({map:gt,roughness:0.95}));
  terrain.rotation.x=-Math.PI/2;terrain.position.y=-0.01;terrain.receiveShadow=true;
  scene.add(terrain);
}
buildTerrain();

// --- SCENERY ---
function buildScenery() {
  const sr=createRNG(SEED+1);
  function makeTree(x,z,s){
    const g=new THREE.Group();
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(0.3*s,0.5*s,3*s,6),new THREE.MeshStandardMaterial({color:0x8B4513,roughness:0.9}));
    trunk.position.y=1.5*s;trunk.castShadow=true;g.add(trunk);
    [0x228B22,0x229922,0x2d8f2d].forEach((c,i)=>{
      const f=new THREE.Mesh(new THREE.ConeGeometry((2.5-i*0.5)*s,2*s,6),new THREE.MeshStandardMaterial({color:c,roughness:0.8}));
      f.position.y=(3+i*1.2)*s;f.castShadow=true;g.add(f);
    });
    g.position.set(x,0,z);return g;
  }
  function makeRock(x,z,s){
    const r=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0),new THREE.MeshStandardMaterial({
      color:new THREE.Color(0.4+rng()*0.15,0.38+rng()*0.1,0.35+rng()*0.1),roughness:0.95,flatShading:true}));
    r.position.set(x,s*0.5,z);r.rotation.set(rng()*Math.PI,rng()*Math.PI,rng()*Math.PI);r.castShadow=true;return r;
  }
  for(let i=0;i<180;i++){
    const t=sr(),pos=trackCurve.getPointAt(t),tan=trackCurve.getTangentAt(t);
    const norm=new THREE.Vector3(-tan.z,0,tan.x).normalize();
    const side=sr()>0.5?1:-1,dist=TRACK_WIDTH/2+5+sr()*40;
    const x=pos.x+norm.x*side*dist,z=pos.z+norm.z*side*dist;
    const r=sr();
    if(r<0.4)scene.add(makeTree(x,z,0.7+sr()*0.8));
    else if(r<0.6)scene.add(makeRock(x,z,0.5+sr()*1.5));
    else if(r<0.72){
      const house=new THREE.Group();
      const wc=[0xff6644,0x4488ff,0xffaa22,0xcc44ff,0x44ddaa];
      const wall=new THREE.Mesh(new THREE.BoxGeometry(3,2.5,3),new THREE.MeshStandardMaterial({color:wc[Math.floor(sr()*wc.length)],roughness:0.7}));
      wall.position.y=1.25;wall.castShadow=true;house.add(wall);
      const roof=new THREE.Mesh(new THREE.ConeGeometry(2.5,1.5,4),new THREE.MeshStandardMaterial({color:0x883322,roughness:0.8}));
      roof.position.y=3.2;roof.rotation.y=Math.PI/4;roof.castShadow=true;house.add(roof);
      house.position.set(x,0,z);scene.add(house);
    }
  }
  // Billboards
  const bT=['APEX','TURBO','KART','RUSH','64!!','GO!'],bC=[0xff3300,0x0066ff,0xffcc00,0xff0066,0x00cc44,0x9933ff];
  for(let i=0;i<6;i++){
    const t=i/6,pos=trackCurve.getPointAt(t),tan=trackCurve.getTangentAt(t);
    const norm=new THREE.Vector3(-tan.z,0,tan.x).normalize();
    const x=pos.x+norm.x*(TRACK_WIDTH/2+3),z=pos.z+norm.z*(TRACK_WIDTH/2+3);
    const rotY=Math.atan2(tan.x,tan.z);
    const bb=new THREE.Group();
    for(let s=-1;s<=1;s+=2){const post=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,4,6),new THREE.MeshStandardMaterial({color:0x888888}));post.position.set(s*2.5,2,0);bb.add(post);}
    const bc=document.createElement('canvas');bc.width=128;bc.height=64;
    const bx=bc.getContext('2d');bx.fillStyle='#'+bC[i].toString(16).padStart(6,'0');bx.fillRect(0,0,128,64);
    bx.fillStyle='#fff';bx.font='bold 24px Arial';bx.textAlign='center';bx.fillText(bT[i],64,42);
    const board=new THREE.Mesh(new THREE.PlaneGeometry(5,2.5),new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(bc),roughness:0.6}));
    board.position.set(0,4,0);bb.add(board);
    bb.position.set(x,0,z);bb.rotation.y=rotY;scene.add(bb);
  }
  // Clouds
  for(let i=0;i<12;i++){
    const cloud=new THREE.Group();
    const cm=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,transparent:true,opacity:0.85});
    for(let j=0;j<3+Math.floor(sr()*4);j++){
      const p=new THREE.Mesh(new THREE.SphereGeometry(3+sr()*4,6,5),cm);
      p.position.set(sr()*6-3,sr()*2,sr()*4-2);p.scale.y=0.5;cloud.add(p);
    }
    cloud.position.set((sr()-0.5)*200,35+sr()*20,(sr()-0.5)*200);scene.add(cloud);
  }
}
buildScenery();

// ============================================================
//  KART MODEL
// ============================================================
function buildKart(kartColor, accentColor) {
  const kart = new THREE.Group();
  // Body
  const body=new THREE.Mesh(new THREE.BoxGeometry(1.4,0.7,2.4),new THREE.MeshStandardMaterial({color:kartColor,roughness:0.4,metalness:0.3}));
  body.position.y=0.65;body.castShadow=true;kart.add(body);
  // Hood
  const hood=new THREE.Mesh(new THREE.ConeGeometry(0.7,1.2,4),new THREE.MeshStandardMaterial({color:kartColor,roughness:0.4,metalness:0.3}));
  hood.rotation.x=Math.PI/2;hood.rotation.y=Math.PI/4;hood.position.set(0,0.7,1.6);hood.castShadow=true;kart.add(hood);
  // Seat
  const seat=new THREE.Mesh(new THREE.BoxGeometry(1.0,0.4,0.8),new THREE.MeshStandardMaterial({color:0x333333,roughness:0.8}));
  seat.position.set(0,0.85,-0.1);kart.add(seat);
  // Driver body
  const dB=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.6,0.5),new THREE.MeshStandardMaterial({color:accentColor,roughness:0.6}));
  dB.position.set(0,1.3,-0.15);dB.castShadow=true;kart.add(dB);
  // Head
  const hd=new THREE.Mesh(new THREE.SphereGeometry(0.3,8,6),new THREE.MeshStandardMaterial({color:0xffcc99,roughness:0.7}));
  hd.position.set(0,1.75,-0.15);hd.castShadow=true;kart.add(hd);
  // Helmet
  const hm=new THREE.Mesh(new THREE.SphereGeometry(0.32,8,6,0,Math.PI*2,0,Math.PI*0.6),new THREE.MeshStandardMaterial({color:accentColor,roughness:0.3,metalness:0.4}));
  hm.position.set(0,1.78,-0.15);hm.castShadow=true;kart.add(hm);
  // Handlebars
  const hb=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,1.2,6),new THREE.MeshStandardMaterial({color:0x888888,metalness:0.8}));
  hb.rotation.z=Math.PI/2;hb.position.set(0,1.35,0.3);kart.add(hb);
  // Wheels
  const wGeo=new THREE.CylinderGeometry(0.35,0.35,0.25,10);
  const wMat=new THREE.MeshStandardMaterial({color:0x222222,roughness:0.9});
  kart.wheels=[];
  [[-0.8,0.35,0.9],[0.8,0.35,0.9],[-0.85,0.35,-0.8],[0.85,0.35,-0.8]].forEach(wp=>{
    const w=new THREE.Mesh(wGeo,wMat);w.rotation.z=Math.PI/2;w.position.set(...wp);w.castShadow=true;kart.add(w);
    kart.wheels.push(w);
    const h=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,0.26,8),new THREE.MeshStandardMaterial({color:0xcccccc,metalness:0.7}));
    h.rotation.z=Math.PI/2;h.position.set(...wp);kart.add(h);
  });
  // Exhaust
  const ex=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.1,0.8,6),new THREE.MeshStandardMaterial({color:0x666666,metalness:0.6}));
  ex.rotation.x=Math.PI/2;ex.position.set(0.6,0.3,-1.4);kart.add(ex);
  // Spoiler
  const sw=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.08,0.4),new THREE.MeshStandardMaterial({color:accentColor,roughness:0.4,metalness:0.3}));
  sw.position.set(0,1.4,-1.1);sw.castShadow=true;kart.add(sw);
  for(let s=-1;s<=1;s+=2){
    const sp=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.5,4),new THREE.MeshStandardMaterial({color:0x888888,metalness:0.6}));
    sp.position.set(s*0.5,1.15,-1.1);kart.add(sp);
  }
  return kart;
}

// --- PLAYER KART ---
const playerKart = buildKart(0xee3333, 0xffaa00);
scene.add(playerKart);

const kart = {
  pos: tSamples[0].clone().add(new THREE.Vector3(
    -trackCurve.getTangentAt(0).z*2, 0, trackCurve.getTangentAt(0).x*2
  )),
  heading: Math.atan2(trackCurve.getTangentAt(0).x, trackCurve.getTangentAt(0).z),
  speed: 0,
  lateral: 0,
  drifting: false,
  driftDir: 0,
};
playerKart.position.copy(kart.pos);
playerKart.position.y = 0.01;
playerKart.rotation.y = kart.heading;

// ============================================================
//  GAME STATE
// ============================================================
const GS = {
  phase: 'menu',
  lap: 0,
  maxLaps: 1,
  startTime: 0,
  elapsed: 0,
  lastCP: -1,
  cpsPassed: new Set(),
  isDemo: false,
  countdownTimer: 0,
  countdownVal: 3,
};

// ============================================================
//  INPUT
// ============================================================
const keys = {};
addEventListener('keydown', e => {
  keys[e.code] = true;
  if ((e.code==='Enter'||e.code==='Space') && GS.phase==='menu') startRace(false);
  if (e.code==='KeyD' && e.shiftKey) { e.preventDefault(); if(GS.phase==='menu') startRace(true); }
  if (e.code==='Space') e.preventDefault();
});
addEventListener('keyup', e => { keys[e.code]=false; });

// ============================================================
//  TRACK UTILS
// ============================================================
function closestPt(wp) {
  let md=Infinity, bt=0, bi=0;
  for(let i=0;i<tSamples.length;i+=3){
    const dx=wp.x-tSamples[i].x, dz=wp.z-tSamples[i].z, d2=dx*dx+dz*dz;
    if(d2<md){md=d2;bi=i;bt=i/tSamples.length;}
  }
  const s=Math.max(0,bi-5), en=Math.min(tSamples.length-1,bi+5);
  for(let i=s;i<=en;i++){
    const dx=wp.x-tSamples[i].x, dz=wp.z-tSamples[i].z, d2=dx*dx+dz*dz;
    if(d2<md){md=d2;bi=i;bt=i/tSamples.length;}
  }
  return {t:bt, dist:Math.sqrt(md), idx:bi};
}
function isOnTrack(wp){ return closestPt(wp).dist < TRACK_WIDTH/2+1; }
function getCpForT(t){ for(let i=CP_COUNT-1;i>=0;i--) if(t>=i/CP_COUNT) return i; return 0; }

// ============================================================
//  LAP SYSTEM
// ============================================================
function updateLap() {
  const info = closestPt(kart.pos);
  const cp = getCpForT(info.t);
  if(GS.lastCP===-1){GS.lastCP=cp;return;}
  const prev=GS.lastCP;
  if(cp===(prev+1)%CP_COUNT){
    GS.cpsPassed.add(cp);
    GS.lastCP=cp;
    if(GS.cpsPassed.size>=CP_COUNT && info.t<0.05){
      GS.lap++;
      GS.cpsPassed.clear();
      if(GS.lap>=GS.maxLaps){GS.phase='finished';showFinish();}
    }
  }
  if(cp-prev<-2){GS.cpsPassed.clear();GS.lastCP=cp;}
}

// ============================================================
//  DEMO / AI
// ============================================================
let demoRNG = createRNG(SEED+100);
const demo = { steerTimer: 0, boostTimer: 0 };

function updateAI(dt) {
  const info = closestPt(kart.pos);
  const aheadT = (info.t + 0.025) % 1;
  const target = trackCurve.getPointAt(aheadT);
  const dx = target.x - kart.pos.x, dz = target.z - kart.pos.z;
  const tAngle = Math.atan2(dx, dz);
  let steer = tAngle - kart.heading;
  while(steer>Math.PI) steer-=Math.PI*2;
  while(steer<-Math.PI) steer+=Math.PI*2;

  keys.ArrowUp = keys.KeyW = true;
  keys.ArrowLeft = keys.KeyA = steer < -0.05;
  keys.ArrowRight = keys.KeyD = steer > 0.05;

  const sharpness = Math.abs(steer);
  keys.Space = sharpness > 0.6;
  if(sharpness > 0.5 && kart.speed > 15) {
    keys.ArrowDown = keys.KeyS = true;
  }
}

// ============================================================
//  PHYSICS UPDATE
// ============================================================
function updatePhysics(dt) {
  dt = Math.min(dt, 0.033);
  if (GS.isDemo) updateAI(dt);

  const accelIn = keys.ArrowUp || keys.KeyW;
  const brakeIn = keys.ArrowDown || keys.KeyS;
  const leftIn = keys.ArrowLeft || keys.KeyA;
  const rightIn = keys.ArrowRight || keys.KeyD;
  const handbrake = keys.Space;

  const onRoad = isOnTrack(kart.pos);
  const drag = onRoad ? 1.0 : OFF_ROAD;

  // Acceleration
  if (accelIn) {
    kart.speed += ACCEL * dt;
  } else if (brakeIn) {
    if (kart.speed > 1) {
      kart.speed -= BRAKE_F * dt;
    } else {
      kart.speed -= ACCEL * 0.4 * dt;
    }
  } else {
    kart.speed *= FRICTION;
    if (Math.abs(kart.speed) < 0.1) kart.speed = 0;
  }
  kart.speed = Math.max(-REV_SPEED, Math.min(MAX_SPEED, kart.speed));
  kart.speed *= drag;

  // Steering
  let steerAmount = 0;
  if (leftIn) steerAmount -= 1;
  if (rightIn) steerAmount += 1;

  const speedFactor = Math.min(1, Math.abs(kart.speed) / 8);
  const turnRate = STEER_SPD * speedFactor;
  const dir = kart.speed >= 0 ? 1 : -1;
  kart.heading += steerAmount * turnRate * dt * dir;

  // Drift mechanics
  if (handbrake && Math.abs(kart.speed) > 5 && Math.abs(steerAmount) > 0) {
    kart.drifting = true;
    kart.driftDir = steerAmount;
  }
  if (kart.drifting) {
    kart.heading += kart.driftDir * STEER_SPD * 0.5 * dt * dir;
    if (!handbrake || Math.abs(steerAmount) < 0.1) {
      kart.drifting = false;
      // Drift exit speed boost
      kart.speed = Math.min(kart.speed * 1.08, MAX_SPEED);
    }
  }

  // Move kart
  kart.pos.x += Math.sin(kart.heading) * kart.speed * dt;
  kart.pos.z += Math.cos(kart.heading) * kart.speed * dt;

  // Update kart mesh
  playerKart.position.copy(kart.pos);
  playerKart.position.y = 0.01;
  playerKart.rotation.y = kart.heading;

  // Wheel spin animation
  const spinRate = kart.speed * dt * 2;
  playerKart.wheels.forEach((w, i) => {
    w.rotation.x += spinRate;
    // Front wheels steer
    if (i < 2) {
      w.rotation.y = -steerAmount * 0.3;
    }
  });

  // Kart body tilt
  playerKart.rotation.z = -steerAmount * kart.speed * 0.002;
  playerKart.rotation.x = accelIn ? -0.02 : (brakeIn ? 0.03 : 0);
}

// ============================================================
//  CAMERA
// ============================================================
function updateCamera() {
  const behind = new THREE.Vector3(-Math.sin(kart.heading), 0, -Math.cos(kart.heading));
  const camTarget = kart.pos.clone().add(behind.multiplyScalar(12));
  camTarget.y = 6;

  camera.position.lerp(camTarget, 0.08);

  const lookTarget = kart.pos.clone();
  lookTarget.y += 1;
  const ahead = new THREE.Vector3(Math.sin(kart.heading), 0, Math.cos(kart.heading)).multiplyScalar(15);
  lookTarget.add(ahead);

  camera.lookAt(lookTarget);
}

// ============================================================
//  MINIMAP
// ============================================================
const minimapCanvas = document.getElementById('minimap');
const mmCtx = minimapCanvas.getContext('2d');

function updateMinimap() {
  const W = 160, H = 160;
  mmCtx.clearRect(0, 0, W, H);

  // Background
  mmCtx.fillStyle = 'rgba(30,80,30,0.7)';
  mmCtx.fillRect(0, 0, W, H);

  // Track
  mmCtx.strokeStyle = '#888';
  mmCtx.lineWidth = 6;
  mmCtx.beginPath();
  let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
  tSamples.forEach(p=>{minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minZ=Math.min(minZ,p.z);maxZ=Math.max(maxZ,p.z);});
  const pad=10;
  const rangeX=maxX-minX+pad*2, rangeZ=maxZ-minZ+pad*2;
  const sc2=Math.min((W-20)/rangeX,(H-20)/rangeZ);
  const offX=(W-rangeX*sc2)/2, offZ=(H-rangeZ*sc2)/2;

  tSamples.forEach((p,i)=>{
    const x=(p.x-minX+pad)*sc2+offX;
    const y=(p.z-minZ+pad)*sc2+offZ;
    if(i===0)mmCtx.moveTo(x,y);else mmCtx.lineTo(x,y);
  });
  mmCtx.closePath();
  mmCtx.stroke();

  // Kart dot
  const kx=(kart.pos.x-minX+pad)*sc2+offX;
  const ky=(kart.pos.z-minZ+pad)*sc2+offZ;
  mmCtx.fillStyle='#ff0000';
  mmCtx.beginPath();mmCtx.arc(kx,ky,4,0,Math.PI*2);mmCtx.fill();
  mmCtx.strokeStyle='#fff';mmCtx.lineWidth=1;mmCtx.stroke();

  // Direction indicator
  const dx=Math.sin(kart.heading)*8, dy=Math.cos(kart.heading)*8;
  mmCtx.strokeStyle='#ff0';mmCtx.lineWidth=2;
  mmCtx.beginPath();mmCtx.moveTo(kx,ky);mmCtx.lineTo(kx+dx,ky+dy);mmCtx.stroke();
}

// ============================================================
//  HUD UPDATE
// ============================================================
function updateHUD() {
  // Speed
  const speedKmh = Math.abs(Math.round(kart.speed * 3.6));
  document.getElementById('speed-text').textContent = speedKmh + ' km/h';
  document.getElementById('speed-bar').style.width = (Math.abs(kart.speed)/MAX_SPEED*100) + '%';

  // Lap
  document.getElementById('lap-value').textContent = GS.lap + ' / ' + GS.maxLaps;

  // Time
  if (GS.phase === 'racing') {
    GS.elapsed = (performance.now() - GS.startTime) / 1000;
  }
  const mins = Math.floor(GS.elapsed / 60);
  const secs = (GS.elapsed % 60).toFixed(2);
  document.getElementById('time-value').textContent = mins + ':' + secs.padStart(5, '0');
}

// ============================================================
//  SCREENS
// ============================================================
function startRace(isDemo) {
  GS.isDemo = isDemo;
  GS.phase = 'countdown';
  GS.countdownTimer = 0;
  GS.countdownVal = 3;
  GS.lap = 0;
  GS.elapsed = 0;
  GS.lastCP = -1;
  GS.cpsPassed.clear();
  kart.speed = 0;
  kart.drifting = false;
  kart.pos.copy(tSamples[0]);
  kart.pos.x += -trackCurve.getTangentAt(0).z * 2;
  kart.pos.z += trackCurve.getTangentAt(0).x * 2;
  kart.heading = Math.atan2(trackCurve.getTangentAt(0).x, trackCurve.getTangentAt(0).z);

  document.getElementById('overlay').classList.add('hidden');
  document.getElementById('countdown').style.display = 'block';

  if (isDemo) {
    document.getElementById('demo-badge').classList.add('show');
  } else {
    document.getElementById('demo-badge').classList.remove('show');
  }
}

function showFinish() {
  const overlay = document.getElementById('overlay');
  overlay.classList.remove('hidden');
  overlay.innerHTML = `
    <h1>&#127942; FINISH! &#127942;</h1>
    <h2>Turbo Circuit Complete!</h2>
    <div class="result-text">Time: ${document.getElementById('time-value').textContent}</div>
    <div class="prompt" style="margin-top:30px">Press ENTER for another race</div>
    <div class="controls-info" style="margin-top:20px;font-size:13px">SHIFT+D for Demo Mode</div>
  `;
  document.getElementById('countdown').style.display = 'none';
  // Rebind Enter
  addEventListener('keydown', function finishHandler(e) {
    if (e.code === 'Enter' || e.code === 'Space') {
      removeEventListener('keydown', finishHandler);
      resetToMenu();
    }
    if (e.code === 'KeyD' && e.shiftKey) {
      removeEventListener('keydown', finishHandler);
      resetToMenu();
      startRace(true);
    }
  });
}

function resetToMenu() {
  GS.phase = 'menu';
  GS.isDemo = false;
  GS.lap = 0;
  GS.elapsed = 0;
  document.getElementById('demo-badge').classList.remove('show');
  const overlay = document.getElementById('overlay');
  overlay.classList.remove('hidden');
  overlay.innerHTML = `
    <h1>APEX KARTS 64</h1>
    <h2>&#129332; Turbo Circuit &#129332;</h2>
    <div class="subtitle">A Retro Kart Racing Microgame</div>
    <div class="prompt" id="start-prompt">Press ENTER or SPACE to Start</div>
    <div class="prompt" style="margin-top:10px;font-size:16px;color:#ff8800">Press SHIFT+D for Demo Mode</div>
    <div class="controls-info">
      <strong>Controls:</strong><br>
      &#8593; / W &#8212; Accelerate &nbsp; &#8595; / S &#8212; Brake/Reverse<br>
      &#8592; / A &nbsp; &#8594; / D &#8212; Steer &nbsp;&nbsp; SPACE &#8212; Handbrake<br>
      ENTER &#8212; Start Race &nbsp; SHIFT+D &#8212; Toggle Demo
    </div>
  `;
}

// ============================================================
//  PARTICLES (dust when off-road, sparks when drifting)
// ============================================================
const particles = [];
function spawnParticle(pos, vel, color, life, size) {
  particles.push({
    pos: pos.clone(), vel, color, life, maxLife: life, size
  });
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.pos.add(p.vel.clone().multiplyScalar(dt));
    p.vel.y -= 5 * dt;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

// Use sprite-based particles
const particleTex = (() => {
  const c = document.createElement('canvas');
  c.width = 32; c.height = 32;
  const cx = c.getContext('2d');
  const grad = cx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  cx.fillStyle = grad;
  cx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
})();

const particleMat = new THREE.SpriteMaterial({
  map: particleTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
});
const particleSprites = [];
for (let i = 0; i < 100; i++) {
  const sprite = new THREE.Sprite(particleMat.clone());
  sprite.visible = false;
  scene.add(sprite);
  particleSprites.push(sprite);
}

function renderParticles() {
  let idx = 0;
  for (let i = 0; i < particles.length && idx < 100; i++, idx++) {
    const p = particles[i];
    const s = particleSprites[idx];
    s.visible = true;
    s.position.copy(p.pos);
    s.material.color.setHex(p.color);
    s.material.opacity = (p.life / p.maxLife) * 0.8;
    s.scale.setScalar(p.size * (p.life / p.maxLife));
  }
  for (let i = idx; i < 100; i++) particleSprites[i].visible = false;
}

function emitParticles(dt) {
  // Off-road dust
  if (!isOnTrack(kart.pos) && Math.abs(kart.speed) > 3) {
    for (let i = 0; i < 2; i++) {
      spawnParticle(
        kart.pos.clone().add(new THREE.Vector3(rng()*2-1, 0.5, rng()*2-1)),
        new THREE.Vector3((rng()-0.5)*3, rng()*2+1, (rng()-0.5)*3),
        0xccaa66, 0.5 + rng()*0.5, 0.8
      );
    }
  }
  // Drift sparks
  if (kart.drifting && Math.abs(kart.speed) > 8) {
    for (let i = 0; i < 3; i++) {
      spawnParticle(
        kart.pos.clone().add(new THREE.Vector3(
          Math.sin(kart.heading)*0.5, 0.3, Math.cos(kart.heading)*0.5
        )),
        new THREE.Vector3((rng()-0.5)*6, rng()*4+2, (rng()-0.5)*6),
        0xffaa00, 0.3 + rng()*0.3, 0.4
      );
    }
  }
}

// ============================================================
//  MAIN GAME LOOP
// ============================================================
let lastTime = 0;
const countdownEl = document.getElementById('countdown');

function gameLoop(time) {
  requestAnimationFrame(gameLoop);
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  if (GS.phase === 'countdown') {
    GS.countdownTimer += dt;
    if (GS.countdownTimer >= 1) {
      GS.countdownTimer = 0;
      GS.countdownVal--;
      if (GS.countdownVal > 0) {
        countdownEl.textContent = GS.countdownVal;
        countdownEl.style.display = 'block';
      } else {
        countdownEl.textContent = 'GO!';
        countdownEl.style.color = '#00ff44';
        GS.phase = 'racing';
        GS.startTime = performance.now();
        setTimeout(() => {
          countdownEl.style.display = 'none';
          countdownEl.style.color = '#ffcc00';
        }, 600);
      }
    }
    updateCamera();
  }

  if (GS.phase === 'racing') {
    updatePhysics(dt);
    updateLap();
    emitParticles(dt);
    updateParticles(dt);
    updateCamera();
    updateHUD();
    updateMinimap();
  }

  if (GS.phase === 'finished') {
    updatePhysics(dt);
    emitParticles(dt);
    updateParticles(dt);
    updateCamera();
    updateHUD();
  }

  renderParticles();
  renderer.render(scene, camera);
}

// ============================================================
//  RESIZE HANDLER
// ============================================================
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ============================================================
//  EXPOSE FOR PLAYWRIGHT / DEBUG
// ============================================================
window.GS = GS;
window.kartState = kart;
window.gameStart = startRace;

// ============================================================
//  START
// ============================================================
requestAnimationFrame(gameLoop);
