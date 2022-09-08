#include <versionPrecision>

in vec3 position;
in vec2 uv;
in vec3 normal;

uniform PerMesh {
	mat4 modelViewMatrix;
};

uniform PerMaterial {
	mat4 projectionMatrix;
};

void main() {
	vec3 transformedPosition = position;
	vec4 cameraSpacePosition = modelViewMatrix * vec4(transformedPosition, 1.0);

	gl_Position = projectionMatrix * cameraSpacePosition;
}
