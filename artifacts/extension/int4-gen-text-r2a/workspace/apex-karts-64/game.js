// ============================================================
// APEX KARTS 64 - Game Engine
// ============================================================
"use strict";

// --- SEEDED RNG ---
class SeededRNG {
  constructor(seed=42){this.s=seed;}
  next(){this.s=(this.s*16807)%2147483647;return(this.s-1)/2147483646;}
  range(a,b){return a+this.next()*(b-a);}
}
const RNG=new SeededRNG(42);

// --- GAME STATE ---
const STATE={MENU:0,COUNTDOWN:1,RACING:2,FINISHED:3};
const game={
  state:STATE.MENU, startTime:0, elapsed:0,
  lap:0, maxLaps:3, checkpoints:0, totalCheckpoints:8,
  finished:false, demoMode:false, demoTimer:0
};

// --- TRACK CONFIG ---
const ROAD_W=16, CTRL_PTS=20, STEPS_PER_SEG=6;

// --- TRACK GENERATION ---
function genTrackCtrl() {
  const pts=[];
  for(let i=0;i<CTRL_PTS;i++){
    const a=(i/CTRL_PTS)*Math.PI*2;
    const rv=Math.sin(a*3+1.5)*25+Math.cos(a*2+0.7)*15+Math.sin(a*5)*8;
    pts.push(new THREE.Vector3(Math.cos(a)*(80+rv),Math.sin(a*2)*3+Math.cos(a*3)*2,Math.sin(a)*(80+rv)));
  }
  return pts;
}

function catmullRom(p0,p1,p2,p3,t){
  const t2=t*t,t3=t2*t;
  return{
    x:.5*(2*p1.x+(-p0.x+p2.x)*t+(2*p0.x-5*p1.x+4*p2.x-p3.x)*t2+(-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
    y:.5*(2*p1.y+(-p0.y+p2.y)*t+(2*p0.y-5*p1.y+4*p2.y-p3.y)*t2+(-p0.y+3*p1.y-3*p2.y+p3.y)*t3),
    z:.5*(2*p1.z+(-p0.z+p2.z)*t+(2*p0.z-5*p1.z+4*p2.z-p3.z)*t2+(-p0.z+3*p1.z-3*p2.z+p3.z)*t3)
  };
}

function buildSmooth(ctrls){
  const sm=[],n=ctrls.length;
  for(let i=0;i<n;i++){
    const p0=ctrls[(i-1+n)%n],p1=ctrls[i],p2=ctrls[(i+1)%n],p3=ctrls[(i+2)%n];
    for(let s=0;s<STEPS_PER_SEG;s++){
      const p=catmullRom(p0,p1,p2,p3,s/STEPS_PER_SEG);
      sm.push(new THREE.Vector3(p.x,p.y,p.z));
    }
  }
  return sm;
}

// --- THREE.JS SETUP ---
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x87CEEB);
scene.fog=new THREE.Fog(0x87CEEB,150,400);

const camera=new THREE.PerspectiveCamera(65,window.innerWidth/window.innerHeight,0.5,500);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.domElement.id='game-canvas';
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xFFEEDD,0.6));
const sun=new THREE.DirectionalLight(0xFFEECC,1.0);
sun.position.set(50,80,30);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.near=1;sun.shadow.camera.far=300;
sun.shadow.camera.left=-120;sun.shadow.camera.right=120;
sun.shadow.camera.top=120;sun.shadow.camera.bottom=-120;
scene.add(sun);
scene.add(new THREE.HemisphereLight(0x88CCFF,0x445522,0.3));

