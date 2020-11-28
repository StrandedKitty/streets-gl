#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp sampler3D;
precision highp usampler2D;

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tColor;
uniform vec2 direction;

vec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
	vec4 color = vec4(0.0);
	vec2 off1 = vec2(1.3846153846) * direction;
	vec2 off2 = vec2(3.2307692308) * direction;
	color += texture(image, uv) * 0.2270270270;
	color += texture(image, uv + (off1 / resolution)) * 0.3162162162;
	color += texture(image, uv - (off1 / resolution)) * 0.3162162162;
	color += texture(image, uv + (off2 / resolution)) * 0.0702702703;
	color += texture(image, uv - (off2 / resolution)) * 0.0702702703;
	return color;
}

void main() {
	FragColor = blur9(tColor, vUv, vec2(textureSize(tColor, 0)), direction);
}