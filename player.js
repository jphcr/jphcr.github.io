import * as THREE from "https://threejs.org/build/three.module.js";

export const player = (() => {

    class PLAYER {
        constructor(params) {
            this.position = new THREE.Vector3();
            this.velocity = 0.0;

            const playerGeometry = new THREE.BoxGeometry(1,1,1);
            const playerMaterial = new THREE.MeshPhongMaterial({color: 0x00ff00, specular: 0x0000ff, shininess: 1.5});
            this.cube = new THREE.Mesh(playerGeometry, playerMaterial);
            this.cube.castShadow = true;
            this.cube.receiveShadow = true;
            this.cube.position.y += 0.5;
            params.scene.add(this.cube);

            this._InitInput();


        }

        _InitInput() {
            this.keys = {
                up: false,
                down: false
            };

            document.addEventListener('keydown', (e) => this._KeyDown(e), false);
            document.addEventListener('keyup', (e) => this._KeyUp(e), false);
        }

        _KeyDown(e) {
            console.log('_KeyDown', e.code); // Log the key that was pressed
            switch (e.code) {
                case "ArrowUp":
                    this.keys.up = true;
                    break;
                case "ArrowDown":
                    this.keys.down = true;
                    break;
            }
        }

        _KeyUp(e) {
            console.log('_KeyUp', e.code); // Log the key that was released
            switch (e.code) {
                case "ArrowUp":
                    this.keys.up = false;
                    break;
                case "ArrowDown":
                    this.keys.down = false;
                    break;
            }
        }

        _Update(timeElapsed) {
            console.log('_Update', this.keys, this.position.y); // Log the current state
            if (this.keys.up && this.position.y == 0.0){
                this.velocity = 30;
            }
            if (this.keys.down) {
                this.velocity = -30;
            }
            const acceleration = -75 * timeElapsed;
            this.position.y += timeElapsed * (this.velocity + acceleration * 0.5);
            this.position.y = Math.max(this.position.y, 0.0);

            this.velocity += acceleration;
            this.velocity = Math.max(this.velocity, -100);

            this.cube.position.copy(this.position);
        }
    }

    return {
        PLAYER : PLAYER,
    };
})();