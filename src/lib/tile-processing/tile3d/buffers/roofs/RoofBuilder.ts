export interface RoofGeometry {
	position: Float32Array;
	normal: Float32Array;
	uv: Float32Array;
	textureId: Uint8Array;
}

export default interface RoofBuilder {
	build(way: Way3D): RoofGeometry;
}