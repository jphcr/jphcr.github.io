import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';

import {math} from './math.js';

import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/FBXLoader.js';


export const world = (() => {

  const START_POS = 100;
  const SEPARATION_DISTANCE = 20;
  const BASE_SPEED = 12;
  const MODEL_NAME = ['./assets/Vehicles/FBX/Vehicle_Sports.fbx', './assets/Vehicles/FBX/Vehicle_Pickup.fbx', './assets/Vehicles/FBX/Vehicle_Truck.fbx', './assets/Environment/FBX/Container_Red.fbx', './assets/Environment/FBX/Container_Green.fbx', './assets/Environment/FBX/Couch.fbx'];
  let models = [];

  function LoadModel_() {
    const texLoader = new THREE.TextureLoader();
    const texture = texLoader.load('./assets/Vehicles/Blends/Zombie_Atlas.png');
    texture.encoding = THREE.sRGBEncoding;

    const loader = new FBXLoader();
    for (let modelName of MODEL_NAME) {
      loader.load(modelName, (fbx) => {
        fbx.scale.setScalar(0.01);
        models.push(fbx);

        fbx.traverse(c => {
          if (c.geometry) {
            c.geometry.computeBoundingBox();
          }

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
  }

  LoadModel_();

  class WorldObject {
    constructor(params, model) {
      this.position = new THREE.Vector3();
      this.quaternion = new THREE.Quaternion();
      this.scale = 1.0;

      this.params_ = params;
      this.mesh = model.clone();
      this.collider = new THREE.Box3().setFromObject(this.mesh);
      this.params_.scene.add(this.mesh);
    }

    UpdateCollider_() {
      this.collider.setFromObject(this.mesh);
    }

    Update(timeElapsed) {
      if (!this.mesh) {
        return;
      }
      this.mesh.position.copy(this.position);
      this.mesh.quaternion.copy(this.quaternion);
      this.mesh.scale.setScalar(this.scale);
      this.UpdateCollider_();
    }
  }

  class WorldManager {
    constructor(params) {
      this.objects_ = [];
      this.unused_ = [];
      this.speed_ = BASE_SPEED;
      this.params_ = params;
      this.score_ = 0.0;
      this.scoreText_ = '00000';
      this.separationDistance_ = SEPARATION_DISTANCE;
    }

    GetColliders() {
      return this.objects_;
    }

    GetScore() {
      return this.score_;
    }

    LastObjectPosition_() {
      if (this.objects_.length == 0) {
        return SEPARATION_DISTANCE;
      }

      return this.objects_[this.objects_.length - 1].position.x;
    }

    SpawnObj_(scale, xoffset, zoffset) {
      let obj = null;

      if (this.unused_.length > 0) {
        obj = this.unused_.pop();
        obj.mesh.visible = true;
      } else {
        const modelIndex = math.rand_int(0, models.length - 1);
        const model = models[modelIndex];
        obj = new WorldObject(this.params_, model);
      }
      
      let randomAngle = (Math.PI * 2.0) + (Math.random() - 0.5) * 0.7;
      obj.quaternion.setFromAxisAngle(
          // new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2.0);
          new THREE.Vector3(0, 1, 0), randomAngle);
      obj.position.x = START_POS + xoffset;
      obj.position.z = zoffset;
      obj.scale = scale * 0.014;
      this.objects_.push(obj);
    }

    SpawnCluster_() {
      const scale = 1
      const numObjects = math.rand_int(1, 2);

      for (let i = 0; i < numObjects; ++i) {
        const offset = i * 4 * scale;
        const zoffset = -i * 6;
        this.SpawnObj_(scale, offset, zoffset);
      }
    }

    MaybeSpawn_() {
      const closest = this.LastObjectPosition_();
      if (Math.abs(START_POS - closest) > this.separationDistance_) {
        this.SpawnCluster_();
        this.separationDistance_ = math.rand_range(SEPARATION_DISTANCE, SEPARATION_DISTANCE * 1.5);
      }
    }

    Update(timeElapsed) {
      this.speed_ = BASE_SPEED + this.score_ * 0.002;
      this.MaybeSpawn_();
      this.UpdateColliders_(timeElapsed);
      this.UpdateScore_(timeElapsed);
    }

    UpdateScore_(timeElapsed) {
      this.score_ += timeElapsed * 10.0;

      const scoreText = Math.round(this.score_).toLocaleString(
          'en-US', {minimumIntegerDigits: 5, useGrouping: false});

      if (scoreText == this.scoreText_) {
        return;
      }

      document.getElementById('score-text').innerText = scoreText;
    }

    UpdateColliders_(timeElapsed) {
      const invisible = [];
      const visible = [];

      for (let obj of this.objects_) {
        obj.position.x -= timeElapsed * this.speed_;

        if (obj.position.x < -20) {
          invisible.push(obj);
          obj.mesh.visible = false;
        } else {
          visible.push(obj);
        }

        obj.Update(timeElapsed);
      }

      this.objects_ = visible;
      this.unused_.push(...invisible);
    }
  };

  return {
      WorldManager: WorldManager,
  };
})();