#!/usr/bin/env python3
"""Generate the improved index.html for Apex Karts 64"""

content = r'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Apex Karts 64</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;overflow:hidden;font-family:'Courier New',monospace}
canvas{display:block}
#ov{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:100;
  background:
    repeating-linear-gradient(0deg,rgba(0,0,0,0.04) 0px,rgba(0,0,0,0.04) 1px,transparent 1px,transparent 3px),
    radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,0.3) 100%)}
#title{position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(180deg,#1a0a2e,#16213e 50%,#0f3460);z-index:200;display:flex;flex-direction:column;align-items:center;justify-content:center}
#title h1{font-size:60px;color:#FFD700;text-shadow:4px 4px 0 #FF4444,8px 8px 0 #000;letter-spacing:6px;margin-bottom:8px;animation:p 2s ease-in-out infinite}
#title .s{font-size:16px;color:#00FF88;letter-spacing:4px;margin-bottom:50px;text-shadow:2px 2px 0 #000}
@keyframes p{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
.mb{background:linear-gradient(180deg,#FF4444,#CC2222);border:3px solid #FFD700;border-radius:12px;color:#FFF;font-size:18px;font-family:'Courier New',monospace;padding:12px 36px;cursor:pointer;margin:6px;text-shadow:2px 2px 0 #000;letter-spacing:2px;transition:transform 0.1s;pointer-events:all}
.mb:hover{transform:scale(1.08);box-shadow:0 0 20px rgba(255,215,0,0.5)}
.ct{color:#888;font-size:11px;margin-top:35px;text-align:center;line-height:1.8}
.ct span{color:#FFD700}
.hb{position:fixed;z-index:50;background:linear-gradient(180deg,rgba(20,10,40,0.85),rgba(10,5,20,0.9));border:2px solid #FFD700;border-radius:6px;padding:6px 14px;color:#FFF;text-shadow:2px 2px 0 #000;display:none;box-shadow:0 0 12px rgba(255,215,0,0.15),inset 0 1px 0 rgba(255,255,255,0.1)}
.hb .l{font-size:9px;color:#FFD700;letter-spacing:3px;opacity:.8}.hb .v{font-size:20px;font-weight:bold}
#hl{top:15px;left:20px}#ht{top:15px;right:20px}
#hp{position:fixed;top:15px;left:50%;transform:translateX(-50%);z-index:50;background:linear-gradient(180deg,rgba(20,10,40,0.85),rgba(10,5,20,0.9));border:2px solid #FFD700;border-radius:6px;padding:6px 18px;color:#FFD700;font-size:20px;font-weight:bold;letter-spacing:2px;text-shadow:2px 2px 0 #000;display:none;box-shadow:0 0 12px rgba(255,215,0,0.15),inset 0 1px 0 rgba(255,255,255,0.1)}
#sw{position:fixed;bottom:20px;right:20px;z-index:50;width:180px;height:24px;background:rgba(10,5,20,0.85);border:2px solid #FFD700;border-radius:4px;overflow:hidden;display:none;box-shadow:0 0 10px rgba(255,215,0,0.1)}
#sf{height:100%;width:0%;border-radius:2px;background:linear-gradient(90deg,#00FF88 0%,#00FF88 40%,#FFD700 70%,#FF4444 100%)}
#sl{position:fixed;bottom:50px;right:20px;color:#FFD700;font-size:10px;letter-spacing:2px;z-index:50;display:none;opacity:.8}
#lp{position:fixed;bottom:20px;left:20px;width:180px;z-index:50;display:none}
#lbr{width:100%;height:6px;background:rgba(10,5,20,0.85);border:2px solid #FFD700;border-radius:3px;overflow:hidden}
#lf{height:100%;width:0%;background:linear-gradient(90deg,#00FF88,#00DD66);border-radius:2px;box-shadow:0 0 8px rgba(0,255,136,0.4)}
#ll{color:#FFD700;font-size:9px;letter-spacing:2px;margin-top:4px;text-align:center;opacity:.8}
#dw{position:fixed;bottom:65px;left:50%;transform:translateX(-50%);z-index:50;display:none;color:#FF8800;font-size:14px;letter-spacing:4px;text-shadow:2px 2px 0 #000,0 0 15px rgba(255,136,0,0.6);animation:dp .3s ease-in-out infinite alternate}
@keyframes dp{from{opacity:.7}to{opacity:1}}
#mc{position:fixed;bottom:60px;right:20px;z-index:50;display:none;width:100px;height:100px;border-radius:50%;border:2px solid #FFD700;box-shadow:0 0 12px rgba(255,215,0,0.15)}
#cd{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:150;font-size:120px;color:#FFD700;text-shadow:6px 6px 0 #FF4444,12px 12px 0 #000,0 0 40px rgba(255,215,0,0.5);display:none;pointer-events:none}
#rs{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.88);z-index:200;display:none;flex-direction:column;align-items:center;justify-content:center}
#rs h2{font-size:44px;color:#00FF88;text-shadow:4px 4px 0 #000,0 0 30px rgba(0,255,136,0.4);margin-bottom:20px}
#rs .st{font-size:22px;color:#FFF;margin:8px}#rs .st span{color:#FFD700}
</style>
</head>
<body>
<div id="ov"></div>
<div id="title">
<h1>APEX KARTS 64</h1>
<div class="s">CHALLENGER'S CIRCUIT</div>
<button class="mb" onclick="startR(false)">START RACE</button>
<button class="mb" onclick="startR(true)">DEMO MODE</button>
<div class="ct"><span>W/UP</span> Gas <span>S/DN</span> Brake <span>A/LEFT D/RIGHT</span> Steer <span>SPACE</span> Drift <span>R</span> Reset</div>
</div>
<div id="cd"></div>
<div id="hp">1ST</div>
<div class="hb" id="hl"><div class="l">LAP</div><div class="v" id="vl">0/1</div></div>
<div class="hb" id="ht"><div class="l">TIME</div><div class="v" id="vt">0:00.00</div></div>
<div id="sl">SPEED</div><div id="sw"><div id="sf"></div></div>
<div id="lp"><div id="lbr"><div id="lf"></div></div><div id="ll">LAP PROGRESS</div></div>
<div id="dw">&laquo; DRIFT &raquo;</div>
<canvas id="mc"></canvas>
<div id="rs">
<h2>&#x1F3C1; RACE COMPLETE!</h2>
<div class="st">Time: <span id="rt">0:00.00</span></div>
<div class="st">Top Speed: <span id="rsp">0</span> km/h</div>
<button class="mb" onclick="doMenu()">MAIN MENU</button>
<button class="mb" onclick="startR(false)">REPLAY</button>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
'''

# Part 2: Game logic
js = r'''
// === SEEDED RNG ===
var R=42;
function sr(){R=(R*1664525+1013904223)&0xFFFFFFFF;return(R>>>0)/4294967296}
for(var _i=0;_i<100;_i++)sr();

// === GAME STATE ===
var GM='title',lap=0,raceTime=0,topSpd=0,cdTimer=0,cdPhase=0,finished=false,startTime=0;
var keys={};
window.addEventListener('keydown',function(e){keys[e.code]=true;e.preventDefault()});
window.addEventListener('keyup',function(e){keys[e.code]=false});

// === THREE.JS SETUP ===
var ren=new THREE.WebGLRenderer({antialias:false});
ren.setSize(window.innerWidth,window.innerHeight);
ren.setPixelRatio(Math.min(window.devicePixelRatio,2));
ren.shadowMap.enabled=true;
ren.shadowMap.type=THREE.PCFShadowMap;
ren.toneMapping=THREE.ACESFilmicToneMapping;
ren.toneMappingExposure=1.1;
ren.outputEncoding=THREE.sRGBEncoding;
document.body.appendChild(ren.domElement);

var scene=new THREE.Scene();
scene.background=new THREE.Color(0x87CEEB);
scene.fog=new THREE.FogExp2(0x98B8D0,0.0025);

var cam=new THREE.PerspectiveCamera(65,window.innerWidth/window.innerHeight,0.5,1000);
var clk=new THREE.Clock();

// Lighting
scene.add(new THREE.AmbientLight(0xFFEECC,0.5));
var sun=new THREE.DirectionalLight(0xFFF5E0,1.1);
sun.position.set(50,80,30);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-80;sun.shadow.camera.right=80;
sun.shadow.camera.top=80;sun.shadow.camera.bottom=-80;
sun.shadow.bias=-0.0005;scene.add(sun);
scene.add(new THREE.HemisphereLight(0x88BBFF,0x557733,0.35));

// === TRACK WAYPOINTS ===
var TW=[{x:0,z:0,y:0},{x:20,z:0,y:0},{x:40,z:0,y:0},{x:55,z:5,y:0},{x:65,z:15,y:.2},{x:68,z:28,y:.3},{x:65,z:40,y:.5},{x:55,z:48,y:.7},{x:42,z:50,y:1},{x:30,z:48,y:1.5},{x:20,z:45,y:2},{x:10,z:38,y:2.5},{x:5,z:28,y:2.2},{x:10,z:18,y:1.8},{x:20,z:12,y:1.2},{x:30,z:8,y:.6},{x:20,z:5,y:.2},{x:0,z:0,y:0}];

function cr(p0,p1,p2,p3,t){
var t2=t*t,t3=t2*t;
return{x:.5*((2*p1.x)+(-p0.x+p2.x)*t+(2*p0.x-5*p1.x+4*p2.x-p3.x)*t2+(-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
y:.5*((2*p1.y)+(-p0.y+p2.y)*t+(2*p0.y-5*p1.y+4*p2.y-p3.y)*t2+(-p0.y+3*p1.y-3*p2.y+p3.y)*t3),
z:.5*((2*p1.z)+(-p0.z+p2.z)*t+(2*p0.z-5*p1.z+4*p2.z-p3.z)*t2+(-p0.z+3*p1.z-3*p2.z+p3.z)*t3)};}

var TS=500,TP=[],NT=TW.length;
for(var i=0;i<TS;i++){var t=(i/TS)*(NT-1),ix=Math.floor(t),f=t-ix;
TP.push(cr(TW[Math.max(0,ix-1)%NT],TW[ix%NT],TW[(ix+1)%NT],TW[(ix+2)%NT],f));}
var TN=[];
for(var i=0;i<TP.length;i++){var n=TP[(i+1)%TP.length],dx=n.x-TP[i].x,dz=n.z-TP[i].z,l=Math.sqrt(dx*dx+dz*dz)||1;
TN.push({x:-dz/l,z:dz/l});}
var TW2=12;

function roadTex(){
var c=document.createElement('canvas');c.width=256;c.height=512;
var ctx=c.getContext('2d');ctx.fillStyle='#555';ctx.fillRect(0,0,256,512);
for(var i=0;i<5000;i++){var b=65+Math.floor(sr()*35);ctx.fillStyle='rgb('+b+','+b+','+b+')';ctx.fillRect(sr()*256,sr()*512,1+Math.floor(sr()*2),1+Math.floor(sr()*2));}
ctx.strokeStyle='#FFF';ctx.lineWidth=3;ctx.setLineDash([20,20]);
ctx.beginPath();ctx.moveTo(128,0);ctx.lineTo(128,512);ctx.stroke();ctx.setLineDash([]);
ctx.strokeStyle='#FFF';ctx.lineWidth=2;
ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(12,512);ctx.stroke();
ctx.beginPath();ctx.moveTo(244,0);ctx.lineTo(244,512);ctx.stroke();
var tex=new THREE.CanvasTexture(c);tex.wrapS=THREE.RepeatWrapping;tex.wrapT=THREE.RepeatWrapping;
tex.repeat.set(1,25);return tex;}

function buildTrack(){
var hw=TW2/2,verts=[],idx=[],uvs=[];
for(var i=0;i<TP.length;i++){var p=TP[i],n=TN[i];
verts.push(p.x+n.x*hw,p.y,p.z+n.z*hw,p.x-n.x*hw,p.y,p.z-n.z*hw);
uvs.push(0,i/TS,1,i/TS);}
for(var i=0;i<TP.length;i++){var i2=i*2,nx=((i+1)%TP.length)*2;
idx.push(i2,nx,i2+1,i2+1,nx,nx+1);}
var geo=new THREE.BufferGeometry();
geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
geo.setIndex(idx);geo.computeVertexNormals();
var mat=new THREE.MeshPhongMaterial({map:roadTex(),color:0x888888,specular:0x222222,shininess:8});
var mesh=new THREE.Mesh(geo,mat);mesh.receiveShadow=true;scene.add(mesh);

// Curbs
for(var i=0;i<TP.length;i+=3){var p=TP[i],n=TN[i],col=(Math.floor(i/3)%2===0)?0xFF2222:0xFFFFFF;
var cg=new THREE.BoxGeometry(.6,.12,2.5),cm=new THREE.MeshPhongMaterial({color:col,specular:0x444444,shininess:15});
var ml=new THREE.Mesh(cg,cm);ml.position.set(p.x+n.x*(hw+.8),p.y+.06,p.z+n.z*(hw+.8));
ml.rotation.y=Math.atan2(n.x,n.z);ml.receiveShadow=true;scene.add(ml);
var mr=new THREE.Mesh(cg,cm);mr.position.set(p.x-n.x*(hw+.8),p.y+.06,p.z-n.z*(hw+.8));
mr.rotation.y=Math.atan2(-n.x,-n.z);mr.receiveShadow=true;scene.add(mr);}

// Barriers
for(var i=0;i<TP.length;i+=5){var p=TP[i],n=TN[i];
var bg=new THREE.BoxGeometry(.5,1.2,3),bm=new THREE.MeshPhongMaterial({color:0x3366CC,specular:0x666666,shininess:20});
var bl=new THREE.Mesh(bg,bm);bl.position.set(p.x+n.x*(hw+2),p.y+.6,p.z+n.z*(hw+2));
bl.rotation.y=Math.atan2(n.x,n.z);bl.castShadow=true;bl.receiveShadow=true;scene.add(bl);
var br=new THREE.Mesh(bg,bm);br.position.set(p.x-n.x*(hw+2),p.y+.6,p.z-n.z*(hw+2));
br.rotation.y=Math.atan2(-n.x,-n.z);br.castShadow=true;br.receiveShadow=true;scene.add(br);}}

function buildSF(){
var p=TP[0],n=TN[0];
var c=document.createElement('canvas');c.width=128;c.height=128;
var ctx=c.getContext('2d');for(var r=0;r<8;r++)for(var co=0;co<8;co++){
ctx.fillStyle=(r+co)%2===0?'#FFF':'#111';ctx.fillRect(co*16,r*16,16,16);}
var tex=new THREE.CanvasTexture(c);
var mesh=new THREE.Mesh(new THREE.PlaneGeometry(TW2-.5,3),
new THREE.MeshPhongMaterial({map:tex,color:0xFFFFFF,specular:0x333333,shininess:10}));
mesh.rotation.x=-Math.PI/2;mesh.position.set(p.x,p.y+.06,p.z);
mesh.rotation.z=-Math.atan2(n.x,n.z);scene.add(mesh);

var pg=new THREE.BoxGeometry(1,9,1),pm=new THREE.MeshPhongMaterial({color:0xFFD700,specular:0xFFEE00,shininess:40,emissive:0x221100});
var pl=new THREE.Mesh(pg,pm);pl.position.set(p.x+n.x*(TW2/2+.5),p.y+4.5,p.z+n.z*(TW2/2+.5));
pl.castShadow=true;scene.add(pl);
var pr=new THREE.Mesh(pg,pm);pr.position.set(p.x-n.x*(TW2/2+.5),p.y+4.5,p.z-n.z*(TW2/2+.5));
pr.castShadow=true;scene.add(pr);
var bb=new THREE.Mesh(new THREE.BoxGeometry(TW2+2,1.5,.6),new THREE.MeshPhongMaterial({color:0xFF2222,specular:0x880000,shininess:25}));
bb.position.set(p.x,p.y+7,p.z);bb.rotation.y=Math.atan2(n.x,n.z);bb.castShadow=true;scene.add(bb);}

function buildTerrain(){
var tg=new THREE.PlaneGeometry(400,400,80,80);var pos=tg.attributes.position.array;
for(var i=0;i<pos.length;i+=3){
pos[i+2]=-1+Math.sin(pos[i]*.05)*2+Math.cos(pos[i+1]*.07)*1.5;
var d=Math.sqrt(pos[i]*pos[i]+pos[i+1]*pos[i+1]);if(d>60)pos[i+2]+=(d-60)*.03;}
tg.computeVertexNormals();
var t=new THREE.Mesh(tg,new THREE.MeshPhongMaterial({color:0x44AA33,specular:0x112200,shininess:3}));
t.rotation.x=-Math.PI/2;t.position.y=0;t.receiveShadow=true;scene.add(t);}

function buildTrees(){
var tg=new THREE.CylinderGeometry(.3,.5,2,6);
var tm=new THREE.MeshPhongMaterial({color:0x8B4513,specular:0x221100,shininess:5});
var cg=new THREE.ConeGeometry(2,4,6);
var cs=[0x228B22,0x2E8B2E,0x1B7A1B,0x339933];
for(var i=0;i<80;i++){var a=sr()*Math.PI*2,d=25+sr()*80,tx=Math.cos(a)*d,tz=Math.sin(a)*d,on=false;
for(var j=0;j<TP.length;j+=15){if((tx-TP[j].x)*(tx-TP[j].x)+(tz-TP[j].z)*(tz-TP[j].z)<200){on=true;break;}}
if(on)continue;var g=new THREE.Group();
var tr=new THREE.Mesh(tg,tm);tr.position.y=1;tr.castShadow=true;g.add(tr);
var cn=new THREE.Mesh(cg,new THREE.MeshPhongMaterial({color:cs[Math.floor(sr()*4)],specular:0x002200,shininess:3}));
cn.position.y=4+sr()*.5;cn.castShadow=true;g.add(cn);
var sc=.8+sr()*.6;g.scale.set(sc,sc,sc);
g.position.set(tx,-1,tz);g.rotation.y=sr()*Math.PI*2;scene.add(g);}}

function buildBushes(){
for(var i=0;i<TP.length;i+=20){var p=TP[i],n=TN[i];
for(var side=-1;side<=1;side+=2){if(sr()>.4)continue;
var bx=p.x+n.x*(TW2/2+1.5+sr())*side,bz=p.z+n.z*(TW2/2+1.5+sr())*side;
var bs=.5+sr()*.8;
var bush=new THREE.Mesh(new THREE.SphereGeometry(1,6,4),
new THREE.MeshPhongMaterial({color:Math.random()>.5?0x338822:0x44AA33,specular:0x112200,shininess:3}));
bush.position.set(bx,p.y+bs*.5,bz);bush.scale.set(bs,bs*.6,bs);
bush.castShadow=true;bush.receiveShadow=true;scene.add(bush);}}}

function buildClouds(){
var cm=new THREE.MeshPhongMaterial({color:0xFFFFFF,transparent:true,opacity:.75,specular:0x000000});
for(var i=0;i<12;i++){var g=new THREE.Group(),np=3+Math.floor(sr()*4);
for(var j=0;j<np;j++){var rs=2+sr()*5;
var p=new THREE.Mesh(new THREE.SphereGeometry(rs,5,3),cm);
p.position.set((sr()-.5)*8,(sr()-.5)*2,(sr()-.5)*5);p.scale.y=.4;g.add(p);}
g.position.set((sr()-.5)*200,40+sr()*20,(sr()-.5)*200);scene.add(g);}}

// === PARTICLES ===
var driftParticles=[],exhaustParticles=[],driftPool=[],exhaustPool=[];
function initParticles(){
var dustGeo=new THREE.DodecahedronGeometry(.12,0);
var dustMat=new THREE.MeshBasicMaterial({color:0xCCAA77,transparent:true,opacity:.7});
for(var i=0;i<40;i++){var m=new THREE.Mesh(dustGeo,dustMat.clone());
m.visible=false;m.scale.set(.1,.1,.1);scene.add(m);driftPool.push(m);}
var exhGeo=new THREE.BoxGeometry(.15,.15,.15);
var exhMat=new THREE.MeshBasicMaterial({color:0x888888,transparent:true,opacity:.4});
for(var i=0;i<20;i++){var m=new THREE.Mesh(exhGeo,exhMat.clone());
m.visible=false;m.scale.set(.1,.1,.1);scene.add(m);exhaustPool.push(m);}}

function emitDriftDust(n){
for(var i=0;i<n;i++){var p=driftPool.shift();if(!p)break;p.visible=true;
var backX=Math.sin(KS.h)*.7,backZ=Math.cos(KS.h)*.7;
p.position.set(KS.x+backX+(sr()-.5)*.8,KS.y+sr()*.3,KS.z+backZ+(sr()-.5)*.8);
p.material.opacity=.7;p.scale.set(.5+sr()*.5,.3+sr()*.3,.5+sr()*.5);
p.userData={life:1,vx:(sr()-.5)*.03,vz:(sr()-.5)*.03};driftParticles.push(p);}}

function emitExhaust(n){
for(var i=0;i<n;i++){var p=exhaustPool.shift();if(!p)break;p.visible=true;
var px=Math.sin(KS.h+Math.PI)*1,pz=Math.cos(KS.h+Math.PI)*1;
p.position.set(KS.x+px+(sr()-.5)*.5,KS.y+.3+sr()*.2,KS.z+pz+(sr()-.5)*.5);
p.material.opacity=.4;p.scale.set(.5+sr()*.5,.5+sr()*.5,.5+sr()*.5);
p.userData={life:1,vx:Math.sin(KS.h+Math.PI)*.02,vz:Math.cos(KS.h+Math.PI)*.02,vy:.01};
exhaustParticles.push(p);}}

function updateParticles(dt){
for(var i=driftParticles.length-1;i>=0;i--){var p=driftParticles[i];
p.userData.life-=dt*1.5;
if(p.userData.life<=0){p.visible=false;driftPool.push(p);driftParticles.splice(i,1);continue;}
p.position.x+=p.userData.vx;p.position.z+=p.userData.vz;
p.material.opacity=p.userData.life*.7;p.scale.x+=dt*.5;p.scale.z+=dt*.5;}
for(var i=exhaustParticles.length-1;i>=0;i--){var p=exhaustParticles[i];
p.userData.life-=dt*2;
if(p.userData.life<=0){p.visible=false;exhaustPool.push(p);exhaustParticles.splice(i,1);continue;}
p.position.x+=p.userData.vx;p.position.z+=p.userData.vz;p.position.y+=p.userData.vy;
p.material.opacity=p.userData.life*.4;
p.scale.x+=dt*.8;p.scale.y+=dt*.8;p.scale.z+=dt*.8;}}

// === SKID MARKS ===
var skidMarks=[];
var skidGeo=new THREE.PlaneGeometry(.3,.5);
function addSkidMark(x,y,z,h){
var m=new THREE.Mesh(skidGeo,new THREE.MeshBasicMaterial({color:0x111111,transparent:true,opacity:.5,depthWrite:false}));
m.rotation.x=-Math.PI/2;m.rotation.z=h;m.position.set(x,y+.02,z);
scene.add(m);skidMarks.push({mesh:m,age:0});
if(skidMarks.length>200){var old=skidMarks.shift();scene.remove(old.mesh);old.mesh.material.dispose();}}
function updateSkids(dt){
for(var i=skidMarks.length-1;i>=0;i--){skidMarks[i].age+=dt;
if(skidMarks[i].age>15)skidMarks[i].mesh.material.opacity=Math.max(0,skidMarks[i].mesh.material.opacity-.01);
if(skidMarks[i].mesh.material.opacity<=0){scene.remove(skidMarks[i].mesh);skidMarks[i].mesh.material.dispose();skidMarks.splice(i,1);}}}

// === KART ===
var kart,kw=[];
function buildKart(){
kart=new THREE.Group();
// Body
var bMat=new THREE.MeshPhongMaterial({color:0xFF2222,specular:0xAA0000,shininess:35});
var b=new THREE.Mesh(new THREE.BoxGeometry(1.4,.7,2.2),bMat);
b.position.y=.65;b.castShadow=true;kart.add(b);
// Nose
var ns=new THREE.Mesh(new THREE.BoxGeometry(1,.5,.8),
new THREE.MeshPhongMaterial({color:0xFF4444,specular:0xAA2222,shininess:30}));
ns.position.set(0,.65,-1.2);ns.castShadow=true;kart.add(ns);
// Spoiler
var wing=new THREE.Mesh(new THREE.BoxGeometry(1.8,.12,.4),
new THREE.MeshPhongMaterial({color:0xFF6600,specular:0x884400,shininess:25}));
wing.position.set(0,1.5,.9);wing.castShadow=true;kart.add(wing);
// Spoiler supports
for(var s=-1;s<=1;s+=2){
var st=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.5,5),
new THREE.MeshPhongMaterial({color:0xDDDDDD,specular:0xFFFFFF,shininess:50}));
st.position.set(s*.6,1.25,.9);kart.add(st);}
// Seat
var se=new THREE.Mesh(new THREE.BoxGeometry(1,.3,.8),
new THREE.MeshPhongMaterial({color:0x333333,specular:0x111111,shininess:10}));
se.position.set(0,.95,.3);kart.add(se);

// Driver figure
var dg=new THREE.Group();
var head=new THREE.Mesh(new THREE.SphereGeometry(.15,5,4),
new THREE.MeshPhongMaterial({color:0xFFD700,specular:0x886600,shininess:20}));
head.position.set(0,1.35,-.1);dg.add(head);
var helmet=new THREE.Mesh(new THREE.SphereGeometry(.18,5,4),
new THREE.MeshPhongMaterial({color:0xFF2222,specular:0xAA0000,shininess:30,emissive:0x110000}));
helmet.position.set(0,1.35,-.1);dg.add(helmet);
var torso=new THREE.Mesh(new THREE.BoxGeometry(.5,.4,.35),
new THREE.MeshPhongMaterial({color:0xFF4444,specular:0x880000,shininess:15}));
torso.position.set(0,1.05,-.05);dg.add(torso);
kart.add(dg);

// Brake handle
var br=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.8,5),
new THREE.MeshPhongMaterial({color:0xCCCCCC,specular:0xFFFFFF,shininess:60}));
br.rotation.z=Math.PI/2;br.position.set(0,1.1,-.5);kart.add(br);

// Wheels - FIXED: group handles orientation, mesh spins on local Y (cylinder axis)
var wGeo=new THREE.CylinderGeometry(.35,.35,.3,8);
var wMat=new THREE.MeshPhongMaterial({color:0x222222,specular:0x333333,shininess:10});
[{x:-.85,z:.7},{x:.85,z:.7},{x:-.85,z:-.7},{x:.85,z:-.7}].forEach(function(p){
var wg=new THREE.Group();wg.position.set(p.x,.35,p.z);wg.rotation.z=Math.PI/2;
var wh=new THREE.Mesh(wGeo,wMat);wh.castShadow=true;wg.add(wh);
kart.add(wg);kw.push({mesh:wh,group:wg});});

// Exhaust pipes (pointing backward)
for(var s=-1;s<=1;s+=2){
var pipe=new THREE.Mesh(new THREE.CylinderGeometry(.08,.12,.6,6),
new THREE.MeshPhongMaterial({color:0x888888,specular:0xAAAAAA,shininess:40}));
pipe.rotation.x=-Math.PI/2;pipe.position.set(s*.5,.35,1.4);kart.add(pipe);}
scene