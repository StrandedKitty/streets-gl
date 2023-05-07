import RoofBuilder, {
	RoofGeometry,
	RoofParams,
	RoofSkirt,
	RoofSkirtPolyline
} from "~/lib/tile-processing/tile3d/builders/roofs/RoofBuilder";
import Vec2 from "~/lib/math/Vec2";
import {signedDstToLine} from "~/lib/tile-processing/tile3d/builders/utils";
import MathUtils from "~/lib/math/MathUtils";
import splitPolygon from "~/lib/tile-processing/tile3d/builders/roofs/splitPolygon";
import Vec3 from "~/lib/math/Vec3";
import Tile3DMultipolygon from "~/lib/tile-processing/tile3d/builders/Tile3DMultipolygon";
import {calculateRoofNormals, calculateSplitsNormals} from "~/lib/tile-processing/tile3d/builders/roofs/RoofUtils";

interface RoofSlice {
	vertices: [number, number][];
	heightFrom: number;
	heightTo: number;
	length: number;
	line: [Vec2, Vec2];
	uvYFrom: number;
	uvYTo: number;
	flipUV: boolean;
	normalFrom: Vec3;
	normalTo: Vec3;
}

export default abstract class OrientedRoofBuilder implements RoofBuilder {
	protected abstract splits: Vec2[];
	protected abstract isSmooth: boolean;
	private splitsNormals: Vec2[];

	public build(params: RoofParams): RoofGeometry {
		this.calculateSplitsNormals();

		const {orientation, multipolygon, minHeight, height} = params;
		const ombb = params.multipolygon.getOMBB();

		let ombbOrigin = ombb[1];
		let rotVector0 = Vec2.sub(ombb[0], ombbOrigin);
		let rotVector1 = Vec2.sub(ombb[2], ombbOrigin);
		const rotVector0Length = Vec2.getLength(rotVector0);
		const rotVector1Length = Vec2.getLength(rotVector1);

		if (
			(rotVector0Length > rotVector1Length && orientation === 'along') ||
			(rotVector0Length < rotVector1Length && orientation === 'across')
		) {
			ombbOrigin = ombb[0];
			rotVector0 = Vec2.sub(ombb[3], ombbOrigin);
			rotVector1 = Vec2.sub(ombb[1], ombbOrigin);
		}

		const rayOrigin = Vec2.sub(Vec2.add(ombbOrigin, Vec2.multiplyScalar(rotVector0, 0.5)), rotVector1);
		const verticalLine: [Vec2, Vec2] = [rayOrigin, Vec2.add(rayOrigin, rotVector0)];

		const footprint = multipolygon.getFootprint({
			height: 0,
			flip: false
		});

		const positions: number[] = [];
		const uvs: number[] = [];
		const normals: number[] = [];

		for (let i = 0; i < footprint.positions.length; i += 9) {
			const vertices = footprint.positions;
			const triangle: [number, number][] = [
				[vertices[i], vertices[i + 2]],
				[vertices[i + 3], vertices[i + 5]],
				[vertices[i + 6], vertices[i + 8]]
			];

			const rings = this.processTriangle(triangle, ombbOrigin, rotVector0, rotVector1, height);

			for (const ring of rings) {
				this.processRoofRing(
					ring,
					minHeight + height * ring.heightFrom,
					height * (ring.heightTo - ring.heightFrom),
					verticalLine,
					params.scaleX,
					params.scaleY,
					positions,
					uvs,
					normals
				);
			}
		}

		if (!this.isSmooth) {
			const flatNormals = calculateRoofNormals(positions);
			normals.push(...flatNormals);
		}

		const skirt = this.getSkirt({
			multipolygon,
			minHeight,
			height,
			origin: ombbOrigin,
			rotVector0,
			rotVector1
		});

		return {
			position: positions,
			normal: normals,
			uv: uvs,
			skirt: skirt,
			addSkirt: true,
			canExtendOutsideFootprint: true
		};
	}

