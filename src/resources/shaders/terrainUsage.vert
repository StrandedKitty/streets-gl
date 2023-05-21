#include <versionPrecision>

in vec3 position;

out vec2 vUv;

uniform MainBlock {
    vec3 transform;
};

void main() {
    vec2 pos = vec2(position.z / 611.49, 1. - position.x / 611.49);

    vUv = pos;

    gl_Position = vec4(
        vec3(transform.xy + pos * transform.z, 0) * 2. - 1.,
    1);
}