import '../../css/style.css';
import RenderSystem from "./systems/RenderSystem";
import TileSystem from "./systems/TileSystem";
import ControlsSystem from "./systems/ControlsSystem";
import PickingSystem from "./systems/PickingSystem";
import CursorStyleSystem from './systems/CursorStyleSystem';
import SystemManager from "./SystemManager";
import TileObjectsSystem from "./systems/TileObjectsSystem";
import StaticGeometryLoadingSystem from "./systems/StaticGeometryLoadingSystem";
import MapWorkerSystem from "./systems/MapWorkerSystem";

class App {
	private loop = (deltaTime: number) => this.update(deltaTime);
	private time: number = 0;
	private systemManager: SystemManager;

	constructor() {
		this.init();
	}

	private init() {
		this.systemManager = new SystemManager();

		this.systemManager.addSystems([
			ControlsSystem,
			CursorStyleSystem,
			PickingSystem,
			TileSystem,
			TileObjectsSystem,
			RenderSystem,
			MapWorkerSystem,
			StaticGeometryLoadingSystem
		]);

		this.update();
	}

	private update(rafTime: number = 0) {
		requestAnimationFrame(this.loop);

		const deltaTime = (rafTime - this.time) / 1e3;
		this.time = rafTime;

		this.systemManager.updateSystems(deltaTime);
	}
}

export default new App;
