import {Edge, Skeleton, Vector2d} from "straight-skeleton";
import HippedRoofBuilder from "~/lib/tile-processing/tile3d/builders/roofs/HippedRoofBuilder";
import {RoofSkirt} from "~/lib/tile-processing/tile3d/builders/roofs/RoofBuilder";
import Tile3DMultipolygon from "~/lib/tile-processing/tile3d/builders/Tile3DMultipolygon";
import {copySkeletonPolygons, signedDstToLine} from "~/lib/tile-processing/tile3d/builders/utils";
import Vec2 from "~/lib/math/Vec2";

export default class GabledRoofBuilder extends HippedRoofBuilder {
	protected override convertSkeletonToVertices(
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
		skeleton = copySkeletonPolygons(skeleton);

		const skirt: RoofSkirt = [];
		const edgePolygonMap: Map<Edge, Vector2d[]> = new Map();

		for (const edge of skeleton.Edges) {
			edgePolygonMap.set(edge.Edge, edge.Polygon);
		}

		for (const edge of skeleton.Edges) {
			if (edge.Polygon.length === 3) {
				const prevEdge = edge.Edge.Previous as Edge;
				const nextEdge = edge.Edge.Next as Edge;
				const prevPolygon = edgePolygonMap.get(prevEdge);
				const nextPolygon = edgePolygonMap.get(nextEdge);

				if (prevPolygon.length > 3 && nextPolygon.length > 3) {
					const begin = edge.Edge.Begin;
					const end = edge.Edge.End;
					const dst = end.Sub(begin);
					const center = begin.Add(dst.MultiplyScalar(0.5));

					const extrudedPoint = edge.Polygon.find(p => {
						return p.NotEquals(begin) && p.NotEquals(end);
					});

					const prevPolygonExtrudedPoint = prevPolygon.find(v => v.Equals(extrudedPoint));
					const nextPolygonExtrudedPoint = nextPolygon.find(v => v.Equals(extrudedPoint));

					const centerVec = new Vec2(prevPolygonExtrudedPoint.X, prevPolygonExtrudedPoint.Y);
					const edgeVec: [Vec2, Vec2] = [new Vec2(begin.X, begin.Y), new Vec2(end.X, end.Y)];
					const centerHeight = this.getVertexHeightFromEdge(centerVec, edgeVec, maxSkeletonHeight, height);

					skirt.push([
						{
							position: new Vec2(edge.Edge.End.X, edge.Edge.End.Y),
							height: minHeight
						}, {
							position: new Vec2(center.X, center.Y),
							height: minHeight + centerHeight
						}, {
							position: new Vec2(edge.Edge.Begin.X, edge.Edge.Begin.Y),
							height: minHeight
						}
					]);

					prevPolygonExtrudedPoint.X = nextPolygonExtrudedPoint.X = center.X;
					prevPolygonExtrudedPoint.Y = nextPolygonExtrudedPoint.Y = center.Y;

					edge.Polygon.length = 0;
				}
			}
		}

		let positionResult: number[] = [];
		let uvResult: number[] = [];

		for (const edge of skeleton.Edges) {
			if (!edge.Polygon.length) {
				continue;
			}

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

		return {position: positionResult, uv: uvResult, skirt: skirt};
	}
}