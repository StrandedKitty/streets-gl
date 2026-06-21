import AbstractMaterial from "~/lib/renderer/abstract-renderer/AbstractMaterial";
import AbstractMesh from "~/lib/renderer/abstract-renderer/AbstractMesh";
import {
	UniformFloat1,
	UniformFloat3,
	UniformFloat4,
	UniformInt1,
	UniformMatrix4,
	UniformTexture2DArray
} from "~/lib/renderer/abstract-renderer/Uniform";
import Tile from "../../objects/Tile";
import Mat4 from "~/lib/math/Mat4";
import Pass from "./Pass";
import RenderPassResource from "../render-graph/resources/RenderPassResource";
import {InternalResourceType} from '~/lib/render-graph/Pass';
import PassManager from '../PassManager';
import ExtrudedMeshMaterialContainer from "../materials/ExtrudedMeshMaterialContainer";
import SkyboxMaterialContainer from "../materials/SkyboxMaterialContainer";
import ProjectedMeshMaterialContainer from "../materials/ProjectedMeshMaterialContainer";
import FullScreenTriangle from "../../objects/FullScreenTriangle";
import TerrainMaterialContainer from "../materials/TerrainMaterialContainer";
import TreeMaterialContainer from "../materials/TreeMaterialContainer";
import Vec2 from "~/lib/math/Vec2";
import VehicleSystem from "../../systems/VehicleSystem";
import AircraftMaterialContainer from "../materials/AircraftMaterialContainer";
import AbstractTexture2D from "~/lib/renderer/abstract-renderer/AbstractTexture2D";
import MathUtils from "~/lib/math/MathUtils";
import Config from "../../Config";
import TerrainSystem from "../../systems/TerrainSystem";
import AbstractTexture2DArray from "~/lib/renderer/abstract-renderer/AbstractTexture2DArray";
import Camera from "~/lib/core/Camera";
import GenericInstanceMaterialContainer from "~/app/render/materials/GenericInstanceMaterialContainer";
import {
	InstanceStructure,
	Tile3DInstanceLODConfig,
	Tile3DInstanceType
} from "~/lib/tile-processing/tile3d/features/Tile3DInstance";
import AdvancedInstanceMaterialContainer from "~/app/render/materials/AdvancedInstanceMaterialContainer";
import {InstanceTextureIdList} from "~/app/render/textures/createInstanceTexture";
import MapTimeSystem from "~/app/systems/MapTimeSystem";
import {AircraftPartTextures} from "~/app/render/textures/createAircraftTexture";
import PerspectiveCamera from "~/lib/core/PerspectiveCamera";
import ControlsSystem from "~/app/systems/ControlsSystem";
import CarMaterialContainer from "~/app/render/materials/CarMaterialContainer";
import {CarWheelMounts, WheelRadius} from "~/app/objects/models/CarModel";
import Car from "~/app/objects/Car";

