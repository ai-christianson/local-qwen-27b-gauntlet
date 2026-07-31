import * as THREE from 'three';

// ===== SEEDED PRNG =====
function rng(seed){let s=seed|0;return function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const R=rng(42);

// ===== SCENE SETUP =====
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x1a0a2e);
scene.fog=new THREE.FogExp2(0x1a0a2e,0.004);

const cam=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,0.1,500);
const ren=new THREE.WebGLRenderer({antialias:true});
ren.setSize(innerWidth,innerHeight);
ren.setPixelRatio(Math.min(devicePixelRatio,2));
ren.shadowMap.enabled=true;
ren.shadowMap.type=THREE.PCFSoftShadowMap;
ren.toneMapping=THREE.ACESFilmicToneMapping;
ren.toneMappingExposure=1.1;
document.body.insertBefore(ren.domElement,document.getElementById('ui'));

// Lights
scene.add(new THREE.AmbientLight(0x334466,0.6));
const sun=new THREE.DirectionalLight(0xffeedd,1.4);
sun.position.set(50,80,30);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-80;sun.shadow.camera.right=80;
sun.shadow.camera.top=80;sun.shadow.camera.bottom=-80;
sun.shadow.camera.near=10;sun.shadow.camera.far=200;
scene.add(sun);
scene.add(new THREE.HemisphereLight(0x88aaff,0x445500,0.5));

// Materials
const M={
  road:new THREE.MeshLambertMaterial({color:0x3a3a4a}),
  grass:new THREE.MeshLambertMaterial({color:0x33aa33}),
  barR:new THREE.MeshLambertMaterial({color:0xff3333}),
  barW:new THREE.MeshLambertMaterial({color:0xffffff}),
  water:new THREE.MeshPhongMaterial({color:0x0066cc,shininess:100,transparent:true,opacity:0.75}),
  tree:new THREE.MeshLambertMaterial({color:0x227722}),
  trunk:new THREE.MeshLambertMaterial({color:0x664422}),
  rock:new THREE.MeshLambertMaterial({color:0x666677}),
  check:new THREE.MeshLambertMaterial({color:0xffffff}),
  kart:new THREE.MeshPhongMaterial({color:0xff4422,shininess:80}),
  kartD:new THREE.MeshPhongMaterial({color:0x222233,shininess:60}),
  wheel:new THREE.MeshPhongMaterial({color:0x111111,shininess:40}),
  drv:new THREE.MeshPhongMaterial({color:0xffcc44,shininess:60}),
  helm:new THREE.MeshPhongMaterial({color:0xff6600,shininess:80}),
};

// ===== TRACK =====
const TW=10,SEG=250;
const trackPts=[
  [0,0,0],[18,0,8],[35,0,8],[48,0,3],[55,0,10],
  [58,0,25],[50,0,40],[40,0,52],[25,0,58],[10,0,60],
  [-5,0,55],[-15,0,45],[-18,0,30],[-15,0,15],[-5,0,8]
].map(v=>new THREE.Vector3(...v));
const curve=new THREE.CatmullRomCurve3(trackPts,true,'catmullrom',0.5);
const trackLen=curve.getLength();

