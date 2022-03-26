const ShaderChunks: Record<string, string> = {
	versionPrecision: require('../../../../resources/shaders/chunks/versionPrecision.glsl'),
	gBufferOut: require('../../../../resources/shaders/chunks/gBufferOut.glsl'),
	packNormal: require('../../../../resources/shaders/chunks/packNormal.glsl'),
	unpackNormal: require('../../../../resources/shaders/chunks/unpackNormal.glsl'),
};

export default ShaderChunks;