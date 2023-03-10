#include <versionPrecision>

in vec3 position;
in vec2 uv;

out vec2 vUv;

uniform MainBlock {
    vec4 transform;
    float scale;
};

void main() {
    vUv = vec2(uv.x, 1. - uv.y);
    gl_Position = vec4((vec3(transform.xy, 0) + position * transform.z) * 2. - 1., 1);
}