function buildTrack(){
  const g=new THREE.Group();
  for(let i=0;i<SEG;i++){
    const t1=i/SEG,t2=(i+1)/SEG;
    const p1=curve.getPointAt(t1),p2=curve.getPointAt(t2);
    const t1v=curve.getTangentAt(t1);t1v.y=0;t1v.normalize();
    const t2v=curve.getTangentAt(t2);t2v.y=0;t2v.normalize();
    const r1=new THREE.Vector3(-t1v.z,0,t1v.x);
    const r2=new THREE.Vector3(-t2v.z,0,t2v.x);
    const hw=TW/2;
    const v=new Float32Array([
      p1.x+r1.x*-hw,p1.y,p1.z+r1.z*-hw,p1.x+r1.x*hw,p1.y,p1.z+r1.z*hw,
      p2.x+r2.x*-hw,p2.y,p2.z+r2.z*-hw,p2.x+r2.x*hw,p2.y,p2.z+r2.z*hw
    ]);
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(v,3));
    geo.setIndex([0,1,2,2,1,3]);geo.computeVertexNormals();
    const m=new THREE.Mesh(geo,M.road);m.receiveShadow=true;g.add(m);
  }
  // Center dashes
  for(let i=0;i<SEG;i+=4){
    const t=i/SEG,p=curve.getPointAt(t),tv=curve.getTangentAt(t);
    tv.y=0;tv.normalize();
    const d=new THREE.Mesh(new THREE.PlaneGeometry(0.12,0.7),new THREE.MeshLambertMaterial({color:0xffff88,emissive:0x333300}));
    d.rotation.x=-Math.PI/2;d.position.set(p.x,0.02,p.z);
    d.rotation.z=-Math.atan2(tv.z,tv.x);g.add(d);
  }
  // Barriers
  for(let i=0;i<SEG;i+=4){
    const t=i/SEG,p=curve.getPointAt(t),tv=curve.getTangentAt(t);
    tv.y=0;tv.normalize();const r=new THREE.Vector3(-tv.z,0,tv.x);
    const hw=TW/2+0.6,mat=Math.floor(i/8)%2===0?M.barR:M.barW;
    for(const s of[-1,1]){
      const bp=p.clone().add(r.clone().multiplyScalar(hw*s));
      const b=new THREE.Mesh(new THREE.BoxGeometry(0.8,1.2,0.8),mat);
      b.position.set(bp.x,0.6,bp.z);b.castShadow=true;b.receiveShadow=true;g.add(b);
    }
  }
  scene.add(g);
}

function buildTerrain(){
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(300,300),M.grass);
  ground.rotation.x=-Math.PI/2;ground.position.y=-0.1;ground.receiveShadow=true;
  scene.add(ground);
  const water=new THREE.Mesh(new THREE.CircleGeometry(14,24),M.water);
  water.rotation.x=-Math.PI/2;water.position.set(25,-0.05,30);scene.add(water);
  // Trees
  for(let i=0;i<70;i++){
    const t=R(),p=curve.getPointAt(t),tv=curve.getTangentAt(t);
    tv.y=0;tv.normalize();const r=new THREE.Vector3(-tv.z,0,tv.x);
    const side=R()>0.5?1:-1,dist=TW/2+8+R()*25;
    const pos=p.clone().add(r.clone().multiplyScalar(dist*side));
    const g=new THREE.Group(),h=R()*3+2;
    const tk=new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.4,h*0.4,6),M.trunk);
    tk.position.y=h*0.2;tk.castShadow=true;g.add(tk);
    for(let l=0;l<3;l++){
      const lh=h*0.35,lr=(h*0.5)*(1-l*0.2);
      const c=new THREE.Mesh(new THREE.ConeGeometry(lr,lh,6),M.tree);
      c.position.y=h*0.35+l*lh*0.5;c.castShadow=true;g.add(c);
    }
    g.position.copy(pos);g.rotation.y=R()*Math.PI*2;scene.add(g);
  }
  // Rocks
  for(let i=0;i<35;i++){
    const t=R(),p=curve.getPointAt(t),tv=curve.getTangentAt(t);
    tv.y=0;tv.normalize();const r=new THREE.Vector3(-tv.z,0,tv.x);
    const side=R()>0.5?1:-1,dist=TW/2+5+R()*18;
    const pos=p.clone().add(r.clone().multiplyScalar(dist*side));
    const rk=new THREE.Mesh(new THREE.DodecahedronGeometry(1+R()*1.5,0),M.rock);
    rk.position.set(pos.x,0.5,pos.z);rk.rotation.set(R()*Math.PI,R()*Math.PI,0);
    rk.scale.y=0.6;rk.castShadow=true;scene.add(rk);
  }
}

