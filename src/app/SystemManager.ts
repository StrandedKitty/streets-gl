import System from "./System";

type AbstractSystemType = { new(): System };

export default class SystemManager {
	private systems: Map<AbstractSystemType, System> = new Map();
	private onReadyListeners: Map<AbstractSystemType, ((system: System) => void)[]> = new Map();

	public addSystems(...systemTypes: AbstractSystemType[]): void {
		const addedSystems: [AbstractSystemType, System][] = [];

		for (const systemType of systemTypes) {
			if (this.systems.has(systemType)) {
				throw new Error('System already exists');
			}

			const system = new systemType();
			system.systemManager = this;

			this.systems.set(systemType, system);
			addedSystems.push([systemType, system]);
		}

		for (const [type, system] of addedSystems) {
			system.postInit();

			this.runSystemReadyCallbacks(type, system);
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

	public onSystemReady<T extends System>(systemType: { new(): T }, callback: (system: T) => void): void {
		const existingSystem = this.getSystem(systemType);

		if (existingSystem) {
			callback(existingSystem);
			return;
		}

		let callbackArray = this.onReadyListeners.get(systemType);

		if (!callbackArray) {
			callbackArray = [];

			this.onReadyListeners.set(systemType, callbackArray);
		}

		callbackArray.push(callback as (system: System) => void);
	}

	private runSystemReadyCallbacks(type: AbstractSystemType, instance: System): void {
		const callbacks = this.onReadyListeners.get(type);

		if (callbacks) {
			for (const callback of callbacks) {
				callback(instance);
			}
		}
	}
}