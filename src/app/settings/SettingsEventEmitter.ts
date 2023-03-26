import {SettingsObjectEntry} from "~/app/settings/SettingsObject";

type OnChangeCallback = (value: SettingsObjectEntry) => void;

export default class SettingsEventEmitter {
	private readonly listeners: Record<string, OnChangeCallback[]> = {};

	public updateSetting(key: string, value: SettingsObjectEntry): void {
		const listeners = this.listeners[key];

		if (!listeners) {
			return;
		}

		for (const callback of listeners) {
			callback(value);
		}
	}

	public onChange(
		key: string,
		callback: (value: SettingsObjectEntry) => void
	): void {
		if (!this.listeners[key]) {
			this.listeners[key] = [];
		}

		this.listeners[key].push(callback);
	}

	public removeOnChangeListener(
		key: string,
		callback: (value: SettingsObjectEntry) => void
	): void {
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