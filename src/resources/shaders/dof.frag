#include <versionPrecision>

#define PI 3.141592653589793

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tCoC;

const float uBokehRadius = 6.;
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

/*const int kernelSampleCount = 71;
const vec2 kernel[kernelSampleCount] = vec2[](
vec2(0,0),
vec2(0.2758621,0),
vec2(0.1719972,0.21567768),
vec2(-0.061385095,0.26894566),
vec2(-0.24854316,0.1196921),
vec2(-0.24854316,-0.11969208),
vec2(-0.061384983,-0.2689457),
vec2(0.17199717,-0.21567771),
vec2(0.51724136,0),
vec2(0.46601835,0.22442262),
vec2(0.32249472,0.40439558),
vec2(0.11509705,0.50427306),
vec2(-0.11509704,0.50427306),
vec2(-0.3224948,0.40439552),
vec2(-0.46601835,0.22442265),
vec2(-0.51724136,0),
vec2(-0.46601835,-0.22442262),
vec2(-0.32249463,-0.40439564),
vec2(-0.11509683,-0.5042731),
vec2(0.11509732,-0.504273),
vec2(0.32249466,-0.40439564),
vec2(0.46601835,-0.22442262),
vec2(0.7586207,0),
vec2(0.7249173,0.22360738),
vec2(0.6268018,0.4273463),
vec2(0.47299224,0.59311354),
vec2(0.27715522,0.7061801),
vec2(0.056691725,0.75649947),
vec2(-0.168809,0.7396005),
vec2(-0.3793104,0.65698475),
vec2(-0.55610836,0.51599306),
vec2(-0.6834936,0.32915324),
vec2(-0.7501475,0.113066405),
vec2(-0.7501475,-0.11306671),
vec2(-0.6834936,-0.32915318),
vec2(-0.5561083,-0.5159932),
vec2(-0.37931028,-0.6569848),
vec2(-0.16880904,-0.7396005),
vec2(0.056691945,-0.7564994),
vec2(0.2771556,-0.7061799),
vec2(0.47299215,-0.59311366),
vec2(0.62680185,-0.4273462),
vec2(0.72491735,-0.22360711),
vec2(1,0),
vec2(0.9749279,0.22252093),
vec2(0.90096885,0.43388376),
vec2(0.7818315,0.6234898),
vec2(0.6234898,0.7818315),
vec2(0.43388364,0.9009689),
vec2(0.22252098,0.9749279),
vec2(0,1),
vec2(-0.22252095,0.9749279),
vec2(-0.43388385,0.90096885),
vec2(-0.62349,0.7818314),
vec2(-0.7818317,0.62348956),
vec2(-0.90096885,0.43388382),
vec2(-0.9749279,0.22252093),
vec2(-1,0),
vec2(-0.9749279,-0.22252087),
vec2(-0.90096885,-0.43388376),
vec2(-0.7818314,-0.6234899),
vec2(-0.6234896,-0.7818316),
vec2(-0.43388346,-0.900969),
vec2(-0.22252055,-0.974928),
vec2(0,-1),
vec2(0.2225215,-0.9749278),
vec2(0.4338835,-0.90096897),
vec2(0.6234897,-0.7818316),
vec2(0.78183144,-0.62348986),
vec2(0.90096885,-0.43388376),
vec2(0.9749279,-0.22252086)
);*/

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

        float bgw = Weigh(max(min(center.a, samp.a), 0.), radius);
        bgColor += samp.rgb * bgw;
        bgWeight += bgw;

        float fgw = Weigh(-samp.a, radius);
        fgColor += samp.rgb * fgw;
        fgWeight += fgw;
    }
    bgColor *= 1. / (bgWeight + float(bgWeight == 0.));
    fgColor *= 1. / (fgWeight + float(fgWeight == 0.));

    float bgfg = min(1., fgWeight * PI / float(kernelSampleCount));
    vec3 color = mix(bgColor, fgColor, bgfg);

    FragColor = vec4(color, bgfg);
}