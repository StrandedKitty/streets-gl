import '../../css/style.css';
import RenderSystem from "./render/RenderSystem";
import TileManager from "./world/TileManager";
import Controls from "./controls/Controls";
import MathUtils from "../math/MathUtils";

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
		const cameraPosition = MathUtils.degrees2meters(37.663539, -122.418106);
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