// Materials
const matGrass=new THREE.MeshLambertMaterial({color:0x44AA33});
const matRoad=new THREE.MeshLambertMaterial({color:0x555555});
const matRumbleR=new THREE.MeshLambertMaterial({color:0xCC2222});
const matRumbleW=new THREE.MeshLambertMaterial({color:0xFFFFFF});
const matBarrier=new THREE.MeshLambertMaterial({color:0xFF8800});
const matWater=new THREE.MeshLambertMaterial({color:0x2266AA,transparent:true,opacity:0.7});
const matKartBody=new THREE.MeshPhongMaterial({color:0xFF3333,flatShading:true});
const matKartWheel=new THREE.MeshLambertMaterial({color:0x222222});
const matKartDtl=new THREE.MeshPhongMaterial({color:0xFFAA00,flatShading:true});
const matDriver=new THREE.MeshLambertMaterial({color:0x4488FF});
const matHelmet=new THREE.MeshPhongMaterial({color:0xFFCC00,flatShading:true});
// --- BUILD TRACK ---
let trackCtrl,trackPts,trackObjs=[];

function mkCheckerTex(){
  const c=document.createElement('canvas');c.width=c.height=128;
  const ctx=c.getContext('2d'),sz=16;
  for(let x=0;x<128;x+=sz)for(let y=0;y<128;y+=sz){
    ctx.fillStyle=((x/sz+y/sz)%2===0)?'#FFF':'#111';ctx.fillRect(x,y,sz,sz);
  }
  const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;return t;
}

function mkRoadMesh(verts,mat){
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(verts),3));
  const idx=[];
  for(let i=0;i<verts.length/12;i++){const b=i*4;idx.push(b,b+1,b+2,b+2,b+1,b+3);}
  geo.setIndex(idx);geo.computeVertexNormals();
  const m=new THREE.Mesh(geo,mat);m.receiveShadow=true;return m;
}

