import Renderer from "../../renderer/Renderer";
import PerspectiveCamera from "../../core/PerspectiveCamera";
import Object3D from "../../core/Object3D";
import GroundMaterial from "../render/materials/GroundMaterial";
import Mat4 from "../../math/Mat4";
import GBuffer from "../../renderer/GBuffer";
import GLConstants from "../../renderer/GLConstants";
import Vec2 from "../../math/Vec2";
import BuildingMaterial from "../render/materials/BuildingMaterial";
import FullScreenQuad from "../objects/FullScreenQuad";
import HDRComposeMaterial from "../render/materials/HDRComposeMaterial";
import SkyboxMaterial from "../render/materials/SkyboxMaterial";
import Skybox from "../objects/Skybox";
import LDRComposeMaterial from "../render/materials/LDRComposeMaterial";
import CSM from "../render/CSM";
import Config from "../Config";
import GroundDepthMaterial from "../render/materials/GroundDepthMaterial";
import BuildingDepthMaterial from "../render/materials/BuildingDepthMaterial";
import TAAPass from "../render/passes/TAAPass";
import GaussianBlurPass from "../render/passes/GaussianBlurPass";
import SSAOPass from "../render/passes/SSAOPass";
import BilateralBlurPass from "../render/passes/BilateralBlurPass";
import SelectionMaskPass from "../render/passes/SelectionMaskPass";
import System from "../System";
import SystemManager from "../SystemManager";
import TileSystem from "./TileSystem";
import PickingSystem from "./PickingSystem";
import MapTimeSystem from "./MapTimeSystem";
import RoadMaterial from "../render/materials/RoadMaterial";
import ControlsSystem from "./ControlsSystem";
import CoCPass from "../render/passes/CoCPass";
import CoCDownscalePass from "../render/passes/CoCDownscalePass";
import DoFTentPass from "../render/passes/DoFTentPass";
import DoFPass from "../render/passes/DoFPass";
import CoCTempFilterPass from "../render/passes/CoCTempFilterPass";

export default class RenderSystem extends System {
	public renderer: Renderer;
	public camera: PerspectiveCamera;
	public scene: Object3D;
	public wrapper: Object3D;
	private gBuffer: GBuffer;
	private skybox: Skybox;
	private csm: CSM;
	private taaPass: TAAPass;
	private ssaoPass: SSAOPass;
	private selectionMaskPass: SelectionMaskPass;
	private gaussianBlurPass: GaussianBlurPass;
	private bilateralBlurPass: BilateralBlurPass;
	private cocPass: CoCPass;
	private cocTempFilterPass: CoCTempFilterPass;
	private cocDownscalePass: CoCDownscalePass;
	private dofTentPass: DoFTentPass;
	private dofPass: DoFPass;
	private frameCount: number = 0;

	private groundMaterial: GroundMaterial;
	private groundDepthMaterial: GroundDepthMaterial;
	private buildingMaterial: BuildingMaterial;
	private buildingDepthMaterial: BuildingDepthMaterial;
	private roadMaterial: RoadMaterial;
	private skyboxMaterial: SkyboxMaterial;
	private quad: FullScreenQuad;
	private hdrComposeMaterial: HDRComposeMaterial;
	private ldrComposeMaterial: LDRComposeMaterial;

	constructor(systemManager: SystemManager) {
		super(systemManager);

		this.init();
	}

