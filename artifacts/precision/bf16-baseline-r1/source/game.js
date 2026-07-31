(function(){'use strict';
// --- PRNG ---
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
var SEED=0x41504558, RNG=mulberry32(SEED);
var TW=16,MAX_SPD=45,ACCEL=28,BRAKE=40,REV_SPD=12,TURN=2.8,OFF_DRAG=.92,BOOST_M=1.8,BOOST_D=2.0;
var ST={MENU:0,CD:1,RACE:2,DONE:3},state=ST.MENU,raceTime=0,cpsPassed=[],demoMode=false,boostT=0,dSteer=0,dThrottle=0,keys={};

// --- Three.js ---
var scene=new THREE.Scene();
scene.background=new THREE.Color(0x87CEEB);
scene.fog=new THREE.Fog(0x87CEEB,120,350);
var cam=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,0.5,500);
var rend=new THREE.WebGLRenderer({antialias:true});
rend.setSize(innerWidth,innerHeight);
rend.setPixelRatio(Math.min(devicePixelRatio,2));
rend.shadowMap.enabled=true;
rend.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.appendChild(rend.domElement);
scene.add(new THREE.AmbientLight(0xffffff,.6));
var sun=new THREE.DirectionalLight(0xfff5e0,1.0);
sun.position.set(60,80,40);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-100,right:100,top:100,bottom:-100,near:1,far:250});
scene.add(sun);
scene.add(new THREE.HemisphereLight(0x87CEEB,0x44aa44,.4));

// --- TRACK ---
function genTrack(n,rng){var cp=8,R=80,ctrl=[];for(var i=0;i<cp;i++){var a=(i/cp)*Math.PI*2,r=R+(rng()-.5)*50;ctrl.push(new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r))}var pts=[],sps=Math.floor(n/cp);for(var i=0;i<cp;i++){var p0=ctrl[(i-1+cp)%cp],p1=ctrl[i],p2=ctrl[(i+1)%cp],p3=ctrl[(i+2)%cp];for(var j=0;j<sps;j++){var t=j/sps,t2=t*t,t3=t2*t;var x=.5*((2*p1.x)+(-p0.x+p2.x)*t+(2*p0.x-5*p1.x+4*p2.x-p3.x)*t2+(-p0.x+3*p1.x-3*p2.x+p3.x)*t3);var z=.5*((2*p1.z)+(-p0.z+p2.z)*t+(2*p0.z-5*p1.z+4*p2.z-p3.z)*t2+(-p0.z+3*p1.z-3*p2.z+p3.z)*t3);var y=Math.sin(t*Math.PI*2+i)*2+Math.sin(t*Math.PI*4)*1.5;pts.push(new THREE.Vector3(x,y,z))}}return pts}
var TP=genTrack(120,RNG);
function tan(i){var n=TP.length;return new THREE.Vector3().subVectors(TP[(i+1)%n],TP[(i-1+n)%n]).normalize()}
function norm(i){var t=tan(i);return new THREE.Vector3(-t.z,0,t.x)}
function closest(pos){var md=Infinity,mi=0;for(var i=0;i<TP.length;i++){var dx=pos.x-TP[i].x,dz=pos.z-TP[i].z,d=dx*dx+dz*dz;if(d<md){md=d;mi=i}}return{i:mi,d:Math.sqrt(md)}}

