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
import AbstractTexture3D from "~/renderer/abstract-renderer/AbstractTexture3D";
import Vec3 from "~/math/Vec3";

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
	SelectionMask: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	SelectionBlurred: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	HDR: {
		type: InternalResourceType.Output;
		resource: RenderPassResource;
	};
	SkyViewLUT: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	AerialPerspectiveLUT: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	TransmittanceLUT: {
		type: InternalResourceType.Input;
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
			SelectionMask: {type: InternalResourceType.Input, resource: manager.getSharedResource('SelectionMask')},
			SelectionBlurred: {type: InternalResourceType.Input, resource: manager.getSharedResource('SelectionBlurred')},
			HDR: {type: InternalResourceType.Output, resource: manager.getSharedResource('HDR')},
			SkyViewLUT: {type: InternalResourceType.Input, resource: manager.getSharedResource('SkyViewLUT')},
			AerialPerspectiveLUT: {type: InternalResourceType.Input, resource: manager.getSharedResource('AerialPerspectiveLUT')},
			TransmittanceLUT: {type: InternalResourceType.Input, resource: manager.getSharedResource('AtmosphereTransmittanceLUT')},
		});

		this.fullScreenTriangle = new FullScreenTriangle(this.renderer);
		this.shadingMaterial = new ShadingMaterialContainer(this.renderer).material;
	}

	public render(): void {
		const camera = this.manager.sceneSystem.objects.camera;
		const csm = this.manager.sceneSystem.objects.csm;
		const sunDirection = new Float32Array([...Vec3.toArray(this.manager.mapTimeSystem.sunDirection)]);

		const colorTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').colorAttachments[0].texture;
		const normalTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').colorAttachments[1].texture;
		const positionTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').colorAttachments[2].texture;
		const shadowMapsTexture = <AbstractTexture2DArray>this.getPhysicalResource('ShadowMaps').depthAttachment.texture;
		const ssaoTexture = <AbstractTexture2D>this.getPhysicalResource('SSAO').colorAttachments[0].texture;
		const selectionMaskTexture = <AbstractTexture2D>this.getPhysicalResource('SelectionMask').colorAttachments[0].texture;
		const selectionBlurredTexture = <AbstractTexture2D>this.getPhysicalResource('SelectionBlurred').colorAttachments[0].texture;
		const skyViewLUT = <AbstractTexture2D>this.getPhysicalResource('SkyViewLUT').colorAttachments[0].texture;
		const aerialPerspectiveLUT = <AbstractTexture3D>this.getPhysicalResource('AerialPerspectiveLUT').colorAttachments[0].texture;
		const transmittanceLUT = <AbstractTexture3D>this.getPhysicalResource('TransmittanceLUT').colorAttachments[0].texture;

		const csmBuffers = csm.getUniformsBuffers();

		this.renderer.beginRenderPass(this.getPhysicalResource('HDR'));

		this.shadingMaterial.getUniform('tColor').value = colorTexture;
		this.shadingMaterial.getUniform('tNormal').value = normalTexture;
		this.shadingMaterial.getUniform('tPosition').value = positionTexture;
		this.shadingMaterial.getUniform('tShadowMaps').value = shadowMapsTexture;
		this.shadingMaterial.getUniform('tSSAO').value = ssaoTexture;
		this.shadingMaterial.getUniform('tSelectionMask').value = selectionMaskTexture;
		this.shadingMaterial.getUniform('tSelectionBlurred').value = selectionBlurredTexture;
		this.shadingMaterial.getUniform('viewMatrix').value = new Float32Array(camera.matrixWorld.values);
		this.shadingMaterial.getUniform('sunDirection').value = sunDirection;
		this.shadingMaterial.getUniform('tSkyViewLUT').value = skyViewLUT;
		this.shadingMaterial.getUniform('tAerialPerspectiveLUT').value = aerialPerspectiveLUT;
		this.shadingMaterial.getUniform('tTransmittanceLUT').value = transmittanceLUT;

		for (const [key, value] of Object.entries(csmBuffers)) {
			this.shadingMaterial.getUniform(key + '[0]', 'CSM').value = value;
		}

		this.shadingMaterial.updateUniformBlock('CSM');

		this.renderer.useMaterial(this.shadingMaterial);

		this.fullScreenTriangle.mesh.draw();
	}

	public setSize(width: number, height: number): void {

	}
}