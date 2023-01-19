import UIRoot from "./UIRoot";
import {UIGlobalState} from "../systems/UISystem";
import React from "react";
import ReactDOM from "react-dom";

type UIGlobalStateListeners = {
	[Key in keyof UIGlobalState]?: ((value: UIGlobalState[Key]) => void)[];
};

export default new class UI {
	private state: UIGlobalState;
	private listeners: UIGlobalStateListeners = {};

	public update(
		updateRenderGraph: () => void,
		goToLatLon: (lat: number, lon: number) => void,
		setTimeState: (state: number) => void
	): void {
		ReactDOM.render(
			<UIRoot
				updateRenderGraph={updateRenderGraph}
				goToLatLon={goToLatLon}
				setTimeState={setTimeState}
			/>,
			document.getElementById('ui')
		);
	}

	public setInitialGlobalState(state: UIGlobalState): void {
		this.state = state;
	}

	public setGlobalStateField<T extends keyof UIGlobalState>(key: T, value: UIGlobalState[T]): void {
		if (this.state[key] === value) {
			return;
		}

		this.state[key] = value;

		if (this.listeners[key]) {
			for (const callback of this.listeners[key]) {
				callback(value);
			}
		}
	}

	public listenToField<T extends keyof UIGlobalState>(key: T, callback: (value: UIGlobalState[T]) => void): void {
		if (!this.listeners[key]) {
			this.listeners[key] = [];
		}

		this.listeners[key].push(callback);
		callback(this.state[key]);
	}
}