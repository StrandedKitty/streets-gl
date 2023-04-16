import Vec2 from "~/lib/math/Vec2";
import Tile3DProjectedGeometry from "~/lib/tile-processing/tile3d/features/Tile3DProjectedGeometry";
import Tile3DMultipolygon from "~/lib/tile-processing/tile3d/builders/Tile3DMultipolygon";
import Tile3DRing, {Tile3DRingType} from "~/lib/tile-processing/tile3d/builders/Tile3DRing";
import AABB3D from "~/lib/math/AABB3D";
import Vec3 from "~/lib/math/Vec3";
import SurfaceBuilder from "~/lib/tile-processing/tile3d/builders/SurfaceBuilder";
import RoadBuilder, {RoadSide} from "~/lib/tile-processing/tile3d/builders/RoadBuilder";
import {projectGeometryOnTerrain, projectLineOnTerrain} from "~/lib/tile-processing/tile3d/builders/utils";
import FenceBuilder from "~/lib/tile-processing/tile3d/builders/FenceBuilder";

export default class Tile3DProjectedGeometryBuilder {
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
	private zIndex: number = 0;

	public constructor() {
	}

	public addRing(type: Tile3DRingType, nodes: Vec2[]): void {
		const ring = new Tile3DRing(type, nodes);
		this.multipolygon.addRing(ring);
	}

	public setZIndex(value: number): void {
		this.zIndex = value;
	}

	public addPolygon(
		{
			textureId,
			height,
			uvScale = 1,
			isOriented = false
		}: {
			height: number;
			textureId: number;
			uvScale?: number;
			isOriented?: boolean;
		}
	): void {
		const surface = SurfaceBuilder.build({
			multipolygon: this.multipolygon,
			isOriented: isOriented,
			uvScale: uvScale
		});

		this.projectAndAddGeometry({
			position: surface.position,
			uv: surface.uv,
			textureId: textureId,
			height: height
		});
	}

	public addPath(
		{
			vertexAdjacentToStart = null,
			vertexAdjacentToEnd = null,
			width,
			uvFollowRoad,
			uvScale = 1,
			uvScaleY = 1,
			side = RoadSide.Both,
			uvMinX = 0,
			uvMaxX = 1,
			height = 0,
			textureId
		}: {
			vertexAdjacentToStart?: Vec2;
			vertexAdjacentToEnd?: Vec2;
			width: number;
			uvFollowRoad: boolean;
			uvScale?: number;
			uvScaleY?: number;
			side?: RoadSide;
			uvMinX?: number;
			uvMaxX?: number;
			height?: number;
			textureId: number;
		}
	): void {
		const road = RoadBuilder.build({
			vertices: this.multipolygon.rings[0].nodes,
			vertexAdjacentToStart,
			vertexAdjacentToEnd,
			width,
			uvFollowRoad,
			uvScale,
			uvScaleY,
			side,
			uvMinX,
			uvMaxX
		});

		this.projectAndAddGeometry({
			position: road.position,
			uv: road.uv,
			textureId,
			height
		});
	}

	public addFence(
		{
			minHeight,
			height,
			width,
			textureId
		}: {
			minHeight: number;
			height: number;
			width: number;
			textureId: number;
		}
	): void {
		const ring = this.multipolygon.rings[0];
		const projectedPolylines = projectLineOnTerrain(ring.nodes);

		for (const polyline of projectedPolylines) {
			const fence = FenceBuilder.build({
				vertices: polyline.vertices,
				minHeight: minHeight,
				height: height,
				uvWidth: width,
				uvHeight: 1,
				uvHorizontalOffset: polyline.startProgress
			});

			this.arrays.position.push(...fence.position);
			this.arrays.uv.push(...fence.uv);
			this.arrays.normal.push(...fence.normal);

			const vertexCount = fence.position.length / 3;

			for (let i = 0; i < vertexCount; i++) {
				this.arrays.textureId.push(textureId);
			}

			this.addVerticesToBoundingBox(fence.position);
		}
	}

	public addExtrudedPath(
		{
			width,
			height,
			textureId,
			textureScaleX,
			textureScaleY
		}: {
			width: number;
			height: number;
			textureId: number;
			textureScaleX: number;
			textureScaleY: number;
		}
	): void {
		const road = RoadBuilder.build({
			vertices: this.multipolygon.rings[0].nodes,
			width: width,
			uvFollowRoad: true,
			uvScaleY: textureScaleY,
			uvMinX: 0,
			uvMaxX: width / textureScaleX
		});

		this.projectAndAddGeometry({
			position: road.position,
			uv: road.uv,
			textureId: textureId,
			height: height
		});

		const projectedPolylines = projectLineOnTerrain(road.border);

		for (const polyline of projectedPolylines) {
			const fence = FenceBuilder.build({
				vertices: polyline.vertices,
				minHeight: 0,
				height: height,
				uvWidth: textureScaleX,
				uvHeight: height / textureScaleY,
				uvHorizontalOffset: polyline.startProgress
			});

			this.arrays.position.push(...fence.position);
			this.arrays.uv.push(...fence.uv);
			this.arrays.normal.push(...fence.normal);

			const vertexCount = fence.position.length / 3;

			for (let i = 0; i < vertexCount; i++) {
				this.arrays.textureId.push(textureId);
			}

			this.addVerticesToBoundingBox(fence.position);
		}
	}

	private projectAndAddGeometry(
		{
			position,
			uv,
			textureId,
			height = 0
		}: {
			position: number[];
			uv: number[];
			textureId: number;
			height?: number;
		}
	): void {
		const projected = projectGeometryOnTerrain({position, uv, height});

		this.arrays.position.push(...projected.position);
		this.arrays.uv.push(...projected.uv);
		this.addVerticesToBoundingBox(projected.position);

		const vertexCount = projected.position.length / 3;

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
			zIndex: this.zIndex,
			boundingBox: this.boundingBox,
			positionBuffer: new Float32Array(this.arrays.position),
			normalBuffer: new Float32Array(this.arrays.normal),
			uvBuffer: new Float32Array(this.arrays.uv),
			textureIdBuffer: new Uint8Array(this.arrays.textureId)
		};
	}
}