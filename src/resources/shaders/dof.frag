#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp usampler2D;
precision highp sampler2DArray;
precision highp sampler3D;

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tCoC;
uniform float uBokehRadius;

const int kernelSampleCount = 22;
const vec2 kernel[kernelSampleCount] = vec2[](
    vec2(0, 0),
    vec2(0.53333336, 0),
    vec2(0.3325279, 0.4169768),
    vec2(-0.11867785, 0.5199616),
    vec2(-0.48051673, 0.2314047),
    vec2(-0.48051673, -0.23140468),
    vec2(-0.11867763, -0.51996166),
    vec2(0.33252785, -0.4169769),
    vec2(1, 0),
    vec2(0.90096885, 0.43388376),
    vec2(0.6234898, 0.7818315),
    vec2(0.22252098, 0.9749279),
    vec2(-0.22252095, 0.9749279),
    vec2(-0.62349, 0.7818314),
    vec2(-0.90096885, 0.43388382),
    vec2(-1, 0),
    vec2(-0.90096885, -0.43388376),
    vec2(-0.6234896, -0.7818316),
    vec2(-0.22252055, -0.974928),
    vec2(0.2225215, -0.9749278),
    vec2(0.6234897, -0.7818316),
    vec2(0.90096885, -0.43388376)
);

float saturate(float v) {
    return clamp(v, 0., 1.);
}

float Weigh(float coc, float radius) {
    return saturate((coc - radius + 2.) / 2.);
}

void main() {
    vec2 texelSize = 1. / vec2(textureSize(tCoC, 0));

    vec4 center = texture(tCoC, vUv);

    vec3 bgColor = vec3(0), fgColor = vec3(0);
    float bgWeight = 0., fgWeight = 0.;

    for (int k = 0; k < kernelSampleCount; k++) {
        vec2 offset = kernel[k] * uBokehRadius;
        float radius = length(offset);

        offset *= texelSize.xy;
        vec4 samp = texture(tCoC, vUv + offset);

        float bgw = Weigh(max(min(center.a, samp.a), 0.0), radius);
        bgColor += samp.rgb * bgw;
        bgWeight += bgw;

        float fgw = Weigh(-samp.a, radius);
        fgColor += samp.rgb * fgw;
        fgWeight += fgw;
    }
    bgColor *= 1. / (bgWeight + float(bgWeight == 0.));
    fgColor *= 1. / (fgWeight + float(fgWeight == 0.));

    float bgfg = min(1., fgWeight * 3.14159265359 / float(kernelSampleCount));;
    vec3 color = mix(bgColor, fgColor, bgfg);

    FragColor = vec4(color, bgfg);
}