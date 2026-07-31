// === APEX KARTS 64 - Part 1: Setup ===
class RNG{constructor(s){this.s=s}next(){this.s=(this.s*16807)%2147483647;return(this.s-1)/2147483646}range(a,b){return a+this.next()*(b-a)}int(a,b){return Math.floor(this.range(a,b+1))}}
const SEED=42,rng=new RNG(SEED);
const C={maxSpd:2.8,accel:0.055,brake:0.12,friction:0.012,turn:0.042,hbTurn:1.8,offFric:0.06,offSpd:0.35,camH:6,camDist:10,camLerp:0.08,tW:12};
let gMode='play',state='title',lapTime=0,curCP=-1,lapDone=false,raceT=0;
let tPts=[],tCrve=null,cpPos=[];
let kart=null,kartSpd=0,kartAng=0,kartPos=new THREE.Vector3();
let kartOnTrack=true, tgtCam=new THREE.Vector3(), lookTgt=new THREE.Vector3();
let clouds=[],demoLA=0.12;
window.setMode=function(m){gMode=m;document.getElementById('mode-play').classList.toggle('active',m==='play');document.getElementById('mode-demo').classList.toggle('active',m==='demo')};
const scene=new THREE.Scene();scene.background=new THREE.Color(0x87CEEB);scene.fog=new THREE.Fog(0x87CEEB,80,200);
const camera=new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,0.1,300);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(window.innerWidth,window.innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));document.body.appendChild(renderer.domElement);
scene.add(new THREE.AmbientLight(0xffffff,0.55));
const sunL=new THREE.DirectionalLight(0xffeedd,0.9);sunL.position.set(40,60,30);sunL.castShadow=true;sunL.shadow.mapSize.set(2048,2048);sunL.shadow.camera.left=-60;sunL.shadow.camera.right=60;sunL.shadow.camera.top=60;sunL.shadow.camera.bottom=-60;sunL.shadow.camera.near=1;sunL.shadow.camera.far=160;scene.add(sunL);
scene.add(new THREE.HemisphereLight(0x88bbff,0x445522,0.35));
const M={grass:new THREE.MeshLambertMaterial({color:0x44aa33}),grassD:new THREE.MeshLambertMaterial({color:0x338822}),road:new THREE.MeshLambertMaterial({color:0x666666}),cr:new THREE.MeshLambertMaterial({color:0xff2222}),cw:new THREE.MeshLambertMaterial({color:0xeeeeee}),tr:new THREE.MeshLambertMaterial({color:0x228833}),trD:new THREE.MeshLambertMaterial({color:0x116622}),stk:new THREE.MeshLambertMaterial({color:0x664422}),rok:new THREE.MeshLambertMaterial({color:0x888888}),kBody:new THREE.MeshLambertMaterial({color:0xff3322}),kW:new THREE.MeshLambertMaterial({color:0x222222}),kAc:new THREE.MeshLambertMaterial({color:0xffaa00}),kDr:new THREE.MeshLambertMaterial({color:0xffcc44}),kV:new THREE.MeshLambertMaterial({color:0x222244}),fW:new THREE.MeshLambertMaterial({color:0xffffff}),fB:new THREE.MeshLambertMaterial({color:0x222222}),arch:new THREE.MeshLambertMaterial({color:0x333333}),bnr:new THREE.MeshLambertMaterial({color:0xff4400}),cl:new THREE.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:0.8}),bld:new THREE.MeshLambertMaterial({color:0xcc9966}),rft:new THREE.MeshLambertMaterial({color:0xaa4433})};
// === TRACK ===
function buildTrack(){
  const pts=[new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,-18),new THREE.Vector3(0,0,-35),new THREE.Vector3(12,0,-45),new THREE.Vector3(25,1.5,-50),new THREE.Vector3(38,3,-48),new THREE.Vector3(48,2,-38),new THREE.Vector3(52,1,-24),new THREE.Vector3(50,0,-10),new THREE.Vector3(42,0,2),new THREE.Vector3(30,0,10),new THREE.Vector3(15,0,14),new THREE.Vector3(0,0,14),new THREE.Vector3(-12,0,10),new THREE.Vector3(-24,0,2),new THREE.Vector3(-34,0,-8),new THREE.Vector3(-40,0,-20),new THREE.Vector3(-42,1,-32),new THREE.Vector3(-38,2.5,-42),new THREE.Vector3(-30,3,-48),new THREE.Vector3(-20,2,-50),new THREE.Vector3(-10,1,-48),new THREE.Vector3(-5,0.5,-42),new THREE.Vector3(-2,0,-34)];
  tCrve=new THREE.CatmullRomCurve3(pts,true,'catmullrom',0.5);
  for(let i=0;i<200;i++){const t=i/200,p=tCrve.getPointAt(t),tan=tCrve.getTangentAt(t),nrm=new THREE.Vector3(-tan.z,0,tan.x).normalize();tPts.push({pos:p.clone(),tan,nrm})}
  buildRoad();buildCurbs();buildGround();buildDeco();buildStart();setupCP();
}
function buildRoad(){const v=[],u=[],ix=[];for(let i=0;i<tPts.length;i++){const p=tPts[i],n=tPts[(i+1)%tPts.length],hw=C.tW/2,nm=p.nrm,d=[p.pos.x+nm.x*hw,p.pos.y,p.pos.z+nm.z*hw,p.pos.x-nm.x*hw,p.pos.y,p.pos.z-nm.z*hw,n.pos.x+nm.x*hw,n.pos.y,n.pos.z+nm.z*hw,n.pos.x-nm.x*hw,n.pos.y,n.pos.z-nm.z*hw];const bi=v.length/3;v.push(...d);u.push(0,i*0.3,1,i*0.3,0,(i+1)*0.3,1,(i+1)*0.3);ix.push(bi,bi+2,bi+1,bi+1,bi+2,bi+3)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(u,2));g.setIndex(ix);g.computeVertexNormals();const m=new THREE.Mesh(g,M.road);m.receiveShadow=true;scene.add(m)}
function buildCurbs(){for(let sd=-1;sd<=1;sd+=2){const cv=[],cu=[],ci=[];const cw=0.6,ed=C.tW/2+cw;for(let i=0;i<tPts.length;i++){const p=tPts[i],n=tPts[(i+1)%tPts.length],d=sd*ed,r=d-sd*cw,nm=p.nrm,y=Math.max(p.pos.y-0.1,-0.05),ny=Math.max(n.pos.y-0.1,-0.05),dd=[p.pos.x+nm.x*d,y,p.pos.z+nm.z*d,p.pos.x+nm.x*r,y,p.pos.z+nm.z*r,n.pos.x+nm.x*d,ny,n.pos.z+nm.z*d,n.pos.x+nm.x*r,ny,n.pos.z+nm.z*r];const bi=cv.length/3;cv.push(...dd);cu.push(0,i*0.15,1,i*0.15,0,(i+1)*0.15,1,(i+1)*0.15);ci.push(bi,bi+2,bi+1,bi+1,bi+2,bi+3)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(cv,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(cu,2));g.setIndex(ci);g.computeVertexNormals();const m=new THREE.Mesh(g,sd<0?M.cr:M.cw);m.receiveShadow=true;scene.add(m)}}
function buildGround(){const g=new THREE.PlaneGeometry(200,200);const m=new THREE.Mesh(g,M.grass);m.rotation.x=-Math.PI/2;m.position.y=-0.3;m.receiveShadow=true;scene.add(m)}
function buildDeco(){
  const tr=new RNG(SEED+100);
  for(let i=0;i<60;i++){const t=tr.next(),p=tCrve.getPointAt(t),tan=tCrve.getTangentAt(t),nrm=new THREE.Vector3(-tan.z,0,tan.x).normalize(),d=tr.range(15,35),s=tr.next()>0.5?1:-1;const tp=p.clone().add(nrm.clone().multiplyScalar(d*s));tp.y=-0.2;if(p.distanceTo(tp)>8)mkTree(tp,tr.range(1.5,3.5),tr)}
  for(let i=0;i<25;i++){const t=tr.next(),p=tCrve.getPointAt(t),tan=tCrve.getTangentAt(t),nrm=new THREE.Vector3(-tan.z,0,tan.x).normalize(),d=tr.range(14,30),s=tr.next()>0.5?1:-1;const rp=p.clone().add(nrm.clone().multiplyScalar(d*s));rp.y=-0.2;if(p.distanceTo(rp)>8)mkRock(rp,tr.range(0.5,1.5))}
  for(let i=0;i<6;i++){const t=tr.next(),p=tCrve.getPointAt(t),tan=tCrve.getTangentAt(t),nrm=new THREE.Vector3(-tan.z,0,tan.x).normalize(),d=tr.range(25,45),s=tr.next()>0.5?1:-1;const bp=p.clone().add(nrm.clone().multiplyScalar(d*s));bp.y=-0.2;if(p.distanceTo(bp)>15)mkBld(bp,tr)}
  for(let i=0;i<15;i++)mkCloud(new THREE.Vector3(tr.range(-80,80),tr.range(25,40),tr.range(-80,80)),tr);
}
function mkTree(pos,h,r){const g=new THREE.Group();g.position.copy(pos);const t=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.5,h*0.4,6),M.stk);t.position.y=h*0.2;t.castShadow=true;g.add(t);const mt=r.next()>0.5?M.tr:M.trD;for(let i=0;i<3;i++){const ch=h*(0.4-i*0.08),cr=(1.8-i*0.4)*(h/3);const c=new THREE.Mesh(new THREE.ConeGeometry(cr,ch,6),mt);c.position.y=h*0.35+i*ch*0.45;c.castShadow=true;g.add(c)}scene.add(g)}
function mkRock(pos,sz){const r=new THREE.Mesh(new THREE.DodecahedronGeometry(sz,0),M.rok);r.position.copy(pos);r.position.y+=sz*0.5;r.rotation.set(rng.range(0,Math.PI),rng.range(0,Math.PI),0);r.scale.y=rng.range(0.5,0.8);r.castShadow=true;r.receiveShadow=true;scene.add(r)}
function mkBld(pos,r){const g=new THREE.Group();g.position.copy(pos);const w=r.range(2,4),h=r.range(3,6),d=r.range(2,4);const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),M.bld);b.position.y=h/2;b.castShadow=true;g.add(b);const rf=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*0.8,2,4),M.rft);rf.position.y=h+1;rf.rotation.y=Math.PI/4;rf.castShadow=true;g.add(rf);scene.add(g)}
function mkCloud(pos,r){const g=new THREE.Group();g.position.copy(pos);for(let i=0;i<r.int(2,4);i++){const p=new THREE.Mesh(new THREE.SphereGeometry(r.range(2,5),6,5),M.cl);p.position.set(r.range(-3,3),r.range(-1,1),r.range(-2,2));p.scale.y=0.5;g.add(p)}g.userData.spd=r.range(0.002,0.008);clouds.push(g);scene.add(g)}
function buildStart(){const pos=tCrve.getPointAt(0),tan=tCrve.getTangentAt(0),nrm=new THREE.Vector3(-tan.z,0,tan.x).normalize(),ang=Math.atan2(tan.z,tan.x),sqN=8,sqS=C.tW/sqN;for(let i=0;i<sqN;i++)for(let j=0;j<2;j++){const sq=new THREE.Mesh(new THREE.PlaneGeometry(sqS,0.5),(i+j)%2===0?M.fW:M.fB);sq.rotation.x=-Math.PI/2;sq.position.set(pos.x+nrm.x*(i-sqN/2)*sqS,pos.y+0.02,pos.z+nrm.z*(i-sqN/2)*sqS);sq.rotation.z=ang;scene.add(sq)}const aw=C.tW+2,pg=new THREE.BoxGeometry(0.6,5,0.6);const lp=new THREE.Mesh(pg,M.arch);lp.position.set(pos.x+nrm.x*aw/2,pos.y+2.5,pos.z+nrm.z*aw/2);lp.castShadow=true;scene.add(lp);const rp=new THREE.Mesh(pg,M.arch);rp.position.set(pos.x-nrm.x*aw/2,pos.y+2.5,pos.z-nrm.z*aw/2);rp.castShadow=true;scene.add(rp);const tp=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.6,aw),M.bnr);tp.position.set(pos.x,pos.y+5,pos.z);tp.rotation.y=Math.atan2(tan.x,tan.z);tp.castShadow=true;scene.add(tp)}
function setupCP(){cpPos=[0.15,0.35,0.55,0.75,0.92].map(t=>tCrve.getPointAt(t))}

