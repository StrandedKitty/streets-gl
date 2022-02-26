import Tile from "../objects/Tile";
import Frustum from "../../core/Frustum";
import Vec2 from "../../math/Vec2";
import PerspectiveCamera from "../../core/PerspectiveCamera";
import Vec3 from "../../math/Vec3";
import ConvexHullGrahamScan from "../../math/ConvexHullGrahamScan";
import MathUtils from "../../math/MathUtils";
import Config from "../Config";
import StaticGeometryLoadingSystem from "./StaticGeometryLoadingSystem";
import TileObjectsSystem from "./TileObjectsSystem";
import System from "../System";
import SystemManager from "../SystemManager";
import RenderSystem from "./RenderSystem";

export default class TileSystem extends System {
	public tiles: Map<string, Tile> = new Map();
	private camera: PerspectiveCamera;
	private cameraFrustum: Frustum;
	private objectsManager: TileObjectsSystem;

	constructor(systemManager: SystemManager) {
		super(systemManager);

		this.init();
	}

	private init() {
		window.addEventListener('resize', () => this.onResize());
	}

	public postInit() {
		this.objectsManager = this.systemManager.getSystem(TileObjectsSystem);

		this.camera = this.systemManager.getSystem(RenderSystem).camera;

		this.cameraFrustum = new Frustum(this.camera.fov, this.camera.aspect, 1, 5000);
		this.cameraFrustum.updateViewSpaceVertices();
	}

	private onResize() {
		this.cameraFrustum.aspect = this.camera.aspect;
		this.cameraFrustum.updateViewSpaceVertices();
	}

	public addTile(x: number, y: number) {
		const tile = new Tile(x, y);

		this.tiles.set(`${x},${y}`, tile);

		tile.updateDistanceToCamera(this.camera);

		tile.load(
			this.systemManager.getSystem(StaticGeometryLoadingSystem)
		);
	}

	public getTile(x: number, y: number): Tile {
		return this.tiles.get(`${x},${y}`);
	}

	public removeTile(x: number, y: number) {
		const tile = this.getTile(x, y);

		this.objectsManager.removeTile(tile);

		tile.dispose();
		this.tiles.delete(`${x},${y}`);
	}

	public getTileNeighbors(x: number, y: number): Tile[] {
		const tiles: Tile[] = [];

		const potentialTiles: Tile[] = [
			this.getTile(x + 1, y),
			this.getTile(x - 1, y),
			this.getTile(x, y + 1),
			this.getTile(x, y - 1),
			this.getTile(x + 1, y + 1),
			this.getTile(x - 1, y - 1),
			this.getTile(x - 1, y + 1),
			this.getTile(x + 1, y - 1)
		];

		for (const tile of potentialTiles) {
			if (tile) {
				tiles.push(tile);
			}
		}

		return tiles;
	}

	public getTileByLocalId(localId: number): Tile {
		for (const tile of this.tiles.values()) {
			if (tile.localId === localId) {
				return tile;
			}
		}

		return null;
	}

	public update(deltaTime: number) {
		this.updateTiles();
		this.removeCulledTiles();
	}

	private updateTiles() {
		const worldSpaceFrustum = this.cameraFrustum.toSpace(this.camera.matrix);
		const frustumTiles = this.getTilesInFrustum(worldSpaceFrustum, this.camera.position);

		for (const tile of this.tiles.values()) {
			tile.inFrustum = false;
			tile.updateDistanceToCamera(this.camera);
		}

		let tilesToAdd = 1;

		for (const tilePosition of frustumTiles) {
			if (!this.getTile(tilePosition.x, tilePosition.y) && tilesToAdd > 0) {
				this.addTile(tilePosition.x, tilePosition.y);
				--tilesToAdd;
			}

			const tile = this.getTile(tilePosition.x, tilePosition.y);

			if (tile) {
				tile.inFrustum = true;
			}
		}
	}

