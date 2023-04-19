import Tile from "../objects/Tile";
import System from "../System";
import MapWorkerSystem from "./MapWorkerSystem";
import Tile3DBuffers from "~/lib/tile-processing/tile3d/buffers/Tile3DBuffers";
import Config from "~/app/Config";
import MapWorker from "~/app/world/worker/MapWorker";
import SettingsSystem from "~/app/systems/SettingsSystem";

interface QueueItem {
	tile: Tile;
	onLoad: (buffers: Tile3DBuffers) => void;
}

export interface OverpassEndpoint {
	url: string;
	isEnabled: boolean;
	isUserDefined: boolean;
}

export default class TileLoadingSystem extends System {
	private readonly queue: QueueItem[] = [];
	public readonly overpassEndpointsDefault: OverpassEndpoint[] = [];
	public overpassEndpoints: OverpassEndpoint[] = [];

	public constructor() {
		super();

		for (const {url, isEnabled} of Config.OverpassEndpoints) {
			const endpoint: OverpassEndpoint = {
				url: url,
				isEnabled: isEnabled,
				isUserDefined: false
			};

			this.overpassEndpoints.push(endpoint);
			this.overpassEndpointsDefault.push(endpoint);
		}
	}

	public postInit(): void {

	}

	public resetOverpassEndpoints(): void {
		this.overpassEndpoints = this.overpassEndpointsDefault;
	}

	private getNextOverpassEndpoint(): string {
		const urls = this.overpassEndpoints
			.filter(endpoint => endpoint.isEnabled)
			.map(endpoint => endpoint.url);

		if (urls.length === 0) {
			return null;
		}

		return urls[Math.floor(Math.random() * urls.length)];
	}

	public async getTileObjects(tile: Tile): Promise<Tile3DBuffers> {
		return new Promise<Tile3DBuffers>((resolve) => {
			this.queue.push({
				tile,
				onLoad: (data: Tile3DBuffers) => {
					resolve(data);
				}
			});
		});
	}

	public update(deltaTime: number): void {
		this.removeDisposedTiles();

		const mapWorkerSystem = this.systemManager.getSystem(MapWorkerSystem);

		while (this.queue.length > 0 && mapWorkerSystem.getFreeWorker() && this.getNextOverpassEndpoint()) {
			this.loadTile(
				this.getNearestTileInQueue(),
				mapWorkerSystem.getFreeWorker(),
				this.getNextOverpassEndpoint()
			);
		}
	}

	private loadTile(queuedTile: QueueItem, worker: MapWorker, overpassEndpoint: string): void {
		const {tile, onLoad} = queuedTile;

		worker.requestTile(tile.x, tile.y, {
			overpassEndpoint: overpassEndpoint,
			tileServerEndpoint: Config.TileServerEndpoint,
			mapboxEndpointTemplate: Config.MapboxStreetsEndpointTemplate,
			mapboxAccessToken: Config.MapboxAccessToken,
			useCachedTiles: this.useCachedTiles
		}).then(result => {
			onLoad(result);
		}, error => {
			console.error(`Failed to load tile ${tile.x},${tile.y}. Retrying...`, error);
			this.queue.unshift({tile, onLoad});
		});
	}

	private removeDisposedTiles(): void {
		this.queue.filter((entry: QueueItem) => {
			return !entry.tile.disposed;
		});
	}

	private getNearestTileInQueue(): QueueItem {
		this.queue.sort((a: QueueItem, b: QueueItem): number => {
			return b.tile.distanceToCamera - a.tile.distanceToCamera;
		});

		return this.queue.pop();
	}

	private get useCachedTiles(): boolean {
		const settingsSystem = this.systemManager.getSystem(SettingsSystem);
		return settingsSystem.settings.get('cachedTiles').statusValue === 'on';
	}
}
