import * as THREE from 'three';
import './style.css';

const canvas = document.querySelector('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x79b8d5);
scene.fog = new THREE.Fog(0x79b8d5, 35, 150);
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, .1, 300);
const clock = new THREE.Clock();
const player = new THREE.Group();
const enemies = [];
const blocks = [];
const input = { x: 0, y: 0, firing: false };
let yaw = .52, pitch = -.22, velocityY = 0, hp = 100, started = false, finished = false, fireCooldown = 0, elapsed = 0;

const mat = (color, rough = .85) => new THREE.MeshStandardMaterial({ color, roughness: rough, flatShading: true });
const box = (w, h, d, color, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat(color)); m.position.set(x,y,z); m.castShadow = m.receiveShadow = true; scene.add(m); return m; };

scene.add(new THREE.HemisphereLight(0xc8f3ff, 0x30492d, 2.1));
const sun = new THREE.DirectionalLight(0xfff4d6, 2.7); sun.position.set(-40, 65, 25); sun.castShadow = true; sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left = sun.shadow.camera.bottom = -70; sun.shadow.camera.right = sun.shadow.camera.top = 70; scene.add(sun);
const ground = box(200, 1, 200, 0x667f63, 0, -.5, 0); ground.receiveShadow = true;

function makeCity() {
  const roads = [-18, 0, 18];
  const colors = [0xd8cdb9,0xa9b9c4,0xc4a989,0x91a6a4,0xc8b9b6];
  for (let x = -45; x <= 45; x += 9) for (let z = -45; z <= 45; z += 9) {
    if (roads.some(r => Math.abs(x-r)<4) || roads.some(r => Math.abs(z-r)<4)) continue;
    const h = 7 + ((Math.abs(x*11+z*7)%17));
    const building = box(7, h, 7, colors[Math.abs(x+z)%colors.length], x, h/2, z);
    blocks.push({ minX:x-3.5,maxX:x+3.5,minZ:z-3.5,maxZ:z+3.5, mesh:building });
    for(let floor=3; floor<h-1; floor+=3) {
      box(1.1,.7,.08,0x30556a,x-2.1,floor,z-3.55); box(1.1,.7,.08,0x30556a,x+2.1,floor,z-3.55);
    }
  }
  box(9, 35, 9, 0xd5413b, -27, 17.5, -26); // Tokyo tower-inspired landmark
  box(2, 16, 2, 0xf3e0bb, -27, 43, -26);
  for (let i=-45;i<=45;i+=9) { box(1,.05,7,0xe2cf86,i,.03,0); box(7,.05,1,0xe2cf86,0,.03,i); }
}
makeCity();

function createPlayer() {
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.1,1.7,.7), mat(0x245d8e)); body.position.y=1.35; body.castShadow=true; player.add(body);
  const head = new THREE.Mesh(new THREE.BoxGeometry(.74,.74,.74), mat(0xe1b387)); head.position.y=2.52; head.castShadow=true; player.add(head);
  const gun = new THREE.Mesh(new THREE.BoxGeometry(.18,.18,1.25), mat(0x202936,.3)); gun.position.set(.48,1.55,-.78); gun.rotation.x=-.12; player.add(gun);
  player.position.set(0,0,23); scene.add(player);
}
createPlayer();

function createAlien(x,z) {
  const alien = new THREE.Group(); alien.userData = { hp: 4, speed: 1.4 + Math.random()*.5, cool: Math.random()*1.5, bob:Math.random()*6 };
  const green = mat(0x77be45), dark = mat(0x385c3e), eye = mat(0xffee5a,.3);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.35,1.3,.8), green); torso.position.y=1.55; torso.castShadow=true; alien.add(torso);
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.2,.95,1.05), green); head.position.y=2.7; head.castShadow=true; alien.add(head);
  [-.34,.34].forEach(px => { const e = new THREE.Mesh(new THREE.BoxGeometry(.22,.22,.06),eye); e.position.set(px,2.78,-.55); alien.add(e); });
  [-.65,.65].forEach(px => { const leg = new THREE.Mesh(new THREE.BoxGeometry(.35,1,.35),dark); leg.position.set(px, .5, 0); leg.castShadow=true; alien.add(leg); });
  alien.position.set(x,0,z); scene.add(alien); enemies.push(alien);
}
[[12,3],[-11,8],[20,-18],[-20,-12],[3,-34],[35,12],[-37,22],[31,-35]].forEach(p=>createAlien(...p));

