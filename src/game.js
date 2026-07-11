import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const APP_VERSION = 'Ver 0.5.3';
const SAVE_KEY = 'tokyo-defense-loadout';
const yAxis = new THREE.Vector3(0, 1, 0);

const DEFAULT_CONFIG = {
  weaponShape: 'rifle',
  weaponColor: 'gold',
  bodyColor: 'blue',
  skinColor: 'warm',
  hairStyle: 'short',
  eyeStyle: 'normal',
  mouthStyle: 'smile',
};

const OPTIONS = {
  weaponShape: [
    { value: 'pistol', label: 'ハンドガン' },
    { value: 'rifle', label: 'ライフル' },
    { value: 'shotgun', label: 'ショットガン' },
    { value: 'plasma', label: 'プラズマ銃' },
  ],
  weaponColor: [
    { value: 'black', label: 'ブラック' },
    { value: 'gold', label: 'ゴールド' },
    { value: 'red', label: 'レッド' },
    { value: 'cyan', label: 'シアン' },
  ],
  bodyColor: [
    { value: 'blue', label: 'ブルー' },
    { value: 'green', label: 'グリーン' },
    { value: 'violet', label: 'バイオレット' },
    { value: 'brown', label: 'ブラウン' },
  ],
  skinColor: [
    { value: 'light', label: 'ライト' },
    { value: 'tan', label: 'タン' },
    { value: 'warm', label: 'ウォーム' },
    { value: 'deep', label: 'ディープ' },
  ],
  hairStyle: [
    { value: 'short', label: 'ショート' },
    { value: 'spike', label: 'スパイク' },
    { value: 'bob', label: 'ボブ' },
    { value: 'curly', label: 'くせ毛' },
  ],
  eyeStyle: [
    { value: 'normal', label: 'ノーマル' },
    { value: 'sharp', label: 'シャープ' },
    { value: 'sleepy', label: 'スリープ' },
    { value: 'glow', label: 'グロー' },
  ],
  mouthStyle: [
    { value: 'smile', label: 'スマイル' },
    { value: 'neutral', label: 'ニュートラル' },
    { value: 'open', label: 'オープン' },
    { value: 'serious', label: 'シリアス' },
  ],
};

const COLOR_VALUES = {
  black: 0x202936,
  gold: 0xd1a03d,
  red: 0xd53d35,
  cyan: 0x4fd3ff,
  blue: 0x245d8e,
  green: 0x2f7f5e,
  violet: 0x7a54d5,
  brown: 0x7f4f36,
  light: 0xf0ccb0,
  tan: 0xd89b6a,
  warm: 0xe1b387,
  deep: 0xaa7b52,
};

function resolveColor(value) {
  return COLOR_VALUES[value] ?? 0xffffff;
}

function loadConfig() {
  try {
    const stored = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    return { ...DEFAULT_CONFIG, ...(stored || {}) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function saveConfig() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage failures in private mode.
  }
}

function createOption(select, { value, label }) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  select.appendChild(option);
}

function fillSelect(select, options) {
  select.innerHTML = '';
  options.forEach((option) => createOption(select, option));
}

function colorToCss(value) {
  return `#${resolveColor(value).toString(16).padStart(6, '0')}`;
}

function hideAllOverlays() {
  document.documentElement.classList.remove('settings-open');
  document.body.classList.remove('settings-open');
  startScreen.classList.add('hidden');
  settingsScreen.classList.add('hidden');
  resultScreen.classList.add('hidden');
}

function showStartScreen() {
  hideAllOverlays();
  startScreen.classList.remove('hidden');
}

function showSettingsScreen() {
  hideAllOverlays();
  document.documentElement.classList.add('settings-open');
  document.body.classList.add('settings-open');
  settingsScreen.classList.remove('hidden');
}

function startGame() {
  hideAllOverlays();
  started = true;
  setTimeout(() => {
    hint.style.opacity = 0;
  }, 4200);
}

function syncUIFromConfig() {
  weaponShapeSelect.value = config.weaponShape;
  weaponColorSelect.value = config.weaponColor;
  bodyColorSelect.value = config.bodyColor;
  skinColorSelect.value = config.skinColor;
  hairStyleSelect.value = config.hairStyle;
  eyeStyleSelect.value = config.eyeStyle;
  mouthStyleSelect.value = config.mouthStyle;
  updateSettingsPreview();
}

