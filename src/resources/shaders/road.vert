#include <versionPrecision>

in vec3 position;
in vec2 uv;
in vec3 normal;
in uint textureId;

out vec2 vUv;
out vec3 vPosition;
out vec3 vLocalPosition;
out vec3 vNormal;
out vec4 vClipPos;
out vec4 vClipPosPrev;
out vec3 vCenter;
flat out int vTextureId;

uniform PerMesh {
	mat4 modelViewMatrix;
	mat4 modelViewMatrixPrev;
};

uniform PerMaterial {
	mat4 projectionMatrix;
};

void main() {
	vCenter = vec3(0);
	int centerIndex = gl_VertexID - 3 * int(float(gl_VertexID) / 3.);
	vCenter[centerIndex] = 1.;

	vTextureId = int(textureId);

	vUv = uv;
	vNormal = vec3(modelViewMatrix * vec4(normal, 0));
	vLocalPosition = position;

	vec3 transformedPosition = position;
	vec4 cameraSpacePosition = modelViewMatrix * vec4(transformedPosition, 1.0);
	vec4 cameraSpacePositionPrev = modelViewMatrixPrev * vec4(transformedPosition, 1.0);

	vPosition = vec3(cameraSpacePosition);

	vClipPos = projectionMatrix * cameraSpacePosition;
	vClipPosPrev = projectionMatrix * cameraSpacePositionPrev;

	gl_Position = vClipPos;
}
