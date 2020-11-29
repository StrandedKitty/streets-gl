import '../../css/style.css';
import RenderSystem from "./render/RenderSystem";
import TileManager from "./world/TileManager";
import Controls from "./controls/Controls";
import PickingSystem from "./systems/PickingSystem";
import CursorStyleSystem from './systems/CursorStyleSystem';

export class App {
	private loop = (deltaTime: number) => this.update(deltaTime);
	private time: number = 0;
	public canvas: HTMLCanvasElement;

	public renderSystem: RenderSystem;
	public controls: Controls;
	public tileManager: TileManager;
	public pickingSystem: PickingSystem;
	public cursorStyleSystem: CursorStyleSystem;

	constructor() {
		this.canvas = <HTMLCanvasElement>document.getElementById('canvas');

		this.pickingSystem = new PickingSystem(this);
		this.renderSystem = new RenderSystem(this);
		this.cursorStyleSystem = new CursorStyleSystem(this.canvas);
		this.controls = new Controls(this);
		this.tileManager = new TileManager(this);

		this.init();
	}

	private init() {
		this.update();
	}

	public update(rafTime: number = 0) {
		requestAnimationFrame(this.loop);

		const deltaTime = (rafTime - this.time) / 1e3;
		this.time = rafTime;

		this.controls.update(this.renderSystem.camera);
		this.pickingSystem.update();
		this.tileManager.update();
		this.renderSystem.update(deltaTime);
	}
}

export default new App;
