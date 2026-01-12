import { createShaderProgram } from "./shader.js";
import { mat4 } from "./math.js";

export class WebGL3D {
    constructor(canvas) {
        this.gl = canvas.getContext("webgl");
        if (!this.gl) throw new Error("WebGL not supported");

        this.meshes = [];
        this.camera = null;
        this.background = [0.1, 0.1, 0.1, 1.0];

        this.initGL();
    }

    initGL() {
        const gl = this.gl;
        gl.clearColor(...this.background);
        gl.enable(gl.DEPTH_TEST);
    }

    setCamera(camera) {
        this.camera = camera;
    }

    addMesh(mesh) {
        this.meshes.push(mesh);
    }

    render() {
        const gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        for (let mesh of this.meshes) {
            mesh.update();
            mesh.draw(this.camera);
        }
    }

    start() {
        const loop = () => {
            this.render();
            requestAnimationFrame(loop);
        };
        loop();
    }
}
