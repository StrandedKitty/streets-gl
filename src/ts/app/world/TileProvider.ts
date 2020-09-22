import Object3D from "../../core/Object3D";
import Tile from "../objects/Tile";
import MapWorkerManager from "./worker/MapWorkerManager";

interface queueEntry {
	tile: Tile,
	onLoad: (...args: any[]) => any
}

export default class TileProvider {
	private mapWorkerManager: MapWorkerManager = new MapWorkerManager(6, '');
	private queue: queueEntry[] = [];

	public async getTileObjects(tile: Tile): Promise<Object3D> {
		return new Promise<Object3D>((resolve) => {
			this.queue.push({
				tile,
				onLoad: (e: any) => {
					resolve(new Object3D());
				}
			});
		});
	}

	public update() {
		this.removeDisposedTiles();

		while (this.queue.length > 0 && this.mapWorkerManager.getFreeWorker()) {
			const worker = this.mapWorkerManager.getFreeWorker();
			const {tile, onLoad} = this.getNearestTileInQueue();

			worker.start(tile.x, tile.y).then(result => {
				onLoad(result);
			}, error => {
				console.error(error);
				this.queue.unshift({tile, onLoad});
			});
		}
	}

	private removeDisposedTiles() {
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
}
