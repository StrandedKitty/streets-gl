#include <versionPrecision>

in vec3 position;
in vec3 normal;
in vec3 color;

out vec3 vColor;
out vec3 vNormal;
out vec3 vPosition;
out vec4 vClipPos;
out vec4 vClipPosPrev;

uniform MainBlock {
	mat4 projectionMatrix;
	mat4 modelMatrix;          // precision pivot: pure translation by the instances origin
	mat4 viewMatrix;
	mat4 modelViewMatrixPrev;
	mat4 carMatrix;            // origin-relative full transform (translate + yaw/pitch/roll)
	mat4 carMatrixPrev;        // same, from the PREVIOUS frame — needed for correct TAA motion
};

void main() {
	vColor = color;

	// carMatrix places the local mesh at (pose - origin) with full orientation; modelMatrix then
	// adds the large origin translation, kept separate from viewMatrix to avoid float jitter.
	vec4 localPos = carMatrix * vec4(position, 1.0);
	vec4 localPosPrev = carMatrixPrev * vec4(position, 1.0);
	vec4 cameraSpacePosition = viewMatrix * modelMatrix * localPos;
	vec4 cameraSpacePositionPrev = modelViewMatrixPrev * localPosPrev;

	vec3 worldNormal = normalize((carMatrix * vec4(normal, 0.0)).xyz);
	vNormal = normalize((viewMatrix * vec4(worldNormal, 0.0)).xyz);

	vPosition = vec3(cameraSpacePosition);
	vClipPos = projectionMatrix * cameraSpacePosition;
	vClipPosPrev = projectionMatrix * cameraSpacePositionPrev;

	gl_Position = vClipPos;
}
