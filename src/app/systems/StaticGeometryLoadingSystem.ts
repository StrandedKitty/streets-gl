import Tile, {StaticTileGeometry} from "../objects/Tile";
import System from "../System";
import SystemManager from "../SystemManager";
import MapWorkerSystem from "./MapWorkerSystem";

interface queueEntry {
	tile: Tile;
	onLoad: (...args: any[]) => any;
}

export default class StaticGeometryLoadingSystem extends System {
	private queue: queueEntry[] = [];

	public constructor(systemManager: SystemManager) {
		super(systemManager);
	}

	public postInit(): void {

	}

	public async getTileObjects(tile: Tile): Promise<StaticTileGeometry> {
		return new Promise<StaticTileGeometry>((resolve) => {
			this.queue.push({
				tile,
				onLoad: (data: StaticTileGeometry) => {
					resolve(this.getObjectFromMessage(data));
				}
			});
		});
	}

	public update(deltaTime: number): void {
		this.removeDisposedTiles();

		const mapWorkerSystem = this.systemManager.getSystem(MapWorkerSystem);

		while (this.queue.length > 0 && mapWorkerSystem.getFreeWorker()) {
			const worker = mapWorkerSystem.getFreeWorker();
			const {tile, onLoad} = this.getNearestTileInQueue();

			worker.start(tile.x, tile.y).then(result => {
				onLoad(result);
			}, error => {
				//console.error(error, `${tile.x}, ${tile.y}`);
				this.queue.unshift({tile, onLoad});
			});
		}
	}

	private removeDisposedTiles(): void {
		this.queue.filter((entry: queueEntry) => {
			return !entry.tile.disposed;
		});
	}

	private getNearestTileInQueue(): queueEntry {
		this.queue.sort((a: queueEntry, b: queueEntry): number => {
			return b.tile.distanceToCamera - a.tile.distanceToCamera;
		});

		return this.queue.pop();
	}

	private getObjectFromMessage(msg: StaticTileGeometry): StaticTileGeometry {
		return msg;
	}
}
