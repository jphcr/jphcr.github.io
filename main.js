import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';
import Stats from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/libs/stats.module.js'
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.122/examples/jsm/loaders/GLTFLoader.js';
import {player} from './player.js';
import {world} from './world.js';
import {background} from './background.js';



const _VS = `
varying vec3 vWorldPosition;
void main() {
  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;


  const _FS = `
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform float exponent;
varying vec3 vWorldPosition;
void main() {
  float h = normalize( vWorldPosition + offset ).y;
  gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
}`;


const _PCSS = `
#define LIGHT_WORLD_SIZE 0.05
#define LIGHT_FRUSTUM_WIDTH 3.75
#define LIGHT_SIZE_UV (LIGHT_WORLD_SIZE / LIGHT_FRUSTUM_WIDTH)
#define NEAR_PLANE 1.0

#define NUM_SAMPLES 17
#define NUM_RINGS 11
#define BLOCKER_SEARCH_NUM_SAMPLES NUM_SAMPLES
#define PCF_NUM_SAMPLES NUM_SAMPLES

vec2 poissonDisk[NUM_SAMPLES];

void initPoissonSamples( const in vec2 randomSeed ) {
  float ANGLE_STEP = PI2 * float( NUM_RINGS ) / float( NUM_SAMPLES );
  float INV_NUM_SAMPLES = 1.0 / float( NUM_SAMPLES );

  // jsfiddle that shows sample pattern: https://jsfiddle.net/a16ff1p7/
  float angle = rand( randomSeed ) * PI2;
  float radius = INV_NUM_SAMPLES;
  float radiusStep = radius;

  for( int i = 0; i < NUM_SAMPLES; i ++ ) {
    poissonDisk[i] = vec2( cos( angle ), sin( angle ) ) * pow( radius, 0.75 );
    radius += radiusStep;
    angle += ANGLE_STEP;
  }
}

float penumbraSize( const in float zReceiver, const in float zBlocker ) { // Parallel plane estimation
  return (zReceiver - zBlocker) / zBlocker;
}

float findBlocker( sampler2D shadowMap, const in vec2 uv, const in float zReceiver ) {
  // This uses similar triangles to compute what
  // area of the shadow map we should search
  float searchRadius = LIGHT_SIZE_UV * ( zReceiver - NEAR_PLANE ) / zReceiver;
  float blockerDepthSum = 0.0;
  int numBlockers = 0;

  for( int i = 0; i < BLOCKER_SEARCH_NUM_SAMPLES; i++ ) {
    float shadowMapDepth = unpackRGBAToDepth(texture2D(shadowMap, uv + poissonDisk[i] * searchRadius));
    if ( shadowMapDepth < zReceiver ) {
      blockerDepthSum += shadowMapDepth;
      numBlockers ++;
    }
  }

  if( numBlockers == 0 ) return -1.0;

  return blockerDepthSum / float( numBlockers );
}

float PCF_Filter(sampler2D shadowMap, vec2 uv, float zReceiver, float filterRadius ) {
  float sum = 0.0;
  for( int i = 0; i < PCF_NUM_SAMPLES; i ++ ) {
    float depth = unpackRGBAToDepth( texture2D( shadowMap, uv + poissonDisk[ i ] * filterRadius ) );
    if( zReceiver <= depth ) sum += 1.0;
  }
  for( int i = 0; i < PCF_NUM_SAMPLES; i ++ ) {
    float depth = unpackRGBAToDepth( texture2D( shadowMap, uv + -poissonDisk[ i ].yx * filterRadius ) );
    if( zReceiver <= depth ) sum += 1.0;
  }
  return sum / ( 2.0 * float( PCF_NUM_SAMPLES ) );
}

