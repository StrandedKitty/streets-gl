import {Edge, EdgeResult, Skeleton, Vector2d} from "straight-skeleton";
import HippedRoofBuilder from "~/lib/tile-processing/tile3d/builders/roofs/HippedRoofBuilder";
import {RoofSkirt, RoofSkirtPolyline} from "~/lib/tile-processing/tile3d/builders/roofs/RoofBuilder";
import Tile3DMultipolygon from "~/lib/tile-processing/tile3d/builders/Tile3DMultipolygon";
import {copySkeletonPolygons} from "~/lib/tile-processing/tile3d/builders/utils";
import Vec2 from "~/lib/math/Vec2";
import MathUtils from "~/lib/math/MathUtils";

interface SkirtSegmentParams {
	begin: Vec2;
	end: Vec2;
	center: Vec2;
	prevEdge: EdgeResult;
}

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

		const edgeResultMap = this.buildEdgeResultMap(skeleton);

		const skirtSegments: SkirtSegmentParams[] = [];

		for (const edge of skeleton.Edges) {
			if (edge.Polygon.length === 3) {
				const prevEdge = edge.Edge.Previous as Edge;
				const nextEdge = edge.Edge.Next as Edge;
				const prevEdgeResult = edgeResultMap.get(prevEdge);
				const nextEdgeResult = edgeResultMap.get(nextEdge);
				const prevPolygon = prevEdgeResult.Polygon;
				const nextPolygon = nextEdgeResult.Polygon;

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
						const center = MathUtils.getIntersectionLineLine(
							[begin.X, begin.Y],
							[end.X, end.Y],
							[b.x, b.y],
							[t.x, t.y]
						);

						if (center) {
							const centerVec = new Vec2(center[0], center[1]);

							skirtSegments.push({
								begin: new Vec2(edge.Edge.Begin.X, edge.Edge.Begin.Y),
								end: new Vec2(edge.Edge.End.X, edge.Edge.End.Y),
								center: centerVec,
								prevEdge: prevEdgeResult
							});

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

		maxSkeletonHeight = this.getSkeletonMaxHeight(skeleton);

		const skirt = this.buildSkirtFromSegmentsParams(skirtSegments, minHeight, height, maxSkeletonHeight);
		const {position, uv} = super.convertSkeletonToVertices({
			multipolygon,
			skeleton,
			minHeight,
			height,
			maxSkeletonHeight,
			flip,
			scaleX,
			scaleY
		});

		return {position, uv, skirt: skirt};
	}

	private buildEdgeResultMap(skeleton: Skeleton): Map<Edge, EdgeResult> {
		const edgeResultMap: Map<Edge, EdgeResult> = new Map();

		for (const edge of skeleton.Edges) {
			edgeResultMap.set(edge.Edge, edge);
		}

		return edgeResultMap;
	}

	private buildSkirtFromSegmentsParams(
		skirtSegments: SkirtSegmentParams[],
		minHeight: number,
		height: number,
		maxSkeletonHeight: number
	): RoofSkirt {
		const skirt: RoofSkirt = [];

		for (const {begin, end, center, prevEdge} of skirtSegments) {
			const edgeLine: [Vec2, Vec2] = [
				new Vec2(prevEdge.Edge.Begin.X, prevEdge.Edge.Begin.Y),
				new Vec2(prevEdge.Edge.End.X, prevEdge.Edge.End.Y)
			];
			const centerHeight = this.getVertexHeightFromEdge(center, edgeLine, maxSkeletonHeight, 1);

			skirt.push(this.getSkirtPart(
				begin,
				end,
				center,
				minHeight,
				height,
				centerHeight,
			));
		}

		return skirt;
	}

	protected getSkirtPart(
		edgeStart: Vec2,
		edgeEnd: Vec2,
		edgeCenter: Vec2,
		minHeight: number,
		height: number,
		centerHeight: number
	): RoofSkirtPolyline {
		return {
			points: [
				{
					position: edgeStart,
					height: minHeight
				}, {
					position: edgeCenter,
					height: minHeight + height * centerHeight
				}, {
					position: edgeEnd,
					height: minHeight
				}
			],
			hasWindows: false
		};
	}
}