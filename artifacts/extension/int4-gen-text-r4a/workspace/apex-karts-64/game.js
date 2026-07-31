// APEX KARTS 64 - Game Logic
(function(){
function mr(s){return function(){s=s*16807%2147483647;return(s-1)/2147483646}}
const SEED=42;
let scene,camera,renderer,clock,kartGroup;
let trackPath=[],totalCP=0,cpIdx=[];
let trees=[],particles=[];
let keys={};
let mode='menu',raceStart=0,raceFinished=false,minimapOn=true;
let cdTimer=0,demoRng,lapCount=0;
const P={ms:45,bms:70,ac:28,br:40,rm:14,ra:14,ts:3.0,of:.4,fr:6,dr:.88,dd:25,dr2:.12};
const S={p:new THREE.Vector3(),h:0,sp:0,bf:100,drift:false,da:0,ti:0,pcs:new Set()};

function initScene(){
scene=new THREE.Scene();scene.background=new THREE.Color(0x87CEEB);scene.fog=new THREE.Fog(0x87CEEB,200,400);
camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.5,500);
renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;
document.body.insertBefore(renderer.domElement,document.body.firstChild);
scene.add(new THREE.AmbientLight(0x8899aa,.6));
const sun=new THREE.DirectionalLight(0xffeedd,1);sun.position.set(100,150,80);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.near=1;sun.shadow.camera.far=400;
sun.shadow.camera.left=-200;sun.shadow.camera.right=200;sun.shadow.camera.top=200;sun.shadow.camera.bottom=-200;
scene.add(sun);scene.add(new THREE.HemisphereLight(0x88bbff,0x446622,.4));
clock=new THREE.Clock();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)})
}

function cr(p0,p1,p2,p3,t){const t2=t*t,t3=t2*t;return.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t2+(-p0+3*p1-3*p2+p3)*t3)}
function genTrack(){
const w=[{x:-120,z:-80},{x:-100,z:-140},{x:-40,z:-160},{x:40,z:-150},{x:100,z:-120},{x:140,z:-70},{x:160,z:-20},{x:140,z:30},{x:100,z:70},{x:40,z:100},{x:-30,z:110},{x:-80,z:90},{x:-130,z:50},{x:-150,z:0},{x:-140,z:-40},{x:-100,z:-60},{x:-60,z:-40},{x:-40,z:-70},{x:-60,z:-100},{x:-90,z:-95},{x:-110,z:-75}];
const pts=[],n=w.length;
for(let i=0;i<n;i++){const p0=w[(i-1+n)%n],p1=w[i],p2=w[(i+1)%n],p3=w[(i+2)%n];
for(let t=0;t<20;t++)pts.push({x:cr(p0.x,p1.x,p2.x,p3.x,t/20),z:cr(p0.z,p1.z,p2.z,p3.z,t/20)})}
return pts}

