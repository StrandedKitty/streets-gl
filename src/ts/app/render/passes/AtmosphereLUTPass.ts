import Pass from '~/app/render/passes/Pass';
import * as RG from "~/render-graph";
import RenderPassResource from '~/app/render/render-graph/resources/RenderPassResource';
import PassManager from '~/app/render/PassManager';
import AbstractMaterial from '~/renderer/abstract-renderer/AbstractMaterial';
import FullScreenTriangle from '~/app/objects/FullScreenTriangle';
import AtmosphereTransmittanceMaterialContainer from "~/app/render/materials/AtmosphereTransmittanceMaterialContainer";
import AtmosphereMultipleScatteringMaterialContainer
	from "~/app/render/materials/AtmosphereMultipleScatteringMaterialContainer";
import {UniformFloat1, UniformFloat3, UniformMatrix4} from "~/renderer/abstract-renderer/Uniform";
import AbstractTexture2D from "~/renderer/abstract-renderer/AbstractTexture2D";
import AtmosphereSkyViewMaterialContainer from "~/app/render/materials/AtmosphereSkyViewMaterialContainer";
import Vec3 from "~/math/Vec3";
import AtmosphereAerialPerspectiveMaterialContainer
	from "~/app/render/materials/AtmosphereAerialPerspectiveMaterialContainer";
import AtmosphereSkyboxMaterialContainer from "~/app/render/materials/AtmosphereSkyboxMaterialContainer";

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
		resource: RenderPassResource;
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

		const aerialPerspectiveRenderPass = this.getPhysicalResource('AerialPerspective');

		this.aerialPerspectiveMaterial.getUniform('tTransmittanceLUT').value = transmittanceLUT;
		this.aerialPerspectiveMaterial.getUniform('tMultipleScatteringLUT').value = multipleScatteringLUT;
		this.aerialPerspectiveMaterial.getUniform<UniformMatrix4>('projectionMatrixInverse', 'MainBlock').value =
			new Float32Array(camera.projectionMatrixInverse.values);
		this.aerialPerspectiveMaterial.getUniform<UniformMatrix4>('viewMatrixInverse', 'MainBlock').value =
			new Float32Array(camera.matrixWorld.values);
		this.aerialPerspectiveMaterial.getUniform<UniformFloat3>('cameraPosition', 'MainBlock').value = new Float32Array([
			camera.position.x,
			camera.position.y,
			camera.position.z
		]);
		this.aerialPerspectiveMaterial.getUniform<UniformFloat3>('sunDirection', 'MainBlock').value = lightDirection;
		this.aerialPerspectiveMaterial.updateUniformBlock('MainBlock');

		this.renderer.useMaterial(this.aerialPerspectiveMaterial);

		for (let i = 0; i < 16; i++) {
			this.aerialPerspectiveMaterial.getUniform<UniformFloat1>('sliceIndex', 'PerSlice').value[0] = i;
			this.aerialPerspectiveMaterial.updateUniformBlock('PerSlice');

			aerialPerspectiveRenderPass.colorAttachments[0].slice = i;
			this.renderer.beginRenderPass(aerialPerspectiveRenderPass);

			this.fullScreenTriangle.mesh.draw();
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