function readConfigFromUI() {
  return {
    weaponShape: weaponShapeSelect.value,
    weaponColor: weaponColorSelect.value,
    bodyColor: bodyColorSelect.value,
    skinColor: skinColorSelect.value,
    hairStyle: hairStyleSelect.value,
    eyeStyle: eyeStyleSelect.value,
    mouthStyle: mouthStyleSelect.value,
  };
}

function applyConfig(nextConfig) {
  config = { ...config, ...nextConfig };
  saveConfig();
  syncUIFromConfig();
  updateAppearance();
  buildWeapon(config.weaponShape);
  updateSettingsPreview();
}

function createButtonMaterial(color) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.35,
    flatShading: true,
  });
}

function buildHair(style) {
  hairGroup.clear();

  const hairMat = new THREE.MeshStandardMaterial({ color: 0x271911, roughness: 0.85, flatShading: true });
  const add = (geo, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const mesh = new THREE.Mesh(geo, hairMat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    hairGroup.add(mesh);
  };

  switch (style) {
    case 'spike':
      add(new THREE.BoxGeometry(0.7, 0.18, 0.55), 0, 0.18, 0);
      for (let i = -2; i <= 2; i += 1) {
        add(new THREE.BoxGeometry(0.16, 0.38, 0.18), i * 0.14, 0.37, -0.02, 0, 0, i * 0.08);
      }
      break;
    case 'bob':
      add(new THREE.BoxGeometry(0.78, 0.22, 0.6), 0, 0.2, 0);
      add(new THREE.BoxGeometry(0.12, 0.44, 0.54), -0.4, -0.02, 0.02);
      add(new THREE.BoxGeometry(0.12, 0.44, 0.54), 0.4, -0.02, 0.02);
      add(new THREE.BoxGeometry(0.7, 0.18, 0.15), 0, -0.22, 0.23);
      break;
    case 'curly':
      add(new THREE.BoxGeometry(0.66, 0.18, 0.5), 0, 0.2, 0);
      [-0.32, -0.1, 0.12, 0.34].forEach((x, index) => {
        add(new THREE.BoxGeometry(0.16, 0.24, 0.16), x, 0.34 + (index % 2 ? 0.06 : 0), 0.03);
      });
      add(new THREE.BoxGeometry(0.16, 0.26, 0.16), -0.16, -0.02, -0.02, 0, 0, -0.2);
      add(new THREE.BoxGeometry(0.16, 0.26, 0.16), 0.18, -0.03, -0.02, 0, 0, 0.18);
      break;
    default:
      add(new THREE.BoxGeometry(0.72, 0.18, 0.62), 0, 0.2, 0);
      add(new THREE.BoxGeometry(0.64, 0.16, 0.12), 0, -0.2, 0.22);
      add(new THREE.BoxGeometry(0.18, 0.16, 0.5), -0.34, 0.02, 0.04);
      add(new THREE.BoxGeometry(0.18, 0.16, 0.5), 0.34, 0.02, 0.04);
      break;
  }
}

function buildFace(eyeStyle, mouthStyle) {
  faceFeatureGroup.clear();

  const eyeMat = new THREE.MeshStandardMaterial({
    color: eyeStyle === 'glow' ? 0x78f2ff : 0x131313,
    emissive: eyeStyle === 'glow' ? 0x78f2ff : 0x000000,
    emissiveIntensity: eyeStyle === 'glow' ? 1.8 : 0,
    roughness: 0.2,
    flatShading: true,
  });
  const mouthMat = new THREE.MeshStandardMaterial({
    color: mouthStyle === 'serious' ? 0x401f1a : 0x2a140f,
    roughness: 0.4,
    flatShading: true,
  });

  const eyeConfig = {
    normal: { w: 0.12, h: 0.1, y: 0.06, z: 0.37 },
    sharp: { w: 0.18, h: 0.07, y: 0.08, z: 0.37 },
    sleepy: { w: 0.16, h: 0.06, y: 0.01, z: 0.37 },
    glow: { w: 0.16, h: 0.14, y: 0.05, z: 0.37 },
  }[eyeStyle] || { w: 0.12, h: 0.1, y: 0.06, z: 0.37 };

  const eyeLeft = new THREE.Mesh(new THREE.BoxGeometry(eyeConfig.w, eyeConfig.h, 0.04), eyeMat);
  eyeLeft.position.set(-0.16, eyeConfig.y, eyeConfig.z);
  eyeLeft.castShadow = true;
  faceFeatureGroup.add(eyeLeft);

  const eyeRight = eyeLeft.clone();
  eyeRight.position.x = 0.16;
  if (eyeStyle === 'sharp') eyeRight.rotation.z = -0.08;
  faceFeatureGroup.add(eyeRight);

  let mouth;
  switch (mouthStyle) {
    case 'open':
      mouth = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.04), mouthMat);
      mouth.position.set(0, -0.15, 0.37);
      break;
    case 'neutral':
      mouth = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.04), mouthMat);
      mouth.position.set(0, -0.15, 0.37);
      break;
    case 'serious':
      mouth = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.04), mouthMat);
      mouth.position.set(0, -0.14, 0.37);
      break;
    default:
      mouth = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.04), mouthMat);
      mouth.position.set(0, -0.14, 0.37);
      break;
  }
  mouth.castShadow = true;
  faceFeatureGroup.add(mouth);
}

