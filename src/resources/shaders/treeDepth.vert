#include <versionPrecision>

in vec3 position;
in vec2 uv;
in vec3 instancePosition;
in float instanceScale;
in float instanceRotation;
in float instanceSeed;

out vec2 vUv;
flat out int vTextureId;

uniform MainBlock {
	mat4 projectionMatrix;
	mat4 modelViewMatrix;
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

	vec3 transformedPosition = position;
	transformedPosition.xz = rotate2d(instanceRotation) * transformedPosition.xz;
	transformedPosition *= instanceScale;
	transformedPosition += instancePosition;

	vec4 cameraSpacePosition = modelViewMatrix * vec4(transformedPosition, 1);

	gl_Position = projectionMatrix * cameraSpacePosition;
}