function buildStartFinish(){
  const p=curve.getPointAt(0),tv=curve.getTangentAt(0);
  tv.y=0;tv.normalize();const r=new THREE.Vector3(-tv.z,0,tv.x);
  const rot=-Math.atan2(tv.z,tv.x);
  const line=new THREE.Mesh(new THREE.PlaneGeometry(TW,1.5),M.check);
  line.rotation.x=-Math.PI/2;line.position.set(p.x,0.05,p.z);line.rotation.z=rot;
  scene.add(line);
  const archM=new THREE.MeshPhongMaterial({color:0xffaa00,emissive:0x332200});
  for(const s of[-1,1]){
    const pp=p.clone().add(r.clone().multiplyScalar((TW/2+1.5)*s));
    const pil=new THREE.Mesh(new THREE.BoxGeometry(1.2,6,1.2),archM);
    pil.position.set(pp.x,3,pp.z);pil.castShadow=true;scene.add(pil);
  }
  const top=new THREE.Mesh(new THREE.BoxGeometry(TW+5,1.2,1.2),new THREE.MeshPhongMaterial({color:0xff6600,emissive:0x331100}));
  top.position.set(p.x,6.5,p.z);top.rotation.y=-rot;top.castShadow=true;scene.add(top);
}

// ===== KART MODEL =====
function makeKart(){
  const k=new THREE.Group();
  const ch=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.6,2.8),M.kart);
  ch.position.y=0.55;ch.castShadow=true;k.add(ch);
  const tb=new THREE.Mesh(new THREE.BoxGeometry(1.4,0.4,1.0),M.kartD);
  tb.position.set(0,0.9,0.4);tb.castShadow=true;k.add(tb);
  const sp=new THREE.Mesh(new THREE.BoxGeometry(1.8,0.12,0.5),M.kartD);
  sp.position.set(0,1.35,-1.3);sp.castShadow=true;k.add(sp);
  [-0.6,0.6].forEach(x=>{const s=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.4,0.12),M.kartD);s.position.set(x,1.1,-1.3);k.add(s);});
  const db=new THREE.Mesh(new THREE.BoxGeometry(0.8,0.9,0.6),M.drv);
  db.position.set(0,1.15,0.25);db.castShadow=true;k.add(db);
  const hd=new THREE.Mesh(new THREE.BoxGeometry(0.55,0.55,0.55),M.helm);
  hd.position.set(0,1.72,0.25);hd.castShadow=true;k.add(hd);
  const vs=new THREE.Mesh(new THREE.BoxGeometry(0.45,0.15,0.1),new THREE.MeshPhongMaterial({color:0x00aaff,emissive:0x003344}));
  vs.position.set(0,1.72,0.52);k.add(vs);
  const wg=new THREE.CylinderGeometry(0.32,0.32,0.28,8);
  const wp=[[-0.85,0.32,0.85],[0.85,0.32,0.85],[-0.85,0.32,-1],[0.85,0.32,-1]];
  k.wheels=[];
  wp.forEach(([x,y,z])=>{const w=new THREE.Mesh(wg,M.wheel);w.position.set(x,y,z);w.rotation.z=Math.PI/2;w.castShadow=true;k.add(w);k.wheels.push(w);});
  wp.forEach(([x,y,z])=>{const f=new THREE.Mesh(new THREE.BoxGeometry(0.55,0.08,0.55),M.kartD);f.position.set(x,0.65,z);k.add(f);});
  return k;
}

// ===== GAME STATE =====
const GS={started:false,finished:false,demo:false,demoT:0,raceT:0,lap:0,cpPassed:0,lastCp:-1,cdTimer:0,cdPhase:0};
const P={t:0.02,lat:0,spd:0,head:0,steer:0,raceDist:0};
const PHY={maxSpd:28,boostSpd:42,accel:18,brake:30,friction:2.5,turnSpd:2.8,latDamp:3,offRoad:0.65,maxLat:TW/2+4};
const CP_COUNT=10;
const cps=[];for(let i=0;i<CP_COUNT;i++)cps.push(i/CP_COUNT);

