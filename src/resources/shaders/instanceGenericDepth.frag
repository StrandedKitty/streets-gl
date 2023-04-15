#include <versionPrecision>

in vec2 vUv;

uniform PerInstanceType {
    float textureId;
};

uniform sampler2DArray tMap;

vec4 readDiffuse(vec2 uv) {
    return texture(tMap, vec3(uv, textureId * 2.));
}

void main() {
    vec4 color = readDiffuse(vUv);

    if (color.a < 0.5) {
        discard;
    }
}
