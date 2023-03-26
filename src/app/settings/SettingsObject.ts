export interface SettingsObjectEntry {
	statusValue?: string;
	numberValue?: number;
}

export type SettingsObject = Record<string, SettingsObjectEntry>;