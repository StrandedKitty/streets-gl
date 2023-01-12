import Pass from '~/app/render/passes/Pass';
import * as RG from "~/render-graph";
import PassManager from '~/app/render/PassManager';
import AbstractMaterial from '~/renderer/abstract-renderer/AbstractMaterial';
import TerrainHeightMaterialContainer from "~/app/render/materials/TerrainHeightMaterialContainer";
import TerrainSystem from "~/app/systems/TerrainSystem";
import FullScreenQuad from "~/app/objects/FullScreenQuad";
import AbstractTexture2D from "~/renderer/abstract-renderer/AbstractTexture2D";
import {RendererTypes} from "~/renderer/RendererTypes";
import RenderPassResource from "~/app/render/render-graph/resources/RenderPassResource";
import TerrainNormalMaterialContainer from "~/app/render/materials/TerrainNormalMaterialContainer";
import AbstractRenderer from "~/renderer/abstract-renderer/AbstractRenderer";
import HeightTileSource from "~/app/world/terrain/HeightTileSource";
import WaterTileSource from "~/app/world/terrain/WaterTileSource";
import TerrainWaterMaterialContainer from "~/app/render/materials/TerrainWaterMaterialContainer";
import WaterMask from "~/app/objects/WaterMask";
import RenderableObject3D from "~/app/objects/RenderableObject3D";
import TileSystem from "~/app/systems/TileSystem";
import Config from "~/app/Config";
import TerrainRingHeightMaterialContainer from "~/app/render/materials/TerrainRingHeightMaterialContainer";
import {UniformFloat1, UniformFloat2, UniformFloat3, UniformInt1} from "~/renderer/abstract-renderer/Uniform";

const TileResolution = 512;
const MaxCachedTiles = 64;

class TileTextureStorage {
	private cache: Map<string, {
		texture: AbstractTexture2D;
		lastUsed: number;
	}> = new Map();

	public constructor(private system: TerrainSystem, private renderer: AbstractRenderer) {

	}

	public get(x: number, y: number): AbstractTexture2D {
		const key = `${x} ${y}`;
		const cached = this.cache.get(key);

		if (cached) {
			cached.lastUsed = performance.now();
			return cached.texture;
		}

		const source = this.system.getHeightTileSource(x, y);

		if (!source || !source.data) {
			return null;
		}

		return this.createTexture(x, y, source.data);
	}

	private createTexture(x: number, y: number, bitmap: ImageBitmap): AbstractTexture2D {
		const texture = this.renderer.createTexture2D({
			width: bitmap.width,
			height: bitmap.height,
			format: RendererTypes.TextureFormat.RGBA8Unorm,
			mipmaps: false,
			data: bitmap
		});
		this.cache.set(`${x} ${y}`, {
			texture,
			lastUsed: performance.now()
		});

		if (this.cache.size > MaxCachedTiles) {
			this.deleteLeastUsedTexture();
		}

		return texture;
	}

	private deleteLeastUsedTexture(): void {
		let leastUsedKey: string = null;
		let leastUsedTime: number = Infinity;

		for (const [key, cached] of this.cache.entries()) {
			if (cached.lastUsed < leastUsedTime) {
				leastUsedKey = key;
				leastUsedTime = cached.lastUsed;
			}
		}

		if (leastUsedKey) {
			const cached = this.cache.get(leastUsedKey);
			cached.texture.delete();
			this.cache.delete(leastUsedKey);
		}
	}
}

class TileMeshStorage {
	private cache: Map<string, {
		mesh: RenderableObject3D;
		lastUsed: number;
	}> = new Map();

	public constructor(private system: TerrainSystem, private renderer: AbstractRenderer) {

	}

	public get(x: number, y: number): RenderableObject3D {
		const key = `${x} ${y}`;
		const cached = this.cache.get(key);

		if (cached) {
			cached.lastUsed = performance.now();
			return cached.mesh;
		}

		const source = this.system.getWaterTileSource(x, y);

		if (!source || !source.data) {
			return null;
		}

		return this.createMesh(x, y, source.data);
	}

