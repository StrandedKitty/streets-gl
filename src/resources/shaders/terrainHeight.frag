#include <versionPrecision>

out vec4 FragColor;

in vec2 vUv;

uniform MainBlock {
    vec4 transform;
    float scale;
};

uniform sampler2D tMap;

void main() {
    vec4 color = texture(tMap, vUv);
    float height = -10000. + (color.r * 255. * 256. * 256. + color.g * 255. * 256. + color.b * 255.) * 0.1;

    FragColor = vec4(height * scale);
}