	private init() {
		this.renderer = new Renderer(<HTMLCanvasElement>document.getElementById('canvas'));
		this.renderer.setSize(this.resolution.x, this.resolution.y);
		this.renderer.culling = true;

		this.gBuffer = new GBuffer(this.renderer, this.resolution.x, this.resolution.y, [
			{
				name: 'color',
				internalFormat: GLConstants.RGBA8,
				format: GLConstants.RGBA,
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
			}, {
				name: 'motion',
				internalFormat: GLConstants.RGBA32F,
				format: GLConstants.RGBA,
				type: GLConstants.FLOAT,
				mipmaps: false
			}, {
				name: 'objectId',
				internalFormat: GLConstants.R32UI,
				format: GLConstants.RED_INTEGER,
				type: GLConstants.UNSIGNED_INT,
				mipmaps: false
			}
		]);
		this.hdrComposeMaterial = new HDRComposeMaterial(this.renderer, this.gBuffer);
		this.ldrComposeMaterial = new LDRComposeMaterial(this.renderer, this.gBuffer);

		this.taaPass = new TAAPass(this.renderer, this.resolution.x, this.resolution.y);
		this.ssaoPass = new SSAOPass(this.renderer, this.resolution.x, this.resolution.y);
		this.selectionMaskPass = new SelectionMaskPass(this.renderer, this.resolution.x, this.resolution.y);
		this.gaussianBlurPass = new GaussianBlurPass(this.renderer, this.resolution.x, this.resolution.y);
		this.bilateralBlurPass = new BilateralBlurPass(this.renderer, this.resolution.x, this.resolution.y);
		this.cocPass = new CoCPass(this.renderer, this.resolution.x, this.resolution.y);
		this.cocTempFilterPass = new CoCTempFilterPass(this.renderer, this.resolution.x, this.resolution.y);
		this.cocDownscalePass = new CoCDownscalePass(this.renderer, this.resolution.x, this.resolution.y);
		this.dofTentPass = new DoFTentPass(this.renderer, this.resolution.x, this.resolution.y);
		this.dofPass = new DoFPass(this.renderer, this.resolution.x, this.resolution.y);

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

	public postInit() {

	}

	private initScene() {
		this.scene = new Object3D();
		this.wrapper = new Object3D();
		this.scene.add(this.wrapper);

		this.wrapper.add(this.camera);

		this.skybox = new Skybox(this.renderer);
		this.wrapper.add(this.skybox);

		this.csm = new CSM(this.renderer, {
			camera: this.camera,
			parent: this.wrapper,
			near: this.camera.near,
			far: 4000,
			resolution: 2048,
			cascades: Config.ShadowCascades,
			shadowBias: -0.003,
			shadowNormalBias: 0.002,
		});

		this.groundMaterial = new GroundMaterial(this.renderer);
		this.groundDepthMaterial = new GroundDepthMaterial(this.renderer);
		this.buildingMaterial = new BuildingMaterial(this.renderer);
		this.buildingDepthMaterial = new BuildingDepthMaterial(this.renderer);
		this.roadMaterial = new RoadMaterial(this.renderer);
		this.skyboxMaterial = new SkyboxMaterial(this.renderer);
	}

	private resize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize(this.resolution.x, this.resolution.y);
		this.gBuffer.setSize(this.resolution.x, this.resolution.y);
		this.taaPass.setSize(this.resolution.x, this.resolution.y);
		this.ssaoPass.setSize(this.resolution.x, this.resolution.y);
		this.selectionMaskPass.setSize(this.resolution.x, this.resolution.y);
		this.gaussianBlurPass.setSize(this.resolution.x, this.resolution.y);
		this.bilateralBlurPass.setSize(this.resolution.x, this.resolution.y);
		this.cocPass.setSize(this.resolution.x, this.resolution.y);
		this.cocTempFilterPass.setSize(this.resolution.x, this.resolution.y);
		this.cocDownscalePass.setSize(this.resolution.x, this.resolution.y);
		this.dofTentPass.setSize(this.resolution.x, this.resolution.y);
		this.dofPass.setSize(this.resolution.x, this.resolution.y);
		this.csm.updateFrustums();
	}

	public update(deltaTime: number) {
		const pivotDelta = new Vec2(
			this.wrapper.position.x + this.camera.position.x,
			this.wrapper.position.z + this.camera.position.z
		);

		this.wrapper.position.x = -this.camera.position.x;
		this.wrapper.position.z = -this.camera.position.z;

		this.wrapper.updateMatrix();

		this.updateTiles();

		this.scene.updateMatrixWorldRecursively();

		this.camera.updateMatrixWorldInverse();
		this.camera.updateFrustum();

		this.taaPass.jitterProjectionMatrix(this.camera.projectionMatrix, this.frameCount);
		this.taaPass.matrixWorldInverse = this.camera.matrixWorldInverse;

		if (this.taaPass.matrixWorldInversePrev) {
			this.taaPass.matrixWorldInversePrev = Mat4.translate(
				this.taaPass.matrixWorldInversePrev,
				pivotDelta.x,
				0,
				pivotDelta.y
			);
		}

		this.renderShadowMaps();
		this.renderTiles();

		++this.frameCount;
	}

	private updateTiles() {
		const tiles = this.systemManager.getSystem(TileSystem).tiles;

		for (const tile of tiles.values()) {
			if (!tile.ground && tile.readyForRendering) {
				//tile.createGround(this.renderer, this.systemManager.getSystem(TileSystem).getTileNeighbors(tile.x, tile.y));
				tile.generateMeshes(this.renderer);
				this.wrapper.add(tile);
			}
		}
	}

