#version 300 es
in vec3 position;

out vec3 vNormal;

uniform Uniforms {
    mat4 projectionMatrix;
    mat4 modelViewMatrix;
};

void main() {
    vNormal = position;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}