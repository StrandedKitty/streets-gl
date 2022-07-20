#include <versionPrecision>
#include <gBufferOut>

in vec3 vNormal;
in vec4 vClipPos;
in vec4 vClipPosPrev;

#include <packNormal>
#include <getMotionVector>

void main() {
    outColor = vec4(109. / 255., 213. / 255., 1., 1);
    outNormal = packNormal(vNormal);
    outPosition = vec3(0, 0, -1e8);
    outMotion = getMotionVector(vClipPos, vClipPosPrev);
    outObjectId = 0u;
}