function buildTrack(){
  trackCtrl=genTrackCtrl();
  trackPts=buildSmooth(trackCtrl);
  trackObjs.forEach(o=>scene.remove(o));trackObjs=[];
  const n=trackPts.length;

  function normal(i){
    const d=new THREE.Vector3().subVectors(trackPts[(i+1)%n],trackPts[(i-1+n)%n]).normalize();
    return new THREE.Vector3(-d.z,0,d.x);
  }

  let road=[],rumR=[],rumW=[];
  for(let i=0;i<n;i++){
    const p=trackPts[i],nl=trackPts[(i+1)%n];
    const nm=normal(i),nmn=normal((i+1)%n);
    const hw=ROAD_W/2,rhw=hw+1.5;
    const L=p.clone().add(nm.clone().multiplyScalar(-hw));
    const R=p.clone().add(nm.clone().multiplyScalar(hw));
    const LL=p.clone().add(nm.clone().multiplyScalar(-rhw));
    const RR=p.clone().add(nm.clone().multiplyScalar(rhw));
    const nL=nl.clone().add(nmn.clone().multiplyScalar(-hw));
    const nR=nl.clone().add(nmn.clone().multiplyScalar(hw));
    const nLL=nl.clone().add(nmn.clone().multiplyScalar(-rhw));
    const nRR=nl.clone().add(nmn.clone().multiplyScalar(rhw));
    road.push(L.x,L.y,L.z,nL.x,nL.y,nL.z,R.x,R.y,R.z,nR.x,nR.y,nR.z);
    if(i%4<2){
      rumR.push(LL.x,LL.y,LL.z,nLL.x,nLL.y,nLL.z,L.x,L.y,L.z,nL.x,nL.y,nL.z);
      rumW.push(R.x,R.y,R.z,nR.x,nR.y,nR.z,RR.x,RR.y,RR.z,nRR.x,nRR.y,nRR.z);
    } else {
      rumW.push(LL.x,LL.y,LL.z,nLL.x,nLL.y,nLL.z,L.x,L.y,L.z,nL.x,nL.y,nL.z);
      rumR.push(R.x,R.y,R.z,nR.x,nR.y,nR.z,RR.x,RR.y,RR.z,nRR.x,nRR.y,nRR.z);
    }
  }

  const rm1=mkRoadMesh(road,matRoad);rm1.position.y=0.05;scene.add(rm1);trackObjs.push(rm1);
  const rm2=mkRoadMesh(rumR,matRumbleR);rm2.position.y=0.02;scene.add(rm2);trackObjs.push(rm2);
  const rm3=mkRoadMesh(rumW,matRumbleW);rm3.position.y=0.02;scene.add(rm3);trackObjs.push(rm3);

  // Finish line
  const fp=trackPts[0],fn=normal(0);
  const fMesh=new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W,3),new THREE.MeshBasicMaterial({map:mkCheckerTex()}));
  fMesh.rotation.x=-Math.PI/2;fMesh.position.set(fp.x,0.15,fp.z);
  const dir=new THREE.Vector3().subVectors(trackPts[1],fp);
  fMesh.rotation.y=Math.atan2(dir.x,dir.z);
  scene.add(fMesh);trackObjs.push(fMesh);

  // Barriers
  for(let i=0;i<n;i+=3){
    const p=trackPts[i],nm=normal(i);
    for(let side=-1;side<=1;side+=2){
      const bp=p.clone().add(nm.clone().multiplyScalar(side*(ROAD_W/2+3)));
      bp.y=0.5;
      const bar=new THREE.Mesh(new THREE.BoxGeometry(0.5,1,0.5),matBarrier);
      bar.position.copy(bp);bar.castShadow=true;scene.add(bar);trackObjs.push(bar);
    }
  }

  // Ground
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(600,600,20,20),matGrass);
  ground.rotation.x=-Math.PI/2;ground.position.y=-0.1;ground.receiveShadow=true;
  scene.add(ground);trackObjs.push(ground);

  // Water center
  const ctr=new THREE.Vector3();
  for(const p of trackPts)ctr.add(p);ctr.divideScalar(trackPts.length);
  const water=new THREE.Mesh(new THREE.CircleGeometry(25,8),matWater);
  water.rotation.x=-Math.PI/2;water.position.set(ctr.x,-0.05,ctr.z);
  scene.add(water);trackObjs.push(water);

  // Trees
  for(let i=0;i<n;i+=5){
    const p=trackPts[i],nm=normal(i);
    if(RNG.next()>0.3){
      for(let side=-1;side<=1;side+=2){
        const dist=RNG.range(12,40);
        const tx=p.x+nm.x*side*dist,tz=p.z+nm.z*side*dist;
        const tree=new THREE.Group();
        const trunk=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.5,2,5),new THREE.MeshLambertMaterial({color:0x8B4513}));
        trunk.position.y=1;trunk.castShadow=true;tree.add(trunk);
        const lm=new THREE.MeshLambertMaterial({color:0x228B22,flatShading:true});
        [[3,2.5],[2.2,3.8],[1.4,4.8]].forEach(([s,h])=>{
          const cone=new THREE.Mesh(new THREE.ConeGeometry(s,2,6),lm);
          cone.position.y=h;cone.castShadow=true;tree.add(cone);
        });
        tree.position.set(tx,0,tz);scene.add(tree);trackObjs.push(tree);
      }
    }
  }

  // Rocks
  for(let i=0;i<n;i+=7){
    const p=trackPts[i],nm=normal(i);
    if(RNG.next()>0.6){
      for(let side=-1;side<=1;side+=2){
        const dist=RNG.range(15,45);
        const rk=new THREE.Mesh(new THREE.DodecahedronGeometry(RNG.range(1,2.5),0),
          new THREE.MeshLambertMaterial({color:0x888888,flatShading:true}));
        rk.position.set(p.x+nm.x*side*dist,0.5,p.z+nm.z*side*dist);
        rk.rotation.set(RNG.next()*Math.PI,RNG.next()*Math.PI,0);
        rk.castShadow=true;scene.add(rk);trackObjs.push(rk);
      }
    }
  }
}
buildTrack();

// --- BUILD KART ---
const kart=new THREE.Group();

