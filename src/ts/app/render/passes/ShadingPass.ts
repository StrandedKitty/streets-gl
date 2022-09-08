import Pass from "~/app/render/passes/Pass";
import * as RG from "~/render-graph";
import {InternalResourceType} from "~/render-graph";
import RenderPassResource from "~/app/render/render-graph/resources/RenderPassResource";
import PassManager from "~/app/render/PassManager";
import AbstractTexture2D from "~/renderer/abstract-renderer/AbstractTexture2D";
import AbstractMaterial from "~/renderer/abstract-renderer/AbstractMaterial";
import FullScreenTriangle from "~/app/objects/FullScreenTriangle";
import AbstractTexture2DArray from "~/renderer/abstract-renderer/AbstractTexture2DArray";
import ShadingMaterialContainer from "~/app/render/materials/ShadingMaterialContainer";

export default class ShadingPass extends Pass<{
	GBuffer: {
		type: RG.InternalResourceType.Input;
		resource: RenderPassResource;
	};
	ShadowMaps: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	SSAO: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	HDR: {
		type: InternalResourceType.Output;
		resource: RenderPassResource;
	};
}> {
	private readonly shadingMaterial: AbstractMaterial;
	private readonly fullScreenTriangle: FullScreenTriangle;

	public constructor(manager: PassManager) {
		super('ShadingPass', manager, {
			GBuffer: {type: RG.InternalResourceType.Input, resource: manager.getSharedResource('GBufferRenderPass')},
			ShadowMaps: {type: InternalResourceType.Input, resource: manager.getSharedResource('ShadowMaps')},
			SSAO: {type: InternalResourceType.Input, resource: manager.getSharedResource('SSAOResult')},
			HDR: {type: InternalResourceType.Output, resource: manager.getSharedResource('HDR')}
		});

		this.fullScreenTriangle = new FullScreenTriangle(this.renderer);
		this.shadingMaterial = new ShadingMaterialContainer(this.renderer).material;
	}

	public render(): void {
		const camera = this.manager.sceneSystem.objects.camera;
		const csm = this.manager.sceneSystem.objects.csm;

		const colorTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').colorAttachments[0].texture;
		const normalTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').colorAttachments[1].texture;
		const positionTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').colorAttachments[2].texture;
		const shadowMapsTexture = <AbstractTexture2DArray>this.getPhysicalResource('ShadowMaps').depthAttachment.texture;
		const ssaoTexture = <AbstractTexture2D>this.getPhysicalResource('SSAO').colorAttachments[0].texture;

		const csmBuffers = csm.getUniformsBuffers();

		this.renderer.beginRenderPass(this.getPhysicalResource('HDR'));

		this.shadingMaterial.getUniform('tColor').value = colorTexture;
		this.shadingMaterial.getUniform('tNormal').value = normalTexture;
		this.shadingMaterial.getUniform('tPosition').value = positionTexture;
		this.shadingMaterial.getUniform('tShadowMaps').value = shadowMapsTexture;
		this.shadingMaterial.getUniform('tSSAO').value = ssaoTexture;
		this.shadingMaterial.getUniform('viewMatrix').value = new Float32Array(camera.matrixWorld.values);

		for (const [key, value] of Object.entries(csmBuffers)) {
			this.shadingMaterial.getUniform(key + '[0]', 'CSM').value = value;
			//this.shadingMaterial.applyUniformUpdates(key + '[0]', 'CSM');
		}

		this.shadingMaterial.updateUniformBlock('CSM');

		this.renderer.useMaterial(this.shadingMaterial);

		this.fullScreenTriangle.mesh.draw();
	}

	public setSize(width: number, height: number): void {

	}
}