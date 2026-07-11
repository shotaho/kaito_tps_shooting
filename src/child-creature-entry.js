import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const capturedEnemies = [];
const originalSceneAdd = THREE.Scene.prototype.add;

THREE.Scene.prototype.add = function patchedSceneAdd(...objects) {
  for (const object of objects) {
    if (object?.isGroup && typeof object.userData?.hp === 'number') {
      capturedEnemies.push(object);
    }
  }
  return originalSceneAdd.apply(this, objects);
};

function standardMaterial(color, roughness = 0.9) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0,
    flatShading: true,
  });
}

function addMesh(parent, geometry, material, position, rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function createEye(parent, x, tilt) {
  const white = standardMaterial(0xf3eee0, 0.75);
  const black = standardMaterial(0x19140f, 0.9);

  const eye = new THREE.Group();
  eye.position.set(x, 1.55, 1.02);
  eye.rotation.z = tilt;
  parent.add(eye);

  addMesh(eye, new THREE.BoxGeometry(0.58, 0.32, 0.08), white, [0, 0, 0]);
  addMesh(eye, new THREE.BoxGeometry(0.34, 0.08, 0.11), black, [0.02, 0.02, 0.02], [0, 0, tilt > 0 ? -0.38 : 0.38]);
  addMesh(eye, new THREE.BoxGeometry(0.08, 0.22, 0.11), black, [tilt > 0 ? 0.12 : -0.12, -0.02, 0.02], [0, 0, tilt > 0 ? 0.18 : -0.18]);
}

function buildChildDrawnCreature(enemy) {
  enemy.clear();
  enemy.name = 'child-drawn-striped-creature';

  const orange = standardMaterial(0xd99124, 0.95);
  const cream = standardMaterial(0xf2e8cf, 0.95);
  const brown = standardMaterial(0x3a2417, 0.95);
  const red = standardMaterial(0xa63c2f, 0.95);
  const charcoal = standardMaterial(0x29241f, 1);

  const body = addMesh(
    enemy,
    new THREE.SphereGeometry(1.2, 18, 12),
    orange,
    [0, 1.42, 0],
    [0, 0, 0],
    [1, 0.92, 0.9],
  );
  body.name = 'orange-body';

  // Child-drawn vertical stripes, kept as simple geometry so no external asset loader is required.
  addMesh(enemy, new THREE.BoxGeometry(0.34, 1.95, 0.12), brown, [-0.18, 1.45, 1.02], [0, 0, -0.03]);
  addMesh(enemy, new THREE.BoxGeometry(0.26, 1.8, 0.13), cream, [0.18, 1.44, 1.03], [0, 0, 0.03]);
  addMesh(enemy, new THREE.BoxGeometry(0.25, 1.72, 0.14), red, [0.46, 1.43, 0.96], [0, 0, -0.05]);

  // Repeat the strongest stripe on the back so the pattern remains readable while the enemy turns.
  addMesh(enemy, new THREE.BoxGeometry(0.32, 1.9, 0.11), brown, [-0.18, 1.45, -1.02], [0, Math.PI, 0.03]);
  addMesh(enemy, new THREE.BoxGeometry(0.23, 1.7, 0.12), red, [0.46, 1.43, -0.96], [0, Math.PI, 0.05]);

  createEye(enemy, -0.56, -0.16);
  createEye(enemy, 0.48, 0.16);

  const legGeometry = new THREE.CylinderGeometry(0.105, 0.14, 0.82, 7);
  const legPositions = [
    [-0.83, 0.42, 0.52, -0.35, 0, 0.22],
    [0.83, 0.42, 0.52, -0.35, 0, -0.22],
    [-0.92, 0.4, -0.18, 0.2, 0, 0.3],
    [0.92, 0.4, -0.18, 0.2, 0, -0.3],
    [-0.55, 0.38, -0.66, 0.42, 0, 0.18],
    [0.55, 0.38, -0.66, 0.42, 0, -0.18],
  ];
  legPositions.forEach(([x, y, z, rx, ry, rz]) => {
    addMesh(enemy, legGeometry, charcoal, [x, y, z], [rx, ry, rz]);
  });

  const antennaGeometry = new THREE.CylinderGeometry(0.045, 0.06, 0.55, 6);
  addMesh(enemy, antennaGeometry, charcoal, [-0.35, 2.62, 0.04], [0, 0, -0.28]);
  addMesh(enemy, antennaGeometry, charcoal, [0.38, 2.6, 0], [0, 0, 0.32]);
  addMesh(enemy, new THREE.SphereGeometry(0.08, 8, 6), charcoal, [-0.43, 2.88, 0.04]);
  addMesh(enemy, new THREE.SphereGeometry(0.08, 8, 6), charcoal, [0.47, 2.86, 0]);

  enemy.scale.setScalar(1.05);
  enemy.userData.childCreature = true;
}

await import('./game.js');
THREE.Scene.prototype.add = originalSceneAdd;
capturedEnemies.forEach(buildChildDrawnCreature);
