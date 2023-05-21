#include <versionPrecision>

out uint FragColor;

in vec2 vUv;

uniform MainBlock {
    vec3 transform;
};

uint encodePosition(ivec2 v) {
    return uint(v.x) | (uint(v.y) << 16);
}

void main() {
    FragColor = encodePosition(ivec2(gl_FragCoord.xy));
}