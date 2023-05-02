const mat4 screenDoorThresholdMatrix = mat4(
	1.0 / 17.0,  9.0 / 17.0,  3.0 / 17.0,  11.0 / 17.0,
	13.0 / 17.0, 5.0 / 17.0,  15.0 / 17.0, 7.0 / 17.0,
	4.0 / 17.0,  12.0 / 17.0, 2.0 / 17.0,  10.0 / 17.0,
	16.0 / 17.0, 8.0 / 17.0,  14.0 / 17.0, 6.0 / 17.0
);

float getScreenDoorFactor(float x, float y) {
	return screenDoorThresholdMatrix[int(x) % 4][int(y) % 4];
}