function buildKart(){
  const body=new THREE.Mesh(new THREE.BoxGeometry(1.2,0.5,2),matKartBody);
  body.position.y=0.5;body.castShadow=true;kart.add(body);
  const sp=new THREE.Mesh(new THREE.BoxGeometry(1.4,0.1,0.3),matKartDtl);
  sp.position.set(0,1.1,-0.9);kart.add(sp);
  [-0.5,0.5].forEach(x=>{const s=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.6,4),matKartDtl);s.position.set(x,0.8,-0.9);kart.add(s);});
  const front=new THREE.Mesh(new THREE.BoxGeometry(1.0,0.3,0.4),matKartDtl);
  front.position.set(0,0.55,1.1);kart.add(front);
  [-0.3,0.3].forEach(x=>{const ex=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.1,0.8,5),new THREE.MeshLambertMaterial({color:0x666666}));ex.rotation.x=Math.PI/2;ex.position.set(x,0.4,-1.2);kart.add(ex);});
  kart.wheels=[];
  [[-0.7,0.35,0.7],[0.7,0.35,0.7],[-0.7,0.35,-0.7],[0.7,0.35,-0.7]].forEach(p=>{
    const w=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,0.3,8),matKartWheel);
    w.rotation.z=Math.PI/2;w.position.set(...p);w.castShadow=true;kart.add(w);kart.wheels.push(w);
  });
  const dg=new THREE.Group();
  const torso=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.7,0.4),matDriver);
  torso.position.y=1.05;dg.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.25,6,5),matHelmet);
  head.position.y=1.6;dg.add(head);
  const visor=new THREE.Mesh(new THREE.BoxGeometry(0.25,0.08,0.15),new THREE.MeshLambertMaterial({color:0x222222}));
  visor.position.set(0,1.62,0.15);dg.add(visor);
  dg.position.z=0.1;kart.add(dg);kart.driver=dg;
  kart.position.copy(trackPts[0]);kart.position.y+=0.3;
  scene.add(kart);
}
buildKart();

// --- KART PHYSICS STATE ---
const ks={speed:0,angle:0,maxSpeed:0.6,accel:0.012,brake:0.02,
  friction:0.003,turn:0.035,offRoadFriction:0.015,
  onRoad:true,drift:0,isDrifting:false,driftTime:0};

// --- INPUT ---
const keys={};
document.addEventListener('keydown',e=>{keys[e.code]=true;e.preventDefault();});
document.addEventListener('keyup',e=>{keys[e.code]=false;e.preventDefault();});

function checkOnRoad(pos){
  let md=Infinity;
  for(let i=0;i<trackPts.length;i+=3){
    const dx=pos.x-trackPts[i].x,dz=pos.z-trackPts[i].z;
    const d=Math.sqrt(dx*dx+dz*dz);if(d<md)md=d;
  }
  return md<(ROAD_W/2+1);
}

// --- CHECKPOINTS ---
const checkpoints=[];
function setupCheckpoints(){
  checkpoints.length=0;
  for(let i=0;i<game.totalCheckpoints;i++){
    checkpoints.push({pos:trackPts[Math.floor((i/game.totalCheckpoints)*trackPts.length)].clone(),passed:false});
  }
}

function checkCheckpoints(){
  for(const cp of checkpoints){
    const dx=kart.position.x-cp.pos.x,dz=kart.position.z-cp.pos.z;
    if(Math.sqrt(dx*dx+dz*dz)<15&&!cp.passed){cp.passed=true;game.checkpoints++;}
  }
  if(game.checkpoints>=game.totalCheckpoints){
    const sp=trackPts[0];
    const dx=kart.position.x-sp.x,dz=kart.position.z-sp.z;
    if(Math.sqrt(dx*dx+dz*dz)<15){
      game.lap++;game.checkpoints=0;
      checkpoints.forEach(cp=>cp.passed=false);
      updateHUD();
      if(game.lap>game.maxLaps)finishRace();
    }
  }
}

