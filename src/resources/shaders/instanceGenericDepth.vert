#include <versionPrecision>

in vec3 position;
in vec3 normal;
in vec2 uv;
in vec3 instancePosition;
in float instanceScale;
in float instanceRotation;

out vec2 vUv;

uniform MainBlock {
	mat4 projectionMatrix;
	mat4 modelViewMatrix;
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

	mat2 rotationMatrix = rotate2d(instanceRotation);

	vec3 transformedPosition = position;
	transformedPosition.xz = rotationMatrix * transformedPosition.xz;
	transformedPosition *= instanceScale;
	transformedPosition += instancePosition;

	vec4 cameraSpacePosition = modelViewMatrix * vec4(transformedPosition, 1);

	gl_Position = projectionMatrix * cameraSpacePosition;
}