	private renderTiles() {
		const tiles = this.systemManager.getSystem(TileSystem).tiles;

		this.renderer.bindFramebuffer(this.gBuffer.framebuffer);

		this.gBuffer.clearDepth();

		this.renderer.culling = false;
		this.renderer.depthWrite = false;

		this.skybox.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z);
		this.skybox.updateMatrix();
		this.skybox.updateMatrixWorld();

		this.skyboxMaterial.uniforms.projectionMatrix.value = this.camera.projectionMatrix;
		this.skyboxMaterial.uniforms.modelViewMatrix.value = Mat4.multiply(this.camera.matrixWorldInverse, this.skybox.matrixWorld);
		this.skyboxMaterial.uniforms.modelViewMatrixPrev.value = Mat4.multiply(
			this.taaPass.matrixWorldInversePrev || this.camera.matrixWorldInverse,
			this.skybox.matrixWorld
		);

		this.skyboxMaterial.uniforms.modelViewMatrixPrev.value.values[12] = this.skyboxMaterial.uniforms.modelViewMatrix.value.values[12];
		this.skyboxMaterial.uniforms.modelViewMatrixPrev.value.values[13] = this.skyboxMaterial.uniforms.modelViewMatrix.value.values[13];
		this.skyboxMaterial.uniforms.modelViewMatrixPrev.value.values[14] = this.skyboxMaterial.uniforms.modelViewMatrix.value.values[14];

		this.skyboxMaterial.use();
		this.skybox.draw();

		this.renderer.culling = true;
		this.renderer.depthWrite = true;

		this.groundMaterial.uniforms.projectionMatrix.value = this.camera.projectionMatrix;
		this.groundMaterial.uniforms.map.value = null;
		this.groundMaterial.use();

		for (const tile of tiles.values()) {
			if (tile.displayBufferNeedsUpdate) {
				tile.updateDisplayBuffer();

				tile.displayBufferNeedsUpdate = false;
			}

			if (!tile.ground || !tile.ground.inCameraFrustum(this.camera)) {
				continue;
			}

			this.groundMaterial.uniforms.modelViewMatrix.value = Mat4.multiply(this.camera.matrixWorldInverse, tile.ground.matrixWorld);
			this.groundMaterial.uniforms.modelViewMatrixPrev.value = Mat4.multiply(
				this.taaPass.matrixWorldInversePrev || this.camera.matrixWorldInverse,
				tile.ground.matrixWorld
			);
			this.groundMaterial.uniforms.map.value = tile.colorMap;
			this.groundMaterial.updateUniform('modelViewMatrix');
			this.groundMaterial.updateUniform('modelViewMatrixPrev');
			this.groundMaterial.updateUniform('map');

			tile.ground.draw();
		}

		this.roadMaterial.uniforms.projectionMatrix.value = this.camera.projectionMatrix;
		this.roadMaterial.use();

		this.renderer.gl.enable(GLConstants.POLYGON_OFFSET_FILL);
		this.renderer.gl.polygonOffset(-1, -10);
		this.renderer.depthWrite = false;

		for (const tile of tiles.values()) {
			if (!tile.roads) {
				continue;
			}

			this.roadMaterial.uniforms.modelViewMatrix.value = Mat4.multiply(this.camera.matrixWorldInverse, tile.roads.matrixWorld);
			this.roadMaterial.uniforms.modelViewMatrixPrev.value = Mat4.multiply(
				this.taaPass.matrixWorldInversePrev || this.camera.matrixWorldInverse,
				tile.roads.matrixWorld
			);
			this.roadMaterial.updateUniform('modelViewMatrix');
			this.roadMaterial.updateUniform('modelViewMatrixPrev');

			tile.roads.draw();
		}

		this.renderer.gl.disable(GLConstants.POLYGON_OFFSET_FILL);
		this.renderer.depthWrite = true;

		this.buildingMaterial.uniforms.projectionMatrix.value = this.camera.projectionMatrix;
		this.buildingMaterial.use();

		for (const tile of tiles.values()) {
			if (!tile.buildings || !tile.buildings.inCameraFrustum(this.camera)) {
				continue;
			}

			this.buildingMaterial.uniforms.tileId.value = tile.localId;
			this.buildingMaterial.uniforms.modelViewMatrix.value = Mat4.multiply(this.camera.matrixWorldInverse, tile.buildings.matrixWorld);
			this.buildingMaterial.uniforms.modelViewMatrixPrev.value = Mat4.multiply(
				this.taaPass.matrixWorldInversePrev || this.camera.matrixWorldInverse,
				tile.buildings.matrixWorld
			);
			this.buildingMaterial.updateUniform('tileId');
			this.buildingMaterial.updateUniform('modelViewMatrix');
			this.buildingMaterial.updateUniform('modelViewMatrixPrev');

			tile.buildings.draw();
		}

