#include <versionPrecision>

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tHeight;

uniform MainBlock {
    float heightMapWorldSize;
};

const vec2 size = vec2(2.0,0.0);
const ivec3 off = ivec3(-1,0,1);

void main() {
    vec2 texelSize = 1. / vec2(textureSize(tHeight, 0));

    float top = textureOffset(tHeight, vUv, ivec2(0, 1)).r;
    float bottom = textureOffset(tHeight, vUv, ivec2(0, -1)).r;
    float left = textureOffset(tHeight, vUv, ivec2(-1, 0)).r;
    float right = textureOffset(tHeight, vUv, ivec2(1, 0)).r;

    vec3 n = normalize(vec3(left - right, texelSize.x * heightMapWorldSize, bottom - top));

    FragColor = vec4(n, 1);
}