function buildWeapon(shape) {
  weaponGroup.clear();
  weaponMuzzle = new THREE.Object3D();

  const base = weaponBaseMat;
  const accent = weaponAccentMat;
  const add = (geo, material, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    weaponGroup.add(mesh);
    return mesh;
  };

  switch (shape) {
    case 'pistol':
      add(new THREE.BoxGeometry(0.42, 0.18, 0.72), base, 0, 0.08, -0.08);
      add(new THREE.BoxGeometry(0.16, 0.28, 0.24), accent, 0.06, -0.14, 0.06, 0, 0, -0.12);
      add(new THREE.BoxGeometry(0.1, 0.12, 0.52), base, 0, 0.12, -0.48);
      weaponMuzzle.position.set(0, 0.12, -0.74);
      break;
    case 'shotgun':
      add(new THREE.BoxGeometry(0.38, 0.22, 0.86), base, 0, 0.12, -0.1);
      add(new THREE.BoxGeometry(0.16, 0.18, 0.86), accent, 0, 0.12, -0.56);
      add(new THREE.BoxGeometry(0.2, 0.16, 0.36), base, 0.12, -0.08, 0.16, 0, 0, 0.2);
      add(new THREE.BoxGeometry(0.12, 0.16, 0.42), accent, -0.18, -0.04, 0.08);
      weaponMuzzle.position.set(0, 0.12, -0.9);
      break;
    case 'plasma':
      add(new THREE.BoxGeometry(0.34, 0.34, 0.54), base, 0, 0.08, -0.06);
      add(new THREE.BoxGeometry(0.16, 0.28, 0.74), accent, 0, 0.08, -0.38);
      add(new THREE.BoxGeometry(0.08, 0.5, 0.16), accent, 0.2, 0.1, -0.04);
      add(new THREE.BoxGeometry(0.08, 0.5, 0.16), accent, -0.2, 0.1, -0.04);
      add(new THREE.SphereGeometry(0.13, 12, 12), new THREE.MeshStandardMaterial({ color: resolveColor(config.weaponColor), emissive: resolveColor(config.weaponColor), emissiveIntensity: 1.2, roughness: 0.25 }), 0, 0.12, -0.72);
      weaponMuzzle.position.set(0, 0.12, -0.9);
      break;
    default:
      add(new THREE.BoxGeometry(0.5, 0.18, 0.88), base, 0, 0.08, -0.08);
      add(new THREE.BoxGeometry(0.14, 0.26, 0.28), accent, 0.1, -0.14, 0.04, 0, 0, -0.16);
      add(new THREE.BoxGeometry(0.11, 0.11, 0.76), base, 0, 0.12, -0.54);
      add(new THREE.BoxGeometry(0.14, 0.14, 0.18), accent, -0.16, 0.02, 0.1);
      weaponMuzzle.position.set(0, 0.12, -0.88);
      break;
  }

  weaponMuzzle.name = 'weapon-muzzle';
  weaponGroup.add(weaponMuzzle);
}

function updateAppearance() {
  bodyMat.color.setHex(resolveColor(config.bodyColor));
  skinMat.color.setHex(resolveColor(config.skinColor));
  weaponAccentMat.color.setHex(resolveColor(config.weaponColor));
  buildHair(config.hairStyle);
  buildFace(config.eyeStyle, config.mouthStyle);
}

