import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const data = [
  [
    [0.0, 0.1, null, 0.3],
    [0.1, 0.2, 0.3, 0.4],
    [null, 0.3, 0.4, 0.5],
  ],
  [
    [0.5, null, 0.7, 0.8],
    [0.6, 0.7, null, 0.9],
    [0.7, 0.8, 0.9, null],
 ]
];

function initScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 5;
    camera.position.y = 4;
    camera.position.x = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const container = document.getElementById('container');
    if (container) {
        container.appendChild(renderer.domElement);
    } else {
        console.error("Container element not found!");
        return null;
    }
    return { scene, camera, renderer };
}

function addLighting(scene) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight1.position.set(1, 1.5, 1).normalize();
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight2.position.set(-1, -0.5, -1).normalize();
    scene.add(directionalLight2);
}

function loadEnvironmentMap() {
    const loader = new THREE.CubeTextureLoader();
    const texture = loader
        .setPath('https://threejs.org/examples/textures/cube/pisa/')
        .load([
            'px.png', 'nx.png',
            'py.png', 'ny.png',
            'pz.png', 'nz.png'
        ]);
    return texture;
}

function createStructureFromData(scene, data, environmentMap) {
    if (!data || data.length === 0 || data[0].length === 0 || data[0][0].length === 0) {
        console.error("Invalid data array");
        return null;
    }

    const sizeZ = data.length;
    const sizeY = data[0].length;
    const sizeX = data[0][0].length;

    let instanceCount = 0;
    for (let z = 0; z < sizeZ; z++) {
        for (let y = 0; y < sizeY; y++) {
            for (let x = 0; x < sizeX; x++) {
                if (data[z][y][x] !== null) {
                    instanceCount++;
                }
            }
        }
    }

    if (instanceCount === 0) {
        console.log("Data contains no non-null values. Nothing to render.");
        return null;
    }

    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const glassTintMaterial = new THREE.MeshStandardMaterial({
        envMap: environmentMap,
        roughness: 0.1,
        metalness: 0.1,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
    });

    const instancedMesh = new THREE.InstancedMesh(cubeGeometry, glassTintMaterial, instanceCount);

    const colorGreen = new THREE.Color(0x00ff00);
    const colorAmber = new THREE.Color(0xffbf00);
    const colorRed = new THREE.Color(0xff0000);
    const instanceColor = new THREE.Color();
    const matrix = new THREE.Matrix4();
    const spacing = 1.0;
    const offsetX = -(sizeX - 1) * spacing / 2;
    const offsetY = -(sizeY - 1) * spacing / 2;
    const offsetZ = -(sizeZ - 1) * spacing / 2;

    let instanceIndex = 0;
    for (let z = 0; z < sizeZ; z++) {
        for (let y = 0; y < sizeY; y++) {
            for (let x = 0; x < sizeX; x++) {
                const value = data[z][y][x];

                if (value !== null) {
                    if (value < 0.5) {
                      const t = Math.max(0, Math.min(1, value / 0.5));
                      instanceColor.lerpColors(colorGreen, colorAmber, t);
                    } else {
                      const t = Math.max(0, Math.min(1, (value - 0.5) / 0.5));
                      instanceColor.lerpColors(colorAmber, colorRed, t);
                    }

                    const posX = offsetX + x * spacing;
                    const posY = offsetY + y * spacing;
                    const posZ = offsetZ + z * spacing;
                    matrix.setPosition(posX, posY, posZ);

                    instancedMesh.setMatrixAt(instanceIndex, matrix);
                    instancedMesh.setColorAt(instanceIndex, instanceColor);

                    instanceIndex++;
                }
            }
        }
    }

    if (instancedMesh.instanceColor) {
        instancedMesh.instanceColor.needsUpdate = true;
    }

    scene.add(instancedMesh);
    console.log(`Created structure with ${instanceCount} non-null cubes.`);
    return instancedMesh;
}


function setupControls(camera, domElement) {
    const controls = new OrbitControls(camera, domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);
    return controls;
}

function handleWindowResize(camera, renderer) {
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function animate(scene, camera, renderer, controls, structure) {
    requestAnimationFrame(() => animate(scene, camera, renderer, controls, structure));
    controls.update();
    renderer.render(scene, camera);
}

THREE.ColorManagement.enabled = true;

const { scene, camera, renderer } = initScene();

if (scene && camera && renderer) {
    addLighting(scene);

    const environmentMap = loadEnvironmentMap();

    const structure = createStructureFromData(scene, data, environmentMap);

    const controls = setupControls(camera, renderer.domElement);
    handleWindowResize(camera, renderer);

    animate(scene, camera, renderer, controls, structure);
}