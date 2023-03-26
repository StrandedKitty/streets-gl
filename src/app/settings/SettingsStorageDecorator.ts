import SettingsContainer from "~/app/settings/SettingsContainer";
import {StateStorage} from "~/app/ui/state/utils";

export default class SettingsStorageDecorator implements StateStorage {
	public constructor(private settings: SettingsContainer) {

	}

	public addStateFieldListener(key: string, listener: (value: any) => void): void {
		this.settings.onChange(key, listener);
	}

	public removeStateFieldListener(key: string, listener: (value: any) => void): void {
		this.settings.removeOnChangeListener(key, listener);
	}

	public getStateFieldValue(key: string): any {
		return this.settings.get(key);
	}

	public setStateFieldValue(key: string, value: any): void {
		this.settings.update(key, value);
	}
}