// === KART ===
function createKart(){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(1.2,0.5,2),M.kBody);body.position.y=0.45;body.castShadow=true;g.add(body);
  const hood=new THREE.Mesh(new THREE.BoxGeometry(1,0.3,0.6),M.kAc);hood.position.set(0,0.55,1.1);hood.rotation.x=0.3;hood.castShadow=true;g.add(hood);
  const wing=new THREE.Mesh(new THREE.BoxGeometry(1.4,0.08,0.3),M.kAc);wing.position.set(0,1.0,-0.85);wing.castShadow=true;g.add(wing);
  const sg=new THREE.CylinderGeometry(0.05,0.05,0.5,4);
  [-0.5,0.5].forEach(x=>{const s=new THREE.Mesh(sg,M.kBody);s.position.set(x,0.75,-0.85);g.add(s)});
  const wg=new THREE.CylinderGeometry(0.35,0.35,0.25,8);
  [[-0.7,0.35,0.7],[0.7,0.35,0.7],[-0.7,0.35,-0.7],[0.7,0.35,-0.7]].forEach(([x,y,z])=>{const w=new THREE.Mesh(wg,M.kW);w.rotation.z=Math.PI/2;w.position.set(x,y,z);w.castShadow=true;g.add(w)});
  const dg=new THREE.Group();dg.position.set(0,0.7,0);
  const torso=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.7,0.5),M.kDr);torso.position.y=0.35;torso.castShadow=true;dg.add(torso);
  const head=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.5,0.5),M.kDr);head.position.y=0.85;head.castShadow=true;dg.add(head);
  const visor=new THREE.Mesh(new THREE.BoxGeometry(0.45,0.2,0.25),M.kV);visor.position.set(0,0.85,0.3);dg.add(visor);
  const helm=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.25,0.5),M.kV);helm.position.y=1.05;dg.add(helm);
  g.add(dg);kart=g;scene.add(kart);resetKart();
}
function resetKart(){
  kartPos.copy(tCrve.getPointAt(0));
  const tan=tCrve.getTangentAt(0);kartAng=Math.atan2(tan.x,tan.z);
  kartSpd=0;kartOnTrack=true;
  if(kart){kart.position.copy(kartPos);kart.position.y+=0.5;kart.rotation.y=kartAng}
}

