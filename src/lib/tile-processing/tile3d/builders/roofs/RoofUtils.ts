import Vec3 from "~/lib/math/Vec3";
import MathUtils from "~/lib/math/MathUtils";
import Vec2 from "~/lib/math/Vec2";
import {StraightSkeletonResultPolygon} from "~/lib/tile-processing/tile3d/builders/Tile3DMultipolygon";
import splitPolygon from "~/lib/tile-processing/tile3d/builders/roofs/splitPolygon";

export function calculateRoofNormals(vertices: number[], flip: boolean = false): number[] {
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

export function calculateSplitsNormals(splits: Vec2[]): Vec2[] {
	const splitNormals: Vec2[] = [];
	const edgeNormals: Vec2[] = [];

	for (let i = 0; i < splits.length - 1; i++) {
		const p0 = splits[i];
		const p1 = splits[i + 1];

		const edge = Vec2.sub(p1, p0);
		edgeNormals.push(Vec2.rotateLeft(edge));
	}

	for (let i = 0; i < splits.length; i++) {
		const edge0 = edgeNormals[i - 1];
		const edge1 = edgeNormals[i];

		if (!edge0) {
			splitNormals.push(Vec2.normalize(edge1));
			continue;
		}

		if (!edge1) {
			splitNormals.push(Vec2.normalize(edge0));
			continue;
		}

		const normal = Vec2.normalize(Vec2.add(edge0, edge1));
		splitNormals.push(normal);
	}

	return splitNormals;
}

export function splitSkeletonPolygon(polygon: StraightSkeletonResultPolygon, splitAt: number): {
	verticesTop: number[];
	verticesBottom: number[];
} {
	const edgeLine: [Vec2, Vec2] = [polygon.edgeStart, polygon.edgeEnd];
	const edgeNormal = Vec2.normalize(Vec2.rotateRight(Vec2.sub(edgeLine[1], edgeLine[0])));
	const edgeOffset = Vec2.multiplyScalar(edgeNormal, -splitAt)
	const splitLine: [Vec2, Vec2] = [
		Vec2.add(edgeLine[0], edgeOffset),
		Vec2.add(edgeLine[1], edgeOffset)
	];
	const verticesToSplit: [number, number][] = [];

	for (const vertex of polygon.vertices) {
		verticesToSplit.push([vertex.x, vertex.y]);
	}

	const verticesTop: number[] = [];
	const verticesBottom: number[] = [];
	let split: [number, number][][] = null;

	try {
		split = splitPolygon(
			verticesToSplit,
			Vec2.toArray(splitLine[0]),
			Vec2.toArray(Vec2.sub(splitLine[0], splitLine[1]))
		);
	} catch (e) {
	}

	if (!split || split.length === 1) {
		for (const vertex of polygon.vertices) {
			verticesBottom.push(vertex.x, vertex.y);
		}
	} else if (split.length > 1) {
		verticesBottom.push(...split[0].flat())
		verticesTop.push(...split[1].flat());
	}

	return {
		verticesTop,
		verticesBottom
	};
}
