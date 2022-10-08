#include <versionPrecision>
#include <gBufferOut>

in vec3 vNormal;
in vec3 vPosition;
in vec4 vClipPos;
in vec4 vClipPosPrev;

#include <packNormal>
#include <getMotionVector>

void main() {
    outColor = vec4(109. / 255., 213. / 255., 1., 0);
    outNormal = packNormal(vNormal);
    outPosition = vPosition;
    outMotion = getMotionVector(vClipPos, vClipPosPrev);
    outObjectId = 0u;
}