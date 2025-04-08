import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

const manager = new THREE.LoadingManager();
let camera, scene, renderer, stats, loader;
let mixer, currentAction, object;
const clock = new THREE.Clock();

const params = {
    animation: 'Dancing' // 🔧 Corregido nombre
};

const animations = {};
const availableAnimations = [
    'Dancing',
    'Punching',
    'Punching Bag',
    'Dying',
    'Jumping'
];

init();

function init() {
    const container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(100, 200, 300);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 5);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 5);
    dirLight.position.set(0, 200, 100);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2000, 2000),
        new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add(grid);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 100, 0);
    controls.update();

    stats = new Stats();
    container.appendChild(stats.dom);

    const gui = new GUI();
    gui.add(params, 'animation', availableAnimations).onChange(playAnimation);

    window.addEventListener('resize', onWindowResize);

    loader = new FBXLoader(manager);

    // 🔽 Primero cargamos el personaje principal
    loader.load('../models/fbx/Capoeira.fbx', function (group) {
        object = group;
        object.name = 'mona';
        object.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        scene.add(object);
        mixer = new THREE.AnimationMixer(object);

        if (group.animations.length > 0) {
            animations['Capoeira'] = group.animations[0];
            playAnimation('Capoeira');
        }

        // 🔽 Cargar las demás animaciones después de mona
        availableAnimations.forEach(anim => {
            if (anim !== 'Capoeira') loadAnimation(anim);
        });
    });
}

function loadAnimation(name) {
    loader.load(`../models/fbx/${name}.fbx`, function (animGroup) {
        if (animGroup.animations && animGroup.animations.length > 0) {
            animations[name] = animGroup.animations[0];
        } else {
            console.warn(`⚠️ No animation found in ${name}.fbx`);
        }
    });
}

function playAnimation(name) {
    if (!mixer || !animations[name]) return;

    if (currentAction) currentAction.fadeOut(0.3);

    const clip = animations[name];
    const action = mixer.clipAction(clip);
    action.reset();
    action.setEffectiveWeight(1.0);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.fadeIn(0.3);
    action.play();

    currentAction = action;
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

    const mona = scene.getObjectByName('mona');
}
