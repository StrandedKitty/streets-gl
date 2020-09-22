import MapWorker from "./MapWorker";

export default class MapWorkerManager {
	private workers: MapWorker[] = [];
	private queue: ((w: MapWorker) => void)[] = [];

	constructor(count: number, path: string) {
		for(let i = 0; i < count; i++) {
			this.workers.push(new MapWorker(path));
		}
	}

	public getFreeWorker(): MapWorker {
		for(let i = 0; i < this.workers.length; i++) {
			const worker = this.workers[i];

			if(worker.queueLength < 2) {
				return worker;
			}
		}

		return null;
	}
}
