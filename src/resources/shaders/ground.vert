#version 300 es
precision highp float;

in vec3 position;
in vec2 uv;
in vec3 normal;
out vec4 vClipPos;
out vec4 vClipPosPrev;

out vec2 vUv;
out vec3 vNormal;
out vec3 vPosition;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 modelViewMatrixPrev;

void main() {
	vUv = uv;
	vNormal = (modelViewMatrix * vec4(normal, 0)).xyz;

	vec3 transformedPosition = position;
	vec4 cameraSpacePosition = modelViewMatrix * vec4(transformedPosition, 1.0);
	vec4 cameraSpacePositionPrev = modelViewMatrixPrev * vec4(transformedPosition, 1.0);

	vPosition = vec3(cameraSpacePosition);

	vClipPos = projectionMatrix * cameraSpacePosition;
	vClipPosPrev = projectionMatrix * cameraSpacePositionPrev;

	gl_Position = vClipPos;
}
