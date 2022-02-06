#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp usampler2D;
precision highp sampler2DArray;
precision highp sampler3D;

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tMap;

void main() {
    vec2 texelSize = 1. / vec2(textureSize(tMap, 0));
    vec4 duv = texelSize.xyxy * vec4(0.5, 0.5, -0.5, 0);

    vec4 acc;

    acc = texture(tMap, vUv - duv.xy);
    acc += texture(tMap, vUv - duv.zy);
    acc += texture(tMap, vUv + duv.zy);
    acc += texture(tMap, vUv + duv.xy);

    FragColor = acc / 4.;
}