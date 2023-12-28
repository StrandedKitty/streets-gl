import Pass from './Pass';
import * as RG from "~/lib/render-graph";
import PassManager from '../PassManager';
import AbstractMaterial from '~/lib/renderer/abstract-renderer/AbstractMaterial';
import TerrainHeightMaterialContainer from "../materials/TerrainHeightMaterialContainer";
import TerrainSystem from "../../systems/TerrainSystem";
import FullScreenQuad from "../../objects/FullScreenQuad";
import AbstractTexture2D from "~/lib/renderer/abstract-renderer/AbstractTexture2D";
import RenderPassResource from "../render-graph/resources/RenderPassResource";
import TerrainNormalMaterialContainer from "../materials/TerrainNormalMaterialContainer";
import TerrainWaterMaterialContainer from "../materials/TerrainWaterMaterialContainer";
import TileSystem from "../../systems/TileSystem";
import TerrainRingHeightMaterialContainer from "../materials/TerrainRingHeightMaterialContainer";
import {
	UniformFloat1,
	UniformFloat2,
	UniformFloat3,
	UniformInt1,
	UniformInt4
} from "~/lib/renderer/abstract-renderer/Uniform";
import TerrainHeightDownscaleMaterialContainer from "../materials/TerrainHeightDownscaleMaterialContainer";
import AbstractTexture2DArray from "~/lib/renderer/abstract-renderer/AbstractTexture2DArray";
import MathUtils from "~/lib/math/MathUtils";
import {TileAreaLoaderCellStateType} from "~/app/terrain/TileAreaLoader";
import Texture2DArrayScalableStorage, {BinaryTreeNodeAttachment} from "~/app/render/Texture2DArrayScalableStorage";
import TerrainUsageMaterialContainer from "~/app/render/materials/TerrainUsageMaterialContainer";
import TerrainUsageBlurMaterialContainer from "~/app/render/materials/TerrainUsageBlurMaterialContainer";
import TerrainUsageSDFMaterialContainer from "~/app/render/materials/TerrainUsageSDFMaterialContainer";
import AbstractRenderPass from "~/lib/renderer/abstract-renderer/AbstractRenderPass";
import TerrainUsageSDFDownscaleMaterialContainer
	from "~/app/render/materials/TerrainUsageSDFDownscaleMaterialContainer";
import ClearUintMaterialContainer from "~/app/render/materials/ClearUintMaterialContainer";
import Tile from "~/app/objects/Tile";
import Config from "~/app/Config";

function compareTypedArrays(a: TypedArray, b: TypedArray): boolean {
	let i = a.length;

	while (i--) {
		if (a[i] !== b[i]) return false;
	}

	return true;
}

const TerrainRingHeightConfig: number[][] = [
	[1, 0, 2, 0],
	[2, 0, 3, 0],
	[3, 0, 0, 1],
	[0, 1, 1, 1],
	[1, 1, 2, 1],
	[2, 1, 3, 1],
];

