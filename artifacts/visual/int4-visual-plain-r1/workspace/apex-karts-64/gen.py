#!/usr/bin/env python3
"""Generate the improved Apex Karts 64 game file."""

html = r'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Apex Karts 64</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;overflow:hidden;font-family:'Courier New',monospace}
canvas{display:block}
#ov{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:100;
  background:repeating-linear-gradient(0deg,rgba(0,0,0,0.05) 0px,rgba(0,0,0,0.05) 1px,transparent 1px,transparent 3px);
  box-shadow:inset 0 0 120px rgba(0,0,0,0.4)}
#title{position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(180deg,#1a0a2e,#16213e 50%,#0f3460);z-index:200;display:flex;flex-direction:column;align-items:center;justify-content:center}
#title h1{font-size:60px;color:#FFD700;text-shadow:4px 4px 0 #FF4444,8px 8px 0 #000;letter-spacing:6px;margin-bottom:8px;animation:p 2s ease-in-out infinite}
#title .s{font-size:16px;color:#00FF88;letter-spacing:4px;margin-bottom:50px;text-shadow:2px 2px 0 #000}
@keyframes p{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
.mb{background:linear-gradient(180deg,#FF4444,#CC2222);border:3px solid #FFD700;border-radius:12px;color:#FFF;font-size:18px;font-family:'Courier New',monospace;padding:12px 36px;cursor:pointer;margin:6px;text-shadow:2px 2px 0 #000;letter-spacing:2px;transition:transform 0.1s;pointer-events:all}
.mb:hover{transform:scale(1.08);box-shadow:0 0 20px rgba(255,215,0,0.5)}
.ct{color:#888;font-size:11px;margin-top:35px;text-align:center;line-height:1.8}
.ct span{color:#FFD700}
.hb{position:fixed;z-index:50;background:rgba(10,10,30,0.75);border:2px solid #FFD700;border-radius:8px;padding:8px 16px;color:#FFF;text-shadow:2px 2px 0 #000;display:none}
.hb .l{font-size:10px;color:#FFD700;letter-spacing:2px}.hb .v{font-size:22px;font-weight:bold}
#hl{top:15px;left:20px}#ht{top:15px;right:20px}
#sw{position:fixed;bottom:20px;right:20px;z-index:50;width:200px;height:24px;background:rgba(10,10,30,0.75);border:2px solid #FFD700;border-radius:6px;overflow:hidden;display:none}
#sf{height:100%;width:0%;border-radius:3px;background:linear-gradient(90deg,#00FF88,#FFD700,#FF4444)}
#sl{position:fixed;bottom:50px;right:20px;color:#FFD700;font-size:10px;letter-spacing:2px;z-index:50;display:none}
#spdnum{position:fixed;bottom:52px;right:222px;color:#FFF;font-size:18px;font-weight:bold;z-index:50;display:none;text-shadow:2px 2px 0 #000}
#lp{position:fixed;bottom:20px;left:20px;width:180px;z-index:50;display:none}
#lbr{width:100%;height:8px;background:rgba(10,10,30,0.75);border:2px solid #FFD700;border-radius:4px;overflow:hidden}
#lf{height:100%;width:0%;background:linear-gradient(90deg,#00FF88,#FFD700);border-radius:2px}
#ll{color:#FFD700;font-size:9px;letter-spacing:2px;margin-top:4px;text-align:center}
#dw{position:fixed;bottom:70px;left:50%;transform:translateX(-50%);z-index:50;display:none;color:#FF8800;font-size:16px;letter-spacing:3px;text-shadow:2px 2px 0 #000;animation:dwp 0.3s ease-in-out infinite alternate}
@keyframes dwp{from{transform:translateX(-50%) scale(1)}to{transform:translateX(-50%) scale(1.08)}}
#mc{position:fixed;bottom:60px;right:20px;z-index:50;display:none;width:100px;height:100px;border-radius:50%;border:3px solid #FFD700}
#cd{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:150;font-size:120px;color:#FFD700;text-shadow:6px 6px 0 #FF4444,12px 12px 0 #000;display:none;pointer-events:none}
#cf{position:fixed;top:0;left:0;width:100%;height:100%;z-index:140;display:none;pointer-events:none;background:radial-gradient(ellipse at center,rgba(255,215,0,0.3),transparent 70%)}
#rs{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:200;display:none;flex-direction:column;align-items:center;justify-content:center}
#rs h2{font-size:44px;color:#00FF88;text-shadow:4px 4px 0 #000;margin-bottom:20px}
#rs .st{font-size:22px;color:#FFF;margin:8px}#rs .st span{color:#FFD700}
</style>
</head>
<body>
<div id="ov"></div>
<div id="cf"></div>
<div id="title">
<h1>APEX KARTS 64</h1>
<div class="s">CHALLENGER'S CIRCUIT</div>
<button class="mb" onclick="startR(false)">START RACE</button>
<button class="mb" onclick="startR(true)">DEMO MODE</button>
<div class="ct"><span>W/UP</span> Gas <span>S/DN</span> Brake <span>A/LEFT D/RIGHT</span> Steer <span>SPACE</span> Drift <span>R</span> Reset</div>
</div>
<div id="cd"></div>
<div class="hb" id="hl"><div class="l">LAP</div><div class="v" id="vl">0/1</div></div>
<div class="hb" id="ht"><div class="l">TIME</div><div class="v" id="vt">0:00.00</div></div>
<div id="sw"><div id="sf"></div></div>
<div id="sl">SPEED</div><div id="spdnum"></div>
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
ren.shadowMap.type=THREE.PCFSoftShadowMap;
ren.outputEncoding=THREE.sRGBEncoding;
document.body.appendChild(ren.domElement);

var scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x998877,0.004);
var cam=new THREE.PerspectiveCamera(65,window.innerWidth/window.innerHeight,0.5,1000);
var clk=new THREE.Clock();
scene.add(new THREE.AmbientLight(0xFFEECC,0.5));
var sun=new THREE.DirectionalLight(0xFFF0D0,1.1);
sun.position.set(50,80,30);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-80;sun.shadow.camera.right=80;
sun.shadow.camera.top=80;sun.shadow.camera.bottom=-80;
sun.shadow.camera.near=1;sun.shadow.camera.far=200;
scene.add(sun);
scene.add(new THREE.HemisphereLight(0x88BBFF,0x554422,0.35));

// === SKY DOME ===
(function(){
var sg=new THREE.SphereGeometry(400,16,12);
var sm=new THREE.ShaderMaterial({
vertexShader:'varying vec3 vWP;void main(){vWP=(modelMatrix*vec4(position,1.0)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
fragmentShader:'varying vec3 vWP;void main(){float h=normalize(vWP).y;vec3 c=mix(vec3(0.85,0.55,0.35),vec3(0.5,0.6,0.8),smoothstep(0.0,0.3,h));c=mix(c,vec3(0.12,0.15,0.45),smoothstep(0.3,0.85,h));gl_FragColor=vec4(c,1.0);}',
side:THREE.BackSide,depthWrite:false
});
scene.add(new THREE.Mesh(sg,sm));
})();

// === SUN GLOW ===
(function(){
var c=document.createElement('canvas');c.width=128;c.height=128;
var ctx=c.getContext('2d');
var gr=ctx.createRadialGradient(64,64,0,64,64,64);
gr.addColorStop(0,'rgba(255,255,220,0.6)');gr.addColorStop(0.3,'rgba(255,220,150,0.3)');gr.addColorStop(1,'rgba(255,200,100,0)');
ctx.fillStyle=gr;ctx.fillRect(0,0,128,128);
var st=new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
var spr=new THREE.Sprite(st);spr.position.set(50,75,30);spr.scale.set(30,30,1);
scene.add(spr);
})();

// === TRACK WAYPOINTS ===
var TW=[
{x:0,z:0,y:0},{x:20,z:0,y:0},{x:40,z:0,y:0},{x:55,z:5,y:0},
{x:65,z:15,y:.2},{x:68,z:28,y:.3},{x:65,z:40,y:.5},
{x:55,z:48,y:.7},{x:42,z:50,y:1},{x:30,z:48,y:1.5},
{x:20,z:45,y:2},{x:10,z:38,y:2.5},{x:5,z:28,y:2.2},
{x:10,z:18,y:1.8},{x:20,z:12,y:1.2},{x:30,z:8,y:.6},
{x:20,z:5,y:.2},{x:0,z:0,y:0}
];

function cr(p0,p1,p2,p3,t){
var t2=t*t,t3=t2*t;
return{
x:.5*((2*p1.x)+(-p0.x+p2.x)*t+(2*p0.x-5*p1.x+4*p2.x-p3.x)*t2+(-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
y:.5*((2*p1.y)+(-p0.y+p2.y)*t+(2*p0.y-5*p1.y+4*p2.y-p3.y)*t2+(-p0.y+3*p1.y-3*p2.y+p3.y)*t3),
z:.5*((2*p1.z)+(-p0.z+p2.z)*t+(2*p0.z-5*p1.z+4*p2.z-p3.z)*t2+(-p0.z+3*p1.z-3*p2.z+p3.z)*t3)};
}

var TS=500,TP=[],NT=TW.length;
for(var i=0;i<TS;i++){
var t=(i/TS)*(NT-1),ix=Math.floor(t),f=t-ix;
TP.push(cr(TW[Math.max(0,ix-1)%NT],TW[ix%NT],TW[(ix+1)%NT],TW[(ix+2)%NT],f));
}
var TN=[];
for(var i=0;i<TP.length;i++){
var n=TP[(i+1)%TP.length];
var dx=n.x-TP[i].x,dz=n.z-TP[i].z;
var l=Math.sqrt(dx*dx+dz*dz)||1;
TN.push({x:-dz/l,z:dz/l});
}
var TW2=12;

// Road texture
function roadTex(){
var c=document.createElement('canvas');c.width=256;c.height=256;
var ctx=c.getContext('2d');
ctx.fillStyle='#555';ctx.fillRect(0,0,256,256);
for(var i=0;i<3000;i++){var b=70+Math.floor(sr()*30);ctx.fillStyle='rgb('+b+','+b+','+b+')';ctx.fillRect(sr()*256,sr()*256,1,1);}
ctx.strokeStyle='#FFF';ctx.lineWidth=4;ctx.setLineDash([20,20]);
ctx.beginPath();ctx.moveTo(128,0);ctx.lineTo(128,256);ctx.stroke();
ctx.fillStyle='#CC3333';ctx.fillRect(0,0,8,256);ctx.fillRect(248,0,8,256);
var tex=new THREE.CanvasTexture(c);
tex.wrapS=THREE.RepeatWrapping;tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(1,20);return tex;
}

function buildTrack(){
var hw=TW2/2,verts=[],idx=[];
for(var i=0;i<TP.length;i++){var p=TP[i],n=TN[i];verts.push(p.x+n.x*hw,p.y,p.z+n.z*hw,p.x-n.x*hw,p.y,p.z-n.z*hw);}
for(var i=0;i<TP.length;i++){var i2=i*2,nx=((i+1)%TP.length)*2;idx.push(i2,nx,i2+1,i2+1,nx,nx+1);}
var geo=new THREE.BufferGeometry();
geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
geo.setIndex(idx);geo.computeVertexNormals();
var mat=new THREE.MeshLambertMaterial({map:roadTex(),color:0x888888});
var mesh=new THREE.Mesh(geo,mat);mesh.receiveShadow=true;scene.add(mesh);
for(var i=0;i<TP.length;i+=3){
var p=TP[i],n=TN[i],col=(Math.floor(i/3)%2===0)?0xFF2222:0xFFFFFF;
var cg=new THREE.BoxGeometry(.6,.15,2.5),cm=new THREE.MeshLambertMaterial({color:col});
var ml=new THREE.Mesh(cg,cm);ml.position.set(p.x+n.x*(hw+.8),p.y+.075,p.z+n.z*(hw+.8));ml.rotation.y=Math.atan2(n.x,n.z);ml.receiveShadow=true;scene.add(ml);
var mr=new THREE.Mesh(cg,cm);mr.position.set(p.x-n.x*(hw+.8),p.y+.075,p.z-n.z*(hw+.8));mr.rotation.y=Math.atan2(-n.x,-n.z);mr.receiveShadow=true;scene.add(mr);}
for(var i=0;i<TP.length;i+=5){
var p=TP[i],n=TN[i];var bg=new THREE.BoxGeometry(.5,1.2,3),bm=new THREE.MeshPhongMaterial({color:0x3366CC,shininess:10});
var bl=new THREE.Mesh(bg,bm);bl.position.set(p.x+n.x*(hw+2),p.y+.6,p.z+n.z*(hw+2));bl.rotation.y=Math.atan2(n.x,n.z);bl.castShadow=true;bl.receiveShadow=true;scene.add(bl);
var br=new THREE.Mesh(bg,bm);br.position.set(p.x-n.x*(hw+2),p.y+.6,p.z-n.z*(hw+2));br.rotation.y=Math.atan2(-n.x,-n.z);br.castShadow=true;br.receiveShadow=true;scene.add(br);}
}

function buildSF(){
var p=TP[0],n=TN[0];
var c=document.createElement('canvas');c.width=128;c.height=128;
var ctx=c.getContext('2d');
for(var r=0;r<8;r++)for(var co=0;co<8;co++){ctx.fillStyle=(r+co)%2===0?'#FFF':'#111';ctx.fillRect(co*16,r*16,16,16);}
var tex=new THREE.CanvasTexture(c);
var mesh=new THREE.Mesh(new THREE.PlaneGeometry(TW2-.5,3),new THREE.MeshLambertMaterial({map:tex,color:0xFFFFFF}));
mesh.rotation.x=-Math.PI/2;mesh.position.set(p.x,p.y+.05,p.z);mesh.rotation.z=-Math.atan2(n.x,n.z);scene.add(mesh);
var pg=new THREE.BoxGeometry(1,8,1),pm=new THREE.MeshPhongMaterial({color:0xFFD700,shininess:30});
var pl=new THREE.Mesh(pg,pm);pl.position.set(p.x+n.x*(TW2/2+.5),p.y+4,p.z+n.z*(TW2/2+.5));pl.castShadow=true;scene.add(pl);
var pr=new THREE.Mesh(pg,pm);pr.position.set(p.x-n.x*(TW2/2+.5),p.y+4,p.z-n.z*(TW2/2+.5));pr.castShadow=true;scene.add(pr);
var bb=new THREE.Mesh(new THREE.BoxGeometry(TW2+2,2,.5),new THREE.MeshPhongMaterial({color:0xFF2222,shininess:15}));
bb.position.set(p.x,p.y+7,p.z);bb.rotation.y=Math.atan2(n.x,n.z);bb.castShadow=true;scene.add(bb);
}

// Terrain with color variation
function buildTerrain(){
var tg=new THREE.PlaneGeometry(400,400,80,80);var pos=tg.attributes.position.array;var colors=[];
for(var i=0;i<pos.length;i+=3){
pos[i+2]=-1+Math.sin(pos[i]*.05)*2+Math.cos(pos[i+1]*.07)*1.5;
var d=Math.sqrt(pos[i]*pos[i]+pos[i+1]*pos[i+1]);if(d>60)pos[i+2]+=(d-60)*.03;
var v=Math.sin(pos[i]*.1)*Math.cos(pos[i+1]*.12);
var gr=120+v*30+sr()*15;var rd=50+v*15+sr()*10;var bl=30+sr()*8;
colors.push(rd/255,gr/255,bl/255);}
tg.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
tg.computeVertexNormals();
var t=new THREE.Mesh(tg,new THREE.MeshLambertMaterial({vertexColors:true}));
t.rotation.x=-Math.PI/2;t.position.y=-1;t.receiveShadow=true;scene.add(t);
// Low-poly rocks
for(var i=0;i<30;i++){
var a=sr()*Math.PI*2,d=30+sr()*120,rx=Math.cos(a)*d,rz=Math.sin(a)*d,on=false;
for(var j=0;j<TP.length;j+=20){if((rx-TP[j].x)*(rx-TP[j].x)+(rz-TP[j].z)*(rz-TP[j].z)<250){on=true;break;}}
if(on)continue;
var rg=new THREE.DodecahedronGeometry(.5+sr()*.8,0);
var rm=new THREE.MeshLambertMaterial({color:new THREE.Color(.3+sr()*.15,.28+sr()*.1,.22+sr()*.08)});
var rk=new THREE.Mesh(rg,rm);rk.position.set(rx,-.5+sr()*.3,rz);rk.rotation.set(sr()*Math.PI,sr()*Math.PI,0);rk.castShadow=true;scene.add(rk);}
}

function buildTrees(){
var tg=new THREE.CylinderGeometry(.3,.5,2,6),tm=new THREE.MeshLambertMaterial({color:0x8B4513});
var cg=new THREE.ConeGeometry(2,4,6),cs=[0x228B22,0x2E8B2E,0x1B7A1B,0x338833];
for(var i=0;i<60;i++){
var a=sr()*Math.PI*2,d=25+sr()*80,tx=Math.cos(a)*d,tz=Math.sin(a)*d,on=false;
for(var j=0;j<TP.length;j+=15){if((tx-TP[j].x)*(tx-TP[j].x)+(tz-TP[j].z)*(tz-TP[j].z)<200){on=true;break;}}
if(on)continue;var g=new THREE.Group();
var tr=new THREE.Mesh(tg,tm);tr.position.y=1;tr.castShadow=true;g.add(tr);
var cn=new THREE.Mesh(cg,new THREE.MeshLambertMaterial({color:cs[Math.floor(sr()*cs.length)]}));cn.position.y=4;cn.castShadow=true;g.add(cn);
g.position.set(tx,-1,tz);g.rotation.y=sr()*Math.PI*2;g.scale.setScalar(.7+sr()*.6);scene.add(g);}
}

function buildClouds(){
for(var i=0;i<12;i++){
var g=new THREE.Group(),np=3+Math.floor(sr()*4);
var cg=new THREE.SphereGeometry(3+sr()*4,6,4),cm=new THREE.MeshLambertMaterial({color:0xFFFFFF,transparent:true,opacity:.7});
for(var j=0;j<np;j++){var p=new THREE.Mesh(cg,cm);p.position.set((sr()-.5)*8,(sr()-.5)*2,(sr()-.5)*5);p.scale.y=.5;g.add(p);}
g.position.set((sr()-.5)*200,40+sr()*20,(sr()-.5)*200);scene.add(g);}
}

var NCP=4,CPS=[];
for(var i=0;i<NCP;i++){var idx=Math.floor((i/NCP)*TP.length);CPS.push({idx:idx,x:TP[idx].x,z:TP[idx].z,passed:false});}

// === KART ===
var kart,kw=[];
function buildKart(){
kart=new THREE.Group();
var bodyMat=new THREE.MeshPhongMaterial({color:0xFF2222,shininess:40});
var b=new THREE.Mesh(new THREE.BoxGeometry(1.4,.7,2.2),bodyMat);b.position.y=.65;b.castShadow=true;kart.add(b);
var ns=new THREE.Mesh(new THREE.BoxGeometry(1,.5,.8),new THREE.MeshPhongMaterial({color:0xFF4444,shininess:20}));ns.position.set(0,.65,-1.2);ns.castShadow=true;kart.add(ns);
var w=new THREE.Mesh(new THREE.BoxGeometry(1.8,.15,.4),new THREE.MeshPhongMaterial({color:0xFF6600,shininess:15}));w.position.set(0,1.5,.9);w.castShadow=true;kart.add(w);
for(var s=-1;s<=1;s+=2){var st=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.5,4),new THREE.MeshPhongMaterial({color:0xCCCCCC,shininess:50}));st.position.set(s*.6,1.25,.9);kart.add(st);}
var se=new THREE.Mesh(new THREE.BoxGeometry(1,.3,.8),new THREE.MeshLambertMaterial({color:0x333333}));se.position.set(0,.95,.3);kart.add(se);
var br=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1,6),new THREE.MeshPhongMaterial({color:0xCCCCCC,shininess:50}));br.rotation.z=Math.PI/2;br.position.set(0,1.1,-.5);kart.add(br);
// Wheels: rotation.z=Math.PI/2 orients circular face in YZ plane (axle along X, correct for kart)
// Spin is done via rotation.x which rotates around the (now-local) axle
var wGeo=new THREE.CylinderGeometry(.35,.35,.3,8),wMat=new THREE.MeshLambertMaterial({color:0x222222});
[{x:-.85,z:.7},{x:.85,z:.7},{x:-.85,z:-.7},{x:.85,z:-.7}].forEach(function(p){
var wh=new THREE.Mesh(wGeo,wMat);wh.rotation.z=Math.PI/2;wh.position.set(p.x,.35,p.z);wh.castShadow=true;kart.add(wh);kw.push(wh);});
for(var s=-1;s<=1;s+=2){var pipe=new THREE.Mesh(new THREE.CylinderGeometry(.08,.12,.6,6),new THREE.MeshPhongMaterial({color:0x888888,shininess:40}));pipe.rotation.x=Math.PI/2;pipe.position.set(s*.5,.35,1.4);kart.add(pipe);}
scene.add(kart);
}

// === PARTICLE SYSTEM ===
var particles=[];
var dustMat,sparkMat,smokeMat;
function initParticles(){
var dc=document.createElement('canvas');dc.width=32;dc.height=32;
var dctx=dc.getContext('2d');var dgr=dctx.createRadialGradient(16,16,0,16,16,16);
dgr.addColorStop(0,'rgba(180,150,100,0.6)');dgr.addColorStop(1,'rgba(180,150,100,0)');
dctx.fillStyle=dgr;dctx.fillRect(0,0,32,32);
dustMat=new THREE.SpriteMaterial({map:new THREE.CanvasTexture(dc),transparent:true,depthWrite:false});
var sc=document.createElement('canvas');sc.width=16;sc.height=16;
var sctx=sc.getContext('2d');var sgr=sctx.createRadialGradient(8,8,0,8,8,8);
sgr.addColorStop(0,'rgba(255,255,150,1)');sgr.addColorStop(0.5,'rgba(255,180,50,0.8)');sgr.addColorStop(1,'rgba(255,100,0,0)');
sctx.fillStyle=sgr;sctx.fillRect(0,0,16,16);
sparkMat=new THREE.SpriteMaterial({map:new THREE.CanvasTexture(sc),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
var mc=document.createElement('canvas');mc.width=32;mc.height=32;
var mctx=mc.getContext('2d');var mgr=mctx.createRadialGradient(16,16,0,16,16,16);
mgr.addColorStop(0,'rgba(80,80,80,0.4)');mgr.addColorStop(1,'rgba(80,80,80,0)');
mctx.fillStyle=mgr;mctx.fillRect(0,0,32,32);
smokeMat=new THREE.SpriteMaterial({map:new THREE.CanvasTexture(mc),transparent:true,depthWrite:false});
}
initParticles();

function emitParticles(type,count){
for(var i=0;i<count;i++){
var p={type:type,life:1,mat:type==='dust'?dustMat:type==='spark'?sparkMat:smokeMat};
if(type==='dust'){
p.pos=new THREE.Vector3(KS.x+(sr()-.5)*2,KS.y-.1,KS.z+(sr()-.5)*2);
p.vel=new THREE.Vector3((sr()-.5)*.4,sr()*.3,(sr()-.5)*.4);
p.life=.8+sr()*.4;p.scale=.3+sr()*.3;}
else if(type==='spark'){
var side=sr()>.5?1:-1;
p.pos=new THREE.Vector3(KS.x+side*.85,KS.y-.15,KS.z-.6);
p.vel=new THREE.Vector3((sr()-.5)*.8,sr()*.6+1,(sr()-.5)*.8);
p.life=.25+sr()*.3;p.scale=.1+sr()*.15;}
else{
var ex=(sr()>.5?.5:-.5);
p.pos=new THREE.Vector3(KS.x+ex,KS.y+.1,KS.z+1.5);
p.vel=new THREE.Vector3(0,.25+sr()*.2,1+sr()*.5);
p.life=.5+sr()*.5;p.scale=.2+sr()*.2;}
particles.push(p);
}}

function updateParticles(dt){
for(var i=particles.length-1;i>=0;i--){
var p=particles[i];p.life-=dt*1.5;
if(p.life<=0){if(p.mesh&&p.mesh.parent)p.mesh.parent.remove(p.mesh);particles.splice(i,1);continue;}
if(p.type==='spark')p.vel.y-=dt*5;
p.pos.add(p.vel.clone().multiplyScalar(dt));
if(!p.mesh){p.mesh=new THREE.Sprite(p.mat);scene.add(p.mesh);}
p.mesh.position.copy(p.pos);
var s=p.scale*p.life;p.mesh.scale.set(s,s,1);
p.mat.opacity=Math.min(1,p.life*2);
}}

// === PHYSICS ===
var KS={x:0,z:0,y:0,h:0,spd:0,da:0,drift:false,dc:0,onTrk:true};
var KP={ms:28,oms:8,ar:18,br:25,fr:5,tr:2.8,dtb:1.6,os:.85,ca:3.0};
var shakeAmt=0;

var lastNearestIdx=5;
function fnt(px,pz){
var radius=150,n=TP.length,bi=lastNearestIdx,bd=1e9;
for(var j=-radius;j<=radius;j++){var si=((lastNearestIdx+j)%n+n)%n;var dx=px-TP[si].x,dz=pz-TP[si].z,d=dx*dx+dz*dz;if(d<bd){bd=d;bi=si;}}
lastNearestIdx=bi;return{i:bi,d:Math.sqrt(bd)};
}
function gth(px,pz){var fi=fnt(px,pz);if(fi.d>TW2/2+2)return-.5;return TP[fi.i].y;}

// Demo AI
var dAI={ti:80};
function demoCtrl(){
var fi=fnt(KS.x,KS.z),ti=(fi.i+dAI.ti)%TP.length,tgt=TP[ti];
var dx=tgt.x-KS.x,dz=tgt.z-KS.z,ta=Math.atan2(dx,dz);
var diff=ta-KS.h;while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;
var steer=Math.max(-1,Math.min(1,diff/.8));
var accel=Math.abs(diff)>.6