function updateSettingsPreview() {
  if (!appearancePreview) return;

  appearancePreview.style.setProperty('--preview-body', colorToCss(config.bodyColor));
  appearancePreview.style.setProperty('--preview-skin', colorToCss(config.skinColor));
  appearancePreview.style.setProperty('--preview-weapon', colorToCss(config.weaponColor));

  previewFigure.dataset.hair = config.hairStyle;
  previewWeapon.dataset.shape = config.weaponShape;
  previewEyes.forEach((eye) => {
    eye.dataset.style = config.eyeStyle;
  });
  previewMouth.dataset.style = config.mouthStyle;
}

const canvas = document.querySelector('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x79b8d5);
scene.fog = new THREE.Fog(0x79b8d5, 35, 150);
scene.add(new THREE.HemisphereLight(0xdff6ff, 0x31452f, 2.2));
const sun = new THREE.DirectionalLight(0xfff4d6, 2.8);
sun.position.set(-40, 65, 25);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -70;
sun.shadow.camera.right = 70;
sun.shadow.camera.top = 70;
sun.shadow.camera.bottom = -70;
scene.add(sun);
scene.add(new THREE.AmbientLight(0xffffff, 0.55));
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 300);
const clock = new THREE.Clock();
const player = new THREE.Group();
const enemies = [];
const bullets = [];
const blocks = [];
const occlusionRaycaster = new THREE.Raycaster();
const cameraFocus = new THREE.Vector3();
const cameraRayDirection = new THREE.Vector3();
const fadedBuildings = new Set();
const input = { x: 0, y: 0, firing: false };
let yaw = 0.52;
let pitch = -0.22;
let velocityY = 0;
let hp = 100;
let started = false;
let finished = false;
let fireCooldown = 0;
let elapsed = 0;
let pendingEnemyFinish = null;
let config = loadConfig();

const bodyMat = new THREE.MeshStandardMaterial({ color: resolveColor(config.bodyColor), roughness: 0.85, flatShading: true });
const skinMat = new THREE.MeshStandardMaterial({ color: resolveColor(config.skinColor), roughness: 0.9, flatShading: true });
const weaponBaseMat = new THREE.MeshStandardMaterial({ color: 0x202936, roughness: 0.35, flatShading: true });
const weaponAccentMat = new THREE.MeshStandardMaterial({ color: resolveColor(config.weaponColor), roughness: 0.35, flatShading: true });

const versionBadge = document.querySelector('#app-version');
const startScreen = document.querySelector('#start-screen');
const settingsScreen = document.querySelector('#settings-screen');
const resultScreen = document.querySelector('#result-screen');
const startButton = document.querySelector('#start');
const openSettingsButton = document.querySelector('#open-settings');
const backFromSettingsButton = document.querySelector('#back-from-settings');
const applySettingsButton = document.querySelector('#apply-settings');
const hint = document.querySelector('#hint');

const weaponShapeSelect = document.querySelector('#weapon-shape');
const weaponColorSelect = document.querySelector('#weapon-color');
const bodyColorSelect = document.querySelector('#body-color');
const skinColorSelect = document.querySelector('#skin-color');
const hairStyleSelect = document.querySelector('#hair-style');
const eyeStyleSelect = document.querySelector('#eye-style');
const mouthStyleSelect = document.querySelector('#mouth-style');

const hpText = document.querySelector('#hp');
const hpBar = document.querySelector('#hp-bar');
const enemyCountText = document.querySelector('#enemy-count');
const hitMarker = document.querySelector('#hit-marker');
const resultEyebrow = document.querySelector('#result-eyebrow');
const resultTitle = document.querySelector('#result-title');
const resultCopy = document.querySelector('#result-copy');
const objectiveText = document.querySelector('#objective');
const appearancePreview = document.querySelector('.appearance-preview');
const previewFigure = document.querySelector('.preview-figure');
const previewEyes = document.querySelectorAll('.preview-eye');
const previewMouth = document.querySelector('.preview-mouth');
const previewWeapon = document.querySelector('.preview-weapon');

versionBadge.textContent = APP_VERSION;
document.querySelectorAll('.app-version-line').forEach((node) => {
  node.textContent = APP_VERSION;
});