function buildTrack(){
trackPath=genTrack();const n=trackPath.length,hw=7;
const v=[],c=[],ix=[];const rc=[.33,.33,.36];
for(let i=0;i<n;i++){const cu=trackPath[i],ne=trackPath[(i+1)%n];
const dx=ne.x-cu.x,dz=ne.z-cu.z,ln=Math.sqrt(dx*dx+dz*dz);const nx=-dz/ln,nz=dx/ln;
const isR=(i%4)<2;const rcc=isR?[.85,.15,.15]:[.88,.88,.88];
for(let s=-1;s<=1;s+=2){const o=s*hw;v.push(cu.x+nx*o,.05,cu.z+nz*o);c.push(rc[0],rc[1],rc[2]);
const ro=s*(hw+1.2);v.push(cu.x+nx*ro,.03,cu.z+nz*ro);c.push(rcc[0],rcc[1],rcc[2])}}
for(let i=0;i<n;i++){const ni=(i+1)%n,b=i*4,nb=ni*4;
ix.push(b,b+1,nb);ix.push(nb,nb+1,b+1);ix.push(b+2,b+3,nb+2);ix.push(nb+2,nb+3,b+3);
ix.push(b+4,b+5,nb+4);ix.push(nb+4,nb+5,b+5)}
const geo=new THREE.BufferGeometry();
geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));
geo.setAttribute('color',new THREE.Float32BufferAttribute(c,3));geo.setIndex(ix);geo.computeVertexNormals();
const road=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true}));road.receiveShadow=true;scene.add(road);
const sp=trackPath[0],sn=trackPath[1];const sdx=sn.x-sp.x,sdz=sn.z-sp.z;
const cv=document.createElement('canvas');cv.width=128;cv.height=32;const cx=cv.getContext('2d');
for(let r=0;r<32;r+=8)for(let cl=0;cl<128;cl+=8){cx.fillStyle=((cl/8+r/8)%2===0)?'#fff':'#222';cx.fillRect(cl,r,8,8)}
const cm=new THREE.Mesh(new THREE.PlaneGeometry(14,3),new THREE.MeshLambertMaterial({map:new THREE.CanvasTexture(cv)}));
cm.rotation.x=-Math.PI/2;cm.position.set(sp.x,.09,sp.z);cm.rotation.z=-Math.atan2(sdx,sdz);scene.add(cm);
totalCP=4;cpIdx=[];for(let i=0;i<totalCP;i++)cpIdx.push(Math.floor(i*n/totalCP));cpIdx.push(0);
const gv=[],gc=[];const gs=400,gh=gs/2,gg=20;
for(let y=-gh;y<=gh;y+=gs/gg)for(let x=-gh;x<=gh;x+=gs/gg){
const c1=((x+gh)/(gs/gg)+(y+gh)/(gs/gg))%2<1?[.15,.52,.15]:[.10,.38,.12];
gv.push(x,.02,y,x+gs/gg,.02,y,x,.02,y+gs/gg,x+gs/gg,.02,y+gs/gg);
for(let k=0;k<4;k++)gc.push(c1[0],c1[1],c1[2])}
const gg2=new THREE.BufferGeometry();gg2.setAttribute('position',new THREE.Float32BufferAttribute(gv,3));
gg2.setAttribute('color',new THREE.Float32BufferAttribute(gc,3));gg2.computeVertexNormals();
const gm=new THREE.Mesh(gg2,new THREE.MeshLambertMaterial({vertexColors:true}));gm.position.y=-.06;scene.add(gm);
trees=[];const tr=mr(SEED+1);
function addTree(x,z,sc){const g=new THREE.Group();
const tr2=new THREE.Mesh(new THREE.CylinderGeometry(.3*sc,.5*sc,2*sc,6),new THREE.MeshLambertMaterial({color:0x8B4513}));
tr2.position.y=sc;tr2.castShadow=true;g.add(tr2);
const fc=[0x228B22,0x32CD32,0x2E8B57,0x3CB371];
for(let l=0;l<3;l++){const f=new THREE.Mesh(new THREE.ConeGeometry((2.2-l*.5)*sc,1.6*sc,6),new THREE.MeshLambertMaterial({color:fc[Math.floor(tr()*fc.length)]}));
f.position.y=(2.2+l*1.1)*sc;f.castShadow=true;g.add(f)}
g.position.set(x,0,z);scene.add(g);trees.push(g)}
const sk=Math.max(1,Math.floor(n/70));
for(let i=0;i<n;i+=sk){const p=trackPath[i],np=trackPath[(i+1)%n];
const dx=np.x-p.x,dz=np.z-p.z,ln=Math.sqrt(dx*dx+dz*dz);const nx=-dz/ln,nz=dx/ln;
for(let s=-1;s<=1;s+=2){const d=hw+8+tr()*15;addTree(p.x+nx*d*s,p.z+nz*d*s,.6+tr()*.7)}}
for(let i=0;i<n;i+=Math.max(1,Math.floor(n/50))){const p=trackPath[i],np=trackPath[(i+1)%n];
const dx=np.x-p.x,dz=np.z-p.z,ln=Math.sqrt(dx*dx+dz*dz);const nx=-dz/ln,nz=dx/ln;
for(let s=-1;s<=1;s+=2){const o=hw+.3;const col=(Math.floor(i/(n/50))%2===0)?0xff4444:0xffffff;
const ps=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,1.2,5),new THREE.MeshLambertMaterial({color:col}));
ps.position.set(p.x+nx*o*s,.6,p.z+nz*o*s);scene.add(ps)}}
const mr2=mr(SEED+200);
for(let i=0;i<12;i++){const mg=new THREE.ConeGeometry(25+mr2()*30,30+mr2()*40,5);
const mm2=new THREE.MeshLambertMaterial({color:new THREE.Color().setHSL(.6,.2,.35+mr2()*.15)});
const mt=new THREE.Mesh(mg,mm2);const a=mr2()*Math.PI*2,d=250+mr2()*80;
mt.position.set(Math.cos(a)*d,0,Math.sin(a)*d);scene.add(mt)}}

