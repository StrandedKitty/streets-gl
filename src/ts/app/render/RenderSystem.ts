import Renderer from "../../renderer/Renderer";
import PerspectiveCamera from "../../core/PerspectiveCamera";
import Object3D from "../../core/Object3D";
import GroundMaterial from "./materials/GroundMaterial";
import Mat4 from "../../math/Mat4";
import {App} from "../App";

export default class RenderSystem {
	public renderer: Renderer;
	public camera: PerspectiveCamera;
	public scene: Object3D;
	public wrapper: Object3D;

	private quadMaterial: GroundMaterial;

	constructor(private app: App) {
		this.init();
	}

	private init() {
		this.renderer = new Renderer(<HTMLCanvasElement>document.getElementById('canvas'));
		this.renderer.setSize(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio);
		this.renderer.culling = true;

		this.camera = new PerspectiveCamera({
			fov: 40,
			near: 10,
			far: 25000,
			aspect: window.innerWidth / window.innerHeight
		});

		this.initScene();

		console.log(`Vendor: ${this.renderer.rendererInfo[0]}\nRenderer: ${this.renderer.rendererInfo[1]}`);

		window.addEventListener('resize', () => this.resize());
	}

	private initScene() {
		this.scene = new Object3D();
		this.wrapper = new Object3D();
		this.scene.add(this.wrapper);

		this.wrapper.add(this.camera);

		this.quadMaterial = new GroundMaterial(this.renderer);
	}

	private resize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}

	public update(deltaTime: number) {
		this.renderer.bindFramebuffer(null);

		this.wrapper.position.x = -this.camera.position.x;
		this.wrapper.position.z = -this.camera.position.z;

		this.updateTiles();

		this.scene.updateMatrixRecursively();
		this.scene.updateMatrixWorldRecursively();

		this.camera.updateMatrixWorld();
		this.camera.updateMatrixWorldInverse();

		this.renderTiles();
	}

	private updateTiles() {
		const tiles = this.app.tileManager.tiles;

		for(const tile of tiles.values()) {
			if(!tile.ground && tile.readyForRendering) {
				tile.createGround(this.renderer);
				this.wrapper.add(tile.ground);
			}
		}
	}

	private renderTiles() {
		const tiles = this.app.tileManager.tiles;

		this.quadMaterial.use();

		this.quadMaterial.uniforms.projectionMatrix.value = this.camera.projectionMatrix;

		for(const tile of tiles.values()) {
			if(!tile.ground) {
				continue;
			}

			tile.ground.updateMatrix();
			tile.ground.updateMatrixWorld();
			this.quadMaterial.uniforms.modelViewMatrix.value = Mat4.multiply(this.camera.matrixWorldInverse, tile.ground.matrixWorld);
			this.quadMaterial.uniforms.modelMatrix.value = tile.ground.matrixWorld;
			this.quadMaterial.uniforms.map.value = tile.colorMap;
			this.quadMaterial.updateUniform('projectionMatrix');
			this.quadMaterial.updateUniform('modelViewMatrix');
			this.quadMaterial.updateUniform('map');

			tile.ground.draw();
		}
	}
}
