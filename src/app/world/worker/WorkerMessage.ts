export namespace WorkerMessage {
	export enum ToWorkerType {
		Start,
		Height
	}

	export interface ToWorker {
		type: ToWorkerType;
		tile: [number, number];
		overpassEndpoint?: string;
		mapboxEndpointTemplate?: string;
		mapboxAccessToken?: string;
		height?: Float64Array;
	}

	export enum FromWorkerType {
		Success,
		Error,
		RequestHeight
	}

	export interface FromWorker {
		type: FromWorkerType;
		tile: [number, number];
		payload?: any;
	}
}