#include <versionPrecision>
out vec4 FragColor;

in vec2 vUv;
in float vDistance;

uniform Uniforms {
    mat4 modelViewMatrix;
    mat4 modelViewMatrixNoRotation;
    mat4 projectionMatrix;
    vec2 resolution;
};

uniform sampler2D tSDF;

const float bufferValue = 0.47;
const float outlineBufferValue = 0.3;

void main() {
    float smoothing = 0.075;
    float distance = texture(tSDF, vUv).r;
    float alpha = smoothstep(bufferValue - smoothing, bufferValue + smoothing, distance);
    float outlineAlpha = smoothstep(outlineBufferValue - smoothing, outlineBufferValue + smoothing, distance);

    FragColor = vec4(mix(vec3(0), vec3(1), alpha), outlineAlpha);

    FragColor.a *= min(1., vDistance / 200.);
}