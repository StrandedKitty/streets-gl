import System from "./System";

type AbstractSystemType = { new(s: SystemManager): System };

export default class SystemManager {
	private systems: Map<AbstractSystemType, System> = new Map();

	public addSystems(systemTypes: AbstractSystemType[]) {
		for (const systemType of systemTypes) {
			this.systems.set(systemType, new systemType(this));
		}

		for (const system of this.systems.values()) {
			system.postInit();
		}
	}

	public updateSystems(deltaTime: number) {
		for (const system of this.systems.values()) {
			system.update(deltaTime);
		}
	}

	public getSystem<T extends System>(systemType: { new(s: SystemManager): T }): T {
		return <T>this.systems.get(systemType);
	}
}