import Pass from "~/app/render/passes/Pass";
import {InternalResourceType} from "~/render-graph";
import RenderPassResource from "~/app/render/render-graph/resources/RenderPassResource";
import PassManager from "~/app/render/PassManager";
import Tile from "~/app/objects/Tile";
import AbstractMaterial from "~/renderer/abstract-renderer/AbstractMaterial";
import {UniformMatrix4} from "~/renderer/abstract-renderer/Uniform";
import Mat4 from "~/math/Mat4";
import BuildingDepthMaterialContainer from "~/app/render/materials/BuildingDepthMaterialContainer";

export default class ShadowMappingPass extends Pass<{
	ShadowMaps: {
		type: InternalResourceType.Output;
		resource: RenderPassResource;
	};
}> {
	private readonly buildingDepthMaterial: AbstractMaterial;

	public constructor(manager: PassManager) {
		super('ShadowMappingPass', manager, {
			ShadowMaps: {type: InternalResourceType.Output, resource: manager.getSharedResource('ShadowMaps')}
		});

		this.buildingDepthMaterial = new BuildingDepthMaterialContainer(this.renderer).material;

		const csm = this.manager.sceneSystem.objects.csm;

		this.getResource('ShadowMaps').descriptor.setSize(csm.resolution, csm.resolution, csm.cascades);
	}

	public render(): void {
		const csm = this.manager.sceneSystem.objects.csm;
		const tiles = this.manager.sceneSystem.objects.tiles.children as Tile[];
		const pass = this.getPhysicalResource('ShadowMaps');

		this.renderer.useMaterial(this.buildingDepthMaterial);

		for (let i = 0; i < csm.cascadeCameras.length; i++) {
			const camera = csm.cascadeCameras[i];

			pass.depthAttachment.slice = i;

			this.renderer.beginRenderPass(pass);

			this.buildingDepthMaterial.getUniform<UniformMatrix4>('projectionMatrix', 'PerMaterial').value = new Float32Array(camera.projectionMatrix.values);
			this.buildingDepthMaterial.applyUniformUpdates('projectionMatrix', 'PerMaterial');

			for (const tile of tiles) {
				if (!tile.buildings) {
					continue;
				}

				const mvMatrix = Mat4.multiply(camera.matrixWorldInverse, tile.matrixWorld);

				this.buildingDepthMaterial.getUniform<UniformMatrix4>('modelViewMatrix', 'PerMesh').value = new Float32Array(mvMatrix.values);
				this.buildingDepthMaterial.applyUniformUpdates('modelViewMatrix', 'PerMesh');

				tile.buildings.draw();
			}
		}
	}

	public setSize(width: number, height: number): void {

	}
}