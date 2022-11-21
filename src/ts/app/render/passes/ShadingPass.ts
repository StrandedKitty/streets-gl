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
import AbstractTextureCube from "~/renderer/abstract-renderer/AbstractTextureCube";
import SettingsManager from "~/app/ui/SettingsManager";

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
	AtmosphereSkybox: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	SSR: {
		type: InternalResourceType.Local;
		resource: RenderPassResource;
	};
}> {
	private readonly shadingMaterial: AbstractMaterial;
	private readonly fullScreenTriangle: FullScreenTriangle;
	private ssaoEnabled: boolean = true;
	private ssrEnabled: boolean = true;

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
			AtmosphereSkybox: {type: InternalResourceType.Input, resource: manager.getSharedResource('AtmosphereSkybox')},
			SSR: {type: InternalResourceType.Local, resource: manager.getSharedResource('SSR')},
		});

		this.fullScreenTriangle = new FullScreenTriangle(this.renderer);
		this.shadingMaterial = new ShadingMaterialContainer(this.renderer).material;

		SettingsManager.onSettingChange('ssao', ({statusValue}) => {
			if (statusValue === 'on') {
				this.setResource('SSAO', manager.getSharedResource('SSAOResult'));
				this.ssaoEnabled = true;
				this.shadingMaterial.defines.SSAO_ENABLED = '1';
			} else {
				this.setResource('SSAO', null);
				this.ssaoEnabled = false;
				this.shadingMaterial.defines.SSAO_ENABLED = '0';
			}

			// @ts-ignore
			this.shadingMaterial.recompile();
		});
		SettingsManager.onSettingChange('ssr', ({statusValue}) => {
			if (statusValue === 'off') {
				this.setResource('SSR', null);
				this.ssrEnabled = false;
				this.shadingMaterial.defines.SSR_ENABLED = '1';
			} else {
				this.setResource('SSR', manager.getSharedResource('SSR'));
				this.ssrEnabled = true;
				this.shadingMaterial.defines.SSR_ENABLED = '0';
			}

			// @ts-ignore
			this.shadingMaterial.recompile();
		});
	}

	public render(): void {
		const camera = this.manager.sceneSystem.objects.camera;
		const csm = this.manager.sceneSystem.objects.csm;
		const sunDirection = new Float32Array([...Vec3.toArray(this.manager.mapTimeSystem.sunDirection)]);
		const skyDirectionMatrix = new Float32Array(this.manager.mapTimeSystem.skyDirectionMatrix.values);

		const colorTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').colorAttachments[0].texture;
		const normalTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').colorAttachments[1].texture;
		const depthTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').depthAttachment.texture;
		const motionTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').colorAttachments[3].texture;
		const shadowMapsTexture = <AbstractTexture2DArray>this.getPhysicalResource('ShadowMaps').depthAttachment.texture;
		const selectionMaskTexture = <AbstractTexture2D>this.getPhysicalResource('SelectionMask').colorAttachments[0].texture;
		const selectionBlurredTexture = <AbstractTexture2D>this.getPhysicalResource('SelectionBlurred').colorAttachments[0].texture;
		const aerialPerspectiveLUT = <AbstractTexture3D>this.getPhysicalResource('AerialPerspectiveLUT').colorAttachments[0].texture;
		const transmittanceLUT = <AbstractTexture3D>this.getPhysicalResource('TransmittanceLUT').colorAttachments[0].texture;
		const atmosphereSkyboxTexture = <AbstractTextureCube>this.getPhysicalResource('AtmosphereSkybox').colorAttachments[0].texture;

		let ssaoTexture = null;
		if (this.ssaoEnabled) {
			ssaoTexture = <AbstractTexture2D>this.getPhysicalResource('SSAO').colorAttachments[0].texture;
		}

		let ssrTexture = null;
		if (this.ssrEnabled) {
			ssrTexture = <AbstractTexture2D>this.getPhysicalResource('SSR').colorAttachments[0].texture;
		}

		const csmBuffers = csm.getUniformsBuffers();

		this.renderer.beginRenderPass(this.getPhysicalResource('HDR'));

		this.shadingMaterial.getUniform('tColor').value = colorTexture;
		this.shadingMaterial.getUniform('tNormal').value = normalTexture;
		this.shadingMaterial.getUniform('tDepth').value = depthTexture;
		this.shadingMaterial.getUniform('tShadowMaps').value = shadowMapsTexture;
		this.shadingMaterial.getUniform('tSSAO').value = ssaoTexture;
		this.shadingMaterial.getUniform('tSelectionMask').value = selectionMaskTexture;
		this.shadingMaterial.getUniform('tSelectionBlurred').value = selectionBlurredTexture;
		this.shadingMaterial.getUniform('viewMatrix', 'MainBlock').value = new Float32Array(camera.matrixWorld.values);
		this.shadingMaterial.getUniform('projectionMatrixInverse', 'MainBlock').value = new Float32Array(camera.jitteredProjectionMatrixInverse.values);
		this.shadingMaterial.getUniform('sunDirection', 'MainBlock').value = sunDirection;
		this.shadingMaterial.getUniform('tAerialPerspectiveLUT').value = aerialPerspectiveLUT;
		this.shadingMaterial.getUniform('tTransmittanceLUT').value = transmittanceLUT;
		this.shadingMaterial.getUniform('tSSR').value = ssrTexture;
		this.shadingMaterial.getUniform('tMotion').value = motionTexture;
		this.shadingMaterial.getUniform('tAtmosphere').value = atmosphereSkyboxTexture;
		this.shadingMaterial.getUniform('skyRotationMatrix', 'MainBlock').value = skyDirectionMatrix;

		for (const [key, value] of Object.entries(csmBuffers)) {
			this.shadingMaterial.getUniform(key + '[0]', 'CSM').value = value;
		}

		this.shadingMaterial.updateUniformBlock('CSM');
		this.shadingMaterial.updateUniformBlock('MainBlock');

		this.renderer.useMaterial(this.shadingMaterial);

		this.fullScreenTriangle.mesh.draw();
	}

	public setSize(width: number, height: number): void {

	}
}