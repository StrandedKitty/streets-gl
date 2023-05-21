import Vec2 from "~/lib/math/Vec2";
import {EdgeResult, List, Skeleton, Vector2d} from "straight-skeleton";
import GeometryGroundProjector from "~/lib/tile-processing/tile3d/builders/GeometryGroundProjector";
import Config from "~/app/Config";
import {OMBBResult} from "~/lib/tile-processing/tile3d/builders/Tile3DMultipolygon";
import MathUtils from "~/lib/math/MathUtils";

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

export function getNearestDirection(angle: number): number {
	const normalizedAngle = MathUtils.toDeg(MathUtils.normalizeAngle(MathUtils.toRad(angle)));

	if (normalizedAngle >= 45 && normalizedAngle < 135) {
		return 90;
	}

	if (normalizedAngle >= 135 && normalizedAngle < 225) {
		return 180;
	}

	if (normalizedAngle >= 225 && normalizedAngle < 315) {
		return 270;
	}

	return 0;
}

export function getRotationVectorsFromOMBB(
	ombb: OMBBResult,
	orientation: 'along' | 'across',
	direction: number
): {
	origin: Vec2;
	rotVector0: Vec2;
	rotVector1: Vec2;
} {
	let ombbOrigin = ombb[0];
	let rotVector0 = Vec2.sub(ombb[3], ombbOrigin);
	let rotVector1 = Vec2.sub(ombb[1], ombbOrigin);

	if (typeof direction === 'number') {
		const currentAngle = Vec2.angleClockwise(new Vec2(1, 0), rotVector0);
		const rotation = getNearestDirection(direction - MathUtils.toDeg(currentAngle));

		if (rotation !== 0) {
			let diff = rotation;

			if (diff < 0) {
				diff += 360;
			}

			const originIndex = Math.floor(diff / 90); // floor just to be sure
			const rotVector0Index = (originIndex + 3) % 4;
			const rotVector1Index = (originIndex + 1) % 4;

			ombbOrigin = ombb[originIndex];
			rotVector0 = Vec2.sub(ombb[rotVector0Index], ombbOrigin);
			rotVector1 = Vec2.sub(ombb[rotVector1Index], ombbOrigin);
		}
	} else if (typeof orientation === 'string') {
		const rotVector0Length = Vec2.getLength(rotVector0);
		const rotVector1Length = Vec2.getLength(rotVector1);

		if (
			(rotVector0Length > rotVector1Length && orientation === 'along') ||
			(rotVector0Length < rotVector1Length && orientation === 'across')
		) {
			ombbOrigin = ombb[1];
			rotVector0 = Vec2.sub(ombb[0], ombbOrigin);
			rotVector1 = Vec2.sub(ombb[2], ombbOrigin);
		}
	}

	return {
		origin: ombbOrigin,
		rotVector0,
		rotVector1,
	};
}