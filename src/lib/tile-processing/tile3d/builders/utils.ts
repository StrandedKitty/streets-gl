import Vec2 from "~/lib/math/Vec2";
import {EdgeResult, List, Skeleton, Vector2d} from "straight-skeleton";
import GeometryGroundProjector from "~/lib/tile-processing/tile3d/builders/GeometryGroundProjector";
import Config from "~/app/Config";

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

export function copySkeletonPolygons(skeleton: Skeleton): Skeleton {
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

export function projectGeometryOnTerrain(
	{
		position,
		uv,
		height = 0
	}: {
		position: number[];
		uv: number[];
		height?: number;
	}
): {
	position: number[];
	uv: number[];
} {
	const projectorSegmentCount = Math.round(Config.TileSize / Config.TerrainRingSize * Config.TerrainRingSegmentCount) * 2;
	const tileSize = Config.TileSize;

	const projectedPositions: number[] = [];
	const projectedUVs: number[] = [];

	for (let i = 0, j = 0; i < position.length; i += 9, j += 6) {
		const trianglePositions: [number, number][] = [
			[position[i], position[i + 2]],
			[position[i + 3], position[i + 5]],
			[position[i + 6], position[i + 8]]
		];
		const triangleUVs: [number, number][] = [
			[uv[j], uv[j + 1]],
			[uv[j + 2], uv[j + 3]],
			[uv[j + 4], uv[j + 5]]
		];
		const projected = GeometryGroundProjector.project({
			triangle: trianglePositions,
			attributes: {
				uv: triangleUVs
			},
			tileSize: tileSize,
			segmentCount: projectorSegmentCount
		});

		if (projected.position.length > 0) {
			const newPositions = Array.from(projected.position);
			const newUVs = Array.from(projected.attributes.uv);

			for (let i = 1; i < newPositions.length; i += 3) {
				newPositions[i] = height;
			}

			projectedPositions.push(...newPositions);
			projectedUVs.push(...newUVs);
		}
	}

	return {
		position: projectedPositions,
		uv: projectedUVs
	};
}

type ProjectedPolyline = {vertices: Vec2[]; startProgress: number};

export function projectLineOnTerrain(vertices: Vec2[]): ProjectedPolyline[] {
	const projectorSegmentCount = Math.round(Config.TileSize / Config.TerrainRingSize * Config.TerrainRingSegmentCount) * 2;
	const projectedPolylines: ProjectedPolyline[] = [];
	let lineProgress: number = 0;

	for (let i = 0; i < vertices.length - 1; i++) {
		const start = vertices[i];
		const end = vertices[i + 1];
		const segmentLength = Vec2.distance(start, end);

		const projected = GeometryGroundProjector.projectLineSegment({
			lineStart: start,
			lineEnd: end,
			tileSize: Config.TileSize,
			segmentCount: projectorSegmentCount
		});

		if (projected.vertices.length === 0) {
			lineProgress += segmentLength;
			continue;
		}

		if (projectedPolylines.length > 0) {
			const lastPolylineVertices = projectedPolylines[projectedPolylines.length - 1].vertices;
			const lastPoint = lastPolylineVertices[lastPolylineVertices.length - 1];

			if (lastPoint.equals(projected.vertices[0])) {
				for (let i = 1; i < projected.vertices.length; i++) {
					lastPolylineVertices.push(projected.vertices[i]);
				}

				lineProgress += segmentLength;
				continue;
			}
		}

		projectedPolylines.push({
			vertices: projected.vertices,
			startProgress: lineProgress + projected.startProgress * segmentLength
		});

		lineProgress += segmentLength;
	}

	return projectedPolylines;
}