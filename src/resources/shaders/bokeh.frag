#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp usampler2D;
precision highp sampler2DArray;
precision highp sampler3D;

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tColor;
uniform sampler2D tPosition;
uniform vec2 uPixelSize;
uniform float uFocusPoint;
uniform float uFar;

const float GOLDEN_ANGLE = 2.39996323;
const float MAX_BLUR_SIZE = 5.0;
const float RAD_SCALE = 0.5;
const float FOCUS_SCALE = 1.;

float getDepth(vec2 uv) {
    return -texture(tPosition, uv).z / uFar;
}

float getBlurSize(float depth, float focusPoint, float focusScale) {
    float coc = clamp((1.0 / focusPoint - 1.0 / depth) * focusScale, -1.0, 1.0);
    return abs(coc) * MAX_BLUR_SIZE;
}

vec3 depthOfField(vec2 texCoord, float focusPoint, float focusScale) {
    float centerDepth = getDepth(texCoord) * uFar;
    float centerSize = getBlurSize(centerDepth, focusPoint, focusScale);
    vec3 color = texture(tColor, texCoord).rgb;
    float tot = 1.0;

    float radius = RAD_SCALE;

    for (float ang = 0.0; radius < MAX_BLUR_SIZE; ang += GOLDEN_ANGLE) {
        vec2 tc = texCoord + vec2(cos(ang), sin(ang)) * uPixelSize * radius;

        vec3 sampleColor = texture(tColor, tc).rgb;
        float sampleDepth = getDepth(tc) * uFar;
        float sampleSize = getBlurSize(sampleDepth, focusPoint, focusScale);

        if (sampleDepth > centerDepth) {
            sampleSize = clamp(sampleSize, 0.0, centerSize * 2.0);
        }

        float m = smoothstep(radius - 0.5, radius + 0.5, sampleSize);
        color += mix(color / tot, sampleColor, m);
        tot += 1.0;
        radius += RAD_SCALE / radius;
    }

    return color /= tot;
}

void main() {
    vec3 dofColor = depthOfField(vUv, uFocusPoint, uFocusPoint * FOCUS_SCALE);

    FragColor = vec4(dofColor, 1);
}