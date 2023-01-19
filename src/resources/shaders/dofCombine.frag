#include <versionPrecision>

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tDoF;
uniform sampler2D tCoC;
uniform sampler2D tSource;

void main() {
    vec4 source = texture(tSource, vUv);
    vec4 dof = texture(tDoF, vUv);
    float coc = texture(tCoC, vUv).r;

    float dofStrength = smoothstep(0.1, 1., abs(coc));
    vec3 color = mix(
        source.rgb,
        dof.rgb,
        dofStrength + dof.a - dofStrength * dof.a
    );

    FragColor = vec4(color, 1);
}