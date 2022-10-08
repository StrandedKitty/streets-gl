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
import RenderSystem from "~/app/systems/RenderSystem";
import Vec2 from "~/math/Vec2";
import MapTimeSystem from "~/app/systems/MapTimeSystem";

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
	Labels: RenderPassResource;
	AtmosphereTransmittanceLUT: RenderPassResource;
	AtmosphereMultipleScatteringLUT: RenderPassResource;
	SkyViewLUT: RenderPassResource;
	AerialPerspectiveLUT: RenderPassResource;
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
		this.resize();
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

	public get renderSystem(): RenderSystem {
		return this.systemManager.getSystem(RenderSystem);
	}

	public get mapTimeSystem(): MapTimeSystem {
		return this.systemManager.getSystem(MapTimeSystem);
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
							width: 1,
							height: 1,
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
							width: 1,
							height: 1,
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
							width: 1,
							height: 1,
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
							width: 1,
							height: 1,
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
							width: 1,
							height: 1,
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
						width: 1,
						height: 1,
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
							width: 1,
							height: 1,
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
							width: 1,
							height: 1,
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
							width: 1,
							height: 1,
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
							width: 1,
							height: 1,
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
							width: 1,
							height: 1,
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
							width: 1,
							height: 1,
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
							width: 1,
							height: 1,
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
							width: 1,
							height: 1,
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
						width: 1,
						height: 1,
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
							width: 1,
							height: 1,
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
							width: 1,
							height: 1,
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
							width: 1,
							height: 1,
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

		this.sharedResources.set('Labels', this.resourceFactory.createRenderPassResource({
			name: 'Labels',
			isTransient: true,
			isUsedExternally: false,
			descriptor: new RenderPassResourceDescriptor({
				colorAttachments: [
					{
						texture: new TextureResourceDescriptor({
							type: TextureResourceType.Texture2D,
							width: 1,
							height: 1,
							format: RendererTypes.TextureFormat.RGBA8Unorm,
							minFilter: RendererTypes.MinFilter.Linear,
							magFilter: RendererTypes.MagFilter.Linear,
							mipmaps: false
						}),
						clearValue: {r: 0, g: 0, b: 0, a: 0},
						loadOp: RendererTypes.AttachmentLoadOp.Clear,
						storeOp: RendererTypes.AttachmentStoreOp.Store
					}
				]
			})
		}));
		this.sharedResources.set('AtmosphereTransmittanceLUT', this.resourceFactory.createRenderPassResource({
			name: 'AtmosphereTransmittanceLUT',
			isTransient: false,
			isUsedExternally: false,
			descriptor: new RenderPassResourceDescriptor({
				colorAttachments: [
					{
						texture: new TextureResourceDescriptor({
							type: TextureResourceType.Texture2D,
							width: 256,
							height: 64,
							format: RendererTypes.TextureFormat.RGBA32Float,
							minFilter: RendererTypes.MinFilter.Linear,
							magFilter: RendererTypes.MagFilter.Linear,
							mipmaps: false
						}),
						clearValue: {r: 0, g: 0, b: 0, a: 0},
						loadOp: RendererTypes.AttachmentLoadOp.Load,
						storeOp: RendererTypes.AttachmentStoreOp.Store
					}
				]
			})
		}));
		this.sharedResources.set('AtmosphereMultipleScatteringLUT', this.resourceFactory.createRenderPassResource({
			name: 'AtmosphereMultipleScatteringLUT',
			isTransient: false,
			isUsedExternally: false,
			descriptor: new RenderPassResourceDescriptor({
				colorAttachments: [
					{
						texture: new TextureResourceDescriptor({
							type: TextureResourceType.Texture2D,
							width: 32,
							height: 32,
							format: RendererTypes.TextureFormat.RGBA32Float,
							minFilter: RendererTypes.MinFilter.Linear,
							magFilter: RendererTypes.MagFilter.Linear,
							mipmaps: false
						}),
						clearValue: {r: 0, g: 0, b: 0, a: 0},
						loadOp: RendererTypes.AttachmentLoadOp.Load,
						storeOp: RendererTypes.AttachmentStoreOp.Store
					}
				]
			})
		}));
		this.sharedResources.set('SkyViewLUT', this.resourceFactory.createRenderPassResource({
			name: 'SkyViewLUT',
			isTransient: false,
			isUsedExternally: false,
			descriptor: new RenderPassResourceDescriptor({
				colorAttachments: [
					{
						texture: new TextureResourceDescriptor({
							type: TextureResourceType.Texture2D,
							width: 64,
							height: 256,
							format: RendererTypes.TextureFormat.RGBA32Float,
							minFilter: RendererTypes.MinFilter.Linear,
							magFilter: RendererTypes.MagFilter.Linear,
							mipmaps: false,
							wrap: RendererTypes.TextureWrap.Repeat
						}),
						clearValue: {r: 0, g: 0, b: 0, a: 0},
						loadOp: RendererTypes.AttachmentLoadOp.Load,
						storeOp: RendererTypes.AttachmentStoreOp.Store
					}
				]
			})
		}));
		this.sharedResources.set('AerialPerspectiveLUT', this.resourceFactory.createRenderPassResource({
			name: 'AerialPerspectiveLUT',
			isTransient: false,
			isUsedExternally: false,
			descriptor: new RenderPassResourceDescriptor({
				colorAttachments: [
					{
						texture: new TextureResourceDescriptor({
							type: TextureResourceType.Texture3D,
							width: 16,
							height: 16,
							depth: 16,
							format: RendererTypes.TextureFormat.RGBA32Float,
							minFilter: RendererTypes.MinFilter.Linear,
							magFilter: RendererTypes.MagFilter.Linear,
							mipmaps: false,
							wrap: RendererTypes.TextureWrap.ClampToEdge
						}),
						clearValue: {r: 0, g: 0, b: 0, a: 0},
						loadOp: RendererTypes.AttachmentLoadOp.Load,
						storeOp: RendererTypes.AttachmentStoreOp.Store,
						slice: 0
					}
				]
			})
		}));
	}

	public resize(): void {
		const render = this.renderSystem;
		const resolutionScene = render.resolutionScene;
		const resolutionUI = render.resolutionUI;
		const resolutionSceneHalf = new Vec2(Math.floor(resolutionScene.x * 0.5), Math.floor(resolutionScene.y * 0.5));

		this.sharedResources.get('GBufferRenderPass').descriptor.setSize(resolutionScene.x, resolutionScene.y);
		this.sharedResources.get('HDR').descriptor.setSize(resolutionScene.x, resolutionScene.y);
		this.sharedResources.get('TAAHistory').descriptor.setSize(resolutionScene.x, resolutionScene.y);
		this.sharedResources.get('HDRAntialiased').descriptor.setSize(resolutionScene.x, resolutionScene.y);
		this.sharedResources.get('SSAO').descriptor.setSize(resolutionSceneHalf.x, resolutionSceneHalf.y);
		this.sharedResources.get('SSAOBlurTemp').descriptor.setSize(resolutionScene.x, resolutionScene.y);
		this.sharedResources.get('SSAOBlurred').descriptor.setSize(resolutionScene.x, resolutionScene.y);
		this.sharedResources.get('SSAOAccum').descriptor.setSize(resolutionScene.x, resolutionScene.y);
		this.sharedResources.get('SSAOResult').descriptor.setSize(resolutionScene.x, resolutionScene.y);
		this.sharedResources.get('SSAOPrevDepth').descriptor.setSize(resolutionScene.x, resolutionScene.y);
		this.sharedResources.get('SelectionMask').descriptor.setSize(resolutionScene.x, resolutionScene.y);
		this.sharedResources.get('SelectionBlurTemp').descriptor.setSize(resolutionScene.x, resolutionScene.y);
		this.sharedResources.get('SelectionBlurred').descriptor.setSize(resolutionScene.x, resolutionScene.y);
		this.sharedResources.get('Labels').descriptor.setSize(resolutionUI.x, resolutionUI.y);
	}
}