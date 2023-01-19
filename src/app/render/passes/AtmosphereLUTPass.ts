import Pass from './Pass';
import * as RG from "~/lib/render-graph";
import RenderPassResource from '../render-graph/resources/RenderPassResource';
import PassManager from '../PassManager';
import AbstractMaterial from '~/lib/renderer/abstract-renderer/AbstractMaterial';
import FullScreenTriangle from '../../objects/FullScreenTriangle';
import AtmosphereTransmittanceMaterialContainer from "../materials/AtmosphereTransmittanceMaterialContainer";
import AtmosphereMultipleScatteringMaterialContainer
	from "../materials/AtmosphereMultipleScatteringMaterialContainer";
import {UniformFloat1, UniformFloat3, UniformMatrix4} from "~/lib/renderer/abstract-renderer/Uniform";
import AbstractTexture2D from "~/lib/renderer/abstract-renderer/AbstractTexture2D";
import AtmosphereSkyViewMaterialContainer from "../materials/AtmosphereSkyViewMaterialContainer";
import Vec3 from "~/lib/math/Vec3";
import AtmosphereAerialPerspectiveMaterialContainer
	from "../materials/AtmosphereAerialPerspectiveMaterialContainer";
import AtmosphereSkyboxMaterialContainer from "../materials/AtmosphereSkyboxMaterialContainer";
import TextureResource from "../render-graph/resources/TextureResource";
import AbstractRenderPass from "~/lib/renderer/abstract-renderer/AbstractRenderPass";
import AbstractTexture3D from "~/lib/renderer/abstract-renderer/AbstractTexture3D";
import {RendererTypes} from "~/lib/renderer/RendererTypes";

const AerialPerspectiveSlices = 16;
const AerialPerspectiveSliceStep = 8;

