import Way3D from "~/app/world/geometry/features/3d/Way3D";
import RoofBuilder, {RoofGeometry} from "~/app/world/geometry/roofs/RoofBuilder";
import Utils from "~/app/Utils";
import {RingType} from "~/app/world/geometry/features/3d/Ring3D";
import polylabel from "polylabel";
import MathUtils from "~/math/MathUtils";
import Vec3 from "~/math/Vec3";

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
		const center = polylabel([ringVertices], 1);

		const minHeight = way.minGroundHeight + (+way.tags.height || 6) * way.heightFactor;
		const maxHeight = minHeight + +way.tags.roofHeight || 8;

		const vertices = new Float32Array(ringVertices.length * 9);
		const normals = new Float32Array(ringVertices.length * 9);

		for (let i = 0; i < ringVertices.length; i++) {
			const vertex = ringVertices[i];
			const nextVertex = ringVertices[i + 1] || ringVertices[0];

			vertices[i * 9] = vertex[0];
			vertices[i * 9 + 1] = minHeight;
			vertices[i * 9 + 2] = vertex[1];

			vertices[i * 9 + 3] = nextVertex[0];
			vertices[i * 9 + 4] = minHeight;
			vertices[i * 9 + 5] = nextVertex[1];

			vertices[i * 9 + 6] = center[0];
			vertices[i * 9 + 7] = maxHeight;
			vertices[i * 9 + 8] = center[1];

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
			uv: new Float32Array(vertexCount * 2),
			textureId: Utils.fillTypedArraySequence(new Uint8Array(vertexCount), new Uint8Array([0]))
		};
	}
}