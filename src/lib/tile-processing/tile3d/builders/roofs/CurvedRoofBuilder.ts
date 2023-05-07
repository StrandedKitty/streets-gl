import RoofBuilder, {RoofGeometry, RoofParams} from "./RoofBuilder";
import MathUtils from "~/lib/math/MathUtils";
import Vec3 from "~/lib/math/Vec3";
import Vec2 from "~/lib/math/Vec2";
import polylabel from "polylabel";
import {Tile3DRingType} from "~/lib/tile-processing/tile3d/builders/Tile3DRing";
import {signedDstToLine} from "~/lib/tile-processing/tile3d/builders/utils";
import {calculateSplitsNormals} from "~/lib/tile-processing/tile3d/builders/roofs/RoofUtils";

export default abstract class CurvedRoofBuilder implements RoofBuilder {
	protected readonly abstract splits: Vec2[];
	protected readonly abstract isEdgy: boolean;
	private splitsNormals: Vec2[];

	public build(params: RoofParams): RoofGeometry {
		this.calculateSplitsNormals();

		const {multipolygon, minHeight, height, scaleX, scaleY} = params;

		const topHeight = minHeight + height;
		const outerRing = multipolygon.rings.find(ring => ring.type === Tile3DRingType.Outer);
		const ringVertices = outerRing.nodes.slice(0, -1);
		const center = this.getCenter(ringVertices);
		const polylines = this.splitPolygon(ringVertices);

		const positions: number[] = [];
		const normals: number[] = [];
		const uvs: number[] = [];

		for (const polyline of polylines) {
			const points = this.getRoofPartPoints(
				polyline,
				topHeight,
				minHeight,
				center
			);

			this.buildRoofPart(
				positions,
				normals,
				uvs,
				points,
				scaleX,
				scaleY
			);
		}

		return {
			position: positions,
			normal: normals,
			uv: uvs,
			addSkirt: false,
			canExtendOutsideFootprint: true
		};
	}

	private getRoofPartPoints(
		polyline: Vec2[],
		topHeight: number,
		minHeight: number,
		center: Vec2,
	): {position: Vec3; normal: Vec3}[][] {
		const isClosed = polyline[0].equals(polyline[polyline.length - 1]);
		const points: {position: Vec3; normal: Vec3}[][] = [];

		for (let i = 0; i < polyline.length; i++) {
			const vertex = polyline[i];
			const pointsArray: {position: Vec3; normal: Vec3}[] = [];

			const scaleX = topHeight - minHeight;
			const scaleY = Vec2.distance(vertex, center);

			let angle: number;

			if (!isClosed && i === 0) {
				const vertexNext = polyline[i + 1];
				const segment = Vec2.sub(vertexNext, vertex);
				angle = Vec2.angleClockwise(new Vec2(1, 0), segment);
			} else if (!isClosed && i === polyline.length - 1) {
				const vertexPrev = polyline[i - 1];
				const segment = Vec2.sub(vertex, vertexPrev);
				angle = Vec2.angleClockwise(new Vec2(1, 0), segment);
			} else {
				angle = Vec2.angleClockwise(new Vec2(0, 1), Vec2.sub(vertex, center));
			}

			for (let j = 0; j < this.splits.length; j++) {
				const split = this.splits[j];
				const position2D = Vec2.lerp(center, vertex, split.y);
				const height = MathUtils.lerp(minHeight, topHeight, split.x);
				const position = new Vec3(position2D.x, height, position2D.y);

				const normalSource = this.splitsNormals[j];
				const normalRotated = Vec3.rotateAroundAxis(
					new Vec3(normalSource.y / scaleY, normalSource.x / scaleX, 0),
					new Vec3(0, 1, 0),
					-angle - Math.PI / 2
				);

				pointsArray.push({
					position: position,
					normal: Vec3.normalize(normalRotated)
				});
			}

			points.push(pointsArray);
		}

		return points;
	}

