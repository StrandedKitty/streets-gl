#include <versionPrecision>

#define DEPTH_MIN_SIMILARITY 0.1
#define VELOCITY_SCALAR 25.
#define LOW_VELOCITY_SIMILARITY 0.95
#define HIGH_VELOCITY_SIMILARITY 0.05
#define MOVING_SAMPLES_SCALAR 2.
#define MOVING_SAMPLES_MIN_SIMILARITY 0.3

out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tAccum;
uniform sampler2D tNew;
uniform sampler2D tMotion;
uniform sampler2D tDepth;
uniform sampler2D tPrevDepth;

const vec2 offsets[] = vec2[](
	vec2(1, 0),
	vec2(-1, 0),
	vec2(0, 1),
	vec2(0, -1)
);

float linearize_depth(float d,float zNear,float zFar) {
	float z_n = 2.0 * d - 1.0;
	return 2.0 * zNear * zFar / (zFar + zNear - z_n * (zFar - zNear));
}

void main() {
	vec3 velocity = texture(tMotion, vUv).xyz;
    vec2 oldUV = vUv - velocity.xy;

    vec4 newSample = texture(tNew, vUv);
	vec4 accumSample = texture(tAccum, oldUV);

	float mixFactor = 0.1;

	bool a = any(greaterThan(oldUV, vec2(1)));
	bool b = any(lessThan(oldUV, vec2(0)));

	if(a || b) {
		mixFactor = 1.;
	}

	float depth = linearize_depth(texture(tDepth, vUv).r, 10., 100000.);
	float prevDepth = linearize_depth(texture(tPrevDepth, oldUV).r, 10., 100000.);

	float depthSimilarity = clamp(pow(prevDepth / depth, 4.) + DEPTH_MIN_SIMILARITY, 0., 1.);
	float velocitySimilarity = clamp(length(velocity) * VELOCITY_SCALAR, 0., 1.);

	float samples_similarity = clamp(newSample.y * MOVING_SAMPLES_SCALAR, 0., 1.);
	samples_similarity *= (LOW_VELOCITY_SIMILARITY - MOVING_SAMPLES_MIN_SIMILARITY);
	float current_samples_similarity = samples_similarity;
	samples_similarity = mix(samples_similarity, accumSample.y, 0.9);
	samples_similarity = min(samples_similarity, current_samples_similarity);

	float similarity = depthSimilarity * LOW_VELOCITY_SIMILARITY - velocitySimilarity;
	similarity *= LOW_VELOCITY_SIMILARITY - HIGH_VELOCITY_SIMILARITY;
	similarity = clamp(similarity - samples_similarity, 0., 1.);

	if(a || b) {
		similarity = 0.;
	}

	//FragColor = mix(accumSample, newSample, mix(1., mixFactor, similarity));
	FragColor = mix(newSample, accumSample, similarity);
	//FragColor = vec4(similarity);

	FragColor.y = samples_similarity;
}