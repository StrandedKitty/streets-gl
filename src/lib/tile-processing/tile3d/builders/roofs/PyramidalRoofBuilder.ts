import RoofBuilder, {RoofGeometry, RoofParams} from "./RoofBuilder";
import MathUtils from "~/lib/math/MathUtils";
import Vec3 from "~/lib/math/Vec3";
import Vec2 from "~/lib/math/Vec2";
import polylabel from "polylabel";
import {Tile3DRingType} from "~/lib/tile-processing/tile3d/builders/Tile3DRing";

export default class PyramidalRoofBuilder implements RoofBuilder {
	public build(params: RoofParams): RoofGeometry {
		const {multipolygon, minHeight, height} = params;

		const outerRing = multipolygon.rings.find(ring => ring.type === Tile3DRingType.Outer);
		const ringVertices = outerRing.nodes.slice(0, -1);
		let center: Vec2 = MathUtils.getPolygonCentroidVec2(ringVertices);

		if (!MathUtils.isPointInsidePolygonVec2(center, ringVertices)) {
			const array = ringVertices.map(v => [v.x, v.y]);
			const result = polylabel([array], 1);
			center = new Vec2(result[0], result[1]);
		}

		const topHeight = minHeight + height;

		const vertices: number[] = [];
		const normals: number[] = [];
		const uvs: number[] = [];

		let minDstToCenter = 0;
		for (let i = 0; i < ringVertices.length; i++) {
			const vertex = ringVertices[i];
			const dstToCenter = Vec2.distance(vertex, center);

			minDstToCenter = Math.min(minDstToCenter, dstToCenter);
		}

		const roofSlopeLength = Math.hypot(minDstToCenter, height);
		let uvProgress = 0;
		const uvScale = 0.5;

		for (let i = 0; i < ringVertices.length; i++) {
			const vertex = ringVertices[i];
			const nextVertex = ringVertices[(i + 1) % ringVertices.length];
			const segmentSize = Vec2.distance(vertex, nextVertex);
			const nextUvProgress = uvProgress + segmentSize;

			vertices[i * 9] = vertex.x;
			vertices[i * 9 + 1] = minHeight;
			vertices[i * 9 + 2] = vertex.y;

			vertices[i * 9 + 3] = nextVertex.x;
			vertices[i * 9 + 4] = minHeight;
			vertices[i * 9 + 5] = nextVertex.y;

			vertices[i * 9 + 6] = center.x;
			vertices[i * 9 + 7] = topHeight;
			vertices[i * 9 + 8] = center.y;

			const segmentDir = Vec2.sub(nextVertex, vertex);
			const segmentAngle = Vec2.normalize(segmentDir).getAngle();
			const localCenter = Vec2.rotate(Vec2.sub(center, vertex), -segmentAngle);

			uvs[i * 6] = uvProgress * uvScale;
			uvs[i * 6 + 1] = 0;
			uvs[i * 6 + 2] = nextUvProgress * uvScale;
			uvs[i * 6 + 3] = 0;
			uvs[i * 6 + 4] = (uvProgress + localCenter.x) * uvScale;
			uvs[i * 6 + 5] = roofSlopeLength * uvScale;

			uvProgress = nextUvProgress;

			const normal = MathUtils.calculateNormal(
				new Vec3(vertex.x, minHeight, vertex.y),
				new Vec3(nextVertex.x, minHeight, nextVertex.y),
				new Vec3(center.x, topHeight, center.y)
			);

			for(let j = 0; j < 9; j += 3) {
				normals[i * 9 + j] = normal.x;
				normals[i * 9 + j + 1] = normal.y;
				normals[i * 9 + j + 2] = normal.z;
			}
		}

		return {
			position: vertices,
			normal: normals,
			uv: uvs,
			addSkirt: false
		};
	}
}