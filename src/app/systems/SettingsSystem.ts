import System from "~/app/System";
import {SettingsSchema} from "~/app/settings/SettingsSchema";
import Config from "~/app/Config";
import {fetchSettingsFromLocalStorage, makeSettingsMatchSchema} from "~/app/settings/SettingsUtils";
import SettingsContainer from "~/app/settings/SettingsContainer";
import {SettingsObjectEntry} from "~/app/settings/SettingsObject";

export default class SettingsSystem extends System {
	private readonly settingsSchema: SettingsSchema = Config.SettingsSchema;
	private readonly settingsContainer: SettingsContainer;

	public constructor() {
		super();

		const stored = fetchSettingsFromLocalStorage();
		const settingsObject = makeSettingsMatchSchema(stored, this.settingsSchema);

		this.settingsContainer = new SettingsContainer(settingsObject)
	}

	public postInit(): void {
	}

	public get settings(): SettingsContainer {
		return this.settingsContainer;
	}

	public get schema(): SettingsSchema {
		return this.settingsSchema;
	}

	public resetSettings(): void {
		for (const [key, schema] of Object.entries(this.settingsSchema)) {
			const value: SettingsObjectEntry = {};

			if (schema.status) {
				value.statusValue = schema.statusDefault;
			}

			if (schema.selectRange) {
				value.numberValue = schema.selectRangeDefault;
			}

			this.settingsContainer.update(key, value);
		}
	}

	public update(deltaTime: number): void {
	}
}