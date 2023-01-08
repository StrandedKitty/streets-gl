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

uniform sampler2DArray tRoofColor;
uniform sampler2DArray tRoofNormal;

#include <packNormal>
#include <getMotionVector>
#include <getTBN>

vec3 getRoofNormal() {
    mat3 tbn = getTBN(vNormal, vPosition, vUv);
    vec3 mapValue = texture(tRoofNormal, vec3(vUv, vTextureId - 1)).xyz * 2. - 1.;
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
    if(vTextureId == 0) {
        outColor = vec4(vColor, 1);
        outNormal = packNormal(vNormal);
    } else {
        outColor = texture(tRoofColor, vec3(vUv, vTextureId - 1)) * vec4(vColor, 1);
        outNormal = packNormal(getRoofNormal());
    }

    outRoughnessMetalness = vec2(0.9, 0);
    outMotion = getMotionVector(vClipPos, vClipPosPrev);
    outObjectId = vObjectId;
}