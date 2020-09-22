// @ts-ignore
import Worker from 'worker-loader!./worker';

export default class MapWorker {
	private worker: Worker;
	public queueLength: number = 0;
	private tilesInProgress: Map<string, (e: any) => any> = new Map();

	constructor(path: string) {
		this.worker = new Worker();

		this.worker.addEventListener('message', (e: MessageEvent) => {
			this.processMessage(e);
		});

		this.worker.postMessage({code: 'init'});
	}

	async start(x: number, y: number): Promise<any> {
		this.queueLength++;

		const promise = new Promise<any>((resolve, reject) => {
			resolve();
		});

		this.worker.postMessage({code: 'start', position: {x, y}});

		return promise;
	}

	private processMessage(e: MessageEvent) {
		console.log(e);
		this.queueLength--;
	}
}
