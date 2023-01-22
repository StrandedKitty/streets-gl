import Vec2 from "~/lib/math/Vec2";
import System from "../System";
import SystemManager from "../SystemManager";
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
import Tile from "../objects/Tile";
import AtmosphereLUTPass from "../render/passes/AtmosphereLUTPass";
import SSRPass from "../render/passes/SSRPass";
import DoFPass from "../render/passes/DoFPass";
import TerrainTexturesPass from "../render/passes/TerrainTexturesPass";
import BloomPass from "../render/passes/BloomPass";
import SettingsManager from "../ui/SettingsManager";
import FullScreenTriangle from "../objects/FullScreenTriangle";
import Node from "../../lib/render-graph/Node";

export default class RenderSystem extends System {
	private renderer: AbstractRenderer;
	private frameCount: number = 0;

	private renderGraph: RG.RenderGraph;
	private renderGraphResourceFactory: RenderGraphResourceFactory;
	private passManager: PassManager;
	public fullScreenTriangle: FullScreenTriangle;

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
		this.fullScreenTriangle = new FullScreenTriangle(this.renderer);

		this.renderGraph = new RG.RenderGraph();
		this.renderGraphResourceFactory = new RenderGraphResourceFactory(this.renderer);
		this.passManager = new PassManager(this.systemManager, this.renderer, this.renderGraphResourceFactory, this.renderGraph);

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
			new TerrainTexturesPass(this.passManager)
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
		const sceneSystem = this.systemManager.getSystem(SceneSystem);
		const tiles = sceneSystem.objects.tiles.children as Tile[];

		if (SettingsManager.getSetting('labels').statusValue === 'on') {
			sceneSystem.objects.labels.updateFromTiles(tiles, sceneSystem.objects.camera, this.resolutionScene);
		}

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

	public getRenderGraphNodeConnectionSets(): {
		indegree: Map<Node, Set<Node>>;
		outdegree: Map<Node, Set<Node>>;
	} {
		return {
			indegree: this.renderGraph.indegreeSets,
			outdegree: this.renderGraph.outdegreeSets
		};
	}

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