function buildKart(){
kartGroup=new THREE.Group();
const bd=new THREE.Mesh(new THREE.BoxGeometry(1.8,.6,3.2),new THREE.MeshLambertMaterial({color:0xcc2222}));
bd.position.y=.6;bd.castShadow=true;kartGroup.add(bd);
const st=new THREE.Mesh(new THREE.BoxGeometry(1.85,.12,2.8),new THREE.MeshLambertMaterial({color:0xffcc00}));st.position.y=.78;kartGroup.add(st);
const ca=new THREE.Mesh(new THREE.BoxGeometry(1.3,.45,1.1),new THREE.MeshLambertMaterial({color:0x333333}));
ca.position.set(0,1.05,.25);ca.castShadow=true;kartGroup.add(ca);
const hm=new THREE.Mesh(new THREE.SphereGeometry(.35,8,6),new THREE.MeshLambertMaterial({color:0x00bbff}));
hm.position.set(0,1.55,.1);kartGroup.add(hm);
const vi=new THREE.Mesh(new THREE.BoxGeometry(.45,.12,.18),new THREE.MeshLambertMaterial({color:0x222222}));
vi.position.set(0,1.52,.35);kartGroup.add(vi);
const sm=new THREE.MeshLambertMaterial({color:0xcc2222});
const spo=new THREE.Mesh(new THREE.BoxGeometry(1.5,.1,.45),sm);spo.position.set(0,1.25,-1.4);kartGroup.add(spo);
[-.55,.55].forEach(x=>{const su=new THREE.Mesh(new THREE.BoxGeometry(.08,.45,.08),sm);su.position.set(x,.95,-1.4);kartGroup.add(su)});
const wg=new THREE.CylinderGeometry(.32,.32,.28,8),wm=new THREE.MeshLambertMaterial({color:0x111111});
const hg=new THREE.CylinderGeometry(.12,.12,.3,6),hm2=new THREE.MeshLambertMaterial({color:0xbbbbbb});
kartGroup.userData.wheels=[];
[{x:-.85,z:.95},{x:.85,z:.95},{x:-.85,z:-.95},{x:.85,z:-.95}].forEach(wp=>{
const w=new THREE.Group();const t=new THREE.Mesh(wg,wm);t.rotation.z=Math.PI/2;w.add(t);
const h=new THREE.Mesh(hg,hm2);h.rotation.z=Math.PI/2;w.add(h);w.position.set(wp.x,.32,wp.z);kartGroup.add(w);kartGroup.userData.wheels.push(w)});
const eg=new THREE.CylinderGeometry(.1,.13,.5,6),em=new THREE.MeshLambertMaterial({color:0x777777});
[-.45,.45].forEach(x=>{const e=new THREE.Mesh(eg,em);e.rotation.x=Math.PI/2;e.position.set(x,.35,-1.7);kartGroup.add(e)});
const lg=new THREE.SphereGeometry(.1,6,4),lm=new THREE.MeshBasicMaterial({color:0xffeeaa});
[-.5,.5].forEach(x=>{const l=new THREE.Mesh(lg,lm);l.position.set(x,.55,1.6);kartGroup.add(l)});
const tm=new THREE.MeshBasicMaterial({color:0xff3333});
[-.5,.5].forEach(x=>{const t=new THREE.Mesh(lg,tm);t.position.set(x,.55,-1.6);kartGroup.add(t)});
scene.add(kartGroup)}

