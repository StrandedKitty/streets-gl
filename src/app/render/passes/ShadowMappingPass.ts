import Pass from "./Pass";
import {InternalResourceType} from "~/lib/render-graph";
import RenderPassResource from "../render-graph/resources/RenderPassResource";
import PassManager from "../PassManager";
import Tile from "../../objects/Tile";
import AbstractMaterial from "~/lib/renderer/abstract-renderer/AbstractMaterial";
import {UniformMatrix4} from "~/lib/renderer/abstract-renderer/Uniform";
import Mat4 from "~/lib/math/Mat4";
import TreeDepthMaterialContainer from "../materials/TreeDepthMaterialContainer";
import AircraftDepthMaterialContainer from "../materials/AircraftDepthMaterialContainer";
import VehicleSystem from "../../systems/VehicleSystem";
import BuildingDepthMaterial from "../materials/BuildingDepthMaterial";
import SettingsManager from "~/app/ui/SettingsManager";

export default class ShadowMappingPass extends Pass<{
	ShadowMaps: {
		type: InternalResourceType.Output;
		resource: RenderPassResource;
	};
}> {
	private readonly buildingDepthMaterial: AbstractMaterial;
	private readonly treeMaterial: AbstractMaterial;
	private readonly aircraftMaterial: AbstractMaterial;

	public constructor(manager: PassManager) {
		super('ShadowMappingPass', manager, {
			ShadowMaps: {type: InternalResourceType.Output, resource: manager.getSharedResource('ShadowMaps')}
		});

		this.buildingDepthMaterial = new BuildingDepthMaterial(this.renderer).material;
		this.treeMaterial = new TreeDepthMaterialContainer(this.renderer).material;
		this.aircraftMaterial = new AircraftDepthMaterialContainer(this.renderer).material;

		SettingsManager.onSettingChange('shadows', ({statusValue}) => {
			const csm = this.manager.sceneSystem.objects.csm;

			if (statusValue === 'low') {
				csm.cascades = 1;
				csm.resolution = 2048;
				csm.far = 3000;
			} else if (statusValue === 'medium') {
				csm.cascades = 3;
				csm.resolution = 2048;
				csm.far = 4000;
			} else {
				csm.cascades = 3;
				csm.resolution = 4096;
				csm.far = 5000;
			}

			csm.updateCascades();
			this.updateShadowMapDescriptor();
		});
	}

	private updateShadowMapDescriptor(): void {
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
			}

			{
				this.renderer.useMaterial(this.buildingDepthMaterial);

				this.buildingDepthMaterial.getUniform('projectionMatrix', 'PerMaterial').value = new Float32Array(camera.projectionMatrix.values);
				this.buildingDepthMaterial.updateUniformBlock('PerMaterial');

				for (const tile of tiles) {
					if (!tile.buildings || !tile.buildings.inCameraFrustum(camera)) {
						continue;
					}

					const mvMatrix = Mat4.multiply(camera.matrixWorldInverse, tile.matrixWorld);

					this.buildingDepthMaterial.getUniform<UniformMatrix4>('modelViewMatrix', 'PerMesh').value = new Float32Array(mvMatrix.values);
					this.buildingDepthMaterial.updateUniformBlock('PerMesh');

					tile.buildings.draw();
				}
			}
		}
	}

	public setSize(width: number, height: number): void {

	}
}