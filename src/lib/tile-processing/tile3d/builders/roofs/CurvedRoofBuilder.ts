import RoofBuilder, {RoofGeometry, RoofParams} from "./RoofBuilder";
import MathUtils from "~/lib/math/MathUtils";
import Vec3 from "~/lib/math/Vec3";
import Vec2 from "~/lib/math/Vec2";
import polylabel from "polylabel";
import {Tile3DRingType} from "~/lib/tile-processing/tile3d/builders/Tile3DRing";
import {signedDstToLine} from "~/lib/tile-processing/tile3d/builders/utils";

export default abstract class CurvedRoofBuilder implements RoofBuilder {
	protected abstract splits: [number, number][];

	public build(params: RoofParams): RoofGeometry {
		const {multipolygon, minHeight, height, scaleX, scaleY} = params;

		const outerRing = multipolygon.rings.find(ring => ring.type === Tile3DRingType.Outer);
		const ringVertices = outerRing.nodes.slice(0, -1);
		const center = this.getCenter(ringVertices);
		const minDstToCenter = this.getDistanceToCenter(center, ringVertices);

		const topHeight = minHeight + height;

		const positions: number[] = [];
		const normals: number[] = [];
		const uvs: number[] = [];

		const points: Vec3[][] = [];

		for (let i = 0; i < ringVertices.length; i++) {
			const vertex = ringVertices[i];
			const pointsArray: Vec3[] = [];

			for (let i = 0; i < this.splits.length; i++) {
				const split = this.splits[i];
				const position = Vec2.lerp(center, vertex, split[1]);
				const height = MathUtils.lerp(minHeight, topHeight, split[0]);
				pointsArray.push(new Vec3(position.x, height, position.y));
			}

			points.push(pointsArray);
		}

		let uvProgressX = 0;

		for (let i = 0; i < points.length; i++) {
			const arr0 = points[i];
			const arr1 = points[(i + 1) % points.length];

			const a: [Vec2, Vec2] = [arr0[0].xz, arr1[0].xz];
			const b: [Vec2, Vec2] = [arr0[0].xz, Vec2.add(arr0[0].xz, Vec2.rotateRight(Vec2.sub(arr1[0].xz, arr0[0].xz)))];

			for (let j = 0; j < arr0.length - 1; j++) {
				const p0 = arr0[j];
				const p1 = arr0[j + 1];
				const p2 = arr1[j];
				const p3 = arr1[j + 1];

				const segmentLength = Vec3.distance(p0, p2);
				const segmentDepth = Vec2.distance(p0.xz, p1.xz);

				const poss = [p0, p2, p1, p1, p2, p3]

				for (const p of poss) {
					positions.push(p.x, p.y, p.z);

					const dstA = signedDstToLine(p.xz, a);
					const dstB = signedDstToLine(p.xz, b);

					uvs.push((dstB + uvProgressX) / scaleX, dstA / scaleY);
				}

				const normal = MathUtils.calculateNormal(p0, p2, p1);

				for (let i = 0; i < 6; i++) {
					normals.push(normal.x, normal.y, normal.z);
				}
			}

			uvProgressX += Vec2.distance(a[0], a[1]);
		}


		/*const roofSlopeLength = Math.hypot(minDstToCenter, height);
		let uvProgress = 0;
		const uvScaleX = params.scaleX;
		const uvScaleY = params.scaleY;

		for (let i = 0; i < ringVertices.length; i++) {
			const vertex = ringVertices[i];
			const nextVertex = ringVertices[(i + 1) % ringVertices.length];
			const segmentSize = Vec2.distance(vertex, nextVertex);
			const nextUvProgress = uvProgress + segmentSize;

			position[i * 9] = vertex.x;
			position[i * 9 + 1] = minHeight;
			position[i * 9 + 2] = vertex.y;

			position[i * 9 + 3] = nextVertex.x;
			position[i * 9 + 4] = minHeight;
			position[i * 9 + 5] = nextVertex.y;

			position[i * 9 + 6] = center.x;
			position[i * 9 + 7] = topHeight;
			position[i * 9 + 8] = center.y;

			const segmentDir = Vec2.sub(nextVertex, vertex);
			const segmentAngle = Vec2.normalize(segmentDir).getAngle();
			const localCenter = Vec2.rotate(Vec2.sub(center, vertex), -segmentAngle);

			uvs[i * 6] = uvProgress / uvScaleX;
			uvs[i * 6 + 1] = 0;
			uvs[i * 6 + 2] = nextUvProgress / uvScaleX;
			uvs[i * 6 + 3] = 0;
			uvs[i * 6 + 4] = (uvProgress + localCenter.x) / uvScaleX;
			uvs[i * 6 + 5] = roofSlopeLength / uvScaleY;

			uvProgress = nextUvProgress;

			const normal = MathUtils.calculateNormal(
				new Vec3(vertex.x, minHeight, vertex.y),
				new Vec3(nextVertex.x, minHeight, nextVertex.y),
				new Vec3(center.x, topHeight, center.y)
			);

			for (let j = 0; j < 9; j += 3) {
				normals[i * 9 + j] = normal.x;
				normals[i * 9 + j + 1] = normal.y;
				normals[i * 9 + j + 2] = normal.z;
			}
		}*/

		return {
			position: positions,
			normal: normals,
			uv: uvs,
			addSkirt: false,
			canExtendOutsideFootprint: true
		};
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

	private getDistanceToCenter(center: Vec2, ringVertices: Vec2[]): number {
		let dst = 0;

		for (let i = 0; i < ringVertices.length; i++) {
			const vertex = ringVertices[i];

			dst = Math.min(dst, Vec2.distance(vertex, center));
		}

		return dst;
	}
}