import RenderGraphResourceFactory from '~/app/render/render-graph/RenderGraphResourceFactory';
import Pass from '~/app/render/passes/Pass';
import AbstractRenderer from '~/renderer/abstract-renderer/AbstractRenderer';
import RenderPassResource from '~/app/render/render-graph/resources/RenderPassResource';
import RenderPassResourceDescriptor from '~/app/render/render-graph/resource-descriptors/RenderPassResourceDescriptor';
import TextureResourceDescriptor, {TextureResourceType} from '~/app/render/render-graph/resource-descriptors/TextureResourceDescriptor';
import {RendererTypes} from '~/renderer/RendererTypes';
import SystemManager from '~/app/SystemManager';
import SceneSystem from '~/app/systems/SceneSystem';
import * as RG from '~/render-graph';

type PassConstructor<T> = { new(manager: PassManager): T };

type SharedResources = {
	BackbufferRenderPass: RenderPassResource;
	GBufferRenderPass: RenderPassResource;
};

export default class PassManager {
	public readonly systemManager: SystemManager;
	public readonly resourceFactory: RenderGraphResourceFactory;
	public readonly renderer: AbstractRenderer;
	public readonly renderGraph: RG.RenderGraph;
	public passes: Set<Pass> = new Set();
	private passMap: Map<{ new(manager: PassManager): Pass }, Pass> = new Map();
	public sharedResources: Map<keyof SharedResources, SharedResources[keyof SharedResources]> = new Map();

	public constructor(systemManager: SystemManager, renderer: AbstractRenderer, resourceFactory: RenderGraphResourceFactory, renderGraph: RG.RenderGraph) {
		this.systemManager = systemManager;
		this.renderer = renderer;
		this.resourceFactory = resourceFactory;
		this.renderGraph = renderGraph;

		this.initSharedResources();
	}

	public addPass<T extends Pass>(passConstructor: PassConstructor<T>): void {
		const pass = new passConstructor(this);

		this.passes.add(pass);
		this.passMap.set(passConstructor, pass);
		this.renderGraph.addPass(pass);
	}

	public getPass<T extends Pass>(passConstructor: PassConstructor<T>): T {
		return <T>this.passMap.get(passConstructor);
	}

	public getSharedResource<K extends keyof SharedResources>(name: K): SharedResources[K] {
		return this.sharedResources.get(name);
	}

	public get sceneSystem(): SceneSystem {
		return this.systemManager.getSystem(SceneSystem);
	}

	private initSharedResources(): void {
		this.sharedResources.set('BackbufferRenderPass', this.resourceFactory.createRenderPassResource({
			name: 'BackbufferRenderPass',
			isTransient: true,
			isUsedExternally: true,
			descriptor: new RenderPassResourceDescriptor({
				colorAttachments: []
			})
		}));

		this.sharedResources.set('GBufferRenderPass', this.resourceFactory.createRenderPassResource({
			name: 'GBufferRenderPass',
			isTransient: true,
			isUsedExternally: false,
			descriptor: new RenderPassResourceDescriptor({
				colorAttachments: [
					{
						texture: new TextureResourceDescriptor({
							type: TextureResourceType.Texture2D,
							width: this.renderer.resolution.x,
							height: this.renderer.resolution.y,
							format: RendererTypes.TextureFormat.RGBA8Unorm,
							minFilter: RendererTypes.MinFilter.Linear,
							magFilter: RendererTypes.MagFilter.Linear,
							mipmaps: false
						}),
						clearValue: {r: 0, g: 0, b: 0, a: 1},
						loadOp: RendererTypes.AttachmentLoadOp.Load,
						storeOp: RendererTypes.AttachmentStoreOp.Store
					}, {
						texture: new TextureResourceDescriptor({
							type: TextureResourceType.Texture2D,
							width: this.renderer.resolution.x,
							height: this.renderer.resolution.y,
							format: RendererTypes.TextureFormat.RGB8Unorm,
							minFilter: RendererTypes.MinFilter.Linear,
							magFilter: RendererTypes.MagFilter.Linear,
							mipmaps: false
						}),
						clearValue: {r: 0, g: 0, b: 0, a: 1},
						loadOp: RendererTypes.AttachmentLoadOp.Load,
						storeOp: RendererTypes.AttachmentStoreOp.Store
					}, {
						texture: new TextureResourceDescriptor({
							type: TextureResourceType.Texture2D,
							width: this.renderer.resolution.x,
							height: this.renderer.resolution.y,
							format: RendererTypes.TextureFormat.RGBA32Float,
							minFilter: RendererTypes.MinFilter.Linear,
							magFilter: RendererTypes.MagFilter.Linear,
							mipmaps: false
						}),
						clearValue: {r: 0, g: 0, b: 0, a: 0},
						loadOp: RendererTypes.AttachmentLoadOp.Load,
						storeOp: RendererTypes.AttachmentStoreOp.Store
					}, {
						texture: new TextureResourceDescriptor({
							type: TextureResourceType.Texture2D,
							width: this.renderer.resolution.x,
							height: this.renderer.resolution.y,
							format: RendererTypes.TextureFormat.RGBA32Float,
							minFilter: RendererTypes.MinFilter.Linear,
							magFilter: RendererTypes.MagFilter.Linear,
							mipmaps: false
						}),
						clearValue: {r: 0, g: 0, b: 0, a: 0},
						loadOp: RendererTypes.AttachmentLoadOp.Load,
						storeOp: RendererTypes.AttachmentStoreOp.Store
					}, {
						texture: new TextureResourceDescriptor({
							type: TextureResourceType.Texture2D,
							width: this.renderer.resolution.x,
							height: this.renderer.resolution.y,
							format: RendererTypes.TextureFormat.R32Uint,
							minFilter: RendererTypes.MinFilter.Nearest,
							magFilter: RendererTypes.MagFilter.Nearest,
							mipmaps: false
						}),
						clearValue: {r: 0, g: 0, b: 0, a: 0},
						loadOp: RendererTypes.AttachmentLoadOp.Load,
						storeOp: RendererTypes.AttachmentStoreOp.Store
					}
				],
				depthAttachment: {
					texture: new TextureResourceDescriptor({
						type: TextureResourceType.Texture2D,
						width: this.renderer.resolution.x,
						height: this.renderer.resolution.y,
						format: RendererTypes.TextureFormat.Depth32Float,
						minFilter: RendererTypes.MinFilter.Nearest,
						magFilter: RendererTypes.MagFilter.Nearest,
						mipmaps: false
					}),
					clearValue: 1,
					loadOp: RendererTypes.AttachmentLoadOp.Clear,
					storeOp: RendererTypes.AttachmentStoreOp.Store
				}
			})
		}));
	}
}