#include <versionPrecision>

out vec4 FragColor;

in vec2 vUv;

uniform MainBlock {
    vec2 direction;
    float beta;
};

uniform sampler2D tMap;

void main() {
    ivec2 texelPos = ivec2(gl_FragCoord.xy);

    float center = texelFetch(tMap, texelPos, 0).x;
    float left = beta + texelFetch(tMap, texelPos - ivec2(direction), 0).x;
    float right = beta + texelFetch(tMap, texelPos + ivec2(direction), 0).x;

    float minDst = min(min(center, left), right);

    FragColor = vec4(minDst);
}