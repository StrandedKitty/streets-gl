#include <versionPrecision>
#include <gBufferOut>

in vec3 vNormal;
in vec4 vClipPos;
in vec4 vClipPosPrev;

#include <packNormal>
#include <getMotionVector>

vec3 getSkyboxColor(vec3 normal) {
    float normalY = normalize(normal).y;
    vec3 color1 = vec3(8. / 255., 118. / 255., 64. / 255.);
    vec3 color2 = mix(vec3(109. / 255., 213. / 255., 255. / 255.), vec3(1, 1, 1), smoothstep(0., 0.8, normalY));

    return mix(color1, color2, smoothstep(-0.01, 0.01, normalY));
}

void main() {
    outColor = vec4(getSkyboxColor(vNormal), 1);
    outNormal = packNormal(vNormal);
    outPosition = vec3(0, 0, -1e8);
    outMotion = getMotionVector(vClipPos, vClipPosPrev);
    outObjectId = 0u;
}