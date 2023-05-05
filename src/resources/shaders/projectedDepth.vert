#include <versionPrecision>

in vec3 position;
in vec2 uv;
in vec3 normal;
in uint textureId;

out vec2 vUv;
flat out int vTextureId;

uniform PerMesh {
	mat4 modelViewMatrix;
	mat4 modelViewMatrixPrev;
	float terrainRingSize;
	vec4 terrainRingOffset;
	int terrainLevelId;
	float segmentCount;
};

uniform PerMaterial {
	mat4 projectionMatrix;
	float time;
};

uniform sampler2DArray tRingHeight;

float sampleHeight(vec2 uv, int level) {
	uv.y = 1. - uv.y;

	return texture(
		tRingHeight,
		vec3(
			uv * segmentCount / (segmentCount + 1.),
			level
		)
	).r;
}

void main() {
	vUv = uv;
	vTextureId = int(textureId);

	int level = terrainLevelId;
	vec2 positionUV = (terrainRingOffset.xy + terrainRingSize / 2. + position.xz) / terrainRingSize;

	if (positionUV.x < 0. || positionUV.y < 0. || positionUV.x > 1. || positionUV.y > 1.) {
		float nextSize = terrainRingSize * 2.;
		positionUV = (terrainRingOffset.zw + nextSize / 2. + position.xz) / nextSize;
		level++;
	}

	#if USE_HEIGHT == 1
		float segSize = 1. / segmentCount;
		vec2 segment = floor(positionUV * segmentCount);
		vec2 segmentUV = positionUV * segmentCount - segment;
		vec2 originUV = segment * segSize;
		vec2 segmentLocal = segmentUV;
		float type = mod(segment.x + segment.y, 2.);

		vec2 a, b, c;

		if (type == 0.) {
			if (segmentUV.x > segmentUV.y) {
				a = originUV + segSize * vec2(1, 0);
				b = originUV;
				c = originUV + segSize * vec2(1, 1);
				segmentLocal.x = 1. - segmentLocal.x;
			} else {
				a = originUV + segSize * vec2(0, 1);
				b = originUV + segSize * vec2(1, 1);
				c = originUV;
				segmentLocal.y = 1. - segmentLocal.y;
			}
		} else {
			if (segmentUV.x + segmentUV.y < 1.) {
				a = originUV;
				b = originUV + segSize * vec2(1, 0);
				c = originUV + segSize * vec2(0, 1);
			} else {
				a = originUV + segSize * vec2(1, 1);
				b = originUV + segSize * vec2(0, 1);
				c = originUV + segSize * vec2(1, 0);
				segmentLocal = 1. - segmentLocal;
			}
		}

		float ah = sampleHeight(a, level);
		float bh = sampleHeight(b, level);
		float ch = sampleHeight(c, level);
		float height = ah + (bh - ah) * segmentLocal.x + (ch - ah) * segmentLocal.y;
	#else
		float height = 0.;
	#endif

	vec3 transformedPosition = position + vec3(0, height, 0);
	vec4 cameraSpacePosition = modelViewMatrix * vec4(transformedPosition, 1);
	vec4 cameraSpacePositionPrev = modelViewMatrixPrev * vec4(transformedPosition, 1);

	gl_Position = projectionMatrix * cameraSpacePosition;
}
