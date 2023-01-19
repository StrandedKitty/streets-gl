import Pass from "./Pass";
import * as RG from "~/lib/render-graph";
import RenderPassResource from "../render-graph/resources/RenderPassResource";
import {InternalResourceType} from "~/lib/render-graph";
import PassManager from "../PassManager";
import AbstractMaterial from "~/lib/renderer/abstract-renderer/AbstractMaterial";
import FullScreenTriangle from "../../objects/FullScreenTriangle";
import AbstractTexture2D from "~/lib/renderer/abstract-renderer/AbstractTexture2D";
import ScreenMaterialContainer from "../materials/ScreenMaterialContainer";
import {UniformFloat2} from "~/lib/renderer/abstract-renderer/Uniform";
import AbstractTexture2DArray from "~/lib/renderer/abstract-renderer/AbstractTexture2DArray";
import LuminosityMaterialContainer from "../materials/LuminosityMaterialContainer";
import AbstractRenderPass from "~/lib/renderer/abstract-renderer/AbstractRenderPass";
import TextureResourceDescriptor, {
	TextureResourceType
} from "../render-graph/resource-descriptors/TextureResourceDescriptor";
import {RendererTypes} from "~/lib/renderer/RendererTypes";
import BloomCombineMaterialContainer from "../materials/BloomCombineMaterialContainer";
import BloomBlurMaterialContainer from "../materials/BloomBlurMaterialContainer";

export default class BloomPass extends Pass<{
	Color: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	BloomHighLuminosity: {
		type: RG.InternalResourceType.Local;
		resource: RenderPassResource;
	};
	Output: {
		type: RG.InternalResourceType.Output;
		resource: RenderPassResource;
	};
}> {
	private readonly luminosityMaterial: AbstractMaterial;
	private readonly blurMaterial: AbstractMaterial;
	private readonly combineMaterial: AbstractMaterial;
	private readonly luminosityDownscaled: AbstractRenderPass[] = [];
	private readonly luminosityDownscaledBlurred: AbstractRenderPass[] = [];

	public constructor(manager: PassManager) {
		super('BloomPass', manager, {
			Color: {type: InternalResourceType.Input, resource: manager.getSharedResource('DoF')},
			BloomHighLuminosity: {type: InternalResourceType.Local, resource: manager.getSharedResource('BloomHighLuminosity')},
			Output: {type: InternalResourceType.Output, resource: manager.getSharedResource('Bloom')}
		});

		this.luminosityMaterial = new LuminosityMaterialContainer(this.renderer).material;
		this.blurMaterial = new BloomBlurMaterialContainer(this.renderer).material;
		this.combineMaterial = new BloomCombineMaterialContainer(this.renderer).material;

		for (let i = 0; i < 5; i++) {
			this.luminosityDownscaled.push(this.renderer.createRenderPass({
				colorAttachments: [
					{
						texture: this.renderer.createTexture2D({
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
			}));
			this.luminosityDownscaledBlurred.push(this.renderer.createRenderPass({
				colorAttachments: [
					{
						texture: this.renderer.createTexture2D({
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
			}));
		}

		this.setSize(window.innerWidth, window.innerHeight);
	}

	public render(): void {
		const fullScreenTriangle = this.manager.renderSystem.fullScreenTriangle.mesh;

		const sourceTexture = <AbstractTexture2D>this.getPhysicalResource('Color').colorAttachments[0].texture;

		this.renderer.beginRenderPass(this.getPhysicalResource('BloomHighLuminosity'));
		this.luminosityMaterial.getUniform('tMap').value = sourceTexture;
		this.renderer.useMaterial(this.luminosityMaterial);

		fullScreenTriangle.draw();

		for (let i = 0; i < this.luminosityDownscaled.length; i++) {
			const from = this.luminosityDownscaled[i - 1] ?? this.getPhysicalResource('BloomHighLuminosity');
			const to = this.luminosityDownscaled[i];

			this.renderer.beginRenderPass(to);

			from.copyAttachmentsToRenderPass({
				destination: to,
				sourceColorAttachment: 0,
				targetColorAttachment: 0,
				copyColor: true,
				copyDepth: false,
				linearFilter: true
			});
		}

		this.renderer.useMaterial(this.blurMaterial);

		for (let i = 0; i < this.luminosityDownscaledBlurred.length; i++) {
			const renderPass0 = this.luminosityDownscaledBlurred[i];
			const renderPass1 = this.luminosityDownscaled[i];

			this.renderer.beginRenderPass(renderPass0);

			this.blurMaterial.getUniform('tMap').value = <AbstractTexture2D>this.luminosityDownscaled[i].colorAttachments[0].texture;
			this.blurMaterial.getUniform('direction', 'MainBlock').value = new Float32Array([0, 1]);
			this.blurMaterial.updateUniformBlock('MainBlock');
			this.blurMaterial.updateUniform('tMap');

			fullScreenTriangle.draw();

			this.renderer.beginRenderPass(renderPass1);

			this.blurMaterial.getUniform('tMap').value = <AbstractTexture2D>this.luminosityDownscaledBlurred[i].colorAttachments[0].texture;
			this.blurMaterial.getUniform('direction', 'MainBlock').value = new Float32Array([1, 0]);
			this.blurMaterial.updateUniformBlock('MainBlock');
			this.blurMaterial.updateUniform('tMap');

			fullScreenTriangle.draw();
		}

		this.renderer.beginRenderPass(this.getPhysicalResource('Output'));

		this.combineMaterial.getUniform('tMap').value = sourceTexture;
		this.combineMaterial.getUniform('tBlurred0').value = <AbstractTexture2D>this.luminosityDownscaled[0].colorAttachments[0].texture;
		this.combineMaterial.getUniform('tBlurred1').value = <AbstractTexture2D>this.luminosityDownscaled[1].colorAttachments[0].texture;
		this.combineMaterial.getUniform('tBlurred2').value = <AbstractTexture2D>this.luminosityDownscaled[2].colorAttachments[0].texture;
		this.combineMaterial.getUniform('tBlurred3').value = <AbstractTexture2D>this.luminosityDownscaled[3].colorAttachments[0].texture;

		this.renderer.useMaterial(this.combineMaterial);

		fullScreenTriangle.draw();
	}

	public setSize(width: number, height: number): void {
		for (let i = 0; i < this.luminosityDownscaled.length; i++) {
			const texWidth = Math.floor(width / (2 ** (i + 1)));
			const texHeight = Math.floor(height / (2 ** (i + 1)));
			const texture = <AbstractTexture2D>this.luminosityDownscaled[i].colorAttachments[0].texture;
			const textureBlurred = <AbstractTexture2D>this.luminosityDownscaledBlurred[i].colorAttachments[0].texture;

			texture.width = texWidth;
			texture.height = texHeight;
			texture.updateFromData();

			textureBlurred.width = texWidth;
			textureBlurred.height = texHeight;
			textureBlurred.updateFromData();
		}
	}
}