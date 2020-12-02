#version 300 es
precision highp int;
precision highp float;

in vec3 position;
in vec2 uv;
in vec3 color;
in uint localId;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform uint objectId;

void main() {
	vec3 transformedPosition = position;
	vec4 cameraSpacePosition = modelViewMatrix * vec4(transformedPosition, 1.0);

	if(localId != objectId) {
		gl_Position = vec4(2, 0, 0, 1);
		return;
	}

	gl_Position = projectionMatrix * cameraSpacePosition;
}
