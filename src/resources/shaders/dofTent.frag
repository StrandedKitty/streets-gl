#include <versionPrecision>

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tMap;

void main() {
    vec2 texelSize = 1. / vec2(textureSize(tMap, 0));
    vec4 duv = texelSize.xyxy * vec4(0.5, 0.5, -0.5, 0);

    vec4 total = texture(tMap, vUv - duv.xy) +
        texture(tMap, vUv - duv.zy) +
        texture(tMap, vUv + duv.zy) +
        texture(tMap, vUv + duv.xy);

    FragColor = total / 4.;
}