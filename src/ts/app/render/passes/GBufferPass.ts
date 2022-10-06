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
import FullScreenTriangle from "~/app/objects/FullScreenTriangle";

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
	private fullScreenTriangle: FullScreenTriangle;

	public constructor(manager: PassManager) {
		super('GBufferPass', manager, {
			GBufferRenderPass: {type: InternalResourceType.Output, resource: manager.getSharedResource('GBufferRenderPass')}
		});

		this.fullScreenTriangle = new FullScreenTriangle(this.renderer);

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

		const mainRenderPass = this.getPhysicalResource('GBufferRenderPass');

		this.renderer.beginRenderPass(mainRenderPass);

		this.renderer.useMaterial(this.skyboxMaterial);

		this.skyboxMaterial.getUniform<UniformMatrix4>('projectionMatrix', 'Uniforms').value = new Float32Array(camera.jitteredProjectionMatrix.values);
		this.skyboxMaterial.getUniform<UniformMatrix4>('modelViewMatrix', 'Uniforms').value = new Float32Array(Mat4.multiply(camera.matrixWorldInverse, skybox.matrixWorld).values);
		this.skyboxMaterial.getUniform<UniformMatrix4>('modelViewMatrixPrev', 'Uniforms').value = new Float32Array(Mat4.multiply(this.cameraMatrixWorldInversePrev, skybox.matrixWorld).values);
		this.skyboxMaterial.updateUniformBlock('Uniforms');

		skybox.draw();

		this.renderer.useMaterial(this.buildingMaterial);

		this.buildingMaterial.getUniform<UniformMatrix4>('projectionMatrix', 'PerMaterial').value = new Float32Array(camera.jitteredProjectionMatrix.values);
		this.buildingMaterial.updateUniformBlock('PerMaterial');

		for (const tile of tiles) {
			if (!tile.buildings || !tile.buildings.inCameraFrustum(camera)) {
				continue;
			}

			const mvMatrix = Mat4.multiply(camera.matrixWorldInverse, tile.matrixWorld);
			const mvMatrixPrev = Mat4.multiply(this.cameraMatrixWorldInversePrev, tile.matrixWorld);

			this.buildingMaterial.getUniform<UniformMatrix4>('modelViewMatrix', 'PerMesh').value = new Float32Array(mvMatrix.values);
			this.buildingMaterial.getUniform<UniformMatrix4>('modelViewMatrixPrev', 'PerMesh').value = new Float32Array(mvMatrixPrev.values);
			this.buildingMaterial.getUniform<UniformMatrix4>('tileId', 'PerMesh').value[0] = tile.localId;
			this.buildingMaterial.updateUniformBlock('PerMesh');

			tile.buildings.draw();
		}

		this.renderer.useMaterial(this.groundMaterial);

		this.groundMaterial.getUniform<UniformMatrix4>('projectionMatrix', 'PerMaterial').value = new Float32Array(camera.jitteredProjectionMatrix.values);
		this.groundMaterial.updateUniformBlock('PerMaterial');

		for (const tile of tiles) {
			if (!tile.ground || !tile.ground.inCameraFrustum(camera)) {
				continue;
			}

			const mvMatrix = Mat4.multiply(camera.matrixWorldInverse, tile.matrixWorld);
			const mvMatrixPrev = Mat4.multiply(this.cameraMatrixWorldInversePrev, tile.matrixWorld);

			this.groundMaterial.getUniform<UniformMatrix4>('modelViewMatrix', 'PerMesh').value = new Float32Array(mvMatrix.values);
			this.groundMaterial.getUniform<UniformMatrix4>('modelViewMatrixPrev', 'PerMesh').value = new Float32Array(mvMatrixPrev.values);
			this.groundMaterial.updateUniformBlock('PerMesh');

			tile.ground.draw();
		}

		this.renderer.useMaterial(this.roadMaterial);

		this.roadMaterial.getUniform<UniformMatrix4>('projectionMatrix', 'PerMaterial').value = new Float32Array(camera.jitteredProjectionMatrix.values);
		this.roadMaterial.updateUniformBlock('PerMaterial');

		for (const tile of tiles) {
			if (!tile.roads || !tile.roads.inCameraFrustum(camera)) {
				continue;
			}

			const mvMatrix = Mat4.multiply(camera.matrixWorldInverse, tile.matrixWorld);
			const mvMatrixPrev = Mat4.multiply(this.cameraMatrixWorldInversePrev, tile.matrixWorld);

			this.roadMaterial.getUniform<UniformMatrix4>('modelViewMatrix', 'PerMesh').value = new Float32Array(mvMatrix.values);
			this.roadMaterial.getUniform<UniformMatrix4>('modelViewMatrixPrev', 'PerMesh').value = new Float32Array(mvMatrixPrev.values);
			this.roadMaterial.updateUniformBlock('PerMesh');

			tile.roads.draw();
		}

		mainRenderPass.readColorAttachmentPixel(4, this.objectIdBuffer, this.objectIdX, this.objectIdY);

		this.saveCameraMatrixWorldInverse();
	}

	private saveCameraMatrixWorldInverse(): void {
		this.cameraMatrixWorldInversePrev = this.manager.sceneSystem.objects.camera.matrixWorldInverse;
	}

	public setSize(width: number, height: number): void {

	}
}