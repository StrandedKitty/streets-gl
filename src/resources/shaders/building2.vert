#include <versionPrecision>

in vec3 position;
in vec3 normal;
in vec3 color;

out vec3 vColor;
out vec3 vNormal;
out vec3 vPosition;

uniform PerMesh {
    mat4 modelViewMatrix;
};

uniform PerMaterial {
    mat4 projectionMatrix;
};

void main() {
    vColor = color;
    vNormal = normal;

    vec3 transformedPosition = position;
    vec4 cameraSpacePosition = modelViewMatrix * vec4(transformedPosition, 1.);

    vPosition = vec3(cameraSpacePosition);

    gl_Position = projectionMatrix * cameraSpacePosition;
}