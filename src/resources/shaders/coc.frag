#include <versionPrecision>

#define SENSOR_HEIGHT 0.024
#define FOCAL_LENGTH 0.033 // vertical FOV 40 degrees
#define F_NUMBER 0.01

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tDepth;

uniform MainBlock {
    mat4 projectionMatrixInverse;
};

#include <reconstructPositionFromDepth>

float getDepth(vec2 uv) {
    return -reconstructPositionFromDepth(uv, texture(tDepth, uv).r, projectionMatrixInverse).z;
}

float getCoC(float depth, float focusPoint) {
    return (FOCAL_LENGTH / F_NUMBER) * (depth - focusPoint) / depth * FOCAL_LENGTH / (focusPoint - FOCAL_LENGTH) / SENSOR_HEIGHT;
}

void main() {
    float depth = getDepth(vUv);
    float focusDistance = getDepth(vec2(0.5));
    float size = getCoC(depth, focusDistance) * float(textureSize(tDepth, 0).y) * 0.5; // in pixels

    FragColor = vec4(size);
}