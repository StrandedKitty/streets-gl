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
import MapTimeSystem from "./systems/MapTimeSystem";
import UISystem from "./systems/UISystem";
import SceneSystem from '~/app/systems/SceneSystem';
import ResourceManager from '~/app/world/ResourceManager';

const ResourcesJSON = require("./../../resources/resources.json");

class App {
	private loop = (deltaTime: number) => this.update(deltaTime);
	private time: number = 0;
	private systemManager: SystemManager;

	constructor() {
		ResourceManager.addFromJSON(ResourcesJSON);

		ResourceManager.load().then(() => {
			this.init();
		});
	}

	private init() {
		this.systemManager = new SystemManager();

		this.systemManager.addSystems([
			SceneSystem,
			ControlsSystem,
			CursorStyleSystem,
			PickingSystem,
			MapTimeSystem,
			TileSystem,
			TileObjectsSystem,
			RenderSystem,
			MapWorkerSystem,
			StaticGeometryLoadingSystem,
			UISystem
		]);

		this.update();
	}

	private update(rafTime: number = 0) {
		requestAnimationFrame(this.loop);

		const frameStart = performance.now();
		const deltaTime = (rafTime - this.time) / 1e3;
		this.time = rafTime;

		this.systemManager.updateSystems(deltaTime);

		const frameTime = performance.now() - frameStart;
		this.systemManager.getSystem(UISystem).updateFrameTime(frameTime);
	}
}

export default new App;
