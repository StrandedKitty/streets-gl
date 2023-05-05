import Tile from "../objects/Tile";
import Frustum from "~/lib/core/Frustum";
import Vec2 from "~/lib/math/Vec2";
import Vec3 from "~/lib/math/Vec3";
import ConvexHullGrahamScan from "~/lib/math/ConvexHullGrahamScan";
import MathUtils from "~/lib/math/MathUtils";
import Config from "../Config";
import TileObjectsSystem from "./TileObjectsSystem";
import System from "../System";
import SceneSystem from './SceneSystem';
import Camera from "~/lib/core/Camera";
import TerrainSystem from "~/app/systems/TerrainSystem";
import {HeightLoaderTile} from "~/app/terrain/TerrainHeightLoader";
import ControlsSystem, {NavigationMode} from "~/app/systems/ControlsSystem";
import Tile3DBuffers from "~/lib/tile-processing/tile3d/buffers/Tile3DBuffers";
import SettingsSystem from "~/app/systems/SettingsSystem";

interface QueueItem {
	position: Vec2;
	onBeforeLoad: () => Promise<void>;
	onLoad: (tileData: Tile3DBuffers) => Promise<void>;
}

export default class TileSystem extends System {
	public readonly tiles: Map<string, Tile> = new Map();
	private readonly queue: QueueItem[] = [];
	private cameraFrustum: Frustum;
	private objectsManager: TileObjectsSystem;
	public enableTerrainHeight: boolean = true;

	public postInit(): void {
		this.objectsManager = this.systemManager.getSystem(TileObjectsSystem);
		this.listenToSettings();
		this.listenToKeyPresses();
	}

	private listenToKeyPresses(): void {
		window.addEventListener('keydown', (e) => {
			if (e.code === 'KeyP' && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				this.purgeTiles();
			}
		});
	}

	private listenToSettings(): void {
		const settings = this.systemManager.getSystem(SettingsSystem).settings;

		settings.onChange('terrainHeight', ({statusValue}) => {
			const isEnabled = statusValue === 'on';

			if (isEnabled !== this.enableTerrainHeight) {
				this.purgeTiles();
				this.enableTerrainHeight = isEnabled;
			}
		}, true);
	}

	public addTile(x: number, y: number): void {
		let tile: Tile;

		this.queue.push({
			position: new Vec2(x, y),
			onBeforeLoad: async () => {
				tile = new Tile(x, y);
				this.tiles.set(`${x},${y}`, tile);

				if (this.enableTerrainHeight) {
					await this.claimHeightDataForTile(x, y, tile);
				}
			},
			onLoad: async (tileData) => {
				if (tile.disposed) {
					return;
				}

				if (!tileData) {
					this.removeTile(x, y);
					return;
				}

				const instancedObjects = this.systemManager.getSystem(SceneSystem).objects.instancedObjects;
				tile.load(tileData);
				tile.updateInstancesBoundingBoxes(instancedObjects);
			}
		});
	}

	public getTile(x: number, y: number): Tile {
		return this.tiles.get(`${x},${y}`);
	}

	public removeTile(x: number, y: number): void {
		const tile = this.getTile(x, y);

		this.objectsManager.removeTile(tile);

		const heightProvider = this.systemManager.getSystem(TerrainSystem).terrainHeightProvider;

		for (const pos of tile.usedHeightTiles) {
			const tile = heightProvider.heightLoader.getTile(pos.x, pos.y, 12);

			if (tile) {
				tile.tracker.release(tile);
			}
		}

		tile.dispose();
		this.tiles.delete(`${x},${y}`);
	}

	public getTileByLocalId(localId: number): Tile {
		for (const tile of this.tiles.values()) {
			if (tile.localId === localId) {
				return tile;
			}
		}

		return null;
	}

