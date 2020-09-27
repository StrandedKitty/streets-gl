// @ts-ignore
import Worker from 'worker-loader!./WorkerInstance';
import Vec2 from "../../../math/Vec2";

export interface WorkerMessageOutgoing {
	tile: [number, number];
}

export interface WorkerMessageIncoming {
	error: boolean;
	tile: [number, number];
	result: any;
}

export default class MapWorker {
	private worker: Worker;
	public queueLength: number = 0;
	private tilesInProgress: Map<string, { resolve: Function, reject: Function }> = new Map();

	constructor() {
		this.worker = new Worker();

		this.worker.addEventListener('message', (e: MessageEvent) => {
			this.processMessage(e);
		});
	}

	async start(x: number, y: number): Promise<any> {
		this.queueLength++;

		const promise = new Promise<any>((resolve, reject) => {
			this.tilesInProgress.set(`${x},${y}`, {resolve, reject});
		});

		this.sendMessage({tile: [x, y]});

		return promise;
	}

	private sendMessage(msg: WorkerMessageOutgoing) {
		this.worker.postMessage(msg);
	}

	private processMessage(e: MessageEvent) {
		const data = e.data as WorkerMessageIncoming;

		const tilePosition = new Vec2(data.tile[0], data.tile[1]);
		const {resolve, reject} = this.tilesInProgress.get(`${tilePosition.x},${tilePosition.y}`);

		if (!data.error) {
			resolve(data.result);
		} else {
			reject(data.result);
		}

		this.queueLength--;
	}
}