	private processTriangle(
		triangle: [number, number][],
		origin: Vec2,
		rotVector0: Vec2,
		rotVector1: Vec2,
		height: number
	): RoofSlice[] {
		const slices: RoofSlice[] = [];
		let uvY = 0;

		for (let i = 1; i < this.splits.length; i++) {
			const split = this.splits[i];
			const prevSplit = this.splits[i - 1];
			const rayOrigin = Vec2.sub(
				Vec2.add(
					origin,
					Vec2.multiplyScalar(rotVector0, split.x)
				),
				rotVector1
			);
			const rayEnd = Vec2.add(rayOrigin, Vec2.multiplyScalar(rotVector1, 3));
			const splitLine: [Vec2, Vec2] = [rayOrigin, rayEnd];
			const roofLength = Vec2.getLength(rotVector0);

			const uvYStep = Vec2.distance(
				new Vec2(prevSplit.x * roofLength, prevSplit.y * height),
				new Vec2(split.x * roofLength, split.y * height),
			);
			const uvYNext = uvY + uvYStep;
			const isUVReversed = split.y < prevSplit.y;

			const normalFrom2D = this.splitsNormals[i - 1];
			const normalTo2D = this.splitsNormals[i];

			const scaleX = roofLength;
			const scaleY = height;
			const angle = Vec2.angleClockwise(new Vec2(0, 1), rotVector1);
			const normalFromRotated = Vec3.rotateAroundAxis(
				new Vec3(normalFrom2D.x / scaleX, normalFrom2D.y / scaleY, 0),
				new Vec3(0, 1, 0),
				-angle - Math.PI
			);
			const normalToRotated = Vec3.rotateAroundAxis(
				new Vec3(normalTo2D.x / scaleX, normalTo2D.y / scaleY, 0),
				new Vec3(0, 1, 0),
				-angle - Math.PI
			);

			if (i === this.splits.length - 1) {
				slices.push({
					vertices: triangle,
					line: splitLine,
					heightFrom: prevSplit.y,
					heightTo: split.y,
					length: (split.x - prevSplit.x) * Vec2.getLength(rotVector0),
					uvYFrom: uvY,
					uvYTo: uvYNext,
					flipUV: isUVReversed,
					normalFrom: Vec3.normalize(normalFromRotated),
					normalTo: Vec3.normalize(normalToRotated),
				});

				break;
			}

			const result = this.splitTriangle(triangle, splitLine);

			if (result.verticesBottom.length > 0) {
				slices.push({
					vertices: result.verticesBottom,
					line: splitLine,
					heightFrom: prevSplit.y,
					heightTo: split.y,
					length: (split.x - prevSplit.x) * Vec2.getLength(rotVector0),
					uvYFrom: uvY,
					uvYTo: uvYNext,
					flipUV: isUVReversed,
					normalFrom: Vec3.normalize(normalFromRotated),
					normalTo: Vec3.normalize(normalToRotated),
				});
			}

			uvY = uvYNext;

			if (result.verticesTop.length > 0) {
				triangle = result.verticesTop;
			} else {
				break;
			}
		}

		return slices;
	}

	private getSplitLine(
		split: Vec2,
		origin: Vec2,
		rotVector0: Vec2,
		rotVector1: Vec2,
	): [Vec2, Vec2] {
		const rayOrigin = Vec2.sub(
			Vec2.add(
				origin,
				Vec2.multiplyScalar(rotVector0, split.x)
			),
			rotVector1
		);
		const rayEnd = Vec2.add(rayOrigin, Vec2.multiplyScalar(rotVector1, 3));

		return [rayOrigin, rayEnd];
	}

	private processRoofRing(
		ring: RoofSlice,
		minHeight: number,
		height: number,
		verticalLine: [Vec2, Vec2],
		scaleX: number,
		scaleY: number,
		positionsOut: number[],
		uvsOut: number[],
		normalsOut: number[]
	): void {
		if (!ring.length) {
			return;
		}

		for (let j = 2; j < ring.vertices.length; j++) {
			const nodes: [number, number][] = [
				ring.vertices[0],
				ring.vertices[j - 1],
				ring.vertices[j]
			];

			for (const node of nodes) {
				const nodeVec = new Vec2(node[0], node[1]);
				const nodeDst = signedDstToLine(nodeVec, ring.line);
				const vertexAlpha = 1 - Math.abs(nodeDst) / ring.length;

				positionsOut.push(
					node[0],
					minHeight + vertexAlpha * height,
					node[1]
				);

				const uvXDst = signedDstToLine(nodeVec, verticalLine);

				let uvX = uvXDst / scaleX;
				let uvY = MathUtils.lerp(ring.uvYFrom, ring.uvYTo, vertexAlpha) / scaleY;

				if (ring.flipUV) {
					uvX *= -1;
					uvY *= -1;
				}

				uvsOut.push(uvX, uvY);

				if (this.isSmooth) {
					const normal = Vec3.lerp(ring.normalFrom, ring.normalTo, vertexAlpha);
					normalsOut.push(normal.x, normal.y, normal.z);
				}
			}
		}
	}

