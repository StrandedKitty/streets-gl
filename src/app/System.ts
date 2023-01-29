import SystemManager from "./SystemManager";

export default abstract class System {
	public systemManager: SystemManager; // injected

	public abstract postInit(): void;

	public abstract update(deltaTime: number): void;
}