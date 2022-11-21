import AbstractMaterial from "~/renderer/abstract-renderer/AbstractMaterial";
import {UniformFloat1, UniformMatrix4} from "~/renderer/abstract-renderer/Uniform";
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
import TerrainMaterialContainer from "~/app/render/materials/TerrainMaterialContainer";
import TreeMaterialContainer from "~/app/render/materials/TreeMaterialContainer";
import Vec2 from "~/math/Vec2";
import VehicleSystem from "~/app/systems/VehicleSystem";
import AircraftMaterialContainer from "~/app/render/materials/AircraftMaterialContainer";
import Vec3 from "~/math/Vec3";
import AbstractTextureCube from "~/renderer/abstract-renderer/AbstractTextureCube";
import AbstractTexture2D from "~/renderer/abstract-renderer/AbstractTexture2D";

export default class GBufferPass extends Pass<{
	GBufferRenderPass: {
		type: InternalResourceType.Output;
		resource: RenderPassResource;
	};
	AtmosphereSkybox: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	Transmittance: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
}> {
	private buildingMaterial: AbstractMaterial;
	private groundMaterial: AbstractMaterial;
	private roadMaterial: AbstractMaterial;
	private skyboxMaterial: AbstractMaterial;
	private terrainMaterial: AbstractMaterial;
	private treeMaterial: AbstractMaterial;
	private aircraftMaterial: AbstractMaterial;
	private cameraMatrixWorldInversePrev: Mat4 = null;
	public objectIdBuffer: Uint32Array = new Uint32Array(1);
	public objectIdX = 0;
	public objectIdY = 0;
	private fullScreenTriangle: FullScreenTriangle;

	public constructor(manager: PassManager) {
		super('GBufferPass', manager, {
			GBufferRenderPass: {type: InternalResourceType.Output, resource: manager.getSharedResource('GBufferRenderPass')},
			AtmosphereSkybox: {type: InternalResourceType.Input, resource: manager.getSharedResource('AtmosphereSkybox')},
			Transmittance: {type: InternalResourceType.Input, resource: manager.getSharedResource('AtmosphereTransmittanceLUT')},
		});

		this.fullScreenTriangle = new FullScreenTriangle(this.renderer);

		this.createMaterials();
	}

	private createMaterials(): void {
		this.buildingMaterial = new BuildingMaterialContainer(this.renderer).material;
		this.groundMaterial = new GroundMaterialContainer(this.renderer).material;
		this.roadMaterial = new RoadMaterialContainer(this.renderer).material;
		this.skyboxMaterial = new SkyboxMaterialContainer(this.renderer).material;
		this.terrainMaterial = new TerrainMaterialContainer(this.renderer).material;
		this.treeMaterial = new TreeMaterialContainer(this.renderer).material;
		this.aircraftMaterial = new AircraftMaterialContainer(this.renderer).material;
	}

	public render(): void {
		const camera = this.manager.sceneSystem.objects.camera;
		const skybox = this.manager.sceneSystem.objects.skybox;
		const terrain = this.manager.sceneSystem.objects.terrain;
		const tiles = this.manager.sceneSystem.objects.tiles.children as Tile[];
		const trees = this.manager.sceneSystem.objects.instancedObjects.get('tree');
		const aircraftList = this.manager.sceneSystem.objects.instancedAircraft;
		const sunDirection = new Float32Array([...Vec3.toArray(this.manager.mapTimeSystem.sunDirection)]);
		const skyRotationMatrix = new Float32Array(this.manager.mapTimeSystem.skyDirectionMatrix.values);
		const atmosphereSkyboxTexture = <AbstractTextureCube>this.getPhysicalResource('AtmosphereSkybox').colorAttachments[0].texture;
		const transmittanceLUT = <AbstractTexture2D>this.getPhysicalResource('Transmittance').colorAttachments[0].texture;

		const instancesOrigin = new Vec2(
			Math.floor(camera.position.x / 10000) * 10000,
			Math.floor(camera.position.z / 10000) * 10000
		);

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

		this.skyboxMaterial.getUniform<UniformMatrix4>('projectionMatrix', 'Uniforms').value = new Float32Array(camera.projectionMatrix.values);
		this.skyboxMaterial.getUniform<UniformMatrix4>('modelViewMatrix', 'Uniforms').value = new Float32Array(Mat4.multiply(camera.matrixWorldInverse, skybox.matrixWorld).values);
		this.skyboxMaterial.getUniform<UniformMatrix4>('viewMatrix', 'Uniforms').value = new Float32Array(camera.matrixWorld.values);
		this.skyboxMaterial.getUniform<UniformMatrix4>('modelViewMatrixPrev', 'Uniforms').value = new Float32Array(Mat4.multiply(this.cameraMatrixWorldInversePrev, skybox.matrixWorld).values);
		this.skyboxMaterial.getUniform('sunDirection', 'Uniforms').value = sunDirection;
		this.skyboxMaterial.getUniform('skyRotationMatrix', 'Uniforms').value = skyRotationMatrix;
		this.skyboxMaterial.getUniform('tAtmosphere').value = atmosphereSkyboxTexture;
		this.skyboxMaterial.getUniform('tTransmittanceLUT').value = transmittanceLUT;
		this.skyboxMaterial.updateUniformBlock('Uniforms');

		this.renderer.useMaterial(this.skyboxMaterial);

		skybox.draw();

		/*this.renderer.useMaterial(this.terrainMaterial);

		this.terrainMaterial.getUniform<UniformMatrix4>('projectionMatrix', 'PerMaterial').value = new Float32Array(camera.jitteredProjectionMatrix.values);
		this.terrainMaterial.getUniform<UniformMatrix4>('modelViewMatrix', 'PerMesh').value = new Float32Array(Mat4.multiply(camera.matrixWorldInverse, terrain.matrixWorld).values);
		this.terrainMaterial.getUniform<UniformMatrix4>('modelViewMatrixPrev', 'PerMesh').value = new Float32Array(Mat4.multiply(this.cameraMatrixWorldInversePrev, terrain.matrixWorld).values);
		this.terrainMaterial.updateUniformBlock('PerMaterial');
		this.terrainMaterial.updateUniformBlock('PerMesh');

		terrain.draw();*/

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

		this.groundMaterial.getUniform<UniformFloat1>('time').value[0] = performance.now() * 0.001;

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

		/*{
			const buffers = [];
			const instancesOrigin = new Vec2(
				Math.floor(camera.position.x / 10000) * 10000,
				Math.floor(camera.position.z / 10000) * 10000
			);

			for (const tile of tiles) {
				const lod = tile.distanceToCamera < 2500 ? 0 : 1;
				const trees = tile.getInstanceBufferWithTransform('tree', lod, instancesOrigin);

				if (trees) {
					buffers.push(trees);
				}
			}

			trees.position.set(instancesOrigin.x, 0, instancesOrigin.y);
			trees.updateMatrix();
			trees.updateMatrixWorld();
			const mergedTrees = Utils.mergeTypedArrays(Float32Array, buffers);
			trees.setInstancesInterleavedBuffer(mergedTrees, mergedTrees.length / 5);

			const mvMatrixPrev = Mat4.multiply(this.cameraMatrixWorldInversePrev, trees.matrixWorld);

			this.renderer.useMaterial(this.treeMaterial);

			this.treeMaterial.getUniform('projectionMatrix', 'MainBlock').value = new Float32Array(camera.jitteredProjectionMatrix.values);
			this.treeMaterial.getUniform('modelMatrix', 'MainBlock').value = new Float32Array(trees.matrixWorld.values);
			this.treeMaterial.getUniform('viewMatrix', 'MainBlock').value = new Float32Array(camera.matrixWorldInverse.values);
			this.treeMaterial.getUniform('modelViewMatrixPrev', 'MainBlock').value = new Float32Array(mvMatrixPrev.values);
			this.treeMaterial.updateUniformBlock('MainBlock');

			trees.mesh.draw();
		}*/

		for (let i = 0; i < aircraftList.length; i++) {
			const aircraft = aircraftList[i];

			if (!aircraft.mesh) {
				continue;
			}

			const vehicleSystem = this.manager.systemManager.getSystem(VehicleSystem);
			const buffer = vehicleSystem.getAircraftBuffer(instancesOrigin, i);

			if (buffer) {
				aircraft.position.set(instancesOrigin.x, 0, instancesOrigin.y);
				aircraft.updateMatrix();
				aircraft.updateMatrixWorld();
				aircraft.setInstancesInterleavedBuffer(buffer, buffer.length / 4);

				const mvMatrixPrev = Mat4.multiply(this.cameraMatrixWorldInversePrev, aircraft.matrixWorld);

				this.renderer.useMaterial(this.aircraftMaterial);

				this.aircraftMaterial.getUniform('projectionMatrix', 'MainBlock').value = new Float32Array(camera.jitteredProjectionMatrix.values);
				this.aircraftMaterial.getUniform('modelMatrix', 'MainBlock').value = new Float32Array(aircraft.matrixWorld.values);
				this.aircraftMaterial.getUniform('viewMatrix', 'MainBlock').value = new Float32Array(camera.matrixWorldInverse.values);
				this.aircraftMaterial.getUniform('modelViewMatrixPrev', 'MainBlock').value = new Float32Array(mvMatrixPrev.values);
				this.aircraftMaterial.getUniform('textureId', 'MainBlock').value = new Float32Array([i]);
				this.aircraftMaterial.updateUniformBlock('MainBlock');

				aircraft.mesh.draw();
			}
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