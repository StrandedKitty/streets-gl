import Tile3DRing, {Tile3DRingType} from "~/lib/tile-processing/tile3d/builders/Tile3DRing";
import earcut from "earcut";
import {Skeleton, SkeletonBuilder} from "straight-skeleton";
import AABB2D from "~/lib/math/AABB2D";
import Vec2 from "~/lib/math/Vec2";
import * as OMBB from "~/lib/math/OMBB";
import polylabel from "polylabel";
import Vec3 from "~/lib/math/Vec3";
import MathUtils from "~/lib/math/MathUtils";
import SeededRandom from "~/lib/math/SeededRandom";

interface EarcutInput {
	vertices: number[];
	holes: number[];
}

export type OMBBResult = [Vec2, Vec2, Vec2, Vec2];

export default class Tile3DMultipolygon {
	public readonly rings: Tile3DRing[] = [];

	private cachedStraightSkeleton: Skeleton = null;
	private cachedOMBB: OMBBResult = null;
	private cachedPoleOfInaccessibility: Vec3 = null;

	public constructor() {
	}

	public addRing(ring: Tile3DRing): void {
		this.rings.push(ring);
	}

	public setOMBB(ombb: OMBBResult): void {
		this.cachedOMBB = ombb;
	}

	public setPoleOfInaccessibility(poi: Vec3): void {
		this.cachedPoleOfInaccessibility = poi;
	}

	public getFootprint(
		{
			height,
			flip
		}: {
			height: number;
			flip: boolean;
		}
	): {
		positions: number[];
		uvs: number[];
		normals: number[];
	} {
		const positions: number[] = [];
		const uvs: number[] = [];
		const normals: number[] = [];
		const normalY = flip ? -1 : 1;

		const inners = this.rings.filter(ring => ring.type === Tile3DRingType.Inner);
		const outers = this.rings.filter(ring => ring.type === Tile3DRingType.Outer);

		for (const outer of outers) {
			const {vertices, holes} = this.getRingEarcutInput(outer, inners);
			const triangles = earcut(vertices, holes);

			if (!flip) {
				triangles.reverse();
			}

			for (let i = 0; i < triangles.length; i++) {
				positions.push(
					vertices[triangles[i] * 2],
					height,
					vertices[triangles[i] * 2 + 1]
				);
				uvs.push(vertices[triangles[i] * 2], vertices[triangles[i] * 2 + 1]);
				normals.push(0, normalY, 0);
			}
		}

		return {
			positions,
			uvs,
			normals
		};
	}

	private getRingEarcutInput(outerRing: Tile3DRing, innerRings: Tile3DRing[]): EarcutInput {
		let vertices: number[] = [...outerRing.getFlattenVertices()];
		const holes: number[] = [];

		for (const inner of innerRings) {
			holes.push(vertices.length / 2);
			vertices = vertices.concat(inner.getFlattenVertices());
		}

		return {vertices, holes};
	}

	public getStraightSkeleton(): Skeleton {
		if (!this.cachedStraightSkeleton) {
			const inputRings = this.getStraightSkeletonInput();

			if (inputRings.length === 0) {
				return null;
			}

			let skeleton: Skeleton = null;

			try {
				skeleton = SkeletonBuilder.BuildFromGeoJSON(inputRings);
			} catch (e) {
				console.error('Failed to build straight skeleton\n', e);
			}

			this.cachedStraightSkeleton = skeleton;
		}

		return this.cachedStraightSkeleton;
	}

	private getStraightSkeletonInput(): [number, number][][][] {
		const outerRing = this.rings.find(ring => ring.type === Tile3DRingType.Outer);
		const innerRings = this.rings.filter(ring => ring.type === Tile3DRingType.Inner);

		if (!outerRing) {
			return [];
		}

		const rings = [outerRing.getGeoJSONVertices().slice(1)];

		for (const innerRing of innerRings) {
			rings.push(innerRing.getGeoJSONVertices().slice(1));
		}

		return [rings];
	}

	public getAABB(): AABB2D {
		const aabb = new AABB2D();

		for (const ring of this.rings) {
			aabb.includeAABB(ring.getAABB());
		}

		return aabb;
	}

	private getOMBBInput(): OMBB.Vector[] {
		const vectors: OMBB.Vector[] = [];

		for (const ring of this.rings) {
			if (ring.type === Tile3DRingType.Outer) {
				vectors.push(...ring.nodes.map(v => new OMBB.Vector(v.x, v.y)));
			}
		}

		return vectors;
	}

