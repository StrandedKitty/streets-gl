#include <versionPrecision>

in vec3 position;
in vec2 uv;
in vec3 normal;
in vec3 color;
in uint textureId;
in uint localId;
in uint display;

uniform PerMesh {
	mat4 modelViewMatrix;
};

uniform PerMaterial {
	mat4 projectionMatrix;
};

void main() {
	if(display > 0u) {
		gl_Position = vec4(2, 0, 0, 1);
		return;
	}

	vec3 transformedPosition = position;
	vec4 cameraSpacePosition = modelViewMatrix * vec4(transformedPosition, 1.);

	gl_Position = projectionMatrix * cameraSpacePosition;
}