import Way3D from "../features/3d/Way3D";

export interface RoofGeometry {
	position: Float32Array;
	normal: Float32Array;
	uv: Float32Array;
	textureId: Uint8Array;
}

export default abstract class RoofBuilder {
	public abstract build(way: Way3D): RoofGeometry;
}