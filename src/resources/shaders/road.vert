#version 300 es
precision highp float;

in vec3 position;
in vec2 uv;
in vec3 normal;

out vec2 vUv;
out vec3 vPosition;
out vec3 vNormal;
out vec4 vClipPos;
out vec4 vClipPosPrev;
out vec3 vCenter;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 modelViewMatrixPrev;

void main() {
	vCenter = vec3(0);
	int centerIndex = gl_VertexID - 3 * int(float(gl_VertexID) / 3.);
	vCenter[centerIndex] = 1.;

	vUv = uv;
	vNormal = vec3(modelViewMatrix * vec4(normal, 0));

	vec3 transformedPosition = position;
	vec4 cameraSpacePosition = modelViewMatrix * vec4(transformedPosition, 1.0);
	vec4 cameraSpacePositionPrev = modelViewMatrixPrev * vec4(transformedPosition, 1.0);

	vPosition = vec3(cameraSpacePosition);

	vClipPos = projectionMatrix * cameraSpacePosition;
	vClipPosPrev = projectionMatrix * cameraSpacePositionPrev;

	gl_Position = vClipPos;
}