function buildTrack(){
  var len=TP.length,V=[],N=[],U=[],I=[],C=[],hw=TW*.5,cw=1.2;
  for(var i=0;i<len;i++){
    var p=TP[i],n=norm(i);
    var dirs=[n.clone().multiplyScalar(hw),n.clone().multiplyScalar(-hw),
      n.clone().multiplyScalar(hw-cw),n.clone().multiplyScalar(-hw+cw),
      n.clone().multiplyScalar(-hw),n.clone().multiplyScalar(hw)];
    var yb=p.y+.1,yc=p.y+.15,yr=p.y+.12;
    var yo=[yb,yb,yc,yc,yb,yb];
    var cd=[
      [.55,.38,.22],[.55,.38,.22],
      [i%4<2?.9:.15,i%4<2?.12:.12,.12],[i%4<2?.9:.15,i%4<2?.12:.12,.12],
      [.55,.38,.22],[.55,.38,.22]];
    for(var v=0;v<6;v++){
      V.push(p.x+dirs[v].x, yo[v], p.z+dirs[v].z);
      N.push(0,1,0);U.push(v%2?1:0,i/len);C.push(cd[v][0],cd[v][1],cd[v][2]);
    }
    var cl=n.clone().multiplyScalar(hw-cw),cr=n.clone().multiplyScalar(-hw+cw);
    V.push(p.x+cl.x,yr,p.z+cl.z);N.push(0,1,0);U.push(.2,i/len);C.push(.28,.28,.3);
    V.push(p.x+cr.x,yr,p.z+cr.z);N.push(0,1,0);U.push(.8,i/len);C.push(.28,.28,.3);
  }
  for(var i=0;i<len;i++){var li=i*8,ni=((i+1)%len)*8;for(var v=0;v<8;v++){I.push(li+v,ni+v,ni+(v+1)%8);I.push(li+v,ni+(v+1)%8,li+(v+1)%8)}}
  var geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(V,3));
  geo.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));
  geo.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
  geo.setIndex(I);
  var mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85}));
  mesh.receiveShadow=true;return mesh;
}
scene.add(buildTrack());

// Start/finish line
(function(){var p=TP[0],t=tan(0);var cv=document.createElement('canvas');cv.width=64;cv.height=16;var cx=cv.getContext('2d');for(var r=0;r<2;r++)for(var c=0;c<8;c++){cx.fillStyle=(r+c)%2?'#111':'#fff';cx.fillRect(c*8,r*8,8,8)}var tex=new THREE.CanvasTexture(cv);tex.magFilter=THREE.NearestFilter;var ln=new THREE.Mesh(new THREE.PlaneGeometry(TW,2.5),new THREE.MeshStandardMaterial({map:tex,roughness:.6}));ln.rotation.x=-Math.PI/2;ln.position.set(p.x,p.y+.25,p.z);ln.rotation.z=-Math.atan2(t.z,t.x)+Math.PI/2;ln.receiveShadow=true;scene.add(ln)})();
var cpIdx=[0,15,35,55,75,95];

// --- TERRAIN ---
var ground=new THREE.Mesh(new THREE.PlaneGeometry(600,600),new THREE.MeshStandardMaterial({color:0x44aa44,roughness:.95}));
ground.rotation.x=-Math.PI/2;ground.position.y=-.5;ground.receiveShadow=true;scene.add(ground);

for(var i=0;i<60;i++){var a=RNG()*Math.PI*2,d=100+RNG()*180,x=Math.cos(a)*d,z=Math.sin(a)*d;var h=new THREE.Mesh(new THREE.ConeGeometry(3+RNG()*6,3+RNG()*8,6+Math.floor(RNG()*4)),new THREE.MeshStandardMaterial({color:[0x3a8c3a,0x2d7a2d,0x4a9e4a][Math.floor(RNG()*3)],flatShading:true,roughness:.9}));h.position.set(x,(3+RNG()*8)*.5-.5,z);h.castShadow=true;h.receiveShadow=true;scene.add(h)}

function mkTree(x,z){var g=new THREE.Group();var tk=new THREE.Mesh(new THREE.CylinderGeometry(.4,.6,3,5),new THREE.MeshStandardMaterial({color:0x8B4513,flatShading:true}));tk.position.y=1.5;tk.castShadow=true;g.add(tk);var cols=[0x228B22,0x2d9a2d,0x1a7a1a];for(var i=0;i<3;i++){var r=2.5-i*.5+RNG()*.5,hh=2.5-i*.3;var f=new THREE.Mesh(new THREE.ConeGeometry(r,hh,6),new THREE.MeshStandardMaterial({color:cols[Math.floor(RNG()*cols.length)],flatShading:true}));f.position.y=3.5+i*1.5;f.castShadow=true;g.add(f)}g.position.set(x,0,z);return g}
for(var i=0;i<80;i++){var a=RNG()*Math.PI*2,d=20+RNG()*200,x=Math.cos(a)*d,z=Math.sin(a)*d;var c=closest(new THREE.Vector3(x,0,z));if(c.d<TW*.8)continue;scene.add(mkTree(x,z))}

