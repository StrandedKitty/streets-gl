#include <versionPrecision>

in vec2 position;

out vec2 vUv;

uniform PerMaterial {
    mat4 projectionMatrix;
};

uniform PerMesh {
    mat4 modelViewMatrix;
};

void main() {
    vUv = position;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 0, 1);
}