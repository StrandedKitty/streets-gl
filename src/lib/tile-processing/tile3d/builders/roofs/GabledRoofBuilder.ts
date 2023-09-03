import HippedRoofBuilder from "~/lib/tile-processing/tile3d/builders/roofs/HippedRoofBuilder";
import {RoofSkirt, RoofSkirtPolyline} from "~/lib/tile-processing/tile3d/builders/roofs/RoofBuilder";
import Tile3DMultipolygon, {
	StraightSkeletonResult,
	StraightSkeletonResultPolygon
} from "~/lib/tile-processing/tile3d/builders/Tile3DMultipolygon";
import Vec2 from "~/lib/math/Vec2";
import MathUtils from "~/lib/math/MathUtils";

interface SkirtSegmentParams {
	begin: Vec2;
	end: Vec2;
	center: Vec2;
	prevPolygon: StraightSkeletonResultPolygon;
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
			skeleton: StraightSkeletonResult;
			minHeight: number;
			height: number;
			maxSkeletonHeight: number;
			flip: boolean;
			scaleX: number;
			scaleY: number;
		}
	): {position: number[]; uv: number[]; skirt?: RoofSkirt} {
		skeleton = skeleton.clone();

		const skirtSegments: SkirtSegmentParams[] = [];

		for (let i = 0; i < skeleton.polygons.length; i++) {
			const polygon = skeleton.polygons[i];

			if (polygon.vertices.length === 3) {
				const prevPolygon = skeleton.polygons.find(p => p.edgeEnd.equals(polygon.edgeStart));
				const nextPolygon = skeleton.polygons.find(p => p.edgeStart.equals(polygon.edgeEnd));

				if (prevPolygon.vertices.length > 3 && nextPolygon.vertices.length > 3) {
					const begin = polygon.edgeStart;
					const end = polygon.edgeEnd;
					const extrudedPoint = polygon.vertices.find(p => {
						return !p.equals(begin) && !p.equals(end);
					});

					const prevPolygonExtrudedPoint = prevPolygon.vertices.find(v => v.equals(extrudedPoint));
					const nextPolygonExtrudedPoint = nextPolygon.vertices.find(v => v.equals(extrudedPoint));

					let otherPoint: Vec2 = null;

					for (const prevPolygonPoint of prevPolygon.vertices) {
						if (nextPolygon.vertices.some(p => p.equals(prevPolygonPoint) && !(p.equals(begin) || p.equals(end) || p.equals(extrudedPoint)))) {
							otherPoint = prevPolygonPoint;
							break;
						}
					}

					let success = false;

					if (otherPoint) {
						const a = new Vec2(extrudedPoint.x, extrudedPoint.y);
						const b = new Vec2(otherPoint.x, otherPoint.y);
						const t = Vec2.add(b, Vec2.multiplyScalar(Vec2.sub(a, b), 1000));
						const center = MathUtils.getIntersectionLineLine(
							[begin.x, begin.y],
							[end.x, end.y],
							[b.x, b.y],
							[t.x, t.y]
						);

						if (center) {
							const centerVec = new Vec2(center[0], center[1]);

							skirtSegments.push({
								begin,
								end,
								center: centerVec,
								prevPolygon
							});

							prevPolygonExtrudedPoint.x = nextPolygonExtrudedPoint.x = centerVec.x;
							prevPolygonExtrudedPoint.y = nextPolygonExtrudedPoint.y = centerVec.y;
							success = true;
						}
					}

					if (success) {
						polygon.vertices.length = 0;
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

	private buildSkirtFromSegmentsParams(
		skirtSegments: SkirtSegmentParams[],
		minHeight: number,
		height: number,
		maxSkeletonHeight: number
	): RoofSkirt {
		const skirt: RoofSkirt = [];

		for (const {begin, end, center, prevPolygon} of skirtSegments) {
			const edgeLine: [Vec2, Vec2] = [prevPolygon.edgeStart, prevPolygon.edgeEnd];
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