for(var i=0;i<40;i++){var a=RNG()*Math.PI*2,d=15+RNG()*200,x=Math.cos(a)*d,z=Math.sin(a)*d;var c=closest(new THREE.Vector3(x,0,z));if(c.d<TW)continue;var s=.5+RNG()*2;var rk=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0),new THREE.MeshStandardMaterial({color:0x888888,flatShading:true,roughness:.95}));rk.position.set(x,s*.3,z);rk.rotation.set(RNG()*Math.PI,RNG()*Math.PI,RNG()*Math.PI);rk.castShadow=true;scene.add(rk)}

for(var i=0;i<25;i++){var a=RNG()*Math.PI*2,d=20+RNG()*150,x=Math.cos(a)*d,z=Math.sin(a)*d;var c=closest(new THREE.Vector3(x,0,z));if(c.d<TW)continue;var fg=new THREE.Group();var fc=[0xff4466,0xffaa00,0xff66cc,0xffff00,0xff8844];for(var j=0;j<6;j++){var fx=(RNG()-.5)*2,fz=(RNG()-.5)*2;var st=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.6,3),new THREE.MeshStandardMaterial({color:0x228822}));st.position.set(fx,.3,fz);fg.add(st);var pt=new THREE.Mesh(new THREE.SphereGeometry(.15,4,3),new THREE.MeshStandardMaterial({color:fc[Math.floor(RNG()*fc.length)],flatShading:true}));pt.position.set(fx,.6,fz);fg.add(pt)}fg.position.set(x,0,z);scene.add(fg)}

// --- KART MODEL ---
function createKart(col){
  var k=new THREE.Group();
  var bm=new THREE.MeshStandardMaterial({color:col,roughness:.4,metalness:.3,flatShading:true});
  var dm=new THREE.MeshStandardMaterial({color:0x333333,flatShading:true});
  var wm=new THREE.MeshStandardMaterial({color:0x111111,roughness:.7});
  // Body
  var body=new THREE.Mesh(new THREE.BoxGeometry(1.2,.7,2.0),bm);body.position.y=.6;body.castShadow=true;k.add(body);
  var nose=new THREE.Mesh(new THREE.BoxGeometry(1.0,.5,.4),bm);nose.position.set(0,.5,1.15);nose.castShadow=true;k.add(nose);
  var seat=new THREE.Mesh(new THREE.BoxGeometry(1.0,.5,.8),dm);seat.position.set(0,1.0,-.1);seat.castShadow=true;k.add(seat);
  // Driver
  var head=new THREE.Mesh(new THREE.SphereGeometry(.3,6,5),new THREE.MeshStandardMaterial({color:0xffcc88,flatShading:true}));
  head.position.set(0,1.5,-.1);head.castShadow=true;k.add(head);
  var helm=new THREE.Mesh(new THREE.SphereGeometry(.33,6,4,0,Math.PI*2,0,Math.PI*.6),new THREE.MeshStandardMaterial({color:col,flatShading:true}));
  helm.position.set(0,1.55,-.1);helm.castShadow=true;k.add(helm);
  var visor=new THREE.Mesh(new THREE.BoxGeometry(.4,.12,.15),new THREE.MeshStandardMaterial({color:0x222222,metalness:.5}));
  visor.position.set(0,1.55,.15);k.add(visor);
  // Spoiler
  var sp=new THREE.Mesh(new THREE.BoxGeometry(1.4,.15,.3),new THREE.MeshStandardMaterial({color:0x222222,flatShading:true}));
  sp.position.set(0,.4,1.05);sp.castShadow=true;k.add(sp);
  var wing=new THREE.Mesh(new THREE.BoxGeometry(1.6,.1,.3),bm);wing.position.set(0,1.6,-.9);wing.castShadow=true;k.add(wing);
  for(var s=-1;s<=1;s+=2){var st=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.5,4),new THREE.MeshStandardMaterial({color:0x666666}));st.position.set(s*.6,1.35,-.9);k.add(st)}
  // Wheels
  var wg=new THREE.CylinderGeometry(.35,.35,.25,8);
  var wheelPos=[[-.7,.35,.85],[.7,.35,.85],[-.7,.35,-.75],[.7,.35,-.75]];
  for(var wi=0;wi<wheelPos.length;wi++){var w=wheelPos[wi];var wh=new THREE.Mesh(wg,wm);wh.rotation.z=Math.PI/2;wh.position.set(w[0],w[1],w[2]);wh.castShadow=true;k.add(wh)}
  // Exhaust
  var ex=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.5,6),new THREE.MeshStandardMaterial({color:0x555555,metalness:.8}));
  ex.rotation.x=Math.PI/2;ex.position.set(.5,.35,-1.0);k.add(ex);
  // Number plate
  var nc=document.createElement('canvas');nc.width=64;nc.height=64;var nx=nc.getContext('2d');
  nx.fillStyle='#fff';nx.fillRect(0,0,64,64);nx.fillStyle='#000';nx.font='bold 40px monospace';
  nx.textAlign='center';nx.textBaseline='middle';nx.fillText('1',32,34);
  var ntx=new THREE.CanvasTexture(nc);var np=new THREE.Mesh(new THREE.PlaneGeometry(.5,.5),new THREE.MeshStandardMaterial({map:ntx}));
  np.position.set(0,.85,1.01);k.add(np);
  return k;
}
var kart=createKart(0xff3333);scene.add(kart);