export default class TerrainTexturesPass extends Pass<{
	TerrainHeight: {
		type: RG.InternalResourceType.Local;
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
	TerrainWaterTileMask: {
		type: RG.InternalResourceType.Output;
		resource: RenderPassResource;
	};
	TerrainRingHeight: {
		type: RG.InternalResourceType.Output;
		resource: RenderPassResource;
	};
	TerrainUsage: {
		type: RG.InternalResourceType.Output;
		resource: RenderPassResource;
	};
	TerrainUsageTemp0: {
		type: RG.InternalResourceType.Output;
		resource: RenderPassResource;
	};
	TerrainUsageTemp1: {
		type: RG.InternalResourceType.Output;
		resource: RenderPassResource;
	};
	TerrainUsageTemp2: {
		type: RG.InternalResourceType.Output;
		resource: RenderPassResource;
	};
	TerrainUsageTileMask: {
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
	private usageMaterial: AbstractMaterial;
	private usageBlurMaterial: AbstractMaterial;
	private usageSDFMaterial: AbstractMaterial;
	private usageSDFDownscaleMaterial0: AbstractMaterial;
	private usageSDFDownscaleMaterial1: AbstractMaterial;
	private uintClearMaterial: AbstractMaterial;
	private tileMaskStorage: Texture2DArrayScalableStorage;

	private shouldRenderHeight: boolean = true;

	public constructor(manager: PassManager) {
		super('TerrainTexturesPass', manager, {
			TerrainHeight: {type: RG.InternalResourceType.Local, resource: manager.getSharedResource('TerrainHeight')},
			TerrainNormal: {type: RG.InternalResourceType.Output, resource: manager.getSharedResource('TerrainNormal')},
			TerrainWater: {type: RG.InternalResourceType.Output, resource: manager.getSharedResource('TerrainWater')},
			TerrainWaterTileMask: {type: RG.InternalResourceType.Output, resource: manager.getSharedResource('TerrainWaterTileMask')},
			TerrainRingHeight: {type: RG.InternalResourceType.Output, resource: manager.getSharedResource('TerrainRingHeight')},
			TerrainUsage: {type: RG.InternalResourceType.Output, resource: manager.getSharedResource('TerrainUsage')},
			TerrainUsageTemp0: {type: RG.InternalResourceType.Output, resource: manager.getSharedResource('TerrainUsageTemp0')},
			TerrainUsageTemp1: {type: RG.InternalResourceType.Output, resource: manager.getSharedResource('TerrainUsageTemp1')},
			TerrainUsageTemp2: {type: RG.InternalResourceType.Output, resource: manager.getSharedResource('TerrainUsageTemp2')},
			TerrainUsageTileMask: {type: RG.InternalResourceType.Output, resource: manager.getSharedResource('TerrainUsageTileMask')},
		});

		this.init();
		this.listenToSettings();
	}

	private init(): void {
		this.heightMaterial = new TerrainHeightMaterialContainer(this.renderer).material;
		this.ringHeightMaterial = new TerrainRingHeightMaterialContainer(this.renderer).material;
		this.heightDownscaleMaterial = new TerrainHeightDownscaleMaterialContainer(this.renderer).material;
		this.normalMaterial = new TerrainNormalMaterialContainer(this.renderer).material;
		this.waterMaterial = new TerrainWaterMaterialContainer(this.renderer).material;
		this.usageMaterial = new TerrainUsageMaterialContainer(this.renderer).material;
		this.usageBlurMaterial = new TerrainUsageBlurMaterialContainer(this.renderer).material;
		this.usageSDFMaterial = new TerrainUsageSDFMaterialContainer(this.renderer).material;
		this.usageSDFDownscaleMaterial0 = new TerrainUsageSDFDownscaleMaterialContainer(this.renderer, true).material;
		this.usageSDFDownscaleMaterial1 = new TerrainUsageSDFDownscaleMaterialContainer(this.renderer, false).material;
		this.uintClearMaterial = new ClearUintMaterialContainer(this.renderer).material;
		this.quad = new FullScreenQuad(this.renderer);

		const textureSize = 4 * 512;

		this.getResource('TerrainHeight').descriptor.setSize(textureSize, textureSize, 2);
		this.getResource('TerrainNormal').descriptor.setSize(textureSize, textureSize, 2);
		this.getResource('TerrainWater').descriptor.setSize(2048, 2048, 2);

		this.tileMaskStorage = new Texture2DArrayScalableStorage(8);

		const usageTileSize = 512;

		this.getResource('TerrainUsage').descriptor.setSize(usageTileSize, usageTileSize, 256);
		this.getResource('TerrainUsageTemp0').descriptor.setSize(usageTileSize * 4, usageTileSize * 4);
		this.getResource('TerrainUsageTemp1').descriptor.setSize(usageTileSize * 4, usageTileSize * 4);
		this.getResource('TerrainUsageTemp2').descriptor.setSize(usageTileSize * 2, usageTileSize * 2);
	}

	private listenToSettings(): void {
		this.manager.settings.onChange('terrainHeight', ({statusValue}) => {
			this.shouldRenderHeight = statusValue === 'on';
		}, true);
	}

	public render(): void {
		if (this.shouldRenderHeight) {
			this.renderTerrainHeightAndNormals();
			this.renderTerrainRings();
		}

		this.updateWater();
		this.updateWaterTileMask();

		this.updateTerrainMask();
		this.updateTerrainTileMask();
	}

	private renderTerrainHeightAndNormals(): void {
		const terrainSystem = this.manager.systemManager.getSystem(TerrainSystem);

		const terrainHeightRenderPass = this.getPhysicalResource('TerrainHeight');
		const terrainNormalRenderPass = this.getPhysicalResource('TerrainNormal');

		const heightTex = <AbstractTexture2D>terrainHeightRenderPass.colorAttachments[0].texture;

		const heightLoaders = [terrainSystem.areaLoaders.height0, terrainSystem.areaLoaders.height1];
		const heightLoadersUpdateFlags = [false, false];

		this.heightMaterial.getUniform('tMap').value = null;
		this.renderer.useMaterial(this.heightMaterial);

		for (let layer = 0; layer < heightLoaders.length; layer++) {
			const heightLoader = heightLoaders[layer];
			const dirtyTiles = heightLoader.getDirtyTileStates();

			terrainHeightRenderPass.colorAttachments[0].level = 0;
			terrainHeightRenderPass.colorAttachments[0].slice = layer;
			this.renderer.beginRenderPass(terrainHeightRenderPass);

			if (dirtyTiles.length > 0) {
				heightLoadersUpdateFlags[layer] = true;
			}

			for (const tileState of dirtyTiles) {
				const x = tileState.localX;
				const y = tileState.localY;
				const count = heightLoader.viewportSize;
				const mercatorScaleFactor = MathUtils.getMercatorScaleFactorForTile(tileState.x, tileState.y, heightLoader.zoom);

				const scale = 1 / count;
				const transform = [x * scale, (count - y - 1) * scale, scale];

				const map = tileState.type === TileAreaLoaderCellStateType.WithData ?
					tileState.tile.getTexture(this.renderer) : null;
				const heightScale = tileState.type === TileAreaLoaderCellStateType.WithData ? mercatorScaleFactor : 0;

				this.heightMaterial.getUniform('tMap').value = map;
				this.heightMaterial.getUniform('transform', 'MainBlock').value = new Float32Array(transform);
				this.heightMaterial.getUniform<UniformFloat1>('scale', 'MainBlock').value[0] = heightScale;
				this.heightMaterial.updateUniformBlock('MainBlock');
				this.heightMaterial.updateUniform('tMap');

				this.quad.mesh.draw();
			}
		}

		heightTex.generateMipmaps();

		/*this.renderer.useMaterial(this.heightDownscaleMaterial);

		for (let layer = 0; layer < 2; layer++) {
			if (!heightLoadersUpdateFlags[layer]) {
				continue;
			}

			this.heightDownscaleMaterial.getUniform<UniformInt1>('layer', 'MainBlock').value[0] = layer;
			this.heightDownscaleMaterial.updateUniformBlock('MainBlock');

			for (let i = 0; i < 5; i++) {
				terrainHeightRenderPass.colorAttachments[0].level = i + 1;
				terrainHeightRenderPass.colorAttachments[0].slice = layer;
				this.renderer.beginRenderPass(terrainHeightRenderPass);

				heightTex.baseLevel = i;
				heightTex.maxLevel = i;
				heightTex.updateBaseAndMaxLevel();

				this.heightDownscaleMaterial.getUniform('tMap').value = heightTex;
				this.heightDownscaleMaterial.updateUniform('tMap');

				this.manager.renderSystem.fullScreenTriangle.mesh.draw();
			}
		}

		heightTex.baseLevel = 0;
		heightTex.maxLevel = 10000;
		heightTex.updateBaseAndMaxLevel();*/

		this.renderer.useMaterial(this.normalMaterial);

		for (let layer = 0; layer < 2; layer++) {
			if (!heightLoadersUpdateFlags[layer]) {
				continue;
			}

			terrainNormalRenderPass.colorAttachments[0].slice = layer;
			this.renderer.beginRenderPass(terrainNormalRenderPass);

			this.normalMaterial.getUniform('tHeight').value = <AbstractTexture2DArray>terrainHeightRenderPass.colorAttachments[0].texture;
			this.normalMaterial.getUniform<UniformInt1>('layer', 'MainBlock').value[0] = layer;
			this.normalMaterial.getUniform<UniformFloat1>('heightMapWorldSize', 'MainBlock').value[0] = heightLoaders[layer].getSizeInMeters();
			this.normalMaterial.updateUniform('tHeight');
			this.normalMaterial.updateUniformBlock('MainBlock');

			this.quad.mesh.draw();
		}
	}

	private updateWaterTileMask(): void {
		const terrainSystem = this.manager.systemManager.getSystem(TerrainSystem);
		const tileSystem = this.manager.systemManager.getSystem(TileSystem);

		const tileMaskTexture = <AbstractTexture2D>this.getPhysicalResource('TerrainWaterTileMask').colorAttachments[0].texture;
		const buffer = new Uint8Array(tileMaskTexture.width * tileMaskTexture.height);
		const start = terrainSystem.maskOrigin;

		for (let x = 0; x < tileMaskTexture.width; x++) {
			for (let y = 0; y < tileMaskTexture.height; y++) {
				const tile = tileSystem.getTile(x + start.x, y + start.y);

				if (tile) {
					buffer[x + y * tileMaskTexture.width] = tile.projectedMesh ? 255 : 0;
				}
			}
		}

		if (tileMaskTexture.data === null || !compareTypedArrays(tileMaskTexture.data as Uint8Array, buffer)) {
			tileMaskTexture.data = buffer;
			tileMaskTexture.updateFromData();
		}
	}

	private updateWater(): void {
		const terrainWaterRenderPass = this.getPhysicalResource('TerrainWater');
		const terrainSystem = this.manager.systemManager.getSystem(TerrainSystem);

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

				if (tileState.type === TileAreaLoaderCellStateType.WithData) {
					this.waterMaterial.getUniform('fillValue', 'MainBlock').value = new Float32Array([1]);
					this.waterMaterial.updateUniformBlock('MainBlock');

					const mesh = tileState.tile.getMesh(this.renderer);

					mesh.draw();
				}
			}
		}
	}

