export interface SettingsValuesEntry {
	statusValue?: string;
	numberValue?: number;
}
export type SettingsValues = Record<string, SettingsValuesEntry>;
export enum SettingsSelectRangeScale {
	Linear,
	Logarithmic
}
export type SettingsConfigEntryType = {
	label: string;
	parent?: string;
	parentStatusCondition?: string[];
	status?: string[];
	statusLabels?: string[];
	statusDefault?: string;
	selectRange?: [number, number, number];
	selectRangeDefault?: number;
	selectRangeScale?: SettingsSelectRangeScale;
};
export type SettingsConfigType = Record<string, SettingsConfigEntryType>;
const SettingsConfig: SettingsConfigType = {
	fov: {
		label: 'Vertical field of view',
		selectRange: [10, 120, 1],
		selectRangeDefault: 40
	},
	labels: {
		label: 'Text labels',
		status: ['off', 'on'],
		statusLabels: ['Disabled', 'Enabled'],
		statusDefault: 'on'
	},
	airTraffic: {
		label: 'Real-time air traffic',
		status: ['off', 'on'],
		statusLabels: ['Disabled', 'Enabled'],
		statusDefault: 'on'
	},
	shadows: {
		label: 'Shadows',
		status: ['off', 'low', 'medium', 'high'],
		statusLabels: ['Disabled', 'Low quality', 'Medium quality', 'High quality'],
		statusDefault: 'medium'
	},
	dof: {
		label: 'Depth of field',
		status: ['off', 'low', 'high'],
		statusLabels: ['Disabled', 'Low quality', 'High quality'],
		statusDefault: 'off'
	},
	dofAperture: {
		label: 'Aperture',
		parent: 'dof',
		parentStatusCondition: ['low', 'high'],
		selectRange: [0.001, 1, 0.001],
		selectRangeDefault: 0.01,
		selectRangeScale: SettingsSelectRangeScale.Logarithmic
	},
	dofMode: {
		label: 'Focusing mode',
		parent: 'dof',
		parentStatusCondition: ['low', 'high'],
		status: ['center', 'ground', 'cursor'],
		statusLabels: ['Screen center', 'Ground', 'Cursor position'],
		statusDefault: 'center'
	},
	bloom: {
		label: 'Bloom',
		status: ['off', 'on'],
		statusLabels: ['Disabled', 'Enabled'],
		statusDefault: 'on'
	},
	ssr: {
		label: 'Screen-space reflections',
		status: ['off', 'low', 'high'],
		statusLabels: ['Disabled', 'Low quality', 'High quality'],
		statusDefault: 'off'
	},
	ssao: {
		label: 'Screen-space ambient occlusion',
		status: ['off', 'on'],
		statusLabels: ['Disabled', 'Enabled'],
		statusDefault: 'on'
	}
};

export default new class SettingsManager {
	private readonly values: SettingsValues = {};
	public readonly config: SettingsConfigType = SettingsConfig;
	private readonly listeners: Record<string, ((value: SettingsValuesEntry) => void)[]> = {};
	private readonly globalListeners: ((value: SettingsValues) => void)[] = [];

	public constructor() {
		const lsString = localStorage.getItem('settings');
		const lsValue: SettingsValues = {};

		if (lsString) {
			try {
				Object.assign(lsValue, JSON.parse(lsString));
			} catch (e) {
				console.error('Failed to parse settings from local storage');
			}
		}

		for (const [key, config] of Object.entries(SettingsConfig)) {
			const value: SettingsValuesEntry = {};

			if (config.status) {
				const ls = lsValue[key]?.statusValue;

				if (config.status.includes(ls)) {
					value.statusValue = ls;
				} else {
					value.statusValue = config.statusDefault;
				}
			}

			if (config.selectRange) {
				const ls = +lsValue[key]?.numberValue;

				if (ls >= config.selectRange[0] && ls <= config.selectRange[1]) {
					value.numberValue = ls;
				} else {
					value.numberValue = config.selectRangeDefault;
				}
			}

			this.values[key] = value;
		}
	}

	public resetAllSettings(): void {
		for (const [key, config] of Object.entries(SettingsConfig)) {
			const value: SettingsValuesEntry = {};

			if (config.status) {
				value.statusValue = config.statusDefault;
			}

			if (config.selectRange) {
				value.numberValue = config.selectRangeDefault;
			}

			this.updateSetting(key, value);
		}
	}

	public getSetting(key: string): SettingsValuesEntry {
		return this.values[key];
	}

	public getAllSettings(): SettingsValues {
		return this.values;
	}

	public updateSetting(key: string, value: SettingsValuesEntry): void {
		this.values[key] = value;

		if (this.listeners[key]) {
			for (const callback of this.listeners[key]) {
				callback(value);
			}
		}

		for (const callback of this.globalListeners) {
			callback(this.values);
		}

		localStorage.setItem('settings', JSON.stringify(this.values));
	}

	public onSettingChange(key: string, callback: (value: SettingsValuesEntry) => void): void {
		if (!this.listeners[key]) {
			this.listeners[key] = [];
		}

		this.listeners[key].push(callback);
		callback(this.values[key]);
	}

	public onAnySettingChange(callback: (value: SettingsValues) => void): void {
		this.globalListeners.push(callback);
	}
}