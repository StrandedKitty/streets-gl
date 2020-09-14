import '../../css/style.css';
import RenderSystem from "./render/RenderSystem";
import TileManager from "./TileManager";
import Controls from "./Controls";
import {degrees2meters} from "../math/Utils";

class App {
	private loop = (deltaTime: number) => this.update(deltaTime);
	private time: number = 0;

	public renderSystem: RenderSystem;
	public controls: Controls;
	public tileManager: TileManager;

	constructor() {
		this.renderSystem = new RenderSystem(this);
		this.controls = new Controls(document.getElementById('canvas'));
		this.tileManager = new TileManager(this);

		this.init();
	}

	private init() {
		const cameraPosition = degrees2meters(36.180420, -111.799172);
		this.controls.target.set(cameraPosition.x, 0, cameraPosition.y);

		this.update();
	}

	public update(rafTime: number = 0) {
		requestAnimationFrame(this.loop);

		const deltaTime = (rafTime - this.time) / 1e3;
		this.time = rafTime;

		this.controls.update(this.renderSystem.camera);
		this.tileManager.update();
		this.renderSystem.update(deltaTime);
	}
}

export {App};
export default new App;
