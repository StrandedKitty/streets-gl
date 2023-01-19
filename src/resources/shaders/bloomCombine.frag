#include <versionPrecision>

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tMap;

uniform sampler2D tBlurred0;
uniform sampler2D tBlurred1;
uniform sampler2D tBlurred2;
uniform sampler2D tBlurred3;

void main() {
    vec3 color = texture(tMap, vUv).rgb;
    color += texture(tBlurred0, vUv).rgb;
    color += texture(tBlurred1, vUv).rgb;
    color += texture(tBlurred2, vUv).rgb;
    color += texture(tBlurred3, vUv).rgb;

    FragColor = vec4(color, 1);
}