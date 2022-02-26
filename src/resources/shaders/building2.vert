#version 300 es
in vec3 position;
in vec3 normal;
in vec3 color;

out vec3 vColor;
out vec3 vNormal;

uniform PerMesh {
    mat4 modelViewMatrix;
};

uniform PerMaterial {
    mat4 projectionMatrix;
};

void main() {
    vColor = color;
    vNormal = normal;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}