// --- DEMO AI ---
function updateDemoAI(){
  game.demoTimer+=1/60;
  let bestDist=Infinity,bestIdx=0;
  for(let i=0;i<trackPts.length;i+=2){
    const dx=kart.position.x-trackPts[i].x,dz=kart.position.z-trackPts[i].z;
    const d=dx*dx+dz*dz;if(d<bestDist){bestDist=d;bestIdx=i;}
  }
  const lookAhead=(bestIdx+15)%trackPts.length;
  const tgt=trackPts[lookAhead];
  const dx=tgt.x-kart.position.x,dz=tgt.z-kart.position.z;
  const tgtAngle=Math.atan2(dx,dz);
  let diff=tgtAngle-ks.angle;
  while(diff>Math.PI)diff-=Math.PI*2;
  while(diff<-Math.PI)diff+=Math.PI*2;
  keys['ArrowUp']=true;keys['ArrowLeft']=diff>0.08;
  keys['ArrowRight']=diff<-0.08;keys['ArrowDown']=false;keys['Space']=false;
  keys['KeyA']=keys['ArrowLeft'];keys['KeyD']=keys['ArrowRight'];
  keys['KeyW']=keys['ArrowUp'];keys['KeyS']=keys['ArrowDown'];
}

// --- UPDATE KART ---
function updateKart(){
  if(game.state!==STATE.RACING)return;
  if(game.demoMode)updateDemoAI();
  const acc=keys['ArrowUp']||keys['KeyW'];
  const brk=keys['ArrowDown']||keys['KeyS'];
  const lt=keys['ArrowLeft']||keys['KeyA'];
  const rt=keys['ArrowRight']||keys['KeyD'];
  const hb=keys['Space'];

  ks.onRoad=checkOnRoad(kart.position);
  const friction=ks.onRoad?ks.friction:ks.offRoadFriction;
  const maxSpd=ks.onRoad?ks.maxSpeed:ks.maxSpeed*0.6;

  if(acc)ks.speed=Math.min(ks.speed+ks.accel,maxSpd);
  if(brk)ks.speed=Math.max(ks.speed-ks.brake,-0.2);
  if(hb)ks.speed*=(1-0.05);
  if(!acc&&!brk){
    if(ks.speed>0)ks.speed=Math.max(0,ks.speed-friction);
    else if(ks.speed<0)ks.speed=Math.min(0,ks.speed+friction);
  }

  const turnFactor=0.5+0.5*Math.min(Math.abs(ks.speed)/maxSpd,1);
  if(lt)ks.angle+=ks.turn*turnFactor*(ks.speed<0?-1:1);
  if(rt)ks.angle-=ks.turn*turnFactor*(ks.speed<0?-1:1);

  if(hb&&Math.abs(ks.speed)>0.15&&(lt||rt)){
    if(!ks.isDrifting){ks.isDrifting=true;ks.driftTime=0;}
    ks.driftTime+=1/60;
    ks.drift+=ks.turn*0.5*(lt?1:-1);
  } else {
    if(ks.isDrifting&&ks.driftTime>0.3)ks.speed=Math.min(ks.speed+0.02,maxSpd);
    ks.drift*=(1-0.08);
    if(Math.abs(ks.drift)<0.001)ks.drift=0;
    ks.isDrifting=false;
  }

  kart.rotation.y=ks.angle+ks.drift;
  const fwd=new THREE.Vector3(-Math.sin(ks.angle),0,-Math.cos(ks.angle));
  kart.position.x+=fwd.x*ks.speed;
  kart.position.z+=fwd.z*ks.speed;

  // Follow track height
  let minY=Infinity;
  for(let i=0;i<trackPts.length;i+=4){
    const d=(kart.position.x-trackPts[i].x)**2+(kart.position.z-trackPts[i].z)**2;
    if(d<minY){minY=d;kart.position.y=trackPts[i].y+0.3;}
  }

  // Wheel spin
  const ws=ks.speed*0.5;
  kart.wheels.forEach(w=>w.rotation.x+=ws);

  // Driver lean
  if(kart.driver)kart.driver.rotation.z=lt?-0.15:rt?0.15:0;

  checkCheckpoints();
}

