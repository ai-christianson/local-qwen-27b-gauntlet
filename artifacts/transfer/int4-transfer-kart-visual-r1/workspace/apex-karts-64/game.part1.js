// Part 1: Scene setup, track, environment, kart, particle system
(function(){
"use strict";

const rng=(function(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}})(42);

const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0xb0d4f1,0.002);

// Sky dome
(function(){
  const sg=new THREE.SphereGeometry(400,16,12);
  const sm=new THREE.ShaderMaterial({
    uniforms:{
      topColor:{value:new THREE.Color(0x1a5fa0)},midColor:{value:new THREE.Color(0x6baed6)},
      bottomColor:{value:new THREE.Color(0xd4e8f0)},sunColor:{value:new THREE.Color(0xfff4e0)},
      sunDir:{value:new THREE.Vector3(50,80,30).normalize()}
    },
    vertexShader:`varying vec3 vWP;void main(){vWP=(modelMatrix*vec4(position,1.0)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`uniform vec3 topColor,midColor,bottomColor,sunColor,sunDir;varying vec3 vWP;void main(){float h=normalize(vWP).y;vec3 c=mix(bottomColor,midColor,smoothstep(-0.1,0.3,h));c=mix(c,topColor,smoothstep(0.3,0.9,h));float s=max(dot(normalize(vWP),sunDir),0.0);c+=sunColor*pow(s,64.0)*0.6;c+=sunColor*pow(s,8.0)*0.15;gl_FragColor=vec4(c,1.0);}`,
    side:THREE.BackSide,depthWrite:false
  });
  const sky=new THREE.Mesh(sg,sm);sky.renderOrder=-1;scene.add(sky);
  window._sky=sky;
})();

const cam=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,0.5,800);
const ren=new THREE.WebGLRenderer({antialias:false});
ren.setSize(innerWidth,innerHeight);ren.setPixelRatio(Math.min(devicePixelRatio,2));
ren.shadowMap.enabled=true;ren.shadowMap.type=THREE.PCFSoftShadowMap;
ren.toneMapping=THREE.ACESFilmicToneMapping;ren.toneMappingExposure=1.1;
// Use modern API or fallback
try{ren.outputColorSpace='srgb'}catch(e){ren.outputEncoding=THREE.sRGBEncoding}
document.body.appendChild(ren.domElement);

scene.add(new THREE.AmbientLight(0xffeedd,0.5));
const sun=new THREE.DirectionalLight(0xfff4e0,1.4);sun.position.set(50,80,30);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
const sc=sun.shadow.camera;sc.left=-80;sc.right=80;sc.top=80;sc.bottom=-80;sc.near=1;sc.far=250;
scene.add(sun);scene.add(new THREE.HemisphereLight(0x87ceeb,0x556b2f,0.35));
const fill=new THREE.DirectionalLight(0xc8d8f0,0.3);fill.position.set(-30,40,-20);scene.add(fill);

function mkTex(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t}
function mkRoad(){return mkTex(256,256,(ctx,w,h)=>{
  ctx.fillStyle='#6b6b6b';ctx.fillRect(0,0,w,h);
  for(let i=0;i<4000;i++){ctx.fillStyle=Math.random()>0.5?'#7a7a7a':'#5c5c5c';ctx.fillRect(Math.random()*w,Math.random()*h,2,2)}
  ctx.fillStyle='#ffeb3b';for(let y=0;y<h;y+=32)ctx.fillRect(122,y,12,16);
  for(let y=0;y<h;y+=8){ctx.fillStyle=y%16<8?'#ff1744':'#fff';ctx.fillRect(0,y,8,8);ctx.fillRect(w-8,y,8,8);ctx.fillStyle=y%16<8?'rgba(255,200,200,0.3)':'rgba(200,200,200,0.3)';ctx.fillRect(8,y,6,8);ctx.fillRect(w-14,y,6,8)}
})}
function mkGrass(){const t=mkTex(512,512,(ctx)=>{ctx.fillStyle='#4a8c3f';ctx.fillRect(0,0,512,512);for(let i=0;i<8000;i++){ctx.fillStyle='rgb('+(30+Math.random()*30)+','+(60+Math.random()*60)+','+(20+Math.random()*20)+')';ctx.fillRect(Math.random()*512,Math.random()*512,3,3)}});t.repeat.set(8,8);return t}
function mkCheck(){return mkTex(128,128,(ctx)=>{for(let x=0;x<128;x+=16)for(let y=0;y<128;y+=16){ctx.fillStyle=((x/16+y/16)%2)?'#111':'#fff';ctx.fillRect(x,y,16,16)}})}

const TW=12;
const tp=[[0,0,50],[-25,0.5,40],[-50,1.5,20],[-55,2,0],[-50,2.5,-20],[-35,3,-35],[-10,3,-45],[10,2.5,-48],[30,1.5,-40],[48,0.5,-25],[55,0,-5],[52,0.2,15],[45,0.3,35],[30,0.1,48],[15,0,52]];
const curve=new THREE.CatmullRomCurve3(tp.map(p=>new THREE.Vector3(p[0],p[1],p[2])),true);
const TS=300;
(function(){
  const p=[],n=[],u=[],ix=[];
  for(let i=0;i<TS;i++){const t=i/TS,pt=curve.getPointAt(t),ta=curve.getTangentAt(t);const nm=new THREE.Vector3(-ta.z,0,ta.x).normalize();const l=pt.clone().add(nm.clone().multiplyScalar(TW/2));const r=pt.clone().sub(nm.clone().multiplyScalar(TW/2));l.y=pt.y+0.15;r.y=pt.y+0.15;p.push(l.x,l.y,l.z,r.x,r.y,r.z);n.push(0,1,0,0,1,0);u.push(0,t*30,1,t*30);const vi=i*2,ni=((i+1)%TS)*2;ix.push(vi,ni,vi+1,ni,ni+1,vi+1)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(u,2));g.setIndex(ix);g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:mkRoad(),roughness:0.85,metalness:0.05}));m.receiveShadow=true;scene.add(m);
})();
const gnd=new THREE.Mesh(new THREE.PlaneGeometry(600,600),new THREE.MeshStandardMaterial({map:mkGrass(),roughness:1}));gnd.rotation.x=-Math.PI/2;gnd.position.y=-1;gnd.receiveShadow=true;scene.add(gnd);

for(let i=0;i<90;i++){const a=rng()*Math.PI*2,d=25+rng()*130,s=0.6+rng()*0.9;const g=new THREE.Group();const tr=new THREE.Mesh(new THREE.CylinderGeometry(0.15*s,0.25*s,1.5*s,6),new THREE.MeshStandardMaterial({color:0x8B4513,roughness:0.9,flatShading:true}));tr.position.y=0.75*s;tr.castShadow=true;g.add(tr);[0x228B22,0x32CD32,0x2E8B57].forEach((c,ii)=>{const cn=new THREE.Mesh(new THREE.ConeGeometry((1.2-ii*0.3)*s,1.0*s,7),new THREE.MeshStandardMaterial({color:c,roughness:0.85,flatShading:true}));cn.position.y=1.5*s+ii*0.6*s+0.3*s;cn.castShadow=true;g.add(cn)});g.position.set(Math.cos(a)*d,-1,Math.sin(a)*d);scene.add(g)}

for(let i=0;i<35;i++){const s=0.3+rng()*0.8,a=rng()*Math.PI*2,d=20+rng()*120;const r=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0),new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL(0,0,0.4+rng()*0.25),roughness:0.95,flatShading:true}));r.position.set(Math.cos(a)*d,s*0.3-1,Math.sin(a)*d);r.rotation.set(rng()*Math.PI,rng()*Math.PI,0);r.castShadow=true;scene.add(r)}

for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2+rng()*0.3,d=150+rng()*40,h=35+rng()*45;const m=new THREE.Mesh(new THREE.ConeGeometry(25+rng()*15,h,6),new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL(0.25+rng()*0.1,0.3,0.35+rng()*0.1),roughness:0.95,flatShading:true}));m.position.set(Math.cos(a)*d,h/2-6,Math.sin(a)*d);m.castShadow=true;scene.add(m)}

const fp=curve.getPointAt(0),ft2=curve.getTangentAt(0);
const fn=new THREE.Vector3(-ft2.z,0,ft2.x).normalize();const fz=Math.atan2(ft2.x,ft2.z);
const fl=new THREE.Mesh(new THREE.PlaneGeometry(TW,2.5),new THREE.MeshStandardMaterial({map:mkCheck(),roughness:0.8}));fl.position.copy(fp);fl.position.y+=0.2;fl.rotation.x=-Math.PI/2;fl.rotation.z=fz;scene.add(fl);
(function(){
  const pm=new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.5});[-1,1].forEach(s=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,5,6),pm);p.position.copy(fp.clone().add(fn.clone().multiplyScalar(s*TW/2)).add(new THREE.Vector3(0,2.5,0)));p.castShadow=true;scene.add(p)});
  const bc=document.createElement('canvas');bc.width=256;bc.height=64;const bx=bc.getContext('2d');bx.fillStyle='#ff1744';bx.fillRect(0,0,256,64);bx.fillStyle='#fff';bx.font='bold 26px sans-serif';bx.textAlign='center';bx.fillText('A P E X   K A R T S   6 4',128,40);
  const bn=new THREE.Mesh(new THREE.PlaneGeometry(TW,1.5),new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(bc),roughness:0.6,side:THREE.DoubleSide}));bn.position.copy(fp.add(new THREE.Vector3(0,5,0)));bn.rotation.x=-Math.PI/2;bn.rotation.z=fz;scene.add(bn);
  const br=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,TW,6),pm);br.position.copy(fp.add(new THREE.Vector3(0,5.5,0)));br.rotation.x=Math.PI/2;br.rotation.z=fz;scene.add(br);
})();

// Kart mesh
function mkKart(){
  const k=new THREE.Group();
  const ch=new THREE.Mesh(new THREE.BoxGeometry(1.4,0.5,2.4),new THREE.MeshStandardMaterial({color:0xe53935,roughness:0.35,metalness:0.25}));ch.position.y=0.45;ch.castShadow=true;k.add(ch);
  const ck=new THREE.Mesh(new THREE.BoxGeometry(1.0,0.5,0.9),new THREE.MeshStandardMaterial({color:0xb71c1c,roughness:0.45,metalness:0.15}));ck.position.set(0,0.85,0.1);k.add(ck);
  const hd=new THREE.Mesh(new THREE.SphereGeometry(0.3,6,5),new THREE.MeshStandardMaterial({color:0xffcc80,roughness:0.7}));hd.position.set(0,1.25,0.1);hd.castShadow=true;k.add(hd);
  const hm=new THREE.Mesh(new THREE.SphereGeometry(0.32,6,4,0,Math.PI*2,0,Math.PI*0.6),new THREE.MeshStandardMaterial({color:0x1e88e5,roughness:0.3,metalness:0.4}));hm.position.set(0,1.3,0.05);k.add(hm);
  const wk=new THREE.Mesh(new THREE.PlaneGeometry(0.9,0.4),new THREE.MeshStandardMaterial({color:0x80deea,transparent:true,opacity:0.4,roughness:0.1,metalness:0.5,side:THREE.DoubleSide}));wk.position.set(0,1,0.45);wk.rotation.x=-0.3;k.add(wk);
  const wg=new THREE.CylinderGeometry(0.32,0.32,0.25,8),wm=new THREE.MeshStandardMaterial({color:0x212121,roughness:0.8});
  const hg=new THREE.CylinderGeometry(0.12,0.12,0.27,6),hm2=new THREE.MeshStandardMaterial({color:0xcccccc,metalness:0.6,roughness:0.3});
  k.wheels=[];
  [[-0.8,0.32,0.8],[0.8,0.32,0.8],[-0.8,0.32,-0.8],[0.8,0.32,-0.8]].forEach(p=>{const wg2=new THREE.Group();const w=new THREE.Mesh(wg,wm);w.rotation.z=Math.PI/2;wg2.add(w);const h=new THREE.Mesh(hg,hm2);h.rotation.z=Math.PI/2;wg2.add(h);wg2.position.set(...p);wg2.castShadow=true;k.add(wg2);k.wheels.push(wg2)});
  const sm=new THREE.MeshStandardMaterial({color:0x1a1a1a,roughness:0.6});
  const sp=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.08,0.4),sm);sp.position.set(0,1.1,-1.1);k.add(sp);
  [-0.55,0.55].forEach(x=>{const s=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.35,0.08),sm);s.position.set(x,0.9,-1.1);k.add(s)});
  [-0.4,0.4].forEach(x=>{const e=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.08,0.4,6),new THREE.MeshStandardMaterial({color:0x9e9e9e,metalness:0.8,roughness:0.2}));e.position.set(x,0.35,-1.3);e.rotation.x=Math.PI/2;k.add(e)});
  const hl=new THREE.MeshStandardMaterial({color:0xffeb3b,emissive:0xffeb3b,emissiveIntensity:0.8});[-0.4,0.4].forEach(x=>{const h=new THREE.Mesh(new THREE.SphereGeometry(0.08,4,4),hl);h.position.set(x,0.4,1.2);k.add(h)});
  const tl=new THREE.MeshStandardMaterial({color:0xff1744,emissive:0xff1744,emissiveIntensity:0.6});[-0.4,0.4].forEach(x=>{const h=new THREE.Mesh(new THREE.SphereGeometry(0.06,4,4),tl);h.position.set(x,0.4,-1.2);k.add(h)});
  return k;
}
const kartMesh=mkKart();scene.add(kartMesh);

// Particle system helper
function makePS(maxC,sz){
  const geo=new THREE.BufferGeometry();const pos=new Float32Array(maxC*3);const col=new Float32Array(maxC*3);
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('color',new THREE.BufferAttribute(col,3));
  const mat=new THREE.PointsMaterial({size:sz,vertexColors:true,transparent:true,opacity:0.8,sizeAttenuation:true,depthWrite:false,blending:THREE.AdditiveBlending});
  const pts=new THREE.Points(geo,mat);const pool=[];for(let i=0;i<maxC;i++)pool.push({a:false,l:0,ml:0,vx:0,vy:0,vz:0,r:0,g:0,b:0});
  return{pts,geo,pool,maxC};
}
const exhaustPS=makePS(50,0.2);scene.add(exhaustPS.pts);
const driftPS=makePS(80,0.15);scene.add(driftPS.pts);
const trailPS=makePS(30,0.12);scene.add(trailPS.pts);

function emit(sys,x,y,z,vx,vy,vz,life,r,g,b){
  for(let i=0;i<sys.maxC;i++){if(!sys.pool[i].a){const p=sys.pool[i];p.a=true;p.l=life;p.ml=life;p.vx=vx;p.vy=vy;p.vz=vz;p.r=r;p.g=g;p.b=b;sys.geo.attributes.position.array[i*3]=x;sys.geo.attributes.position.array[i*3+1]=y;sys.geo.attributes.position.array[i*3+2]=z;return}}
}
function updatePS(sys,dt){
  for(let i=0;i<sys.maxC;i++){const p=sys.pool[i];if(!p.a)continue;p.l-=dt;if(p.l<=0){p.a=false;sys.geo.attributes.position.array[i*3+1]=-9999;continue}const t=p.l/p.ml;sys.geo.attributes.position.array[i*3]+=p.vx*dt;sys.geo.attributes.position.array[i*3+1]+=p.vy*dt;sys.geo.attributes.position.array[i*3+2]+=p.vz*dt;sys.geo.attributes.color.array[i*3]=p.r*t;sys.geo.attributes.color.array[i*3+1]=p.g*t;sys.geo.attributes.color.array[i*3+2]=p.b*t}
  sys.geo.attributes.position.needsUpdate=true;sys.geo.attributes.color.needsUpdate=true;
}

// Expose to part 2
window._ak64={scene,cam,ren,sun,kartMesh,exhaustPS,driftPS,trailPS,curve,fp,fn,fz,TW,TS,emit,updatePS};
})();