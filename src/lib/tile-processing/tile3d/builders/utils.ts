import Vec2 from "~/lib/math/Vec2";
import {EdgeResult, List, Skeleton, Vector2d} from "straight-skeleton";

export function colorToComponents(color: number): [number, number, number] {
	return [
		color >> 16,
		color >> 8 & 0xff,
		color & 0xff
	];
}

export function signedDstToLine(point: Vec2, line: [Vec2, Vec2]): number {
	const lineVector = Vec2.sub(line[1], line[0]);
	const pointVector = Vec2.sub(point, line[0]);
	const cross = lineVector.x * pointVector.y - lineVector.y * pointVector.x;
	const lineLength = Math.hypot(lineVector.x, lineVector.y);

	return cross / lineLength;
}

export function copySkeletonPolygons (skeleton: Skeleton): Skeleton {
	const edgesCopy: List<EdgeResult> = new List();

	for (const edgeResult of skeleton.Edges) {
		const polygonCopy: List<Vector2d> = new List();

		for (const vector of edgeResult.Polygon) {
			polygonCopy.Add(new Vector2d(vector.X, vector.Y));
		}

		const edgeResultCopy = new EdgeResult(edgeResult.Edge, polygonCopy);

		edgesCopy.Add(edgeResultCopy);
	}

	return {
		Edges: edgesCopy,
		Distances: skeleton.Distances
	};
}