	private buildRoofPart(
		positionOut: number[],
		normalOut: number[],
		uvOut: number[],
		points: {position: Vec3; normal: Vec3}[][],
		scaleX: number,
		scaleY: number
	): void {
		let uvProgressX = 0;

		for (let i = 0; i < points.length - 1; i++) {
			const arr0 = points[i];
			const arr1 = points[i + 1];

			const segment: [Vec2, Vec2] = [
				arr0[0].position.xz,
				arr1[0].position.xz
			];
			const segmentVector = Vec2.sub(segment[1], segment[0]);
			const segmentPerpendicular: [Vec2, Vec2] = [
				segment[0],
				Vec2.add(segment[0], Vec2.rotateRight(segmentVector))
			];

			let uvProgressY = 0;

			for (let j = 0; j < arr0.length - 1; j++) {
				const p0 = arr0[j];
				const p1 = arr0[j + 1];
				const p2 = arr1[j];
				const p3 = arr1[j + 1];

				let triPoints = [p0, p2, p1, p1, p2, p3];
				let triUVs = [0, 0, 1, 1, 0, 1];

				if (p1.position.equals(p3.position)) {
					triPoints = [p0, p2, p1];
					triUVs = [0, 0, 1];
				}

				const quadUvYSize = Vec3.distance(p0.position, p1.position);

				for (let i = 0; i < triPoints.length; i++) {
					const {position, normal} = triPoints[i];
					const uvYFactor = triUVs[i];
					positionOut.push(position.x, position.y, position.z);
					normalOut.push(normal.x, normal.y, normal.z);

					const distanceY = uvProgressY + uvYFactor * quadUvYSize;
					const distanceX = uvProgressX + signedDstToLine(position.xz, segmentPerpendicular);

					uvOut.push(distanceX / scaleX, distanceY / scaleY);
				}

				uvProgressY += quadUvYSize;
			}

			uvProgressX += Vec2.getLength(segmentVector);
		}
	}

	private getCenter(ringVertices: Vec2[]): Vec2 {
		let center: Vec2 = MathUtils.getPolygonCentroid(ringVertices);

		if (MathUtils.isPointInsidePolygon(center, ringVertices)) {
			return center;
		}

		const array = ringVertices.map(v => [v.x, v.y]);
		const result = polylabel([array], 1);

		return new Vec2(result[0], result[1]);
	}

	private getPolygonSplitFlags(points: Vec2[]): boolean[] {
		const splitFlags: boolean[] = [];

		for (let i = 0; i < points.length; i++) {
			if (this.isEdgy) {
				splitFlags.push(true);
				continue;
			}

			const point = points[i];
			const prev = points[i - 1] ?? points[points.length - 1];
			const next = points[i + 1] ?? points[0];

			const vecToPrev = Vec2.normalize(Vec2.sub(point, prev));
			const vecToNext = Vec2.normalize(Vec2.sub(next, point));

			const dot = Vec2.dot(vecToPrev, vecToNext);

			splitFlags.push(dot < Math.cos(MathUtils.toRad(40)));
		}

		return splitFlags;
	}

	private splitPolygon(points: Vec2[]): Vec2[][] {
		const splitFlags = this.getPolygonSplitFlags(points);
		const firstSplitIndex = splitFlags.findIndex(f => f);

		if (firstSplitIndex !== -1) {
			for (let i = 0; i < firstSplitIndex; i++) {
				points.push(points.shift());
				splitFlags.push(splitFlags.shift());
			}
		}

		let currentPolyline: Vec2[] = [points[0]];
		const polylines: Vec2[][] = [];

		for (let i = 1; i < points.length + 1; i++) {
			const point = points[i] ?? points[0];
			const split = splitFlags[i] ?? splitFlags[0];

			currentPolyline.push(point);

			if (split || i === points.length) {
				polylines.push(currentPolyline);
				currentPolyline = [point];
			}
		}

		return polylines;
	}

	private calculateSplitsNormals(): void {
		this.splitsNormals = calculateSplitsNormals(this.splits);
	}
}