export default class AtmosphereLUTPass extends Pass<{
	Transmittance: {
		type: RG.InternalResourceType.Output;
		resource: RenderPassResource;
	};
	MultipleScattering: {
		type: RG.InternalResourceType.Local;
		resource: RenderPassResource;
	};
	SkyView: {
		type: RG.InternalResourceType.Output;
		resource: RenderPassResource;
	};
	AerialPerspective: {
		type: RG.InternalResourceType.Output;
		resource: TextureResource;
	};
	Skybox: {
		type: RG.InternalResourceType.Output;
		resource: RenderPassResource;
	};
}> {
	private fullScreenTriangle: FullScreenTriangle;
	private transmittanceMaterial: AbstractMaterial;
	private multipleScatteringMaterial: AbstractMaterial;
	private skyViewMaterial: AbstractMaterial;
	private aerialPerspectiveMaterial: AbstractMaterial;
	private skyboxMaterial: AbstractMaterial;
	private staticLUTsReady: boolean = false;
	private aerialPerspectiveRenderPass: AbstractRenderPass;

	public constructor(manager: PassManager) {
		super('AtmosphereLUTPass', manager, {
			Transmittance: {type: RG.InternalResourceType.Output, resource: manager.getSharedResource('AtmosphereTransmittanceLUT')},
			MultipleScattering: {type: RG.InternalResourceType.Local, resource: manager.getSharedResource('AtmosphereMultipleScatteringLUT')},
			SkyView: {type: RG.InternalResourceType.Output, resource: manager.getSharedResource('SkyViewLUT')},
			AerialPerspective: {type: RG.InternalResourceType.Output, resource: manager.getSharedResource('AerialPerspectiveLUT')},
			Skybox: {type: RG.InternalResourceType.Output, resource: manager.getSharedResource('AtmosphereSkybox')},
		});

		this.init();
	}

	private init(): void {
		this.transmittanceMaterial = new AtmosphereTransmittanceMaterialContainer(this.renderer).material;
		this.multipleScatteringMaterial = new AtmosphereMultipleScatteringMaterialContainer(this.renderer).material;
		this.skyViewMaterial = new AtmosphereSkyViewMaterialContainer(this.renderer).material;
		this.aerialPerspectiveMaterial = new AtmosphereAerialPerspectiveMaterialContainer(this.renderer).material;
		this.skyboxMaterial = new AtmosphereSkyboxMaterialContainer(this.renderer).material;
		this.fullScreenTriangle = new FullScreenTriangle(this.renderer);
	}

	public render(): void {
		const camera = this.manager.sceneSystem.objects.camera;
		const lightDirection = new Float32Array([...Vec3.toArray(this.manager.mapTimeSystem.sunDirection)]);
		const transmittanceLUT = <AbstractTexture2D>this.getPhysicalResource('Transmittance').colorAttachments[0].texture;
		const multipleScatteringLUT = <AbstractTexture2D>this.getPhysicalResource('MultipleScattering').colorAttachments[0].texture;

		if (!this.staticLUTsReady) {
			this.renderer.beginRenderPass(this.getPhysicalResource('Transmittance'));
			this.renderer.useMaterial(this.transmittanceMaterial);

			this.fullScreenTriangle.mesh.draw();

			this.multipleScatteringMaterial.getUniform('tTransmittanceLUT').value = transmittanceLUT;

			this.renderer.beginRenderPass(this.getPhysicalResource('MultipleScattering'));
			this.renderer.useMaterial(this.multipleScatteringMaterial);

			this.fullScreenTriangle.mesh.draw();

			this.staticLUTsReady = true;
		}

		this.skyViewMaterial.getUniform('tTransmittanceLUT').value = transmittanceLUT;
		this.skyViewMaterial.getUniform('tMultipleScatteringLUT').value = multipleScatteringLUT;
		this.skyViewMaterial.getUniform<UniformFloat3>('sunDirection', 'Uniforms').value = lightDirection;
		this.skyViewMaterial.getUniform<UniformFloat3>('cameraHeight', 'Uniforms').value[0] = camera.position.y / 1e6;
		this.skyViewMaterial.updateUniformBlock('Uniforms');

		this.renderer.beginRenderPass(this.getPhysicalResource('SkyView'));
		this.renderer.useMaterial(this.skyViewMaterial);

		this.fullScreenTriangle.mesh.draw();

		const aerialPerspectiveTexture = <AbstractTexture3D>this.getPhysicalResource('AerialPerspective');

		this.aerialPerspectiveMaterial.getUniform('tTransmittanceLUT').value = transmittanceLUT;
		this.aerialPerspectiveMaterial.getUniform('tMultipleScatteringLUT').value = multipleScatteringLUT;
		this.aerialPerspectiveMaterial.getUniform<UniformMatrix4>('projectionMatrixInverse', 'Common').value =
			new Float32Array(camera.projectionMatrixInverse.values);
		this.aerialPerspectiveMaterial.getUniform<UniformMatrix4>('viewMatrixInverse', 'Common').value =
			new Float32Array(camera.matrixWorld.values);
		this.aerialPerspectiveMaterial.getUniform<UniformFloat3>('cameraPosition', 'Common').value = new Float32Array([
			camera.position.x,
			camera.position.y,
			camera.position.z
		]);
		this.aerialPerspectiveMaterial.getUniform<UniformFloat3>('sunDirection', 'Common').value = lightDirection;
		this.aerialPerspectiveMaterial.updateUniformBlock('Common');

		this.renderer.useMaterial(this.aerialPerspectiveMaterial);

		{
			for (let i = 0; i < AerialPerspectiveSlices; i += AerialPerspectiveSliceStep) {
				const colorAttachments = [];

				for (let j = i; j < i + AerialPerspectiveSliceStep; j++) {
					colorAttachments.push({
						texture: aerialPerspectiveTexture,
						clearValue: {r: 0, g: 0, b: 0, a: 0},
						loadOp: RendererTypes.AttachmentLoadOp.Load,
						storeOp: RendererTypes.AttachmentStoreOp.Store,
						slice: j
					});
				}

				if (!this.aerialPerspectiveRenderPass) {
					this.aerialPerspectiveRenderPass = this.renderer.createRenderPass({
						colorAttachments: colorAttachments
					});
				} else {
					this.aerialPerspectiveRenderPass.colorAttachments.length = 0;
					this.aerialPerspectiveRenderPass.colorAttachments.push(...colorAttachments);
				}

				this.renderer.beginRenderPass(this.aerialPerspectiveRenderPass);

				this.aerialPerspectiveMaterial.getUniform<UniformFloat1>('sliceIndexOffset', 'PerDraw').value[0] = i;
				this.aerialPerspectiveMaterial.updateUniformBlock('PerDraw');

				this.fullScreenTriangle.mesh.draw();
			}
		}

		const skyboxRenderPass = this.getPhysicalResource('Skybox');

		this.renderer.beginRenderPass(skyboxRenderPass);

		this.skyboxMaterial.getUniform('tMap').value = <AbstractTexture2D>this.getPhysicalResource('SkyView').colorAttachments[0].texture;
		this.renderer.useMaterial(this.skyboxMaterial);

		for (let i = 0; i < 6; i++) {
			this.skyboxMaterial.getUniform<UniformFloat1>('faceId', 'MainBlock').value[0] = i;
			this.skyboxMaterial.updateUniformBlock('MainBlock');

			skyboxRenderPass.colorAttachments[0].slice = i;
			this.renderer.beginRenderPass(skyboxRenderPass);

			this.fullScreenTriangle.mesh.draw();
		}

		skyboxRenderPass.colorAttachments[0].texture.generateMipmaps();
	}

	public setSize(width: number, height: number): void {

	}
}