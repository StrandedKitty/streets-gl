#include <versionPrecision>

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tDepth;

uniform MainBlock {
    mat4 projectionMatrixInverse;
    vec2 pointerPosition;
    float distanceToGround;
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
    float focusDistance = getDepth(pointerPosition);
    float size = getCoC(depth, focusDistance) * float(textureSize(tDepth, 0).y) * 0.5; // in pixels

    FragColor = vec4(size);
}