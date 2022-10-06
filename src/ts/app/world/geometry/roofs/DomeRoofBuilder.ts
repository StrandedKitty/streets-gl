import Way3D from "~/app/world/geometry/features/3d/Way3D";
import RoofBuilder, {RoofGeometry} from "~/app/world/geometry/roofs/RoofBuilder";
import Utils from "~/app/Utils";
import {RingType} from "~/app/world/geometry/features/3d/Ring3D";
import MathUtils from "~/math/MathUtils";
import Vec3 from "~/math/Vec3";
import polylabel from "polylabel";
import Vec2 from "~/math/Vec2";

const DomeSteps = 8;

export default new class DomeRoofBuilder extends RoofBuilder {
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

		const minHeight = way.minGroundHeight + (+way.tags.height || 6) * way.heightFactor;
		const roofHeight = +way.tags.roofHeight || 40;

		const centerVertex = new Vec2(center[0], center[1]);

		const vertices: number[] = [];
		const normals: number[] = [];

		const smoothness = [];

		for (let i = 0; i < ringVertices.length; i++) {
			const prevVertexId = i < 1 ? ringVertices.length - 1 : i - 1;

			const vertexArr = ringVertices[i];
			const nextVertexArr = ringVertices[(i + 1) % ringVertices.length];
			const prevVertexArr = ringVertices[prevVertexId];

			const vertex = new Vec2(vertexArr[0], vertexArr[1]);
			const nextVertex = new Vec2(nextVertexArr[0], nextVertexArr[1]);
			const prevVertex = new Vec2(prevVertexArr[0], prevVertexArr[1]);

			const segmentVector = Vec2.normalize(Vec2.sub(nextVertex, vertex));
			const prevSegmentVector = Vec2.normalize(Vec2.sub(vertex, prevVertex));
			const dotProduct = Vec2.dot(segmentVector, prevSegmentVector);

			smoothness.push(dotProduct > 0.8);
		}

		for (let i = 0; i < ringVertices.length; i++) {
			const vertexArr = ringVertices[i];
			const nextVertexArr = ringVertices[(i + 1) % ringVertices.length];

			const vertex = new Vec2(vertexArr[0], vertexArr[1]);
			const nextVertex = new Vec2(nextVertexArr[0], nextVertexArr[1]);

			const vecToCenter = Vec2.sub(centerVertex, vertex);
			const vecToCenterNext = Vec2.sub(centerVertex, nextVertex);
			const vecToCenterNorm = Vec2.normalize(vecToCenter);
			const vecToCenterNextNorm = Vec2.normalize(vecToCenterNext);

			for (let step = 0; step < DomeSteps; step++) {
				const progress = 1 - Math.cos(step / DomeSteps * Math.PI / 2);
				const localRoofHeight = Math.sin(step / DomeSteps * Math.PI / 2);
				const height = minHeight + localRoofHeight * roofHeight;

				const progressNext = 1 - Math.cos((step + 1) / DomeSteps * Math.PI / 2);
				const localRoofHeightNext = Math.sin((step + 1) / DomeSteps * Math.PI / 2);
				const heightNext = minHeight + localRoofHeightNext * roofHeight;

				const p1 = Vec2.add(vertex, Vec2.multiplyScalar(vecToCenter, progress));
				const p2 = Vec2.add(nextVertex, Vec2.multiplyScalar(vecToCenterNext, progress));
				const p3 = Vec2.add(vertex, Vec2.multiplyScalar(vecToCenter, progressNext));
				const p4 = Vec2.add(nextVertex, Vec2.multiplyScalar(vecToCenterNext, progressNext));

				vertices.push(p1.x, height, p1.y);
				vertices.push(p2.x, height, p2.y);
				vertices.push(p4.x, heightNext, p4.y);

				vertices.push(p1.x, height, p1.y);
				vertices.push(p4.x, heightNext, p4.y);
				vertices.push(p3.x, heightNext, p3.y);

				const centerNormal = Vec2.multiplyScalar(Vec2.add(vecToCenterNorm, vecToCenterNextNorm), 0.5);
				let vecToCenter1 = smoothness[i] ? vecToCenterNorm : centerNormal;
				let vecToCenter2 = smoothness[(i + 1) % ringVertices.length] ? vecToCenterNextNorm : centerNormal;
				vecToCenter1 = Vec2.multiplyScalar(vecToCenter1, 1 - progress);
				vecToCenter2 = Vec2.multiplyScalar(vecToCenter2, 1 - progress);

				const a = Vec2.getLength(vecToCenter) / roofHeight
				const b = Vec2.getLength(vecToCenterNext) / roofHeight;

				normals.push(...Vec3.toArray(new Vec3(-vecToCenter1.x, localRoofHeight * a, -vecToCenter1.y).normalize()));
				normals.push(...Vec3.toArray(new Vec3(-vecToCenter2.x, localRoofHeight * a, -vecToCenter2.y).normalize()));
				normals.push(...Vec3.toArray(new Vec3(-vecToCenter2.x, localRoofHeightNext * b, -vecToCenter2.y).normalize()));

				normals.push(...Vec3.toArray(new Vec3(-vecToCenter1.x, localRoofHeight * a, -vecToCenter1.y).normalize()));
				normals.push(...Vec3.toArray(new Vec3(-vecToCenter2.x, localRoofHeightNext * b, -vecToCenter2.y).normalize()));
				normals.push(...Vec3.toArray(new Vec3(-vecToCenter1.x, localRoofHeightNext * b, -vecToCenter1.y).normalize()));
			}
		}

		const position = new Float32Array(vertices);
		const vertexCount = position.length / 3;
		const normal = new Float32Array(normals);

		return {
			position,
			normal,
			uv: new Float32Array(vertexCount * 2),
			textureId: new Uint8Array(vertexCount)
		};
	}
}