import Worker from './WorkerInstance.worker';
import Vec2 from "../../../math/Vec2";
import HeightProvider from "../HeightProvider";
import {
	WorkerMessageIncoming,
	WorkerMessageIncomingType,
	WorkerMessageOutgoing,
	WorkerMessageOutgoingType
} from "./WorkerMessageTypes";
import {StaticTileGeometry} from "../../objects/Tile";

export default class MapWorker {
	private worker: Worker;
	public queueLength = 0;
	private tilesInProgress: Map<string, { resolve: {(a: any): void}; reject: {(a: any): void} }> = new Map();

	public constructor() {
		this.worker = new Worker();

		this.worker.addEventListener('message', (e: MessageEvent) => {
			this.processMessage(e);
		});
	}

	public async start(x: number, y: number): Promise<StaticTileGeometry> {
		this.queueLength++;

		const promise = new Promise<StaticTileGeometry>((resolve, reject) => {
			this.tilesInProgress.set(`${x},${y}`, {resolve, reject});
		});

		this.sendMessage({
			type: WorkerMessageOutgoingType.Start,
			tile: [x, y]
		});

		return promise;
	}

	private sendMessage(msg: WorkerMessageOutgoing): void {
		this.worker.postMessage(msg);
	}

	private async processMessage(e: MessageEvent): Promise<void> {
		const data = e.data as WorkerMessageIncoming;
		const tilePosition = new Vec2(data.tile[0], data.tile[1]);
		const tileInProgress = this.tilesInProgress.get(`${tilePosition.x},${tilePosition.y}`);

		switch (data.type) {
		case WorkerMessageIncomingType.Success:
			this.queueLength--;
			tileInProgress.resolve(data.result);
			break;
		case WorkerMessageIncomingType.Error:
			this.queueLength--;
			tileInProgress.reject(data.result);
			break;
		case WorkerMessageIncomingType.RequestHeight:
			const height = await HeightProvider.getTileAsync(data.tile[0], data.tile[1]);
			this.sendMessage({
				type: WorkerMessageOutgoingType.SendHeightData,
				tile: data.tile,
				heightArray: height
			});
			break;
		}
	}
}
