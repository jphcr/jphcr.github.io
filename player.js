import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';

import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/FBXLoader.js';


export const player = (() => {

  class Player {
    constructor(params) {
      this.position_ = new THREE.Vector3(0, 0, 0);
      this.velocity_ = 0.0;
      this.playerBox_ = null;
      this.animations_ = {};

      this.params_ = params;

      this.LoadModel_();
      this.currentAnimation = 'CharacterArmature|Run';
      this.InitInput_();
    }

    LoadModel_() {
      const loader = new FBXLoader();
      loader.setPath('./assets/Characters/FBX/');
      loader.load('Zombie_Basic.fbx', (fbx) => {
        fbx.scale.setScalar(0.02);
        fbx.quaternion.setFromAxisAngle(
            new THREE.Vector3(0, 1, 0), Math.PI / 2);

        this.mesh_ = fbx;
        this.params_.scene.add(this.mesh_);

        this.playerBox_ = new THREE.Box3().setFromObject(this.mesh_);

        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load('./assets/Characters/Blends/Zombie_Atlas.png');


        fbx.traverse(c => {
          let materials = c.material;
          if (!(c.material instanceof Array)) {
            materials = [c.material];
          }
  
          for (let m of materials) {
            if (m) {
              m.map = texture;
              m.specular = new THREE.Color(0x000000);
              m.color.offsetHSL(0, 0, 0.25);
            }
          }    
          c.castShadow = true;
          c.receiveShadow = true;
        });

        const m = new THREE.AnimationMixer(fbx);
        this.mixer_ = m;

        for (let i = 0; i < fbx.animations.length; ++i) {
          console.log(fbx.animations[i].name); // Log the animation name
          const clip = fbx.animations[i];
          const action = this.mixer_.clipAction(clip);
          this.animations_[clip.name] = action;

          if(clip.name === 'CharacterArmature|Run') {
            action.play();
          }
        }
      });
    }

    InitInput_() {
      this.keys_ = {
          spacebar: false,
      };
      this.oldKeys = {...this.keys_};

      document.addEventListener('keydown', (e) => this.OnKeyDown_(e), false);
      document.addEventListener('keyup', (e) => this.OnKeyUp_(e), false);
    }

    OnKeyDown_(event) {
      switch(event.keyCode) {
        case 32:
          this.keys_.space = true;
          break;
      }
    }

    OnKeyUp_(event) {
      switch(event.keyCode) {
        case 32:
          this.keys_.space = false;
          break;
      }
    }

    ChangeAnimation(name) {
      if (this.currentAnimation) {
        this.animations_[this.currentAnimation].stop();
      }
    
      this.currentAnimation = name;
      this.animations_[this.currentAnimation].play();
    }

    CheckCollisions_() {
      const colliders = this.params_.world.GetColliders();

      this.playerBox_.setFromObject(this.mesh_);

      for (let c of colliders) {
        const cur = c.collider;

        if (cur.intersectsBox(this.playerBox_)) {
          this.gameOver = true;
        }
      }
    }

    Update(timeElapsed) {
      if (this.keys_.space && this.position_.y == 0.0) {
        this.velocity_ = 35 ;
        this.ChangeAnimation('CharacterArmature|Jump_Idle'); 
      } else if (this.position_.y == 0.0 && this.currentAnimation === 'CharacterArmature|Jump_Idle') {
        this.ChangeAnimation('CharacterArmature|Run');
      }
  
      const acceleration = -60 * timeElapsed;

      this.position_.y += timeElapsed * (
          this.velocity_ + acceleration * 0.5);
      this.position_.y = Math.max(this.position_.y, 0.0);

      this.velocity_ += acceleration;
      this.velocity_ = Math.max(this.velocity_, -100);

      if (this.mesh_) {
        this.mixer_.update(timeElapsed);
        this.mesh_.position.copy(this.position_);
        this.CheckCollisions_();
      }
    }
  };

  return {
      Player: Player,
  };
})();