// === INPUT & PHYSICS ===
const keys={};
document.addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='Enter')handleEnter();if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault()});
document.addEventListener('keyup',e=>{keys[e.code]=false});
function handleEnter(){if(state==='title'||state==='finished')startRace()}
document.getElementById('title-screen').addEventListener('click',e=>{if(e.target.id==='title-screen'||e.target.closest('#title-screen')&&!e.target.closest('.mode-btn'))handleEnter()});
document.getElementById('results-screen').addEventListener('click',()=>{if(state==='finished')startRace()});

function demoAI(){
  const t=getClosestT(kartPos);let nt=(t+demoLA)%1;if(nt<0)nt+=1;
  const tp=tCrve.getPointAt(nt);const dx=tp.x-kartPos.x,dz=tp.z-kartPos.z;
  const ta=Math.atan2(dx,dz);let ad=ta-kartAng;
  while(ad>Math.PI)ad-=Math.PI*2;while(ad<-Math.PI)ad+=Math.PI*2;
  const st=Math.max(-1,Math.min(1,ad*3));const ds=C.maxSpd*(1-Math.abs(ad)*0.5);
  return{throttle:kartSpd<ds?1:(kartSpd>ds*1.2?-1:0),steer:st,handbrake:Math.abs(ad)>0.5&&kartSpd>C.maxSpd*0.6};
}