	private async claimHeightDataForTile(x: number, y: number, tile: Tile): Promise<HeightLoaderTile[]> {
		const dataZoom = 16;
		const heightZoom = 12;
		const factor = 2 ** (dataZoom - heightZoom);

		const tileX = Math.floor(x / factor);
		const tileY = Math.floor(y / factor);

		const positions: Vec2[] = [];

		// Load nearby tiles just in case we need to handle huge features (buildings, etc.)
		for (let dx = -1; dx <= 1; dx++) {
			for (let dy = -1; dy <= 1; dy++) {
				positions.push(new Vec2(
					tileX + dx,
					tileY + dy
				));
			}
		}

		const heightProvider = this.systemManager.getSystem(TerrainSystem).terrainHeightProvider;
		const heightPromises: Promise<HeightLoaderTile>[] = [];

		for (const position of positions) {
			heightPromises.push(
				heightProvider.heightLoader.getOrLoadTile(position.x, position.y, heightZoom, tile)
			);
			tile.usedHeightTiles.push(position);
		}

		return Promise.all(heightPromises);
	}

	public update(deltaTime: number): void {
		const slippyMode = this.systemManager.getSystem(ControlsSystem).mode === NavigationMode.Slippy;

		if (!slippyMode) {
			this.updateTiles();
		}

		this.removeCulledTiles();
	}

	private updateTiles(): void {
		const camera = this.systemManager.getSystem(SceneSystem).objects.camera;

		if (
			!this.cameraFrustum ||
			this.cameraFrustum.fov !== camera.fov ||
			this.cameraFrustum.aspect !== camera.aspect
		) {
			this.cameraFrustum = new Frustum(camera.fov, camera.aspect, 1, 8000);
			this.cameraFrustum.updateViewSpaceVertices();
		}

		const worldSpaceFrustum = this.cameraFrustum.toSpace(camera.matrix);
		const frustumTiles = this.getTilesInFrustum(worldSpaceFrustum, camera.position);

		for (const tile of this.tiles.values()) {
			tile.inFrustum = false;
		}

		this.queue.length = 0;

		for (const tilePosition of frustumTiles) {
			if (!this.getTile(tilePosition.x, tilePosition.y)) {
				this.addTile(tilePosition.x, tilePosition.y);
				continue;
			}

			const tile = this.getTile(tilePosition.x, tilePosition.y);

			if (tile) {
				tile.inFrustum = true;
			}
		}

		this.updateTilesDistancesToCamera(camera);
	}

	public getNextTileToLoad(): QueueItem {
		return this.queue.shift();
	}

	private updateTilesDistancesToCamera(camera: Camera): void {
		for (const tile of this.tiles.values()) {
			tile.updateDistanceToCamera(camera);
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
		const tilesList: {distance: number; tile: Vec2}[] = [];

		for (let i = 0; i < tiles.length; i++) {
			const worldPosition = MathUtils.tile2meters(tiles[i].x + 0.5, tiles[i].y + 0.5);

			tilesList.push({
				distance: Math.sqrt((worldPosition.x - cameraPosition.x) ** 2 + (worldPosition.y - cameraPosition.z) ** 2),
				tile: tiles[i]
			});
		}

		tilesList.sort((a, b): number => {
			return a.distance - b.distance;
		});

		return tilesList.map(entry => entry.tile);
	}

	private removeCulledTiles(): void {
		const tileList: {tile: Tile; distance: number}[] = [];

		for (const tile of this.tiles.values()) {
			if (!tile.inFrustum) {
				tileList.push({tile, distance: tile.distanceToCamera});
			}
		}

		tileList.sort((a, b): number => {
			return b.distance - a.distance;
		});

		const tilesToRemove = Math.min(tileList.length, this.tiles.size - Config.MaxConcurrentTiles);

		for (let i = 0; i < tilesToRemove; i++) {
			this.removeTile(tileList[i].tile.x, tileList[i].tile.y);
		}
	}

	private purgeTiles(): void {
		for (const tile of this.tiles.values()) {
			this.removeTile(tile.x, tile.y);
		}
	}
}
