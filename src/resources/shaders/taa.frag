#include <versionPrecision>

//#define USE_YCOCG
#define REPROJECTION_SHARPNESS 0.5
#define USE_CATMULL_ROM_HISTORY_SAMPLING 1

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tAccum;
uniform sampler2D tNew;
uniform sampler2D tMotion;

const int ignoreHistory = 0;

vec3 RGB_YCoCg(vec3 c) {
	// Y = R/4 + G/2 + B/4
	// Co = R/2 - B/2
	// Cg = -R/4 + G/2 - B/4
	return vec3(
		c.x / 4. + c.y / 2. + c.z / 4.,
		c.x / 2. - c.z / 2.,
		-c.x / 4. + c.y / 2. - c.z / 4.
	);
}

vec3 YCoCg_RGB(vec3 c) {
	// R = Y + Co - Cg
	// G = Y + Cg
	// B = Y - Co - Cg
	return clamp(vec3(
		c.x + c.y - c.z,
		c.x + c.z,
		c.x - c.y - c.z
	), vec3(0.0), vec3(1.0));
}

#include <sampleCatmullRom>

const vec2 offsets[] = vec2[](
	vec2(1, 0),
	vec2(-1, 0),
	vec2(0, 1),
	vec2(0, -1),
	vec2(1, 1),
	vec2(-1, -1),
	vec2(-1, 1),
	vec2(1, -1)
);

void main() {
	vec2 size = vec2(textureSize(tNew, 0));
	vec4 velocity = texture(tMotion, vUv);
    vec2 oldUV = vUv - velocity.xy;

    vec4 newSample = texture(tNew, vUv);

	#if USE_CATMULL_ROM_HISTORY_SAMPLING == 1
		vec4 accumSample = sampleCatmullRom(tAccum, oldUV, vec2(textureSize(tAccum, 0)));
	#else
		vec4 accumSample = texture(tAccum, oldUV);
	#endif

    #ifdef USE_YCOCG
        accumSample.rgb = RGB_YCoCg(accumSample.rgb);
        newSample.rgb = RGB_YCoCg(newSample.rgb);
    #endif

	if(ignoreHistory == 1) {
		FragColor = newSample;
		return;
	}

	vec4 maxNeighbor = newSample;
	vec4 minNeighbor = newSample;

	for(int i = 0; i < 8; i++) {
		vec2 neighborUv = vUv + offsets[i] / size;
		vec4 neighborTexel = texture(tNew, neighborUv);

        #ifdef USE_YCOCG
            neighborTexel.rgb = RGB_YCoCg(neighborTexel.rgb);
        #endif

		maxNeighbor = max(maxNeighbor, neighborTexel);
		minNeighbor = min(minNeighbor, neighborTexel);
	}

	accumSample = clamp(accumSample, minNeighbor, maxNeighbor);

	float mixFactor = 0.1;

	if (accumSample.a == 0. && newSample.a == 0.) {
		// Disable TAA for skybox
		mixFactor = 1.;
	}

	bool a = any(greaterThan(oldUV, vec2(1)));
	bool b = any(lessThan(oldUV, vec2(0)));

	if(a || b) {
		mixFactor = 1.;
	}

	FragColor = mix(accumSample, newSample, mixFactor);

    #ifdef USE_YCOCG
        FragColor.rgb = YCoCg_RGB(FragColor.rgb);
    #endif
}