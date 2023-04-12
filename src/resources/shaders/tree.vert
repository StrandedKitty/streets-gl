#include <versionPrecision>

in vec3 position;
in vec3 normal;
in vec2 uv;
in vec3 instancePosition;
in float instanceScale;
in float instanceRotation;
in float instanceSeed;

out vec2 vUv;
out vec3 vNormal;
out vec3 vPosition;
out vec4 vClipPos;
out vec4 vClipPosPrev;
flat out int vTextureId;

uniform MainBlock {
	mat4 projectionMatrix;
	mat4 modelMatrix;
	mat4 viewMatrix;
	mat4 modelViewMatrixPrev;
};

mat2 rotate2d(float angle){
	return mat2(
		cos(angle), -sin(angle),
		sin(angle), cos(angle)
	);
}

void main() {
	vUv = uv;
	vTextureId = int(instanceSeed);

	mat2 rotationMatrix = rotate2d(instanceRotation);

	vec3 modelNormal = normalize((modelMatrix * vec4(normal, 0)).xyz);
	modelNormal.xz = rotationMatrix * modelNormal.xz;
	vec3 modelViewNormal = normalize((viewMatrix * vec4(modelNormal, 0)).xyz);
	vNormal = modelViewNormal;

	vec3 transformedPosition = position;
	transformedPosition.xz = rotationMatrix * transformedPosition.xz;
	transformedPosition *= instanceScale;
	transformedPosition += instancePosition;

	vec4 cameraSpacePosition = viewMatrix * modelMatrix * vec4(transformedPosition, 1);
	vec4 cameraSpacePositionPrev = modelViewMatrixPrev * vec4(transformedPosition, 1);

	vPosition = vec3(cameraSpacePosition);

	vClipPos = projectionMatrix * cameraSpacePosition;
	vClipPosPrev = projectionMatrix * cameraSpacePositionPrev;

	gl_Position = vClipPos;
}
