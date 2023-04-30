import {ControlsState} from "../systems/ControlsSystem";
import MathUtils from "~/lib/math/MathUtils";
import Config from "../Config";

export default class URLControlsStateHandler {
	private hash: string;

	public serializeControlsState(state: ControlsState): string {
		const position = MathUtils.meters2degrees(state.x, state.z);

		const lat = position.lat.toFixed(5);
		const lon = position.lon.toFixed(5);
		const pitch = MathUtils.toDeg(state.pitch).toFixed(2);
		const yaw = MathUtils.toDeg(state.yaw).toFixed(2);
		const distance = state.distance.toFixed(2);

		return `${lat},${lon},${pitch},${yaw},${distance}`;
	}

	public setHashFromState(state: ControlsState): void {
		const hashString = this.serializeControlsState(state);
		history.replaceState(undefined, undefined, `#${hashString}`);
		this.hash = hashString;
	}

	public getStateFromHash(): [ControlsState, boolean] {
		const hashString = window.location.hash.replace('#', '');

		const hashData = hashString.split(',');
		let newState: ControlsState = null;

		const changedByUser = hashString !== this.hash && hashData.length === 5;

		if(changedByUser) {
			let validHash = true;

			for(const value of hashData) {
				if(isNaN(parseFloat(value))) {
					validHash = false;
				}
			}

			if(validHash) {
				newState = {} as ControlsState;

				const lat = MathUtils.clamp(parseFloat(hashData[0]), -85.051129, 85.051129);
				const lon = MathUtils.clamp(parseFloat(hashData[1]), -180, 180);
				const position = MathUtils.degrees2meters(lat, lon);

				newState.x = position.x;
				newState.z = position.y;
				newState.pitch = MathUtils.toRad(MathUtils.clamp(parseFloat(hashData[2]), Config.MinCameraPitch, Config.MaxCameraPitch));
				newState.yaw = MathUtils.toRad(MathUtils.clamp(parseFloat(hashData[3]), 0, 360));
				newState.distance = Math.max(parseFloat(hashData[4]), Config.MinCameraDistance);
			}
		}

		this.hash = hashString;

		return [newState, changedByUser]
	}
}