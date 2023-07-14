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
import Config from "~/app/Config";

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

	public populateWithPoints(resolution: number, pointsPerBox: number, seed: number): Vec2[] {
		const tiles = this.getCoveredTiles(resolution, Config.TileSize);
		const points: Vec2[] = [];
		const rnd = new SeededRandom(seed);

		for (const tile of tiles) {
			const [x, y] = tile.split(' ').map(v => +v);

			for (let i = 0; i < pointsPerBox; ++i) {
				const offset = 0.5;
				const factor = 1.0;
				const point = new Vec2( // 0.75 - Math.random() * 0.5
					(x + offset - rnd.generate() * factor) / resolution * Config.TileSize,
					(y + offset - rnd.generate() * factor) / resolution * Config.TileSize,
				);

				let isInMultipolygon = true;

				// check if to close to the other points
				for (const other of points) {
					if (
						Math.abs(point.x - other.x) < Config.PlantDistance &&
						Math.abs(point.y - other.y) < Config.PlantDistance
					) {
						i = i - 1;
						isInMultipolygon = false;
					}
				}


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

	private getCoveredTiles(resolution: number, tileSize: number): Set<string> {
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
					1 / tileSize * resolution,
					1 / tileSize * resolution
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