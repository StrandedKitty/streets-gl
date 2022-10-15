#include <versionPrecision>

in vec3 position;
in vec2 uv;
out vec4 vClipPos;
out vec4 vClipPosPrev;

out vec2 vUv;
out vec3 vNormal;
out vec3 vPosition;

uniform PerMesh {
	mat4 modelViewMatrix;
	mat4 modelViewMatrixPrev;
};

uniform PerMaterial {
	mat4 projectionMatrix;
};

void main() {
	vUv = uv;
	vNormal = vec3(modelViewMatrix * vec4(vec3(0, 1, 0), 0));

	vec3 transformedPosition = position.xzy * 32000.;
	vec4 cameraSpacePosition = modelViewMatrix * vec4(transformedPosition, 1.0);
	vec4 cameraSpacePositionPrev = modelViewMatrixPrev * vec4(transformedPosition, 1.0);

	vPosition = vec3(cameraSpacePosition);

	vClipPos = projectionMatrix * cameraSpacePosition;
	vClipPosPrev = projectionMatrix * cameraSpacePositionPrev;

	gl_Position = vClipPos;
}
