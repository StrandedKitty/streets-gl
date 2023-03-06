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

uniform sampler2DArray tRoof;

#include <packNormal>
#include <getMotionVector>
#include <getTBN>

vec4 getRoofColor(int textureId, vec3 tintColor) {
    return texture(tRoof, vec3(vUv, textureId * 3)) * vec4(tintColor, 1);
}

vec3 getRoofMask(int textureId) {
    return texture(tRoof, vec3(vUv, textureId * 3 + 2)).xyz;
}

vec3 getRoofNormal(int textureId) {
    mat3 tbn = getTBN(vNormal, vPosition, vUv);
    vec3 mapValue = texture(tRoof, vec3(vUv, textureId * 3 + 1)).xyz * 2. - 1.;
    vec3 normal = normalize(tbn * mapValue);

    normal *= float(gl_FrontFacing) * 2. - 1.;

    return normal;
}

/*vec3 getFacadeNormal() {
    mat3 tbn = getTBN(vNormal, vPosition, vUv);
    vec3 mapValue = texture(tFacadeNormal, vec3(vUv * 0.02, 0)).xyz * 2. - 1.;
    vec3 normal = normalize(tbn * mapValue);

    normal *= float(gl_FrontFacing) * 2. - 1.;

    return normal;
}*/

void main() {
    if (vTextureId == 0) {
        outColor = vec4(fract(vUv), 0, 1);
        outNormal = packNormal(vNormal);
        outRoughnessMetalnessF0 = vec3(0.9, 0, 0.03);
    } else {
        outColor = getRoofColor(vTextureId - 1, vColor);
        outNormal = packNormal(getRoofNormal(vTextureId - 1));
        outRoughnessMetalnessF0 = getRoofMask(vTextureId - 1) + vec3(0, 0, 0.03);
    }

    outMotion = getMotionVector(vClipPos, vClipPosPrev);
    outObjectId = vObjectId;
}