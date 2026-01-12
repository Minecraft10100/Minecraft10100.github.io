export const mat4 = {
    // ---------------------
    // Create identity matrix
    // ---------------------
    create() {
        const out = new Float32Array(16);
        out[0] = out[5] = out[10] = out[15] = 1;
        return out;
    },

    // ---------------------
    // Clone matrix
    // ---------------------
    clone(a) {
        return new Float32Array(a);
    },

    // ---------------------
    // Copy matrix
    // ---------------------
    copy(out, a) {
        out.set(a);
        return out;
    },

    // ---------------------
    // Perspective projection
    // ---------------------
    perspective(out, fov, aspect, near, far) {
        const f = 1.0 / Math.tan(fov / 2);
        const nf = 1 / (near - far);

        out[0] = f / aspect;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;

        out[4] = 0;
        out[5] = f;
        out[6] = 0;
        out[7] = 0;

        out[8] = 0;
        out[9] = 0;
        out[10] = (far + near) * nf;
        out[11] = -1;

        out[12] = 0;
        out[13] = 0;
        out[14] = (2 * far * near) * nf;
        out[15] = 0;

        return out;
    },

    // ---------------------
    // Orthographic projection
    // ---------------------
    ortho(out, left, right, bottom, top, near, far) {
        const lr = 1 / (left - right);
        const bt = 1 / (bottom - top);
        const nf = 1 / (near - far);

        out[0]  = -2 * lr;
        out[5]  = -2 * bt;
        out[10] = 2 * nf;

        out[12] = (left + right) * lr;
        out[13] = (top + bottom) * bt;
        out[14] = (far + near) * nf;
        out[15] = 1;

        return out;
    },

    // ---------------------
    // Multiply matrices (a * b)
    // ---------------------
    multiply(out, a, b) {
        const o = out;

        const 
        a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

        const 
        b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3],
        b10 = b[4], b11 = b[5], b12 = b[6], b13 = b[7],
        b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11],
        b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];

        o[0]  = a00*b00 + a01*b10 + a02*b20 + a03*b30;
        o[1]  = a00*b01 + a01*b11 + a02*b21 + a03*b31;
        o[2]  = a00*b02 + a01*b12 + a02*b22 + a03*b32;
        o[3]  = a00*b03 + a01*b13 + a02*b23 + a03*b33;

        o[4]  = a10*b00 + a11*b10 + a12*b20 + a13*b30;
        o[5]  = a10*b01 + a11*b11 + a12*b21 + a13*b31;
        o[6]  = a10*b02 + a11*b12 + a12*b22 + a13*b32;
        o[7]  = a10*b03 + a11*b13 + a12*b23 + a13*b33;

        o[8]  = a20*b00 + a21*b10 + a22*b20 + a23*b30;
        o[9]  = a20*b01 + a21*b11 + a22*b21 + a23*b31;
        o[10] = a20*b02 + a21*b12 + a22*b22 + a23*b32;
        o[11] = a20*b03 + a21*b13 + a22*b23 + a23*b33;

        o[12] = a30*b00 + a31*b10 + a32*b20 + a33*b30;
        o[13] = a30*b01 + a31*b11 + a32*b21 + a33*b31;
        o[14] = a30*b02 + a31*b12 + a32*b22 + a33*b32;
        o[15] = a30*b03 + a31*b13 + a32*b23 + a33*b33;

        return o;
    },

    // ---------------------
    // Translate
    // ---------------------
    translate(out, a, v) {
        const x = v[0], y = v[1], z = v[2];

        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];

        return out;
    },

    // ---------------------
    // Scale
    // ---------------------
    scale(out, a, v) {
        const x = v[0], y = v[1], z = v[2];

        out[0] = a[0] * x;
        out[1] = a[1] * x;
        out[2] = a[2] * x;
        out[3] = a[3] * x;

        out[4] = a[4] * y;
        out[5] = a[5] * y;
        out[6] = a[6] * y;
        out[7] = a[7] * y;

        out[8] = a[8] * z;
        out[9] = a[9] * z;
        out[10] = a[10] * z;
        out[11] = a[11] * z;

        return out;
    },

    // ---------------------
    // Rotate around X
    // ---------------------
    rotateX(out, a, rad) {
        const s = Math.sin(rad);
        const c = Math.cos(rad);

        const a10 = a[4];
        const a11 = a[5];
        const a12 = a[6];
        const a13 = a[7];
        const a20 = a[8];
        const a21 = a[9];
        const a22 = a[10];
        const a23 = a[11];

        out[4] = a10 * c + a20 * s;
        out[5] = a11 * c + a21 * s;
        out[6] = a12 * c + a22 * s;
        out[7] = a13 * c + a23 * s;

        out[8] = a20 * c - a10 * s;
        out[9] = a21 * c - a11 * s;
        out[10] = a22 * c - a12 * s;
        out[11] = a23 * c - a13 * s;

        return out;
    },

    // ---------------------
    // Rotate around Y
    // ---------------------
    rotateY(out, a, rad) {
        const s = Math.sin(rad);
        const c = Math.cos(rad);

        const a00 = a[0];
        const a01 = a[1];
        const a02 = a[2];
        const a03 = a[3];
        const a20 = a[8];
        const a21 = a[9];
        const a22 = a[10];
        const a23 = a[11];

        out[0] = a00 * c - a20 * s;
        out[1] = a01 * c - a21 * s;
        out[2] = a02 * c - a22 * s;
        out[3] = a03 * c - a23 * s;

        out[8] = a00 * s + a20 * c;
        out[9] = a01 * s + a21 * c;
        out[10] = a02 * s + a22 * c;
        out[11] = a03 * s + a23 * c;

        return out;
    },

    // ---------------------
    // Rotate around Z
    // ---------------------
    rotateZ(out, a, rad) {
        const s = Math.sin(rad);
        const c = Math.cos(rad);

        const a00 = a[0];
        const a01 = a[1];
        const a02 = a[2];
        const a03 = a[3];
        const a10 = a[4];
        const a11 = a[5];
        const a12 = a[6];
        const a13 = a[7];

        out[0] = a00 * c + a10 * s;
        out[1] = a01 * c + a11 * s;
        out[2] = a02 * c + a12 * s;
        out[3] = a03 * c + a13 * s;

        out[4] = a10 * c - a00 * s;
        out[5] = a11 * c - a01 * s;
        out[6] = a12 * c - a02 * s;
        out[7] = a13 * c - a03 * s;

        return out;
    },

    // ---------------------
    // Invert matrix
    // ---------------------
    invert(out, a) {
        const m = a;
        const o = out;

        const a00 = m[0],  a01 = m[1],  a02 = m[2],  a03 = m[3],
              a10 = m[4],  a11 = m[5],  a12 = m[6],  a13 = m[7],
              a20 = m[8],  a21 = m[9],  a22 = m[10], a23 = m[11],
              a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];

        const 
        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32;

        const det = 
            b00 * b11 - b01 * b10 + b02 * b09 + 
            b03 * b08 - b04 * b07 + b05 * b06;

        if (!det) return null;

        const invDet = 1 / det;

        o[0]  = ( a11*b11 - a12*b10 + a13*b09) * invDet;
        o[1]  = (-a01*b11 + a02*b10 - a03*b09) * invDet;
        o[2]  = ( a31*b05 - a32*b04 + a33*b03) * invDet;
        o[3]  = (-a21*b05 + a22*b04 - a23*b03) * invDet;

        o[4]  = (-a10*b11 + a12*b08 - a13*b07) * invDet;
        o[5]  = ( a00*b11 - a02*b08 + a03*b07) * invDet;
        o[6]  = (-a30*b05 + a32*b02 - a33*b01) * invDet;
        o[7]  = ( a20*b05 - a22*b02 + a23*b01) * invDet;

        o[8]  = ( a10*b10 - a11*b08 + a13*b06) * invDet;
        o[9]  = (-a00*b10 + a01*b08 - a03*b06) * invDet;
        o[10] = ( a30*b04 - a31*b02 + a33*b00) * invDet;
        o[11] = (-a20*b04 + a21*b02 - a23*b00) * invDet;

        o[12] = (-a10*b09 + a11*b07 - a12*b06) * invDet;
        o[13] = ( a00*b09 - a01*b07 + a02*b06) * invDet;
        o[14] = (-a30*b03 + a31*b01 - a32*b00) * invDet;
        o[15] = ( a20*b03 - a21*b01 + a22*b00) * invDet;

        return o;
    },

    // ---------------------
    // LookAt camera matrix
    // ---------------------
    lookAt(out, eye, center, up) {
        let x0, x1, x2, y0, y1, y2, z0, z1, z2;

        const eyex = eye[0],
              eyey = eye[1],
              eyez = eye[2];

        const upx = up[0],
              upy = up[1],
              upz = up[2];

        const centerx = center[0],
              centery = center[1],
              centerz = center[2];

        // z-axis = look direction
        z0 = eyex - centerx;
        z1 = eyey - centery;
        z2 = eyez - centerz;

        let len = Math.hypot(z0, z1, z2);
        if (len === 0) {
            z2 = 1;
        } else {
            z0 /= len;
            z1 /= len;
            z2 /= len;
        }

        // x-axis = right
        x0 = upy * z2 - upz * z1;
        x1 = upz * z0 - upx * z2;
        x2 = upx * z1 - upy * z0;
        len = Math.hypot(x0, x1, x2);
        if (len === 0) {
            x0 = 1;
        } else {
            x0 /= len;
            x1 /= len;
            x2 /= len;
        }

        // y-axis = up
        y0 = z1 * x2 - z2 * x1;
        y1 = z2 * x0 - z0 * x2;
        y2 = z0 * x1 - z1 * x0;

        out[0] = x0;
        out[1] = y0;
        out[2] = z0;
        out[3] = 0;

        out[4] = x1;
        out[5] = y1;
        out[6] = z1;
        out[7] = 0;

        out[8] = x2;
        out[9] = y2;
        out[10] = z2;
        out[11] = 0;

        out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
        out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
        out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
        out[15] = 1;

        return out;
    }
};
