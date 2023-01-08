#version 300 es
precision highp float;
in vec2 position;

out vec2 vUv;

uniform MainBlock {
    vec3 transform;
    float fillValue;
};

void main() {
    vUv = vec2(1);
    gl_Position = vec4(
        vec3(transform.xy + position * transform.z, 0) * 2. - 1.,
    1);
}