function spawnP(pos,vel,col,life,size){
const g=new THREE.BoxGeometry(size,size,size),m=new THREE.MeshBasicMaterial({color:col,transparent:true});
const ms=new THREE.Mesh(g,m);ms.position.copy(pos);scene.add(ms);particles.push({ms,vel:vel.clone(),life,max:life})}
function updateP(dt){for(let i=particles.length-1;i>=0;i--){
const p=particles[i];p.life-=dt;p.ms.position.addScaledVector(p.vel,dt);
p.ms.material.opacity=Math.max(0,p.life/p.max);p.ms.scale.setScalar(1+(1-p.life/p.max)*2);
if(p.life<=0){scene.remove(p.ms);p.ms.material.dispose();p.ms.geometry.dispose();particles.splice(i,1)}}}

function closestTP(pos){
let md=Infinity,b=0;const s=Math.max(0,S.ti-30),e=Math.min(trackPath.length,S.ti+30);
for(let i=s;i<e;i++){const p=trackPath[i];const dx=pos.x-p.x,dz=pos.z-p.z;const d=dx*dx+dz*dz;if(d<md){md=d;b=i}}
if(s>0)for(let i=0;i<20&&i<trackPath.length;i++){const p=trackPath[i];const dx=pos.x-p.x,dz=pos.z-p.z;const d=dx*dx+dz*dz;if(d<md){md=d;b=i}}
if(e<trackPath.length)for(let i=trackPath.length-20;i<trackPath.length;i++){const p=trackPath[i];const dx=pos.x-p.x,dz=pos.z-p.z;const d=dx*dx+dz*dz;if(d<md){md=d;b=i}}
S.ti=b;return{idx:b,dist:Math.sqrt(md)}}

function updatePhysics(dt){
if(mode!=='racing'&&mode!=='demo')return;dt=Math.min(dt,.033);
const ai=keys.ArrowUp||keys.KeyW||keys.accel,bi=keys.ArrowDown||keys.KeyS||keys.brake;
const li=keys.ArrowLeft||keys.KeyA||keys.left,ri=keys.ArrowRight||keys.KeyD||keys.right;
const bo=(keys.Space||keys.boost)&&S.bf>0,di=keys.ShiftLeft||keys.ShiftRight||keys.drift;
const cp=closestTP(S.p),onT=cp.dist<7,sf=onT?1.0:P.of,mx=(bo?P.bms:P.ms)*sf;
if(ai)S.sp=Math.min(S.sp+P.ac*dt,mx);
else if(bi){if(S.sp>1)S.sp=Math.max(S.sp-P.br*dt,-P.rm);else S.sp=Math.max(S.sp-P.ra*dt,-P.rm)}
else{if(S.sp>0)S.sp=Math.max(S.sp-P.fr*dt,0);else if(S.sp<0)S.sp=Math.min(S.sp+P.fr*dt,0)}
if(bo)S.bf=Math.max(0,S.bf-P.dd*dt);else S.bf=Math.min(100,S.bf+P.dr2);
const tr2=P.ts*dt,fwd=S.sp>0;let str=0;if(li)str+=tr2;if(ri)str-=tr2;
if(di&&Math.abs(S.sp)>10&&(li||ri)){if(!S.drift){S.drift=true;S.da=0}S.da+=str*.3;S.da=Math.max(-.6,Math.min(.6,S.da));str*=1.5}
else{if(S.drift){S.sp+=Math.abs(S.da)*8;S.da=0;S.drift=false}}
if(!fwd)str*=-1;S.h+=str;
S.p.x+=Math.sin(S.h)*S.sp*dt;S.p.z+=Math.cos(S.h)*S.sp*dt;S.p.y=0;
kartGroup.position.copy(S.p);kartGroup.rotation.y=S.h;
if(kartGroup.userData.wheels)kartGroup.userData.wheels.forEach(w=>{w.children[0]&&w.children[0].rotateX(S.sp*dt*.3)});
if(bo&&Math.random()<.7)spawnP(S.p.clone().add(new THREE.Vector3(-Math.sin(S.h)*1.8,-Math.cos(S.h)*1.8)),new THREE.Vector3(-Math.sin(S.h)*3,-1,-Math.cos(S.h)*3),0xff6600,.5,.2);
if(S.drift&&Math.random()<.5)spawnP(S.p.clone(),new THREE.Vector3(0,.5,0),0xcccccc,.4,.15);
checkCP(cp);if(mode==='racing')updateHUD()}

