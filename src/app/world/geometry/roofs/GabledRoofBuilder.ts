import Way3D from "../features/3d/Way3D";
import RoofBuilder, {RoofGeometry} from "./RoofBuilder";
import Config from "../../../Config";
import Utils from "../../../Utils";
import StraightSkeletonBuilder from "../StraightSkeletonBuilder";
import Vec3 from "~/lib/math/Vec3";
import MathUtils from "~/lib/math/MathUtils";

export default new class HippedRoofBuilder extends RoofBuilder {
	public build(way: Way3D): RoofGeometry {
		const skeleton = StraightSkeletonBuilder.buildFromWay(way);

		if (!skeleton) {
			return null;
		}

		const heightMap: Map<string, number> = new Map();
		const roofHeight = (+way.tags.roofHeight || 8) * way.heightFactor;
		const minHeight = way.minGroundHeight + (+way.tags.height || 6) * way.heightFactor - roofHeight;
		const useRoofHeight = roofHeight > 0;
		let maxHeight = 0;

		for (const [point, distance] of skeleton.Distances.entries()) {
			heightMap.set(`${point.X} ${point.Y}`, distance);
			maxHeight = Math.max(maxHeight, distance);
		}

		const vertices: number[] = [];

		for (const edge of skeleton.Edges) {
			if (edge.Polygon.length === 3) {
				const a = edge.Edge.Begin;
				const b = edge.Edge.End;
				const c = edge.Polygon.find(p => p.NotEquals(a) && p.NotEquals(b));
				const cHeight = heightMap.get(`${c.X} ${c.Y}`);

				const diff = b.Sub(a);
				const center = a.Add(diff.MultiplyScalar(0.5));

				heightMap.set(`${center.X} ${center.Y}`, cHeight);

				vertices.push(
					a.X, 0, a.Y,
					c.X, 0, c.Y,
					center.X, 0, center.Y,

					b.X, 0, b.Y,
					center.X, 0, center.Y,
					c.X, 0, c.Y,

					a.X, 0, a.Y,
					center.X, cHeight, center.Y,
					b.X, 0, b.Y
				);

				continue;
			}

			for (let i = 2; i < edge.Polygon.length; i++) {
				vertices.push(
					edge.Polygon[0].X, 0, edge.Polygon[0].Y,
					edge.Polygon[i].X, 0, edge.Polygon[i].Y,
					edge.Polygon[i - 1].X, 0, edge.Polygon[i - 1].Y
				);
			}
		}

		for (let i = 0; i < vertices.length; i += 3) {
			const x = vertices[i];
			const z = vertices[i + 2];
			const y = vertices[i + 1] || heightMap.get(`${x} ${z}`);

			const height = useRoofHeight ? (y / maxHeight * roofHeight) : (y * 0.5);

			vertices[i + 1] = height * way.heightFactor + minHeight;
		}

		const normals = new Float32Array(vertices.length);

		for (let i = 0; i < vertices.length; i += 9) {
			const a = new Vec3(vertices[i], vertices[i + 1], vertices[i + 2]);
			const b = new Vec3(vertices[i + 3], vertices[i + 4], vertices[i + 5]);
			const c = new Vec3(vertices[i + 6], vertices[i + 7], vertices[i + 8]);

			const normal: [number, number, number] = Vec3.toArray(MathUtils.calculateNormal(a, b, c));

			for (let j = i; j < i + 9; j++) {
				normals[j] = normal[j % 3];
			}
		}

		const vertexCount = vertices.length / 3;

		return {
			position: new Float32Array(vertices),
			normal: normals,
			uv: new Float32Array(vertexCount * 2),
			textureId: Utils.fillTypedArraySequence(new Uint8Array(vertexCount), new Uint8Array([0]))
		};
	}
}