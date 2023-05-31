#include <versionPrecision>
#include <gBufferOut>

#define USED_TEXTURE_SCALE 8000.
#define GRASS_SCALE 8.

in vec4 vNormalUV;
in vec2 vDetailUV;
in vec2 vWaterUV;
in vec2 vMaskUV;
in vec3 vNormal;
in vec3 vPosition;
in vec4 vClipPos;
in vec4 vClipPosPrev;
in vec3 vCenter;
in vec3 vBiomeColor;
in float vMixFactor;

uniform PerMesh {
    mat4 modelViewMatrix;
    mat4 modelViewMatrixPrev;
    vec4 transformNormal0;
    vec4 transformNormal1;
    vec4 transformWater0;
    vec4 transformWater1;
    vec3 transformMask;
    float size;
    float segmentCount;
    vec2 detailTextureOffset;
    int levelId;
    vec2 cameraPosition;
};

uniform PerMaterial {
    mat4 projectionMatrix;
    vec2 biomeCoordinates;
    float time;
    vec2 usageRange;
};

uniform sampler2DArray tNormal;

uniform sampler2DArray tWater;
uniform sampler2D tWaterMask;

uniform sampler2DArray tUsage;
uniform sampler2D tUsageMask;

uniform sampler2DArray tUsageMaps;
uniform sampler2DArray tDetailMaps;
uniform sampler2D tDetailNoise;
uniform sampler2D tWaterNormal;

#include <packNormal>
#include <getMotionVector>
#include <sampleCatmullRom>
#include <getTBN>
#include <textureNoTile>
#include <sampleWaterNormal>
#include <RNM>

vec3 sampleNormalMap() {
    vec2 size = vec2(textureSize(tNormal, 0));
    vec3 level0 = sampleCatmullRom(tNormal, vec3(vNormalUV.xy, 0), size).xyz;
    vec3 level1 = sampleCatmullRom(tNormal, vec3(vNormalUV.zw, 1), size).xyz;
    float factor = smoothstep(NORMAL_MIX_FROM, NORMAL_MIX_TO, vMixFactor);

    return mix(level0, level1, factor);
}

vec3 getNormal(vec3 normalTextureValue) {
    #if USE_HEIGHT == 1
        vec3 heightMapNormal = sampleNormalMap();
    #else
        vec3 heightMapNormal = vec3(0, 1, 0);
    #endif

    vec3 normalMapUnpacked = normalTextureValue * 2. - 1.;
    vec3 reorientedNormal = normalBlendUnpackedRNM(heightMapNormal, normalMapUnpacked);

    return vec3(modelViewMatrix * vec4(reorientedNormal, 0));
}

float edgeFactor() {
    float widthFactor = 1.;
    vec3 d = fwidth(vCenter.xyz);
    vec3 a3 = smoothstep(vec3(0), d * widthFactor, vCenter.xyz);

    return min(min(a3.x, a3.y), a3.z);
}

vec3 getWaterNormalMapValue(vec2 uv) {
    vec3 col = texture(tWaterNormal, uv).rgb;
    col.y = 1. - col.y;
    return col * 2. - 1.;
}

bool isPointMasked(vec2 maskUV, sampler2D mask) {
    vec2 size = vec2(textureSize(mask, 0));
    return texelFetch(mask, ivec2(maskUV * size), 0).r > 0.5;
}

float remap(float value, float from1, float to1, float from2, float to2) {
    return (value - from1) / (to1 - from1) * (to2 - from2) + from2;
}

// http://untitledgam.es/2017/01/height-blending-shader/
vec3 heightblend(vec3 input1, float height1, vec3 input2, float height2) {
    float height_start = max(height1, height2) - 0.02;
    float level1 = max(height1 - height_start, 0.);
    float level2 = max(height2 - height_start, 0.);
    return ((input1 * level1) + (input2 * level2)) / (level1 + level2);
}