var ks={pos:new THREE.Vector3(),heading:0,speed:0,offRoad:false};
function resetKart(){var sp=TP[0],t=tan(0);ks.pos.copy(sp);ks.pos.y+=.5;ks.heading=Math.atan2(t.x,t.z);ks.speed=0;ks.offRoad=false;cpsPassed=[];boostT=0;raceTime=0}

// --- BOOST ORBS ---
var orbMeshes=[];
function spawnOrbs(){orbMeshes.forEach(function(o){scene.remove(o.mesh);scene.remove(o.ring)});orbMeshes=[];[10,30,50,70,90].forEach(function(idx){var p=TP[idx],n=norm(idx);var off=(RNG()-.5)*TW*.4;var op=new THREE.Vector3().copy(p).add(n.clone().multiplyScalar(off));var m=new THREE.Mesh(new THREE.OctahedronGeometry(.6,0),new THREE.MeshStandardMaterial({color:0xffdd00,emissive:0xffaa00,emissiveIntensity:.5,flatShading:true,metalness:.3}));m.position.set(op.x,op.y+1.5,op.z);m.castShadow=true;scene.add(m);var r=new THREE.Mesh(new THREE.TorusGeometry(.8,.08,4,8),new THREE.MeshStandardMaterial({color:0xffff00,emissive:0xffaa00,emissiveIntensity:.3,transparent:true,opacity:.6}));r.position.copy(m.position);scene.add(r);orbMeshes.push({mesh:m,ring:r,pos:op,active:true})})}
spawnOrbs();

// --- INPUT ---
window.addEventListener('keydown',function(e){keys[e.code]=true;if(e.code==='Enter'){if(state===ST.MENU)startCD();else if(state===ST.DONE)restart()}if(e.code==='KeyF'){demoMode=!demoMode;document.getElementById('demo-badge').style.display=demoMode?'block':'none'}});
window.addEventListener('keyup',function(e){keys[e.code]=false});

// --- GAME FLOW ---
var cdVal=3,cdT=0;
function startCD(){state=ST.CD;cdVal=3;cdT=0;resetKart();document.getElementById('start-screen').style.display='none';document.getElementById('countdown').style.display='block';spawnOrbs()}
function restart(){document.getElementById('finish-screen').style.display='none';startCD()}
function finishRace(){state=ST.DONE;document.getElementById('countdown').style.display='none';document.getElementById('final-time').textContent=fmtTime(raceTime);document.getElementById('finish-screen').style.display='flex'}
function fmtTime(t){var m=Math.floor(t/60),s=Math.floor(t%60),ms=Math.floor((t%1)*1000);return(String(m).padStart(2,'0'))+':'+(String(s).padStart(2,'0'))+'.'+(String(ms).padStart(3,'0'))}

// --- DEMO AI ---
function demoAI(){if(!demoMode||state!==ST.RACE)return;var c=closest(ks.pos);var ti=(c.i+12)%TP.length;var tg=TP[ti];var dx=tg.x-ks.pos.x,dz=tg.z-ks.pos.z;var dh=Math.atan2(dx,dz)-ks.heading;while(dh>Math.PI)dh-=Math.PI*2;while(dh<-Math.PI)dh+=Math.PI*2;dSteer=Math.max(-1,Math.min(1,dh*2.5));dThrottle=.9;if(Math.abs(dh)>.8)dThrottle=.5;if(Math.abs(dh)>1.2)dThrottle=.3}

