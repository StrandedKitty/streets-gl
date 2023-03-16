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

export default class OrientedGabledRoofBuilder implements RoofBuilder {
	public build(params: RoofParams): RoofGeometry {
		const {orientation, multipolygon, minHeight, height} = params;
		const ombb = params.multipolygon.getOMBB();

		const ombbOrigin = ombb[1];
		let rotVector0 = Vec2.sub(ombb[0], ombbOrigin);
		let rotVector1 = Vec2.sub(ombb[2], ombbOrigin);

		if (
			(Vec2.getLength(rotVector0) > Vec2.getLength(rotVector1) && orientation === 'along') ||
			(Vec2.getLength(rotVector0) < Vec2.getLength(rotVector1) && orientation === 'across')
		) {
			[rotVector0, rotVector1] = [rotVector1, rotVector0];
		}

		const rayOrigin = Vec2.sub(Vec2.add(ombbOrigin, Vec2.multiplyScalar(rotVector0, 0.5)), rotVector1);
		const rayEnd = Vec2.add(rayOrigin, Vec2.multiplyScalar(rotVector1, 3));
		const split: [Vec2, Vec2] = [rayOrigin, rayEnd];
		const faceDepth = Vec2.getLength(rotVector0) * 0.5;

		const verticalLine: [Vec2, Vec2] = [rayOrigin, Vec2.add(rayOrigin, rotVector0)];

		const footprint = multipolygon.getFootprint({
			height: 0,
			flip: false
		});

		const positions: number[] = [];
		const uvs: number[] = [];

		for (let i = 0; i < footprint.positions.length; i += 9) {
			const vertices = footprint.positions;
			const triangle: [number, number][] = [
				[vertices[i], vertices[i + 2]],
				[vertices[i + 3], vertices[i + 5]],
				[vertices[i + 6], vertices[i + 8]]
			];
			const result = this.splitTriangle(triangle, split);

			for (const ring of [result.verticesTop, result.verticesBottom]) {
				if (!ring.length) {
					continue;
				}

				for (let j = 2; j < ring.length / 2; j++) {
					const nodes = [
						[ring[0], 0, ring[1]],
						[ring[j * 2 - 2], 0, ring[j * 2 - 1]],
						[ring[j * 2], 0, ring[j * 2 + 1]]
					];

					for (const node of nodes) {
						const nodeVec = new Vec2(node[0], node[2]);
						const nodeDst = signedDstToLine(nodeVec, split);

						node[1] = minHeight + (1 - Math.abs(nodeDst) / faceDepth) * height;
						positions.push(...node);

						const uvXDst = signedDstToLine(nodeVec, verticalLine);
						const uvYScale = Math.sin(Math.atan(faceDepth / height));
						uvs.push(
							uvXDst / params.scaleX,
							nodeDst / uvYScale / params.scaleY
						);
					}
				}
			}
		}

		const normals = this.calculateNormals(positions);
		const skirt = this.getSkirt({
			multipolygon,
			minHeight,
			height,
			split,
			faceDepth
		});

		return {
			position: positions,
			normal: normals,
			uv: uvs,
			addSkirt: true,
			skirt
		};
	}

	private splitTriangle(triangle: [number, number][], line: [Vec2, Vec2]): {verticesTop: number[]; verticesBottom: number[]} {
		const verticesToSplit: [number, number][] = triangle;

		const verticesTop: number[] = [];
		const verticesBottom: number[] = [];
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
			verticesBottom.push(...verticesToSplit.flat());
		} else if (split.length > 1) {
			verticesBottom.push(...split[1].flat())
			verticesTop.push(...split[0].flat());
		}

		return {
			verticesTop,
			verticesBottom
		};
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

	private getSkirt(
		{
			multipolygon,
			split,
			minHeight,
			height,
			faceDepth
		}: {
			multipolygon: Tile3DMultipolygon;
			split: [Vec2, Vec2];
			minHeight: number;
			height: number;
			faceDepth: number;
		}
	): RoofSkirt {
		const skirt: RoofSkirt = [];

		for (const ring of multipolygon.rings) {
			const skirtPolyline: RoofSkirtPolyline = [];
			skirt.push(skirtPolyline);

			for (let i = 0; i < ring.nodes.length; i++) {
				const node = ring.nodes[i];
				const nextNode = ring.nodes[i + 1];
				const nodeDst = signedDstToLine(node, split);

				skirtPolyline.push({
					position: node,
					height: minHeight + (1 - Math.abs(nodeDst) / faceDepth) * height
				});

				if (nextNode) {
					const intersection = MathUtils.getIntersectionLineLine(
						[node.x, node.y],
						[nextNode.x, nextNode.y],
						[split[0].x, split[0].y],
						[split[1].x, split[1].y]
					);

					if (intersection) {
						const nodeDst = signedDstToLine(new Vec2(intersection[0], intersection[1]), split);

						skirtPolyline.push({
							position: new Vec2(intersection[0], intersection[1]),
							height: minHeight + (1 - Math.abs(nodeDst) / faceDepth) * height
						});
					}
				}
			}
		}

		return skirt;
	}
}