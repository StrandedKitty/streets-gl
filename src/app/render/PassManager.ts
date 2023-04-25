import RenderGraphResourceFactory from './render-graph/RenderGraphResourceFactory';
import Pass from './passes/Pass';
import AbstractRenderer from '~/lib/renderer/abstract-renderer/AbstractRenderer';
import RenderPassResource from './render-graph/resources/RenderPassResource';
import RenderPassResourceDescriptor from './render-graph/resource-descriptors/RenderPassResourceDescriptor';
import TextureResourceDescriptor, {
	TextureResourceType
} from './render-graph/resource-descriptors/TextureResourceDescriptor';
import {RendererTypes} from '~/lib/renderer/RendererTypes';
import SystemManager from '../SystemManager';
import SceneSystem from '../systems/SceneSystem';
import * as RG from '~/lib/render-graph';
import RenderSystem from "../systems/RenderSystem";
import Vec2 from "~/lib/math/Vec2";
import MapTimeSystem from "../systems/MapTimeSystem";
import Config from "../Config";
import TextureResource from "./render-graph/resources/TextureResource";
import SettingsContainer from "~/app/settings/SettingsContainer";
import SettingsSystem from "~/app/systems/SettingsSystem";
import TexturePool from "~/app/render/TexturePool";

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
	AerialPerspectiveLUT: TextureResource;
	SSR: RenderPassResource;
	AtmosphereSkybox: RenderPassResource;
	CoC: RenderPassResource;
	CoCHistory: RenderPassResource;
	CoCAntialiased: RenderPassResource;
	CoCWithColorDownscaled: RenderPassResource;
	DoFRaw: RenderPassResource;
	DoFBlurred: RenderPassResource;
	DoF: RenderPassResource;
	TerrainHeight: RenderPassResource;
	TerrainNormal: RenderPassResource;
	TerrainWater: RenderPassResource;
	TerrainTileMask: RenderPassResource;
	TerrainRingHeight: RenderPassResource;
	BloomHighLuminosity: RenderPassResource;
	Bloom: RenderPassResource;
	SlippyMap: RenderPassResource;
}

interface SharedResourcesMap {
	set<K extends keyof SharedResources>(key: K, value: SharedResources[K]): this;

	get<K extends keyof SharedResources>(key: K): SharedResources[K];
}

export default class PassManager {
	public readonly systemManager: SystemManager;
	public readonly resourceFactory: RenderGraphResourceFactory;
	public readonly renderer: AbstractRenderer;
	public readonly renderGraph: RG.RenderGraph;
	public readonly settings: SettingsContainer;
	public readonly passes: Set<Pass> = new Set();
	public readonly texturePool: TexturePool;
	private readonly passMap: Map<string, Pass> = new Map();
	private readonly sharedResources: SharedResourcesMap = new Map();

	public constructor(
		systemManager: SystemManager,
		renderer: AbstractRenderer,
		resourceFactory: RenderGraphResourceFactory,
		renderGraph: RG.RenderGraph,
		settings: SettingsContainer
	) {
		this.systemManager = systemManager;
		this.renderer = renderer;
		this.resourceFactory = resourceFactory;
		this.renderGraph = renderGraph;
		this.settings = settings;
		this.texturePool = new TexturePool(renderer);

		this.initSharedResources();
		this.resize();
	}

