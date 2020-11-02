import Renderer from "../../renderer/Renderer";
import PerspectiveCamera from "../../core/PerspectiveCamera";
import Object3D from "../../core/Object3D";
import GroundMaterial from "./materials/GroundMaterial";
import Mat4 from "../../math/Mat4";
import {App} from "../App";
import GBuffer from "../../renderer/GBuffer";
import GLConstants from "../../renderer/GLConstants";
import Vec2 from "../../math/Vec2";
import BuildingMaterial from "./materials/BuildingMaterial";
import FullScreenQuad from "../objects/FullScreenQuad";
import HDRComposeMaterial from "./materials/HDRComposeMaterial";

export default class RenderSystem {
	public renderer: Renderer;
	public camera: PerspectiveCamera;
	public scene: Object3D;
	public wrapper: Object3D;
	private gBuffer: GBuffer;

	private groundMaterial: GroundMaterial;
	private buildingMaterial: BuildingMaterial;
	private quad: FullScreenQuad;
	private composeMaterial: HDRComposeMaterial;

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
		this.composeMaterial = new HDRComposeMaterial(this.renderer, this.gBuffer);

		this.camera = new PerspectiveCamera({
			fov: 40,
			near: 10,
			far: 25000,
			aspect: window.innerWidth / window.innerHeight
		});

		this.quad = new FullScreenQuad(this.renderer);

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
		this.buildingMaterial = new BuildingMaterial(this.renderer);
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

		this.camera.updateFrustum();

		this.renderTiles();
	}

	private updateTiles() {
		const tiles = this.app.tileManager.tiles;

		for(const tile of tiles.values()) {
			if(!tile.ground && tile.readyForRendering) {
				tile.createGround(this.renderer, this.app.tileManager.getTileNeighbors(tile.x, tile.y));
				tile.generateMeshes(this.renderer);
				this.wrapper.add(tile);
			}
		}
	}

	private renderTiles() {
		const tiles = this.app.tileManager.tiles;

		this.renderer.bindFramebuffer(this.gBuffer.framebuffer);

		this.renderer.clearFramebuffer({
			clearColor: [0.5, 0.5, 0.5, 1],
			depthValue: 1,
			color: true,
			depth: true
		});

		this.groundMaterial.uniforms.projectionMatrix.value = this.camera.projectionMatrix;
		this.groundMaterial.use();

		for(const tile of tiles.values()) {
			if(!tile.ground || !tile.ground.inCameraFrustum(this.camera)) {
				continue;
			}

			this.groundMaterial.uniforms.modelViewMatrix.value = Mat4.multiply(this.camera.matrixWorldInverse, tile.ground.matrixWorld);
			this.groundMaterial.uniforms.map.value = tile.colorMap;
			this.groundMaterial.updateUniform('modelViewMatrix');
			this.groundMaterial.updateUniform('map');

			tile.ground.draw();
		}

		this.buildingMaterial.uniforms.projectionMatrix.value = this.camera.projectionMatrix;
		this.buildingMaterial.use();

		for(const tile of tiles.values()) {
			const buildings = tile.buildings;

			if(!buildings || !buildings.inCameraFrustum(this.camera)) {
				continue;
			}

			this.buildingMaterial.uniforms.modelViewMatrix.value = Mat4.multiply(this.camera.matrixWorldInverse, buildings.matrixWorld);
			this.buildingMaterial.updateUniform('modelViewMatrix');

			buildings.draw();
		}

		this.renderer.bindFramebuffer(null);

		this.composeMaterial.uniforms.viewMatrix.value = this.camera.matrixWorld;
		this.composeMaterial.use();
		this.quad.draw();
	}

	public get resolution(): Vec2 {
		return new Vec2(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio);
	}
}
