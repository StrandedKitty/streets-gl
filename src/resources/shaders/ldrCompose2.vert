#version 300 es
in vec3 position;

out vec2 vUv;

vec2 getFullScreenTriangleUV(vec2 position) {
	return position * 0.5 + 0.5;
}

void main() {
	vUv = getFullScreenTriangleUV(position.xy);

	gl_Position = vec4(position, 1.);
}