	private createMesh(x: number, y: number, vertices: Float32Array): RenderableObject3D {
		const waterMask = new WaterMask(vertices);
		waterMask.updateMesh(this.renderer);

		this.cache.set(`${x} ${y}`, {
			mesh: waterMask,
			lastUsed: performance.now()
		});

		if (this.cache.size > MaxCachedTiles) {
			this.deleteLeastUsedTexture();
		}

		return waterMask;
	}

	private deleteLeastUsedTexture(): void {
		let leastUsedKey: string = null;
		let leastUsedTime: number = Infinity;

		for (const [key, cached] of this.cache.entries()) {
			if (cached.lastUsed < leastUsedTime) {
				leastUsedKey = key;
				leastUsedTime = cached.lastUsed;
			}
		}

		if (leastUsedKey) {
			const cached = this.cache.get(leastUsedKey);
			cached.mesh.mesh.delete();
			this.cache.delete(leastUsedKey);
		}
	}
}

function compareTypedArrays(a: TypedArray, b: TypedArray): boolean {
	let i = a.length;

	while (i--) {
		if (a[i] !== b[i]) return false;
	}

	return true;
}

interface HeightMapState {
	empty: boolean;
	x: number;
	y: number;
}

export default class TerrainTexturesPass extends Pass<{
	TerrainHeight: {
		type: RG.InternalResourceType.Output;
		resource: RenderPassResource;
	};
	TerrainNormal: {
		type: RG.InternalResourceType.Output;
		resource: RenderPassResource;
	};
	TerrainWater: {
		type: RG.InternalResourceType.Output;
		resource: RenderPassResource;
	};
	TerrainTileMask: {
		type: RG.InternalResourceType.Output;
		resource: RenderPassResource;
	};
	TerrainRingHeight: {
		type: RG.InternalResourceType.Output;
		resource: RenderPassResource;
	};
}> {
	private quad: FullScreenQuad;
	private heightMaterial: AbstractMaterial;
	private ringHeightMaterial: AbstractMaterial;
	private normalMaterial: AbstractMaterial;
	private waterMaterial: AbstractMaterial;
	private heightStorage: TileTextureStorage;
	private waterStorage: TileMeshStorage;
	private heightMapStates: HeightMapState[];

	public constructor(manager: PassManager) {
		super('TerrainTexturesPass', manager, {
			TerrainHeight: {type: RG.InternalResourceType.Output, resource: manager.getSharedResource('TerrainHeight')},
			TerrainNormal: {type: RG.InternalResourceType.Output, resource: manager.getSharedResource('TerrainNormal')},
			TerrainWater: {type: RG.InternalResourceType.Output, resource: manager.getSharedResource('TerrainWater')},
			TerrainTileMask: {type: RG.InternalResourceType.Output, resource: manager.getSharedResource('TerrainTileMask')},
			TerrainRingHeight: {type: RG.InternalResourceType.Output, resource: manager.getSharedResource('TerrainRingHeight')}
		});

		this.init();
	}

	private init(): void {
		this.heightMaterial = new TerrainHeightMaterialContainer(this.renderer).material;
		this.ringHeightMaterial = new TerrainRingHeightMaterialContainer(this.renderer).material;
		this.normalMaterial = new TerrainNormalMaterialContainer(this.renderer).material;
		this.waterMaterial = new TerrainWaterMaterialContainer(this.renderer).material;
		this.quad = new FullScreenQuad(this.renderer);

		const terrainSystem = this.manager.systemManager.getSystem(TerrainSystem);
		const textureSize = Config.TerrainHeightMapCount * TileResolution;

		this.getResource('TerrainHeight').descriptor.setSize(textureSize, textureSize);
		this.getResource('TerrainNormal').descriptor.setSize(textureSize, textureSize);
		this.getResource('TerrainWater').descriptor.setSize(2048, 2048, 2);

		this.heightStorage = new TileTextureStorage(terrainSystem, this.renderer);
		this.waterStorage = new TileMeshStorage(terrainSystem, this.renderer);

		this.initHeightMapStates();
	}

	private initHeightMapStates(): void {
		this.heightMapStates = [];

		for (let i = 0; i < Config.TerrainHeightMapCount ** 2; i++) {
			this.heightMapStates.push({
				empty: true,
				x: -1,
				y: -1
			});
		}
	}

	private getHeightMapState(x: number, y: number): HeightMapState {
		return this.heightMapStates[x + y * Config.TerrainHeightMapCount];
	}

	public render(): void {
		const camera = this.manager.sceneSystem.objects.camera;
		const terrainSystem = this.manager.systemManager.getSystem(TerrainSystem);
		const tileSystem = this.manager.systemManager.getSystem(TileSystem);
		const terrain = this.manager.sceneSystem.objects.terrain;

		const terrainHeightRenderPass = this.getPhysicalResource('TerrainHeight');
		const terrainNormalRenderPass = this.getPhysicalResource('TerrainNormal');
		const terrainWaterRenderPass = this.getPhysicalResource('TerrainWater');
		const terrainRingHeightRenderPass = this.getPhysicalResource('TerrainRingHeight');

		const heightTilesToRender: HeightTileSource[] = [];
		const waterTilesToRender: WaterTileSource[] = [];

		for (let x = 0; x < Config.TerrainHeightMapCount; x++) {
			for (let y = 0; y < Config.TerrainHeightMapCount; y++) {
				const heightTile = terrainSystem.getHeightTileSource(x + terrainSystem.lastHeightTilePivot.x, y + terrainSystem.lastHeightTilePivot.y);
				const waterTile = terrainSystem.getWaterTileSource(x + terrainSystem.lastHeightTilePivot.x, y + terrainSystem.lastHeightTilePivot.y);

				if (!heightTile || !heightTile.data || !waterTile || !waterTile.data) {
					continue;
				}

				const state = this.getHeightMapState(x, y);

				if (state.x === heightTile.x && state.y === heightTile.y) {
					continue;
				}

				state.empty = false;
				state.x = heightTile.x;
				state.y = heightTile.y;

				heightTilesToRender.push(heightTile);
				waterTilesToRender.push(waterTile);
			}
		}

		this.renderer.beginRenderPass(terrainHeightRenderPass);
		this.renderer.useMaterial(this.heightMaterial);

		for (const tile of heightTilesToRender) {
			const x = tile.x - terrainSystem.lastHeightTilePivot.x;
			const y = tile.y - terrainSystem.lastHeightTilePivot.y;

			const scale = 1 / Config.TerrainHeightMapCount;
			const transform = [(Config.TerrainHeightMapCount - y) * scale, x * scale, scale];

			this.heightMaterial.getUniform('tMap').value = this.heightStorage.get(tile.x, tile.y);
			this.heightMaterial.getUniform('transform', 'MainBlock').value = new Float32Array(transform);
			this.heightMaterial.updateUniform('tMap');
			this.heightMaterial.updateUniformBlock('MainBlock');

			this.quad.mesh.draw();
		}

		terrainHeightRenderPass.colorAttachments[0].texture.generateMipmaps();

		this.ringHeightMaterial.getUniform('tHeight').value = <AbstractTexture2D>terrainHeightRenderPass.colorAttachments[0].texture;
		this.renderer.useMaterial(this.ringHeightMaterial);

		for (let i = 0; i < terrain.children.length; i++) {
			const ring = terrain.children[i];

			terrainRingHeightRenderPass.colorAttachments[0].slice = i;
			this.renderer.beginRenderPass(terrainRingHeightRenderPass);

			this.ringHeightMaterial.getUniform<UniformFloat3>('transformHeight', 'PerMesh').value = ring.heightTextureTransform;
			this.ringHeightMaterial.getUniform<UniformFloat2>('morphOffset', 'PerMesh').value = ring.morphOffset;
			this.ringHeightMaterial.getUniform<UniformFloat1>('size', 'PerMesh').value[0] = ring.size;
			this.ringHeightMaterial.getUniform<UniformFloat1>('segmentCount', 'PerMesh').value[0] = ring.segmentCount * 2;
			this.ringHeightMaterial.getUniform<UniformFloat1>('isLastRing', 'PerMesh').value[0] = +ring.isLastRing;
			this.ringHeightMaterial.getUniform('cameraPosition', 'PerMesh').value = new Float32Array([camera.position.x - ring.position.x, camera.position.z - ring.position.z]);
			this.ringHeightMaterial.getUniform<UniformInt1>('levelId', 'PerMesh').value[0] = i;
			this.ringHeightMaterial.updateUniformBlock('PerMesh');

			this.quad.mesh.draw();
		}

		const waterLoaders = [
			terrainSystem.areaLoaders.water0,
			terrainSystem.areaLoaders.water1
		];
		let waterMaterialInUse = false;

		for (let i = 0; i < waterLoaders.length; i++) {
			const waterLoader = waterLoaders[i];
			const dirtyTiles = waterLoader.getDirtyTileStates();

			if (dirtyTiles.length === 0) {
				continue;
			}

			if (!waterMaterialInUse) {
				this.renderer.useMaterial(this.waterMaterial);
				waterMaterialInUse = true;
			}

			terrainWaterRenderPass.colorAttachments[0].slice = i;
			this.renderer.beginRenderPass(terrainWaterRenderPass);

			for (const tileState of dirtyTiles) {
				const x = tileState.localX;
				const y = tileState.localY;
				const count = waterLoader.viewportSize;

				const scale = 1 / count;
				const transform = [x * scale, (count - y - 1) * scale, scale];

				this.waterMaterial.getUniform('transform', 'MainBlock').value = new Float32Array(transform);
				this.waterMaterial.getUniform('fillValue', 'MainBlock').value = new Float32Array([0]);
				this.waterMaterial.updateUniformBlock('MainBlock');

				this.quad.mesh.draw();

				this.waterMaterial.getUniform('fillValue', 'MainBlock').value = new Float32Array([1]);
				this.waterMaterial.updateUniformBlock('MainBlock');

				const mesh = tileState.tile.getMesh(this.renderer);

				mesh.draw();
			}
		}

		this.renderer.beginRenderPass(terrainNormalRenderPass);
		this.normalMaterial.getUniform('tHeight').value = <AbstractTexture2D>terrainHeightRenderPass.colorAttachments[0].texture;
		this.renderer.useMaterial(this.normalMaterial);
		this.quad.mesh.draw();

		this.updateTileMask(terrainSystem, tileSystem);
	}

	private updateTileMask(terrainSystem: TerrainSystem, tileSystem: TileSystem): void {
		const tileMaskTexture = <AbstractTexture2D>this.getPhysicalResource('TerrainTileMask').colorAttachments[0].texture;
		const buffer = new Uint8Array(tileMaskTexture.width * tileMaskTexture.height);
		const start = terrainSystem.maskOriginTiles;

		for (let x = 0; x < tileMaskTexture.width; x++) {
			for (let y = 0; y < tileMaskTexture.height; y++) {
				const tile = tileSystem.getTile(x + start.x, y + start.y);

				if (tile) {
					buffer[x + y * tileMaskTexture.width] = tile.roads ? 255 : 0;
				}
			}
		}

		if (tileMaskTexture.data === null || !compareTypedArrays(tileMaskTexture.data as Uint8Array, buffer)) {
			tileMaskTexture.data = buffer;
			tileMaskTexture.updateFromData();
		}
	}

	public setSize(width: number, height: number): void {

	}
}