function getClosestT(pos){
  let best=0,bestD=Infinity;
  for(let i=0;i<=100;i++){const t=i/100,p=tCrve.getPointAt(t),d=p.distanceTo(pos);if(d<bestD){bestD=d;best=t}}
  const step=1/tPts.length;
  for(let i=-5;i<=5;i++){const t=((best+i*step*2)%1+1)%1,p=tCrve.getPointAt(t),d=p.distanceTo(pos);if(d<bestD){bestD=d;best=t}}
  return best;
}

function isOnTrack(pos){const t=getClosestT(pos);const tp=tCrve.getPointAt(t);return tp.distanceTo(new THREE.Vector3(pos.x,0,pos.z))<C.tW/2}

function updateKart(dt){
  if(state!=='racing')return;
  let throttle=0,steer=0,handbrake=false;
  if(gMode==='demo'){const ai=demoAI();throttle=ai.throttle;steer=ai.steer;handbrake=ai.handbrake}
  else{if(keys['ArrowUp']||keys['KeyW'])throttle=1;if(keys['ArrowDown']||keys['KeyS'])throttle=-1;if(keys['ArrowLeft']||keys['KeyA'])steer=-1;if(keys['ArrowRight']||keys['KeyD'])steer=1;if(keys['Space'])handbrake=true}
  if(throttle>0)kartSpd+=C.accel;else if(throttle<0)kartSpd-=C.brake;
  kartOnTrack=isOnTrack(kartPos);
  if(!kartOnTrack){kartSpd*=(1-C.offFric);kartSpd=Math.min(kartSpd,C.maxSpd*C.offSpd)}
  else{kartSpd*=(1-C.friction);kartSpd=Math.min(kartSpd,C.maxSpd)}
  if(handbrake)kartSpd*=(1-C.friction*3);
  const ts=C.turn*(handbrake?C.hbTurn:1);
  if(kartSpd>0.1)kartAng+=steer*ts*(kartSpd/C.maxSpd);
  else if(kartSpd<-0.1)kartAng-=steer*ts*0.3;
  kartPos.x+=Math.sin(kartAng)*kartSpd;kartPos.z+=Math.cos(kartAng)*kartSpd;
  const t=getClosestT(kartPos);const trackH=tCrve.getPointAt(t).y;
  kartPos.y=kartOnTrack?trackH+0.5:kartPos.y*0.95+trackH*0.05+0.5;
  if(kart){kart.position.copy(kartPos);kart.rotation.y=kartAng;kart.rotation.z=-steer*0.15*Math.min(Math.abs(kartSpd)/C.maxSpd,1)}
  checkCP();if(state==='racing')lapTime+=dt;
}

