#include <versionPrecision>

in vec3 position;
in vec2 uv;
in vec3 normal;
in vec3 color;
in uint textureId;
in uint localId;
in uint display;

out vec3 vColor;
out vec2 vUv;
out vec3 vNormal;
out vec3 vPosition;
out vec4 vClipPos;
out vec4 vClipPosPrev;
flat out int vTextureId;
flat out uint vObjectId;

uniform PerMesh {
    mat4 modelViewMatrix;
    mat4 modelViewMatrixPrev;
    uint tileId;
};

uniform PerMaterial {
    mat4 projectionMatrix;
};

void main() {
    if(display > 0u) {
        gl_Position = vec4(2, 0, 0, 1);
        return;
    }

    vColor = color;
    vNormal = normal;
    vUv = uv;
    vTextureId = int(textureId);
    vObjectId = (tileId << 16u) + localId + 1u;

    vec3 transformedPosition = position;
    vec4 cameraSpacePosition = modelViewMatrix * vec4(transformedPosition, 1.);
    vec4 cameraSpacePositionPrev = modelViewMatrixPrev * vec4(transformedPosition, 1.0);

    vPosition = vec3(cameraSpacePosition);

    vClipPos = projectionMatrix * cameraSpacePosition;
    vClipPosPrev = projectionMatrix * cameraSpacePositionPrev;

    gl_Position = projectionMatrix * cameraSpacePosition;
}