export interface BoundingBox {
	minX: number;
	minY: number;
	minZ: number;
	maxX: number;
	maxY: number;
	maxZ: number;
}

export interface Tile3DBuffersExtruded {
	positionBuffer: Float32Array;
	uvBuffer: Float32Array;
	normalBuffer: Float32Array;
	textureIdBuffer: Uint8Array;
	colorBuffer: Uint8Array;
	idBuffer: Uint32Array;
	offsetBuffer: Uint32Array;
	localIdBuffer: Uint32Array;
	boundingBox: BoundingBox;
}

export interface Tile3DBuffersProjected {
	positionBuffer: Float32Array;
	normalBuffer: Float32Array;
	uvBuffer: Float32Array;
	textureIdBuffer: Uint8Array;
	boundingBox: BoundingBox;
}

type Tile3DBuffersInstance = Float32Array;

export default interface Tile3DBuffers {
	extruded: Tile3DBuffersExtruded;
	projected: Tile3DBuffersProjected;
	instances: Record<string, Tile3DBuffersInstance>;
}