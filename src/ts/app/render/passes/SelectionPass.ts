import Pass from '~/app/render/passes/Pass';
import * as RG from "~/render-graph";
import RenderPassResource from '~/app/render/render-graph/resources/RenderPassResource';
import PassManager from '~/app/render/PassManager';
import AbstractMaterial from '~/renderer/abstract-renderer/AbstractMaterial';
import AbstractTexture2D from '~/renderer/abstract-renderer/AbstractTexture2D';
import FullScreenTriangle from '~/app/objects/FullScreenTriangle';
import {UniformFloat2, UniformMatrix4, UniformUint1} from "~/renderer/abstract-renderer/Uniform";
import PickingSystem from "~/app/systems/PickingSystem";
import SelectionBlurMaterialContainer from "~/app/render/materials/SelectionBlurMaterialContainer";
import BuildingMaskMaterialContainer from "~/app/render/materials/BuildingMaskMaterialContainer";
import Mat4 from "~/math/Mat4";

export default class SelectionPass extends Pass<{
	GBuffer: {
		type: RG.InternalResourceType.Input;
		resource: RenderPassResource;
	};
	SelectionMask: {
		type: RG.InternalResourceType.Output;
		resource: RenderPassResource;
	};
	SelectionBlurTemp: {
		type: RG.InternalResourceType.Local;
		resource: RenderPassResource;
	};
	SelectionBlurred: {
		type: RG.InternalResourceType.Output;
		resource: RenderPassResource;
	};
}> {
	private fullScreenTriangle: FullScreenTriangle;
	private maskMaterial: AbstractMaterial;
	private blurMaterial: AbstractMaterial;

	public constructor(manager: PassManager) {
		super('SelectionPass', manager, {
			GBuffer: {type: RG.InternalResourceType.Input, resource: manager.getSharedResource('GBufferRenderPass')},
			SelectionMask: {type: RG.InternalResourceType.Output, resource: manager.getSharedResource('SelectionMask')},
			SelectionBlurTemp: {type: RG.InternalResourceType.Local, resource: manager.getSharedResource('SelectionBlurTemp')},
			SelectionBlurred: {type: RG.InternalResourceType.Output, resource: manager.getSharedResource('SelectionBlurred')},
		});

		this.init();
	}

	private init(): void {
		this.maskMaterial = new BuildingMaskMaterialContainer(this.renderer).material;
		this.blurMaterial = new SelectionBlurMaterialContainer(this.renderer).material;
		this.fullScreenTriangle = new FullScreenTriangle(this.renderer);
	}

	public render(): void {
		const selectedTileBuilding = this.manager.systemManager.getSystem(PickingSystem).selectedTileBuilding;

		if (!selectedTileBuilding || !selectedTileBuilding.holder) {
			this.getPhysicalResource('SelectionBlurred').clearAttachments([0], false);
			return;
		}

		const buildingTile = selectedTileBuilding.holder
		const buildingLocalId = buildingTile.buildingPackedToLocalMap.get(selectedTileBuilding.id);
		const camera = this.manager.sceneSystem.objects.camera;

		if (!buildingTile.buildings.inCameraFrustum(camera)) {
			return;
		}

		this.renderer.beginRenderPass(this.getPhysicalResource('SelectionMask'));
		this.renderer.useMaterial(this.maskMaterial);

		const mvMatrix = Mat4.multiply(camera.matrixWorldInverse, buildingTile.matrixWorld);

		this.maskMaterial.getUniform<UniformMatrix4>('modelViewMatrix', 'MainBlock').value = new Float32Array(mvMatrix.values);
		this.maskMaterial.getUniform<UniformMatrix4>('projectionMatrix', 'MainBlock').value = new Float32Array(camera.projectionMatrix.values);
		this.maskMaterial.getUniform<UniformUint1>('selectedId', 'MainBlock').value[0] = buildingLocalId;
		this.maskMaterial.updateUniformBlock('MainBlock');

		buildingTile.buildings.draw();

		this.blurMaterial.getUniform('tMap').value = <AbstractTexture2D>this.getPhysicalResource('SelectionMask').colorAttachments[0].texture;
		this.blurMaterial.getUniform<UniformFloat2>('direction', 'MainBlock').value[0] = 2;
		this.blurMaterial.getUniform<UniformFloat2>('direction', 'MainBlock').value[1] = 0;
		this.blurMaterial.updateUniformBlock('MainBlock');

		this.renderer.beginRenderPass(this.getPhysicalResource('SelectionBlurTemp'));
		this.renderer.useMaterial(this.blurMaterial);

		this.fullScreenTriangle.mesh.draw();

		this.blurMaterial.getUniform('tMap').value = <AbstractTexture2D>this.getPhysicalResource('SelectionBlurTemp').colorAttachments[0].texture;
		this.blurMaterial.getUniform<UniformFloat2>('direction', 'MainBlock').value[0] = 0;
		this.blurMaterial.getUniform<UniformFloat2>('direction', 'MainBlock').value[1] = 2;
		this.blurMaterial.updateUniform('tMap');
		this.blurMaterial.updateUniformBlock('MainBlock');

		this.renderer.beginRenderPass(this.getPhysicalResource('SelectionBlurred'));
		this.renderer.useMaterial(this.blurMaterial);

		this.fullScreenTriangle.mesh.draw();
	}

	public setSize(width: number, height: number): void {

	}
}