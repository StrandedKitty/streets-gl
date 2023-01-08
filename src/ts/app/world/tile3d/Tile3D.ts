// position.xyz, scale, rotation
export type InstanceBufferInterleaved = Float32Array;
export type InstanceType = 'tree';

export interface Tile3DGround {
	position: Float32Array;
	uv: Float32Array;
	normal: Float32Array;
	index: Uint32Array;
}

export interface Tile3DBuildings {
	position: Float32Array;
	uv: Float32Array;
	normal: Float32Array;
	textureId: Uint8Array;
	color: Uint8Array;
	id: Uint32Array;
	offset: Uint32Array;
	localId: Uint32Array;
}

export interface Tile3DRoads {
	position: Float32Array;
	uv: Float32Array;
	normal: Float32Array;
	textureId: Uint8Array;
}

export default interface Tile3D {
	ground: Tile3DGround;
	building: Tile3DBuildings;
	roads: Tile3DRoads;
	instancesLOD0: Record<InstanceType, InstanceBufferInterleaved>;
	instancesLOD1: Record<InstanceType, InstanceBufferInterleaved>;
	bbox: {
		min: number[];
		max: number[];
	};
	bboxGround: {
		min: number[];
		max: number[];
	};
	labels: {
		position: number[];
		priority: number[];
		text: string[];
	};
}