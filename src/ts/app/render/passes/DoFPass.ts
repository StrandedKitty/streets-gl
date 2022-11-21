import Pass from "~/app/render/passes/Pass";
import * as RG from "~/render-graph";
import {InternalResourceType} from "~/render-graph";
import RenderPassResource from "~/app/render/render-graph/resources/RenderPassResource";
import PassManager from "~/app/render/PassManager";
import AbstractMaterial from "~/renderer/abstract-renderer/AbstractMaterial";
import FullScreenTriangle from "~/app/objects/FullScreenTriangle";
import AbstractTexture2D from "~/renderer/abstract-renderer/AbstractTexture2D";
import CoCMaterialContainer from "~/app/render/materials/CoCMaterialContainer";
import CoCDownscaleMaterialContainer from "~/app/render/materials/CoCDownscaleMaterialContainer";
import DoFMaterialContainer from "~/app/render/materials/DoFMaterialContainer";
import DoFBlurMaterialContainer from "~/app/render/materials/DoFBlurMaterialContainer";
import CoCAntialiasMaterialContainer from "~/app/render/materials/CoCAntialiasMaterialContainer";

export default class DoFPass extends Pass<{
	HDR: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	GBuffer: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	CoC: {
		type: RG.InternalResourceType.Output;
		resource: RenderPassResource;
	};
	CoCHistory: {
		type: RG.InternalResourceType.Local;
		resource: RenderPassResource;
	};
	CoCAntialiased: {
		type: RG.InternalResourceType.Output;
		resource: RenderPassResource;
	};
	CoCWithColorDownscaled: {
		type: RG.InternalResourceType.Local;
		resource: RenderPassResource;
	};
	DoF: {
		type: RG.InternalResourceType.Local;
		resource: RenderPassResource;
	};
	DoFBlurred: {
		type: RG.InternalResourceType.Output;
		resource: RenderPassResource;
	};
}> {
	private readonly cocMaterial: AbstractMaterial;
	private readonly cocAntialiasMaterial: AbstractMaterial;
	private readonly cocDownscaleMaterial: AbstractMaterial;
	private readonly dofMaterial: AbstractMaterial;
	private readonly dofBlurMaterial: AbstractMaterial;
	private readonly fullScreenTriangle: FullScreenTriangle;

	public constructor(manager: PassManager) {
		super('DoFPass', manager, {
			HDR: {type: InternalResourceType.Input, resource: manager.getSharedResource('HDRAntialiased')},
			GBuffer: {type: InternalResourceType.Input, resource: manager.getSharedResource('GBufferRenderPass')},
			CoC: {type: InternalResourceType.Output, resource: manager.getSharedResource('CoC')},
			CoCHistory: {type: InternalResourceType.Local, resource: manager.getSharedResource('CoCHistory')},
			CoCAntialiased: {type: InternalResourceType.Output, resource: manager.getSharedResource('CoCAntialiased')},
			CoCWithColorDownscaled: {type: InternalResourceType.Local, resource: manager.getSharedResource('CoCWithColorDownscaled')},
			DoF: {type: InternalResourceType.Local, resource: manager.getSharedResource('DoF')},
			DoFBlurred: {type: InternalResourceType.Output, resource: manager.getSharedResource('DoFBlurred')},
		});

		this.fullScreenTriangle = new FullScreenTriangle(this.renderer);
		this.cocMaterial = new CoCMaterialContainer(this.renderer).material;
		this.cocAntialiasMaterial = new CoCAntialiasMaterialContainer(this.renderer).material;
		this.cocDownscaleMaterial = new CoCDownscaleMaterialContainer(this.renderer).material;
		this.dofMaterial = new DoFMaterialContainer(this.renderer).material;
		this.dofBlurMaterial = new DoFBlurMaterialContainer(this.renderer).material;
	}

	public render(): void {
		return;
		this.renderCoC();
		this.antialiasCoC();
		this.downscaleCoC();
		this.renderDoF();
		this.blurDoF();
	}

	private renderCoC(): void {
		const camera = this.manager.sceneSystem.objects.camera;
		const depthTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').depthAttachment.texture;

		this.renderer.beginRenderPass(this.getPhysicalResource('CoC'));

		this.cocMaterial.getUniform('tDepth').value = depthTexture;
		this.cocMaterial.getUniform('projectionMatrixInverse', 'MainBlock').value = new Float32Array(camera.projectionMatrixInverse.values);
		this.cocMaterial.updateUniformBlock('MainBlock');

		this.renderer.useMaterial(this.cocMaterial);
		this.fullScreenTriangle.mesh.draw();
	}

	private antialiasCoC(): void {
		const motionTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').colorAttachments[3].texture;
		const cocTexture = <AbstractTexture2D>this.getPhysicalResource('CoC').colorAttachments[0].texture;
		const cocHistoryTexture = <AbstractTexture2D>this.getPhysicalResource('CoCHistory').colorAttachments[0].texture;

		this.renderer.beginRenderPass(this.getPhysicalResource('CoCAntialiased'));

		this.cocAntialiasMaterial.getUniform('tCoC').value = cocTexture;
		this.cocAntialiasMaterial.getUniform('tCoCHistory').value = cocHistoryTexture;
		this.cocAntialiasMaterial.getUniform('tMotion').value = motionTexture;

		this.renderer.useMaterial(this.cocAntialiasMaterial);
		this.fullScreenTriangle.mesh.draw();

		this.getPhysicalResource('CoCAntialiased').copyColorAttachmentToTexture(0, cocHistoryTexture);
	}

	private downscaleCoC(): void {
		const hdrTexture = <AbstractTexture2D>this.getPhysicalResource('HDR').colorAttachments[0].texture;
		const cocTexture = <AbstractTexture2D>this.getPhysicalResource('CoCAntialiased').colorAttachments[0].texture;

		this.renderer.beginRenderPass(this.getPhysicalResource('CoCWithColorDownscaled'));

		this.cocDownscaleMaterial.getUniform('tCoC').value = cocTexture;
		this.cocDownscaleMaterial.getUniform('tColor').value = hdrTexture;

		this.renderer.useMaterial(this.cocDownscaleMaterial);
		this.fullScreenTriangle.mesh.draw();
	}

	private renderDoF(): void {
		const cocDownscaledTexture = <AbstractTexture2D>this.getPhysicalResource('CoCWithColorDownscaled').colorAttachments[0].texture;

		this.renderer.beginRenderPass(this.getPhysicalResource('DoF'));

		this.dofMaterial.getUniform('tCoC').value = cocDownscaledTexture;

		this.renderer.useMaterial(this.dofMaterial);
		this.fullScreenTriangle.mesh.draw();
	}

	private blurDoF(): void {
		const dofTexture = <AbstractTexture2D>this.getPhysicalResource('DoF').colorAttachments[0].texture;

		this.renderer.beginRenderPass(this.getPhysicalResource('DoFBlurred'));

		this.dofBlurMaterial.getUniform('tMap').value = dofTexture;

		this.renderer.useMaterial(this.dofBlurMaterial);
		this.fullScreenTriangle.mesh.draw();
	}

	public setSize(width: number, height: number): void {

	}
}