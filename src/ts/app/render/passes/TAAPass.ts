import Pass from '~/app/render/passes/Pass';
import * as RG from "~/render-graph";
import RenderPassResource from '~/app/render/render-graph/resources/RenderPassResource';
import RenderPassResourceDescriptor from '~/app/render/render-graph/resource-descriptors/RenderPassResourceDescriptor';
import TextureResourceDescriptor, {TextureResourceType} from '~/app/render/render-graph/resource-descriptors/TextureResourceDescriptor';
import {RendererTypes} from '~/renderer/RendererTypes';
import PassManager from '~/app/render/PassManager';

export default class TAAPass extends Pass<{
	GBuffer: {
		type: RG.InternalResourceType.Input,
		resource: RenderPassResource
	},
	TAAAccum: {
		type: RG.InternalResourceType.Input,
		resource: RenderPassResource
	},
	TAAOutput: {
		type: RG.InternalResourceType.Input,
		resource: RenderPassResource
	},
	Output: {
		type: RG.InternalResourceType.Output,
		resource: RenderPassResource
	}
}> {
	constructor(manager: PassManager) {
		super('TAAPass', manager, {
			GBuffer: {type: RG.InternalResourceType.Input, resource: manager.getSharedResource('GBufferRenderPass')},
			TAAAccum: {
				type: RG.InternalResourceType.Input,
				resource: manager.resourceFactory.createRenderPassResource({
					name: 'TAA accum',
					isTransient: false,
					isUsedExternally: false,
					descriptor: new RenderPassResourceDescriptor({
						colorAttachments: [
							{
								texture: new TextureResourceDescriptor({
									type: TextureResourceType.Texture2D,
									width: manager.renderer.resolution.x,
									height: manager.renderer.resolution.y,
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
				})
			},
			TAAOutput: {
				type: RG.InternalResourceType.Input,
				resource: manager.resourceFactory.createRenderPassResource({
					name: 'TAA output',
					isTransient: true,
					isUsedExternally: false,
					descriptor: new RenderPassResourceDescriptor({
						colorAttachments: [
							{
								texture: new TextureResourceDescriptor({
									type: TextureResourceType.Texture2D,
									width: manager.renderer.resolution.x,
									height: manager.renderer.resolution.y,
									format: RendererTypes.TextureFormat.RGBA32Float,
									minFilter: RendererTypes.MinFilter.Nearest,
									magFilter: RendererTypes.MagFilter.Nearest,
									mipmaps: false
								}),
								clearValue: {r: 0, g: 0, b: 0, a: 1},
								loadOp: RendererTypes.AttachmentLoadOp.Load,
								storeOp: RendererTypes.AttachmentStoreOp.Store
							}
						]
					})
				})
			},
			Output: {type: RG.InternalResourceType.Output, resource: manager.getSharedResource('BackbufferRenderPass')},
		});

		this.init();
	}

	private init() {
		this.setResource('TAAOutput', this.resourceFactory.createRenderPassResource({
			name: 'TAA output',
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
							minFilter: RendererTypes.MinFilter.Nearest,
							magFilter: RendererTypes.MagFilter.Nearest,
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

	public render() {
		//const t = this.getPhysicalResource('GBuffer').colorAttachments[0].texture;
	}

	public setSize(width: number, height: number) {
		this.getResource('TAAAccum').descriptor.setSize(width, height);
	}
}