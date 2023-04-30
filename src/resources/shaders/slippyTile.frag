#include <versionPrecision>

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tMap;

void main() {
    FragColor = texture(tMap, vUv);
}