		const selectedObjectId = this.pickObjectId();

		if (selectedObjectId > 0) {
			this.selectionMaskPass.clear();

			const picking = this.systemManager.getSystem(PickingSystem);
			const tile = picking.selectedObjectTile;
			const localId = picking.selectedObjectLocalId;

			if(!tile.disposed) {
				this.selectionMaskPass.buildingMaterial.uniforms.projectionMatrix.value = this.camera.projectionMatrix;
				this.selectionMaskPass.buildingMaterial.uniforms.modelViewMatrix.value = Mat4.multiply(this.camera.matrixWorldInverse, tile.buildings.matrixWorld);
				this.selectionMaskPass.buildingMaterial.uniforms.objectId.value = localId;
				this.selectionMaskPass.buildingMaterial.use();
				tile.buildings.draw();

				const neighbors = this.systemManager.getSystem(TileSystem).getTileNeighbors(tile.x, tile.y);
				neighbors.push(tile);

				this.selectionMaskPass.groundMaterial.uniforms.projectionMatrix.value = this.camera.projectionMatrix;
				this.selectionMaskPass.groundMaterial.use();

				for (const tile of neighbors) {
					if (!tile.ground) {
						continue;
					}

					this.selectionMaskPass.groundMaterial.uniforms.modelViewMatrix.value = Mat4.multiply(this.camera.matrixWorldInverse, tile.ground.matrixWorld);
					this.selectionMaskPass.groundMaterial.updateUniform('modelViewMatrix');
					tile.ground.draw();
				}
			} else {
				picking.clearSelection();
			}
		} else {
			this.selectionMaskPass.clear();
		}

		this.gaussianBlurPass.render(this.quad, this.selectionMaskPass.framebuffer.textures[0]);

		this.renderer.bindFramebuffer(this.ssaoPass.framebuffer);

		this.ssaoPass.material.uniforms.tPosition.value = this.gBuffer.textures.position;
		this.ssaoPass.material.uniforms.tNormal.value = this.gBuffer.textures.normal;
		this.ssaoPass.material.uniforms.cameraProjectionMatrix.value = this.camera.projectionMatrix;
		this.ssaoPass.material.use();
		this.quad.draw();

		this.bilateralBlurPass.render(this.quad, this.ssaoPass.framebuffer.textures[0], this.gBuffer.textures.position);

		this.renderer.bindFramebuffer(this.gBuffer.framebufferHDR);

		this.hdrComposeMaterial.uniforms.viewMatrix.value = this.camera.matrixWorld;
		this.hdrComposeMaterial.uniforms.tObjectOutline.value = this.gaussianBlurPass.framebuffer.textures[0];
		this.hdrComposeMaterial.uniforms.tObjectShape.value = this.selectionMaskPass.framebuffer.textures[0];
		this.hdrComposeMaterial.uniforms.tAmbientOcclusion.value = this.bilateralBlurPass.framebuffer.textures[0];
		this.csm.applyUniformsToMaterial(this.hdrComposeMaterial);
		this.hdrComposeMaterial.use();
		this.quad.draw();

		this.renderer.bindFramebuffer(this.taaPass.framebufferOutput);

		this.taaPass.material.uniforms.tAccum.value = this.taaPass.framebufferAccum.textures[0];
		this.taaPass.material.uniforms.tNew.value = this.gBuffer.framebufferHDR.textures[0];
		this.taaPass.material.uniforms.tMotion.value = this.gBuffer.textures.motion;
		this.taaPass.material.uniforms.ignoreHistory.value = this.frameCount === 0 ? 1 : 0;
		this.taaPass.material.use();
		this.quad.draw();

		this.taaPass.copyOutputToAccum();
		this.taaPass.matrixWorldInversePrev = Mat4.copy(this.camera.matrixWorldInverse);

		this.renderer.bindFramebuffer(this.cocPass.framebuffer);

		this.cocPass.material.uniforms.tPosition.value = this.gBuffer.textures.position;
		this.cocPass.material.uniforms.uFocusPoint.value = this.systemManager.getSystem(ControlsSystem).getCameraRayLength();
		this.cocPass.material.uniforms.uCoCScale.value = Config.DoFCoCScale;
		this.cocPass.material.uniforms.uFocusScale.value = Config.DoFFocusScale;
		this.cocPass.material.use();
		this.quad.draw();

