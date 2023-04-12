#include <versionPrecision>

in vec2 vUv;
flat in int vTextureId;

uniform sampler2DArray tMap;

void main() {
    if (texture(tMap, vec3(vUv, vTextureId * 2)).a < 0.5) discard;
}