	private renderTerrainRings(): void {
		const terrain = this.manager.sceneSystem.objects.terrain;
		const camera = this.manager.sceneSystem.objects.camera;

		const terrainRingHeightRenderPass = this.getPhysicalResource('TerrainRingHeight');
		const terrainHeightRenderPass = this.getPhysicalResource('TerrainHeight');

		this.ringHeightMaterial.getUniform('tHeight').value =
			<AbstractTexture2D>terrainHeightRenderPass.colorAttachments[0].texture;
		this.renderer.useMaterial(this.ringHeightMaterial);

		for (let i = 0; i < terrain.children.length; i++) {
			const ring = terrain.children[i];

			terrainRingHeightRenderPass.colorAttachments[0].slice = i;
			this.renderer.beginRenderPass(terrainRingHeightRenderPass);

			const config = TerrainRingHeightConfig[i];
			const transformHeight0 = config[1] === 0 ? ring.heightTextureTransform0 : ring.heightTextureTransform1;
			const transformHeight1 = config[3] === 0 ? ring.heightTextureTransform0 : ring.heightTextureTransform1;

			this.ringHeightMaterial.getUniform<UniformFloat3>('transformHeight0', 'PerMesh').value = transformHeight0;
			this.ringHeightMaterial.getUniform<UniformFloat3>('transformHeight1', 'PerMesh').value = transformHeight1;
			this.ringHeightMaterial.getUniform<UniformFloat2>('morphOffset', 'PerMesh').value = ring.morphOffset;
			this.ringHeightMaterial.getUniform<UniformFloat1>('size', 'PerMesh').value[0] = ring.size;
			this.ringHeightMaterial.getUniform<UniformFloat1>('segmentCount', 'PerMesh').value[0] = ring.segmentCount * 2;
			this.ringHeightMaterial.getUniform<UniformFloat1>('isLastRing', 'PerMesh').value[0] = +ring.isLastRing;
			this.ringHeightMaterial.getUniform('cameraPosition', 'PerMesh').value = new Float32Array([
				camera.position.x - ring.position.x, camera.position.z - ring.position.z
			]);
			this.ringHeightMaterial.getUniform<UniformInt4>('levelLayer', 'PerMesh').value = new Int32Array(config);
			this.ringHeightMaterial.updateUniformBlock('PerMesh');

			this.quad.mesh.draw();
		}
	}

