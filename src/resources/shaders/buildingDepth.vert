#version 300 es
precision highp float;

in vec3 position;
in vec2 uv;
in vec3 color;
in uint display;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

void main() {
	vec3 transformedPosition = position;
	vec4 cameraSpacePosition = modelViewMatrix * vec4(transformedPosition, 1.0);

	if(display > 0u) {
		gl_Position = vec4(2, 0, 0, 1);
		return;
	}

	gl_Position = projectionMatrix * cameraSpacePosition;
}