// --- CAMERA ---
const camCur=new THREE.Vector3();
const camTgt=new THREE.Vector3();
function updateCamera(){
  const fwd=new THREE.Vector3(-Math.sin(ks.angle),0,-Math.cos(ks.angle));
  const speedMag=Math.abs(ks.speed);
  camera.fov=65+speedMag*40;
  camera.updateProjectionMatrix();
  const desiredPos=kart.position.clone()
    .add(fwd.clone().multiplyScalar(-8-speedMag*8))
    .add(new THREE.Vector3(0,4+speedMag*3,0));
  const desiredLook=kart.position.clone()
    .add(fwd.clone().multiplyScalar(8))
    .add(new THREE.Vector3(0,1.5,0));
  camCur.lerp(desiredPos,0.06);
  camTgt.lerp(desiredLook,0.08);
  camera.position.copy(camCur);
  camera.lookAt(camTgt);
  sun.position.set(kart.position.x+50,80,kart.position.z+30);
  sun.target.position.copy(kart.position);
  sun.target.updateMatrixWorld();
}
// Init camera
camCur.copy(kart.position).add(new THREE.Vector3(0,6,-10));
camTgt.copy(kart.position).add(new THREE.Vector3(0,1.5,5));

// --- HUD ---
const hudEl=document.getElementById('hud');
const lapEl=document.getElementById('lap-display');
const timeEl=document.getElementById('time-display');
const posEl=document.getElementById('pos-display');

function updateHUD(){
  const dl=Math.min(game.lap+1,game.maxLaps);
  lapEl.textContent='LAP '+dl+'/'+game.maxLaps;
  const elapsed=game.state===STATE.RACING?(Date.now()-game.startTime)/1000:game.elapsed;
  const min=Math.floor(elapsed/60).toString().padStart(2,'0');
  const sec=Math.floor(elapsed%60).toString().padStart(2,'0');
  const ms=Math.floor((elapsed%1)*100).toString().padStart(2,'0');
  timeEl.textContent=min+':'+sec+'.'+ms;
}

// --- MINIMAP ---
const mmCanvas=document.getElementById('minimap');
mmCanvas.width=160;mmCanvas.height=160;
const mmCtx=mmCanvas.getContext('2d');

function drawMinimap(){
  mmCtx.clearRect(0,0,160,160);
  mmCtx.fillStyle='rgba(0,50,0,0.8)';
  mmCtx.fillRect(0,0,160,160);
  let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
  for(const p of trackPts){
    if(p.x<minX)minX=p.x;if(p.x>maxX)maxX=p.x;
    if(p.z<minZ)minZ=p.z;if(p.z>maxZ)maxZ=p.z;
  }
  const rangeX=maxX-minX,rangeZ=maxZ-minZ;
  const scale=Math.min(140/rangeX,140/rangeZ);
  const cx=(minX+maxX)/2,cz=(minZ+maxZ)/2;
  function mx(x){return 80+(x-cx)*scale;}
  function mz(z){return 80+(z-cz)*scale;}

  mmCtx.strokeStyle='#888';mmCtx.lineWidth=4;
  mmCtx.beginPath();
  for(let i=0;i<trackPts.length;i+=2){
    const x=mx(trackPts[i].x),z=mz(trackPts[i].z);
    if(i===0)mmCtx.moveTo(x,z);else mmCtx.lineTo(x,z);
  }
  mmCtx.closePath();mmCtx.stroke();

  for(const cp of checkpoints){
    mmCtx.fillStyle=cp.passed?'#0F0':'#F00';
    mmCtx.beginPath();
    mmCtx.arc(mx(cp.pos.x),mz(cp.pos.z),3,0,Math.PI*2);
    mmCtx.fill();
  }

  mmCtx.fillStyle='#FF3333';
  mmCtx.beginPath();
  mmCtx.arc(mx(kart.position.x),mz(kart.position.z),5,0,Math.PI*2);
  mmCtx.fill();
  mmCtx.strokeStyle='#FFF';mmCtx.lineWidth=1.5;mmCtx.stroke();
}

// --- GAME STATE MANAGEMENT ---
const overlayEl=document.getElementById('overlay');
const countdownEl=document.getElementById('countdown');
const demoBadgeEl=document.getElementById('demo-badge');

