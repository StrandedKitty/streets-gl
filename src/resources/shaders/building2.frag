#version 300 es
precision highp float;
precision highp sampler2DArray;
precision highp samplerCube;
layout(location = 0) out vec4 FragColor;

in vec3 vColor;
in vec3 vNormal;

uniform PerMesh {
    mat4 modelViewMatrix;
};

void main() {
    vec3 n = vec3(modelViewMatrix * vec4(vNormal, 0));
    float fr = dot(n, vec3(0, 0, 1));

    FragColor = vec4(vColor * fr, 1);
}