Object.entries(OPTIONS).forEach(([key, options]) => {
  const select = {
    weaponShape: weaponShapeSelect,
    weaponColor: weaponColorSelect,
    bodyColor: bodyColorSelect,
    skinColor: skinColorSelect,
    hairStyle: hairStyleSelect,
    eyeStyle: eyeStyleSelect,
    mouthStyle: mouthStyleSelect,
  }[key];
  fillSelect(select, options);
});

function createCityBlock(w, h, d, color, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true }));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

const ground = new THREE.Mesh(
  new THREE.BoxGeometry(220, 1, 220),
  new THREE.MeshStandardMaterial({ color: 0x667f63, roughness: 1, flatShading: true }),
);
ground.position.set(0, -0.5, 0);
ground.receiveShadow = true;
scene.add(ground);

function makeCity() {
  const roads = [-18, 0, 18];
  const colors = [0xd8cdb9, 0xa9b9c4, 0xc4a989, 0x91a6a4, 0xc8b9b6];
  for (let x = -45; x <= 45; x += 9) {
    for (let z = -45; z <= 45; z += 9) {
      if (roads.some((r) => Math.abs(x - r) < 4) || roads.some((r) => Math.abs(z - r) < 4)) continue;
      const h = 7 + ((Math.abs(x * 11 + z * 7) % 17));
      const building = createCityBlock(7, h, 7, colors[Math.abs(x + z) % colors.length], x, h / 2, z);
      blocks.push({ minX: x - 3.5, maxX: x + 3.5, minZ: z - 3.5, maxZ: z + 3.5, mesh: building });
      for (let floor = 3; floor < h - 1; floor += 3) {
        createCityBlock(1.1, 0.7, 0.08, 0x30556a, x - 2.1, floor, z - 3.55);
        createCityBlock(1.1, 0.7, 0.08, 0x30556a, x + 2.1, floor, z - 3.55);
      }
    }
  }
  createCityBlock(9, 35, 9, 0xd5413b, -27, 17.5, -26);
  createCityBlock(2, 16, 2, 0xf3e0bb, -27, 43, -26);
  for (let i = -45; i <= 45; i += 9) {
    createCityBlock(1, 0.05, 7, 0xe2cf86, i, 0.03, 0);
    createCityBlock(7, 0.05, 1, 0xe2cf86, 0, 0.03, i);
  }
}

function createPlayer() {
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.7, 0.7), bodyMat);
  body.position.y = 1.35;
  body.castShadow = true;
  player.add(body);

  const headGroup = new THREE.Group();
  headGroup.position.y = 2.52;
  player.add(headGroup);

  const face = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.72, 0.58), skinMat);
  face.position.z = 0.02;
  face.castShadow = true;
  headGroup.add(face);

  hairGroup = new THREE.Group();
  hairGroup.position.y = 0.14;
  headGroup.add(hairGroup);

  faceFeatureGroup = new THREE.Group();
  faceFeatureGroup.position.z = -0.66;
  headGroup.add(faceFeatureGroup);

  weaponGroup = new THREE.Group();
  weaponGroup.position.set(0.46, 1.55, -0.78);
  weaponGroup.rotation.x = -0.12;
  player.add(weaponGroup);

  player.position.set(0, 0, 23);
  scene.add(player);
}

let hairGroup;
let faceFeatureGroup;
let weaponGroup;
let weaponMuzzle = null;

function createAlien(x, z) {
  const alien = new THREE.Group();
  alien.userData = {
    hp: 4,
    speed: 1.4 + Math.random() * 0.5,
    cool: Math.random() * 1.5,
    bob: Math.random() * 6,
    dying: false,
    fallTimer: 0,
    wobbleDir: 1,
    spin: 0,
  };
  const green = new THREE.MeshStandardMaterial({ color: 0x77be45, roughness: 0.85, flatShading: true });
  const dark = new THREE.MeshStandardMaterial({ color: 0x385c3e, roughness: 0.9, flatShading: true });
  const eye = new THREE.MeshStandardMaterial({ color: 0xffee5a, emissive: 0xffee5a, emissiveIntensity: 0.3, roughness: 0.3, flatShading: true });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.3, 0.8), green);
  torso.position.y = 1.55;
  torso.castShadow = true;
  alien.add(torso);

  const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.95, 1.05), green);
  head.position.y = 2.7;
  head.castShadow = true;
  alien.add(head);

  [-0.34, 0.34].forEach((px) => {
    const e = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.06), eye);
    e.position.set(px, 2.78, -0.55);
    alien.add(e);
  });

  [-0.65, 0.65].forEach((px) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1, 0.35), dark);
    leg.position.set(px, 0.5, 0);
    leg.castShadow = true;
    alien.add(leg);
  });

  alien.position.set(x, 0, z);
  scene.add(alien);
  enemies.push(alien);
}

