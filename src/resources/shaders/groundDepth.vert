#version 300 es
precision highp float;

in vec3 position;
in vec2 uv;
in vec3 normal;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

void main() {
	vec3 transformedPosition = position;
	vec4 cameraSpacePosition = modelViewMatrix * vec4(transformedPosition, 1.0);

	gl_Position = projectionMatrix * cameraSpacePosition;
}
