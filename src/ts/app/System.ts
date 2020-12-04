import SystemManager from "./SystemManager";

export default abstract class System {
	protected systemManager: SystemManager;

	protected constructor(systemManager: SystemManager) {
		this.systemManager = systemManager;
	}

	public abstract postInit(): void;

	public abstract update(deltaTime: number): void;
}