	public addPasses(...passes: Pass[]): void {
		for (const pass of passes) {
			if (this.passMap.has(pass.name)) {
				throw new Error('Each pass must have a unique name value');
			}

			this.passes.add(pass);
			this.passMap.set(pass.name, pass);
			this.renderGraph.addPass(pass);
		}
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

	public listenToSettings(): void {
		const settings = this.systemManager.getSystem(SettingsSystem).settings;

		const updateDoFBloomTAA = (): void => {
			const taaEnabled = settings.get('taa').statusValue !== 'off';
			const dofEnabled = settings.get('dof').statusValue !== 'off';
			const bloomEnabled = settings.get('bloom').statusValue !== 'off';
			let screenPassHDRResource: RenderPassResource;
			let bloomPassColorResource: RenderPassResource;

			if (bloomEnabled) {
				screenPassHDRResource = this.getSharedResource('Bloom');
			} else if (dofEnabled) {
				screenPassHDRResource = this.getSharedResource('DoF');
			} else if (taaEnabled) {
				screenPassHDRResource = this.getSharedResource('HDRAntialiased');
			} else {
				screenPassHDRResource = this.getSharedResource('HDR');
			}

			if (dofEnabled) {
				bloomPassColorResource = this.getSharedResource('DoF');
			} else if (taaEnabled) {
				bloomPassColorResource = this.getSharedResource('HDRAntialiased');
			} else {
				bloomPassColorResource = this.getSharedResource('HDR');
			}

			this.getPass('ScreenPass').setResource('HDR', screenPassHDRResource);
			this.getPass('BloomPass').setResource('Color', bloomPassColorResource);
		};

		settings.onChange('ssao', ({statusValue}) => {
			const shadingPassSSAOResource = statusValue === 'on' ? this.getSharedResource('SSAOResult') : null;
			this.getPass('ShadingPass').setResource('SSAO', shadingPassSSAOResource);
		}, true);
		settings.onChange('shadows', ({statusValue}) => {
			const shadingPassShadowMapsResource = statusValue !== 'off' ? this.getSharedResource('ShadowMaps') : null;
			this.getPass('ShadingPass').setResource('ShadowMaps', shadingPassShadowMapsResource);
		}, true);
		settings.onChange('dof', () => {
			updateDoFBloomTAA();
		}, true);
		settings.onChange('bloom', () => {
			updateDoFBloomTAA();
		}, true);
		settings.onChange('taa', () => {
			updateDoFBloomTAA();
		}, true);
		settings.onChange('ssr', ({statusValue}) => {
			const shadingPassSSRResource = statusValue !== 'off' ? this.getSharedResource('SSR') : null;
			this.getPass('ShadingPass').setResource('SSR', shadingPassSSRResource);

			this.getSharedResource('SSR').isUsedExternally = statusValue !== 'off';
		}, true);
		settings.onChange('labels', ({statusValue}) => {
			const screenPassLabels = statusValue === 'on' ? this.getSharedResource('Labels') : null;
			this.getPass('ScreenPass').setResource('Labels', screenPassLabels);
		}, true);
	}

	private initSharedResources(): void {
		const resourcesList: SharedResources = {
			BackbufferRenderPass: this.resourceFactory.createRenderPassResource({
				name: 'BackbufferRenderPass',
				isTransient: true,
				isUsedExternally: true,
				descriptor: new RenderPassResourceDescriptor({
					colorAttachments: []
				})
			}),
			GBufferRenderPass: this.resourceFactory.createRenderPassResource({
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
								format: RendererTypes.TextureFormat.RGBA16Float,
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
								format: RendererTypes.TextureFormat.RGBA8Unorm,
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
								format: RendererTypes.TextureFormat.RGBA16Float,
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
						}, {
							texture: new TextureResourceDescriptor({
								type: TextureResourceType.Texture2D,
								width: 1,
								height: 1,
								format: RendererTypes.TextureFormat.RGB8Unorm,
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
			}),
			ShadowMaps: this.resourceFactory.createRenderPassResource({
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
			}),
			HDR: this.resourceFactory.createRenderPassResource({
				name: 'HDR',
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
			}),
			TAAHistory: this.resourceFactory.createRenderPassResource({
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
			}),
			HDRAntialiased: this.resourceFactory.createRenderPassResource({
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
			}),
			SSAO: this.resourceFactory.createRenderPassResource({
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
			}),
			SSAOBlurTemp: this.resourceFactory.createRenderPassResource({
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
			}),
			SSAOBlurred: this.resourceFactory.createRenderPassResource({
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
			}),
			SSAOAccum: this.resourceFactory.createRenderPassResource({
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
			}),
			SSAOResult: this.resourceFactory.createRenderPassResource({
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
			}),
			SSAOPrevDepth: this.resourceFactory.createRenderPassResource({
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
			}),
			SelectionMask: this.resourceFactory.createRenderPassResource({
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
			}),
			SelectionBlurTemp: this.resourceFactory.createRenderPassResource({
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
			}),
			SelectionBlurred: this.resourceFactory.createRenderPassResource({
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
			}),
			Labels: this.resourceFactory.createRenderPassResource({
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
			}),
			AtmosphereTransmittanceLUT: this.resourceFactory.createRenderPassResource({
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
								format: RendererTypes.TextureFormat.RGBA16Float,
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
			}),
			AtmosphereMultipleScatteringLUT: this.resourceFactory.createRenderPassResource({
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
								format: RendererTypes.TextureFormat.RGBA16Float,
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
			}),
			SkyViewLUT: this.resourceFactory.createRenderPassResource({
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
								format: RendererTypes.TextureFormat.RGBA16Float,
								minFilter: RendererTypes.MinFilter.Linear,
								magFilter: RendererTypes.MagFilter.Linear,
								mipmaps: false,
								wrapS: RendererTypes.TextureWrap.Repeat,
								wrapT: RendererTypes.TextureWrap.ClampToEdge
							}),
							clearValue: {r: 0, g: 0, b: 0, a: 0},
							loadOp: RendererTypes.AttachmentLoadOp.Load,
							storeOp: RendererTypes.AttachmentStoreOp.Store
						}
					]
				})
			}),
			AerialPerspectiveLUT: this.resourceFactory.createTextureResource({
				name: 'AerialPerspectiveLUT',
				isTransient: false,
				isUsedExternally: false,
				descriptor: new TextureResourceDescriptor({
					type: TextureResourceType.Texture3D,
					width: 16,
					height: 16,
					depth: 16,
					format: RendererTypes.TextureFormat.RGBA16Float,
					minFilter: RendererTypes.MinFilter.Linear,
					magFilter: RendererTypes.MagFilter.Linear,
					mipmaps: false,
					wrap: RendererTypes.TextureWrap.ClampToEdge
				})
			}),
			AtmosphereSkybox: this.resourceFactory.createRenderPassResource({
				name: 'AtmosphereSkybox',
				isTransient: false,
				isUsedExternally: false,
				descriptor: new RenderPassResourceDescriptor({
					colorAttachments: [
						{
							texture: new TextureResourceDescriptor({
								type: TextureResourceType.TextureCube,
								width: 512,
								height: 512,
								format: RendererTypes.TextureFormat.RGBA16Float,
								minFilter: RendererTypes.MinFilter.LinearMipmapLinear,
								magFilter: RendererTypes.MagFilter.Linear,
								mipmaps: true
							}),
							clearValue: {r: 0, g: 0, b: 0, a: 1},
							loadOp: RendererTypes.AttachmentLoadOp.Load,
							storeOp: RendererTypes.AttachmentStoreOp.Store
						}
					]
				})
			}),
			SSR: this.resourceFactory.createRenderPassResource({
				name: 'SSR',
				isTransient: false,
				isUsedExternally: true,
				descriptor: new RenderPassResourceDescriptor({
					colorAttachments: [
						{
							texture: new TextureResourceDescriptor({
								type: TextureResourceType.Texture2D,
								width: 1,
								height: 1,
								format: RendererTypes.TextureFormat.RGBA16Float,
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
			}),
			CoC: this.resourceFactory.createRenderPassResource({
				name: 'CoC',
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
							clearValue: {r: 0, g: 0, b: 0, a: 0},
							loadOp: RendererTypes.AttachmentLoadOp.Load,
							storeOp: RendererTypes.AttachmentStoreOp.Store
						}
					]
				})
			}),
			CoCHistory: this.resourceFactory.createRenderPassResource({
				name: 'CoCHistory',
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
							clearValue: {r: 0, g: 0, b: 0, a: 0},
							loadOp: RendererTypes.AttachmentLoadOp.Load,
							storeOp: RendererTypes.AttachmentStoreOp.Store
						}
					]
				})
			}),
			CoCAntialiased: this.resourceFactory.createRenderPassResource({
				name: 'CoCAntialiased',
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
							clearValue: {r: 0, g: 0, b: 0, a: 0},
							loadOp: RendererTypes.AttachmentLoadOp.Load,
							storeOp: RendererTypes.AttachmentStoreOp.Store
						}
					]
				})
			}),
			CoCWithColorDownscaled: this.resourceFactory.createRenderPassResource({
				name: 'CoCWithColorDownscaled',
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
							clearValue: {r: 0, g: 0, b: 0, a: 0},
							loadOp: RendererTypes.AttachmentLoadOp.Load,
							storeOp: RendererTypes.AttachmentStoreOp.Store
						}
					]
				})
			}),
			DoFRaw: this.resourceFactory.createRenderPassResource({
				name: 'DoFRaw',
				isTransient: true,
				isUsedExternally: false,
				descriptor: new RenderPassResourceDescriptor({
					colorAttachments: [
						{
							texture: new TextureResourceDescriptor({
								type: TextureResourceType.Texture2D,
								width: 1,
								height: 1,
								format: RendererTypes.TextureFormat.RGBA16Float,
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
			}),
			DoFBlurred: this.resourceFactory.createRenderPassResource({
				name: 'DoFBlurred',
				isTransient: true,
				isUsedExternally: false,
				descriptor: new RenderPassResourceDescriptor({
					colorAttachments: [
						{
							texture: new TextureResourceDescriptor({
								type: TextureResourceType.Texture2D,
								width: 1,
								height: 1,
								format: RendererTypes.TextureFormat.RGBA16Float,
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
			}),
			DoF: this.resourceFactory.createRenderPassResource({
				name: 'DoF',
				isTransient: true,
				isUsedExternally: false,
				descriptor: new RenderPassResourceDescriptor({
					colorAttachments: [
						{
							texture: new TextureResourceDescriptor({
								type: TextureResourceType.Texture2D,
								width: 1,
								height: 1,
								format: RendererTypes.TextureFormat.RGBA16Float,
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
			}),
			BloomHighLuminosity: this.resourceFactory.createRenderPassResource({
				name: 'BloomHighLuminosity',
				isTransient: true,
				isUsedExternally: false,
				descriptor: new RenderPassResourceDescriptor({
					colorAttachments: [
						{
							texture: new TextureResourceDescriptor({
								type: TextureResourceType.Texture2D,
								width: 1,
								height: 1,
								format: RendererTypes.TextureFormat.RGBA16Float,
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
			}),
			Bloom: this.resourceFactory.createRenderPassResource({
				name: 'Bloom',
				isTransient: true,
				isUsedExternally: false,
				descriptor: new RenderPassResourceDescriptor({
					colorAttachments: [
						{
							texture: new TextureResourceDescriptor({
								type: TextureResourceType.Texture2D,
								width: 1,
								height: 1,
								format: RendererTypes.TextureFormat.RGBA16Float,
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
			}),
			TerrainHeight: this.resourceFactory.createRenderPassResource({
				name: 'TerrainHeight',
				isTransient: false,
				isUsedExternally: false,
				descriptor: new RenderPassResourceDescriptor({
					colorAttachments: [
						{
							texture: new TextureResourceDescriptor({
								type: TextureResourceType.Texture2DArray,
								width: 1,
								height: 1,
								depth: 1,
								format: RendererTypes.TextureFormat.R32Float,
								minFilter: RendererTypes.MinFilter.NearestMipmapNearest,
								magFilter: RendererTypes.MagFilter.Nearest,
								wrap: RendererTypes.TextureWrap.ClampToEdge,
								mipmaps: true,
								isImmutable: true,
								immutableLevels: 6
							}),
							clearValue: {r: 0, g: 0, b: 0, a: 0},
							loadOp: RendererTypes.AttachmentLoadOp.Load,
							storeOp: RendererTypes.AttachmentStoreOp.Store
						}
					]
				})
			}),
			TerrainNormal: this.resourceFactory.createRenderPassResource({
				name: 'TerrainNormal',
				isTransient: false,
				isUsedExternally: false,
				descriptor: new RenderPassResourceDescriptor({
					colorAttachments: [
						{
							texture: new TextureResourceDescriptor({
								type: TextureResourceType.Texture2DArray,
								width: 1,
								height: 1,
								format: RendererTypes.TextureFormat.RGBA16Float,
								minFilter: RendererTypes.MinFilter.Linear,
								magFilter: RendererTypes.MagFilter.Linear,
								wrap: RendererTypes.TextureWrap.ClampToEdge,
								mipmaps: false
							}),
							clearValue: {r: 0, g: 0, b: 0, a: 0},
							loadOp: RendererTypes.AttachmentLoadOp.Load,
							storeOp: RendererTypes.AttachmentStoreOp.Store
						}
					]
				})
			}),
			TerrainWater: this.resourceFactory.createRenderPassResource({
				name: 'TerrainWater',
				isTransient: false,
				isUsedExternally: false,
				descriptor: new RenderPassResourceDescriptor({
					colorAttachments: [
						{
							texture: new TextureResourceDescriptor({
								type: TextureResourceType.Texture2DArray,
								width: 1,
								height: 1,
								depth: 2,
								format: RendererTypes.TextureFormat.R8Unorm,
								minFilter: RendererTypes.MinFilter.Linear,
								magFilter: RendererTypes.MagFilter.Linear,
								wrap: RendererTypes.TextureWrap.ClampToEdge,
								mipmaps: false
							}),
							slice: 0,
							clearValue: {r: 0, g: 0, b: 0, a: 0},
							loadOp: RendererTypes.AttachmentLoadOp.Load,
							storeOp: RendererTypes.AttachmentStoreOp.Store
						}
					]
				})
			}),
			TerrainTileMask: this.resourceFactory.createRenderPassResource({
				name: 'TerrainTileMask',
				isTransient: false,
				isUsedExternally: false,
				descriptor: new RenderPassResourceDescriptor({
					colorAttachments: [
						{
							texture: new TextureResourceDescriptor({
								type: TextureResourceType.Texture2D,
								width: Config.TerrainWaterMaskResolution,
								height: Config.TerrainWaterMaskResolution,
								format: RendererTypes.TextureFormat.R8Unorm,
								minFilter: RendererTypes.MinFilter.Nearest,
								magFilter: RendererTypes.MagFilter.Nearest,
								wrap: RendererTypes.TextureWrap.ClampToEdge,
								mipmaps: false
							}),
							clearValue: {r: 0, g: 0, b: 0, a: 0},
							loadOp: RendererTypes.AttachmentLoadOp.Load,
							storeOp: RendererTypes.AttachmentStoreOp.Store
						}
					]
				})
			}),
			TerrainRingHeight: this.resourceFactory.createRenderPassResource({
				name: 'TerrainRingHeight',
				isTransient: false,
				isUsedExternally: false,
				descriptor: new RenderPassResourceDescriptor({
					colorAttachments: [
						{
							texture: new TextureResourceDescriptor({
								type: TextureResourceType.Texture2DArray,
								width: Config.TerrainRingSegmentCount * 2 + 1,
								height: Config.TerrainRingSegmentCount * 2 + 1,
								depth: Config.TerrainRingCount,
								format: RendererTypes.TextureFormat.R32Float,
								minFilter: RendererTypes.MinFilter.Nearest,
								magFilter: RendererTypes.MagFilter.Nearest,
								wrap: RendererTypes.TextureWrap.ClampToEdge,
								mipmaps: false
							}),
							slice: 0,
							clearValue: {r: 0, g: 0, b: 0, a: 0},
							loadOp: RendererTypes.AttachmentLoadOp.Load,
							storeOp: RendererTypes.AttachmentStoreOp.Store
						}
					]
				})
			}),
			SlippyMap: this.resourceFactory.createRenderPassResource({
				name: 'SlippyMap',
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
								minFilter: RendererTypes.MinFilter.Nearest,
								magFilter: RendererTypes.MagFilter.Nearest,
								wrap: RendererTypes.TextureWrap.ClampToEdge,
								mipmaps: false
							}),
							slice: 0,
							clearValue: {r: 0.667, g: 0.827, b: 0.875, a: 1},
							loadOp: RendererTypes.AttachmentLoadOp.Clear,
							storeOp: RendererTypes.AttachmentStoreOp.Store
						}
					]
				})
			})
		}

		for (const [key, value] of Object.entries(resourcesList)) {
			this.sharedResources.set(key as keyof SharedResources, value);
		}
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
		this.sharedResources.get('SSR').descriptor.setSize(resolutionScene.x, resolutionScene.y);
		this.sharedResources.get('CoC').descriptor.setSize(resolutionScene.x, resolutionScene.y);
		this.sharedResources.get('CoCHistory').descriptor.setSize(resolutionScene.x, resolutionScene.y);
		this.sharedResources.get('CoCAntialiased').descriptor.setSize(resolutionScene.x, resolutionScene.y);
		this.sharedResources.get('CoCWithColorDownscaled').descriptor.setSize(resolutionSceneHalf.x, resolutionSceneHalf.y);
		this.sharedResources.get('DoFRaw').descriptor.setSize(resolutionSceneHalf.x, resolutionSceneHalf.y);
		this.sharedResources.get('DoFBlurred').descriptor.setSize(resolutionSceneHalf.x, resolutionSceneHalf.y);
		this.sharedResources.get('DoF').descriptor.setSize(resolutionScene.x, resolutionScene.y);
		this.sharedResources.get('BloomHighLuminosity').descriptor.setSize(resolutionScene.x, resolutionScene.y);
		this.sharedResources.get('Bloom').descriptor.setSize(resolutionScene.x, resolutionScene.y);
		this.sharedResources.get('SlippyMap').descriptor.setSize(resolutionUI.x, resolutionUI.y);
	}
}