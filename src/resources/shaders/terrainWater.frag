#include <versionPrecision>

out vec4 FragColor;

in vec2 vUv;

uniform MainBlock {
    vec3 transform;
    float fillValue;
};

void main() {
    FragColor = vec4(fillValue);
}