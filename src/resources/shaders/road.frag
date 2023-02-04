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

uniform sampler2DArray tMap;
uniform sampler2DArray tNormal;

#include <packNormal>
#include <getMotionVector>
#include <sampleCatmullRom>
#include <getTBN>

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

void main() {
	vec2 mapUV = vLocalPosition.xz * 0.1;

	vec4 color = texture(tMap, vec3(mapUV, vTextureId * 3));
	vec3 normal = getNormal(texture(tMap, vec3(mapUV, vTextureId * 3 + 1)).xyz);
	vec3 mask = texture(tMap, vec3(mapUV, vTextureId * 3 + 2)).rgb;

	if (edgeFactor() > 0.9) {
		//discard;
	}

	vec3 heightMapNormal = sampleNormalMap();
	vec3 kindaVNormal = vec3(modelViewMatrix * vec4(heightMapNormal, 0));

	outColor = color;
	//outColor = vec4(1, 0, 1, 1);
	outNormal = packNormal(kindaVNormal);
	outRoughnessMetalnessF0 = vec3(0.9, 0, 0.03);
	outMotion = getMotionVector(vClipPos, vClipPosPrev);
	outObjectId = 0u;
}
