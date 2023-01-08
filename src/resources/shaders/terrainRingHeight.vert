#version 300 es
precision highp float;
in vec3 position;
in vec2 uv;

out vec2 vUv;

uniform PerMesh {
    vec3 transformHeight;
    vec2 morphOffset;
    float size;
    float segmentCount;
    float isLastRing;
    vec2 cameraPosition;
    int levelId;
};

void main() {
    vUv = uv;
    gl_Position = vec4(position * 2. - 1., 1);
}