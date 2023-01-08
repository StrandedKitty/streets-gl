#include <versionPrecision>
#include <gBufferOut>

in vec2 vUv;
in vec3 vNormal;
in vec3 vPosition;
in vec4 vClipPos;
in vec4 vClipPosPrev;
in vec3 vBiomeColor;

uniform PerMesh {
    mat4 modelViewMatrix;
    mat4 modelViewMatrixPrev;
};

uniform sampler2D grass;
uniform sampler2D grassNoise;
uniform sampler2D grassNormal;
uniform sampler2D waterNormal;
uniform float time;

#include <packNormal>
#include <getMotionVector>
#include <getTBN>
#include <textureNoTile>

vec3 getNormal(vec3 normalTextureValue) {
    mat3 tbn = getTBN(vNormal, vPosition, vUv);
    vec3 mapValue = normalTextureValue * 2. - 1.;
    mapValue.x *= 0.2;
    mapValue.y *= 0.2;
    vec3 normal = normalize(tbn * normalize(mapValue));

    normal *= float(gl_FrontFacing) * 2. - 1.;

    return normal;
}

void main() {
    outColor = vec4(textureNoTile(grassNoise, grass, vUv, 6.) * vBiomeColor, 0.5);

    /*float borderSize = 0.005;
    if(vUv.x > 1. - borderSize || vUv.y > 1. - borderSize || vUv.x < borderSize || vUv.y < borderSize) {
        outColor = vec4(1, 0, 0, 1);
    }*/

    float waveTime = time * 0.1;
    vec2 uvOffsets[3] = vec2[](
        vec2(0.4, 0) * waveTime,
        vec2(0.3, 0.1) * waveTime,
        vec2(0, 0.2) * waveTime
    );

    vec3 normalValue =
        texture(waterNormal, vUv * 2. + uvOffsets[0]).rgb * 0.4 +
        texture(waterNormal, vUv * 5. + uvOffsets[1]).rgb * 0.5 +
        texture(waterNormal, vUv * 9. + uvOffsets[2]).rgb * 0.1;

    outNormal = packNormal(getNormal(textureNoTile(grassNoise, grassNormal, vUv, 6.)));
    outRoughnessMetalness = vec2(0.9, 0);
    outMotion = getMotionVector(vClipPos, vClipPosPrev);
    outObjectId = 0u;
}
