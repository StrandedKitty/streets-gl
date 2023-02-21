import AbstractMaterial from "~/lib/renderer/abstract-renderer/AbstractMaterial";
import {
	UniformFloat1,
	UniformFloat2,
	UniformFloat3, UniformFloat4,
	UniformInt1,
	UniformMatrix4
} from "~/lib/renderer/abstract-renderer/Uniform";
import Tile from "../../objects/Tile";
import Mat4 from "~/lib/math/Mat4";
import Pass from "./Pass";
import RenderPassResource from "../render-graph/resources/RenderPassResource";
import {InternalResourceType} from '~/lib/render-graph/Pass';
import PassManager from '../PassManager';
import BuildingMaterialContainer from "../materials/BuildingMaterialContainer";
import SkyboxMaterialContainer from "../materials/SkyboxMaterialContainer";
import GroundMaterialContainer from "../materials/GroundMaterialContainer";
import RoadMaterialContainer from "../materials/RoadMaterialContainer";
import FullScreenTriangle from "../../objects/FullScreenTriangle";
import TerrainMaterialContainer from "../materials/TerrainMaterialContainer";
import TreeMaterialContainer from "../materials/TreeMaterialContainer";
import Vec2 from "~/lib/math/Vec2";
import VehicleSystem from "../../systems/VehicleSystem";
import AircraftMaterialContainer from "../materials/AircraftMaterialContainer";
import Vec3 from "~/lib/math/Vec3";
import AbstractTextureCube from "~/lib/renderer/abstract-renderer/AbstractTextureCube";
import AbstractTexture2D from "~/lib/renderer/abstract-renderer/AbstractTexture2D";
import MathUtils from "~/lib/math/MathUtils";
import Config from "../../Config";
import TerrainSystem from "../../systems/TerrainSystem";
import SceneSystem from "../../systems/SceneSystem";
import TerrainRing from "../../objects/TerrainRing";
import AbstractTexture2DArray from "~/lib/renderer/abstract-renderer/AbstractTexture2DArray";

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
	TerrainNormal: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	TerrainWater: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	TerrainTileMask: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	TerrainRingHeight: {
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
			TerrainNormal: {type: InternalResourceType.Input, resource: manager.getSharedResource('TerrainNormal')},
			TerrainWater: {type: InternalResourceType.Input, resource: manager.getSharedResource('TerrainWater')},
			TerrainTileMask: {type: InternalResourceType.Input, resource: manager.getSharedResource('TerrainTileMask')},
			TerrainRingHeight: {type: InternalResourceType.Input, resource: manager.getSharedResource('TerrainRingHeight')},
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
		const terrainNormal = <AbstractTexture2DArray>this.getPhysicalResource('TerrainNormal').colorAttachments[0].texture;
		const terrainWater = <AbstractTexture2DArray>this.getPhysicalResource('TerrainWater').colorAttachments[0].texture;
		const terrainTileMask = <AbstractTexture2D>this.getPhysicalResource('TerrainTileMask').colorAttachments[0].texture;
		const terrainRingHeight = <AbstractTexture2DArray>this.getPhysicalResource('TerrainRingHeight').colorAttachments[0].texture;
		const biomePos = MathUtils.meters2tile(camera.position.x, camera.position.z, 0);
		const terrainSystem = this.manager.systemManager.getSystem(TerrainSystem);

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

		this.renderer.useMaterial(this.buildingMaterial);

		this.buildingMaterial.getUniform<UniformMatrix4>('projectionMatrix', 'PerMaterial').value = new Float32Array(camera.jitteredProjectionMatrix.values);
		this.buildingMaterial.updateUniformBlock('PerMaterial');

		for (const tile of tiles) {
			if (!tile.buildings/* || !tile.buildings.inCameraFrustum(camera)*/) {
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
			const instanceCount = buffer.length / 4;

			aircraft.position.set(instancesOrigin.x, 0, instancesOrigin.y);
			aircraft.updateMatrix();
			aircraft.updateMatrixWorld();
			aircraft.setInstancesInterleavedBuffer(buffer, buffer.length / 4);

			if (instanceCount > 0) {
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

		this.terrainMaterial.getUniform('tRingHeight').value = terrainRingHeight;
		this.terrainMaterial.getUniform('tNormal').value = terrainNormal;
		this.terrainMaterial.getUniform('tWater').value = terrainWater;
		this.terrainMaterial.getUniform('tWaterMask').value = terrainTileMask;
		this.renderer.useMaterial(this.terrainMaterial);

		this.terrainMaterial.getUniform<UniformMatrix4>('projectionMatrix', 'PerMaterial').value =
			new Float32Array(camera.jitteredProjectionMatrix.values);
		this.terrainMaterial.getUniform('biomeCoordinates', 'PerMaterial').value = new Float32Array([biomePos.x, biomePos.y]);
		this.terrainMaterial.getUniform<UniformFloat1>('time', 'PerMaterial').value[0] = performance.now() * 0.001;
		this.terrainMaterial.updateUniformBlock('PerMaterial');

		for (let i = 0; i < terrain.children.length; i++) {
			const ring = terrain.children[i];

			this.terrainMaterial.getUniform<UniformMatrix4>('modelViewMatrix', 'PerMesh').value =
				new Float32Array(Mat4.multiply(camera.matrixWorldInverse, ring.matrixWorld).values);
			this.terrainMaterial.getUniform<UniformMatrix4>('modelViewMatrixPrev', 'PerMesh').value =
				new Float32Array(Mat4.multiply(this.cameraMatrixWorldInversePrev, ring.matrixWorld).values);
			this.terrainMaterial.getUniform<UniformFloat3>('transformNormal0', 'PerMesh').value = ring.heightTextureTransform0;
			this.terrainMaterial.getUniform<UniformFloat3>('transformNormal1', 'PerMesh').value = ring.heightTextureTransform1;
			this.terrainMaterial.getUniform<UniformFloat4>('transformWater0', 'PerMesh').value = ring.waterTextureTransform0;
			this.terrainMaterial.getUniform<UniformFloat4>('transformWater1', 'PerMesh').value = ring.waterTextureTransform1;
			this.terrainMaterial.getUniform<UniformFloat3>('transformMask', 'PerMesh').value = ring.maskTextureTransform;
			this.terrainMaterial.getUniform<UniformFloat1>('size', 'PerMesh').value[0] = ring.size;
			this.terrainMaterial.getUniform<UniformFloat1>('segmentCount', 'PerMesh').value[0] = ring.segmentCount * 2;
			this.terrainMaterial.getUniform('detailTextureOffset', 'PerMesh').value = new Float32Array([
				ring.position.x % 10000 - ring.size / 2,
				ring.position.z % 10000 - ring.size / 2,
			]);
			this.terrainMaterial.getUniform('cameraPosition', 'PerMesh').value = new Float32Array([
				camera.position.x - ring.position.x, camera.position.z - ring.position.z
			]);
			this.terrainMaterial.getUniform<UniformInt1>('levelId', 'PerMesh').value[0] = i;
			this.terrainMaterial.updateUniformBlock('PerMesh');

			//ring.draw();
		}

		this.roadMaterial.getUniform('tRingHeight').value = terrainRingHeight;
		this.roadMaterial.getUniform('tNormal').value = terrainNormal;

		this.renderer.useMaterial(this.roadMaterial);

		this.roadMaterial.getUniform<UniformMatrix4>('projectionMatrix', 'PerMaterial').value = new Float32Array(camera.jitteredProjectionMatrix.values);
		this.roadMaterial.updateUniformBlock('PerMaterial');

		for (const tile of tiles) {
			if (!tile.roads/* || !tile.roads.inCameraFrustum(camera)*/) {
				continue;
			}

			const mvMatrix = Mat4.multiply(camera.matrixWorldInverse, tile.matrixWorld);
			const mvMatrixPrev = Mat4.multiply(this.cameraMatrixWorldInversePrev, tile.matrixWorld);

			let ring0: TerrainRing = null;
			let ring1: TerrainRing = null;
			let levelId: number = 0;

			for (let i = 0; i < terrain.children.length; i++) {
				const child = terrain.children[i];
				const dst = child.size / 2 + Config.TileSize / 2;
				const minX = child.position.x - dst;
				const minZ = child.position.z - dst;
				const maxX = child.position.x + dst;
				const maxZ = child.position.z + dst;
				const tileX = tile.position.x + Config.TileSize / 2;
				const tileZ = tile.position.z + Config.TileSize / 2;

				if (tileX > minX && tileX < maxX && tileZ > minZ && tileZ < maxZ) {
					ring0 = child;
					ring1 = terrain.children[i + 1] || null;
					levelId = i;
					break;
				}
			}

			if (ring0 === null || ring1 === null) {
				continue;
			}

			const ringOffset = [
				tile.position.x - ring0.position.x, tile.position.z - ring0.position.z,
				tile.position.x - ring1.position.x, tile.position.z - ring1.position.z
			];

			const normalTextureTransform0 = new Float32Array(4);
			const normalTextureTransform1 = new Float32Array(4);
			terrainSystem.areaLoaders.height0.transformToArray(
				tile.position.x,
				tile.position.z,
				Config.TileSize,
				normalTextureTransform0
			);
			terrainSystem.areaLoaders.height1.transformToArray(
				tile.position.x,
				tile.position.z,
				Config.TileSize,
				normalTextureTransform1
			);

			this.roadMaterial.getUniform<UniformMatrix4>('modelViewMatrix', 'PerMesh').value = new Float32Array(mvMatrix.values);
			this.roadMaterial.getUniform<UniformMatrix4>('modelViewMatrixPrev', 'PerMesh').value = new Float32Array(mvMatrixPrev.values);
			this.roadMaterial.getUniform<UniformMatrix4>('transformNormal0', 'PerMesh').value = normalTextureTransform0;
			this.roadMaterial.getUniform<UniformMatrix4>('transformNormal1', 'PerMesh').value = normalTextureTransform1;
			this.roadMaterial.getUniform<UniformMatrix4>('terrainRingSize', 'PerMesh').value[0] = ring0.size;
			this.roadMaterial.getUniform<UniformMatrix4>('terrainRingOffset', 'PerMesh').value = new Float32Array(ringOffset);
			this.roadMaterial.getUniform<UniformMatrix4>('terrainLevelId', 'PerMesh').value[0] = levelId;
			this.roadMaterial.getUniform<UniformMatrix4>('segmentCount', 'PerMesh').value[0] = ring0.segmentCount * 2;
			this.roadMaterial.getUniform<UniformMatrix4>('cameraPosition', 'PerMesh').value = new Float32Array([
				camera.position.x - tile.position.x + Config.TileSize / 2, camera.position.z - tile.position.z + Config.TileSize / 2
			]);
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