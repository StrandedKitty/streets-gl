#include <versionPrecision>

in vec3 position;
in vec3 normal;
in vec3 color;

out vec3 vColor;
out vec3 vNormal;
out vec3 vPosition;
out vec4 vClipPos;
out vec4 vClipPosPrev;

uniform PerMesh {
    mat4 modelViewMatrix;
    mat4 modelViewMatrixPrev;
};

uniform PerMaterial {
    mat4 projectionMatrix;
};

void main() {
    vColor = color;
    vNormal = normal;

    vec3 transformedPosition = position;
    vec4 cameraSpacePosition = modelViewMatrix * vec4(transformedPosition, 1.);
    vec4 cameraSpacePositionPrev = modelViewMatrixPrev * vec4(transformedPosition, 1.0);

    vPosition = vec3(cameraSpacePosition);

    vClipPos = projectionMatrix * cameraSpacePosition;
    vClipPosPrev = projectionMatrix * cameraSpacePositionPrev;

    gl_Position = projectionMatrix * cameraSpacePosition;
}