function resetKart(){
  kart.position.copy(trackPts[0]);kart.position.y+=0.3;
  ks.speed=0;ks.angle=0;ks.drift=0;ks.isDrifting=false;ks.driftTime=0;
  // Face along track direction
  const dir=new THREE.Vector3().subVectors(trackPts[1],trackPts[0]);
  ks.angle=Math.atan2(dir.x,dir.z);
}

function resetGame(){
  game.lap=0;game.checkpoints=0;game.elapsed=0;game.finished=false;
  setupCheckpoints();
  resetKart();
  updateHUD();
}

function startRace(isDemo){
  game.demoMode=isDemo||false;
  if(game.demoMode){
    demoBadgeEl.style.display='block';
  } else {
    demoBadgeEl.style.display='none';
  }
  resetGame();
  game.state=STATE.COUNTDOWN;
  overlayEl.classList.add('hidden');
  hudEl.style.display='flex';

  // Countdown sequence
  countdownEl.style.display='block';
  let count=3;
  countdownEl.textContent=count;
  const countInterval=setInterval(()=>{
    count--;
    if(count>0){
      countdownEl.textContent=count;
    } else if(count===0){
      countdownEl.textContent='GO!';
      countdownEl.style.color='#00FF88';
      game.state=STATE.RACING;
      game.startTime=Date.now();
    } else {
      countdownEl.style.display='none';
      countdownEl.style.color='#FFD700';
      clearInterval(countInterval);
    }
  },1000);
}

function finishRace(){
  game.finished=true;
  game.state=STATE.FINISHED;
  game.elapsed=(Date.now()-game.startTime)/1000;
  updateHUD();

  // Show results
  const min=Math.floor(game.elapsed/60).toString().padStart(2,'0');
  const sec=Math.floor(game.elapsed%60).toString().padStart(2,'0');
  const ms=Math.floor((game.elapsed%1)*100).toString().padStart(2,'0');

  overlayEl.querySelector('h1').textContent='FINISHED!';
  overlayEl.querySelector('h2').textContent='1st Place';
  overlayEl.querySelector('.subtitle').textContent='Time: '+min+':'+sec+'.'+ms;
  document.getElementById('start-btn').textContent='Race Again';
  document.getElementById('demo-btn').style.display='inline-block';
  overlayEl.classList.remove('hidden');
}

// --- EVENT HANDLERS ---
document.getElementById('start-btn').addEventListener('click',()=>startRace(false));
document.getElementById('demo-btn').addEventListener('click',()=>startRace(true));
document.addEventListener('keydown',e=>{
  if(e.code==='Enter'&&game.state===STATE.MENU){startRace(false);e.preventDefault();}
  if(e.code==='Enter'&&game.state===STATE.FINISHED){
    overlayEl.querySelector('h1').textContent='APEX KARTS 64';
    overlayEl.querySelector('h2').textContent='Grand Prix';
    overlayEl.querySelector('.subtitle').textContent='A Retro Kart Racing Experience';
    document.getElementById('start-btn').textContent='Start Race';
    document.getElementById('demo-btn').style.display='inline-block';
    overlayEl.classList.add('hidden');
    resetGame();
    setTimeout(()=>{overlayEl.classList.remove('hidden');},100);
    e.preventDefault();
  }
});

// --- MAIN GAME LOOP ---
function animate(){
  requestAnimationFrame(animate);

  if(game.state===STATE.RACING){
    game.elapsed=(Date.now()-game.startTime)/1000;
    updateHUD();
  }

  updateKart();
  updateCamera();
  drawMinimap();

  // Menu camera orbit
  if(game.state===STATE.MENU||game.state===STATE.FINISHED){
    const t=Date.now()/2000;
    const angle=t%Math.PI*2;
    const orbitR=40;
    const orbitY=25;
    camera.position.set(Math.cos(angle)*orbitR,orbitY,Math.sin(angle)*orbitR);
    camera.lookAt(0,2,0);
  }

  renderer.render(scene,camera);
}

// --- RESIZE ---
window.addEventListener('resize',()=>{
  camera.aspect=window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
});

// --- INIT ---
setupCheckpoints();
animate();
