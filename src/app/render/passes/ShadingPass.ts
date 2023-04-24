import Pass from "./Pass";
import * as RG from "~/lib/render-graph";
import {InternalResourceType} from "~/lib/render-graph";
import RenderPassResource from "../render-graph/resources/RenderPassResource";
import PassManager from "../PassManager";
import AbstractTexture2D from "~/lib/renderer/abstract-renderer/AbstractTexture2D";
import AbstractMaterial from "~/lib/renderer/abstract-renderer/AbstractMaterial";
import FullScreenTriangle from "../../objects/FullScreenTriangle";
import AbstractTexture2DArray from "~/lib/renderer/abstract-renderer/AbstractTexture2DArray";
import ShadingMaterialContainer from "../materials/ShadingMaterialContainer";
import AbstractTexture3D from "~/lib/renderer/abstract-renderer/AbstractTexture3D";
import Vec3 from "~/lib/math/Vec3";
import AbstractTextureCube from "~/lib/renderer/abstract-renderer/AbstractTextureCube";
import TextureResource from "../render-graph/resources/TextureResource";

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
		resource: TextureResource;
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
	}

	private getShadowMapsTexture(): AbstractTexture2DArray | null {
		let texture = null;

		if (this.getResource('ShadowMaps')) {
			texture = <AbstractTexture2DArray>this.getPhysicalResource('ShadowMaps').depthAttachment.texture;
		}

		return texture;
	}

	private getSSAOTexture(): AbstractTexture2D | null {
		let texture = null;

		if (this.getResource('SSAO')) {
			texture = <AbstractTexture2D>this.getPhysicalResource('SSAO').colorAttachments[0].texture;
		}

		return texture;
	}

	private getSSRTexture(): AbstractTexture2D | null {
		let texture = null;

		if (this.getResource('SSR')) {
			texture = <AbstractTexture2D>this.getPhysicalResource('SSR').colorAttachments[0].texture;
		}

		return texture;
	}

	private updateShadingMaterialDefines(): void {
		let needsRecompilation = false;

		const newValues = {
			SHADOW_ENABLED: this.getResource('ShadowMaps') ? '1' : '0',
			SSAO_ENABLED: this.getResource('SSAO') ? '1' : '0',
			SSR_ENABLED: this.getResource('SSR') ? '1' : '0',
			SHADOW_CASCADES: this.getResource('ShadowMaps') ?
				this.getResource('ShadowMaps').descriptor.depthAttachment.texture.depth.toString() :
				this.shadingMaterial.defines.SHADOW_CASCADES
		};

		for (const [k, v] of Object.entries(newValues)) {
			if (this.shadingMaterial.defines[k] !== v) {
				this.shadingMaterial.defines[k] = v;
				needsRecompilation = true;
			}
		}

		if (needsRecompilation) {
			this.shadingMaterial.recompile();
		}
	}

	public render(): void {
		this.updateShadingMaterialDefines();

		const camera = this.manager.sceneSystem.objects.camera;
		const csm = this.manager.sceneSystem.objects.csm;
		const sunDirection = new Float32Array([...Vec3.toArray(this.manager.mapTimeSystem.sunDirection)]);
		const skyDirectionMatrix = new Float32Array(this.manager.mapTimeSystem.skyDirectionMatrix.values);

		const colorTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').colorAttachments[0].texture;
		const normalTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').colorAttachments[1].texture;
		const depthTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').depthAttachment.texture;
		const roughnessMetalnessTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').colorAttachments[2].texture;
		const glowTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').colorAttachments[5].texture;
		const motionTexture = <AbstractTexture2D>this.getPhysicalResource('GBuffer').colorAttachments[3].texture;
		const selectionMaskTexture = <AbstractTexture2D>this.getPhysicalResource('SelectionMask').colorAttachments[0].texture;
		const selectionBlurredTexture = <AbstractTexture2D>this.getPhysicalResource('SelectionBlurred').colorAttachments[0].texture;
		const aerialPerspectiveLUT = <AbstractTexture3D>this.getPhysicalResource('AerialPerspectiveLUT');
		const transmittanceLUT = <AbstractTexture3D>this.getPhysicalResource('TransmittanceLUT').colorAttachments[0].texture;
		const atmosphereSkyboxTexture = <AbstractTextureCube>this.getPhysicalResource('AtmosphereSkybox').colorAttachments[0].texture;
		const shadowMapsTexture = this.getShadowMapsTexture();
		const ssaoTexture = this.getSSAOTexture();
		const ssrTexture = this.getSSRTexture();

		const csmBuffers = csm.getUniformsBuffers();

		this.renderer.beginRenderPass(this.getPhysicalResource('HDR'));

		this.shadingMaterial.getUniform('tColor').value = colorTexture;
		this.shadingMaterial.getUniform('tNormal').value = normalTexture;
		this.shadingMaterial.getUniform('tDepth').value = depthTexture;
		this.shadingMaterial.getUniform('tRoughnessMetalness').value = roughnessMetalnessTexture;
		this.shadingMaterial.getUniform('tGlow').value = glowTexture;
		this.shadingMaterial.getUniform('tShadowMaps').value = shadowMapsTexture;
		this.shadingMaterial.getUniform('tSSAO').value = ssaoTexture;
		this.shadingMaterial.getUniform('tSelectionMask').value = selectionMaskTexture;
		this.shadingMaterial.getUniform('tSelectionBlurred').value = selectionBlurredTexture;
		this.shadingMaterial.getUniform('viewMatrix', 'MainBlock').value = new Float32Array(camera.matrixWorld.values);
		this.shadingMaterial.getUniform('projectionMatrixInverse', 'MainBlock').value = new Float32Array(camera.projectionMatrixInverse.values);
		this.shadingMaterial.getUniform('projectionMatrixInverseJittered', 'MainBlock').value = new Float32Array(camera.jitteredProjectionMatrixInverse.values);
		this.shadingMaterial.getUniform('sunDirection', 'MainBlock').value = sunDirection;
		this.shadingMaterial.getUniform('tAerialPerspectiveLUT').value = aerialPerspectiveLUT;
		this.shadingMaterial.getUniform('tTransmittanceLUT').value = transmittanceLUT;
		this.shadingMaterial.getUniform('tSSR').value = ssrTexture;
		this.shadingMaterial.getUniform('tMotion').value = motionTexture;
		this.shadingMaterial.getUniform('tAtmosphere').value = atmosphereSkyboxTexture;
		this.shadingMaterial.getUniform('skyRotationMatrix', 'MainBlock').value = skyDirectionMatrix;

		for (const [key, value] of Object.entries(csmBuffers)) {
			this.shadingMaterial.getUniform(key, 'CSM').value = value;
		}

		this.shadingMaterial.updateUniformBlock('CSM');
		this.shadingMaterial.updateUniformBlock('MainBlock');

		this.renderer.useMaterial(this.shadingMaterial);

		this.fullScreenTriangle.mesh.draw();
	}

	public setSize(width: number, height: number): void {

	}
}