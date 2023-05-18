#include <versionPrecision>

out float FragColor;

in vec2 vUv;

uniform sampler2D tMap;

void main() {
    ivec2 pos = ivec2(gl_FragCoord.xy) * 2;

    float a = texelFetch(tMap, pos, 0).x * 255.;
    float b = texelFetch(tMap, pos + ivec2(1, 0), 0).x * 255.;
    float c = texelFetch(tMap, pos + ivec2(0, 1), 0).x * 255.;
    float d = texelFetch(tMap, pos + ivec2(1, 1), 0).x * 255.;

    #if UNPACK_POWER == 1
        FragColor = (sqrt(a) + sqrt(b) + sqrt(c) + sqrt(d)) * 0.25 / 255. * 20.;
    #else
        FragColor = (a + b + c + d) * 0.25 / 255.;
    #endif
}