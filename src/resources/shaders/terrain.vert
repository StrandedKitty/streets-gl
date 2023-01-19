#include <versionPrecision>

in vec3 position;
in vec2 uv;
out vec4 vClipPos;
out vec4 vClipPosPrev;

out vec2 vNormalUV;
out vec2 vDetailUV;
out vec3 vWaterUV;
out vec2 vUv;
out vec2 vMaskUV;
out vec3 vNormal;
out vec3 vPosition;
out vec3 vCenter;
out vec3 vBiomeColor;

uniform PerMesh {
	mat4 modelViewMatrix;
	mat4 modelViewMatrixPrev;
	vec3 transformHeight;
	vec3 transformMask;
	vec4 transformWater0;
	vec4 transformWater1;
	float size;
	float segmentCount;
	vec2 detailTextureOffset;
	int levelId;
};

uniform PerMaterial {
	mat4 projectionMatrix;
	vec2 biomeCoordinates;
	float time;
};

uniform sampler2DArray tRingHeight;
uniform sampler2D tNormal;
uniform sampler2D tBiomeMap;

void main() {
	vBiomeColor = texture(tBiomeMap, biomeCoordinates).rgb * 1.5;

	vCenter = vec3(0);
	int centerIndex = gl_VertexID - 3 * int(float(gl_VertexID) / 3.);
	vCenter[centerIndex] = 1.;

	vNormal = vec3(modelViewMatrix * vec4(vec3(0, 1, 0), 0));

	vec2 heightUV = vec2(1. - uv.y, uv.x);
	//heightUV.y = 1. - heightUV.y;

	vNormalUV = transformHeight.xy + heightUV * transformHeight.z;
	vDetailUV = (vec2(uv.x, 1. - uv.y) * size + detailTextureOffset);
	vMaskUV = transformMask.xy + heightUV * transformMask.z;
	vMaskUV = vec2(vMaskUV.y, 1. - vMaskUV.x);

	vUv = vec2(1. - uv.y, uv.x);

	float height = texture(tRingHeight, vec3(uv * segmentCount / (segmentCount + 1.), levelId)).r;

	vec3 transformedPosition = position.xyz + vec3(0, height, 0);
	vec4 cameraSpacePosition = modelViewMatrix * vec4(transformedPosition, 1.0);
	vec4 cameraSpacePositionPrev = modelViewMatrixPrev * vec4(transformedPosition, 1.0);

	vPosition = vec3(cameraSpacePosition);

	vClipPos = projectionMatrix * cameraSpacePosition;
	vClipPosPrev = projectionMatrix * cameraSpacePositionPrev;

	gl_Position = vClipPos;
}
