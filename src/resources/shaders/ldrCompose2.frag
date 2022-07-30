#version 300 es
precision highp float;
precision highp sampler2DArray;
precision highp samplerCube;
out vec4 FragColor;

in vec2 vUv;

uniform sampler2D map;
uniform sampler2DArray shadowMaps;

void main() {
	vec4 s = vec4(texture(map, vUv).rgb, 1.);

	float shadowMapValue = texture(shadowMaps, vec3(vUv, 0.)).r * texture(shadowMaps, vec3(vUv, 1.)).r * texture(shadowMaps, vec3(vUv, 2.)).r;

	FragColor = vec4(vec3(shadowMapValue), 1);
}