void main() {
    if (edgeFactor() > 0.9) {
        //discard;
    }

    float waterMask = 1.;

    if (
        vMaskUV.x >= 0. && vMaskUV.x <= 1. && vMaskUV.y >= 0. && vMaskUV.y <= 1. &&
        isPointMasked(vMaskUV, tWaterMask)
    ) {
        waterMask = 0.;
    }

    float usageFactor = 0.;

    if (vMaskUV.x >= 0. && vMaskUV.x <= 1. && vMaskUV.y >= 0. && vMaskUV.y <= 1.) {
        vec2 usageMaskSize = vec2(textureSize(tUsageMask, 0));
        vec2 usageTextureSize = vec2(textureSize(tUsage, 0));

        vec2 maskTexelUV = vMaskUV * usageMaskSize;
        float tileId = texelFetch(tUsageMask, ivec2(maskTexelUV), 0).r;

        vec2 tileUV = fract(maskTexelUV);

        tileUV *= usageTextureSize / (usageTextureSize + USAGE_TEXTURE_PADDING * 2.);
        tileUV += USAGE_TEXTURE_PADDING / usageTextureSize;

        float layerIndex = floor(tileId * 255.);

        if (layerIndex != 255.) {
            usageFactor = 1. - texture(tUsage, vec3(tileUV, layerIndex)).r;
        }
    }

    vec2 normalizedTileUV = fract(vDetailUV / (TILE_SIZE * DETAIL_UV_SCALE));
    vec3 detailNormal = textureNoTile(tDetailNoise, tDetailMaps, 1., normalizedTileUV, DETAIL_UV_SCALE * GRASS_SCALE, GRASS_SCALE);
    vec3 detailColor = textureNoTile(tDetailNoise, tDetailMaps, 0., normalizedTileUV, DETAIL_UV_SCALE * GRASS_SCALE, GRASS_SCALE) * vBiomeColor;

    vec3 waterUV = vec3(0);
    waterUV.xy = transformWater0.xy + vWaterUV * transformWater0.zw;

    if (vMixFactor > 7300.) {
        waterUV.xy = transformWater1.xy + vWaterUV * transformWater1.zw;
        waterUV.z = 1.;
    }

    float waterSample = texture(tWater, waterUV).r;
    float waterFactor = waterSample * waterMask;

    outColor = vec4(detailColor, 1);
    outGlow = vec3(0);
    outNormal = packNormal(getNormal(detailNormal));
    outRoughnessMetalnessF0 = vec3(0.8, 0, 0.005);

    usageFactor = remap(usageFactor, -0.2, 2., 0., 1.);

    vec3 usedTerrainColor = texture(tUsageMaps, vec3(normalizedTileUV * USED_TEXTURE_SCALE, 0)).rgb;
    float usedTerrainHeight = texture(tUsageMaps, vec3(normalizedTileUV * USED_TEXTURE_SCALE, 1)).r;

    outColor.rgb = heightblend(outColor.rgb, 1. - usageFactor, usedTerrainColor, usedTerrainHeight);

    if (waterFactor > 0.5) {
        vec2 normalizedTileUV = fract(vDetailUV / (TILE_SIZE * DETAIL_UV_SCALE));
        normalizedTileUV = vec2(normalizedTileUV.y, 1. - normalizedTileUV.x);

        vec3 waterNormal = sampleWaterNormal(tWaterNormal, tDetailNoise, normalizedTileUV, time);
        vec3 mvWaterNormal = vec3(modelViewMatrix * vec4(waterNormal, 0));

        outColor = vec4(0.15, 0.2, 0.25, 0.5);
        outGlow = vec3(0);
        outNormal = packNormal(mvWaterNormal);
        outRoughnessMetalnessF0 = vec3(0.05, 0, 0.03);
    }

    outMotion = getMotionVector(vClipPos, vClipPosPrev);
    outObjectId = 0u;

    vec2 maskTexelUV = vMaskUV * vec2(textureSize(tUsageMask, 0));
    vec2 tileUV = fract(maskTexelUV);

    if (tileUV.x < 0.001 || tileUV.x > 0.999 || tileUV.y < 0.001 || tileUV.y > 0.999) {
        outColor = vec4(1, 0, 0, 1);
    }
}
