import Pass from '~/app/render/passes/Pass';
import * as RG from "~/render-graph";
import RenderPassResource from '~/app/render/render-graph/resources/RenderPassResource';
import RenderPassResourceDescriptor from '~/app/render/render-graph/resource-descriptors/RenderPassResourceDescriptor';
import TextureResourceDescriptor, {TextureResourceType} from '~/app/render/render-graph/resource-descriptors/TextureResourceDescriptor';
import {RendererTypes} from '~/renderer/RendererTypes';
import PassManager from '~/app/render/PassManager';
import Shaders from '~/app/render/shaders/Shaders';
import AbstractMaterial from '~/renderer/abstract-renderer/AbstractMaterial';
import AbstractTexture2D from '~/renderer/abstract-renderer/AbstractTexture2D';
import FullScreenTriangle from '~/app/objects/FullScreenTriangle';

export default class TAAPass extends Pass<{
	GBuffer: {
		type: RG.InternalResourceType.Input;
		resource: RenderPassResource;
	};
	TAAAccum: {
		type: RG.InternalResourceType.Input;
		resource: RenderPassResource;
	};
	TAAOutput: {
		type: RG.InternalResourceType.Input;
		resource: RenderPassResource;
	};
	Output: {
		type: RG.InternalResourceType.Output;
		resource: RenderPassResource;
	};
}> {
	private backbufferMaterial: AbstractMaterial;
	private taaMaterial: AbstractMaterial;
	private fullScreenTriangle: FullScreenTriangle;

	public constructor(manager: PassManager) {
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
			Output: {type: RG.InternalResourceType.Output, resource: manager.getSharedResource('BackbufferRenderPass')},
		});

		this.init();
	}

	private init(): void {
		this.backbufferMaterial = this.renderer.createMaterial({
			name: 'Backbuffer material',
			uniforms: [
				{
					name: 'map',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}
			],
			primitive: {
				frontFace: RendererTypes.FrontFace.CCW,
				cullMode: RendererTypes.CullMode.None
			},
			depth: {
				depthWrite: true,
				depthCompare: RendererTypes.DepthCompare.LessEqual
			},
			vertexShaderSource: Shaders.ldrCompose.vertex,
			fragmentShaderSource: Shaders.ldrCompose.fragment
		});

		this.taaMaterial = this.renderer.createMaterial({
			name: 'TAA material',
			uniforms: [
				{
					name: 'tNew',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tAccum',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}, {
					name: 'tMotion',
					block: null,
					type: RendererTypes.UniformType.Texture2D,
					value: null
				}
			],
			primitive: {
				frontFace: RendererTypes.FrontFace.CCW,
				cullMode: RendererTypes.CullMode.None
			},
			depth: {
				depthWrite: true,
				depthCompare: RendererTypes.DepthCompare.LessEqual
			},
			vertexShaderSource: Shaders.taa.vertex,
			fragmentShaderSource: Shaders.taa.fragment
		});

		this.fullScreenTriangle = new FullScreenTriangle(this.renderer);
	}

	public render(): void {
		const colorTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').colorAttachments[0].texture;
		const motionTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').colorAttachments[3].texture;
		const accumTexture = <AbstractTexture2D>this.getPhysicalResource('TAAAccum').colorAttachments[0].texture;
		const outputTexture = <AbstractTexture2D>this.getPhysicalResource('TAAOutput').colorAttachments[0].texture;

		this.taaMaterial.getUniform('tNew').value = colorTexture;
		this.taaMaterial.getUniform('tAccum').value = accumTexture;
		this.taaMaterial.getUniform('tMotion').value = motionTexture;

		this.renderer.beginRenderPass(this.getPhysicalResource('TAAOutput'));
		this.renderer.useMaterial(this.taaMaterial);

		this.fullScreenTriangle.mesh.draw();

		this.getPhysicalResource('TAAOutput').copyColorAttachmentToTexture(0, accumTexture);

		this.backbufferMaterial.getUniform('map').value = outputTexture;

		this.renderer.beginRenderPass(this.getPhysicalResource('Output'));
		this.renderer.useMaterial(this.backbufferMaterial);

		this.fullScreenTriangle.mesh.draw();
	}

	public setSize(width: number, height: number): void {
		this.getResource('TAAAccum').descriptor.setSize(width, height);
		this.getResource('TAAOutput').descriptor.setSize(width, height);
	}
}