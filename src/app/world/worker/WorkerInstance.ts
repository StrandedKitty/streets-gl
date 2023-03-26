import {
	WorkerMessageIncoming,
	WorkerMessageIncomingType,
	WorkerMessageOutgoing,
	WorkerMessageOutgoingType
} from "./WorkerMessageTypes";
import Tile3DFromVectorProvider from "~/lib/tile-processing/tile3d/providers/Tile3DFromVectorProvider";
import {Tile3DFeaturesToBuffersConverter} from "~/lib/tile-processing/tile3d/buffers/Tile3DFeaturesToBuffersConverter";

const ctx: Worker = self as any;

ctx.addEventListener('message', async event => {
	const data = event.data as WorkerMessageOutgoing;
	const x = data.tile[0];
	const y = data.tile[1];

	if (data.type === WorkerMessageOutgoingType.Start) {
		load(x, y, data.overpassURL);
	}
});

function sendMessage(msg: WorkerMessageIncoming): void {
	ctx.postMessage(msg);
}

async function load(x: number, y: number, overpassURL: string): Promise<void> {
	const provider = new Tile3DFromVectorProvider(overpassURL);
	const collectionPromise = provider.getCollection({x, y, zoom: 16});

	collectionPromise.then(collection => {
		const buffers = Tile3DFeaturesToBuffersConverter.convert(collection);

		sendMessage({
			type: WorkerMessageIncomingType.Success,
			tile: [x, y],
			result: buffers
		});
	}).catch(error => {
		console.error(error);

		sendMessage({
			type: WorkerMessageIncomingType.Error,
			tile: [x, y],
			result: {error}
		});
	})
}
