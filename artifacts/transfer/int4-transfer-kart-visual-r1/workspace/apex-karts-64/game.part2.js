// Part 2: Game state, input, physics, camera, game loop
(function(){
"use strict";
const G=window._ak64;
const pos=new THREE.Vector3(),camPos=new THREE.Vector3();
let heading=0,speed=0,latSpd=0,steerAng=0,driftF=0;
let trackT=0,cpCount=4,curCP=0,lapDone=false,started=false,rt=0,finished=false,demo=false;
let cdState=0,cdTimer=0,prevSpeed=0,prevHeading=0;
let _dt=0; // module-level dt reference for use in updVis
const keys={};let emitTimer=0;

function nearestPt(p){let md=Infinity,mt=0;for(let i=0;i<G.TS;i++){const t=i/G.TS,tp2=G.curve.getPointAt(t);const d=(p.x-tp2.x)**2+(p.z-tp2.z)**2;if(d<md){md=d;mt=t}}return{t:mt,d:Math.sqrt(md)}}

function resetGame(){
  const st=G.curve.getPointAt(0.005);const ta=G.curve.getTangentAt(0.005);
  pos.copy(st);pos.y=st.y+0.5;heading=Math.atan2(ta.x,ta.z);
  speed=0;latSpd=0;steerAng=0;driftF=0;trackT=0.005;curCP=0;lapDone=false;started=false;rt=0;finished=false;demo=false;
  cdState=0;cdTimer=0;prevSpeed=0;prevHeading=heading;
  [G.exhaustPS,G.driftPS,G.trailPS].forEach(ps=>{for(let i=0;i<ps.maxC;i++){ps.pool[i].a=false;ps.geo.attributes.position.array[i*3+1]=-9999}ps.geo.attributes.position.needsUpdate=true});
  document.getElementById('msg').classList.remove('show');document.getElementById('cd').style.opacity='0';
  document.getElementById('bst').textContent='START';document.getElementById('bst').disabled=false;
  for(let i=0;i<4;i++)document.getElementById('lp'+i).classList.remove('done');
  updHUD();
}
document.addEventListener('keydown',e=>{keys[e.code]=true;e.preventDefault()});
document.addEventListener('keyup',e=>{keys[e.code]=false});
document.getElementById('bst').onclick=function(){if(!started&&!finished){cdState=1;cdTimer=0;this.textContent='RACING...';this.disabled=true}};
document.getElementById('bde').onclick=function(){resetGame();demo=true;cdState=1;cdTimer=0};
document.getElementById('bre').onclick=resetGame;

function fmtT(s){const m=Math.floor(s/60);return String(m).padStart(2,'0')+':'+(s%60).toFixed(2).padStart(5,'0')}
function showMsg(t){const e=document.getElementById('msg');e.textContent=t;e.classList.add('show')}

function updHUD(){
  const km=Math.round(Math.abs(speed)*5);
  document.getElementById('sv').innerHTML=km+' <span style="font-size:14px">km/h</span>';
  const pct=Math.min(100,(Math.abs(speed)/38)*100);const sf=document.getElementById('sf');sf.style.width=pct+'%';
  sf.style.background=pct<35?'linear-gradient(90deg,#4caf50,#66bb6a)':pct<70?'linear-gradient(90deg,#66bb6a,#ffeb3b)':pct<90?'linear-gradient(90deg,#ffeb3b,#ff9800)':'linear-gradient(90deg,#ff9800,#f44336)';
  document.getElementById('tv').textContent=fmtT(rt);document.getElementById('lv').textContent=lapDone?'1 / 1':'0 / 1';
  for(let i=0;i<4;i++){const el=document.getElementById('lp'+i);if(i<curCP)el.classList.add('done');else el.classList.remove('done')}
}

function updCD(dt){
  if(cdState<=0)return;cdTimer+=dt;const ce=document.getElementById('cd');const n=Math.ceil(3-cdTimer);
  if(n>0){ce.textContent=n;ce.style.opacity='1';ce.style.transform='translate(-50%,-50%) scale('+(1+Math.sin(cdTimer*Math.PI*2)*0.1)+')'}
  else{ce.textContent='GO!';ce.style.opacity='1';ce.style.transform='translate(-50%,-50%) scale(1.3)';if(cdTimer>4){cdState=0;started=true;ce.style.opacity='0'}}
}

function updDemo(dt){
  if(!demo||!started)return;const lt=(trackT+0.07)%1;const tp2=G.curve.getPointAt(lt);
  const dx=tp2.x-pos.x,dz=tp2.z-pos.z;let da=Math.atan2(dx,dz)-heading;
  while(da>Math.PI)da-=Math.PI*2;while(da<-Math.PI)da+=Math.PI*2;
  const si=Math.max(-1,Math.min(1,da*5));const th=Math.abs(da)>0.6?0.55:1;
  speed+=(th*18-speed*0.02)*dt;speed=Math.max(0,Math.min(32,speed));
  const tm=1-Math.abs(speed)/50;heading+=si*2.5*tm*dt;driftF=Math.max(0,driftF-dt*8);
  const nr=nearestPt(pos);if(nr.d>G.TW*0.4){const np2=G.curve.getPointAt(nr.t);pos.x+=(np2.x-pos.x)*dt*3;pos.z+=(np2.z-pos.z)*dt*3}
}

// Smooth camera with speed-based height/FOV and cornering lean
function updVis(){
  G.kartMesh.position.copy(pos);G.kartMesh.rotation.y=heading;
  G.kartMesh.rotation.z=-steerAng*0.15;

  // Wheel rotation: NEGATE to fix reversed spin (was += in original, should be -=)
  G.kartMesh.wheels.forEach(w=>{w.children[0].rotation.x-=speed*_dt*3});

  // Dynamic camera: speed adjusts height and distance
  const spFactor=Math.min(1,Math.abs(speed)/35);
  const camDist=8+spFactor*4;
  const camH=5-spFactor*1.2;
  const target=new THREE.Vector3(pos.x-Math.sin(heading)*camDist,pos.y+camH,pos.z-Math.cos(heading)*camDist);
  // Cornering lean
  const leanAmt=steerAng*1.5;
  target.x+=Math.cos(heading)*leanAmt;target.z-=Math.sin(heading)*leanAmt;
  // Smooth camera follow
  const lerpF=1-Math.pow(0.001,_dt);
  camPos.lerp(target,lerpF);
  G.cam.position.copy(camPos);
  G.cam.lookAt(pos.x,pos.y+1.5,pos.z);
  // Dynamic FOV
  const targetFOV=65+spFactor*8;
  G.cam.fov+=(targetFOV-G.cam.fov)*_dt*3;
  G.cam.updateProjectionMatrix();
  // Sky follows kart
  if(window._sky)window._sky.position.copy(pos);
}

function update(dt){
  if(finished)return;
  if(cdState>0){updCD(dt);updVis();return}
  if(!started)return;
  rt+=dt;

  if(demo){updDemo(dt)}
  else{
    const th=(keys['KeyW']||keys['ArrowUp'])?1:((keys['KeyS']||keys['ArrowDown'])?-1:0);
    const st=(keys['KeyA']||keys['ArrowLeft'])?-1:((keys['KeyD']||keys['ArrowRight'])?1:0);
    const hb=!!keys['Space'];
    if(th>0)speed+=18*dt;else if(th<0)speed-=30*dt;else speed-=Math.sign(speed)*6*dt;
    speed=Math.max(-10,Math.min(35,speed));
    const ts=1-Math.abs(speed)/50;
    if(st!==0)steerAng+=(st*3-steerAng)*dt*8;else steerAng*=0.9;
    if(hb){driftF=Math.min(1,driftF+dt*5);speed*=0.98}else{driftF=Math.max(0,driftF-dt*5)}
    heading+=steerAng*2.2*ts*dt*(1-driftF*0.4);
  }

  const move=speed*dt;pos.x+=Math.sin(heading)*move;pos.z+=Math.cos(heading)*move;
  const nr=nearestPt(pos);trackT=nr.t;
  if(nr.d<G.TW*0.5){const tp3=G.curve.getPointAt(nr.t);pos.y=tp3.y+0.5}
  else if(nr.d<G.TW*0.8){speed*=0.97;pos.y=Math.max(-0.5,pos.y-dt*2)}
  else{speed*=0.92;pos.y=Math.max(-1,pos.y-dt*3)}

  if(started&&!lapDone&&speed>1){
    const cpZones=[0.005,0.255,0.505,0.755];const zone=cpZones[curCP]||0.005;
    if(Math.abs(trackT-zone)<0.05||Math.abs(trackT-1+zone)<0.05){
      curCP++;if(curCP>=cpCount){lapDone=true;finished=true;showMsg('FINISH!');setTimeout(()=>showMsg('Time: '+fmtT(rt)),1500)}
    }
  }

  // Emit particles
  emitTimer+=dt;
  if(emitTimer>0.03&&started){
    emitTimer=0;
    // Exhaust smoke
    if(Math.abs(speed)>2){
      const ex1=new THREE.Vector3(-0.4,0.35,-1.5).applyAxisAngle(new THREE.Vector3(0,1,0),heading);
      const ex2=new THREE.Vector3(0.4,0.35,-1.5).applyAxisAngle(new THREE.Vector3(0,1,0),heading);
      const sr=0.4+Math.random()*0.2;
      G.emit(G.exhaustPS,pos.x+ex1.x,pos.y+ex1.y,pos.z+ex1.z,(Math.random()-0.5)*0.5,0.5+Math.random()*0.5,(Math.random()-0.5)*0.5,0.6+Math.random()*0.4,sr,sr*0.9,sr*0.8);
      G.emit(G.exhaustPS,pos.x+ex2.x,pos.y+ex2.y,pos.z+ex2.z,(Math.random()-0.5)*0.5,0.5+Math.random()*0.5,(Math.random()-0.5)*0.5,0.6+Math.random()*0.4,sr,sr*0.9,sr*0.8);
    }
    // Drift sparks/dust
    if(driftF>0.2){
      const bw=new THREE.Vector3(-0.6,0.1,-0.8).applyAxisAngle(new THREE.Vector3(0,1,0),heading);
      const bf=new THREE.Vector3(0.6,0.1,-0.8).applyAxisAngle(new THREE.Vector3(0,1,0),heading);
      G.emit(G.driftPS,pos.x+bw.x,pos.y+bw.y,pos.z+bw.z,(Math.random()-0.5)*2,0.5+Math.random()*1.5,(Math.random()-0.5)*2,0.3+Math.random()*0.3,1,0.7+Math.random()*0.3,0.2);
      G.emit(G.driftPS,pos.x+bf.x,pos.y+bf.y,pos.z+bf.z,(Math.random()-0.5)*2,0.5+Math.random()*1.5,(Math.random()-0.5)*2,0.3+Math.random()*0.3,1,0.7+Math.random()*0.3,0.2);
    }
    // Speed trails
    if(Math.abs(speed)>25){
      const tt=new THREE.Vector3(0,0.5,-2).applyAxisAngle(new THREE.Vector3(0,1,0),heading);
      G.emit(G.trailPS,pos.x+tt.x+Math.sin(heading)*1.5,pos.y+tt.y-0.1,pos.z+tt.z+Math.cos(heading)*1.5,-Math.sin(heading)*2,0.1,-Math.cos(heading)*2,0.3,1,0.2,0.1);
    }
  }
  G.updatePS(G.exhaustPS,dt);G.updatePS(G.driftPS,dt);G.updatePS(G.trailPS,dt);
  prevSpeed=speed;prevHeading=heading;
  updVis();updHUD();
}

// Game loop
let last=performance.now();
function loop(){
  requestAnimationFrame(loop);
  const now=performance.now();_dt=Math.min((now-last)/1000,0.05);last=now;
  update(_dt);
  sun.position.set(pos.x+50,80,pos.z+30);sun.target.position.copy(pos);sun.target.updateMatrixWorld();
  G.ren.render(G.scene,G.cam);
}

resetGame();updVis();updHUD();
camPos.set(pos.x-Math.sin(heading)*8,pos.y+5,pos.z-Math.cos(heading)*8);

loop();
window.addEventListener('resize',()=>{G.cam.aspect=innerWidth/innerHeight;G.cam.updateProjectionMatrix();G.ren.setSize(innerWidth,innerHeight)});
})();