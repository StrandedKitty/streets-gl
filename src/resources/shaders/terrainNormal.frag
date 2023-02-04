#include <versionPrecision>

out vec4 FragColor;

in vec2 vUv;

uniform sampler2DArray tHeight;

uniform MainBlock {
    int layer;
    float heightMapWorldSize;
};

const vec2 size = vec2(2.0,0.0);
const ivec3 off = ivec3(-1,0,1);

void main() {
    vec2 texelSize = 1. / vec2(textureSize(tHeight, 0));

    vec3 origin = vec3(vUv, layer);

    float top = textureOffset(tHeight, origin, ivec2(0, 1)).r;
    float bottom = textureOffset(tHeight, origin, ivec2(0, -1)).r;
    float left = textureOffset(tHeight, origin, ivec2(-1, 0)).r;
    float right = textureOffset(tHeight, origin, ivec2(1, 0)).r;

    vec3 n = normalize(vec3(bottom - top, texelSize.x * heightMapWorldSize, left - right));

    FragColor = vec4(n, 1);
}