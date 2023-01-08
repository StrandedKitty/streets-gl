#include <versionPrecision>
#include <gBufferOut>

in vec2 vUv;
in vec3 vPosition;
in vec3 vLocalPosition;
in vec3 vNormal;
in vec3 vColor;
in vec4 vClipPos;
in vec4 vClipPosPrev;
in vec3 vCenter;
in vec2 vNormalUV;
flat in int vTextureId;

uniform PerMesh {
	mat4 modelViewMatrix;
	mat4 modelViewMatrixPrev;
	vec3 transformHeight;
	float terrainRingSize;
	vec4 terrainRingOffset;
	int terrainLevelId;
	float segmentCount;
};

uniform sampler2DArray tMap;
uniform sampler2D tNormal;

#include <packNormal>
#include <getMotionVector>
#include <sampleCatmullRom>
#include <getTBN>

float edgeFactor() {
	float widthFactor = 1.;
	vec3 d = fwidth(vCenter.xyz);
	vec3 a3 = smoothstep(vec3(0), d * widthFactor, vCenter.xyz);

	return min(min(a3.x, a3.y), a3.z);
}

vec3 getNormal(vec3 normalMapValue) {
	mat3 tbn = getTBN(vNormal, vPosition, vUv);
	vec3 mapValue = normalMapValue * 2. - 1.;
	vec3 normal = normalize(tbn * mapValue);

	normal *= float(gl_FrontFacing) * 2. - 1.;

	return normal;
}

void main() {
	vec2 mapUV = vLocalPosition.xz * 0.1;

	vec4 color = texture(tMap, vec3(mapUV, vTextureId * 3));
	vec3 normal = getNormal(texture(tMap, vec3(mapUV, vTextureId * 3 + 1)).xyz);
	vec3 mask = texture(tMap, vec3(mapUV, vTextureId * 3 + 2)).rgb;

	if (edgeFactor() > 0.9) {
		//discard;
	}

	vec3 heightMapNormal = sampleCatmullRom(tNormal, vNormalUV, vec2(textureSize(tNormal, 0))).xyz;
	vec3 kindaVNormal = vec3(modelViewMatrix * vec4(heightMapNormal, 0));

	outColor = color;
	//outColor = vec4(1, 0, 1, 1);
	outNormal = packNormal(kindaVNormal);
	outRoughnessMetalness = vec2(0.9, 0);
	outMotion = getMotionVector(vClipPos, vClipPosPrev);
	outObjectId = 0u;
}