[[12, 3], [-11, 8], [20, -18], [-20, -12], [3, -34], [35, 12], [-37, 22], [31, -35]].forEach((p) => createAlien(...p));

function clampPlayer() {
  player.position.x = THREE.MathUtils.clamp(player.position.x, -47, 47);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -47, 47);
}

function playerCollisionAt(x, z) {
  const r = 1.15;
  for (const b of blocks) {
    if (x > b.minX - r && x < b.maxX + r && z > b.minZ - r && z < b.maxZ + r) return true;
  }
  return false;
}

function updateBuildingOcclusion() {
  fadedBuildings.clear();
  cameraFocus.copy(player.position).add(new THREE.Vector3(0, 1.7, 0));
  cameraRayDirection.copy(cameraFocus).sub(camera.position);
  const distanceToPlayer = cameraRayDirection.length();
  cameraRayDirection.normalize();
  occlusionRaycaster.set(camera.position, cameraRayDirection);

  const hits = occlusionRaycaster.intersectObjects(blocks.map((block) => block.mesh), false);
  hits.forEach((hit) => {
    if (hit.distance < distanceToPlayer - 0.5) fadedBuildings.add(hit.object);
  });

  blocks.forEach(({ mesh }) => {
    const shouldFade = fadedBuildings.has(mesh);
    if (mesh.userData.fadedForCamera === shouldFade) return;
    mesh.userData.fadedForCamera = shouldFade;
    mesh.material.transparent = shouldFade;
    mesh.material.opacity = shouldFade ? 0.24 : 1;
    mesh.material.depthWrite = !shouldFade;
    mesh.material.needsUpdate = true;
  });
}

function getAimDirection() {
  const aimYaw = player.rotation.y;
  return new THREE.Vector3(
    -Math.sin(aimYaw) * Math.cos(pitch),
    Math.sin(pitch),
    -Math.cos(aimYaw) * Math.cos(pitch),
  ).normalize();
}

function updatePlayer(dt) {
  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)).multiplyScalar(-input.y);
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)).multiplyScalar(input.x);
  const move = forward.add(right);

  if (move.lengthSq() > 0) {
    move.normalize().multiplyScalar(9 * dt);
    const nextX = player.position.x + move.x;
    const nextZ = player.position.z + move.z;
    if (!playerCollisionAt(nextX, player.position.z)) player.position.x = nextX;
    if (!playerCollisionAt(player.position.x, nextZ)) player.position.z = nextZ;
  }

  player.rotation.y = yaw;

  velocityY -= 24 * dt;
  player.position.y += velocityY * dt;
  if (player.position.y < 0) {
    player.position.y = 0;
    velocityY = 0;
  }
  clampPlayer();

  const ideal = new THREE.Vector3(2.8, 5.8, 12.6).applyAxisAngle(yAxis, yaw).add(player.position);
  camera.position.lerp(ideal, 1 - Math.exp(-10 * dt));

  const target = player.position.clone().add(new THREE.Vector3(0, 1.7, 0)).add(getAimDirection().multiplyScalar(12));
  camera.lookAt(target);
  updateBuildingOcclusion();
}