function clampPlayer() { player.position.x = THREE.MathUtils.clamp(player.position.x,-47,47); player.position.z=THREE.MathUtils.clamp(player.position.z,-47,47); }
function updatePlayer(dt) {
  const forward = new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw),).multiplyScalar(-input.y);
  const right = new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw)).multiplyScalar(input.x);
  const move = forward.add(right); if(move.lengthSq()>0) { move.normalize().multiplyScalar(9*dt); player.position.add(move); player.rotation.y=Math.atan2(move.x,move.z); }
  velocityY -= 24*dt; player.position.y += velocityY*dt; if(player.position.y<0){ player.position.y=0; velocityY=0; } clampPlayer();
  const ideal = new THREE.Vector3(0,2.7,6.4).applyAxisAngle(new THREE.Vector3(0,1,0),yaw).add(player.position);
  camera.position.lerp(ideal, 1-Math.exp(-10*dt));
  const target = player.position.clone().add(new THREE.Vector3(0,1.65,0));
  target.add(new THREE.Vector3(-Math.sin(yaw)*7, Math.sin(pitch)*6, -Math.cos(yaw)*7)); camera.lookAt(target);
}
function shoot() {
  if(!started || finished || fireCooldown>0) return; fireCooldown=.16;
  const origin = camera.position.clone(); const direction = new THREE.Vector3(); camera.getWorldDirection(direction); const ray = new THREE.Raycaster(origin,direction,0,80);
  const hits = ray.intersectObjects(enemies,true); if(hits.length) { let alien=hits[0].object; while(alien.parent && !enemies.includes(alien)) alien=alien.parent; if(enemies.includes(alien)) { alien.userData.hp--; document.querySelector('#hit-marker').style.opacity=1; setTimeout(()=>document.querySelector('#hit-marker').style.opacity=0,70); if(alien.userData.hp<=0){ scene.remove(alien); enemies.splice(enemies.indexOf(alien),1); } } }
  const flash = new THREE.PointLight(0xffd46b, 7, 12); flash.position.copy(origin); scene.add(flash); setTimeout(()=>scene.remove(flash),45);
  document.querySelector('#enemy-count').textContent=String(enemies.length).padStart(2,'0');
}
function updateEnemies(dt) {
  for(const alien of enemies) { const flat=player.position.clone().sub(alien.position); flat.y=0; const dist=flat.length(); alien.lookAt(player.position.x,alien.position.y,player.position.z); alien.rotation.x=0; alien.rotation.z=0; if(dist>3.2) alien.position.add(flat.normalize().multiplyScalar(alien.userData.speed*dt)); else { alien.userData.cool-=dt; if(alien.userData.cool<0){ alien.userData.cool=.9; hp=Math.max(0,hp-7); const bar=document.querySelector('#hp-bar'); bar.style.width=hp+'%'; bar.style.background=hp<35?'#ef514b':'#42e770'; document.querySelector('#hp').textContent=hp; } } alien.position.y=Math.sin(elapsed*4+alien.userData.bob)*.12; }
}
function finish(win) { finished=true; document.querySelector('#result-screen').classList.remove('hidden'); document.querySelector('#result-eyebrow').textContent=win?'MISSION COMPLETE':'MISSION FAILED'; document.querySelector('#result-title').textContent=win?'東京を守り抜いた':'防衛線が突破された'; document.querySelector('#result-copy').textContent=win?'敵性宇宙人の撃退に成功。次の防衛区域に備えよ。':'アーマーが尽きた。装備を整えて再出動せよ。'; }
function loop() { const dt=Math.min(clock.getDelta(),.05); elapsed+=dt; if(started&&!finished){fireCooldown-=dt; updatePlayer(dt); updateEnemies(dt); if(input.firing)shoot(); if(enemies.length===0)finish(true); if(hp<=0)finish(false);} renderer.render(scene,camera); requestAnimationFrame(loop); }
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false);} addEventListener('resize',resize); resize(); loop();

const moveZone=document.querySelector('#move-zone'), stick=document.querySelector('#stick'); let moveTouch=null, lookTouch=null, lookPoint=null;
function moveFromTouch(t){ const r=moveZone.getBoundingClientRect(), cx=r.left+r.width/2,cy=r.top+r.height/2; let dx=t.clientX-cx,dy=t.clientY-cy; const len=Math.hypot(dx,dy), max=42; if(len>max){dx*=max/len;dy*=max/len;} stick.style.transform=`translate(${dx}px,${dy}px)`; input.x=dx/max;input.y=dy/max; }
moveZone.addEventListener('pointerdown',e=>{moveTouch=e.pointerId;moveZone.setPointerCapture(e.pointerId);moveFromTouch(e);}); moveZone.addEventListener('pointermove',e=>{if(e.pointerId===moveTouch)moveFromTouch(e);}); moveZone.addEventListener('pointerup',e=>{if(e.pointerId===moveTouch){moveTouch=null;input.x=input.y=0;stick.style.transform='';}});
canvas.addEventListener('pointerdown',e=>{if(e.clientX>innerWidth*.36){lookTouch=e.pointerId;lookPoint={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);}}); canvas.addEventListener('pointermove',e=>{if(e.pointerId===lookTouch){yaw-= (e.clientX-lookPoint.x)*.008; pitch=THREE.MathUtils.clamp(pitch-(e.clientY-lookPoint.y)*.006,-.62,.26);lookPoint={x:e.clientX,y:e.clientY};}}); canvas.addEventListener('pointerup',e=>{if(e.pointerId===lookTouch)lookTouch=null;});
const attack=document.querySelector('#attack'); ['pointerdown','pointerup','pointercancel'].forEach(type=>attack.addEventListener(type,e=>{e.preventDefault();input.firing=type==='pointerdown';if(input.firing)shoot();})); document.querySelector('#jump').addEventListener('pointerdown',()=>{if(player.position.y<.03)velocityY=10;});
document.querySelector('#start').onclick=()=>{document.querySelector('#start-screen').classList.add('hidden'); started=true;setTimeout(()=>document.querySelector('#hint').style.opacity=0,4200);}; document.querySelector('#restart').onclick=()=>location.reload();
addEventListener('keydown',e=>{ if(e.code==='Space'&&player.position.y<.03)velocityY=10; if(e.code==='KeyF')shoot(); input.y=(e.code==='KeyW'||e.code==='ArrowUp')?-1:(e.code==='KeyS'||e.code==='ArrowDown')?1:input.y; input.x=(e.code==='KeyA'||e.code==='ArrowLeft')?-1:(e.code==='KeyD'||e.code==='ArrowRight')?1:input.x; }); addEventListener('keyup',e=>{if(['KeyW','KeyS','ArrowUp','ArrowDown'].includes(e.code))input.y=0;if(['KeyA','KeyD','ArrowLeft','ArrowRight'].includes(e.code))input.x=0;});
