import Tile from "./objects/Tile";
import Frustum from "../core/Frustum";
import Vec2 from "../math/Vec2";
import {App} from "./App";
import PerspectiveCamera from "../core/PerspectiveCamera";
import Vec3 from "../math/Vec3";
import ConvexHullGrahamScan from "./../math/ConvexHullGrahamScan";
import {getTilesIntersectingLine, meters2tile, tile2meters} from "../math/Utils";
import Config from "./Config";

export default class TileManager {
	public tiles: Map<string, Tile> = new Map();
	private camera: PerspectiveCamera;
	private cameraFrustum: Frustum;

	constructor(private app: App) {
		this.camera = app.renderSystem.camera;

		this.init();
	}

	private init() {
		this.cameraFrustum = new Frustum(this.camera.fov, this.camera.aspect, 1, 4000);
		this.cameraFrustum.updateViewSpaceVertices();

		window.addEventListener('resize', () => this.onResize());
	}

	private onResize() {
		this.cameraFrustum.aspect = this.camera.aspect;
		this.cameraFrustum.updateViewSpaceVertices();
	}

	public addTile(x: number, y: number) {
		this.tiles.set(`${x},${y}`, new Tile(x, y));
	}

	public getTile(x: number, y: number): Tile {
		return this.tiles.get(`${x},${y}`);
	}

	public removeTile(x: number, y: number) {
		const tile = this.getTile(x, y);
		tile.dispose();
		this.tiles.delete(`${x},${y}`);
	}

	public update() {
		for(const tile of this.tiles.values()) {
			tile.inFrustum = false;
		}

		this.updateTiles();
		this.removeFarthestTile();
	}

	private updateTiles() {
		const worldSpaceFrustum = this.cameraFrustum.toSpace(this.camera.matrix);
		const frustumTiles = this.getTilesInFrustum(worldSpaceFrustum, this.camera.position);

		for(const tilePosition of frustumTiles) {
			if(!this.getTile(tilePosition.x, tilePosition.y)) {
				this.addTile(tilePosition.x, tilePosition.y);
			}

			this.getTile(tilePosition.x, tilePosition.y).inFrustum = true;
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
			const pos = meters2tile(points[i].x, points[i].y);
			tilePoints.push(pos);
		}

		const tilesOnEdges: Vec2[] = [];

		for (let i = 0; i < points.length; i++) {
			const next = (i + 1) % points.length;
			const data = getTilesIntersectingLine(tilePoints[i], tilePoints[next]);

			for (let j = 0; j < data.length; j++) {
				tilesOnEdges.push(data[j]);
			}
		}

		for (let i = 0; i < tilesOnEdges.length; i++) {
			tilesOnEdges[i].x = Math.floor(tilesOnEdges[i].x);
			tilesOnEdges[i].y = Math.floor(tilesOnEdges[i].y);
		}

		const tilesMap: Map<string, Vec2> = new Map();

		for(const tile of tilesOnEdges) {
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
			const worldPosition = tile2meters(tiles[i].x + 0.5, tiles[i].y + 0.5);

			tilesList.push({
				distance: Math.sqrt((worldPosition.x - cameraPosition.x) ** 2 + (worldPosition.y - cameraPosition.z) ** 2),
				tile: tiles[i]
			});
		}

		tilesList.sort((a: {distance: number}, b: {distance: number}) => (a.distance > b.distance) ? 1 : -1);

		const result: Vec2[] = [];

		for (const {tile} of tilesList) {
			result.push(tile);
		}

		return result;
	}

	private removeFarthestTile() {
		let maxDistance: number = 0;
		let maxDistanceTile: Tile = null;

		for(const tile of this.tiles.values()) {
			if(!tile.inFrustum) {
				if(this.tiles.size <= Config.MaxConcurrentTiles) {
					break;
				}

				const worldPosition = tile2meters(tile.x + 0.5, tile.y + 0.5);
				const distance = Math.sqrt((worldPosition.x - this.camera.position.x) ** 2 + (worldPosition.y - this.camera.position.z) ** 2);

				if(distance > maxDistance) {
					maxDistance = distance;
					maxDistanceTile = tile;
				}
			}
		}

		if(maxDistanceTile !== null) {
			this.removeTile(maxDistanceTile.x, maxDistanceTile.y);
		}
	}
}
