#version 300 es
precision highp float;

in vec3 position;
in vec2 uv;

out vec2 vUv;
out vec3 vPosition;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

void main() {
	vUv = uv;

	vec3 transformedPosition = position;
	vec4 cameraSpacePosition = modelViewMatrix * vec4(transformedPosition, 1.0);

	vPosition = vec3(cameraSpacePosition);

	gl_Position = projectionMatrix * cameraSpacePosition;
}