function checkCP(cp){
if(raceFinished)return;
for(let i=0;i<totalCP;i++){const ci2=cpIdx[i];const dist=Math.abs(cp.idx-ci2);
if(dist<20||dist>trackPath.length-20){if(!S.pcs.has(i)){S.pcs.add(i);
if(S.pcs.size>=totalCP&&cp.idx<10){S.pcs.clear();lapCount++;if(lapCount>=1){finishRace();return};S.pcs.add(0)}}}}}}

function finishRace(){
raceFinished=true;mode='finished';
const elapsed=(Date.now()-raceStart)/1000;
document.getElementById('ft').textContent=formatTime(elapsed);
document.getElementById('fs').style.display='flex';
document.getElementById('mm').style.display='none'}

function formatTime(t){const m=Math.floor(t/60);const s=t%60;return m+':'+s.toFixed(1).padStart(4,'0')}
function updateHUD(){
if(mode!=='racing'&&mode!=='demo')return;
const elapsed=((Date.now()-raceStart)/1000);
document.getElementById('hl').textContent=lapCount;
document.getElementById('ht').textContent=formatTime(elapsed);
const spd=Math.abs(S.sp)*3.6|0;
document.getElementById('hs').textContent=spd;
document.getElementById('sf').style.width=Math.min(100,spd/180*100)+'%'}

function updateCamera(dt){
if(!kartGroup)return;
const cp2=kartGroup.position;
const target=new THREE.Vector3(cp2.x-Math.sin(S.h)*8,5,cp2.z+Math.cos(S.h)*8);
const lookAt=new THREE.Vector3(cp2.x-Math.sin(S.h)*15,2,cp2.z+Math.cos(S.h)*15);
camera.position.lerp(target,.1);camera.lookAt(lookAt)}

function drawMinimap(){
if(!minimapOn||!trackPath.length)return;
const cv=document.getElementById('mc');const cx=cv.getContext('2d');
cx.clearRect(0,0,134,134);cx.fillStyle='rgba(0,0,0,0.7)';cx.fillRect(0,0,134,134);
let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
for(const p of trackPath){if(p.x<minX)minX=p.x;if(p.x>maxX)maxX=p.x;if(p.z<minZ)minZ=p.z;if(p.z>maxZ)maxZ=p.z}
const pad=20;minX-=pad;maxX+=pad;minZ-=pad;maxZ+=pad;
const sx=130/(maxX-minX),sz=130/(maxZ-minZ);const sc=Math.min(sx,sz);
const ox=(134-(maxX-minX)*sc)/2,oz=(134-(maxZ-minZ)*sc)/2;
cx.strokeStyle='#666';cx.lineWidth=3;cx.beginPath();
for(let i=0;i<=trackPath.length;i++){const p=trackPath[i%trackPath.length];
const x=ox+(p.x-minX)*sc,y=oz+(p.z-minZ)*sc;i===0?cx.moveTo(x,y):cx.lineTo(x,y)}
cx.closePath();cx.stroke();
cx.fillStyle='#ff0';for(let i=0;i<cpIdx.length;i++){const p=trackPath[cpIdx[i]];
const x=ox+(p.x-minX)*sc,y=oz+(p.z-minZ)*sc;cx.fillRect(x-2,y-2,4,4)}
const kx=ox+(S.p.x-minX)*sc,ky=oz+(S.p.z-minZ)*sc;
cx.fillStyle='#f00';cx.beginPath();cx.arc(kx,ky,4,0,Math.PI*2);cx.fill();
cx.strokeStyle='#fff';cx.lineWidth=1;cx.stroke()}

function demoAI(dt){
if(mode!=='demo')return;if(!demoRng)demoRng=mr(SEED+500);
const la=40,ti2=(S.ti+la)%trackPath.length,tp=trackPath[ti2];
const dx=tp.x-S.p.x,dz=tp.z-S.p.z,ta=Math.atan2(dx,dz);
let diff=ta-S.h;while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;
keys.right=diff>.1;keys.left=diff<-.1;keys.accel=true;keys.drift=false;keys.boost=false;keys.brake=false;
if(Math.abs(diff)>.3&&S.sp>20){keys.drift=true;if(demoRng()>.97)keys.boost=true}
if(Math.abs(diff)>.5&&S.sp>25)keys.brake=true}

