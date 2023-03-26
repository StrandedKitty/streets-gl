export enum SettingsSchemaRangeScale {
	Linear,
	Logarithmic
}

export type SettingsSchemaEntry = {
	status?: string[];
	statusDefault?: string;
	selectRange?: [number, number, number];
	selectRangeDefault?: number;

	label: string;
	parent?: string;
	parentStatusCondition?: string[];
	statusLabels?: string[];
	selectRangeScale?: SettingsSchemaRangeScale;
	category: string;
};

export type SettingsSchema = Record<string, SettingsSchemaEntry>;