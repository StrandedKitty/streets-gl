#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp sampler3D;
precision highp usampler2D;

out float FragColor;

in vec2 vUv;

uniform usampler2D tSource;
uniform uint objectId;

void main() {
	FragColor = texture(tSource, vUv).r == objectId ? 1. : 0.;
}