import AbstractMaterial from "~/renderer/abstract-renderer/AbstractMaterial";
import {UniformMatrix4} from "~/renderer/abstract-renderer/Uniform";
import Tile from "~/app/objects/Tile";
import Mat4 from "../../../math/Mat4";
import Pass from "~/app/render/passes/Pass";
import RenderPassResource from "~/app/render/render-graph/resources/RenderPassResource";
import {InternalResourceType} from '~/render-graph/Pass';
import PassManager from '~/app/render/PassManager';
import BuildingMaterialContainer from "~/app/render/materials/BuildingMaterialContainer";
import SkyboxMaterialContainer from "~/app/render/materials/SkyboxMaterialContainer";
import GroundMaterialContainer from "~/app/render/materials/GroundMaterialContainer";
import RoadMaterialContainer from "~/app/render/materials/RoadMaterialContainer";

export default class GBufferPass extends Pass<{
	GBufferRenderPass: {
		type: InternalResourceType.Output;
		resource: RenderPassResource;
	};
}> {
	private buildingMaterial: AbstractMaterial;
	private groundMaterial: AbstractMaterial;
	private roadMaterial: AbstractMaterial;
	private skyboxMaterial: AbstractMaterial;
	private cameraMatrixWorldInversePrev: Mat4 = null;
	public objectIdBuffer: Uint32Array = new Uint32Array(1);
	public objectIdX = 0;
	public objectIdY = 0;

	public constructor(manager: PassManager) {
		super('GBufferPass', manager, {
			GBufferRenderPass: {type: InternalResourceType.Output, resource: manager.getSharedResource('GBufferRenderPass')}
		});

		this.createMaterials();
	}

	private createMaterials(): void {
		const buildingMaterialContainer = new BuildingMaterialContainer(this.renderer);
		this.buildingMaterial = buildingMaterialContainer.material;

		const groundMaterialContainer = new GroundMaterialContainer(this.renderer);
		this.groundMaterial = groundMaterialContainer.material;

		const roadMaterialContainer = new RoadMaterialContainer(this.renderer);
		this.roadMaterial = roadMaterialContainer.material;

		const skyboxMaterialContainer = new SkyboxMaterialContainer(this.renderer);
		this.skyboxMaterial = skyboxMaterialContainer.material;
	}

	public render(): void {
		const camera = this.manager.sceneSystem.objects.camera;
		const skybox = this.manager.sceneSystem.objects.skybox;
		const tiles = this.manager.sceneSystem.objects.tiles.children as Tile[];

		if (!this.cameraMatrixWorldInversePrev) {
			this.cameraMatrixWorldInversePrev = camera.matrixWorldInverse;
		} else {
			const pivotDelta = this.manager.sceneSystem.pivotDelta;

			this.cameraMatrixWorldInversePrev = Mat4.translate(
				this.cameraMatrixWorldInversePrev,
				pivotDelta.x,
				0,
				pivotDelta.y
			);
		}

		const testRenderPass = this.getPhysicalResource('GBufferRenderPass');

		this.renderer.beginRenderPass(testRenderPass);

		this.renderer.useMaterial(this.skyboxMaterial);

		this.skyboxMaterial.getUniform<UniformMatrix4>('projectionMatrix', 'Uniforms').value = new Float32Array(camera.projectionMatrix.values);
		this.skyboxMaterial.getUniform<UniformMatrix4>('modelViewMatrix', 'Uniforms').value = new Float32Array(Mat4.multiply(camera.matrixWorldInverse, skybox.matrixWorld).values);
		this.skyboxMaterial.getUniform<UniformMatrix4>('modelViewMatrixPrev', 'Uniforms').value = new Float32Array(Mat4.multiply(this.cameraMatrixWorldInversePrev, skybox.matrixWorld).values);
		this.skyboxMaterial.applyUniformUpdates('projectionMatrix', 'Uniforms');
		this.skyboxMaterial.applyUniformUpdates('modelViewMatrix', 'Uniforms');
		this.skyboxMaterial.applyUniformUpdates('modelViewMatrixPrev', 'Uniforms');

		skybox.draw();

		this.renderer.useMaterial(this.buildingMaterial);

		this.buildingMaterial.getUniform<UniformMatrix4>('projectionMatrix', 'PerMaterial').value = new Float32Array(camera.projectionMatrix.values);
		this.buildingMaterial.applyUniformUpdates('projectionMatrix', 'PerMaterial');

		for (const tile of tiles) {
			if (!tile.buildings) {
				continue;
			}

			const mvMatrix = Mat4.multiply(camera.matrixWorldInverse, tile.matrixWorld);
			const mvMatrixPrev = Mat4.multiply(this.cameraMatrixWorldInversePrev, tile.matrixWorld);

			this.buildingMaterial.getUniform<UniformMatrix4>('modelViewMatrix', 'PerMesh').value = new Float32Array(mvMatrix.values);
			this.buildingMaterial.getUniform<UniformMatrix4>('modelViewMatrixPrev', 'PerMesh').value = new Float32Array(mvMatrixPrev.values);
			this.buildingMaterial.getUniform<UniformMatrix4>('tileId', 'PerMesh').value[0] = tile.localId;
			this.buildingMaterial.applyUniformUpdates('modelViewMatrix', 'PerMesh');
			this.buildingMaterial.applyUniformUpdates('modelViewMatrixPrev', 'PerMesh');
			this.buildingMaterial.applyUniformUpdates('tileId', 'PerMesh');

			tile.buildings.draw();
		}

		this.renderer.useMaterial(this.groundMaterial);

		this.groundMaterial.getUniform<UniformMatrix4>('projectionMatrix', 'PerMaterial').value = new Float32Array(camera.projectionMatrix.values);
		this.groundMaterial.applyUniformUpdates('projectionMatrix', 'PerMaterial');

		for (const tile of tiles) {
			if (!tile.ground) {
				continue;
			}

			const mvMatrix = Mat4.multiply(camera.matrixWorldInverse, tile.matrixWorld);
			const mvMatrixPrev = Mat4.multiply(this.cameraMatrixWorldInversePrev, tile.matrixWorld);

			this.groundMaterial.getUniform<UniformMatrix4>('modelViewMatrix', 'PerMesh').value = new Float32Array(mvMatrix.values);
			this.groundMaterial.getUniform<UniformMatrix4>('modelViewMatrixPrev', 'PerMesh').value = new Float32Array(mvMatrixPrev.values);
			this.groundMaterial.applyUniformUpdates('modelViewMatrix', 'PerMesh');
			this.groundMaterial.applyUniformUpdates('modelViewMatrixPrev', 'PerMesh');

			tile.ground.draw();
		}

		this.renderer.useMaterial(this.roadMaterial);

		this.roadMaterial.getUniform<UniformMatrix4>('projectionMatrix', 'PerMaterial').value = new Float32Array(camera.projectionMatrix.values);
		this.roadMaterial.applyUniformUpdates('projectionMatrix', 'PerMaterial');

		for (const tile of tiles) {
			if (!tile.roads) {
				continue;
			}

			const mvMatrix = Mat4.multiply(camera.matrixWorldInverse, tile.matrixWorld);
			const mvMatrixPrev = Mat4.multiply(this.cameraMatrixWorldInversePrev, tile.matrixWorld);

			this.roadMaterial.getUniform<UniformMatrix4>('modelViewMatrix', 'PerMesh').value = new Float32Array(mvMatrix.values);
			this.roadMaterial.getUniform<UniformMatrix4>('modelViewMatrixPrev', 'PerMesh').value = new Float32Array(mvMatrixPrev.values);
			this.roadMaterial.applyUniformUpdates('modelViewMatrix', 'PerMesh');
			this.roadMaterial.applyUniformUpdates('modelViewMatrixPrev', 'PerMesh');

			tile.roads.draw();
		}

		//testRenderPass.readColorAttachmentPixel(4, this.objectIdBuffer, this.objectIdX, this.objectIdY);

		this.saveCameraMatrixWorldInverse();
	}

	private saveCameraMatrixWorldInverse(): void {
		this.cameraMatrixWorldInversePrev = this.manager.sceneSystem.objects.camera.matrixWorldInverse;
	}

	public setSize(width: number, height: number): void {

	}
}