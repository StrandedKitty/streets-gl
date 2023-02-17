export default interface Tile3DExtrudedGeometry {
	positionBuffer: Float32Array;
	uvBuffer: Float32Array;
	normalBuffer: Float32Array;
	textureIdBuffer: Uint8Array;
	colorBuffer: Uint8Array;
	idBuffer: Uint32Array;
	offsetBuffer: Uint32Array;
	localIdBuffer: Uint32Array;
}