// --- PHYSICS ---
function updateKart(dt){
  if(state!==ST.RACE)return;
  if(state===ST.CD&&cdVal>0)return;
  var thr=0,str=0,brk=0;
  if(demoMode){demoAI();thr=dThrottle;str=dSteer}
  else{if(keys['ArrowUp']||keys['KeyW'])thr=1;if(keys['ArrowDown']||keys['KeyS'])brk=1;if(keys['ArrowLeft']||keys['KeyA'])str=-1;if(keys['ArrowRight']||keys['KeyD'])str=1}

  var c=closest(ks.pos);ks.offRoad=c.d>TW*.45;
  var topSpd=ks.offRoad?MAX_SPD*.4:MAX_SPD;if(boostT>0)topSpd*=BOOST_M;

  if(thr>0){ks.speed+=ACCEL*dt*thr;ks.speed=Math.min(ks.speed,topSpd)}
  else if(brk>0){if(ks.speed>.5){ks.speed-=BRAKE*dt;if(ks.speed<0)ks.speed=0}else{ks.speed-=REV_SPD*dt*.5;ks.speed=Math.max(ks.speed,-REV_SPD)}}
  else{ks.speed*=(1-1.5*dt);if(Math.abs(ks.speed)<.1)ks.speed=0}
  if(ks.offRoad)ks.speed*=Math.pow(OFF_DRAG,dt*60);

  var spf=Math.min(1,Math.abs(ks.speed)/10);
  if(Math.abs(ks.speed)>.5)ks.heading+=str*TURN*dt*spf*Math.sign(ks.speed);

  ks.pos.x+=Math.sin(ks.heading)*ks.speed*dt;
  ks.pos.z+=Math.cos(ks.heading)*ks.speed*dt;
  ks.pos.y=TP[c.i].y+.5;

  if(c.d>TW*1.5){var nn=norm(c.i);ks.pos.x-=nn.x*(c.d-TW*1.5)*dt*10;ks.pos.z-=nn.z*(c.d-TW*1.5)*dt*10;ks.speed*=.95}

  if(boostT>0)boostT-=dt;
  for(var o=0;o<orbMeshes.length;o++){if(!orbMeshes[o].active)continue;var dx=ks.pos.x-orbMeshes[o].pos.x,dz=ks.pos.z-orbMeshes[o].pos.z;if(dx*dx+dz*dz<9){orbMeshes[o].active=false;orbMeshes[o].mesh.visible=false;orbMeshes[o].ring.visible=false;boostT=BOOST_D}}

  // Checkpoints
  for(var p=0;p<cpIdx.length;p++){var cp=cpIdx[p];var dx2=ks.pos.x-TP[cp].x,dz2=ks.pos.z-TP[cp].z;if(dx2*dx2+dz2*dz2<100){if(cpsPassed.indexOf(cp)===-1){var lastCp=cpsPassed.length>0?cpsPassed[cpsPassed.length-1]:0;var expected=(cpIdx.indexOf(lastCp)+1)%cpIdx.length;if(p===expected||cpsPassed.length===0){cpsPassed.push(cp);if(cpsPassed.length>=cpIdx.length)finishRace()}}}}

  kart.position.copy(ks.pos);kart.rotation.y=-ks.heading+Math.PI/2;kart.rotation.z=-str*ks.speed*.003;
}

// --- CAMERA ---
function updateCam(){
  var behind=new THREE.Vector3(-Math.sin(ks.heading),0,-Math.cos(ks.heading));
  var dp=new THREE.Vector3().copy(ks.pos).add(behind.multiplyScalar(12));dp.y=ks.pos.y+6;
  cam.position.lerp(dp,.1);
  var la=new THREE.Vector3().copy(ks.pos).add(new THREE.Vector3(Math.sin(ks.heading),0,Math.cos(ks.heading)).multiplyScalar(10));la.y=ks.pos.y+2;
  cam.lookAt(la);
}

// --- HUD ---
function updateHUD(){
  if(state===ST.RACE)raceTime+=1/60;
  document.getElementById('timer').textContent=fmtTime(raceTime);
  var spd=Math.abs(ks.speed),pct=Math.min(100,spd/MAX_SPD*100);
  document.getElementById('speed-bar').style.width=pct+'%';
  document.getElementById('speed-text').textContent=Math.floor(spd*3.6)+' km/h';
  document.getElementById('speed-bar').style.background=boostT>0?'linear-gradient(90deg,#ff0,#f80,#f00)':'linear-gradient(90deg,#0f0,#ff0,#f40)';
  document.getElementById('lap-num').textContent=Math.min(1,Math.ceil(cpsPassed.length/cpIdx.length));
}