export default class GBufferPass extends Pass<{
	GBufferRenderPass: {
		type: InternalResourceType.Output;
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
	TerrainWaterTileMask: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	TerrainRingHeight: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	TerrainUsage: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
	TerrainUsageTileMask: {
		type: InternalResourceType.Input;
		resource: RenderPassResource;
	};
}> {
	private extrudedMeshMaterial: AbstractMaterial;
	private projectedMeshMaterial: AbstractMaterial;
	private huggingMeshMaterial: AbstractMaterial;
	private skyboxMaterial: AbstractMaterial;
	private terrainMaterial: AbstractMaterial;
	private treeMaterial: AbstractMaterial;
	private genericInstanceMaterial: AbstractMaterial;
	private advancedInstanceMaterial: AbstractMaterial;
	private aircraftMaterial: AbstractMaterial;
	private carMaterial: AbstractMaterial;
	private cameraMatrixWorldInversePrev: Mat4 = null;
	// Previous-frame car part matrices, for correct TAA motion vectors (index 0 = body/GLB, 1-4 = wheels).
	private carMatricesPrev: Mat4[] = [];
	public objectIdBuffer: Uint32Array = new Uint32Array(1);
	public objectIdX = 0;
	public objectIdY = 0;
	private fullScreenTriangle: FullScreenTriangle;

	public constructor(manager: PassManager) {
		super('GBufferPass', manager, {
			GBufferRenderPass: {
				type: InternalResourceType.Output,
				resource: manager.getSharedResource('GBufferRenderPass')
			},
			TerrainNormal: {
				type: InternalResourceType.Input,
				resource: manager.getSharedResource('TerrainNormal')
			},
			TerrainWater: {
				type: InternalResourceType.Input,
				resource: manager.getSharedResource('TerrainWater')
			},
			TerrainWaterTileMask: {
				type: InternalResourceType.Input,
				resource: manager.getSharedResource('TerrainWaterTileMask')
			},
			TerrainRingHeight: {
				type: InternalResourceType.Input,
				resource: manager.getSharedResource('TerrainRingHeight')
			},
			TerrainUsage: {
				type: InternalResourceType.Input,
				resource: manager.getSharedResource('TerrainUsage')
			},
			TerrainUsageTileMask: {
				type: InternalResourceType.Input,
				resource: manager.getSharedResource('TerrainUsageTileMask')
			}
		});

		this.fullScreenTriangle = new FullScreenTriangle(this.renderer);

		this.createMaterials();
	}

	private createMaterials(): void {
		this.skyboxMaterial = new SkyboxMaterialContainer(this.renderer).material;
		this.terrainMaterial = new TerrainMaterialContainer(this.renderer).material;

		this.genericInstanceMaterial = new GenericInstanceMaterialContainer(this.renderer).material;
		this.genericInstanceMaterial.getUniform<UniformTexture2DArray>('tMap').value =
			<AbstractTexture2DArray>this.manager.texturePool.get('instance');

		this.advancedInstanceMaterial = new AdvancedInstanceMaterialContainer(this.renderer).material;
		this.advancedInstanceMaterial.getUniform<UniformTexture2DArray>('tMap').value =
			<AbstractTexture2DArray>this.manager.texturePool.get('instance');

		this.treeMaterial = new TreeMaterialContainer(this.renderer).material;
		this.treeMaterial.getUniform<UniformTexture2DArray>('tMap').value =
			<AbstractTexture2DArray>this.manager.texturePool.get('tree');

		this.projectedMeshMaterial = new ProjectedMeshMaterialContainer(this.renderer, false).material;
		this.projectedMeshMaterial.getUniform<UniformTexture2DArray>('tMap').value =
			<AbstractTexture2DArray>this.manager.texturePool.get('projectedMesh');

		this.huggingMeshMaterial = new ProjectedMeshMaterialContainer(this.renderer, true).material;
		this.huggingMeshMaterial.getUniform<UniformTexture2DArray>('tMap').value =
			<AbstractTexture2DArray>this.manager.texturePool.get('projectedMesh');

		this.extrudedMeshMaterial = new ExtrudedMeshMaterialContainer(this.renderer).material;
		this.extrudedMeshMaterial.getUniform<UniformTexture2DArray>('tMap').value =
			<AbstractTexture2DArray>this.manager.texturePool.get('extrudedMesh');

		this.aircraftMaterial = new AircraftMaterialContainer(this.renderer).material;
		this.aircraftMaterial.getUniform<UniformTexture2DArray>('tMap').value =
			<AbstractTexture2DArray>this.manager.texturePool.get('aircraft');

		this.carMaterial = new CarMaterialContainer(this.renderer).material;
	}

	private updateMaterialsDefines(): void {
		const useHeight = this.manager.settings.get('terrainHeight').statusValue === 'on' ? '1' : '0';
		const materials = [
			this.huggingMeshMaterial,
			this.projectedMeshMaterial,
			this.terrainMaterial
		];

		for (const material of materials) {
			if (material.defines.USE_HEIGHT !== useHeight) {
				material.defines.USE_HEIGHT = useHeight;
				material.recompile();
			}
		}
	}

	private getTileNormalTexturesTransforms(tile: Tile): [Float32Array, Float32Array] {
		const terrainSystem = this.manager.systemManager.getSystem(TerrainSystem);
		const transform0 = new Float32Array(4);
		const transform1 = new Float32Array(4);

		terrainSystem.areaLoaders.height0.transformToArray(
			tile.position.x,
			tile.position.z,
			Config.TileSize,
			transform0
		);
		terrainSystem.areaLoaders.height1.transformToArray(
			tile.position.x,
			tile.position.z,
			Config.TileSize,
			transform1
		);

		return [transform0, transform1];
	}

	private getCameraPositionRelativeToTile(camera: Camera, tile: Tile): [number, number] {
		return [
			camera.position.x - tile.position.x + Config.TileSize / 2,
			camera.position.z - tile.position.z + Config.TileSize / 2
		];
	}

	private renderSkybox(): void {
		const camera = this.manager.sceneSystem.objects.camera;
		const skybox = this.manager.sceneSystem.objects.skybox;
		const skyRotationMatrix = new Float32Array(this.manager.mapTimeSystem.skyDirectionMatrix.values);

		this.skyboxMaterial.getUniform('projectionMatrix', 'Uniforms').value =
			new Float32Array(camera.projectionMatrix.values);
		this.skyboxMaterial.getUniform('modelViewMatrix', 'Uniforms').value =
			new Float32Array(Mat4.multiply(camera.matrixWorldInverse, skybox.matrixWorld).values);
		this.skyboxMaterial.getUniform('viewMatrix', 'Uniforms').value = new Float32Array(camera.matrixWorld.values);
		this.skyboxMaterial.getUniform('skyRotationMatrix', 'Uniforms').value = skyRotationMatrix;
		this.skyboxMaterial.updateUniformBlock('Uniforms');

		this.renderer.useMaterial(this.skyboxMaterial);

		skybox.draw();
	}

	private renderExtrudedMeshes(): void {
		const windowLightThreshold = this.manager.systemManager.getSystem(MapTimeSystem).windowLightThreshold;
		const camera = this.manager.sceneSystem.objects.camera;
		const tiles = this.manager.sceneSystem.objects.tiles;

		this.renderer.useMaterial(this.extrudedMeshMaterial);

		this.extrudedMeshMaterial.getUniform('projectionMatrix', 'PerMaterial').value = new Float32Array(camera.jitteredProjectionMatrix.values);
		this.extrudedMeshMaterial.getUniform<UniformFloat1>('windowLightThreshold', 'PerMaterial').value[0] = windowLightThreshold;
		this.extrudedMeshMaterial.updateUniformBlock('PerMaterial');

		for (const tile of tiles) {
			if (!tile.extrudedMesh || !tile.extrudedMesh.inCameraFrustum(camera)) {
				continue;
			}

			const mvMatrix = Mat4.multiply(camera.matrixWorldInverse, tile.matrixWorld);
			const mvMatrixPrev = Mat4.multiply(this.cameraMatrixWorldInversePrev, tile.matrixWorld);

			this.extrudedMeshMaterial.getUniform('modelViewMatrix', 'PerMesh').value = new Float32Array(mvMatrix.values);
			this.extrudedMeshMaterial.getUniform('modelViewMatrixPrev', 'PerMesh').value = new Float32Array(mvMatrixPrev.values);
			this.extrudedMeshMaterial.getUniform<UniformFloat1>('tileId', 'PerMesh').value[0] = tile.localId;
			this.extrudedMeshMaterial.updateUniformBlock('PerMesh');

			tile.extrudedMesh.draw();
		}
	}

	private renderTerrain(): void {
		const camera = this.manager.sceneSystem.objects.camera;
		const terrain = this.manager.sceneSystem.objects.terrain;
		const terrainNormal = <AbstractTexture2DArray>this.getPhysicalResource('TerrainNormal').colorAttachments[0].texture;
		const terrainWater = <AbstractTexture2DArray>this.getPhysicalResource('TerrainWater').colorAttachments[0].texture;
		const terrainWaterTileMask = <AbstractTexture2D>this.getPhysicalResource('TerrainWaterTileMask').colorAttachments[0].texture;
		const terrainUsage = <AbstractTexture2DArray>this.getPhysicalResource('TerrainUsage').colorAttachments[0].texture;
		const terrainUsageTileMask = <AbstractTexture2D>this.getPhysicalResource('TerrainUsageTileMask').colorAttachments[0].texture;
		const terrainRingHeight = <AbstractTexture2DArray>this.getPhysicalResource('TerrainRingHeight').colorAttachments[0].texture;
		const biomePos = MathUtils.meters2tile(camera.position.x, camera.position.z, 0);

		this.terrainMaterial.getUniform('tRingHeight').value = terrainRingHeight;
		this.terrainMaterial.getUniform('tNormal').value = terrainNormal;
		this.terrainMaterial.getUniform('tWater').value = terrainWater;
		this.terrainMaterial.getUniform('tWaterMask').value = terrainWaterTileMask;
		this.terrainMaterial.getUniform('tUsage').value = terrainUsage;
		this.terrainMaterial.getUniform('tUsageMask').value = terrainUsageTileMask;
		this.renderer.useMaterial(this.terrainMaterial);

		this.terrainMaterial.getUniform<UniformMatrix4>('projectionMatrix', 'PerMaterial').value =
			new Float32Array(camera.jitteredProjectionMatrix.values);
		this.terrainMaterial.getUniform('biomeCoordinates', 'PerMaterial').value = new Float32Array([biomePos.x, biomePos.y]);
		this.terrainMaterial.getUniform<UniformFloat1>('time', 'PerMaterial').value[0] = performance.now() * 0.001;
		// @ts-ignore
		this.terrainMaterial.getUniform<UniformFloat1>('usageRange', 'PerMaterial').value[0] = window.from ?? 0;
		// @ts-ignore
		this.terrainMaterial.getUniform<UniformFloat1>('usageRange', 'PerMaterial').value[1] = window.to ?? 0;
		this.terrainMaterial.updateUniformBlock('PerMaterial');

		for (let i = 0; i < terrain.children.length; i++) {
			const ring = terrain.children[i];
			const offsetSize = Config.TileSize * Config.TerrainDetailUVScale;
			const detailOffsetX = ring.position.x % offsetSize - ring.size / 2;
			const detailOffsetY = ring.position.z % offsetSize - ring.size / 2;

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
				detailOffsetX,
				detailOffsetY
			]);
			this.terrainMaterial.getUniform('cameraPosition', 'PerMesh').value = new Float32Array([
				camera.position.x - ring.position.x, camera.position.z - ring.position.z
			]);
			this.terrainMaterial.getUniform<UniformInt1>('levelId', 'PerMesh').value[0] = i;
			this.terrainMaterial.updateUniformBlock('PerMesh');

			ring.draw();
		}
	}

	private getTileDetailTextureOffset(tile: Tile): Float32Array {
		const offsetSize = Config.TileSize * Config.TerrainDetailUVScale;
		const detailOffsetX = tile.position.x % offsetSize;
		const detailOffsetY = tile.position.z % offsetSize;

		return new Float32Array([detailOffsetX, detailOffsetY]);
	}

	private renderProjectedMeshes(): void {
		const camera = this.manager.sceneSystem.objects.camera;
		const tiles = this.manager.sceneSystem.objects.tiles;
		const terrain = this.manager.sceneSystem.objects.terrain;

		const terrainNormal = <AbstractTexture2DArray>this.getPhysicalResource('TerrainNormal').colorAttachments[0].texture;
		const terrainRingHeight = <AbstractTexture2DArray>this.getPhysicalResource('TerrainRingHeight').colorAttachments[0].texture;

		this.projectedMeshMaterial.getUniform('tRingHeight').value = terrainRingHeight;
		this.projectedMeshMaterial.getUniform('tNormal').value = terrainNormal;

		this.renderer.useMaterial(this.projectedMeshMaterial);

		this.projectedMeshMaterial.getUniform<UniformMatrix4>('projectionMatrix', 'PerMaterial').value = new Float32Array(camera.jitteredProjectionMatrix.values);
		this.projectedMeshMaterial.updateUniformBlock('PerMaterial');

		for (const tile of tiles) {
			if (!tile.projectedMesh || !tile.projectedMesh.inCameraFrustum(camera)) {
				continue;
			}

			const tileParams = terrain.getTileParams(tile);

			if (!tileParams) {
				continue;
			}

			const {ring0, levelId, ring0Offset, ring1Offset} = tileParams;
			const normalTextureTransforms = this.getTileNormalTexturesTransforms(tile);
			const detailTextureOffset = this.getTileDetailTextureOffset(tile);

			const mvMatrix = Mat4.multiply(camera.matrixWorldInverse, tile.matrixWorld);
			const mvMatrixPrev = Mat4.multiply(this.cameraMatrixWorldInversePrev, tile.matrixWorld);
			const relativeCameraPosition = this.getCameraPositionRelativeToTile(camera, tile);

			this.projectedMeshMaterial.getUniform('modelViewMatrix', 'PerMesh').value = new Float32Array(mvMatrix.values);
			this.projectedMeshMaterial.getUniform('modelViewMatrixPrev', 'PerMesh').value = new Float32Array(mvMatrixPrev.values);
			this.projectedMeshMaterial.getUniform('transformNormal0', 'PerMesh').value = normalTextureTransforms[0];
			this.projectedMeshMaterial.getUniform('transformNormal1', 'PerMesh').value = normalTextureTransforms[1];
			this.projectedMeshMaterial.getUniform<UniformFloat1>('terrainRingSize', 'PerMesh').value[0] = ring0.size;
			this.projectedMeshMaterial.getUniform('terrainRingOffset', 'PerMesh').value = new Float32Array([
				ring0Offset.x, ring0Offset.y, ring1Offset.x, ring1Offset.y
			]);
			this.projectedMeshMaterial.getUniform<UniformFloat1>('terrainLevelId', 'PerMesh').value[0] = levelId;
			this.projectedMeshMaterial.getUniform<UniformFloat1>('segmentCount', 'PerMesh').value[0] = ring0.segmentCount * 2;
			this.projectedMeshMaterial.getUniform('cameraPosition', 'PerMesh').value = new Float32Array(relativeCameraPosition);
			this.projectedMeshMaterial.getUniform('detailTextureOffset', 'PerMesh').value = detailTextureOffset;
			this.projectedMeshMaterial.getUniform<UniformFloat1>('time', 'PerMaterial').value[0] = performance.now() * 0.001;

			this.projectedMeshMaterial.updateUniformBlock('PerMesh');

			tile.projectedMesh.draw();
		}
	}

	private renderHuggingMeshes(): void {
		const camera = this.manager.sceneSystem.objects.camera;
		const tiles = this.manager.sceneSystem.objects.tiles;
		const terrain = this.manager.sceneSystem.objects.terrain;

		const terrainNormal = <AbstractTexture2DArray>this.getPhysicalResource('TerrainNormal').colorAttachments[0].texture;
		const terrainRingHeight = <AbstractTexture2DArray>this.getPhysicalResource('TerrainRingHeight').colorAttachments[0].texture;

		this.huggingMeshMaterial.getUniform('tRingHeight').value = terrainRingHeight;
		this.huggingMeshMaterial.getUniform('tNormal').value = terrainNormal;

		this.renderer.useMaterial(this.huggingMeshMaterial);

		this.huggingMeshMaterial.getUniform<UniformMatrix4>('projectionMatrix', 'PerMaterial').value = new Float32Array(camera.jitteredProjectionMatrix.values);
		this.huggingMeshMaterial.updateUniformBlock('PerMaterial');

		for (const tile of tiles) {
			if (!tile.huggingMesh || !tile.huggingMesh.inCameraFrustum(camera)) {
				continue;
			}

			const tileParams = terrain.getTileParams(tile);

			if (!tileParams) {
				continue;
			}

			const {ring0, levelId, ring0Offset, ring1Offset} = tileParams;
			const normalTextureTransforms = this.getTileNormalTexturesTransforms(tile);

			const mvMatrix = Mat4.multiply(camera.matrixWorldInverse, tile.matrixWorld);
			const mvMatrixPrev = Mat4.multiply(this.cameraMatrixWorldInversePrev, tile.matrixWorld);
			const relativeCameraPosition = this.getCameraPositionRelativeToTile(camera, tile);

			this.huggingMeshMaterial.getUniform('modelViewMatrix', 'PerMesh').value = new Float32Array(mvMatrix.values);
			this.huggingMeshMaterial.getUniform('modelViewMatrixPrev', 'PerMesh').value = new Float32Array(mvMatrixPrev.values);
			this.huggingMeshMaterial.getUniform('transformNormal0', 'PerMesh').value = normalTextureTransforms[0];
			this.huggingMeshMaterial.getUniform('transformNormal1', 'PerMesh').value = normalTextureTransforms[1];
			this.huggingMeshMaterial.getUniform<UniformFloat1>('terrainRingSize', 'PerMesh').value[0] = ring0.size;
			this.huggingMeshMaterial.getUniform('terrainRingOffset', 'PerMesh').value = new Float32Array([
				ring0Offset.x, ring0Offset.y, ring1Offset.x, ring1Offset.y
			]);
			this.huggingMeshMaterial.getUniform<UniformFloat1>('terrainLevelId', 'PerMesh').value[0] = levelId;
			this.huggingMeshMaterial.getUniform<UniformFloat1>('segmentCount', 'PerMesh').value[0] = ring0.segmentCount * 2;
			this.huggingMeshMaterial.getUniform('cameraPosition', 'PerMesh').value = new Float32Array(relativeCameraPosition);
			this.huggingMeshMaterial.getUniform<UniformFloat1>('time', 'PerMaterial').value[0] = performance.now() * 0.001;
			this.huggingMeshMaterial.updateUniformBlock('PerMesh');

			tile.huggingMesh.draw();
		}
	}

	private renderInstances(instancesOrigin: Vec2): void {
		const camera = this.manager.sceneSystem.objects.camera;
		const tiles = this.manager.sceneSystem.objects.tiles;

		this.manager.sceneSystem.updateInstancedObjectsBuffers(tiles, camera, instancesOrigin);

		for (const [name, instancedObject] of this.manager.sceneSystem.objects.instancedObjects.entries()) {
			if (instancedObject.instanceCount === 0) {
				continue;
			}

			const materials: Record<InstanceStructure, AbstractMaterial> = {
				[InstanceStructure.Tree]: this.treeMaterial,
				[InstanceStructure.Generic]: this.genericInstanceMaterial,
				[InstanceStructure.Advanced]: this.advancedInstanceMaterial
			};

			const config = Tile3DInstanceLODConfig[name as Tile3DInstanceType];
			const material = materials[config.structure];
			const mvMatrixPrev = Mat4.multiply(this.cameraMatrixWorldInversePrev, instancedObject.matrixWorld);

			this.renderer.useMaterial(material);

			material.getUniform('projectionMatrix', 'MainBlock').value = new Float32Array(camera.jitteredProjectionMatrix.values);
			material.getUniform('modelMatrix', 'MainBlock').value = new Float32Array(instancedObject.matrixWorld.values);
			material.getUniform('viewMatrix', 'MainBlock').value = new Float32Array(camera.matrixWorldInverse.values);
			material.getUniform('modelViewMatrixPrev', 'MainBlock').value = new Float32Array(mvMatrixPrev.values);
			material.updateUniformBlock('MainBlock');

			const textureIdUniform = material.getUniform('textureId', 'PerInstanceType');

			if (textureIdUniform) {
				textureIdUniform.value = new Float32Array([InstanceTextureIdList[name as Tile3DInstanceType]]);
				material.updateUniformBlock('PerInstanceType');
			}

			instancedObject.mesh.draw();
		}
	}

	private renderAircraft(instancesOrigin: Vec2): void {
		const camera = this.manager.sceneSystem.objects.camera;
		const aircraftObjects = this.manager.sceneSystem.objects.instancedAircraftParts;
		const vehicleSystem = this.manager.systemManager.getSystem(VehicleSystem);

		vehicleSystem.updateBuffers(instancesOrigin);

		const buffers = vehicleSystem.aircraftPartsBuffers;

		for (const [partType, buffer] of buffers.entries()) {
			const object = aircraftObjects.get(partType);

			if (!object) {
				continue;
			}

			const instanceCount = buffer.length / 6;

			object.position.set(instancesOrigin.x, 0, instancesOrigin.y);
			object.updateMatrix();
			object.updateMatrixWorld();
			object.setInstancesInterleavedBuffer(buffer, instanceCount);

			if (instanceCount === 0) {
				continue;
			}

			const texture = AircraftPartTextures[partType];
			const mvMatrixPrev = Mat4.multiply(this.cameraMatrixWorldInversePrev, object.matrixWorld);

			this.renderer.useMaterial(this.aircraftMaterial);

			this.aircraftMaterial.getUniform('projectionMatrix', 'MainBlock').value = new Float32Array(camera.jitteredProjectionMatrix.values);
			this.aircraftMaterial.getUniform('modelMatrix', 'MainBlock').value = new Float32Array(object.matrixWorld.values);
			this.aircraftMaterial.getUniform('viewMatrix', 'MainBlock').value = new Float32Array(camera.matrixWorldInverse.values);
			this.aircraftMaterial.getUniform('modelViewMatrixPrev', 'MainBlock').value = new Float32Array(mvMatrixPrev.values);
			this.aircraftMaterial.getUniform('textureId', 'MainBlock').value = new Float32Array([texture]);
			this.aircraftMaterial.updateUniformBlock('MainBlock');

			object.mesh.draw();
		}
	}

	// Strata Phase 2 Increment 4 — THROWAWAY GLUE. Draw the car at the driven point as separate
	// parts: a body with the FULL transform matrix (yaw + pitch + roll, hugs the terrain) plus four
	// wheels, each with its own part matrix on top (spin + steer + per-wheel suspension). No moat
	// code here; entirely renderer-specific and disposable.
	private renderCar(instancesOrigin: Vec2): void {
		const controlsSystem = this.manager.systemManager.getSystem(ControlsSystem);

		if (!controlsSystem.isDriveActive) {
			return;
		}

		const camera = this.manager.sceneSystem.objects.camera;
		const car = this.manager.sceneSystem.objects.car;

		if (!car.isMeshReady()) {
			return;
		}

		const pose = controlsSystem.getDriveCarPose();

		// Car mesh is built nose-along-+X; yaw = -heading maps that to the driving direction.
		// CarHeadingOffset is a tuning knob if the nose ends up sideways/backwards.
		const CarHeadingOffset = 0;
		const yaw = -pose.heading + CarHeadingOffset;

		// modelMatrix = pure translation by instancesOrigin (precision pivot, kept on the GPU
		// separate from viewMatrix). The origin-relative transforms are built in double precision
		// here; the (pose - origin) translation stays small => no float jitter.
		// Order T * Ryaw * Rpitch * Rroll: roll about the nose, then pitch about the lateral
		// axis, then yaw about up — the natural vehicle order.
		const buildCarMatrix = (y: number, pitch: number, roll: number): Mat4 => {
			let m = Mat4.identity();
			m = Mat4.translate(m, pose.x - instancesOrigin.x, y, pose.z - instancesOrigin.y);
			m = Mat4.yRotate(m, yaw);
			m = Mat4.zRotate(m, pitch);
			m = Mat4.xRotate(m, roll);
			return m;
		};

		// carMatrix = ground pose — the WHEELS ride this, always planted on the terrain.
		// bodyMatrix = the sprung body pose (smoothed heave + weight-transfer/boost lean), applied
		// to the BODY mesh only so the wheels stay on the ground while the body bounces (ATV split).
		const carMatrix = buildCarMatrix(pose.y, pose.pitch, pose.roll);
		const bodyMatrix = buildCarMatrix(pose.bodyY, pose.bodyPitch, pose.bodyRoll);

		car.position.set(instancesOrigin.x, 0, instancesOrigin.y);
		car.updateMatrix();
		car.updateMatrixWorld();

		const material = this.carMaterial;
		const mvMatrixPrev = Mat4.multiply(this.cameraMatrixWorldInversePrev, car.matrixWorld);

		this.renderer.useMaterial(material);

		// Per-material uniforms are set once; only carMatrix changes per part below.
		material.getUniform('projectionMatrix', 'MainBlock').value = new Float32Array(camera.jitteredProjectionMatrix.values);
		material.getUniform('modelMatrix', 'MainBlock').value = new Float32Array(car.matrixWorld.values);
		material.getUniform('viewMatrix', 'MainBlock').value = new Float32Array(camera.matrixWorldInverse.values);
		material.getUniform('modelViewMatrixPrev', 'MainBlock').value = new Float32Array(mvMatrixPrev.values);

		// Sets carMatrix + the previous-frame carMatrix (slot's last value, or current on the first
		// frame) so the motion vector captures the car's own movement => no TAA flicker when driving.
		const drawPart = (slot: number, m: Mat4, mesh: AbstractMesh): void => {
			const prev = this.carMatricesPrev[slot] ?? m;
			material.getUniform('carMatrix', 'MainBlock').value = new Float32Array(m.values);
			material.getUniform('carMatrixPrev', 'MainBlock').value = new Float32Array(prev.values);
			material.updateUniformBlock('MainBlock');
			mesh.draw();
			this.carMatricesPrev[slot] = m;
		};

		// Step B: the dropped GLB, split into body + 4 axle-centered wheels, animated by the same rig.
		if (Car.useGLB && car.glbReady) {
			drawPart(0, bodyMatrix, car.glbBodyMesh);

			// GLB wheels are bigger than the procedural ones; rescale spin to the real radius so the
			// roll matches ground speed (pose.wheelSpin = distance / WheelRadius). Front and rear get
			// separate spins so a stationary donut spins ONLY the rears (front = wheelSpin, rear =
			// rearWheelSpin which carries the burnout).
			const radiusScale = WheelRadius / (car.glbWheelRadius || WheelRadius);
			const glbSpin = pose.wheelSpin * radiusScale;
			const glbRearSpin = pose.rearWheelSpin * radiusScale;

			for (let i = 0; i < car.glbWheels.length; i++) {
				const w = car.glbWheels[i];
				const mesh = car.glbWheelMeshes[i];
				if (!w || !mesh) continue;

				const susp = pose.suspension[i] ?? 0;

				let wheelMatrix = Mat4.identity();
				wheelMatrix = Mat4.translate(wheelMatrix, w.mountX, w.mountY + susp, w.mountZ);
				if (w.front) wheelMatrix = Mat4.yRotate(wheelMatrix, pose.steerAngle);
				wheelMatrix = Mat4.zRotate(wheelMatrix, w.front ? glbSpin : glbRearSpin);

				drawPart(i + 1, Mat4.multiply(carMatrix, wheelMatrix), mesh);
			}

			return;
		}

		// Body (leans on its springs; wheels below stay on the ground).
		drawPart(0, bodyMatrix, car.bodyMesh);

		// Four wheels, each = carMatrix * (translate to mount + suspension) * steer(Y) * spin(Z).
		// The wheel mesh is centred on its axle, so spin is a clean Z-rotation.
		for (let i = 0; i < CarWheelMounts.length; i++) {
			const mount = CarWheelMounts[i];
			const susp = pose.suspension[i] ?? 0;

			let wheelMatrix = Mat4.identity();
			wheelMatrix = Mat4.translate(wheelMatrix, mount.x, WheelRadius + susp, mount.z);

			if (mount.front) {
				wheelMatrix = Mat4.yRotate(wheelMatrix, pose.steerAngle);
			}

			// Front = rolling spin; rear = rearWheelSpin (carries the stationary-donut burnout).
			wheelMatrix = Mat4.zRotate(wheelMatrix, mount.front ? pose.wheelSpin : pose.rearWheelSpin);

			const fullMatrix = Mat4.multiply(carMatrix, wheelMatrix);

			drawPart(i + 1, fullMatrix, car.wheelMesh);
		}
	}

	private writeToObjectIdBuffer(): void {
		const mainRenderPass = this.getPhysicalResource('GBufferRenderPass');
		mainRenderPass.readColorAttachmentPixel(4, this.objectIdBuffer, this.objectIdX, this.objectIdY);
	}

	private getInstancesOrigin(camera: Camera): Vec2 {
		return new Vec2(
			Math.floor(camera.position.x / 10000) * 10000,
			Math.floor(camera.position.z / 10000) * 10000
		);
	}

	public render(): void {
		const camera = this.manager.sceneSystem.objects.camera;

		const instancesOrigin = this.getInstancesOrigin(camera);

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

		this.updateMaterialsDefines();

		const mainRenderPass = this.getPhysicalResource('GBufferRenderPass');
		this.renderer.beginRenderPass(mainRenderPass);

		this.renderSkybox();
		this.renderExtrudedMeshes();
		this.renderAircraft(instancesOrigin);
		this.renderTerrain();
		this.renderProjectedMeshes();
		this.renderHuggingMeshes();
		this.renderInstances(instancesOrigin);
		this.renderCar(instancesOrigin);
		this.writeToObjectIdBuffer();

		this.saveCameraMatrixWorldInverse();
	}

	private saveCameraMatrixWorldInverse(): void {
		this.cameraMatrixWorldInversePrev = this.manager.sceneSystem.objects.camera.matrixWorldInverse;
	}

	public setSize(width: number, height: number): void {

	}
}