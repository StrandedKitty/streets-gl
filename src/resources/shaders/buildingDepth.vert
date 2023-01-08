#include <versionPrecision>

in vec3 position;

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