// --- MINIMAP ---
function drawMinimap(){
  var mc=document.getElementById('minimap'),ctx=mc.getContext('2d');
  ctx.clearRect(0,0,140,140);ctx.fillStyle='rgba(30,60,30,.8)';ctx.fillRect(0,0,140,140);
  var mnX=Infinity,mnZ=Infinity,mxX=-Infinity,mxZ=-Infinity;
  for(var i=0;i<TP.length;i+=3){if(TP[i].x<mnX)mnX=TP[i].x;if(TP[i].z<mnZ)mnZ=TP[i].z;if(TP[i].x>mxX)mxX=TP[i].x;if(TP[i].z>mxZ)mxZ=TP[i].z}
  var rng=Math.max(mxX-mnX,mxZ-mnZ)+20,cx=0,cz=0;
  for(var i=0;i<TP.length;i++){cx+=TP[i].x;cz+=TP[i].z}cx/=TP.length;cz/=TP.length;
  var sc=120/rng;
  ctx.strokeStyle='#666';ctx.lineWidth=6;ctx.beginPath();
  for(var i=0;i<TP.length;i++){var sx=70+(TP[i].x-cx)*sc,sz=70+(TP[i].z-cz)*sc;if(i===0)ctx.moveTo(sx,sz);else ctx.lineTo(sx,sz)}ctx.closePath();ctx.stroke();
  ctx.strokeStyle='#888';ctx.lineWidth=3;ctx.stroke();
  for(var i=0;i<cpIdx.length;i++){var p=TP[cpIdx[i]];var sx=70+(p.x-cx)*sc,sz=70+(p.z-cz)*sc;ctx.fillStyle=cpsPassed.indexOf(cpIdx[i])!==-1?'#0f0':'#f00';ctx.fillRect(sx-2,sz-2,4,4)}
  var kx=70+(ks.pos.x-cx)*sc,kz=70+(ks.pos.z-cz)*sc;
  ctx.fillStyle='#f00';ctx.beginPath();ctx.arc(kx,kz,4,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();
  ctx.strokeStyle='#ff0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(kx,kz);ctx.lineTo(kx-Math.sin(ks.heading)*10,kz-Math.cos(ks.heading)*10);ctx.stroke();
}

// --- ORB ANIMATION ---
var orbTime=0;
function animateOrbs(dt){orbTime+=dt;for(var i=0;i<orbMeshes.length;i++){if(!orbMeshes[i].active)continue;var o=orbMeshes[i];o.mesh.rotation.y=orbTime*3;o.mesh.rotation.x=orbTime*2;o.mesh.position.y=o.pos.y+1.5+Math.sin(orbTime*3+i)*.3;o.ring.rotation.x=orbTime*2;o.ring.rotation.z=orbTime*1.5;o.ring.position.y=o.mesh.position.y}}

// --- MAIN LOOP ---
var lastTime=0;
function gameLoop(time){
  requestAnimationFrame(gameLoop);
  var dt=Math.min((time-lastTime)/1000,.05);lastTime=time;

  if(state===ST.CD){
    cdT+=dt;
    if(cdT>=1){cdT=0;cdVal--;
      if(cdVal>0)document.getElementById('countdown').textContent=cdVal;
      else if(cdVal===0){
        document.getElementById('countdown').textContent='GO!';
        document.getElementById('countdown').style.color='#0f0';
        state=ST.RACE;
        setTimeout(function(){document.getElementById('countdown').style.display='none';document.getElementById('countdown').style.color='#fff'},1000);
      }
    }
  }

  updateKart(dt);
  updateCam();
  updateHUD();
  animateOrbs(dt);

  var minimapTimer=(minimapTimer||0)+dt;
  if(minimapTimer>.1){minimapTimer=0;drawMinimap()}

  rend.render(scene,cam);
}

// Initial camera position
resetKart();
cam.position.set(ks.pos.x-Math.sin(ks.heading)*12, ks.pos.y+6, ks.pos.z-Math.cos(ks.heading)*12);
cam.lookAt(ks.pos);

// Start render loop
gameLoop(0);

// Resize
window.addEventListener('resize',function(){cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();rend.setSize(innerWidth,innerHeight)});

})();
