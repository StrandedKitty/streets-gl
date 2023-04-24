import System from "../System";
import SceneSystem from "~/app/systems/SceneSystem";
import TileTree from "~/app/slippy-map/tree/TileTree";
import TileTreeImage from "~/app/slippy-map/tree/TileTreeImage";
import OrthographicCamera from "~/lib/core/OrthographicCamera";
import CameraViewport from "~/app/slippy-map/CameraViewport";
import RenderSystem from "~/app/systems/RenderSystem";
import Vec2 from "~/lib/math/Vec2";
import Config from "~/app/Config";

interface TileQueueItem {
	x: number;
	y: number;
	zoom: number;
}

export default class SlippyMapSystem extends System {
	private readonly viewport: CameraViewport = new CameraViewport();
	private readonly tileTree: TileTree = new TileTree();
	private camera: OrthographicCamera;
	private tiles: Map<string, TileTreeImage> = new Map();
	private queue: TileQueueItem[] = [];
	private isLoading: boolean = false;

	public postInit(): void {
		this.camera = this.systemManager.getSystem(SceneSystem).objects.orthoCamera;
	}

	public getRenderedTiles(): TileTreeImage[] {
		const tiles = this.tileTree.getLeafs(this.viewport);

		tiles.sort((a, b) => {
			return a.zoom - b.zoom;
		});

		return tiles;
	}

	public update(deltaTime: number): void {
		const camera = this.systemManager.getSystem(SceneSystem).objects.orthoCamera;
		const wrapper = this.systemManager.getSystem(SceneSystem).objects.slippyMapWrapper;

		wrapper.position.set(-camera.position.x, -camera.position.y, 0);
		wrapper.updateMatrix();
		wrapper.updateMatrixWorld();

		camera.updateMatrixWorld();
		camera.updateMatrixWorldInverse();

		this.viewport.setFromOrthographicCamera(camera);

		const visibleTiles = this.viewport.getVisibleTiles();
		const weights: Map<Vec2, number> = new Map();
		const zoom = Math.floor(this.viewport.zoom);

		for (const position of visibleTiles) {
			const center = new Vec2(
				(position.x + 0.5) / (2 ** zoom),
				(position.y + 0.5) / (2 ** zoom)
			);
			const dst = Vec2.distance(center, new Vec2(camera.position.x, 1 - camera.position.y));

			weights.set(position, dst);
		}

		visibleTiles.sort((a, b) => {
			return weights.get(b) - weights.get(a);
		});

		for (const {x, y} of visibleTiles) {
			if (this.tiles.has(`${x},${y},${zoom}`)) {
				continue;
			}

			this.queue.push({
				x,
				y,
				zoom
			});
		}

		if (this.queue.length > 0 && !this.isLoading) {
			this.processQueue();
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

	private async loadTile(item: TileQueueItem): Promise<void> {
		const {x, y, zoom} = item;

		const image = new Image();
		image.src = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
		image.crossOrigin = "";

		return new Promise((resolve) => {
			image.onload = (): void => {
				const texture = this.systemManager.getSystem(RenderSystem).createTileTexture(image, image.width, image.height);
				const tile = {
					x,
					y,
					zoom,
					image: image,
					texture: texture
				};

				this.tileTree.insert(tile);
				this.tiles.set(`${x},${y},${zoom}`, tile);

				resolve();
			}
			image.onerror = (): void => {
				resolve();
			}
		});
	}
}