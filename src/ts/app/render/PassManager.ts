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

interface SharedResources {
	BackbufferRenderPass: RenderPassResource;
	GBufferRenderPass: RenderPassResource;
	ShadowMaps: RenderPassResource;
	HDR: RenderPassResource;
	TAAHistory: RenderPassResource;
	HDRAntialiased: RenderPassResource;
	SSAO: RenderPassResource;
	SSAOAccum: RenderPassResource;
	SSAOResult: RenderPassResource;
	SSAOBlurTemp: RenderPassResource;
	SSAOBlurred: RenderPassResource;
	SSAOPrevDepth: RenderPassResource;
	SelectionMask: RenderPassResource;
	SelectionBlurTemp: RenderPassResource;
	SelectionBlurred: RenderPassResource;
}

export default class PassManager {
	public readonly systemManager: SystemManager;
	public readonly resourceFactory: RenderGraphResourceFactory;
	public readonly renderer: AbstractRenderer;
	public readonly renderGraph: RG.RenderGraph;
	public passes: Set<Pass> = new Set();
	private passMap: Map<string, Pass> = new Map();
	public sharedResources: Map<keyof SharedResources, SharedResources[keyof SharedResources]> = new Map();

	public constructor(systemManager: SystemManager, renderer: AbstractRenderer, resourceFactory: RenderGraphResourceFactory, renderGraph: RG.RenderGraph) {
		this.systemManager = systemManager;
		this.renderer = renderer;
		this.resourceFactory = resourceFactory;
		this.renderGraph = renderGraph;

		this.initSharedResources();
	}

	public addPass<T extends Pass>(pass: T): void {
		if (this.passMap.has(pass.name)) {
			throw new Error('Each pass must have a unique name value');
		}

		this.passes.add(pass);
		this.passMap.set(pass.name, pass);
		this.renderGraph.addPass(pass);
	}

