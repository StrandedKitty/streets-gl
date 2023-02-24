import Vec3 from "~/lib/math/Vec3";
import MathUtils from "~/lib/math/MathUtils";
import {EdgeResult, Skeleton} from "straight-skeleton";
import earcut from "earcut";
import RoofBuilder, {
	RoofGeometry,
	RoofParams,
	RoofSkirt
} from "~/lib/tile-processing/tile3d/builders/roofs/RoofBuilder";
import Tile3DMultipolygon from "~/lib/tile-processing/tile3d/builders/Tile3DMultipolygon";
import Vec2 from "~/lib/math/Vec2";
import {signedDstToLine} from "~/lib/tile-processing/tile3d/builders/utils";

export default class HippedRoofBuilder implements RoofBuilder {
	public build(params: RoofParams): RoofGeometry {
		const {multipolygon, flip} = params;

		const skeleton = multipolygon.getStraightSkeleton();

		if (!skeleton) {
			return null;
		}

		const maxSkeletonHeight = this.getSkeletonMaxHeight(skeleton);

		let height: number = params.height;
		let minHeight: number = params.minHeight;
		let facadeHeightOverride: number = null;

		if (params.angle !== null && params.angle !== undefined) {
			height = maxSkeletonHeight * Math.tan(MathUtils.toRad(params.angle ?? 45));
			minHeight = params.buildingHeight - height;
			facadeHeightOverride = params.buildingHeight - height;
		}

		const {position, uv, skirt} = this.convertSkeletonToVertices({
			multipolygon,
			skeleton,
			minHeight,
			height,
			maxSkeletonHeight,
			flip
		});
		const normal = this.calculateNormals(position, flip);

		return {
			position: position,
			normal: normal,
			uv: uv,
			addSkirt: !!skirt,
			skirt,
			facadeHeightOverride
		};
	}

	private getSkeletonMaxHeight(skeleton: Skeleton): number {
		return Math.max(...skeleton.Distances.values());
	}

	protected convertSkeletonToVertices(
		{
			multipolygon,
			skeleton,
			minHeight,
			height,
			maxSkeletonHeight,
			flip
		}: {
			multipolygon: Tile3DMultipolygon;
			skeleton: Skeleton;
			minHeight: number;
			height: number;
			maxSkeletonHeight: number;
			flip: boolean;
		}
	): {position: number[]; uv: number[]; skirt?: RoofSkirt} {
		let positionResult: number[] = [];
		let uvResult: number[] = [];

		for (const edge of skeleton.Edges) {
			const {position, uv} = this.convertEdgeResultToVertices({
				edge,
				minHeight,
				height,
				maxSkeletonHeight
			});

			if (flip) {
				position.reverse();
			}

			positionResult = positionResult.concat(position);
			uvResult = uvResult.concat(uv);
		}

		return {position: positionResult, uv: uvResult};
	}

	protected convertEdgeResultToVertices(
		{
			edge,
			minHeight,
			height,
			maxSkeletonHeight
		}: {
			edge: EdgeResult;
			minHeight: number;
			height: number;
			maxSkeletonHeight: number;
		}
	): {position: number[]; uv: number[]} {
		const polygonVertices: number[] = [];
		const edgeLine: [Vec2, Vec2] = [
			new Vec2(edge.Edge.Begin.X, edge.Edge.Begin.Y),
			new Vec2(edge.Edge.End.X, edge.Edge.End.Y)
		];

		for (let i = 0; i < edge.Polygon.length; i++) {
			polygonVertices.push(edge.Polygon[i].X, edge.Polygon[i].Y);
		}

		return this.triangulatePolygon(polygonVertices, minHeight, height, maxSkeletonHeight, edgeLine);
	}

	protected triangulatePolygon(
		flatVertices: number[],
		minHeight: number,
		height: number,
		maxSkeletonHeight: number,
		edgeLine: [Vec2, Vec2]
	): {position: number[]; uv: number[]} {
		const position: number[] = [];
		const uv: number[] = [];

		const triangles = earcut(flatVertices).reverse();

		for (let i = 0; i < triangles.length; i++) {
			const index = triangles[i];
			const x = flatVertices[index * 2];
			const z = flatVertices[index * 2 + 1];
			const y = signedDstToLine(new Vec2(x, z), edgeLine);

			const vertexHeight = minHeight + y / maxSkeletonHeight * height;

			position.push(x, vertexHeight, z);
			uv.push(x, z);
		}

		return {position, uv};
	}

	private calculateNormals(vertices: number[], flip: boolean = false): number[] {
		const normals: number[] = [];

		for (let i = 0; i < vertices.length; i += 9) {
			const a = new Vec3(vertices[i], vertices[i + 1], vertices[i + 2]);
			const b = new Vec3(vertices[i + 3], vertices[i + 4], vertices[i + 5]);
			const c = new Vec3(vertices[i + 6], vertices[i + 7], vertices[i + 8]);

			const normal = flip ?
				MathUtils.calculateNormal(c, b, a) :
				MathUtils.calculateNormal(a, b, c);
			const normalArray = Vec3.toArray(normal);

			for (let j = i; j < i + 9; j++) {
				normals[j] = normalArray[j % 3];
			}
		}

		return normals;
	}
}