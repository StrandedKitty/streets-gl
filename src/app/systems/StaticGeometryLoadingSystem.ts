import Tile from "../objects/Tile";
import System from "../System";
import MapWorkerSystem from "./MapWorkerSystem";
import Tile3DBuffers from "~/lib/tile-processing/tile3d/buffers/Tile3DBuffers";

interface queueEntry {
	tile: Tile;
	onLoad: (...args: any[]) => any;
}

export default class StaticGeometryLoadingSystem extends System {
	private queue: queueEntry[] = [];

	public postInit(): void {

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
}
