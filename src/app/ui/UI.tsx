import Root from "./Root";
import {UIActions, UISystemState} from "../systems/UISystem";
import React from "react";
import { createRoot } from 'react-dom/client';
import {RecoilRoot} from "recoil";
import {AtomsCollection} from "~/app/ui/state/atoms";

type Listeners = {
	[Key in keyof UISystemState]?: ((value: UISystemState[Key]) => void)[];
};

export const AtomsContext = React.createContext<AtomsCollection>(null);
export const ActionsContext = React.createContext<UIActions>(null);

export default class UI {
	private readonly state: UISystemState;
	private readonly listeners: Listeners = {};

	public constructor(state: UISystemState) {
		this.state = state;
	}

	public update(
		atoms: AtomsCollection,
		actions: UIActions
	): void {
		const element = document.getElementById('ui');
		const root = createRoot(element);

		root.render(
			<React.StrictMode>
				<AtomsContext.Provider value={atoms}>
					<ActionsContext.Provider value={actions}>
						<RecoilRoot>
							<Root/>
						</RecoilRoot>
					</ActionsContext.Provider>
				</AtomsContext.Provider>
			</React.StrictMode>
		);

		element.addEventListener('click', event => {
			event.stopPropagation();
		});
	}

	public setStateFieldValue<T extends keyof UISystemState>(key: T, value: UISystemState[T]): void {
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

	public getStateFieldValue<T extends keyof UISystemState>(key: T): UISystemState[T] {
		return this.state[key];
	}

	public addStateFieldListener<T extends keyof UISystemState>(key: T, callback: (value: UISystemState[T]) => void): void {
		if (!this.listeners[key]) {
			this.listeners[key] = [];
		}

		this.listeners[key].push(callback);
		callback(this.state[key]);
	}

	public removeStateFieldListener<T extends keyof UISystemState>(key: T, callback: (value: UISystemState[T]) => void): void {
		if (!this.listeners[key]) {
			return;
		}

		const index = this.listeners[key].indexOf(callback);

		if (index === -1) {
			return;
		}

		this.listeners[key].splice(index, 1);
	}
}