function setupInput(){
addEventListener('keydown',e=>{keys[e.code]=true;
if(e.code==='KeyM'){minimapOn=!minimapOn;document.getElementById('mm').style.display=minimapOn?'block':'none'}
e.preventDefault()});addEventListener('keyup',e=>{keys[e.code]=false})}

function startCountdown(cb){
mode='countdown';cdTimer=3.5;
document.getElementById('ss').style.display='none';
document.getElementById('hud').style.display='flex';
document.getElementById('mm').style.display='block';
document.getElementById('fs').style.display='none';
const cd=document.getElementById('cd');cd.style.display='block';
let frames=0;
function tick(){
if(cdTimer>0){frames++;cdTimer-=1/60;
const n=Math.ceil(cdTimer);
cd.textContent=n>0?n.toString():'GO!';cd.style.color=n>1?'#fc0':'#0f0';
requestAnimationFrame(tick)}
else{cd.style.display='none';cb()}}
tick()}

function startRace(){raceStart=Date.now();raceFinished=false;lapCount=0;S.pcs=new Set();mode='racing'}

function resetToMenu(){
mode='menu';raceFinished=false;lapCount=0;S.pcs=new Set();S.sp=0;S.bf=100;S.drift=false;S.da=0;
keys={};demoRng=null;
document.getElementById('ss').style.display='flex';document.getElementById('hud').style.display='none';
document.getElementById('fs').style.display='none';document.getElementById('mm').style.display='none';
document.getElementById('cd').style.display='none';
const sp=trackPath[0],sn=trackPath[1];S.p.set(sp.x,0,sp.z);
S.h=Math.atan2(sn.x-sp.x,sn.z-sp.z);
if(kartGroup){kartGroup.position.copy(S.p);kartGroup.rotation.y=S.h}}

function restartRace(){
document.getElementById('fs').style.display='none';resetToMenu();startCountdown(startRace)}

function setupUI(){
document.getElementById('bp').onclick=()=>{startCountdown(startRace)};
document.getElementById('bd').onclick=()=>{
demoRng=mr(SEED+500);raceStart=Date.now();raceFinished=false;lapCount=0;S.pcs=new Set();mode='demo';
document.getElementById('ss').style.display='none';document.getElementById('hud').style.display='flex';
document.getElementById('mm').style.display='block';document.getElementById('fs').style.display='none'};
document.getElementById('br').onclick=restartRace;
document.getElementById('bm').onclick=resetToMenu}

function animate(){
requestAnimationFrame(animate);const dt=clock.getDelta();
if(mode==='demo')demoAI(dt);
updatePhysics(dt);updateP(dt);updateCamera(dt);drawMinimap();
if(mode==='menu'){
const t=clock.elapsedTime;const r=60,h=40;
const cx2=Math.cos(t*.3)*r,cz=Math.sin(t*.3)*r;const tp=trackPath[0];
camera.position.set(tp.x+cx2,h,tp.z+cz);camera.lookAt(tp.x,0,tp.z);
if(kartGroup){const p=trackPath[Math.floor((t*2)%trackPath.length)];
kartGroup.position.set(p.x,0,p.z);
const n=trackPath[(Math.floor((t*2)%trackPath.length)+1)%trackPath.length];
kartGroup.rotation.y=Math.atan2(n.x-p.x,n.z-p.z)}}
renderer.render(scene,camera)}

function init(){
initScene();buildTrack();buildKart();setupInput();setupUI();
const sp=trackPath[0],sn=trackPath[1];S.p.set(sp.x,0,sp.z);
S.h=Math.atan2(sn.x-sp.x,sn.z-sp.z);
if(kartGroup){kartGroup.position.copy(S.p);kartGroup.rotation.y=S.h}
animate()}

if(typeof THREE!=='undefined')init();
else{const check=()=>{if(typeof THREE!=='undefined')init();else setTimeout(check,100)};check()}
})();