	private getTileUsageTransform(): Float32Array {
		const size = Config.TerrainUsageTextureSize;
		const padding = Config.TerrainUsageTexturePadding;
		const scale = size / (size + padding * 2);

		return new Float32Array([
			padding / size,
			padding / size,
			scale
		]);
	}

	private renderTileUsage(tile: Tile): void {
		const terrainUsageRenderPass = this.getPhysicalResource('TerrainUsage');
		const terrainUsageTemp0RenderPass = this.getPhysicalResource('TerrainUsageTemp0');
		const terrainUsageTemp1RenderPass = this.getPhysicalResource('TerrainUsageTemp1');
		const terrainUsageTemp2RenderPass = this.getPhysicalResource('TerrainUsageTemp2');

		tile.terrainMaskMesh.updateMesh(this.renderer);

		const storageAttachment: BinaryTreeNodeAttachment = {
			id: tile.id.toString(),
		};
		const index = this.tileMaskStorage.addAttachment(storageAttachment);

		tile.terrainMaskSliceIndex = index;

		this.renderer.beginRenderPass(terrainUsageTemp0RenderPass);

		this.renderer.useMaterial(this.uintClearMaterial);
		this.uintClearMaterial.getUniform('value', 'MainBlock').value = new Uint32Array([0]);
		this.uintClearMaterial.updateUniformBlock('MainBlock');
		this.manager.renderSystem.fullScreenTriangle.mesh.draw();

		this.renderer.useMaterial(this.usageMaterial);
		this.usageMaterial.getUniform('transform', 'MainBlock').value = this.getTileUsageTransform();
		this.usageMaterial.updateUniformBlock('MainBlock');
		tile.terrainMaskMesh.draw();

		const sdfPassCount: number = Config.TerrainUsageSDFPasses;
		const targets: AbstractRenderPass[] = [
			terrainUsageTemp1RenderPass,
			terrainUsageTemp0RenderPass,
		];

		this.renderer.useMaterial(this.usageSDFMaterial);

		for (let i = 0; i < sdfPassCount; i++) {
			this.renderer.beginRenderPass(targets[0]);

			this.usageSDFMaterial.getUniform('step', 'MainBlock').value = new Float32Array([sdfPassCount - i - 1]);
			this.usageSDFMaterial.getUniform('tMap').value = <AbstractTexture2D>targets[1].colorAttachments[0].texture;
			this.usageSDFMaterial.updateUniformBlock('MainBlock');
			this.usageSDFMaterial.updateUniform('tMap');

			this.renderer.useMaterial(this.usageSDFMaterial);
			this.manager.renderSystem.fullScreenTriangle.mesh.draw();

			targets.reverse();
		}

		this.renderer.beginRenderPass(terrainUsageTemp2RenderPass);
		this.usageSDFDownscaleMaterial0.getUniform('tMap').value = <AbstractTexture2D>targets[1].colorAttachments[0].texture;
		this.renderer.useMaterial(this.usageSDFDownscaleMaterial0);
		this.manager.renderSystem.fullScreenTriangle.mesh.draw();

		terrainUsageRenderPass.colorAttachments[0].slice = index;
		this.renderer.beginRenderPass(terrainUsageRenderPass);
		this.usageSDFDownscaleMaterial1.getUniform('tMap').value = <AbstractTexture2D>terrainUsageTemp2RenderPass.colorAttachments[0].texture;
		this.renderer.useMaterial(this.usageSDFDownscaleMaterial1);
		this.manager.renderSystem.fullScreenTriangle.mesh.draw();

		const onDeleted = (): void => {
			this.tileMaskStorage.removeAttachment(storageAttachment);
			tile.emitter.off('delete', onDeleted);
		};

		tile.emitter.on('delete', onDeleted);
	}

	public updateTerrainMask(): void {
		const tiles = this.manager.systemManager.getSystem(TileSystem).tiles;

		for (const tile of tiles.values()) {
			if (tile.terrainMaskMesh && tile.terrainMaskSliceIndex === null) {
				this.renderTileUsage(tile);
			}
		}
	}

	private updateTerrainTileMask(): void {
		const terrainSystem = this.manager.systemManager.getSystem(TerrainSystem);
		const tileSystem = this.manager.systemManager.getSystem(TileSystem);

		const tileMaskTexture = <AbstractTexture2D>this.getPhysicalResource('TerrainUsageTileMask').colorAttachments[0].texture;
		const buffer = new Uint8Array(tileMaskTexture.width * tileMaskTexture.height);
		const start = terrainSystem.maskOrigin;

		for (let x = 0; x < tileMaskTexture.width; x++) {
			for (let y = 0; y < tileMaskTexture.height; y++) {
				const tile = tileSystem.getTile(x + start.x, y + start.y);
				const isEmpty = !tile || tile.terrainMaskSliceIndex === null;

				buffer[x + y * tileMaskTexture.width] = isEmpty ? 255 : tile.terrainMaskSliceIndex;
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