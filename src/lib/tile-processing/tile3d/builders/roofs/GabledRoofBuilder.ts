import {Edge, Skeleton, Vector2d} from "straight-skeleton";
import HippedRoofBuilder from "~/lib/tile-processing/tile3d/builders/roofs/HippedRoofBuilder";
import {RoofSkirt} from "~/lib/tile-processing/tile3d/builders/roofs/RoofBuilder";
import Tile3DMultipolygon from "~/lib/tile-processing/tile3d/builders/Tile3DMultipolygon";
import {copySkeletonPolygons} from "~/lib/tile-processing/tile3d/builders/utils";
import Vec2 from "~/lib/math/Vec2";
import MathUtils from "~/lib/math/MathUtils";

export default class GabledRoofBuilder extends HippedRoofBuilder {
	protected override convertSkeletonToVertices(
		{
			multipolygon,
			skeleton,
			minHeight,
			height,
			maxSkeletonHeight,
			flip,
			scaleX,
			scaleY
		}: {
			multipolygon: Tile3DMultipolygon;
			skeleton: Skeleton;
			minHeight: number;
			height: number;
			maxSkeletonHeight: number;
			flip: boolean;
			scaleX: number;
			scaleY: number;
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
					const extrudedPoint = edge.Polygon.find(p => {
						return p.NotEquals(begin) && p.NotEquals(end);
					});

					const prevPolygonExtrudedPoint = prevPolygon.find(v => v.Equals(extrudedPoint));
					const nextPolygonExtrudedPoint = nextPolygon.find(v => v.Equals(extrudedPoint));

					let otherPoint: Vector2d = null;

					for (const prevPolygonPoint of prevPolygon) {
						if (nextPolygon.some(p => p.Equals(prevPolygonPoint) && !(p.Equals(begin) || p.Equals(end) || p.Equals(extrudedPoint)))) {
							otherPoint = prevPolygonPoint;
							break;
						}
					}

					let success = false;

					if (otherPoint) {
						const a = new Vec2(extrudedPoint.X, extrudedPoint.Y);
						const b = new Vec2(otherPoint.X, otherPoint.Y);
						const t = Vec2.add(b, Vec2.multiplyScalar(Vec2.sub(a, b), 1000));
						const center2 = MathUtils.getIntersectionPoint(
							[begin.X, begin.Y],
							[end.X, end.Y],
							[b.x, b.y],
							[t.x, t.y]
						);

						if (center2) {
							const centerVec = new Vec2(center2[0], center2[1]);
							const edgeVec: [Vec2, Vec2] = [new Vec2(prevEdge.Begin.X, prevEdge.Begin.Y), new Vec2(prevEdge.End.X, prevEdge.End.Y)];
							const centerHeight = this.getVertexHeightFromEdge(centerVec, edgeVec, maxSkeletonHeight, height);

							skirt.push([
								{
									position: new Vec2(edge.Edge.End.X, edge.Edge.End.Y),
									height: minHeight
								}, {
									position: centerVec,
									height: minHeight + centerHeight
								}, {
									position: new Vec2(edge.Edge.Begin.X, edge.Edge.Begin.Y),
									height: minHeight
								}
							]);

							prevPolygonExtrudedPoint.X = nextPolygonExtrudedPoint.X = centerVec.x;
							prevPolygonExtrudedPoint.Y = nextPolygonExtrudedPoint.Y = centerVec.y;
							success = true;
						}
					}

					if (success) {
						edge.Polygon.length = 0;
					}
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
				maxSkeletonHeight,
				scaleX,
				scaleY
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