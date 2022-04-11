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

class App {
	private loop = (deltaTime: number) => this.update(deltaTime);
	private time: number = 0;
	private systemManager: SystemManager;

	constructor() {
		const resourceManager = ResourceManager;

		resourceManager.add('roofColor1', '/textures/buildings/roofs/1_color.png');
		resourceManager.add('roofColor2', '/textures/buildings/roofs/2_color.png');
		resourceManager.add('roofColor3', '/textures/buildings/roofs/3_color.png');
		resourceManager.add('roofColor4', '/textures/buildings/roofs/4_color.png');
		resourceManager.add('roofNormal1', '/textures/buildings/roofs/1_normal.png');
		resourceManager.add('roofNormal2', '/textures/buildings/roofs/2_normal.png');
		resourceManager.add('roofNormal3', '/textures/buildings/roofs/3_normal.png');
		resourceManager.add('roofNormal4', '/textures/buildings/roofs/4_normal.png');

		console.log(resourceManager)

		resourceManager.load().then(() => {
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