function shoot() {
  if (!started || finished || fireCooldown > 0) return;
  fireCooldown = 0.16;

  const direction = getAimDirection();
  const origin = new THREE.Vector3();
  if (weaponMuzzle) {
    weaponMuzzle.getWorldPosition(origin);
  } else {
    player.getWorldPosition(origin);
    origin.y += 1.58;
  }
  origin.add(direction.clone().multiplyScalar(0.12));

  const bullet = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xffda66, emissive: 0xffb300, emissiveIntensity: 2.5, roughness: 0.2, flatShading: true }),
  );
  bullet.position.copy(origin);
  bullet.castShadow = true;
  scene.add(bullet);

  bullets.push({
    mesh: bullet,
    velocity: direction.multiplyScalar(42),
    life: 1.4,
  });

  const flash = new THREE.PointLight(0xffd46b, 7, 12);
  flash.position.copy(origin);
  scene.add(flash);
  setTimeout(() => scene.remove(flash), 45);

  enemyCountText.textContent = String(enemies.length).padStart(2, '0');
}

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    const bullet = bullets[i];
    bullet.life -= dt;
    bullet.mesh.position.addScaledVector(bullet.velocity, dt);

    if (bullet.life <= 0) {
      scene.remove(bullet.mesh);
      bullets.splice(i, 1);
      continue;
    }

    for (let j = enemies.length - 1; j >= 0; j -= 1) {
      const alien = enemies[j];
      if (alien.userData.dying) continue;

      if (bullet.mesh.position.distanceTo(alien.position) < 1.15) {
        alien.userData.hp -= 1;
        hitMarker.style.opacity = 1;
        setTimeout(() => {
          hitMarker.style.opacity = 0;
        }, 70);

        if (alien.userData.hp <= 0) {
          alien.userData.dying = true;
          alien.userData.fallTimer = 0;
          alien.userData.wobbleDir = Math.random() < 0.5 ? -1 : 1;
          alien.userData.spin = (Math.random() - 0.5) * 1.3;
          pendingEnemyFinish = { alien, removeAt: elapsed + 0.95 };
        }

        scene.remove(bullet.mesh);
        bullets.splice(i, 1);
        break;
      }
    }
  }
}

function updateEnemies(dt) {
  for (const alien of enemies) {
    if (alien.userData.dying) {
      alien.userData.fallTimer += dt;
      alien.rotation.z += alien.userData.spin * dt;
      alien.rotation.x = THREE.MathUtils.lerp(alien.rotation.x, Math.PI * 0.72, 0.12);
      alien.position.y = Math.max(0, alien.position.y - dt * 1.6);
      alien.position.x += Math.sin(elapsed * 9 + alien.userData.bob) * dt * 0.08 * alien.userData.wobbleDir;
      continue;
    }

    const flat = player.position.clone().sub(alien.position);
    flat.y = 0;
    const dist = flat.length();
    alien.lookAt(player.position.x, alien.position.y, player.position.z);
    alien.rotation.x = 0;
    alien.rotation.z = 0;

    if (dist > 3.2) {
      alien.position.add(flat.normalize().multiplyScalar(alien.userData.speed * dt));
    } else {
      alien.userData.cool -= dt;
      if (alien.userData.cool < 0) {
        alien.userData.cool = 0.9;
        hp = Math.max(0, hp - 7);
        hpText.textContent = String(hp);
        hpBar.style.width = `${hp}%`;
        hpBar.style.background = hp < 35 ? '#ef514b' : '#42e770';
      }
    }

    alien.position.y = Math.sin(elapsed * 4 + alien.userData.bob) * 0.12;
  }

  if (pendingEnemyFinish && elapsed >= pendingEnemyFinish.removeAt) {
    const alien = pendingEnemyFinish.alien;
    const index = enemies.indexOf(alien);
    if (index !== -1) {
      scene.remove(alien);
      enemies.splice(index, 1);
    }
    pendingEnemyFinish = null;
  }
}

function finish(win) {
  finished = true;
  resultScreen.classList.remove('hidden');
  resultEyebrow.textContent = win ? 'MISSION COMPLETE' : 'MISSION FAILED';
  resultTitle.textContent = win ? '東京を守り抜いた' : '防衛線が突破された';
  resultCopy.textContent = win
    ? '敵性宇宙人の撃退に成功。次の防衛区域に備えよ。'
    : 'アーマーが尽きた。装備を整えて再出動せよ。';
}

function loop() {
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;

  if (started && !finished) {
    fireCooldown -= dt;
    updatePlayer(dt);
    updateBullets(dt);
    updateEnemies(dt);
    if (input.firing) shoot();
    if (enemies.length === 0) finish(true);
    if (hp <= 0) finish(false);
  }

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false);
}

