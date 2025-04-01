import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

const manager = new THREE.LoadingManager();
let camera, scene, renderer, stats, object, loader;
let mixer, currentAction;
const clock = new THREE.Clock();

const params = {
    animation: 'Praying'
};

const animations = {};
const availableAnimations = [
    'Praying',
    'Walking',
    'Running',
    'Jumping',
    'Waving',
    'Dancing'
];

init();

function init() {
    const container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(100, 200, 300);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);
    scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 5);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 5);
    dirLight.position.set(0, 200, 100);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add(grid);

    loader = new FBXLoader(manager);
    availableAnimations.forEach(anim => loadAnimation(anim));

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 100, 0);
    controls.update();

    window.addEventListener('resize', onWindowResize);

    stats = new Stats();
    container.appendChild(stats.dom);

    const gui = new GUI();
    gui.add(params, 'animation', availableAnimations).onChange(playAnimation);
}

function loadAnimation(anim) {
    loader.load(`models/fbx/${anim}.fbx`, function (group) {
        if (!object) {
            object = group;
            scene.add(object);
            mixer = new THREE.AnimationMixer(object);
        }
        if (group.animations.length > 0) {
            animations[anim] = group.animations[0];
        }
        if (anim === params.animation) {
            playAnimation(anim);
        }
    });
}

function playAnimation(anim) {
    if (mixer && animations[anim]) {
        if (currentAction) {
            currentAction.fadeOut(0.3);
        }
        
        const action = mixer.clipAction(animations[anim]);
        action.reset();
        action.setEffectiveWeight(1.0);
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.fadeIn(0.3);
        action.play();
        
        currentAction = action;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    renderer.render(scene, camera);
    stats.update();
}
