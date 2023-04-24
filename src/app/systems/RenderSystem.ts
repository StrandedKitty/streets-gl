import Vec2 from "~/lib/math/Vec2";
import System from "../System";
import PickingSystem from "./PickingSystem";
import GBufferPass from "../render/passes/GBufferPass";
import WebGL2Renderer from "~/lib/renderer/webgl2-renderer/WebGL2Renderer";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import * as RG from "~/lib/render-graph";
import RenderGraphResourceFactory from "../render/render-graph/RenderGraphResourceFactory";
import PassManager from '../render/PassManager';
import SceneSystem from './SceneSystem';
import TAAPass from '../render/passes/TAAPass';
import ShadowMappingPass from "../render/passes/ShadowMappingPass";
import ShadingPass from "../render/passes/ShadingPass";
import ScreenPass from "../render/passes/ScreenPass";
import SSAOPass from "../render/passes/SSAOPass";
import SelectionPass from "../render/passes/SelectionPass";
import LabelPass from "../render/passes/LabelPass";
import AtmosphereLUTPass from "../render/passes/AtmosphereLUTPass";
import SSRPass from "../render/passes/SSRPass";
import DoFPass from "../render/passes/DoFPass";
import TerrainTexturesPass from "../render/passes/TerrainTexturesPass";
import BloomPass from "../render/passes/BloomPass";
import FullScreenTriangle from "../objects/FullScreenTriangle";
import Node from "../../lib/render-graph/Node";
import SettingsSystem from "~/app/systems/SettingsSystem";
import SlippyMapPass from "~/app/render/passes/SlippyMapPass";
import AbstractTexture2D from "~/lib/renderer/abstract-renderer/AbstractTexture2D";
import ResourceLoader from "~/app/world/ResourceLoader";
import {RendererTypes} from "~/lib/renderer/RendererTypes";

export default class RenderSystem extends System {
	private renderer: AbstractRenderer;
	private frameCount: number = 0;

	private renderGraph: RG.RenderGraph;
	private renderGraphResourceFactory: RenderGraphResourceFactory;
	private passManager: PassManager;
	public fullScreenTriangle: FullScreenTriangle;

	public postInit(): void {
		const canvas = <HTMLCanvasElement>document.getElementById('canvas');

		this.renderer = new WebGL2Renderer(canvas.getContext('webgl2', {powerPreference: "high-performance"}));
		this.renderer.setSize(this.resolutionUI.x, this.resolutionUI.y);

		console.log(`Vendor: ${this.renderer.rendererInfo[0]} \nRenderer: ${this.renderer.rendererInfo[1]}`);

		window.addEventListener('resize', () => this.resize());

		this.initScene();
	}

	private initScene(): void {
		this.fullScreenTriangle = new FullScreenTriangle(this.renderer);

		this.renderGraph = new RG.RenderGraph();
		this.renderGraphResourceFactory = new RenderGraphResourceFactory(this.renderer);
		this.passManager = new PassManager(
			this.systemManager,
			this.renderer,
			this.renderGraphResourceFactory,
			this.renderGraph,
			this.systemManager.getSystem(SettingsSystem).settings
		);

		this.passManager.addPasses(
			new GBufferPass(this.passManager),
			new TAAPass(this.passManager),
			new ShadowMappingPass(this.passManager),
			new ShadingPass(this.passManager),
			new ScreenPass(this.passManager),
			new SSAOPass(this.passManager),
			new SelectionPass(this.passManager),
			new LabelPass(this.passManager),
			new AtmosphereLUTPass(this.passManager),
			new SSRPass(this.passManager),
			new DoFPass(this.passManager),
			new BloomPass(this.passManager),
			new TerrainTexturesPass(this.passManager),
			new SlippyMapPass(this.passManager)
		);

		this.passManager.listenToSettings();
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
		const settings = this.systemManager.getSystem(SettingsSystem).settings;
		const sceneSystem = this.systemManager.getSystem(SceneSystem);
		const tiles = sceneSystem.objects.tiles;

		if (settings.get('labels').statusValue === 'on') {
			sceneSystem.objects.labels.updateFromTiles(tiles, sceneSystem.objects.camera, this.resolutionScene);
		}

		for (const object of sceneSystem.getObjectsToUpdateMesh()) {
			object.updateMesh(this.renderer);
		}

		const jitterFactor = settings.get('taa').statusValue === 'on' ? 1 : 0;

		sceneSystem.objects.camera.updateJitteredProjectionMatrix(
			this.frameCount,
			this.resolutionScene.x,
			this.resolutionScene.y,
			jitterFactor
		);

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

	public getRenderGraphNodeConnectionSets(): {
		indegree: Map<Node, Set<Node>>;
		outdegree: Map<Node, Set<Node>>;
	} {
		return {
			indegree: this.renderGraph.indegreeSets,
			outdegree: this.renderGraph.outdegreeSets
		};
	}

	public createTileTexture(image: HTMLImageElement, width: number, height: number): AbstractTexture2D {
		return this.renderer.createTexture2D({
			width: width,
			height: height,
			data: image,
			minFilter: RendererTypes.MinFilter.Linear,
			magFilter: RendererTypes.MagFilter.Linear,
			wrap: RendererTypes.TextureWrap.ClampToEdge,
			format: RendererTypes.TextureFormat.RGBA8Unorm,
			mipmaps: false,
			flipY: true
		});
	}

	private pickObjectId(): void {
		const picking = this.systemManager.getSystem(PickingSystem);
		const pass = <GBufferPass>this.passManager.getPass('GBufferPass');

		if (!pass) {
			return;
		}

		pass.objectIdX = picking.pointerPosition.x;
		pass.objectIdY = picking.pointerPosition.y;

		this.systemManager.getSystem(PickingSystem).readObjectId(pass.objectIdBuffer);
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
