import OSMReference from "~/lib/tile-processing/vector/features/OSMReference";
import Vec2 from "~/lib/math/Vec2";
import AABB2D from "~/lib/math/AABB2D";
import Tile3DProjectedGeometry from "~/lib/tile-processing/tile3d/features/Tile3DProjectedGeometry";

export default class Tile3DProjectedGeometryBuilder {
	private readonly osmReference: OSMReference;
	private readonly nodes: Vec2[];
	private readonly arrays: {
		position: number[];
		uv: number[];
		normal: number[];
		textureId: number[];
		color: number[];
	} = {
		position: [],
		uv: [],
		normal: [],
		textureId: [],
		color: []
	};
	private readonly boundingBox: AABB2D = new AABB2D(new Vec2(), new Vec2());

	public constructor(osmReference: OSMReference, nodes: Vec2[]) {
		this.nodes = nodes;
		this.osmReference = osmReference;
	}

	public addRoad(
		{
			textureId,
			width
		}: {
			textureId: number;
			width: number;
		}
	): void {

	}

	public getGeometry(): Tile3DProjectedGeometry {
		return {
			type: 'projected',
			boundingBox: this.boundingBox,
			positionBuffer: new Float32Array(this.arrays.position),
			normalBuffer: new Float32Array(this.arrays.normal),
			uvBuffer: new Float32Array(this.arrays.uv),
			textureIdBuffer: new Uint8Array(this.arrays.textureId)
		};
	}
}