// Input
const keys={};
window.addEventListener('keydown',e=>{
  keys[e.code]=true;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
  if(!GS.started&&(e.code==='Space'||e.code==='Enter'))startGame(false);
  if(e.code==='KeyD'&&!GS.started)startGame(true);
  if(e.code==='KeyR')resetGame();
});
window.addEventListener('keyup',e=>{keys[e.code]=false;});
document.getElementById('demoBtn').addEventListener('click',()=>startGame(true));

// Demo sequence
const demoSeq=generateDemo();
function generateDemo(){
  const s=[];let t=0;const total=38,step=0.12,dr=rng(123);
  while(t<total){
    const e={time:t,up:true,down:false,left:false,right:false,boost:false,brake:false};
    const ct=(t/total)%1;
    const t1=curve.getTangentAt(ct),t2=curve.getTangentAt((ct+0.008)%1);
    const curv=Math.atan2(t2.x,t2.z)-Math.atan2(t1.x,t1.z);
    if(Math.abs(curv)>0.015){e.left=curv>0;e.right=curv<0;if(Math.abs(curv)>0.06)e.up=false;}
    if(Math.abs(curv)>0.09){e.brake=true;e.up=false;}
    if(t>6&&t<32&&dr()<0.04&&Math.abs(curv)<0.02)e.boost=true;
    s.push(e);t+=step;
  }
  return s;
}
function getDemoInput(time){
  let b=demoSeq[0];
  for(let i=0;i<demoSeq.length;i++){if(demoSeq[i].time<=time)b=demoSeq[i];else break;}
  return b;
}

// UI
const $sp=document.getElementById('hSpd'),$sb=document.getElementById('spg'),$tm=document.getElementById('hTime');
const $lp=document.getElementById('hLap'),$msg=document.getElementById('msg'),$pop=document.getElementById('lp');
const $start=document.getElementById('start');
const miniC=document.querySelector('#mini canvas'),mctx=miniC.getContext('2d');
function fmtTime(s){const m=Math.floor(s/60);return `${String(m).padStart(2,'0')}:${(s%60).toFixed(2).padStart(5,'0')}`}
function showMsg(t){$msg.textContent=t;$msg.style.display='block'}
function hideMsg(){$msg.style.display='none'}
function showPop(t){$pop.textContent=t;$pop.style.display='block';$pop.style.opacity='1';$pop.style.transition='opacity .5s';setTimeout(()=>$pop.style.opacity='0',1500);setTimeout(()=>$pop.style.display='none',2000)}

