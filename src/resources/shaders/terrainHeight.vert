#version 300 es
precision highp float;
in vec3 position;
in vec2 uv;

out vec2 vUv;

uniform MainBlock {
    vec3 transform;
};

void main() {
    vUv = vec2(uv.y, 1. - uv.x);
    gl_Position = vec4((vec3(transform.x, transform.y, 0) + position * transform.z) * 2. - 1., 1);
}