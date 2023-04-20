#include <versionPrecision>
#include <gBufferOut>

in vec3 vColor;
in vec2 vUv;
in vec3 vNormal;
in vec3 vPosition;
flat in int vTextureId;
flat in uint vObjectId;
in vec4 vClipPos;
in vec4 vClipPosPrev;

uniform PerMesh {
    mat4 modelViewMatrix;
    mat4 modelViewMatrixPrev;
    uint tileId;
};

uniform sampler2DArray tMap;

#include <packNormal>
#include <getMotionVector>
#include <getTBN>

vec4 getColorValue(int textureId, float mask, vec3 tintColor) {
    vec3 color = mix(vec3(1), tintColor, mask);
    return texture(tMap, vec3(vUv, textureId * 3)) * vec4(color, 1);
}

vec3 getMaskValue(int textureId) {
    return texture(tMap, vec3(vUv, textureId * 3 + 2)).xyz;
}

vec3 getNormalValue(int textureId) {
    mat3 tbn = getTBN(vNormal, vPosition, vec2(vUv.x, 1. - vUv.y));
    vec3 mapValue = texture(tMap, vec3(vUv, textureId * 3 + 1)).xyz * 2. - 1.;
    vec3 normal = normalize(tbn * mapValue);

    normal *= float(gl_FrontFacing) * 2. - 1.;

    return normal;
}

void main() {
    if (vTextureId == 0) {
        outColor = vec4(fract(vUv), 0, 1);
        outNormal = packNormal(vNormal);
        outRoughnessMetalnessF0 = vec3(0.9, 0, 0.03);
    } else {
        vec3 mask = getMaskValue(vTextureId - 1);

        outColor = getColorValue(vTextureId - 1, mask.b, vColor);
        outNormal = packNormal(getNormalValue(vTextureId - 1));
        outRoughnessMetalnessF0 = vec3(mask.r, mask.g, 0.03);
    }

    outMotion = getMotionVector(vClipPos, vClipPosPrev);
    outObjectId = vObjectId;
}