	public getOMBB(): OMBBResult {
		if (!this.cachedOMBB) {
			const points = this.getOMBBInput();
			const convexHull = OMBB.CalcConvexHull(points);
			const ombb = OMBB.ComputeOMBB(convexHull);

			this.cachedOMBB = [
				new Vec2(ombb[0].x, ombb[0].y),
				new Vec2(ombb[1].x, ombb[1].y),
				new Vec2(ombb[2].x, ombb[2].y),
				new Vec2(ombb[3].x, ombb[3].y)
			];
		}

		return this.cachedOMBB;
	}

	public getPoleOfInaccessibility(): Vec3 {
		if (!this.cachedPoleOfInaccessibility) {
			const outerRing = this.rings.find(ring => ring.type === Tile3DRingType.Outer);
			const innerRings = this.rings.filter(ring => ring.type === Tile3DRingType.Inner);

			if (!outerRing) {
				return null;
			}

			const outerPolygon = outerRing.getGeoJSONVertices();
			const innerPolygons = innerRings.map(ring => ring.getGeoJSONVertices());

			const result = polylabel([outerPolygon, ...innerPolygons], 1) as unknown as
				{0: number; 1: number; distance: number};

			this.cachedPoleOfInaccessibility = new Vec3(
				result[0],
				result[1],
				result.distance
			);
		}

		return this.cachedPoleOfInaccessibility;
	}

	// https://en.wikipedia.org/wiki/Halton_sequence
	// https://codesandbox.io/s/halton-sequence-positioning-80tnv?file=/src/App.js:183-189
	private halton(index: number, base: number): number {
		let fraction = 1;
		let result = 0;
		while (index > 0) {
			fraction /= base;
			result += fraction * (index % base);
			index = ~~(index / base); // floor division
		}
		return result;
	}

	public populateWithPoints(plantTileSize: number, pointsPerBox: number, seed: number): Vec2[] {
		const tiles = this.getCoveredTiles(plantTileSize);
		const points: Vec2[] = [];
		const rnd = new SeededRandom(seed);

		for (const tile of tiles) {
			const [x, y] = tile.split(' ').map(v => +v);

			let xBase = 2;
			let yBase = 3;
			if ((x + y) % 2) {
				xBase = 3;
				yBase = 2;
			}

			for (let i = 1; i < pointsPerBox; ++i) {
				const point = new Vec2(
					(x + this.halton(i, xBase)) * plantTileSize,
					(y + this.halton(i, yBase)) * plantTileSize,
				);

				let isInMultipolygon = true;

				for (const ring of this.rings) {
					if (ring.type === Tile3DRingType.Outer) {
						if (!ring.isContainsPoints(point)) {
							isInMultipolygon = false;
						}
					} else {
						if (ring.isContainsPoints(point)) {
							isInMultipolygon = false;
						}
					}
				}

				if (isInMultipolygon) {
					points.push(point);
				}

			}

		}

		return points;
	}

	private getCoveredTiles(plantTileSize: number): Set<string> {
		const tiles: Set<string> = new Set();
		const multipolygons: Tile3DRing[][] = [];

		for (const ring of this.rings) {
			if (ring.type === Tile3DRingType.Outer) {
				multipolygons.push([ring]);
			} else {
				if (!multipolygons[multipolygons.length - 1]) {
					console.error('Invalid ring order, skipping covered tiles calculation');
					return tiles;
				}

				multipolygons[multipolygons.length - 1].push(ring);
			}
		}

		for (const multipolygon of multipolygons) {
			const {vertices, holes} = this.getRingEarcutInput(multipolygon[0], multipolygon.slice(1));
			const triangles = earcut(vertices, holes);

			for (let i = 0; i < triangles.length; i += 3) {
				const triangle: [number, number][] = [
					[vertices[triangles[i] * 2], vertices[triangles[i] * 2 + 1]],
					[vertices[triangles[i + 1] * 2], vertices[triangles[i + 1] * 2 + 1]],
					[vertices[triangles[i + 2] * 2], vertices[triangles[i + 2] * 2 + 1]]
				];

				const covered = MathUtils.getTilesUnderTriangle(
					triangle,
					1 / plantTileSize,
					1 / plantTileSize
				);

				for (const tile of covered) {
					tiles.add(`${tile.x} ${tile.y}`);
				}
			}
		}

		return tiles;
	}

	public getArea(): number {
		let area: number = 0;

		for (const ring of this.rings) {
			area += ring.getArea();
		}

		return area;
	}
}