import System from "./System";

type AbstractSystemType = { new(): System };

export default class SystemManager {
	private systems: Map<AbstractSystemType, System> = new Map();

	public addSystems(...systemTypes: AbstractSystemType[]): void {
		const addedSystems = [];

		for (const systemType of systemTypes) {
			const system = new systemType();
			system.systemManager = this;

			this.systems.set(systemType, system);
			addedSystems.push(system);
		}

		for (const system of addedSystems) {
			system.postInit();
		}
	}

	public updateSystems(deltaTime: number): void {
		for (const system of this.systems.values()) {
			system.update(deltaTime);
		}
	}

	public getSystem<T extends System>(systemType: { new(): T }): T {
		return <T>this.systems.get(systemType);
	}
}