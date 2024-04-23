import * as THREE from "https://threejs.org/build/three.module.js";

export const world = (() => {

    const SEPARATION_DISTANCE = 20;
    const START_POS = 100;

    class WORLD_OBJ {
        constructor(params) {
            this.position = new THREE.Vector3();
            this.scale = 1.0;
            const playerGeometry = new THREE.BoxGeometry(1,1,1);
            const playerMaterial = new THREE.MeshPhongMaterial({color: 0xff0000, specular: 0x0000ff, shininess: 1.5});
            this.cube = new THREE.Mesh(playerGeometry, playerMaterial);
            this.cube.castShadow = true;
            this.cube.receiveShadow = true;
            this.cube.position.y += 0.5;
            params.scene.add(this.cube);
        }

        _Update(timeElapsed, speed) {
            this.position.x -= speed * timeElapsed;
            this.cube.position.copy(this.position);
        }
    }

    class WORLD {
        constructor(params) {
            this.objects = [];
            this.unused = [];
            this.speed = 24;
            this.separationDistance_ = SEPARATION_DISTANCE;
            this.params_ = params;
        }

        LastObjectPosition_() {
            if (this.objects.length == 0) {
              return SEPARATION_DISTANCE;
            }
      
            return this.objects[this.objects.length - 1].position.x;
        }

        _SPAWN(scale, offset){
            const obj = new WORLD_OBJ(this.params_);
            obj.position.x = START_POS;
            this.objects.push(obj);

            // let obj;
            // if (this.unused.length > 0) {
            //     obj = this.unused.pop();
            //     obj.scale = scale;
            //     obj.position.x = offset;
            // } else {
            //     obj = new WORLD_OBJ(this.params_);
            //     this.objects.push(obj);
            // }
            // return obj;
        }

        _Update(timeElapsed) {
            const closest = this.LastObjectPosition_();
            if (Math.abs(START_POS - closest) > SEPARATION_DISTANCE) {
                this._SPAWN();
            }
            for (let obj of this.objects) {
                obj._Update(timeElapsed, this.speed);
            }
        }
    }
    return {
        WORLD : WORLD,
    };
})();