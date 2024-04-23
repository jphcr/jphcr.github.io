import * as THREE from "https://threejs.org/build/three.module.js";
import Stats from "https://threejs.org/examples/jsm/libs/stats.module.js";
import { player } from "./player.js";
import { world } from "./world.js";

class GAME {

    constructor() {
        this._Init();


    }

    _Init() {
        // See fps 
        this._InitStats();

        // renderer
        this.webGLRenderer = new THREE.WebGLRenderer({ antialias: true });
        this.webGLRenderer.shadowMapEnabled = true;
        this.webGLRenderer.setSize(window.innerWidth, window.innerHeight);
        this.webGLRenderer.setPixelRatio(window.devicePixelRatio);

        document.getElementById("WebGL-output").appendChild(this.webGLRenderer.domElement);

        // resize
        window.addEventListener('resize', () => {
            this.OnWindowResize_();
        }, false);

        // camera
        const fov = 60;
        const aspect = window.innerWidth / window.innerHeight;
        const near = 1.0;
        const far = 10000.0;

        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.camera.position.set(-5, 5, 10);
        this.camera.lookAt(8, 3, 0);

        // scene
        this.scene = new THREE.Scene();
        const textureLoader = new THREE.TextureLoader();
        const backgroundTexture = textureLoader.load("assets/textures/sky.jpg");
        this.scene.background = backgroundTexture;

        // Directional Light
        let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
        light.position.set(60, 100, 10);
        light.castShadow = true;
        this.scene.add(light);

        // ground
        const groundGeometry = new THREE.PlaneGeometry(20000, 20000, 10, 10);

        
        const groundTexture = textureLoader.load("assets/textures/ground.jpg");
        // Repeat the texture
        groundTexture.wrapS = THREE.RepeatWrapping;
        groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(1000, 1000);

        const groundMaterial = new THREE.MeshStandardMaterial({map: groundTexture});
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // add player
        this.player = new player.PLAYER({scene: this.scene});
        this.world = new world.WORLD({scene: this.scene});

        this._Render(performance.now());
        this.OnWindowResize_();
    }

    _InitStats() {
        this.stats = new Stats();
        this.stats.setMode(0); // 0: fps, 1: ms

        // Align top-left
        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.left = '0px';
        this.stats.domElement.style.top = '0px';

        document.getElementById("Stats-output").appendChild(this.stats.domElement);

        return this.stats;
    }

    OnWindowResize_() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.webGLRenderer.setSize(window.innerWidth, window.innerHeight);
    }

    _Render(time) {
        if (!this.previousTime) {
            this.previousTime = time;
        }

        this.stats.update();
        const timeElapsed = (time - this.previousTime) / 1000.0;

        this._Step(timeElapsed);

        this.webGLRenderer.render(this.scene, this.camera);
        this.previousTime = time;
        requestAnimationFrame((t) => this._Render(t));
    }

    _Step(timeElapsed) {
        this.player._Update(timeElapsed);
        this.world._Update(timeElapsed);
    }

}

let _Game = null;
window.addEventListener('DOMContentLoaded', () => {
    _Game = new GAME();
});