#include <versionPrecision>

out uint FragColor;

in vec2 vUv;

uniform MainBlock {
    uint value;
};

void main() {
    FragColor = value;
}