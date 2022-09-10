#include <versionPrecision>

in vec3 position;
in vec2 uv;
in vec3 normal;
in vec3 color;
in uint textureId;
in uint localId;
in uint display;

uniform MainBlock {
	mat4 modelViewMatrix;
	mat4 projectionMatrix;
	uint selectedId;
};

void main() {
	if(localId != selectedId) {
		gl_Position = vec4(2, 0, 0, 1);
		return;
	}

	vec3 transformedPosition = position;
	vec4 cameraSpacePosition = modelViewMatrix * vec4(transformedPosition, 1.);

	gl_Position = projectionMatrix * cameraSpacePosition;
}