	private getTilesInFrustum(frustum: Frustum, cameraPosition: Vec3): Vec2[] {
		const projectedVertices: Vec2[] = [];

		for (let i = 0; i < 4; i++) {
			projectedVertices.push(
				new Vec2(frustum.vertices.near[i].x, frustum.vertices.near[i].z),
				new Vec2(frustum.vertices.far[i].x, frustum.vertices.far[i].z)
			);
		}

		const convexHull = new ConvexHullGrahamScan();

		for (let i = 0; i < projectedVertices.length; i++) {
			convexHull.addPoint(projectedVertices[i].x, projectedVertices[i].y);
		}

		const hullPoints = convexHull.getHull();

		const points: Vec2[] = [];

		for (let i = 0; i < hullPoints.length; i++) {
			points.push(new Vec2(hullPoints[i].x, hullPoints[i].y));
		}

		return this.getTilesInConvexHull(points, cameraPosition);
	}

	private getTilesInConvexHull(points: Vec2[], cameraPosition: Vec3): Vec2[] {
		if (points.length === 0) {
			return [];
		}

		const tilePoints: Vec2[] = [];

		for (let i = 0; i < points.length; i++) {
			const pos = MathUtils.meters2tile(points[i].x, points[i].y);
			tilePoints.push(pos);
		}

		const tilesOnEdges: Vec2[] = [];

		for (let i = 0; i < points.length; i++) {
			const next = (i + 1) % points.length;
			const data = MathUtils.getTilesIntersectingLine(tilePoints[i], tilePoints[next]);

			for (let j = 0; j < data.length; j++) {
				tilesOnEdges.push(data[j]);
			}
		}

		for (let i = 0; i < tilesOnEdges.length; i++) {
			tilesOnEdges[i].x = Math.floor(tilesOnEdges[i].x);
			tilesOnEdges[i].y = Math.floor(tilesOnEdges[i].y);
		}

		const tilesMap: Map<string, Vec2> = new Map();

		for (const tile of tilesOnEdges) {
			tilesMap.set(`${tile.x},${tile.y}`, tile);
		}

		const filteredTiles: Vec2[] = Array.from(tilesMap.values());

		let tileYs: number[] = [];

		for (let i = 0; i < filteredTiles.length; i++) {
			tileYs.push(filteredTiles[i].y);
		}

		tileYs = tileYs.filter((v: number, i: number) => tileYs.indexOf(v) === i);
		tileYs = tileYs.sort((a: number, b: number) => a - b);

		const tiles: Vec2[] = [];

		for (let i = 0; i < tileYs.length; i++) {
			const currentTileY = tileYs[i];
			let row = [];

			for (const tile of filteredTiles) {
				if (tile.y === currentTileY) {
					row.push(tile.x);
				}
			}

			row = row.sort((a: number, b: number) => a - b);

			let cell = row[0];
			let index = 0;

			while (cell <= row[row.length - 1]) {
				tiles.push(new Vec2(cell, currentTileY));

				if (row[index + 1] > cell + 1) {
					row.splice(index + 1, 0, cell + 1);
				}

				index++;
				cell = row[index];
			}
		}

		return this.sortTilesByDistanceToCamera(tiles, cameraPosition);
	}

	private sortTilesByDistanceToCamera(tiles: Vec2[], cameraPosition: Vec3): Vec2[] {
		const tilesList: { distance: number, tile: Vec2 }[] = [];

		for (let i = 0; i < tiles.length; i++) {
			const worldPosition = MathUtils.tile2meters(tiles[i].x + 0.5, tiles[i].y + 0.5);

			tilesList.push({
				distance: Math.sqrt((worldPosition.x - cameraPosition.x) ** 2 + (worldPosition.y - cameraPosition.z) ** 2),
				tile: tiles[i]
			});
		}

		tilesList.sort((a: { distance: number }, b: { distance: number }) => (a.distance > b.distance) ? 1 : -1);

		const result: Vec2[] = [];

		for (const {tile} of tilesList) {
			result.push(tile);
		}

		return result;
	}

	private removeCulledTiles() {
		type tileEntry = { tile: Tile, distance: number };
		const tileList: tileEntry[] = [];

		for (const tile of this.tiles.values()) {
			if (!tile.inFrustum) {
				tileList.push({tile, distance: tile.distanceToCamera});
			}
		}

		tileList.sort((a: tileEntry, b: tileEntry): number => {
			return b.distance - a.distance;
		});

		const tilesToRemove = Math.min(tileList.length, this.tiles.size - Config.MaxConcurrentTiles);

		for (let i = 0; i < tilesToRemove; i++) {
			this.removeTile(tileList[i].tile.x, tileList[i].tile.y);
		}
	}
}
