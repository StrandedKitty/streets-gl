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
import TextLabelMaterialContainer from "~/app/render/materials/TextLabelMaterialContainer";
import Tile from "~/app/objects/Tile";
import TileLabelBuffers from "~/app/objects/TileLabelBuffers";

const clearMat4Rotation = (m: Mat4): void => {
	const values = m.values;

	values[0] = 1;
	values[1] = 0;
	values[2] = 0;

	values[4] = 0;
	values[5] = 1;
	values[6] = 0;

	values[8] = 0;
	values[9] = 0;
	values[10] = 1;
};

export default class LabelPass extends Pass<{
	Labels: {
		type: RG.InternalResourceType.Output;
		resource: RenderPassResource;
	};
}> {
	private fullScreenTriangle: FullScreenTriangle;
	private textLabelMaterial: AbstractMaterial;

	public constructor(manager: PassManager) {
		super('LabelPass', manager, {
			Labels: {type: RG.InternalResourceType.Output, resource: manager.getSharedResource('Labels')}
		});

		this.init();
	}

	private init(): void {
		this.textLabelMaterial = new TextLabelMaterialContainer(this.renderer).material;
		this.fullScreenTriangle = new FullScreenTriangle(this.renderer);
	}

	public render(): void {
		const camera = this.manager.sceneSystem.objects.camera;
		const labels = this.manager.sceneSystem.objects.labels;

		if (!labels.mesh) {
			return;
		}

		this.renderer.beginRenderPass(this.getPhysicalResource('Labels'));
		this.renderer.useMaterial(this.textLabelMaterial);

		const mvMatrix = Mat4.multiply(camera.matrixWorldInverse, labels.matrixWorld);
		const mvMatrixNoRotation = Mat4.copy(mvMatrix);
		clearMat4Rotation(mvMatrixNoRotation);

		this.textLabelMaterial.getUniform<UniformMatrix4>('modelViewMatrix', 'Uniforms').value = new Float32Array(mvMatrix.values);
		this.textLabelMaterial.getUniform<UniformMatrix4>('modelViewMatrixNoRotation', 'Uniforms').value = new Float32Array(mvMatrixNoRotation.values);
		this.textLabelMaterial.getUniform<UniformMatrix4>('projectionMatrix', 'Uniforms').value = new Float32Array(camera.projectionMatrix.values);
		this.textLabelMaterial.getUniform<UniformFloat2>('resolution', 'Uniforms').value[0] = this.manager.renderSystem.resolutionScene.x;
		this.textLabelMaterial.getUniform<UniformFloat2>('resolution', 'Uniforms').value[1] = this.manager.renderSystem.resolutionScene.y;
		this.textLabelMaterial.updateUniformBlock('Uniforms');

		labels.draw();
	}

	public setSize(width: number, height: number): void {

	}
}