function checkCP(){
  const exp=curCP+1;
  if(exp>=cpPos.length){if(!lapDone){lapDone=true;state='finished';showResults()}return}
  const dist=kartPos.distanceTo(cpPos[exp]);
  if(dist<C.tW){curCP=exp;showCheck();if(curCP===cpPos.length-1){if(!lapDone){lapDone=true;state='finished';showResults()}}}
}
function showCheck(){const el=document.getElementById('checkmark');el.classList.add('show');setTimeout(()=>el.classList.remove('show'),800)}

// === CAMERA ===
function updateCamera(){
  if(!kart)return;
  const tX=kartPos.x-Math.sin(kartAng)*C.camDist,tY=kartPos.y+C.camH,tZ=kartPos.z-Math.cos(kartAng)*C.camDist;
  tgtCam.lerp(new THREE.Vector3(tX,tY,tZ),C.camLerp);
  lookTgt.lerp(new THREE.Vector3(kartPos.x,kartPos.y+1,kartPos.z),C.camLerp);
  camera.position.copy(tgtCam);camera.lookAt(lookTgt);
  sunL.position.set(kartPos.x+40,kartPos.y+60,kartPos.z+30);sunL.target.position.copy(kartPos);
}

// === HUD ===
function updateHUD(){
  const sp=Math.abs(kartSpd/C.maxSpd*220);
  document.getElementById('speed-val').textContent=Math.round(sp);
  document.getElementById('speed-bar-fill').style.width=Math.abs(kartSpd/C.maxSpd*100)+'%';
  document.getElementById('lap-val').textContent=lapDone?'Done':'1/1';
  const mins=Math.floor(lapTime/60),secs=(lapTime%60).toFixed(2);
  document.getElementById('time-val').textContent=mins+':'+(secs<10?'0':'')+secs;
}

