import {EdgeResult} from "straight-skeleton";
import Vec2 from "~/lib/math/Vec2";
import splitPolygon from "~/lib/tile-processing/tile3d/builders/roofs/splitPolygon";
import GabledRoofBuilder from "~/lib/tile-processing/tile3d/builders/roofs/GabledRoofBuilder";
import {RoofSkirtPoint, RoofSkirtPolyline} from "~/lib/tile-processing/tile3d/builders/roofs/RoofBuilder";

export default class GambrelRoofBuilder extends GabledRoofBuilder {
	protected splitProgress: number = 0.3;
	protected edgeBumpFactor: number = 0.3;

	protected override convertEdgeResultToVertices(
		{
			edge,
			minHeight,
			height,
			maxSkeletonHeight,
			scaleX,
			scaleY
		}: {
			edge: EdgeResult;
			minHeight: number;
			height: number;
			maxSkeletonHeight: number;
			scaleX: number;
			scaleY: number;
		}
	): {position: number[]; uv: number[]} {
		const edgeLine: [Vec2, Vec2] = [
			new Vec2(edge.Edge.Begin.X, edge.Edge.Begin.Y),
			new Vec2(edge.Edge.End.X, edge.Edge.End.Y)
		];

		const {verticesBottom, verticesTop} = this.splitEdge(edge, maxSkeletonHeight * this.splitProgress);

		return this.triangulateTopAndBottom({
			verticesBottom: verticesBottom,
			verticesTop: verticesTop,
			minHeight,
			height,
			maxSkeletonHeight,
			edge: edgeLine,
			scaleX,
			scaleY
		});
	}

	private splitEdge(edge: EdgeResult, splitAt: number): {verticesTop: number[]; verticesBottom: number[]} {
		const edgeLine: [Vec2, Vec2] = [
			new Vec2(edge.Edge.Begin.X, edge.Edge.Begin.Y),
			new Vec2(edge.Edge.End.X, edge.Edge.End.Y)
		];

		const edgeNormal = Vec2.normalize(Vec2.rotateRight(Vec2.sub(edgeLine[1], edgeLine[0])));
		const edgeOffset = Vec2.multiplyScalar(edgeNormal, -splitAt)
		const splitLine: [Vec2, Vec2] = [
			Vec2.add(edgeLine[0], edgeOffset),
			Vec2.add(edgeLine[1], edgeOffset)
		];
		const verticesToSplit: [number, number][] = [];

		for (let i = 0; i < edge.Polygon.length; i++) {
			verticesToSplit.push([edge.Polygon[i].X, edge.Polygon[i].Y]);
		}

		const verticesTop: number[] = [];
		const verticesBottom: number[] = [];
		let split: [number, number][][] = null;

		try {
			split = splitPolygon(
				verticesToSplit,
				Vec2.toArray(splitLine[0]),
				Vec2.toArray(Vec2.sub(splitLine[0], splitLine[1]))
			);
		} catch (e) {

		}

		if (!split || split.length === 1) {
			for (let i = 0; i < edge.Polygon.length; i++) {
				verticesBottom.push(edge.Polygon[i].X, edge.Polygon[i].Y);
			}
		} else if (split.length > 1) {
			verticesBottom.push(...split[1].flat())
			verticesTop.push(...split[0].flat());
		}

		return {
			verticesTop,
			verticesBottom
		};
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
					position: edgeEnd,
					height: minHeight
				}, {
					position: edgeCenter,
					height: minHeight + centerRoofHeight
				}, {
					position: edgeStart,
					height: minHeight
				}
			];
		} else {
			points = [
				{
					position: edgeEnd,
					height: minHeight
				}, {
					position: Vec2.lerp(edgeEnd, edgeCenter, this.splitProgress / centerHeight),
					height: minHeight + halfRoofHeight
				}, {
					position: edgeCenter,
					height: minHeight + centerRoofHeight
				}, {
					position: Vec2.lerp(edgeStart, edgeCenter, this.splitProgress / centerHeight),
					height: minHeight + halfRoofHeight
				}, {
					position: edgeStart,
					height: minHeight
				}
			];
		}

		return {
			points: points,
			hasWindows: false
		};
	}
}