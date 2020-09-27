import MapWorker from "./MapWorker";

export default class MapWorkerManager {
	private workers: MapWorker[] = [];

	constructor(count: number) {
		for(let i = 0; i < count; i++) {
			this.workers.push(new MapWorker());
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
