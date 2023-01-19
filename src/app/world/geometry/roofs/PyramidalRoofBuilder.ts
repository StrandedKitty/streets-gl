import Way3D from "../features/3d/Way3D";
import RoofBuilder, {RoofGeometry} from "./RoofBuilder";
import Utils from "../../../Utils";
import {RingType} from "../features/3d/Ring3D";
import MathUtils from "~/lib/math/MathUtils";
import Vec3 from "~/lib/math/Vec3";
import Vec2 from "~/lib/math/Vec2";
import polylabel from "polylabel";

export default new class PyramidalRoofBuilder extends RoofBuilder {
	public build(way: Way3D): RoofGeometry {
		const outerRing = way.rings.find(r => r.type === RingType.Outer);

		if (!outerRing) {
			return {
				position: new Float32Array(),
				normal: new Float32Array(),
				uv: new Float32Array(),
				textureId: new Uint8Array()
			};
		}

		const ringVertices = outerRing.vertices.slice(0, -1);
		let center = MathUtils.getPolygonCentroid(ringVertices);

		if (!MathUtils.isPointInsidePolygon(center, ringVertices)) {
			center = polylabel([ringVertices], 1) as [number, number];
		}

		const height = (+way.tags.roofHeight || 8) * way.heightFactor;
		const minHeight = way.minGroundHeight + (+way.tags.height || 6) * way.heightFactor - height;
		const maxHeight = minHeight + height;

		const vertices = new Float32Array(ringVertices.length * 9);
		const normals = new Float32Array(ringVertices.length * 9);
		const uvs = new Float32Array(ringVertices.length * 6);

		let minDstToCenter = 0;
		for (let i = 0; i < ringVertices.length; i++) {
			const vertex = ringVertices[i];
			const dstToCenter = Math.hypot(vertex[0] - center[0], vertex[1] - center[1]);

			minDstToCenter = Math.min(minDstToCenter, dstToCenter);
		}

		const roofSlopeLength = Math.hypot(minDstToCenter, height);
		let uvProgress = 0;
		const uvScale = 0.5;

		for (let i = 0; i < ringVertices.length; i++) {
			const vertex = ringVertices[i];
			const nextVertex = ringVertices[(i + 1) % ringVertices.length];
			const segmentSize = Math.hypot(vertex[0] - nextVertex[0], vertex[1] - nextVertex[1]);
			const nextUvProgress = uvProgress + segmentSize;

			vertices[i * 9] = vertex[0];
			vertices[i * 9 + 1] = minHeight;
			vertices[i * 9 + 2] = vertex[1];

			vertices[i * 9 + 3] = nextVertex[0];
			vertices[i * 9 + 4] = minHeight;
			vertices[i * 9 + 5] = nextVertex[1];

			vertices[i * 9 + 6] = center[0];
			vertices[i * 9 + 7] = maxHeight;
			vertices[i * 9 + 8] = center[1];

			const segmentDir = Vec2.sub(new Vec2(nextVertex[0], nextVertex[1]), new Vec2(vertex[0], vertex[1]));
			const segmentAngle = Vec2.normalize(segmentDir).getAngle();
			const localCenter = Vec2.rotate(Vec2.sub(new Vec2(center[0], center[1]), new Vec2(vertex[0], vertex[1])), -segmentAngle);

			uvs[i * 6] = uvProgress * uvScale;
			uvs[i * 6 + 1] = 0;
			uvs[i * 6 + 2] = nextUvProgress * uvScale;
			uvs[i * 6 + 3] = 0;
			uvs[i * 6 + 4] = (uvProgress + localCenter.x) * uvScale;
			uvs[i * 6 + 5] = roofSlopeLength * uvScale;

			uvProgress = nextUvProgress;

			const normal = MathUtils.calculateNormal(
				new Vec3(vertex[0], minHeight, vertex[1]),
				new Vec3(nextVertex[0], minHeight, nextVertex[1]),
				new Vec3(center[0], maxHeight, center[1])
			);

			for(let j = 0; j < 9; j += 3) {
				normals[i * 9 + j] = normal.x;
				normals[i * 9 + j + 1] = normal.y;
				normals[i * 9 + j + 2] = normal.z;
			}
		}

		const vertexCount = vertices.length / 3;

		return {
			position: vertices,
			normal: normals,
			uv: uvs,
			textureId: Utils.fillTypedArraySequence(new Uint8Array(vertexCount), new Uint8Array([6]))
		};
	}
}