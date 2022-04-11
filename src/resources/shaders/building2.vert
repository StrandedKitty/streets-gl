#include <versionPrecision>

in vec3 position;
in vec2 uv;
in vec3 normal;
in vec3 color;
in uint textureId;

out vec3 vColor;
out vec2 vUv;
out vec3 vNormal;
out vec3 vPosition;
out vec4 vClipPos;
out vec4 vClipPosPrev;
flat out int vTextureId;

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
    vUv = uv;
    vTextureId = int(textureId);

    vec3 transformedPosition = position;
    vec4 cameraSpacePosition = modelViewMatrix * vec4(transformedPosition, 1.);
    vec4 cameraSpacePositionPrev = modelViewMatrixPrev * vec4(transformedPosition, 1.0);

    vPosition = vec3(cameraSpacePosition);

    vClipPos = projectionMatrix * cameraSpacePosition;
    vClipPosPrev = projectionMatrix * cameraSpacePositionPrev;

    gl_Position = projectionMatrix * cameraSpacePosition;
}