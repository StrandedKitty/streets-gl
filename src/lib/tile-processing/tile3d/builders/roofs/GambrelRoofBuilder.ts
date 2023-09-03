import Vec2 from "~/lib/math/Vec2";
import GabledRoofBuilder from "~/lib/tile-processing/tile3d/builders/roofs/GabledRoofBuilder";
import {RoofSkirtPoint, RoofSkirtPolyline} from "~/lib/tile-processing/tile3d/builders/roofs/RoofBuilder";
import {StraightSkeletonResultPolygon} from "~/lib/tile-processing/tile3d/builders/Tile3DMultipolygon";
import {splitSkeletonPolygon} from "~/lib/tile-processing/tile3d/builders/roofs/RoofUtils";

export default class GambrelRoofBuilder extends GabledRoofBuilder {
	protected splitProgress: number = 0.3;
	protected edgeBumpFactor: number = 0.3;

	protected override convertSkeletonPolygonToVertices(
		{
			polygon,
			minHeight,
			height,
			maxSkeletonHeight,
			scaleX,
			scaleY
		}: {
			polygon: StraightSkeletonResultPolygon;
			minHeight: number;
			height: number;
			maxSkeletonHeight: number;
			scaleX: number;
			scaleY: number;
		}
	): {position: number[]; uv: number[]} {
		const {verticesBottom, verticesTop} = splitSkeletonPolygon(polygon, maxSkeletonHeight * this.splitProgress);

		return this.triangulateTopAndBottom({
			verticesBottom: verticesBottom,
			verticesTop: verticesTop,
			minHeight,
			height,
			maxSkeletonHeight,
			edge: [polygon.edgeStart, polygon.edgeEnd],
			scaleX,
			scaleY
		});
	}

	protected triangulateTopAndBottom(
		{
			verticesBottom,
			verticesTop,
			minHeight,
			height,
			maxSkeletonHeight,
			edge,
			scaleX,
			scaleY
		} : {
			verticesBottom: number[];
			verticesTop: number[];
			minHeight: number;
			height: number;
			maxSkeletonHeight: number;
			edge: [Vec2, Vec2];
			scaleX: number;
			scaleY: number;
		}
	): {position: number[]; uv: number[]} {
		const bottom = this.triangulatePolygon(
			verticesBottom, minHeight, height, maxSkeletonHeight, edge, scaleX, scaleY,
			v => this.calculateRoofHeightBottom(v)
		);
		const top = this.triangulatePolygon(
			verticesTop, minHeight, height, maxSkeletonHeight, edge, scaleX, scaleY,
			v => this.calculateRoofHeightTop(v)
		);

		return {
			position: bottom.position.concat(top.position),
			uv: bottom.uv.concat(top.uv)
		};
	}

	private calculateRoofHeightBottom(progress: number): number {
		return progress + (progress / this.splitProgress) * this.edgeBumpFactor;
	}

	private calculateRoofHeightTop(progress: number): number {
		return progress + ((1 - progress) / (1 - this.splitProgress)) * this.edgeBumpFactor;
	}

	protected override getSkirtPart(
		edgeStart: Vec2,
		edgeEnd: Vec2,
		edgeCenter: Vec2,
		minHeight: number,
		height: number,
		centerHeight: number
	): RoofSkirtPolyline {
		const centerRoofHeight = this.calculateRoofHeightTop(centerHeight) * height;
		const halfRoofHeight = this.calculateRoofHeightTop(this.splitProgress) * height;

		let points: RoofSkirtPoint[];

		if (halfRoofHeight >= centerRoofHeight) {
			points = [
				{
					position: edgeStart,
					height: minHeight
				}, {
					position: edgeCenter,
					height: minHeight + centerRoofHeight
				}, {
					position: edgeEnd,
					height: minHeight
				}
			];
		} else {
			points = [
				{
					position: edgeStart,
					height: minHeight
				}, {
					position: Vec2.lerp(edgeStart, edgeCenter, this.splitProgress / centerHeight),
					height: minHeight + halfRoofHeight
				}, {
					position: edgeCenter,
					height: minHeight + centerRoofHeight
				}, {
					position: Vec2.lerp(edgeEnd, edgeCenter, this.splitProgress / centerHeight),
					height: minHeight + halfRoofHeight
				}, {
					position: edgeEnd,
					height: minHeight
				},
			];
		}

		return {
			points: points,
			hasWindows: false
		};
	}
}
