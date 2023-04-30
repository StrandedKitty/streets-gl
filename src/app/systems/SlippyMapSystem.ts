import System from "../System";
import SceneSystem from "~/app/systems/SceneSystem";
import TileTree from "~/app/slippy-map/tree/TileTree";
import TileTreeImage from "~/app/slippy-map/tree/TileTreeImage";
import CameraViewport from "~/app/slippy-map/CameraViewport";
import RenderSystem from "~/app/systems/RenderSystem";
import Vec2 from "~/lib/math/Vec2";
import Config from "~/app/Config";
import PerspectiveCamera from "~/lib/core/PerspectiveCamera";
import MathUtils from "~/lib/math/MathUtils";
import Vec3 from "~/lib/math/Vec3";
import TerrainSystem from "~/app/systems/TerrainSystem";
import ControlsSystem from "~/app/systems/ControlsSystem";

export default class SlippyMapSystem extends System {
	private readonly viewport: CameraViewport = new CameraViewport();
	private readonly tileTree: TileTree = new TileTree();
	private camera: PerspectiveCamera;
	private tiles: Map<string, TileTreeImage> = new Map();
	private queue: Vec3[] = [];
	private isLoading: boolean = false;

	public postInit(): void {
		this.camera = this.systemManager.getSystem(SceneSystem).objects.camera;
	}

	private getTileImageRecursive(x: number, y: number, zoom: number): TileTreeImage {
		const key = SlippyMapSystem.packVec3(new Vec3(x, y, zoom));

		if (this.tiles.has(key) || zoom === 0) {
			return this.tiles.get(key);
		}

		const parentX = Math.floor(x / 2);
		const parentY = Math.floor(y / 2);
		const parentZoom = zoom - 1;

		return this.getTileImageRecursive(parentX, parentY, parentZoom);
	}

	public getRenderedTiles(): TileTreeImage[] {
		const tiles: TileTreeImage[] = [];
		const zoom = Math.round(this.viewport.currentZoom);

		const visibleTiles = this.viewport.getVisibleTiles(zoom, zoom, 0);

		for (const tile of visibleTiles) {
			const image = this.getTileImageRecursive(tile.x, tile.y, tile.z);

			if (image) {
				tiles.push(image);
			}
		}

		const tilesSet = new Set<string>();
		const uniqueTiles: TileTreeImage[] = [];

		for (const tile of tiles) {
			const key = SlippyMapSystem.packVec3(new Vec3(tile.x, tile.y, tile.zoom));

			if (!tilesSet.has(key)) {
				uniqueTiles.push(tile);
				tilesSet.add(key);
			}
		}

		uniqueTiles.sort((a, b) => {
			return a.zoom - b.zoom;
		});

		return uniqueTiles;
	}

	private getCameraPositionNormalized(): Vec2 {
		return MathUtils.meters2tile(this.camera.position.x, this.camera.position.z, 0);
	}

	public update(deltaTime: number): void {
		const worldHeight = this.getCurrentWorldHeight();
		this.viewport.setFromPerspectiveCamera(this.camera, worldHeight);

		const currentZoom = Math.round(this.viewport.currentZoom);
		const visibleTiles = this.viewport.getVisibleTiles(
			Math.max(0, currentZoom - 1),
			currentZoom,
			1
		);
		const weights: Map<Vec3, number> = new Map();
		const cameraNorm = this.getCameraPositionNormalized();

		for (const position of visibleTiles) {
			const center = new Vec2(
				(position.x + 0.5) / (2 ** position.z),
				(position.y + 0.5) / (2 ** position.z)
			);
			const distance = Vec2.distance(center, cameraNorm);
			const zoomFactor = (position.z - currentZoom) * 10;

			weights.set(position, distance + zoomFactor);
		}

		visibleTiles.sort((a, b) => {
			return weights.get(b) - weights.get(a);
		});

		this.deleteUnusedTiles(visibleTiles);

		this.queue.length = 0;

		for (const position of visibleTiles) {
			const key = SlippyMapSystem.packVec3(position);

			if (this.tiles.has(key)) {
				continue;
			}

			this.queue.push(position);
		}

		if (this.queue.length > 0 && !this.isLoading) {
			this.processQueue();
		}
	}

	private deleteUnusedTiles(visibleTiles: Vec3[]): void {
		const maxTiles = 150;

		if (this.tiles.size <= maxTiles) {
			return;
		}

		const visibleTilesSet = new Set<string>();

		for (const tile of visibleTiles) {
			visibleTilesSet.add(SlippyMapSystem.packVec3(tile));
		}

		for (const tile of this.tiles.values()) {
			const key = SlippyMapSystem.packVec3(new Vec3(tile.x, tile.y, tile.zoom));

			if (!visibleTilesSet.has(key)) {
				this.tiles.delete(key);
				tile.parent.onTileRemoved();
				tile.texture.delete();
				break;
			}
		}
	}

	private async processQueue(): Promise<void> {
		const promises: Promise<void>[] = [];

		for (let i = 0; i < Config.SlippyMapFetchBatchSize; i++) {
			const item = this.queue.pop();

			if (!item) {
				break;
			}

			promises.push(this.loadTile(item));
		}

		this.isLoading = true;
		await Promise.all(promises);
		this.isLoading = false;
	}

	private async loadTile(item: Vec3): Promise<void> {
		const {x, y, z} = item;

		const image = new Image();
		image.src = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
		image.crossOrigin = "";

		return new Promise((resolve) => {
			image.onload = (): void => {
				const texture = this.systemManager.getSystem(RenderSystem).createTileTexture(image);
				const tile = {
					x,
					y,
					zoom: z,
					image: image,
					texture: texture
				};
				const key = SlippyMapSystem.packVec3(item);

				this.tileTree.insert(tile);
				this.tiles.set(key, tile);

				resolve();
			}
			image.onerror = (): void => {
				resolve();
			}
		});
	}

	public getCurrentWorldHeight(): number {
		const terrainHeightProvider = this.systemManager.getSystem(TerrainSystem).terrainHeightProvider;
		const target = this.systemManager.getSystem(ControlsSystem).getGroundControlsTarget();

		return terrainHeightProvider.getHeightGlobalInterpolated(target.x, target.z, true);
	}

	private static packVec3(vec: Vec3): string {
		return `${vec.x},${vec.y},${vec.z}`;
	}
}