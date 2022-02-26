#version 300 es
precision highp float;
precision highp sampler2DArray;
precision highp samplerCube;
layout(location = 0) out vec4 FragColor;

in vec3 vNormal;

void main() {
    FragColor = vec4(normalize(vNormal) * 0.5 + 0.5, 1);
}