import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.122/build/three.module.js';

import {math} from './math.js';

import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.122/examples/jsm/loaders/GLTFLoader.js';
import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/FBXLoader.js';


export const background = (() => {

  const ROAD_WIDTH = 4;
  const OFFSET = 0.5;

  class BackgroundCloud {
    constructor(params) {
      this.params_ = params;
      this.position_ = new THREE.Vector3();
      this.quaternion_ = new THREE.Quaternion();
      this.scale_ = 1.0;
      this.mesh_ = null;

      this.LoadModel_();
    }

    LoadModel_() {
      const loader = new GLTFLoader();
      loader.setPath('./assets/Clouds/GLTF/');
      loader.load('Cloud' + math.rand_int(1, 3) + '.glb', (glb) => {
        this.mesh_ = glb.scene;
        this.params_.scene.add(this.mesh_);

        this.position_.x = math.rand_range(0, 2000);
        this.position_.y = math.rand_range(100, 200);
        this.position_.z = math.rand_range(500, -1000);
        this.scale_ = math.rand_range(10, 20);

        const q = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0), math.rand_range(0, 360));
        this.quaternion_.copy(q);

        this.mesh_.traverse(c => {
          if (c.geometry) {
            c.geometry.computeBoundingBox();
          }

          let materials = c.material;
          if (!(c.material instanceof Array)) {
            materials = [c.material];
          }
  
          for (let m of materials) {
            if (m) {
              m.specular = new THREE.Color(0x000000);
              m.emissive = new THREE.Color(0xC0C0C0);
            }
          }    
          c.castShadow = true;
          c.receiveShadow = true;
        });
      });
    }

    Update(timeElapsed) {
      if (!this.mesh_) {
        return;
      }

      this.position_.x -= timeElapsed * 10;
      if (this.position_.x < -100) {
        this.position_.x = math.rand_range(2000, 3000);
      }

      this.mesh_.position.copy(this.position_);
      this.mesh_.quaternion.copy(this.quaternion_);
      this.mesh_.scale.setScalar(this.scale_);
    }
  };

  class BackgroundBuilding {
    constructor(params, xPos) {
      this.params_ = params;
      this.position_ = new THREE.Vector3();
      this.quaternion_ = new THREE.Quaternion();
      this.scale_ = 1.0;
      this.position_.x = xPos;
      this.LoadModelFBX();
    }

    LoadModelFBX() {
      const assets = [
          ['1Story_GableRoof.fbx', 1],
          ['1Story_RoundRoof.fbx', 1],
          ['1Story_Sign.fbx', 1],
          ['1Story.fbx', 1],
          ['2Story.fbx', 1],
          ['2Story_2.fbx', 1],
          ['2Story_Balcony.fbx', 1],
          ['2Story_Center.fbx', 1],
          ['2Story_Sign.fbx', 1],
          ['3Story_Balcony.fbx', 1],
          ['3Story_Small.fbx', 1],
      ];
      const textures = [
          'Texture_Blue.png',
          'Texture_Green.png',
          'Texture_Red.png',
          'Texture_Yellow.png',
          'Texture_DarkBlue.png',
          'Texture_DarkPurple.png',
          'Texture_Dark.png',
          'Texture_Light.png',
          'Texture_Grey.png',
          'Texture_Signs.png',
          'Texture_Light2.png',
          'Texture_Casino.png',
      ];

      const [asset, scale] = assets[math.rand_int(0, assets.length - 1)];
      const textureName = textures[math.rand_int(0, textures.length - 1)];

      const texLoader = new THREE.TextureLoader();
      const texture = texLoader.load('./assets/Textured Models/Textures/' + textureName);
      texture.encoding = THREE.sRGBEncoding;

      const loader = new FBXLoader();
      loader.setPath('./assets/Textured Models/Finished Textured Buildings/FBX/');
      loader.load(asset, (obj) => {
        this.mesh_ = obj;

        this.position_.z = -43;
        this.scale_ = scale * 0.09;
        this.mesh_.scale.setScalar(this.scale_);
        this.params_.scene.add(this.mesh_);

        const q = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0), Math.PI * 2);
        this.quaternion_.copy(q);

        this.mesh_.traverse(c => {
          let materials = c.material;
          if (!(c.material instanceof Array)) {
            materials = [c.material];
          }
  
          for (let m of materials) {
            if (m) {
              if (texture) {
                m.map = texture;
              }
              m.specular = new THREE.Color(0x000000);
            }
          }    
          c.castShadow = true;
          c.receiveShadow = true;
        });
      });
    }

    Update(timeElapsed) {
      if (!this.mesh_) {
        return;
      }

      this.position_.x -= timeElapsed * 10;
      if (this.position_.x < -100) {
        this.position_.x = 300;
      }

      this.mesh_.position.copy(this.position_);
      this.mesh_.quaternion.copy(this.quaternion_);
      this.mesh_.scale.setScalar(this.scale_);
    }
  }

  class BackgroundCrops {
    constructor(params) {
      this.params_ = params;
      this.position_ = new THREE.Vector3();
      this.quaternion_ = new THREE.Quaternion();
      this.scale_ = 1.0;
      this.mesh_ = null;

      this.LoadModel_();
    }

    LoadModel_() {
      const assets = [
        ['Grass_1.fbx', 1],
        ['Grass_2.fbx', 1],
        ['Grass_3.fbx', 1],
        ['Grass_4.fbx', 1],
        ['Flower_1.fbx', 1],
        ['Flower_2.fbx', 1],
        ['Flower_3.fbx', 1],
        ['Flower_4.fbx', 1],
        ['Flowers_Crop.fbx', 1],
      ];
      const [asset, scale] = assets[math.rand_int(0, assets.length - 1)];
  
      const loader = new FBXLoader();
      loader.setPath('./assets/Crops/FBX/');
      loader.load(asset, (fbx) => {
        this.mesh_ = fbx;
        this.params_.scene.add(this.mesh_);
        this.scale_ = scale * 0.01;
  
        this.position_.x = math.rand_range(0, 400);
        this.position_.z = math.rand_int(0,1) ? math.rand_range(-43, -14) : math.rand_range(4, 20);

        const q = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0), math.rand_range(0, 360));
        this.quaternion_.copy(q);

        this.mesh_.traverse(c => {
          let materials = c.material;
          if (!(c.material instanceof Array)) {
            materials = [c.material];
          }
  
          for (let m of materials) {
            if (m) {
              // if (texture) {
              //   m.map = texture;
              // }
              m.specular = new THREE.Color(0x000000);
            }
          }    
          c.castShadow = true;
          c.receiveShadow = true;
        });
      });

    }

    Update(timeElapsed) {
      if (!this.mesh_) {
        return;
      }

      this.position_.x -= timeElapsed * 10;
      if (this.position_.x < -100) {
        this.position_.x = 200;
      }

      this.mesh_.position.copy(this.position_);
      this.mesh_.quaternion.copy(this.quaternion_);
      this.mesh_.scale.setScalar(this.scale_);
    }
  }

  class BackgroundCrap {
    constructor(params) {
      this.params_ = params;
      this.position_ = new THREE.Vector3();
      this.quaternion_ = new THREE.Quaternion();
      this.scale_ = 1.0;
      this.mesh_ = null;

      this.LoadModel_();
    }

    LoadModel_() {
      const assets = [
          ['Pallet.gltf', 1],
          ['Pallet_Broken.gltf', 1],
          ['FireHydrant.gltf', 1],
          ['Barrel.gltf', 1],
          ['Pipes.gltf', 1],
          ['PlasticBarrier.gltf', 1],
          ['StreetLights.gltf', 1],
          ['TrafficBarrier_1.gltf', 1],
          ['TrafficBarrier_2.gltf', 1],
          ['TrafficCone_1.gltf', 1],
          ['TrafficCone_2.gltf', 1],
          ['TrashBag_1.gltf', 1],
          ['TrashBag_2.gltf', 1],
          ['Wheel.gltf', 1],
          ['Wheels_Stack.gltf', 1],
          ['Blood_1.gltf', 1],
          ['Blood_2.gltf', 1],
          ['Blood_3.gltf', 1],
          ['CinderBlock.gltf', 1],
          ['Couch.gltf', 1],
          
      ];
      const [asset, scale] = assets[math.rand_int(0, assets.length - 1)];

      const texLoader = new THREE.TextureLoader();
      const texture = texLoader.load('./assets/Environment/Blends/Zombie_Atlas.png');
      texture.encoding = THREE.sRGBEncoding;

      const loader = new GLTFLoader();
      loader.setPath('./assets/Environment/glTF/');
      loader.load(asset, (glb) => {
        this.mesh_ = glb.scene;
        this.params_.scene.add(this.mesh_);
        this.scale_ = scale;

        switch (asset) {
          case 'FireHydrant.gltf':
            this.position_.x = math.rand_range(0, 400);
            this.position_.z = -14;
            this.rotation_ = 0;
            this.scale_ = scale * 3;
            break;
          case 'StreetLights.gltf':
            this.position_.x = math.rand_range(0, 400);
            this.position_.z = math.rand_int(0,1) ? -14 : 4;
            this.rotation_ = this.position_.z === -14 ? 0 : 180;
            this.scale_ = scale * 1.5;
            break;
          case 'TrashBag_1.gltf' || 'TrashBag_2.gltf':
            this.position_.x = math.rand_range(0, 200);
            this.position_.z = math.rand_int(0,1) ? -14 : 4;
            this.rotation_ = math.rand_range(0, 360);
            this.scale_ = scale * 2;
            break;
          default:
            this.position_.x = math.rand_range(0, 200);
            this.position_.z = math.rand_int(0,1) ? math.rand_range(-43, -14) : math.rand_range(4, 20);
            this.rotation_ = math.rand_range(0, 360);
            this.scale_ = scale * 2;
            break;
        }

        const q = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0), this.rotation_);
        this.quaternion_.copy(q);

        this.mesh_.traverse(c => {
          let materials = c.material;
          if (!(c.material instanceof Array)) {
            materials = [c.material];
          }
  
          for (let m of materials) {
            if (m) {
              if (texture) {
                m.map = texture;
              }
              m.specular = new THREE.Color(0x000000);
            }
          }    
          c.castShadow = true;
          c.receiveShadow = true;
        });
      });
    }

    Update(timeElapsed) {
      if (!this.mesh_) {
        return;
      }

      this.position_.x -= timeElapsed * 10;
      if (this.position_.x < -100) {
        this.position_.x = math.rand_range(200,400);
      }

      this.mesh_.position.copy(this.position_);
      this.mesh_.quaternion.copy(this.quaternion_);
      this.mesh_.scale.setScalar(this.scale_);
    }
  };

  class Background {
    constructor(params) {
      this.params_ = params;
      this.clouds_ = [];
      this.crap_ = [];
      this.buildings_ = [];
      this.crops_ = [];

      this.SpawnClouds_();
      this.SpawnBuildings_();
      this.SpawnCrops_();
      this.SpawnCrap_();
    }

    SpawnClouds_() {
      for (let i = 0; i < 25; ++i) {
        const cloud = new BackgroundCloud(this.params_);

        this.clouds_.push(cloud);
      }
    }

    SpawnCrap_() {
      for (let i = 0; i < 60; ++i) {
        const crap = new BackgroundCrap(this.params_);

        this.crap_.push(crap);
      }
    }

    SpawnCrops_() {
      for (let i = 0; i < 200; ++i) {
        const crop = new BackgroundCrops(this.params_);

        this.crops_.push(crop);
      }
    }

    SpawnBuildings_() {
      let xPos = 0;
      // spawn buildings
      for (let i = 0; i < 20; ++i) {
        const building = new BackgroundBuilding(this.params_, xPos);
        this.buildings_.push(building);

        xPos += 20;
      }
    }

    Update(timeElapsed) {
      for (let c of this.clouds_) {
        c.Update(timeElapsed);
      }
      for (let c of this.buildings_) {
        c.Update(timeElapsed);
      }
      for (let c of this.crops_) {
        c.Update(timeElapsed);
      }
      for (let c of this.crap_) {
        c.Update(timeElapsed);
      }
    }
  }

  return {
      Background: Background,
  };
})();