function showResults(){
  document.getElementById('hud').style.display='none';document.getElementById('minimap').style.display='none';
  const mins=Math.floor(lapTime/60),secs=(lapTime%60).toFixed(2);
  document.getElementById('result-stats').innerHTML='Time: '+mins+':'+(secs<10?'0':'')+secs+'<br>Track: Canyon Creek';
  document.getElementById('results-screen').style.display='flex';
}

// === MINIMAP ===
function drawMinimap(){
  const canvas=document.getElementById('minimap-canvas'),ctx=canvas.getContext('2d'),w=140,h=140;
  ctx.clearRect(0,0,w,h);ctx.fillStyle='rgba(34,70,34,0.8)';ctx.fillRect(0,0,w,h);
  let mnX=Infinity,mnZ=Infinity,mxX=-Infinity,mxZ=-Infinity;
  for(const p of tPts){if(p.pos.x<mnX)mnX=p.pos.x;if(p.pos.x>mxX)mxX=p.pos.x;if(p.pos.z<mnZ)mnZ=p.pos.z;if(p.pos.z>mxZ)mxZ=p.pos.z}
  const pad=10,rX=mxX-mnX+pad*2,rZ=mxZ-mnZ+pad*2,sc=Math.min((w-10)/rX,(h-10)/rZ);
  const oX=(w-rX*sc)/2,oZ=(h-rZ*sc)/2;
  function mX(x){return oX+(x-mnX+pad)*sc}function mZ(z){return oZ+(z-mnZ+pad)*sc}
  ctx.strokeStyle='#666';ctx.lineWidth=3;ctx.beginPath();
  for(let i=0;i<tPts.length;i+=4){if(i===0)ctx.moveTo(mX(tPts[i].pos.x),mZ(tPts[i].pos.z));else ctx.lineTo(mX(tPts[i].pos.x),mZ(tPts[i].pos.z))}
  ctx.closePath();ctx.stroke();
  ctx.fillStyle='#44ff88';for(const cp of cpPos){ctx.beginPath();ctx.arc(mX(cp.x),mZ(cp.z),2,0,Math.PI*2);ctx.fill()}
  ctx.fillStyle='#ff3322';ctx.beginPath();ctx.arc(mX(kartPos.x),mZ(kartPos.z),3,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#ff3322';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(mX(kartPos.x),mZ(kartPos.z));
  ctx.lineTo(mX(kartPos.x+Math.sin(kartAng)*5),mZ(kartPos.z+Math.cos(kartAng)*5));ctx.stroke();
}

// === CLOUDS ===
function updateClouds(){for(const c of clouds){c.position.x+=c.userData.spd;if(c.position.x>80)c.position.x=-80}}

// === GAME FLOW ===
function startRace(){
  state='countdown';lapTime=0;curCP=-1;lapDone=false;
  document.getElementById('title-screen').style.display='none';
  document.getElementById('results-screen').style.display='none';
  document.getElementById('hud').style.display='block';
  document.getElementById('minimap').style.display='block';
  resetKart();
  const cd=document.getElementById('countdown');
  const msgs=['3','2','1','GO!'];let i=0;
  function showMsg(){
    if(i>=msgs.length){cd.style.opacity='0';state='racing';raceT=performance.now();return}
    cd.textContent=msgs[i];cd.style.opacity='1';
    if(i<3)cd.style.fontSize='80px';else{cd.style.fontSize='60px';cd.style.color='#44ff88'}
    i++;setTimeout(showMsg,800);
  }
  cd.style.color='#ff6600';showMsg();
}

// === RESIZE ===
window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight)});

// === MAIN LOOP ===
let lastTime=0;
function animate(time){
  requestAnimationFrame(animate);
  const dt=Math.min((time-lastTime)/1000,0.05);
  lastTime=time;
  updateKart(dt);updateCamera();updateClouds();
  if(state==='racing'||state==='countdown')updateHUD();
  if(state!=='title')drawMinimap();
  renderer.render(scene,camera);
}

// === INIT ===
buildTrack();createKart();
document.getElementById('loading').style.opacity='0';
setTimeout(()=>{document.getElementById('loading').style.display='none';document.getElementById('title-screen').style.display='flex'},500);
animate(0);
