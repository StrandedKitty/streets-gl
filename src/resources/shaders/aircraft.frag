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
    float textureId;
};

uniform sampler2DArray tColor;
uniform sampler2DArray tNormal;

#include <packNormal>
#include <getMotionVector>
#include <getTBN>

vec4 readDiffuse(vec2 uv) {
    return texture(tColor, vec3(uv, textureId));
}

vec4 readNormal(vec2 uv) {
    return texture(tNormal, vec3(uv, textureId));
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

    if (color.a < 0.5) {
        //discard;
    }

    outColor = vec4(color.rgb * 1.5, 1);
    outNormal = packNormal(getNormal());
    outPosition = vPosition;
    outMotion = getMotionVector(vClipPos, vClipPosPrev);
    outObjectId = 0u;
}
