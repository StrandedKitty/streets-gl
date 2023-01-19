import Pass from '~/app/render/passes/Pass';
import * as RG from "~/render-graph";
import {InternalResourceType} from "~/render-graph";
import RenderPassResource from '~/app/render/render-graph/resources/RenderPassResource';
import PassManager from '~/app/render/PassManager';
import AbstractMaterial from '~/renderer/abstract-renderer/AbstractMaterial';
import FullScreenTriangle from "~/app/objects/FullScreenTriangle";
import SSRMaterialContainer from "~/app/render/materials/SSRMaterialContainer";
import AbstractTexture2D from "~/renderer/abstract-renderer/AbstractTexture2D";
import {UniformFloat2, UniformMatrix4} from "~/renderer/abstract-renderer/Uniform";

export default class SSRPass extends Pass<{
	GBuffer: {
		type: RG.InternalResourceType.Input;
		resource: RenderPassResource;
	};
	LastFrame: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	SSR: {
		type: InternalResourceType.Output;
		resource: RenderPassResource;
	};
}> {
	private ssrMaterial: AbstractMaterial;
	private fullScreenTriangle: FullScreenTriangle;

	public constructor(manager: PassManager) {
		super('SSRPass', manager, {
			GBuffer: {type: RG.InternalResourceType.Input, resource: manager.getSharedResource('GBufferRenderPass')},
			LastFrame: {type: RG.InternalResourceType.Input, resource: manager.getSharedResource('HDR')},
			SSR: {type: RG.InternalResourceType.Output, resource: manager.getSharedResource('SSR')},
		});

		this.init();
	}

	private init(): void {
		this.ssrMaterial = new SSRMaterialContainer(this.renderer).material;
		this.fullScreenTriangle = new FullScreenTriangle(this.renderer);
	}

	public render(): void {
		const camera = this.manager.sceneSystem.objects.camera;
		const colorTexture = <AbstractTexture2D>this.getPhysicalResource('LastFrame').colorAttachments[0].texture;
		const normalTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').colorAttachments[1].texture;
		const positionTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').colorAttachments[2].texture;
		const depthTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').depthAttachment.texture;

		this.ssrMaterial.getUniform('tColor').value = colorTexture;
		this.ssrMaterial.getUniform('tNormal').value = normalTexture;
		this.ssrMaterial.getUniform('tPosition').value = positionTexture;
		this.ssrMaterial.getUniform('tDepth').value = depthTexture;
		this.ssrMaterial.getUniform<UniformMatrix4>('projectionMatrix', 'MainBlock').value = new Float32Array(camera.projectionMatrix.values);
		this.ssrMaterial.getUniform<UniformMatrix4>('projectionMatrixInverse', 'MainBlock').value = new Float32Array(camera.projectionMatrixInverse.values);
		this.ssrMaterial.getUniform<UniformFloat2>('noiseOffset', 'MainBlock').value = new Float32Array([
			Math.random(), Math.random()
		]);

		this.ssrMaterial.updateUniformBlock('MainBlock');

		this.renderer.beginRenderPass(this.getPhysicalResource('SSR'));
		this.renderer.useMaterial(this.ssrMaterial);

		this.fullScreenTriangle.mesh.draw();
	}

	public setSize(width: number, height: number): void {

	}
}