	private splitTriangle(triangle: [number, number][], line: [Vec2, Vec2]): {
		verticesTop: [number, number][];
		verticesBottom: [number, number][];
	} {
		const verticesToSplit: [number, number][] = triangle;

		const verticesTop: [number, number][] = [];
		const verticesBottom: [number, number][] = [];
		let split: [number, number][][] = null;

		try {
			split = splitPolygon(
				verticesToSplit,
				Vec2.toArray(line[0]),
				Vec2.toArray(Vec2.sub(line[0], line[1]))
			);
		} catch (e) {

		}

		if (!split || split.length === 1) {
			verticesTop.push(...verticesToSplit);
		} else if (split.length > 1) {
			verticesTop.push(...split[1]);
			verticesBottom.push(...split[0]);
		}

		const bottomMaxDst = this.getSplitRingMaxDstToLine(verticesBottom, line);
		const topMaxDst = this.getSplitRingMaxDstToLine(verticesTop, line);

		const reverseRings = (verticesBottom.length !== 0 && bottomMaxDst > 0.0001) ||
			(verticesTop.length !== 0 && topMaxDst < 0.0001);

		return {
			verticesTop: reverseRings ? verticesBottom : verticesTop,
			verticesBottom: reverseRings ? verticesTop : verticesBottom
		};
	}

	private getSplitRingMaxDstToLine(ring: [number, number][], line: [Vec2, Vec2]): number {
		let maxDst: number = -Infinity;

		for (let j = 0; j < ring.length; j++) {
			const [x, y] = ring[j];
			const dst = signedDstToLine(new Vec2(x, y), line);

			if (dst > maxDst) {
				maxDst = dst;
			}
		}

		return maxDst;
	}

	private getSkirt(
		{
			multipolygon,
			minHeight,
			height,
			origin,
			rotVector0,
			rotVector1
		}: {
			multipolygon: Tile3DMultipolygon;
			minHeight: number;
			height: number;
			origin: Vec2;
			rotVector0: Vec2;
			rotVector1: Vec2;
		}
	): RoofSkirt {
		const skirt: RoofSkirt = [];

		for (const ring of multipolygon.rings) {
			const skirtPolyline: RoofSkirtPolyline = {
				points: [],
				hasWindows: false
			};
			skirt.push(skirtPolyline);

			for (let i = 0; i < ring.nodes.length; i++) {
				const node = ring.nodes[i];
				const nextNode = ring.nodes[i + 1];
				const heightNormalized = this.getPointHeight(node, origin, rotVector0, rotVector1);

				skirtPolyline.points.push({
					position: node,
					height: minHeight + height * Math.abs(heightNormalized)
				});

				if (!nextNode) {
					continue;
				}

				const intersectionPoints: {position: Vec2; progress: number}[] = [];

				for (let j = 1; j < this.splits.length - 1; j++) {
					const line = this.getSplitLine(
						this.splits[j],
						origin,
						rotVector0,
						rotVector1
					);

					const intersection = MathUtils.getIntersectionLineLine(
						[node.x, node.y],
						[nextNode.x, nextNode.y],
						[line[0].x, line[0].y],
						[line[1].x, line[1].y]
					);

					if (!intersection) {
						continue;
					}

					const position = new Vec2(intersection[0], intersection[1]);
					const progress = MathUtils.getPointProgressAlongLineSegment(node, nextNode, position);

					intersectionPoints.push({
						position,
						progress
					});
				}

				intersectionPoints.sort((a, b) => a.progress - b.progress);

				for (const {position} of intersectionPoints) {
					const heightNormalized = this.getPointHeight(position, origin, rotVector0, rotVector1);

					skirtPolyline.points.push({
						position: position,
						height: minHeight + height * Math.abs(heightNormalized)
					});
				}
			}
		}

		return skirt;
	}

	private getPointHeight(
		point: Vec2,
		origin: Vec2,
		rotVector0: Vec2,
		rotVector1: Vec2,
	): number {
		const split: [Vec2, Vec2] = [origin, Vec2.add(origin, rotVector1)];

		const nodeDst = signedDstToLine(point, split) / Vec2.getLength(rotVector0);

		for (let i = 1; i < this.splits.length; i++) {
			if (nodeDst < this.splits[i].x) {
				const from = this.splits[i - 1];
				const to = this.splits[i];

				return MathUtils.lerp(from.y, to.y, (nodeDst - from.x) / (to.x - from.x));
			}
		}

		return 0;
	}

	private calculateSplitsNormals(): void {
		this.splitsNormals = calculateSplitsNormals(this.splits);
	}
}