#include <versionPrecision>

in vec3 position;
in vec3 normal;
in vec2 uv;
in vec3 instancePosition;
in float instanceRotation;

out vec2 vUv;

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

	mat2 rotationMatrix = rotate2d(instanceRotation);

	vec3 transformedPosition = position;
	transformedPosition.xz = rotationMatrix * transformedPosition.xz;
	transformedPosition += instancePosition;

	gl_Position = projectionMatrix * modelViewMatrix * vec4(transformedPosition, 1);
}