		this.renderer.bindFramebuffer(this.cocTempFilterPass.framebuffer);

		this.cocTempFilterPass.material.uniforms.tCoC.value = this.cocPass.framebuffer.textures[0];
		this.cocTempFilterPass.material.uniforms.tCoCAccum.value = this.cocTempFilterPass.framebufferAccum.textures[0];
		this.cocTempFilterPass.material.uniforms.tMotion.value = this.gBuffer.textures.motion;
		this.cocTempFilterPass.material.use();
		this.quad.draw();

		this.cocTempFilterPass.copyOutputToAccum();

		this.renderer.bindFramebuffer(this.cocDownscalePass.framebuffer);

		this.cocDownscalePass.material.uniforms.tCoC.value = this.cocTempFilterPass.framebuffer.textures[0];
		this.cocDownscalePass.material.uniforms.tColor.value = this.taaPass.framebufferOutput.textures[0];
		this.cocDownscalePass.material.use();
		this.quad.draw();

		this.renderer.bindFramebuffer(this.dofPass.framebuffer);

		this.dofPass.material.uniforms.tCoC.value = this.cocDownscalePass.framebuffer.textures[0];
		this.dofPass.material.uniforms.uBokehRadius.value = Config.DoFBokehRadius;
		this.dofPass.material.use();
		this.quad.draw();

		this.renderer.bindFramebuffer(this.dofTentPass.framebuffer);

		this.dofTentPass.material.uniforms.tMap.value = this.dofPass.framebuffer.textures[0];
		this.dofTentPass.material.use();
		this.quad.draw();

		this.renderer.bindFramebuffer(null);

		this.ldrComposeMaterial.uniforms.tHDR.value = this.taaPass.framebufferOutput.textures[0];
		this.ldrComposeMaterial.uniforms.tDoF.value = this.dofTentPass.framebuffer.textures[0];
		this.ldrComposeMaterial.uniforms.tCoC.value = this.cocTempFilterPass.framebuffer.textures[0];
		this.ldrComposeMaterial.use();
		this.quad.draw();
	}

	private renderShadowMaps() {
		const timeSystem = this.systemManager.getSystem(MapTimeSystem);

		this.csm.direction = timeSystem.lightDirection;
		this.csm.lightIntensity = timeSystem.lightIntensity;
		this.csm.ambientLightIntensity = timeSystem.ambientIntensity;
		this.csm.update();

		for (let i = 0; i < this.csm.lights.length; i++) {
			const directionalShadow = this.csm.lights[i];
			const camera = directionalShadow.camera;

			camera.updateFrustum();

			this.renderer.bindFramebuffer(directionalShadow.framebuffer);

			this.renderer.depthTest = true;
			this.renderer.depthWrite = true;

			this.renderer.clearFramebuffer({
				clearColor: [0, 0, 0, 0],
				depthValue: 1,
				color: true,
				depth: true
			});

			this.groundDepthMaterial.uniforms.projectionMatrix.value = camera.projectionMatrix;
			this.groundDepthMaterial.use();

			const tiles = this.systemManager.getSystem(TileSystem).tiles;

			for (const tile of tiles.values()) {
				if (!tile.ground || !tile.ground.inCameraFrustum(camera)) {
					continue;
				}

				this.groundDepthMaterial.uniforms.modelViewMatrix.value = Mat4.multiply(camera.matrixWorldInverse, tile.ground.matrixWorld);
				this.groundDepthMaterial.updateUniform('modelViewMatrix');

				tile.ground.draw();
			}

			this.buildingDepthMaterial.uniforms.projectionMatrix.value = camera.projectionMatrix;
			this.buildingDepthMaterial.use();

			for (const tile of tiles.values()) {
				if (!tile.buildings || !tile.buildings.inCameraFrustum(camera)) {
					continue;
				}

				this.buildingDepthMaterial.uniforms.modelViewMatrix.value = Mat4.multiply(camera.matrixWorldInverse, tile.buildings.matrixWorld);
				this.buildingDepthMaterial.updateUniform('modelViewMatrix');

				tile.buildings.draw();
			}
		}
	}

	private pickObjectId(): number {
		this.systemManager.getSystem(PickingSystem).readObjectId(this.renderer, this.gBuffer);

		return this.systemManager.getSystem(PickingSystem).selectedObjectId;
	}

	public get resolution(): Vec2 {
		const pixelRatio = Config.IsMobileBrowser ? Math.min(window.devicePixelRatio, 1) : window.devicePixelRatio;
		return new Vec2(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio);
	}
}
