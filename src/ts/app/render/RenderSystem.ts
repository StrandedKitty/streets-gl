import Renderer from "../../renderer/Renderer";
import PerspectiveCamera from "../../core/PerspectiveCamera";
import Object3D from "../../core/Object3D";
import GroundMaterial from "./materials/GroundMaterial";
import Mat4 from "../../math/Mat4";
import {App} from "../App";
import GBuffer from "../../renderer/GBuffer";
import GLConstants from "../../renderer/GLConstants";
import Vec2 from "../../math/Vec2";
import BasicMaterial from "./materials/BasicMaterial";

export default class RenderSystem {
	public renderer: Renderer;
	public camera: PerspectiveCamera;
	public scene: Object3D;
	public wrapper: Object3D;
	private gBuffer: GBuffer;

	private groundMaterial: GroundMaterial;
	private basicMaterial: BasicMaterial;

	constructor(private app: App) {
		this.init();
	}

	private init() {
		this.renderer = new Renderer(<HTMLCanvasElement>document.getElementById('canvas'));
		this.renderer.setSize(this.resolution.x, this.resolution.y);
		this.renderer.culling = true;

		this.gBuffer = new GBuffer(this.renderer, this.resolution.x, this.resolution.y, [
			{
				name: 'color',
				internalFormat: GLConstants.RGB8,
				format: GLConstants.RGB,
				type: GLConstants.UNSIGNED_BYTE,
				mipmaps: false
			}, {
				name: 'normal',
				internalFormat: GLConstants.RGB8,
				format: GLConstants.RGB,
				type: GLConstants.UNSIGNED_BYTE,
				mipmaps: false
			}, {
				name: 'position',
				internalFormat: GLConstants.RGBA32F,
				format: GLConstants.RGBA,
				type: GLConstants.FLOAT,
				mipmaps: false
			}, {
				name: 'metallicRoughness',
				internalFormat: GLConstants.RGBA8,
				format: GLConstants.RGBA,
				type: GLConstants.UNSIGNED_BYTE,
				mipmaps: false
			}, {
				name: 'emission',
				internalFormat: GLConstants.RGB8,
				format: GLConstants.RGB,
				type: GLConstants.UNSIGNED_BYTE,
				mipmaps: false
			}
		]);

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

		this.groundMaterial = new GroundMaterial(this.renderer);
		this.basicMaterial = new BasicMaterial(this.renderer);
	}

	private resize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize(this.resolution.x, this.resolution.y);
		this.gBuffer.setSize(this.resolution.x, this.resolution.y);
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
				tile.generateMeshes(this.renderer);
				this.wrapper.add(tile);
			}
		}
	}

	private renderTiles() {
		const tiles = this.app.tileManager.tiles;

		this.groundMaterial.use();
		this.groundMaterial.uniforms.projectionMatrix.value = this.camera.projectionMatrix;

		for(const tile of tiles.values()) {
			if(!tile.ground) {
				continue;
			}

			this.groundMaterial.uniforms.modelViewMatrix.value = Mat4.multiply(this.camera.matrixWorldInverse, tile.ground.matrixWorld);
			this.groundMaterial.uniforms.modelMatrix.value = tile.ground.matrixWorld;
			this.groundMaterial.uniforms.map.value = tile.colorMap;
			this.groundMaterial.updateUniform('projectionMatrix');
			this.groundMaterial.updateUniform('modelViewMatrix');
			this.groundMaterial.updateUniform('map');

			tile.ground.draw();
		}

		this.basicMaterial.use();
		this.basicMaterial.uniforms.projectionMatrix.value = this.camera.projectionMatrix;

		for(const tile of tiles.values()) {
			const buildings = tile.buildings;

			if(!buildings) {
				continue;
			}

			this.basicMaterial.uniforms.modelViewMatrix.value = Mat4.multiply(this.camera.matrixWorldInverse, buildings.matrixWorld);
			this.basicMaterial.updateUniform('modelViewMatrix');

			buildings.draw();
		}
	}

	public get resolution(): Vec2 {
		return new Vec2(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio);
	}
}