float PCSS ( sampler2D shadowMap, vec4 coords ) {
  vec2 uv = coords.xy;
  float zReceiver = coords.z; // Assumed to be eye-space z in this code

  initPoissonSamples( uv );
  // STEP 1: blocker search
  float avgBlockerDepth = findBlocker( shadowMap, uv, zReceiver );

  //There are no occluders so early out (this saves filtering)
  if( avgBlockerDepth == -1.0 ) return 1.0;

  // STEP 2: penumbra size
  float penumbraRatio = penumbraSize( zReceiver, avgBlockerDepth );
  float filterRadius = penumbraRatio * LIGHT_SIZE_UV * NEAR_PLANE / zReceiver;

  // STEP 3: filtering
  //return avgBlockerDepth;
  return PCF_Filter( shadowMap, uv, zReceiver, filterRadius );
}
`;

const _PCSSGetShadow = `
return PCSS( shadowMap, shadowCoord );
`;


class BasicWorldDemo {
  constructor() {
    this._Initialize();

    this._gameStarted = false;
    document.getElementById('game-menu').onclick = (msg) => this._OnStart(msg);
    
  }

  _OnStart(msg) {
    document.getElementById('game-menu').style.display = 'none';
    this._gameStarted = true;
  }

  _Initialize() {

    this._InitStats();

    // overwrite shadowmap code
    let shadowCode = THREE.ShaderChunk.shadowmap_pars_fragment;

    shadowCode = shadowCode.replace(
        '#ifdef USE_SHADOWMAP',
        '#ifdef USE_SHADOWMAP' +
        _PCSS
    );

    shadowCode = shadowCode.replace(
        '#if defined( SHADOWMAP_TYPE_PCF )',
        _PCSSGetShadow +
        '#if defined( SHADOWMAP_TYPE_PCF )'
    );

    THREE.ShaderChunk.shadowmap_pars_fragment = shadowCode;
    // renderer

    this.threejs_ = new THREE.WebGLRenderer({
      antialias: true,
    });
    this.threejs_.outputEncoding = THREE.sRGBEncoding;
    this.threejs_.gammaFactor = 2.2;
    // this.threejs_.toneMapping = THREE.ReinhardToneMapping;
    this.threejs_.shadowMap.enabled = true;
    // this.threejs_.shadowMap.type = THREE.PCFSoftShadowMap;
    this.threejs_.setPixelRatio(window.devicePixelRatio);
    this.threejs_.setSize(window.innerWidth, window.innerHeight);

    document.getElementById('container').appendChild(this.threejs_.domElement);

    window.addEventListener('resize', () => {
      this.OnWindowResize_();
    }, false);

    window.addEventListener('keydown', (e) => {
      this.OnKeyDown_(e);
    }, false ); 

    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 1.0;
    const far = 20000.0;
    this.camera1 = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera2 = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera1.position.set(-5, 5, 11);
    this.camera1.lookAt(8, 3, 0);
    this.activeCamera = this.camera1;
    this.camera2.position.set(8, 3, 15);
    this.camera2.lookAt(8, 3, 0);

    this.scene_ = new THREE.Scene();

    let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    light.position.set(60, 100, 10);
    light.target.position.set(40, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    light.shadow.camera.far = 200.0;
    light.shadow.camera.near = 1.0;
    light.shadow.camera.left = 50;
    light.shadow.camera.right = -50;
    light.shadow.camera.top = 50;
    light.shadow.camera.bottom = -50;
    this.scene_.add(light);

    light = new THREE.HemisphereLight(0x202020, 0x004080, 0.6);
    this.scene_.add(light);

    this.scene_.background = new THREE.Color(0x808080);
    this.scene_.fog = new THREE.FogExp2(0x89b2eb, 0.003);

    const loader = new GLTFLoader();
    loader.load(
      'assets/Environment/glTF/Street_Straight.gltf',
      function (gltf) {
        gltf.scene.traverse(function (child) {
          if (child.isMesh) {
            child.receiveShadow = true;
          }
        });
        gltf.scene.position.set(-5,0,-5);
        gltf.scene.rotation.y = -Math.PI / 2;
        gltf.scene.scale.set(2.5, 2, 1000);

        this.scene_.add(gltf.scene);
      }.bind(this),
      undefined,
      function (error) {
        console.error(error);
      }
    );

    // const road = new THREE.Mesh(
    //   new THREE.PlaneGeometry(20000, 30, 10, 10),
    //   new THREE.MeshStandardMaterial({
    //     map: roadTexture,
    //   })
    // );
    // road.receiveShadow = true;
    // road.rotation.x = -Math.PI / 2;
    // road.position.set(-5,0,-7);
    // this.scene_.add(road);

    const grass = new THREE.Mesh(
        new THREE.PlaneGeometry(20000, 1000, 10, 10),
        new THREE.MeshStandardMaterial({
            color: 0x001200,
          }));
    grass.receiveShadow = true;
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(0, 0, 505);
    this.scene_.add(grass); 

    const grass1 = new THREE.Mesh(
      new THREE.PlaneGeometry(20000, 2000, 10, 10),
      new THREE.MeshStandardMaterial({
          color: 0x001200,
        }));
    grass1.receiveShadow = true;
    grass1.rotation.x = -Math.PI / 2;
    grass1.position.set(0, 0, -1015);
    this.scene_.add(grass1);

    const uniforms = {
      topColor: { value: new THREE.Color(0x0077FF) },
      bottomColor: { value: new THREE.Color(0x89b2eb) },
      offset: { value: 33 },
      exponent: { value: 0.6 }
    };
    const skyGeo = new THREE.SphereBufferGeometry(1000, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: _VS,
        fragmentShader: _FS,
        side: THREE.BackSide,
    });
    this.scene_.add(new THREE.Mesh(skyGeo, skyMat));

    this.world_ = new world.WorldManager({scene: this.scene_});
    this.player_ = new player.Player({scene: this.scene_, world: this.world_});
    this.background_ = new background.Background({scene: this.scene_});

    this.gameOver_ = false;
    this.previousRAF_ = null;
    this.RAF_();
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

  OnKeyDown_(e) {
    switch (e.key) {
      case 'c':
        this.SwitchCamera();
        break;
    }
  }

  SwitchCamera() {
    if (this.activeCamera === this.camera1) {
      this.activeCamera = this.camera2;
    } else {
      this.activeCamera = this.camera1;
    }
  }

  OnWindowResize_() {
    this.activeCamera.aspect = window.innerWidth / window.innerHeight;
    this.activeCamera.updateProjectionMatrix();
    this.threejs_.setSize(window.innerWidth, window.innerHeight);
  }

  RAF_() {
    requestAnimationFrame((t) => {
      if (this.previousRAF_ === null) {
        this.previousRAF_ = t;
      }

      this.RAF_();

      this.Step_((t - this.previousRAF_) / 1000.0);
      this.threejs_.render(this.scene_, this.activeCamera);
      this.previousRAF_ = t;
    });
  }

  Step_(timeElapsed) {
    if (this.gameOver_ || !this._gameStarted) {
      return;
    }

    this.stats.update();
    this.player_.Update(timeElapsed);
    this.world_.Update(timeElapsed);
    this.background_.Update(timeElapsed);

    if (this.player_.gameOver && !this.gameOver_) {
      this.gameOver_ = true;
      const score = this.world_.GetScore();
      document.getElementById('final-score').innerText = "Score: " + score.toFixed(0);
      document.getElementById('game-over').classList.toggle('active');

    }
  }
}


let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new BasicWorldDemo();
});
