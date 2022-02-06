#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp usampler2D;
precision highp sampler2DArray;
precision highp sampler3D;

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tPosition;
uniform float uFocusPoint;
uniform float uFar;
uniform float uCoCScale;
uniform float uFocusScale;

float getDepth(vec2 uv) {
    return -texture(tPosition, uv).z / uFar;
}

float getCoC(float depth, float focusPoint, float focusScale) {
    float coc = clamp((1.0 / focusPoint - 1.0 / depth) * focusScale, -1.0, 1.0);
    return min(coc * uCoCScale, 50.);
}

void main() {
    float depth = getDepth(vUv) * uFar;
    float size = getCoC(depth, uFocusPoint, uFocusPoint * uFocusScale);

    FragColor = vec4(vec3(size), 1);
}