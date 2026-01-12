import { mat4 } from "./math.js";

export class Camera {
    constructor(fov, aspect, near, far) {
        this.projection = mat4.create();
        mat4.perspective(this.projection, fov, aspect, near, far);

        this.position = [0, 0, 5];
        this.view = mat4.create();
    }
}
