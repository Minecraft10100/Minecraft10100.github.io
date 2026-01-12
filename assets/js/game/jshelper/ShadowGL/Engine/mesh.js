import { createShaderProgram } from "./shader.js";
import { mat4 } from "./math.js";

export class Mesh {
    constructor(gl, data, vertexSrc, fragmentSrc, options = {}) {
        this.gl = gl;

        this.vertices = data.vertices;   // [x,y,z, nx,ny,nz, u,v]
        this.indices  = data.indices;    // [i1,i2,i3...]
        this.stride   = data.stride || 8; // number of floats per vertex

        this.rotationSpeed = options.rotationSpeed || [0.01, 0.01, 0];
        this.rotation = [0, 0, 0];

        this.program = createShaderProgram(gl, vertexSrc, fragmentSrc);
        this.attributeLocations = {};
        this.uniformLocations   = {};

        this.model = mat4.create();

        this.init();
    }

    init() {
        const gl = this.gl;

        // Create VBO
        this.vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

        // Create IBO (optional)
        if (this.indices) {
            this.ibo = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
        }

        // Look up attributes
        const attribs = ["aPosition", "aNormal", "aUV"];
        for (const name of attribs) {
            const loc = gl.getAttribLocation(this.program, name);
            this.attributeLocations[name] = loc >= 0 ? loc : null;
        }

        // Look up uniforms (cached)
        const uniforms = ["uProjection", "uView", "uModel", "uColor", "uTexture"];
        for (const name of uniforms) {
            this.uniformLocations[name] = gl.getUniformLocation(this.program, name);
        }
    }

    enableAttributes() {
        const gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

        const strideBytes = this.stride * 4;

        // Position: vec3
        if (this.attributeLocations.aPosition !== null) {
            gl.enableVertexAttribArray(this.attributeLocations.aPosition);
            gl.vertexAttribPointer(
                this.attributeLocations.aPosition,
                3,
                gl.FLOAT,
                false,
                strideBytes,
                0
            );
        }

        // Normal: vec3
        if (this.attributeLocations.aNormal !== null) {
            gl.enableVertexAttribArray(this.attributeLocations.aNormal);
            gl.vertexAttribPointer(
                this.attributeLocations.aNormal,
                3,
                gl.FLOAT,
                false,
                strideBytes,
                3 * 4
            );
        }

        // UV: vec2
        if (this.attributeLocations.aUV !== null) {
            gl.enableVertexAttribArray(this.attributeLocations.aUV);
            gl.vertexAttribPointer(
                this.attributeLocations.aUV,
                2,
                gl.FLOAT,
                false,
                strideBytes,
                6 * 4
            );
        }
    }

    update() {
        this.rotation[0] += this.rotationSpeed[0];
        this.rotation[1] += this.rotationSpeed[1];
        this.rotation[2] += this.rotationSpeed[2];

        mat4.identity(this.model);
        mat4.rotateX(this.model, this.model, this.rotation[0]);
        mat4.rotateY(this.model, this.model, this.rotation[1]);
        mat4.rotateZ(this.model, this.model, this.rotation[2]);
    }

    setUniform(name, value) {
        const gl = this.gl;
        const loc = this.uniformLocations[name];
        if (!loc) return;

        if (value.length === 16) gl.uniformMatrix4fv(loc, false, value);
        else if (value.length === 4) gl.uniform4fv(loc, value);
        else if (value.length === 3) gl.uniform3fv(loc, value);
        else if (value.length === 2) gl.uniform2fv(loc, value);
        else gl.uniform1f(loc, value);
    }

    draw(camera) {
        const gl = this.gl;
        gl.useProgram(this.program);

        // Set basic uniforms
        gl.uniformMatrix4fv(this.uniformLocations.uProjection, false, camera.projection);
        gl.uniformMatrix4fv(this.uniformLocations.uView, false, camera.view);
        gl.uniformMatrix4fv(this.uniformLocations.uModel, false, this.model);

        this.enableAttributes();

        if (this.indices) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
            gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / this.stride);
        }
    }
}
