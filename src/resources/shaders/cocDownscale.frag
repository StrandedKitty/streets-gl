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
uniform sampler2D tColor;

void main() {
    vec2 texelSize = 1. / vec2(textureSize(tCoC, 0));

    vec4 o = texelSize.xyxy * vec2(-0.5, 0.5).xxyy;

    float coc0 = texture(tCoC, vUv + o.xy).r;
    float coc1 = texture(tCoC, vUv + o.zy).r;
    float coc2 = texture(tCoC, vUv + o.xw).r;
    float coc3 = texture(tCoC, vUv + o.zw).r;

    float cocMin = min(min(min(coc0, coc1), coc2), coc3);
    float cocMax = max(max(max(coc0, coc1), coc2), coc3);
    float coc = cocMax >= -cocMin ? cocMax : cocMin;

    vec3 c0 = texture(tColor, vUv + o.xy).rgb;
    vec3 c1 = texture(tColor, vUv + o.zy).rgb;
    vec3 c2 = texture(tColor, vUv + o.xw).rgb;
    vec3 c3 = texture(tColor, vUv + o.zw).rgb;

    vec3 color = (c0 + c1 + c2 + c3) / 4.;

    FragColor = vec4(color, coc);
}