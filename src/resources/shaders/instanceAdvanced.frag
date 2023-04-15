#include <versionPrecision>
#include <gBufferOut>

in vec2 vUv;
in vec3 vNormal;
in vec3 vPosition;
in vec4 vClipPos;
in vec4 vClipPosPrev;

uniform MainBlock {
    mat4 projectionMatrix;
    mat4 modelMatrix;
    mat4 viewMatrix;
    mat4 modelViewMatrixPrev;
};

uniform PerInstanceType {
    float textureId;
};

uniform sampler2DArray tMap;

#include <packNormal>
#include <getMotionVector>
#include <getTBN>

vec4 readDiffuse(vec2 uv) {
    return texture(tMap, vec3(uv, textureId * 2.));
}

vec4 readNormal(vec2 uv) {
    return texture(tMap, vec3(uv, textureId * 2. + 1.));
}

vec3 getNormal() {
    mat3 tbn = getTBN(vNormal, vPosition, vUv);
    vec3 mapValue = readNormal(vUv).xyz * 2. - 1.;
    vec3 normal = normalize(tbn * mapValue);

    normal *= float(gl_FrontFacing) * 2. - 1.;

    return normal;
}

void main() {
    vec4 color = readDiffuse(vUv);

    outColor = vec4(color.rgb, 1);
    outNormal = packNormal(getNormal());
    outRoughnessMetalnessF0 = vec3(0.8, 0, 0.03);
    outMotion = getMotionVector(vClipPos, vClipPosPrev);
    outObjectId = 0u;
}
