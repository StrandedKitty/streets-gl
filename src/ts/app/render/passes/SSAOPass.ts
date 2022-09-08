import Pass from '~/app/render/passes/Pass';
import * as RG from "~/render-graph";
import RenderPassResource from '~/app/render/render-graph/resources/RenderPassResource';
import PassManager from '~/app/render/PassManager';
import AbstractMaterial from '~/renderer/abstract-renderer/AbstractMaterial';
import AbstractTexture2D from '~/renderer/abstract-renderer/AbstractTexture2D';
import FullScreenTriangle from '~/app/objects/FullScreenTriangle';
import {UniformFloat2, UniformFloat4, UniformMatrix4} from "~/renderer/abstract-renderer/Uniform";
import SSAOMaterialContainer from "~/app/render/materials/SSAOMaterialContainer";
import SSAOBlurMaterialContainer from "~/app/render/materials/SSAOBlurMaterialContainer";
import SSAOReprojectMaterialContainer from "~/app/render/materials/SSAOReprojectMaterialContainer";

export default class SSAOPass extends Pass<{
	GBuffer: {
		type: RG.InternalResourceType.Input;
		resource: RenderPassResource;
	};
	BlurHorizontal: {
		type: RG.InternalResourceType.Local;
		resource: RenderPassResource;
	};
	BlurVertical: {
		type: RG.InternalResourceType.Local;
		resource: RenderPassResource;
	};
	RawSSAO: {
		type: RG.InternalResourceType.Local;
		resource: RenderPassResource;
	};
	SSAOAccum: {
		type: RG.InternalResourceType.Local;
		resource: RenderPassResource;
	};
	SSAOPrevDepth: {
		type: RG.InternalResourceType.Local;
		resource: RenderPassResource;
	};
	SSAOResult: {
		type: RG.InternalResourceType.Output;
		resource: RenderPassResource;
	};
}> {
	private ssaoMaterial: AbstractMaterial;
	private blurMaterial: AbstractMaterial;
	private reprojectMaterial: AbstractMaterial;
	private fullScreenTriangle: FullScreenTriangle;

	public constructor(manager: PassManager) {
		super('SSAOPass', manager, {
			GBuffer: {type: RG.InternalResourceType.Input, resource: manager.getSharedResource('GBufferRenderPass')},
			BlurHorizontal: {type: RG.InternalResourceType.Local, resource: manager.getSharedResource('SSAOBlurTemp')},
			BlurVertical: {type: RG.InternalResourceType.Local, resource: manager.getSharedResource('SSAOBlurred')},
			RawSSAO: {type: RG.InternalResourceType.Local, resource: manager.getSharedResource('SSAO')},
			SSAOAccum: {type: RG.InternalResourceType.Local, resource: manager.getSharedResource('SSAOAccum')},
			SSAOResult: {type: RG.InternalResourceType.Output, resource: manager.getSharedResource('SSAOResult')},
			SSAOPrevDepth: {type: RG.InternalResourceType.Local, resource: manager.getSharedResource('SSAOPrevDepth')},
		});

		this.init();
	}

	private init(): void {
		this.ssaoMaterial = new SSAOMaterialContainer(this.renderer).material;
		this.blurMaterial = new SSAOBlurMaterialContainer(this.renderer).material;
		this.reprojectMaterial = new SSAOReprojectMaterialContainer(this.renderer).material;
		this.fullScreenTriangle = new FullScreenTriangle(this.renderer);
	}

	public render(): void {
		const camera = this.manager.sceneSystem.objects.camera;
		const normalTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').colorAttachments[1].texture;
		const motionTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').colorAttachments[3].texture;
		const depthTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').depthAttachment.texture;

		this.ssaoMaterial.getUniform('tNormal').value = normalTexture;
		this.ssaoMaterial.getUniform('tDepth').value = depthTexture;
		this.ssaoMaterial.getUniform('tMotion').value = motionTexture;
		this.ssaoMaterial.getUniform<UniformMatrix4>('projectionMatrix', 'MainBlock').value = new Float32Array(camera.projectionMatrix.values);
		this.ssaoMaterial.getUniform<UniformMatrix4>('projectionMatrixInverse', 'MainBlock').value = new Float32Array(camera.projectionMatrixInverse.values);

		const rndOffset = this.ssaoMaterial.getUniform<UniformFloat4>('randomOffset', 'MainBlock').value;
		for (let i = 0; i < rndOffset.length; i++) {
			rndOffset[i] = Math.random();
		}

		this.ssaoMaterial.updateUniformBlock('MainBlock');

		this.renderer.beginRenderPass(this.getPhysicalResource('RawSSAO'));
		this.renderer.useMaterial(this.ssaoMaterial);

		this.fullScreenTriangle.mesh.draw();

		this.renderer.beginRenderPass(this.getPhysicalResource('BlurHorizontal'));

		this.blurMaterial.getUniform<UniformMatrix4>('projectionMatrixInverse', 'MainBlock').value = new Float32Array(camera.projectionMatrixInverse.values);
		this.blurMaterial.getUniform<UniformFloat2>('direction', 'MainBlock').value[0] = 1;
		this.blurMaterial.getUniform<UniformFloat2>('direction', 'MainBlock').value[1] = 0;
		this.blurMaterial.getUniform('tDepth').value = depthTexture;
		this.blurMaterial.getUniform('tColor').value = <AbstractTexture2D>this.getPhysicalResource('RawSSAO').colorAttachments[0].texture;
		this.blurMaterial.updateUniformBlock('MainBlock');

		this.renderer.useMaterial(this.blurMaterial);

		this.fullScreenTriangle.mesh.draw();

		this.renderer.beginRenderPass(this.getPhysicalResource('BlurVertical'));

		this.blurMaterial.getUniform<UniformFloat2>('direction', 'MainBlock').value[0] = 0;
		this.blurMaterial.getUniform<UniformFloat2>('direction', 'MainBlock').value[1] = 1;
		this.blurMaterial.getUniform('tColor').value = <AbstractTexture2D>this.getPhysicalResource('BlurHorizontal').colorAttachments[0].texture;
		this.blurMaterial.updateUniformBlock('MainBlock');
		this.blurMaterial.updateUniform('tColor');

		this.fullScreenTriangle.mesh.draw();

		this.renderer.beginRenderPass(this.getPhysicalResource('SSAOResult'));

		const newTexture = <AbstractTexture2D>this.getPhysicalResource('BlurVertical').colorAttachments[0].texture;
		const accumTexture = <AbstractTexture2D>this.getPhysicalResource('SSAOAccum').colorAttachments[0].texture;

		this.reprojectMaterial.getUniform('tNew').value = newTexture;
		this.reprojectMaterial.getUniform('tAccum').value = accumTexture;
		this.reprojectMaterial.getUniform('tMotion').value = motionTexture;
		this.reprojectMaterial.getUniform('tDepth').value = depthTexture;
		this.reprojectMaterial.getUniform('tPrevDepth').value = <AbstractTexture2D>this.getPhysicalResource('SSAOPrevDepth').depthAttachment.texture;

		this.renderer.useMaterial(this.reprojectMaterial);

		this.fullScreenTriangle.mesh.draw();

		this.getPhysicalResource('SSAOResult').copyAttachmentsToRenderPass({
			destination: this.getPhysicalResource('SSAOAccum'),
			copyColor: true,
			sourceColorAttachment: 0,
			targetColorAttachment: 0
		});
		this.getPhysicalResource('GBuffer').copyAttachmentsToRenderPass({
			destination: this.getPhysicalResource('SSAOPrevDepth'),
			copyDepth: true
		});
	}

	public setSize(width: number, height: number): void {

	}
}