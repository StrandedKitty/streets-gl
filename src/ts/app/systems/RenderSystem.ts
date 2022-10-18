import Mat4 from "../../math/Mat4";
import Vec2 from "../../math/Vec2";
import Config from "../Config";
import System from "../System";
import SystemManager from "../SystemManager";
import PickingSystem from "./PickingSystem";
import GBufferPass from "~/app/render/passes/GBufferPass";
import WebGL2Renderer from "../../renderer/webgl2-renderer/WebGL2Renderer";
import AbstractRenderer from "../../renderer/abstract-renderer/AbstractRenderer";
import * as RG from "~/render-graph";
import RenderGraphResourceFactory from "~/app/render/render-graph/RenderGraphResourceFactory";
import PassManager from '~/app/render/PassManager';
import SceneSystem from '~/app/systems/SceneSystem';
import TAAPass from '~/app/render/passes/TAAPass';
import ShadowMappingPass from "~/app/render/passes/ShadowMappingPass";
import ShadingPass from "~/app/render/passes/ShadingPass";
import ScreenPass from "~/app/render/passes/ScreenPass";
import SSAOPass from "~/app/render/passes/SSAOPass";
import SelectionPass from "~/app/render/passes/SelectionPass";
import LabelPass from "~/app/render/passes/LabelPass";
import Tile from "~/app/objects/Tile";
import AtmosphereLUTPass from "~/app/render/passes/AtmosphereLUTPass";
import SSRPass from "~/app/render/passes/SSRPass";
import DoFPass from "~/app/render/passes/DoFPass";

const jitterOffsets: [number, number][] = [
	[-7 / 8, 1 / 8],
	[-5 / 8, -5 / 8],
	[-1 / 8, -3 / 8],
	[3 / 8, -7 / 8],
	[5 / 8, -1 / 8],
	[7 / 8, 7 / 8],
	[1 / 8, 3 / 8],
	[-3 / 8, 5 / 8]
];

export default class RenderSystem extends System {
	public renderer: AbstractRenderer;
	private frameCount = 0;

	private renderGraph: RG.RenderGraph;
	private renderGraphResourceFactory: RenderGraphResourceFactory;
	private passManager: PassManager;

	public constructor(systemManager: SystemManager) {
		super(systemManager);

		this.init();
	}

	private init(): void {
		const canvas = <HTMLCanvasElement>document.getElementById('canvas');

		this.renderer = new WebGL2Renderer(canvas.getContext('webgl2', {powerPreference: "high-performance"}));
		this.renderer.setSize(this.resolutionUI.x, this.resolutionUI.y);

		console.log(`Vendor: ${this.renderer.rendererInfo[0]} \nRenderer: ${this.renderer.rendererInfo[1]}`);

		window.addEventListener('resize', () => this.resize());
	}

	public postInit(): void {
		this.initScene();
	}

	private initScene(): void {
		this.renderGraph = new RG.RenderGraph(this.renderer);
		this.renderGraphResourceFactory = new RenderGraphResourceFactory(this.renderer);
		this.passManager = new PassManager(this.systemManager, this.renderer, this.renderGraphResourceFactory, this.renderGraph);

		this.passManager.addPass(new GBufferPass(this.passManager));
		this.passManager.addPass(new TAAPass(this.passManager));
		this.passManager.addPass(new ShadowMappingPass(this.passManager));
		this.passManager.addPass(new ShadingPass(this.passManager));
		this.passManager.addPass(new ScreenPass(this.passManager));
		this.passManager.addPass(new SSAOPass(this.passManager));
		this.passManager.addPass(new SelectionPass(this.passManager));
		this.passManager.addPass(new LabelPass(this.passManager));
		this.passManager.addPass(new AtmosphereLUTPass(this.passManager));
		this.passManager.addPass(new SSRPass(this.passManager));
		this.passManager.addPass(new DoFPass(this.passManager));
	}

	private resize(): void {
		const {x: widthUI, y: heightUI} = this.resolutionUI;
		const {x: widthScene, y: heightScene} = this.resolutionUI;

		this.renderer.setSize(widthUI, heightUI);
		this.passManager.resize();

		for (const pass of this.passManager.passes) {
			pass.setSize(widthScene, heightScene);
		}
	}

	public update(deltaTime: number): void {
		const sceneSystem = this.systemManager.getSystem(SceneSystem);
		const tiles = sceneSystem.objects.tiles.children as Tile[];

		sceneSystem.objects.labels.updateFromTiles(tiles, sceneSystem.objects.camera, this.resolutionScene);

		for (const object of sceneSystem.getObjectsToUpdateMesh()) {
			object.updateMesh(this.renderer);
		}

		sceneSystem.objects.camera.updateJitteredProjectionMatrix(this.frameCount, this.resolutionScene.x, this.resolutionScene.y);

		this.renderGraph.render();

		this.pickObjectId();

		++this.frameCount;
	}

	public getLastRenderGraph(): Set<RG.Node> {
		return this.renderGraph.lastGraph;
	}

	public getLastRenderGraphPassList(): RG.Pass<any>[] {
		return this.renderGraph.lastSortedPassList;
	}

	/*private updateTiles(): void {
		const tiles = this.systemManager.getSystem(TileSystem).tiles;

		for (const tile of tiles.values()) {
			if (!tile.ground && tile.readyForRendering) {
				//tile.createGround(this.renderer, this.systemManager.getSystem(TileSystem).getTileNeighbors(tile.x, tile.y));
				//tile.generateMeshes(this.renderer);
				//this.wrapper.add(tile);
				this.systemManager.getSystem(SceneSystem).objects.tiles.add(tile);
			}
		}
	}*/

	/*private renderTiles() {
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
	}*/

	private pickObjectId(): number {
		const picking = this.systemManager.getSystem(PickingSystem);
		const pass = <GBufferPass>this.passManager.getPass('GBufferPass');

		pass.objectIdX = picking.pointerPosition.x;
		pass.objectIdY = picking.pointerPosition.y;

		this.systemManager.getSystem(PickingSystem).readObjectId(pass.objectIdBuffer);

		return this.systemManager.getSystem(PickingSystem).selectedObjectId;
	}

	public get resolutionUI(): Vec2 {
		const pixelRatio = window.devicePixelRatio;
		return new Vec2(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio);
	}

	public get resolutionScene(): Vec2 {
		const pixelRatio = 1;
		return new Vec2(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio);
	}
}