function drawMinimap(){
  const ctx=mctx,w=150,h=150;ctx.clearRect(0,0,w,h);
  let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
  for(let i=0;i<SEG;i+=5){const p=curve.getPointAt(i/SEG);minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minZ=Math.min(minZ,p.z);maxZ=Math.max(maxZ,p.z);}
  const rx=maxX-minX+10,rz=maxZ-minZ+10;
  const sc=Math.min((w-20)/rx,(h-20)/rz),ox=(w-rx*sc)/2,oz=(h-rz*sc)/2;
  function mp(p){return{x:(p.x-minX+5)*sc+ox,y:(p.z-minZ+5)*sc+oz}}
  ctx.strokeStyle='#555';ctx.lineWidth=4;ctx.beginPath();
  for(let i=0;i<=SEG;i+=2){const p=curve.getPointAt(i/SEG),m=mp(p);if(i===0)ctx.moveTo(m.x,m.y);else ctx.lineTo(m.x,m.y);}
  ctx.closePath();ctx.stroke();
  const kp=getKartPos(),km=mp(kp);
  ctx.fillStyle='#f42';ctx.beginPath();ctx.arc(km.x,km.y,3,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();
  const sp2=curve.getPointAt(0),sm=mp(sp2);
  ctx.fillStyle='#0f8';ctx.fillRect(sm.x-2,sm.y-2,4,4);
}

function getKartPos(){
  const t=((P.t%1)+1)%1,p=curve.getPointAt(t),tv=curve.getTangentAt(t);
  tv.y=0;tv.normalize();const r=new THREE.Vector3(-tv.z,0,tv.x);
  return p.clone().add(r.clone().multiplyScalar(P.lat));
}

const kartMesh=makeKart();scene.add(kartMesh);

function updateKart(){
  const t=((P.t%1)+1)%1,p=curve.getPointAt(t),tv=curve.getTangentAt(t);
  tv.y=0;tv.normalize();const r=new THREE.Vector3(-tv.z,0,tv.x);
  const pos=p.clone().add(r.clone().multiplyScalar(P.lat));
  kartMesh.position.copy(pos);
  kartMesh.rotation.y=Math.atan2(tv.z,tv.x)+P.head;
  kartMesh.rotation.z=-P.steer*0.15;
  kartMesh.wheels.forEach((w,i)=>{w.rotation.x=P.raceDist+(i<2?P.steer*0.3:0);});
}

// Camera
let camPos=new THREE.Vector3(),camLook=new THREE.Vector3();
function updateCamera(){
  const kp=kartMesh.position.clone(),h=kartMesh.rotation.y;
  const sp=new THREE.Vector3(0,5.5,-11).applyAxisAngle(new THREE.Vector3(0,1,0),h);
  const dp=kp.clone().add(sp);
  const lp=new THREE.Vector3(0,1.5,5).applyAxisAngle(new THREE.Vector3(0,1,0),h);
  const lkp=kp.clone().add(lp);
  if(camPos.length()===0)camPos.copy(dp);
  if(camLook.length()===0)camLook.copy(lkp);
  camPos.lerp(dp,0.1);camLook.lerp(lkp,0.15);
  cam.position.copy(camPos);cam.lookAt(camLook);
}

function updatePhysics(dt){
  if(!GS.started||GS.finished||GS.cdPhase<3)return;
  let up=keys.ArrowUp||keys.KeyW,down=keys.ArrowDown||keys.KeyS;
  let left=keys.ArrowLeft||keys.KeyA,right=keys.ArrowRight||keys.KeyD;
  let boost=keys.ShiftLeft||keys.ShiftRight;brake=keys.Space;
  if(GS.demo){const di=getDemoInput(GS.demoT);up=di.up;down=di.down;left=di.left;right=di.right;boost=di.boost;brake=di.brake;GS.demoT+=dt;}
  const maxSpd=boost?PHY.boostSpd:PHY.maxSpd;
  if(up)P.spd=Math.min(P.spd+PHY.accel*dt,maxSpd);
  if(down)P.spd=Math.max(P.spd-PHY.brake*dt,-maxSpd*0.3);
  if(brake){if(P.spd>0)P.spd=Math.max(0,P.spd-PHY.brake*dt);else if(P.spd<0)P.spd=Math.min(0,P.spd+PHY.brake*dt);}
  if(!up&&!down){if(P.spd>0)P.spd=Math.max(0,P.spd-PHY.friction*dt);else if(P.spd<0)P.spd=Math.min(0,P.spd+PHY.friction*dt);}
  if(Math.abs(P.lat)>TW/2-0.5)P.spd*=Math.pow(PHY.offRoad,dt);
  const si=(left?-1:0)+(right?1:0),sr=PHY.turnSpd*dt;
  if(si!==0){P.steer+=si*sr*3;P.steer=Math.max(-1,Math.min(1,P.steer));}else{P.steer*=Math.pow(0.05,dt);}
  P.head+=P.steer*sr*(0.5+0.5*Math.min(Math.abs(P.spd)/10,1));
  if(si!==0)P.lat+=si*6*dt;
  P.lat*=(1-PHY.latDamp*dt);P.lat=Math.max(-PHY.maxLat,Math.min(PHY.maxLat,P.lat));
  P.t+=(P.spd/trackLen)*dt;P.t=((P.t%1)+1)%1;
  P.raceDist+=Math.abs(P.spd)*dt*0.3;
  checkCP();
}

function checkCP(){
  const t=P.t;
  for(let i=0;i<CP_COUNT;i++){
    let passed=false;
    if(i<CP_COUNT-1){if(t>=cps[i]&&t<cps[i+1]&&GS.lastCp<i)passed=true;}
    else{if((t>cps[i]||t<0.02)&&GS.lastCp>=CP_COUNT-2)passed=true;}
    if(passed&&GS.lastCp!==i){
      GS.cpPassed++;GS.lastCp=i;
      if(i===CP_COUNT-1){
        GS.lap++;GS.lastCp=-1;GS.cpPassed=0;
        if(GS.lap>=1){GS.finished=true;showMsg('FINISH!\n'+fmtTime(GS.raceT));showPop('LAP COMPLETE!');}
        else showPop('LAP '+GS.lap+' COMPLETE!');
      }
    }
  }
}

function doCountdown(){GS.cdTimer=0;GS.cdPhase=1;$start.style.display='none';showMsg('3');}
function updateCountdown(dt){
  if(GS.cdPhase===0)return;
  GS.cdTimer+=dt;
  if(GS.cdPhase===1){
    const phases=[{t:0.5,text:'3'},{t:1.5,text:'2'},{t:2.5,text:'1'},{t:3.5,text:'GO!'},{t:4.5,text:''}];
    for(let i=phases.length-1;i>=0;i--){
      if(GS.cdTimer>=phases[i].t){
        if(phases[i].text){showMsg(phases[i].text);if(phases[i].text==='GO!'){GS.cdPhase=2;GS.started=true;}}
        else{hideMsg();GS.cdPhase=3;}
        break;
      }
    }
  }
}

function updateUI(){
  const spd=Math.abs(P.spd)*3.6;
  $sp.textContent=Math.round(spd)+' km/h';
  $sb.style.width=Math.min(100,Math.abs(P.spd)/PHY.maxSpd*100)+'%';
  $tm.textContent=fmtTime(GS.raceT);
  $lp.textContent=GS.lap+' / 1';
}

function startGame(demo){
  GS.demo=demo;GS.demoT=0;GS.started=true;GS.finished=false;
  GS.raceT=0;GS.lap=0;GS.cpPassed=0;GS.lastCp=-1;
  P.t=0.02;P.lat=0;P.spd=0;P.head=0;P.steer=0;P.raceDist=0;
  camPos=new THREE.Vector3();camLook=new THREE.Vector3();
  doCountdown();
}

function resetGame(){
  GS.started=false;GS.finished=false;GS.cdPhase=0;GS.demo=false;GS.demoT=0;
  GS.raceT=0;GS.lap=0;GS.cpPassed=0;GS.lastCp=-1;
  P.t=0.02;P.lat=0;P.spd=0;P.head=0;P.steer=0;P.raceDist=0;
  camPos=new THREE.Vector3();camLook=new THREE.Vector3();
  hideMsg();$pop.style.display='none';$start.style.display='flex';
  const t=0.02,p=curve.getPointAt(t),tv=curve.getTangentAt(t);tv.y=0;tv.normalize();
  kartMesh.position.copy(p);kartMesh.rotation.y=Math.atan2(tv.z,tv.x);
  kartMesh.rotation.z=0;kartMesh.wheels.forEach(w=>w.rotation.x=0);
  cam.position.set(p.x,p.y+8,p.z-12);cam.lookAt(p);
}

// ===== INIT =====
buildTrack();buildTerrain();buildStartFinish();
resetGame();

// ===== MAIN LOOP =====
let lastTime=performance.now();
function loop(now){
  requestAnimationFrame(loop);
  const dt=Math.min((now-lastTime)/1000,0.05);
  lastTime=now;
  if(GS.started&&!GS.finished)GS.raceT+=dt;
  updatePhysics(dt);
  updateCountdown(dt);
  updateKart();
  updateCamera();
  updateUI();
  drawMinimap();
  sun.position.set(kartMesh.position.x+50,80,kartMesh.position.z+30);
  sun.target.position.copy(kartMesh.position);
  sun.target.updateMatrixWorld();
  ren.render(scene,cam);
}
requestAnimationFrame(loop);

window.addEventListener('resize',()=>{
  cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();
  ren.setSize(innerWidth,innerHeight);
});