function populateSettings() {
  const selectMap = {
    weaponShape: weaponShapeSelect,
    weaponColor: weaponColorSelect,
    bodyColor: bodyColorSelect,
    skinColor: skinColorSelect,
    hairStyle: hairStyleSelect,
    eyeStyle: eyeStyleSelect,
    mouthStyle: mouthStyleSelect,
  };

  Object.entries(OPTIONS).forEach(([key, options]) => {
    fillSelect(selectMap[key], options);
  });
}

let moveTouch = null;
let lookTouch = null;
let lookPoint = null;

const moveZone = document.querySelector('#move-zone');
const stick = document.querySelector('#stick');

function moveFromTouch(t) {
  const r = moveZone.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  let dx = t.clientX - cx;
  let dy = t.clientY - cy;
  const len = Math.hypot(dx, dy);
  const max = 42;
  if (len > max) {
    dx *= max / len;
    dy *= max / len;
  }
  stick.style.transform = `translate(${dx}px,${dy}px)`;
  input.x = dx / max;
  input.y = dy / max;
}

function wireUI() {
  startButton.addEventListener('click', startGame);
  openSettingsButton.addEventListener('click', showSettingsScreen);
  backFromSettingsButton.addEventListener('click', showStartScreen);
  applySettingsButton.addEventListener('click', () => {
    applyConfig(readConfigFromUI());
    startGame();
  });

  [
    weaponShapeSelect,
    weaponColorSelect,
    bodyColorSelect,
    skinColorSelect,
    hairStyleSelect,
    eyeStyleSelect,
    mouthStyleSelect,
  ].forEach((select) => {
    select.addEventListener('change', () => applyConfig(readConfigFromUI()));
  });

  moveZone.addEventListener('pointerdown', (e) => {
    moveTouch = e.pointerId;
    moveZone.setPointerCapture(e.pointerId);
    moveFromTouch(e);
  });
  moveZone.addEventListener('pointermove', (e) => {
    if (e.pointerId === moveTouch) moveFromTouch(e);
  });
  moveZone.addEventListener('pointerup', (e) => {
    if (e.pointerId === moveTouch) {
      moveTouch = null;
      input.x = 0;
      input.y = 0;
      stick.style.transform = '';
    }
  });

  canvas.addEventListener('pointerdown', (e) => {
    if (e.clientX > innerWidth * 0.36) {
      lookTouch = e.pointerId;
      lookPoint = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerId === lookTouch) {
      yaw -= (e.clientX - lookPoint.x) * 0.008;
      pitch = THREE.MathUtils.clamp(pitch - (e.clientY - lookPoint.y) * 0.006, -0.62, 0.26);
      lookPoint = { x: e.clientX, y: e.clientY };
    }
  });
  canvas.addEventListener('pointerup', (e) => {
    if (e.pointerId === lookTouch) lookTouch = null;
  });

  const attack = document.querySelector('#attack');
  attack.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
  attack.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    input.firing = true;
    shoot();
  });
  ['pointerup', 'pointercancel'].forEach((type) => {
    attack.addEventListener(type, () => {
      input.firing = false;
    });
  });

  document.querySelector('#jump').addEventListener('pointerdown', () => {
    if (player.position.y < 0.03) velocityY = 10;
  });

  document.querySelector('#restart').onclick = () => location.reload();

  addEventListener('keydown', (e) => {
    if (e.code === 'Space' && player.position.y < 0.03) velocityY = 10;
    if (e.code === 'KeyF') shoot();
    input.y = (e.code === 'KeyW' || e.code === 'ArrowUp') ? -1 : (e.code === 'KeyS' || e.code === 'ArrowDown') ? 1 : input.y;
    input.x = (e.code === 'KeyA' || e.code === 'ArrowLeft') ? -1 : (e.code === 'KeyD' || e.code === 'ArrowRight') ? 1 : input.x;
  });
  addEventListener('keyup', (e) => {
    if (['KeyW', 'KeyS', 'ArrowUp', 'ArrowDown'].includes(e.code)) input.y = 0;
    if (['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight'].includes(e.code)) input.x = 0;
  });

  addEventListener('resize', resize);
}

function initGame() {
  populateSettings();
  syncUIFromConfig();
  createPlayer();
  makeCity();
  updateAppearance();
  buildWeapon(config.weaponShape);
  wireUI();
  showStartScreen();
  resize();
  loop();
  objectiveText.textContent = '東京を防衛せよ';
}

initGame();
