#include <versionPrecision>
#include <gBufferOut>

in vec2 vNormalUV;
in vec2 vDetailUV;
in vec2 vMaskUV;
in vec3 vNormal;
in vec3 vPosition;
in vec4 vClipPos;
in vec4 vClipPosPrev;
in vec3 vCenter;
in vec3 vBiomeColor;

uniform PerMesh {
    mat4 modelViewMatrix;
    mat4 modelViewMatrixPrev;
    vec3 transformHeight;
    vec3 transformMask;
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
uniform sampler2D tWater;
uniform sampler2D tWaterMask;
uniform sampler2D tDetailColor;
uniform sampler2D tDetailNormal;
uniform sampler2D tDetailNoise;
uniform sampler2D tWaterNormal;
uniform sampler2D tWaterNormal2;

#include <packNormal>
#include <getMotionVector>
#include <sampleCatmullRom>
#include <getTBN>
#include <textureNoTile>

vec3 getNormal(vec3 normalTextureValue) {
    vec3 heightMapNormal = sampleCatmullRom(tNormal, vNormalUV, vec2(textureSize(tNormal, 0))).xyz;
    vec3 kindaVNormal = vec3(modelViewMatrix * vec4(heightMapNormal, 0));

    mat3 tbn = getTBN(normalize(kindaVNormal), vPosition, vDetailUV);
    vec3 mapValue = normalTextureValue * 2. - 1.;
    mapValue.x *= 0.2;
    mapValue.y *= 0.2;
    vec3 normal = normalize(tbn * normalize(mapValue));

    normal *= float(gl_FrontFacing) * 2. - 1.;

    return normal;
}

float edgeFactor() {
    float widthFactor = 1.;
    vec3 d = fwidth(vCenter.xyz);
    vec3 a3 = smoothstep(vec3(0), d * widthFactor, vCenter.xyz);

    return min(min(a3.x, a3.y), a3.z);
}

void main() {
    if (edgeFactor() > 0.9) {
        //discard;
    }

    float waterMask = 1.;

    if (vMaskUV.x >= 0. && vMaskUV.x <= 1. && vMaskUV.y >= 0. && vMaskUV.y <= 1.) {
        //waterMask = 1. - texture(tWaterMask, vMaskUV).r;
    }

    vec3 detailNormal = getNormal(textureNoTile(tDetailNoise, tDetailNormal, vDetailUV, 0.01));
    vec3 detailColor = textureNoTile(tDetailNoise, tDetailColor, vDetailUV, 0.01) * vBiomeColor;

    float waterFactor = texture(tWater, vNormalUV).r * waterMask;

    outColor = vec4(detailColor, 1);
    outNormal = packNormal(detailNormal);
    outRoughnessMetalness = vec2(0.9, 0);

    if (waterFactor > 0.5) {
        float waveTime = time * 0.015;
        vec3 normalValue = (
            texture(tWaterNormal2, vDetailUV * 0.005 + waveTime).rgb * 0.45 +
            texture(tWaterNormal2, vDetailUV * 0.020 - waveTime).rgb * 0.45 +
            texture(tWaterNormal2, vDetailUV * 0.0005 - waveTime * 0.5).rgb * 0.1
        );

        normalValue = normalValue * 2. - 1.;
        normalValue.z *= 2.;
        outColor = vec4(0.1, 0.25, 0.35, 1);

        vec3 vNormal = vec3(modelViewMatrix * vec4(normalize(normalValue.xzy), 0));
        outNormal = packNormal(vNormal);
        outRoughnessMetalness = vec2(0.05, 0);
    }

    outMotion = getMotionVector(vClipPos, vClipPosPrev);
    outObjectId = 0u;
}
