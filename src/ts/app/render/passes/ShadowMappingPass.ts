import Pass from "~/app/render/passes/Pass";
import {InternalResourceType} from "~/render-graph";
import RenderPassResource from "~/app/render/render-graph/resources/RenderPassResource";
import PassManager from "~/app/render/PassManager";
import Tile from "~/app/objects/Tile";
import AbstractMaterial from "~/renderer/abstract-renderer/AbstractMaterial";
import {UniformMatrix4} from "~/renderer/abstract-renderer/Uniform";
import Mat4 from "~/math/Mat4";
import GroundAndBuildingsDepthMaterialContainer from "~/app/render/materials/GroundAndBuildingsDepthMaterialContainer";
import TreeDepthMaterialContainer from "~/app/render/materials/TreeDepthMaterialContainer";
import AircraftDepthMaterialContainer from "~/app/render/materials/AircraftDepthMaterialContainer";
import VehicleSystem from "~/app/systems/VehicleSystem";

export default class ShadowMappingPass extends Pass<{
	ShadowMaps: {
		type: InternalResourceType.Output;
		resource: RenderPassResource;
	};
}> {
	private readonly groundAndBuildingsDepthMaterial: AbstractMaterial;
	private readonly treeMaterial: AbstractMaterial;
	private readonly aircraftMaterial: AbstractMaterial;

	public constructor(manager: PassManager) {
		super('ShadowMappingPass', manager, {
			ShadowMaps: {type: InternalResourceType.Output, resource: manager.getSharedResource('ShadowMaps')}
		});

		this.groundAndBuildingsDepthMaterial = new GroundAndBuildingsDepthMaterialContainer(this.renderer).material;
		this.treeMaterial = new TreeDepthMaterialContainer(this.renderer).material;
		this.aircraftMaterial = new AircraftDepthMaterialContainer(this.renderer).material;

		const csm = this.manager.sceneSystem.objects.csm;

		this.getResource('ShadowMaps').descriptor.setSize(csm.resolution, csm.resolution, csm.cascades);
	}

	public render(): void {
		const csm = this.manager.sceneSystem.objects.csm;
		const tiles = this.manager.sceneSystem.objects.tiles.children as Tile[];
		const trees = this.manager.sceneSystem.objects.instancedObjects.get('tree')
		const aircraftList = this.manager.sceneSystem.objects.instancedAircraft;
		const pass = this.getPhysicalResource('ShadowMaps');

		for (let i = 0; i < csm.cascadeCameras.length; i++) {
			const camera = csm.cascadeCameras[i];

			pass.depthAttachment.slice = i;

			this.renderer.beginRenderPass(pass);

			if (i < 2) {
				const mvMatrix = Mat4.multiply(camera.matrixWorldInverse, trees.matrixWorld);

				this.renderer.useMaterial(this.treeMaterial);

				this.treeMaterial.getUniform('projectionMatrix', 'MainBlock').value = new Float32Array(camera.projectionMatrix.values);
				this.treeMaterial.getUniform('modelViewMatrix', 'MainBlock').value = new Float32Array(mvMatrix.values);
				this.treeMaterial.updateUniformBlock('MainBlock');

				trees.mesh.draw();
			}

			for (let i = 0; i < aircraftList.length; i++) {
				const aircraft = aircraftList[i];

				if (aircraft.mesh && aircraft.mesh.instanceCount > 0) {
					const mvMatrix = Mat4.multiply(camera.matrixWorldInverse, aircraft.matrixWorld);

					this.renderer.useMaterial(this.aircraftMaterial);

					this.aircraftMaterial.getUniform('projectionMatrix', 'MainBlock').value = new Float32Array(camera.projectionMatrix.values);
					this.aircraftMaterial.getUniform('modelViewMatrix', 'MainBlock').value = new Float32Array(mvMatrix.values);
					this.aircraftMaterial.updateUniformBlock('MainBlock');

					aircraft.mesh.draw();
				}
			}

			{
				this.renderer.useMaterial(this.groundAndBuildingsDepthMaterial);

				this.groundAndBuildingsDepthMaterial.getUniform('projectionMatrix', 'PerMaterial').value = new Float32Array(camera.projectionMatrix.values);
				this.groundAndBuildingsDepthMaterial.updateUniformBlock('PerMaterial');

				for (const tile of tiles) {
					if (!tile.groundAndBuildings || !tile.groundAndBuildings.inCameraFrustum(camera)) {
						continue;
					}

					const mvMatrix = Mat4.multiply(camera.matrixWorldInverse, tile.matrixWorld);

					this.groundAndBuildingsDepthMaterial.getUniform<UniformMatrix4>('modelViewMatrix', 'PerMesh').value = new Float32Array(mvMatrix.values);
					this.groundAndBuildingsDepthMaterial.updateUniformBlock('PerMesh');

					tile.groundAndBuildings.draw();
				}
			}
		}
	}

	public setSize(width: number, height: number): void {

	}
}