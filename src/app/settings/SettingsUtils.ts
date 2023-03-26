import {SettingsObject, SettingsObjectEntry} from "~/app/settings/SettingsObject";
import {SettingsSchema} from "~/app/settings/SettingsSchema";

export function fetchSettingsFromLocalStorage(): Record<string, any> {
	const storageValue = localStorage.getItem('settings');
	const json: Record<string, any> = {};

	if (storageValue) {
		try {
			Object.assign(json, JSON.parse(storageValue));
		} catch (e) {
			console.error('Failed to parse settings from local storage');
		}
	}

	return json;
}

export function saveSettingsInLocalStorage(settings: SettingsObject): void {
	localStorage.setItem('settings', JSON.stringify(settings));
}

export function makeSettingsMatchSchema(stored: Record<string, any>, schema: SettingsSchema): SettingsObject {
	const settingsObject: SettingsObject = {};

	for (const [key, config] of Object.entries(schema)) {
		const value: SettingsObjectEntry = {};

		if (config.status) {
			const prev = stored[key]?.statusValue;

			if (config.status.includes(prev)) {
				value.statusValue = prev;
			} else {
				value.statusValue = config.statusDefault;
			}
		}

		if (config.selectRange) {
			const prev = +stored[key]?.numberValue;

			if (prev >= config.selectRange[0] && prev <= config.selectRange[1]) {
				value.numberValue = prev;
			} else {
				value.numberValue = config.selectRangeDefault;
			}
		}

		settingsObject[key] = value;
	}

	return settingsObject;
}