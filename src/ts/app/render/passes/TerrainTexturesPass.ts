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
import TerrainWaterMaterialContainer from "~/app/render/materials/TerrainWaterMaterialContainer";
import WaterMask from "~/app/objects/WaterMask";
import RenderableObject3D from "~/app/objects/RenderableObject3D";
import TileSystem from "~/app/systems/TileSystem";
import Config from "~/app/Config";
import TerrainRingHeightMaterialContainer from "~/app/render/materials/TerrainRingHeightMaterialContainer";
import {UniformFloat1, UniformFloat2, UniformFloat3, UniformInt1} from "~/renderer/abstract-renderer/Uniform";
import TerrainHeightDownscaleMaterialContainer from "~/app/render/materials/TerrainHeightDownscaleMaterialContainer";

const TileResolution = 512;

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
	private heightDownscaleMaterial: AbstractMaterial;
	private normalMaterial: AbstractMaterial;
	private waterMaterial: AbstractMaterial;

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
		this.heightDownscaleMaterial = new TerrainHeightDownscaleMaterialContainer(this.renderer).material;
		this.normalMaterial = new TerrainNormalMaterialContainer(this.renderer).material;
		this.waterMaterial = new TerrainWaterMaterialContainer(this.renderer).material;
		this.quad = new FullScreenQuad(this.renderer);

		const textureSize = 4 * 512;

		this.getResource('TerrainHeight').descriptor.setSize(textureSize, textureSize);
		this.getResource('TerrainNormal').descriptor.setSize(textureSize, textureSize);
		this.getResource('TerrainWater').descriptor.setSize(2048, 2048, 2);
	}

	public render(): void {
		const fullScreenTriangle = this.manager.renderSystem.fullScreenTriangle;
		const camera = this.manager.sceneSystem.objects.camera;
		const terrainSystem = this.manager.systemManager.getSystem(TerrainSystem);
		const tileSystem = this.manager.systemManager.getSystem(TileSystem);
		const terrain = this.manager.sceneSystem.objects.terrain;

		const terrainHeightRenderPass = this.getPhysicalResource('TerrainHeight');
		const terrainNormalRenderPass = this.getPhysicalResource('TerrainNormal');
		const terrainWaterRenderPass = this.getPhysicalResource('TerrainWater');
		const terrainRingHeightRenderPass = this.getPhysicalResource('TerrainRingHeight');

		/*const heightTilesToRender: HeightTileSource[] = [];

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
		}*/

		const heightTex = <AbstractTexture2D>terrainHeightRenderPass.colorAttachments[0].texture;

		{
			const heightLoader = terrainSystem.areaLoaders.height0;
			const dirtyTiles = heightLoader.getDirtyTileStates();

			this.heightMaterial.getUniform('tMap').value = null;
			this.renderer.useMaterial(this.heightMaterial);

			terrainHeightRenderPass.colorAttachments[0].level = 0;
			this.renderer.beginRenderPass(terrainHeightRenderPass);

			for (const tileState of dirtyTiles) {
				const x = tileState.localX;
				const y = tileState.localY;
				const count = heightLoader.viewportSize;

				const scale = 1 / count;
				const transform = [x * scale, (count - y - 1) * scale, scale];

				this.heightMaterial.getUniform('tMap').value = tileState.tile.getTexture(this.renderer);
				this.heightMaterial.getUniform('transform', 'MainBlock').value = new Float32Array(transform);
				this.heightMaterial.updateUniformBlock('MainBlock');
				this.heightMaterial.updateUniform('tMap');

				this.quad.mesh.draw();
			}
		}

		for (let i = 0; i < 5; i++) {
			terrainHeightRenderPass.colorAttachments[0].level = i + 1;
			this.renderer.beginRenderPass(terrainHeightRenderPass);

			heightTex.baseLevel = i;
			heightTex.maxLevel = i;
			heightTex.updateBaseAndMaxLevel();

			this.heightDownscaleMaterial.getUniform('tMap').value = heightTex;
			this.renderer.useMaterial(this.heightDownscaleMaterial);

			this.manager.renderSystem.fullScreenTriangle.mesh.draw();
		}

		heightTex.baseLevel = 0;
		heightTex.maxLevel = 10000;
		heightTex.updateBaseAndMaxLevel();

		this.ringHeightMaterial.getUniform('tHeight').value = <AbstractTexture2D>terrainHeightRenderPass.colorAttachments[0].texture;
		this.renderer.useMaterial(this.ringHeightMaterial);

		for (let i = 0; i < terrain.children.length; i++) {
			const ring = terrain.children[i];

			terrainRingHeightRenderPass.colorAttachments[0].slice = i;
			this.renderer.beginRenderPass(terrainRingHeightRenderPass);

			this.ringHeightMaterial.getUniform<UniformFloat3>('transformHeight', 'PerMesh').value = ring.heightTextureTransform0;
			this.ringHeightMaterial.getUniform<UniformFloat2>('morphOffset', 'PerMesh').value = ring.morphOffset;
			this.ringHeightMaterial.getUniform<UniformFloat1>('size', 'PerMesh').value[0] = ring.size;
			this.ringHeightMaterial.getUniform<UniformFloat1>('segmentCount', 'PerMesh').value[0] = ring.segmentCount * 2;
			this.ringHeightMaterial.getUniform<UniformFloat1>('isLastRing', 'PerMesh').value[0] = +ring.isLastRing;
			this.ringHeightMaterial.getUniform('cameraPosition', 'PerMesh').value = new Float32Array([camera.position.x - ring.position.x, camera.position.z - ring.position.z]);
			this.ringHeightMaterial.getUniform<UniformInt1>('levelId', 'PerMesh').value[0] = i + 2;
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