#include <versionPrecision>

in vec3 position;
in vec3 offset;
in vec2 uv;

out vec2 vUv;
out float vDistance;

uniform Uniforms {
	mat4 modelViewMatrix;
	mat4 modelViewMatrixNoRotation;
	mat4 projectionMatrix;
	vec2 resolution;
};

void main() {
	vUv = uv;
	vDistance = -(modelViewMatrix * vec4(offset, 1)).z;

	float scale = vDistance / resolution.y / projectionMatrix[1][1] * 2.;
	vec4 cameraSpacePosition = modelViewMatrix * vec4(offset, 1) + vec4((modelViewMatrixNoRotation * vec4(position * scale, 1.0)).xyz, 0.);

	gl_Position = projectionMatrix * cameraSpacePosition;
}
