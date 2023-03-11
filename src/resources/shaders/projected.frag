#include <versionPrecision>
#include <gBufferOut>

in vec2 vUv;
in vec3 vPosition;
in vec3 vLocalPosition;
in vec3 vNormal;
flat in int vNormalFollowsGround;
in vec3 vColor;
in vec4 vClipPos;
in vec4 vClipPosPrev;
in vec3 vCenter;
in vec4 vNormalUV;
flat in int vTextureId;
in float vNormalMixFactor;

uniform PerMesh {
	mat4 modelViewMatrix;
	mat4 modelViewMatrixPrev;
	vec4 transformNormal0;
	vec4 transformNormal1;
	float terrainRingSize;
	vec4 terrainRingOffset;
	int terrainLevelId;
	float segmentCount;
	vec2 cameraPosition;
};

uniform PerMaterial {
	mat4 projectionMatrix;
	float time;
};

uniform sampler2DArray tMap;
uniform sampler2DArray tNormal;
uniform sampler2D tWaterNormal;

#include <packNormal>
#include <getMotionVector>
#include <sampleCatmullRom>
#include <getTBN>
#include <sampleWaterNormal>

vec3 sampleNormalMap() {
	vec2 size = vec2(textureSize(tNormal, 0));
	vec3 level0 = sampleCatmullRom(tNormal, vec3(vNormalUV.xy, 0), size).xyz;
	vec3 level1 = sampleCatmullRom(tNormal, vec3(vNormalUV.zw, 1), size).xyz;
	float factor = smoothstep(NORMAL_MIX_FROM, NORMAL_MIX_TO, vNormalMixFactor);

	return mix(level0, level1, factor);
}

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

vec3 normalsReorient(vec3 v1, vec3 v2) {
	vec3 n1 = v1 * vec3( 2,  2, 2) + vec3(-1, -1,  0);
	vec3 n2 = v2 * vec3(-2, -2, 2) + vec3( 1,  1, -1);

	return n1 * dot(n1, n2) / n1.z - n2;
}

void main() {
	if (edgeFactor() > 0.9) {
		//discard;
	}

	if (vTextureId == 0) {
		vec2 normalizedUV = vUv / 611.4962158203125;
		vec3 waterNormal = sampleWaterNormal(normalizedUV, time, tWaterNormal);
		vec3 mvWaterNormal = vec3(modelViewMatrix * vec4(waterNormal, 0));

		outColor = vec4(0.15, 0.2, 0.25, 0.5);
		outNormal = packNormal(mvWaterNormal);
		outRoughnessMetalnessF0 = vec3(0.05, 0, 0.03);
		outMotion = getMotionVector(vClipPos, vClipPosPrev);
		outObjectId = 0u;

		return;
	}

	vec2 mapUV = vUv;

	int layer = (vTextureId - 1) * 3;
	vec4 color = texture(tMap, vec3(mapUV, layer));
	vec3 normal = texture(tMap, vec3(mapUV, layer + 1)).xyz;
	//vec3 normal = texture(tMap, vec3(mapUV, layer + 1)).xyz * 2. - 1.;
	vec3 mask = texture(tMap, vec3(mapUV, layer + 2)).rgb;

	if (color.a < 0.5) {
		discard;
	}

	vec3 heightMapNormal = sampleNormalMap();
	vec3 kindaVNormal = (vNormalFollowsGround == 1) ?
		vec3(modelViewMatrix * vec4(heightMapNormal, 0)) :
		getNormal(normal);

	outColor = color;
	outNormal = packNormal(kindaVNormal);
	outRoughnessMetalnessF0 = vec3(mask.xy, 0.03);
	outMotion = getMotionVector(vClipPos, vClipPosPrev);
	outObjectId = 0u;
}
