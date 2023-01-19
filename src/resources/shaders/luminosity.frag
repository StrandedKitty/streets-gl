#include <versionPrecision>

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tMap;

void main() {
    FragColor = vec4(texture(tMap, vUv).rgb * 0.025, 1);
}