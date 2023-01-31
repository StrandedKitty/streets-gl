import Way3D from "../features/3d/Way3D";
import {EdgeResult} from "straight-skeleton";
import HippedRoofBuilder from "~/app/world/geometry/roofs/HippedRoofBuilder";

export default class GabledRoofBuilder extends HippedRoofBuilder {
	protected override getEdgeTriangles(
		way: Way3D,
		edge: EdgeResult,
		minHeight: number,
		maxHeight: number,
		roofHeight: number,
		heightMap: Map<string, number>,
		vertexOut: number[]): void
	{
		if (edge.Polygon.length === 3) {
			const a = edge.Edge.Begin;
			const b = edge.Edge.End;
			const c = edge.Polygon.find(p => p.NotEquals(a) && p.NotEquals(b));
			const cHeight = heightMap.get(`${c.X} ${c.Y}`);

			const diff = b.Sub(a);
			const center = a.Add(diff.MultiplyScalar(0.5));

			heightMap.set(`${center.X} ${center.Y}`, cHeight);

			const points = [
				a.X, 0, a.Y,
				c.X, 0, c.Y,
				center.X, 0, center.Y,

				b.X, 0, b.Y,
				center.X, 0, center.Y,
				c.X, 0, c.Y,

				a.X, 0, a.Y,
				center.X, cHeight, center.Y,
				b.X, 0, b.Y
			];

			for (let i = 0; i < points.length; i += 3) {
				const x = points[i];
				const z = points[i + 2];
				const y = heightMap.get(`${x} ${z}`) || 0;

				points[i + 1] = minHeight + y / maxHeight * roofHeight;
			}

			vertexOut.push(...points);

			return;
		}

		super.getEdgeTriangles(way, edge, minHeight, maxHeight, roofHeight, heightMap, vertexOut);
	}
}