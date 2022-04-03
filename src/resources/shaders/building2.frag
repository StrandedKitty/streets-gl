#include <versionPrecision>
#include <gBufferOut>

in vec3 vColor;
in vec3 vNormal;
in vec3 vPosition;
in vec4 vClipPos;
in vec4 vClipPosPrev;

uniform PerMesh {
    mat4 modelViewMatrix;
    mat4 modelViewMatrixPrev;
};

#include <packNormal>
#include <getMotionVector>

void main() {
    vec3 n = vec3(modelViewMatrix * vec4(vNormal, 0));
    float fr = dot(n, vec3(0, 0, 1));

    outColor = vec4(vColor * fr, 1);
    outNormal = packNormal(vNormal);
    outPosition = vPosition;
    outMotion = getMotionVector(vClipPos, vClipPosPrev);
}