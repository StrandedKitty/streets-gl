import OSMReference from "~/lib/tile-processing/vector/features/OSMReference";
import Vec2 from "~/lib/math/Vec2";
import Tile3DProjectedGeometry from "~/lib/tile-processing/tile3d/features/Tile3DProjectedGeometry";
import Tile3DMultipolygon from "~/lib/tile-processing/tile3d/builders/Tile3DMultipolygon";
import Tile3DRing, {Tile3DRingType} from "~/lib/tile-processing/tile3d/builders/Tile3DRing";
import GeometryGroundProjector from "~/lib/tile-processing/tile3d/builders/GeometryGroundProjector";
import Config from "~/app/Config";
import AABB3D from "~/lib/math/AABB3D";
import Vec3 from "~/lib/math/Vec3";

export default class Tile3DProjectedGeometryBuilder {
	private readonly osmReference: OSMReference;
	private readonly arrays: {
		position: number[];
		uv: number[];
		normal: number[];
		textureId: number[];
	} = {
		position: [],
		uv: [],
		normal: [],
		textureId: []
	};
	private readonly boundingBox: AABB3D = new AABB3D();
	private readonly multipolygon: Tile3DMultipolygon = new Tile3DMultipolygon();

	public constructor(osmReference: OSMReference) {
		this.osmReference = osmReference;
	}

	public addRing(type: Tile3DRingType, nodes: Vec2[]): void {
		const ring = new Tile3DRing(type, nodes);
		this.multipolygon.addRing(ring);
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

	public addPolygon(
		{
			textureId,
			height,
			uvScale
		}: {
			height: number;
			textureId: number;
			uvScale: number;
		}
	): void {
		const footprint = this.multipolygon.getFootprint({
			height: height,
			flip: false
		});

		this.projectAndAddGeometry({
			position: footprint.positions,
			uv: footprint.uvs,
			textureId: textureId
		});
	}

	private projectAndAddGeometry(
		{
			position,
			uv,
			textureId
		}: {
			position: number[];
			uv: number[];
			textureId: number;
		}
	): void {
		const projector = new GeometryGroundProjector();
		const projectorSegmentCount = Math.round(Config.TileSize / Config.TerrainRingSize * Config.TerrainRingSegmentCount) * 2;
		const tileSize = Config.TileSize;

		const projectedPositions: number[] = [];
		const projectedUVs: number[] = [];

		for (let i = 0, j = 0; i < position.length; i += 9, j += 6) {
			const trianglePositions: [number, number][] = [
				[position[i], position[i + 2]],
				[position[i + 3], position[i + 5]],
				[position[i + 6], position[i + 8]]
			];
			const triangleUVs: [number, number][] = [
				[uv[j], uv[j + 1]],
				[uv[j + 2], uv[j + 3]],
				[uv[j + 4], uv[j + 5]]
			];
			const projected = projector.project({
				triangle: trianglePositions,
				attributes: {
					uv: triangleUVs
				},
				tileSize: tileSize,
				segmentCount: projectorSegmentCount
			});

			if (projected.position.length > 0) {
				const newPositions = Array.from(projected.position);
				const newUVs = Array.from(projected.attributes.uv);

				projectedPositions.push(...newPositions);
				projectedUVs.push(...newUVs);

				this.addVerticesToBoundingBox(newPositions);
			}
		}

		this.arrays.position.push(...projectedPositions);
		this.arrays.uv.push(...projectedUVs);

		const vertexCount = projectedPositions.length / 3;

		for (let i = 0; i < vertexCount; i++) {
			this.arrays.normal.push(0, 1, 0);
			this.arrays.textureId.push(textureId);
		}
	}

	private addVerticesToBoundingBox(vertices: number[]): void {
		const tempVec3 = new Vec3();

		for (let i = 0; i < vertices.length; i += 3) {
			tempVec3.set(vertices[i], vertices[i + 1], vertices[i + 2]);
			this.boundingBox.includePoint(tempVec3);
		}
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