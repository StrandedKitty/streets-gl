import {SettingsObject, SettingsObjectEntry} from "~/app/settings/SettingsObject";
import SettingsEventEmitter from "~/app/settings/SettingsEventEmitter";
import {saveSettingsToLocalStorage} from "~/app/settings/SettingsUtils";

export default class SettingsContainer {
	private readonly emitter: SettingsEventEmitter = new SettingsEventEmitter();
	private readonly settingsObject: SettingsObject;

	public constructor(settingsObject: SettingsObject) {
		this.settingsObject = settingsObject;
	}

	public get(key: string): SettingsObjectEntry {
		return this.settingsObject[key];
	}

	public update(key: string, value: SettingsObjectEntry): void {
		this.settingsObject[key] = value;
		this.saveSettings();

		this.emitter.updateSetting(key, value);
	}

	public onChange(
		key: string,
		callback: (value: SettingsObjectEntry) => void,
		isImmediate: boolean = true
	): void {
		this.emitter.onChange(key, callback);

		if (isImmediate) {
			callback(this.settingsObject[key]);
		}
	}

	public removeOnChangeListener(
		key: string,
		callback: (value: SettingsObjectEntry) => void
	): void {
		this.emitter.removeOnChangeListener(key, callback);
	}

	private saveSettings(): void {
		saveSettingsToLocalStorage(this.settingsObject);
	}
}