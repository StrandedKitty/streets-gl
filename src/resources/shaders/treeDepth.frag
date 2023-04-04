#include <versionPrecision>

in vec2 vUv;

uniform sampler2DArray tColor;

void main() {
    if (texture(tColor, vec3(vUv, 0)).a < 0.5) discard;
}
