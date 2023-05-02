#include <versionPrecision>

in vec3 position;
in vec3 normal;
in vec2 uv;
in vec3 instancePosition;
in vec3 instanceRotation;

out vec2 vUv;

uniform MainBlock {
	mat4 projectionMatrix;
	mat4 modelViewMatrix;
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

	mat3 rotationMatrix = rotateX(instanceRotation.x) * rotateY(instanceRotation.y) * rotateZ(instanceRotation.z);
	vec3 transformedPosition = instancePosition + rotationMatrix * position;

	gl_Position = projectionMatrix * modelViewMatrix * vec4(transformedPosition, 1);
}