	public getPass(passName: string): Pass {
		return this.passMap.get(passName);
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

		this.sharedResources.set('ShadowMaps', this.resourceFactory.createRenderPassResource({
			name: 'ShadowMaps',
			isTransient: true,
			isUsedExternally: false,
			descriptor: new RenderPassResourceDescriptor({
				colorAttachments: [],
				depthAttachment: {
					texture: new TextureResourceDescriptor({
						type: TextureResourceType.Texture2DArray,
						width: 1,
						height: 1,
						depth: 1,
						format: RendererTypes.TextureFormat.Depth32Float,
						minFilter: RendererTypes.MinFilter.Nearest,
						magFilter: RendererTypes.MagFilter.Nearest,
						mipmaps: false
					}),
					slice: 0,
					clearValue: 1,
					loadOp: RendererTypes.AttachmentLoadOp.Clear,
					storeOp: RendererTypes.AttachmentStoreOp.Store
				}
			})
		}));

		this.sharedResources.set('HDR', this.resourceFactory.createRenderPassResource({
			name: 'HDR',
			isTransient: true,
			isUsedExternally: true,
			descriptor: new RenderPassResourceDescriptor({
				colorAttachments: [
					{
						texture: new TextureResourceDescriptor({
							type: TextureResourceType.Texture2D,
							width: this.renderer.resolution.x,
							height: this.renderer.resolution.y,
							format: RendererTypes.TextureFormat.RGBA32Float,
							minFilter: RendererTypes.MinFilter.Linear,
							magFilter: RendererTypes.MagFilter.Linear,
							mipmaps: false
						}),
						clearValue: {r: 0, g: 0, b: 0, a: 1},
						loadOp: RendererTypes.AttachmentLoadOp.Load,
						storeOp: RendererTypes.AttachmentStoreOp.Store
					}
				]
			})
		}));

		this.sharedResources.set('TAAHistory', this.resourceFactory.createRenderPassResource({
			name: 'TAAHistory',
			isTransient: false,
			isUsedExternally: false,
			descriptor: new RenderPassResourceDescriptor({
				colorAttachments: [
					{
						texture: new TextureResourceDescriptor({
							type: TextureResourceType.Texture2D,
							width: this.renderer.resolution.x,
							height: this.renderer.resolution.y,
							format: RendererTypes.TextureFormat.RGBA32Float,
							minFilter: RendererTypes.MinFilter.Linear,
							magFilter: RendererTypes.MagFilter.Linear,
							mipmaps: false
						}),
						clearValue: {r: 0, g: 0, b: 0, a: 1},
						loadOp: RendererTypes.AttachmentLoadOp.Load,
						storeOp: RendererTypes.AttachmentStoreOp.Store
					}
				]
			})
		}));

		this.sharedResources.set('HDRAntialiased', this.resourceFactory.createRenderPassResource({
			name: 'HDRAntialiased',
			isTransient: true,
			isUsedExternally: false,
			descriptor: new RenderPassResourceDescriptor({
				colorAttachments: [
					{
						texture: new TextureResourceDescriptor({
							type: TextureResourceType.Texture2D,
							width: this.renderer.resolution.x,
							height: this.renderer.resolution.y,
							format: RendererTypes.TextureFormat.RGBA32Float,
							minFilter: RendererTypes.MinFilter.Linear,
							magFilter: RendererTypes.MagFilter.Linear,
							mipmaps: false
						}),
						clearValue: {r: 0, g: 0, b: 0, a: 1},
						loadOp: RendererTypes.AttachmentLoadOp.Load,
						storeOp: RendererTypes.AttachmentStoreOp.Store
					}
				]
			})
		}));

		this.sharedResources.set('SSAO', this.resourceFactory.createRenderPassResource({
			name: 'SSAO',
			isTransient: true,
			isUsedExternally: false,
			descriptor: new RenderPassResourceDescriptor({
				colorAttachments: [
					{
						texture: new TextureResourceDescriptor({
							type: TextureResourceType.Texture2D,
							width: Math.floor(this.renderer.resolution.x * 0.5),
							height: Math.floor(this.renderer.resolution.y * 0.5),
							format: RendererTypes.TextureFormat.RGBA8Unorm,
							minFilter: RendererTypes.MinFilter.Linear,
							magFilter: RendererTypes.MagFilter.Linear,
							mipmaps: false
						}),
						clearValue: {r: 0, g: 0, b: 0, a: 1},
						loadOp: RendererTypes.AttachmentLoadOp.Clear,
						storeOp: RendererTypes.AttachmentStoreOp.Store
					}
				]
			})
		}));

		this.sharedResources.set('SSAOBlurTemp', this.resourceFactory.createRenderPassResource({
			name: 'SSAOBlurTemp',
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
						loadOp: RendererTypes.AttachmentLoadOp.Clear,
						storeOp: RendererTypes.AttachmentStoreOp.Store
					}
				]
			})
		}));

		this.sharedResources.set('SSAOBlurred', this.resourceFactory.createRenderPassResource({
			name: 'SSAOBlurred',
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
						loadOp: RendererTypes.AttachmentLoadOp.Clear,
						storeOp: RendererTypes.AttachmentStoreOp.Store
					}
				]
			})
		}));

		this.sharedResources.set('SSAOAccum', this.resourceFactory.createRenderPassResource({
			name: 'SSAOAccum',
			isTransient: false,
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
						loadOp: RendererTypes.AttachmentLoadOp.Clear,
						storeOp: RendererTypes.AttachmentStoreOp.Store
					}
				]
			})
		}));

		this.sharedResources.set('SSAOResult', this.resourceFactory.createRenderPassResource({
			name: 'SSAOResult',
			isTransient: true,
			isUsedExternally: false,
			descriptor: new RenderPassResourceDescriptor({
				colorAttachments: [
					{
						texture: new TextureResourceDescriptor({
							type: TextureResourceType.Texture2D,
							width: this.renderer.resolution.x,
							height: this.renderer.resolution.y,
							format: RendererTypes.TextureFormat.R8Unorm,
							minFilter: RendererTypes.MinFilter.Linear,
							magFilter: RendererTypes.MagFilter.Linear,
							mipmaps: false
						}),
						clearValue: {r: 0, g: 0, b: 0, a: 1},
						loadOp: RendererTypes.AttachmentLoadOp.Clear,
						storeOp: RendererTypes.AttachmentStoreOp.Store
					}
				]
			})
		}));

		this.sharedResources.set('SSAOPrevDepth', this.resourceFactory.createRenderPassResource({
			name: 'SSAOPrevDepth',
			isTransient: false,
			isUsedExternally: false,
			descriptor: new RenderPassResourceDescriptor({
				colorAttachments: [],
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
					clearValue: 0,
					loadOp: RendererTypes.AttachmentLoadOp.Load,
					storeOp: RendererTypes.AttachmentStoreOp.Store
				}
			})
		}));

		this.sharedResources.set('SelectionMask', this.resourceFactory.createRenderPassResource({
			name: 'SelectionMask',
			isTransient: true,
			isUsedExternally: false,
			descriptor: new RenderPassResourceDescriptor({
				colorAttachments: [
					{
						texture: new TextureResourceDescriptor({
							type: TextureResourceType.Texture2D,
							width: this.renderer.resolution.x,
							height: this.renderer.resolution.y,
							format: RendererTypes.TextureFormat.R8Unorm,
							minFilter: RendererTypes.MinFilter.Linear,
							magFilter: RendererTypes.MagFilter.Linear,
							mipmaps: false
						}),
						clearValue: {r: 0, g: 0, b: 0, a: 1},
						loadOp: RendererTypes.AttachmentLoadOp.Clear,
						storeOp: RendererTypes.AttachmentStoreOp.Store
					}
				]
			})
		}));

		this.sharedResources.set('SelectionBlurTemp', this.resourceFactory.createRenderPassResource({
			name: 'SelectionBlurTemp',
			isTransient: true,
			isUsedExternally: false,
			descriptor: new RenderPassResourceDescriptor({
				colorAttachments: [
					{
						texture: new TextureResourceDescriptor({
							type: TextureResourceType.Texture2D,
							width: this.renderer.resolution.x,
							height: this.renderer.resolution.y,
							format: RendererTypes.TextureFormat.R8Unorm,
							minFilter: RendererTypes.MinFilter.Linear,
							magFilter: RendererTypes.MagFilter.Linear,
							mipmaps: false
						}),
						clearValue: {r: 0, g: 0, b: 0, a: 1},
						loadOp: RendererTypes.AttachmentLoadOp.Load,
						storeOp: RendererTypes.AttachmentStoreOp.Store
					}
				]
			})
		}));

		this.sharedResources.set('SelectionBlurred', this.resourceFactory.createRenderPassResource({
			name: 'SelectionBlurred',
			isTransient: true,
			isUsedExternally: false,
			descriptor: new RenderPassResourceDescriptor({
				colorAttachments: [
					{
						texture: new TextureResourceDescriptor({
							type: TextureResourceType.Texture2D,
							width: this.renderer.resolution.x,
							height: this.renderer.resolution.y,
							format: RendererTypes.TextureFormat.R8Unorm,
							minFilter: RendererTypes.MinFilter.Linear,
							magFilter: RendererTypes.MagFilter.Linear,
							mipmaps: false
						}),
						clearValue: {r: 0, g: 0, b: 0, a: 1},
						loadOp: RendererTypes.AttachmentLoadOp.Load,
						storeOp: RendererTypes.AttachmentStoreOp.Store
					}
				]
			})
		}));
	}

	public setSize(width: number, height: number): void {
		const halfWidth = Math.floor(width * 0.5);
		const halfHeight = Math.floor(height * 0.5);

		this.sharedResources.get('GBufferRenderPass').descriptor.setSize(width, height);
		this.sharedResources.get('HDR').descriptor.setSize(width, height);
		this.sharedResources.get('TAAHistory').descriptor.setSize(width, height);
		this.sharedResources.get('HDRAntialiased').descriptor.setSize(width, height);
		this.sharedResources.get('SSAO').descriptor.setSize(halfWidth, halfHeight);
		this.sharedResources.get('SSAOBlurTemp').descriptor.setSize(width, height);
		this.sharedResources.get('SSAOBlurred').descriptor.setSize(width, height);
		this.sharedResources.get('SSAOAccum').descriptor.setSize(width, height);
		this.sharedResources.get('SSAOResult').descriptor.setSize(width, height);
		this.sharedResources.get('SSAOPrevDepth').descriptor.setSize(width, height);
		this.sharedResources.get('SelectionMask').descriptor.setSize(width, height);
		this.sharedResources.get('SelectionBlurTemp').descriptor.setSize(width, height);
		this.sharedResources.get('SelectionBlurred').descriptor.setSize(width, height);
	}
}