import System from "../System";
import SystemManager from "../SystemManager";
import SceneSystem from "./SceneSystem";
import MathUtils from "~/lib/math/MathUtils";
import Vec2 from "~/lib/math/Vec2";
import Config from "../Config";
import HeightTileSource from "../world/terrain/HeightTileSource";
import WaterTileSource from "../world/terrain/WaterTileSource";
import TileAreaLoader from "../world/terrain/TileAreaLoader";
import Terrain from "~/app/objects/Terrain";
import Object3D from "~/lib/core/Object3D";

export interface TerrainAreaLoaders {
	water0: TileAreaLoader<WaterTileSource>;
	water1: TileAreaLoader<WaterTileSource>;
	height0: TileAreaLoader<HeightTileSource>;
	height1: TileAreaLoader<HeightTileSource>;
}

export default class TerrainSystem extends System {
	public maskOrigin: Vec2 = new Vec2();
	public areaLoaders: Readonly<TerrainAreaLoaders>;

	public postInit(): void {
		this.areaLoaders = {
			water0: new TileAreaLoader({
				sourceClass: WaterTileSource,
				zoom: 13,
				maxStoredTiles: 100,
				viewportSize: 4,
				bufferSize: 1
			}),
			water1: new TileAreaLoader({
				sourceClass: WaterTileSource,
				zoom: 9,
				maxStoredTiles: 100,
				viewportSize: 4,
				bufferSize: 1
			}),
			height0: new TileAreaLoader({
				sourceClass: HeightTileSource,
				zoom: 12,
				maxStoredTiles: 100,
				viewportSize: 4,
				bufferSize: 1
			}),
			height1: new TileAreaLoader({
				sourceClass: HeightTileSource,
				zoom: 9,
				maxStoredTiles: 100,
				viewportSize: 4,
				bufferSize: 1
			}),
		};
	}

	public update(deltaTime: number): void {
		const terrain = this.systemManager.getSystem(SceneSystem).objects.terrain;
		const camera = this.systemManager.getSystem(SceneSystem).objects.camera;

		this.updateAreaLoaders(camera);
		this.updateRingPositions(terrain, camera);
		this.updateRingAreaTransforms(terrain);
		this.updateRingMaskTransforms(terrain, camera);
	}

	private updateAreaLoaders(camera: Object3D): void {
		const cameraPosition2D = new Vec2(camera.position.x, camera.position.z);
		for (const areaLoader of Object.values(this.areaLoaders)) {
			(<TileAreaLoader<any>>areaLoader).update(cameraPosition2D);
		}
	}

	private updateRingPositions(terrain: Terrain, camera: Object3D): void {
		let currentStepX: number, currentStepY: number;

		for (let i = 0; i < terrain.children.length; i++) {
			const ring = terrain.children[i];
			const stepSize = ring.size / ring.segmentCount;

			ring.position.set(
				camera.position.x - MathUtils.mod(camera.position.x, stepSize),
				0,
				camera.position.z - MathUtils.mod(camera.position.z, -stepSize)
			);
			ring.updateMatrix();

			if (i === 0) {
				currentStepX = Math.floor(camera.position.x / stepSize);
				currentStepY = Math.floor(camera.position.z / stepSize);
			}

			ring.morphOffset[0] = currentStepX % 2 === 0 ? 0 : 2;
			ring.morphOffset[1] = currentStepY % 2 === 0 ? 0 : -2;

			if (i === terrain.children.length - 1) {
				ring.isLastRing = true;
			}

			currentStepX = Math.floor(currentStepX / 2);
			currentStepY = Math.floor(currentStepY / 2);
		}
	}

	private updateRingAreaTransforms(terrain: Terrain): void {
		for (const ring of terrain.children) {
			this.areaLoaders.water0.transformToArray(
				ring.position.x - ring.size / 2,
				ring.position.z - ring.size / 2,
				ring.size,
				ring.waterTextureTransform0
			);
			this.areaLoaders.water1.transformToArray(
				ring.position.x - ring.size / 2,
				ring.position.z - ring.size / 2,
				ring.size,
				ring.waterTextureTransform1
			);
			this.areaLoaders.height0.transformToArray(
				ring.position.x - ring.size / 2,
				ring.position.z - ring.size / 2,
				ring.size,
				ring.heightTextureTransform0
			);
			this.areaLoaders.height1.transformToArray(
				ring.position.x - ring.size / 2,
				ring.position.z - ring.size / 2,
				ring.size,
				ring.heightTextureTransform1
			);
		}
	}

	private updateRingMaskTransforms(terrain: Terrain, camera: Object3D): void {
		const cameraTilePosition = MathUtils.meters2tile(camera.position.x, camera.position.z);
		const startX = Math.floor(cameraTilePosition.x) - Math.floor(Config.TerrainWaterMaskResolution / 2);
		const startY = Math.floor(cameraTilePosition.y) - Math.floor(Config.TerrainWaterMaskResolution / 2);
		const startMeters = MathUtils.tile2meters(startX, startY + Config.TerrainWaterMaskResolution);

		this.maskOrigin.set(startX, startY);

		for (const ring of terrain.children) {
			const maskWorldSize = Config.TileSize * Config.TerrainWaterMaskResolution;
			const maskScale = ring.size / maskWorldSize;
			const maskOffsetX = (ring.position.x - ring.size / 2 - startMeters.x) / maskWorldSize;
			const maskOffsetY = (ring.position.z - ring.size / 2 - startMeters.y) / maskWorldSize;

			ring.maskTextureTransform[0] = maskOffsetX;
			ring.maskTextureTransform[1] = maskOffsetY;
			ring.maskTextureTransform[2] = maskScale;
		}
	}
}