import Tile3DFromVectorProvider from "~/lib/tile-processing/tile3d/providers/Tile3DFromVectorProvider";
import {Tile3DFeaturesToBuffersConverter} from "~/lib/tile-processing/tile3d/buffers/Tile3DFeaturesToBuffersConverter";
import {WorkerMessage} from "~/app/world/worker/WorkerMessage";
import Tile3DBuffers from "~/lib/tile-processing/tile3d/buffers/Tile3DBuffers";
import {getTile3DBuffersTransferables} from "~/lib/tile-processing/tile3d/utils";
import MathUtils from "~/lib/math/MathUtils";

const ctx: Worker = self as any;

class WorkerInstance {
	private static TileZoom: number = 16;

	public constructor(private readonly ctx: Worker) {
		this.addEventListeners();
	}

	private addEventListeners(): void {
		ctx.addEventListener('message', async event => {
			const data = event.data as WorkerMessage.ToWorker;
			const x = data.tile[0];
			const y = data.tile[1];

			if (data.type === WorkerMessage.ToWorkerType.Start) {
				this.fetchTile(
					x,
					y,
					data.overpassEndpoint,
					data.mapboxEndpointTemplate,
					data.mapboxAccessToken
				);
			}
		});
	}

	private fetchTile(
		x: number,
		y: number,
		overpassEndpoint: string,
		mapboxEndpointTemplate: string,
		mapboxAccessToken: string
	): void {
		const provider = new Tile3DFromVectorProvider({
			overpassEndpoint: overpassEndpoint,
			mapboxEndpointTemplate: mapboxEndpointTemplate,
			mapboxAccessToken: mapboxAccessToken,
			heightPromise: (positions: Float64Array): Promise<Float64Array> => this.getTerrainHeight(x, y, positions)
		});
		const collectionPromise = provider.getCollection({x, y, zoom: WorkerInstance.TileZoom});

		collectionPromise.then(collection => {
			const buffers = Tile3DFeaturesToBuffersConverter.convert(collection);

			this.sendBuffers(x, y, buffers);
		}).catch(error => {
			console.error(error);

			this.sendError(x, y, error);
		})
	}

	private sendMessage(msg: WorkerMessage.FromWorker, transferables: Transferable[] = []): void {
		this.ctx.postMessage(msg, transferables);
	}

	private sendBuffers(x: number, y: number, buffers: Tile3DBuffers): void {
		this.sendMessage(
			{
				type: WorkerMessage.FromWorkerType.Success,
				tile: [x, y],
				payload: buffers
			},
			getTile3DBuffersTransferables(buffers)
		)
	}

	private sendError(x: number, y: number, error: string): void {
		this.sendMessage({
			type: WorkerMessage.FromWorkerType.Error,
			tile: [x, y],
			payload: error
		});
	}

	private sendHeightRequest(x: number, y: number, positions: Float64Array): void {
		this.sendMessage({
			type: WorkerMessage.FromWorkerType.RequestHeight,
			tile: [x, y],
			payload: positions
		}, [positions.buffer]);
	}

	private async getTerrainHeight(x: number, y: number, positions: Float64Array): Promise<Float64Array> {
		return new Promise((resolve) => {
			const handler = async (event: MessageEvent): Promise<void> => {
				const data = event.data as WorkerMessage.ToWorker;

				if (x !== data.tile[0] && y !== data.tile[1]) {
					return;
				}

				if (data.type === WorkerMessage.ToWorkerType.Height) {
					resolve(data.height);
				}

				ctx.removeEventListener('message', handler);
			};

			ctx.addEventListener('message', handler);

			WorkerInstance.applyTileOffsetToHeightPositions(positions, x, y);
			this.sendHeightRequest(x, y, positions);
		});
	}

	private static applyTileOffsetToHeightPositions(heightPositions: Float64Array, x: number, y: number): void {
		const offset = MathUtils.tile2meters(x, y + 1, this.TileZoom);

		for (let i = 0; i < heightPositions.length; i += 2) {
			heightPositions[i] += offset.x;
			heightPositions[i + 1] += offset.y;
		}
	}
}

new WorkerInstance(self as unknown as Worker);