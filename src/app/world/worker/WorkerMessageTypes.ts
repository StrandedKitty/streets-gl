export enum WorkerMessageOutgoingType {
	Start,
	SendHeightData
}

export interface WorkerMessageOutgoing {
	type: WorkerMessageOutgoingType;
	tile: [number, number];
	heightArray?: any;
}

export enum WorkerMessageIncomingType {
	Success,
	Error,
	RequestHeight
}

export interface WorkerMessageIncoming {
	type: WorkerMessageIncomingType;
	tile: [number, number];
	result?: any;
}