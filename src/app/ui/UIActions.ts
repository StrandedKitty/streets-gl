import {OverpassEndpoint} from "~/app/systems/TileLoadingSystem";

export default interface UIActions {
	updateRenderGraph: () => void;
	goToLatLon: (lat: number, lon: number) => void;
	lookAtNorth: () => void;
	setTime: (time: number) => void;
	resetSettings: () => void;
	setOverpassEndpoints: (endpoints: OverpassEndpoint[]) => void;
	resetOverpassEndpoints: () => void;
	getControlsStateHash: () => string;
}