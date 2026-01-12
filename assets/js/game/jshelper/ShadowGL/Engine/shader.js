export function createShaderProgram(gl, vertexSrc, fragmentSrc) {
    const vertex = createShader(gl, gl.VERTEX_SHADER, vertexSrc);
    const fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);

    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error("Shader link error: " + gl.getProgramInfoLog(program));
    }
    return program;
}

function createShader(gl, type, src) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error("Shader compile error: " + gl.getShaderInfoLog(shader));
    }
    return shader;
}
