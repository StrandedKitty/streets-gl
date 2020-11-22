#version 300 es
precision highp float;

in vec3 position;
in vec2 uv;
in vec3 color;
in uint display;
in uint textureId;

out vec2 vUv;
out vec3 vPosition;
out vec3 vColor;
out vec4 vClipPos;
out vec4 vClipPosPrev;
flat out int vTextureId;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 modelViewMatrixPrev;

void main() {
	if(display > 0u) {
		gl_Position = vec4(2, 0, 0, 1);
		return;
	}

	vUv = uv;
	vColor = color;
	vTextureId = int(textureId);

	vec3 transformedPosition = position;
	vec4 cameraSpacePosition = modelViewMatrix * vec4(transformedPosition, 1.0);
	vec4 cameraSpacePositionPrev = modelViewMatrixPrev * vec4(transformedPosition, 1.0);

	vPosition = vec3(cameraSpacePosition);

	vClipPos = projectionMatrix * cameraSpacePosition;
	vClipPosPrev = projectionMatrix * cameraSpacePositionPrev;

	gl_Position = vClipPos;
}
