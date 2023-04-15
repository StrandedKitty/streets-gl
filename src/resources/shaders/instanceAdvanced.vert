#include <versionPrecision>

in vec3 position;
in vec3 normal;
in vec2 uv;
in vec3 instancePosition;
in vec3 instanceScale;
in vec3 instanceRotation;
out vec4 vClipPos;
out vec4 vClipPosPrev;

out vec2 vUv;
out vec3 vNormal;
out vec3 vPosition;

uniform MainBlock {
	mat4 projectionMatrix;
	mat4 modelMatrix;
	mat4 viewMatrix;
	mat4 modelViewMatrixPrev;
};

mat3 rotateX(float rad) {
	float c = cos(rad);
	float s = sin(rad);
	return mat3(
	1.0, 0.0, 0.0,
	0.0, c, s,
	0.0, -s, c
	);
}
mat3 rotateY(float rad) {
	float c = cos(rad);
	float s = sin(rad);
	return mat3(
	c, 0.0, -s,
	0.0, 1.0, 0.0,
	s, 0.0, c
	);
}
mat3 rotateZ(float rad) {
	float c = cos(rad);
	float s = sin(rad);
	return mat3(
	c, s, 0.0,
	-s, c, 0.0,
	0.0, 0.0, 1.0
	);
}

void main() {
	vUv = uv;

	mat3 rotationMatrixZ = rotateZ(instanceRotation.z);
	mat3 rotationMatrixY = rotateY(instanceRotation.y);

	vec3 modelNormal = normalize((modelMatrix * vec4(normal, 0)).xyz);
	modelNormal = rotationMatrixZ * modelNormal;
	modelNormal = rotationMatrixY * modelNormal;
	vec3 modelViewNormal = normalize((viewMatrix * vec4(modelNormal, 0)).xyz);
	vNormal = modelViewNormal;

	vec3 transformedPosition = position;
	transformedPosition *= instanceScale;
	transformedPosition = rotationMatrixZ * transformedPosition;
	transformedPosition = rotationMatrixY * transformedPosition;
	transformedPosition += instancePosition;

	vec4 cameraSpacePosition = viewMatrix * modelMatrix * vec4(transformedPosition, 1);
	vec4 cameraSpacePositionPrev = modelViewMatrixPrev * vec4(transformedPosition, 1);

	vPosition = vec3(cameraSpacePosition);

	vClipPos = projectionMatrix * cameraSpacePosition;
	vClipPosPrev = projectionMatrix * cameraSpacePositionPrev;

	gl_Position = vClipPos;
}
