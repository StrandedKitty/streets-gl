import Handler, {RequestedHeightParams} from "~/lib/tile-processing/tile3d/handlers/Handler";
import Tile3DFeature from "~/lib/tile-processing/tile3d/features/Tile3DFeature";
import VectorArea, {VectorAreaRing, VectorAreaRingType} from "~/lib/tile-processing/vector/features/VectorArea";
import OSMReference from "~/lib/tile-processing/vector/features/OSMReference";
import Tile3DExtrudedGeometryBuilder, {
	RoofType
} from "~/lib/tile-processing/tile3d/builders/Tile3DExtrudedGeometryBuilder";
import Vec2 from "~/lib/math/Vec2";
import Tile3DRing, {Tile3DRingType} from "~/lib/tile-processing/tile3d/builders/Tile3DRing";
import Tile3DProjectedGeometryBuilder from "~/lib/tile-processing/tile3d/builders/Tile3DProjectedGeometryBuilder";
import Tile3DProjectedGeometry, {ZIndexMap} from "~/lib/tile-processing/tile3d/features/Tile3DProjectedGeometry";
import Tile3DLabel from "~/lib/tile-processing/tile3d/features/Tile3DLabel";
import Tile3DMultipolygon from "~/lib/tile-processing/tile3d/builders/Tile3DMultipolygon";
import Config from "~/app/Config";
import Tile3DInstance, {Tile3DInstanceType} from "~/lib/tile-processing/tile3d/features/Tile3DInstance";
import Vec3 from "~/lib/math/Vec3";
import SeededRandom from "~/lib/math/SeededRandom";
import RoadGraph from "~/lib/road-graph/RoadGraph";
import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {
	getTreeHeightRangeFromTextureId,
	getTreeTextureIdFromType,
	getTreeTextureScaling
} from "~/lib/tile-processing/tile3d/utils";
import {ExtrudedTextures, ProjectedTextures} from "~/lib/tile-processing/tile3d/textures";
import VectorNode from "~/lib/tile-processing/vector/features/VectorNode";
import * as Simplify from "simplify-js";

const TileSize = 611.4962158203125;

export default class VectorAreaHandler implements Handler {
	private readonly osmReference: OSMReference;
	private readonly descriptor: VectorAreaDescriptor;
	private readonly rings: VectorAreaRing[];
	private mercatorScale: number = 1;
	private terrainMinHeight: number = 0;
	private terrainMaxHeight: number = 0;
	private multipolygon: Tile3DMultipolygon = null;
	private instances: Tile3DInstance[] = [];

	public constructor(feature: VectorArea) {
		this.osmReference = feature.osmReference;
		this.descriptor = feature.descriptor;
		this.rings = feature.rings;

		this.simplify();
	}

	private simplify(): void {
		if (this.descriptor.type === 'roadwayIntersection') {
			return;
		}

		const multipolygon = this.getMultipolygon();
		const initialArea = multipolygon.getArea();

		if (initialArea < 5) {
			return;
		}

		for (const ring of this.rings) {
			ring.nodes = VectorAreaHandler.simplifyNodes(ring.nodes);
		}

		this.multipolygon = null;
	}

	public setRoadGraph(graph: RoadGraph): void {

	}

	public setMercatorScale(scale: number): void {
		this.mercatorScale = scale;
	}

	private getMultipolygon(): Tile3DMultipolygon {
		if (this.multipolygon === null) {
			this.multipolygon = new Tile3DMultipolygon();

			for (const ring of this.rings) {
				const type = ring.type === VectorAreaRingType.Inner ? Tile3DRingType.Inner : Tile3DRingType.Outer;
				const nodes = ring.nodes.map(node => new Vec2(node.x, node.y));

				this.multipolygon.addRing(new Tile3DRing(type, nodes));
			}
		}

		return this.multipolygon;
	}

	public getRequestedHeightPositions(): RequestedHeightParams {
		if (this.descriptor.type === 'building' || this.descriptor.type === 'buildingPart') {
			const positions: number[] = [];

			for (const ring of this.rings) {
				for (const vertex of ring.nodes) {
					positions.push(vertex.x, vertex.y);
				}
			}

			return {
				positions: new Float64Array(positions),
				callback: (heights: Float64Array): void => {
					let minHeight = Infinity;
					let maxHeight = -Infinity;

					for (let i = 0; i < heights.length; i++) {
						minHeight = Math.min(minHeight, heights[i]);
						maxHeight = Math.max(maxHeight, heights[i]);
					}

					this.terrainMinHeight = minHeight;
					this.terrainMaxHeight = maxHeight;
				}
			};
		}

		if (this.descriptor.type === 'forest') {
			const points2D = this.getMultipolygon().populateWithPoints(
				Math.floor(40 / this.mercatorScale),
				Config.TileSize
			);
			const points3D: Vec3[] = [];
			const positions: number[] = [];

			for (const point of points2D) {
				if (point.x < 0 || point.y < 0 || point.x > TileSize || point.y > TileSize) {
					continue;
				}

				positions.push(point.x, point.y);
				points3D.push(new Vec3(point.x, 0, point.y));
			}

			return {
				positions: new Float64Array(positions),
				callback: (heights: Float64Array): void => {
					for (let i = 0; i < points3D.length; i++) {
						const x = points3D[i].x;
						const y = heights[i];
						const z = points3D[i].z;

						this.instances.push(this.createTree(x, y, z));
					}
				}
			};
		}

		if (this.descriptor.type === 'shrubbery') {
			const points2D = this.getMultipolygon().populateWithPoints(
				Math.floor(80 / this.mercatorScale),
				Config.TileSize
			);
			const points3D: Vec3[] = [];
			const positions: number[] = [];

			for (const point of points2D) {
				if (point.x < 0 || point.y < 0 || point.x > TileSize || point.y > TileSize) {
					continue;
				}

				positions.push(point.x, point.y);
				points3D.push(new Vec3(point.x, 0, point.y));
			}

			return {
				positions: new Float64Array(positions),
				callback: (heights: Float64Array): void => {
					for (let i = 0; i < points3D.length; i++) {
						const x = points3D[i].x;
						const y = heights[i];
						const z = points3D[i].z;

						this.instances.push(this.createShrub(x, y, z));
					}
				}
			};
		}

		if (this.descriptor.type === 'construction') {
			const center = this.getMultipolygon().getPoleOfInaccessibility();

			if (center.x < 0 || center.y < 0 || center.x > TileSize || center.y > TileSize) {
				return null;
			}

			let instanceType: Tile3DInstanceType = null;

			if (center.z > 12 * this.mercatorScale) {
				instanceType = 'trackedCrane';
			}

			if (center.z > 32 * this.mercatorScale) {
				instanceType = 'towerCrane';
			}

			if (instanceType) {
				return {
					positions: new Float64Array([center.x, center.y]),
					callback: (heights: Float64Array): void => {
						const instance = this.createGenericInstance(center.x, heights[0], center.y, instanceType);
						this.instances.push(instance);
					}
				};
			}
		}

		return null;
	}

	public getFeatures(): Tile3DFeature[] {
		switch (this.descriptor.type) {
			case 'building':
			case 'buildingPart':
				return this.handleBuilding();
			case 'water': {
				return this.handleGenericSurface({
					textureId: ProjectedTextures.Water,
					isOriented: false,
					zIndex: ZIndexMap.Water
				});
			}
			case 'pitch': {
				const textureIdMap = {
					football: ProjectedTextures.FootballPitch,
					basketball: ProjectedTextures.BasketballPitch,
					tennis: ProjectedTextures.TennisCourt,
					generic: ProjectedTextures.GenericPitch
				};
				const textureId = textureIdMap[this.descriptor.pitchType];

				if (textureId === ProjectedTextures.GenericPitch) {
					return this.handleGenericSurface({
						textureId,
						isOriented: false,
						uvScale: 20,
						zIndex: ZIndexMap.Pitch
					});
				}

				return this.handleGenericSurface({
					textureId,
					isOriented: true,
					zIndex: ZIndexMap.Pitch
				});
			}
			case 'manicuredGrass': {
				return this.handleGenericSurface({
					textureId: ProjectedTextures.ManicuredGrass,
					isOriented: false,
					zIndex: ZIndexMap.ManicuredGrass,
					uvScale: 20,
				});
			}
			case 'garden': {
				return this.handleGenericSurface({
					textureId: ProjectedTextures.Garden,
					isOriented: false,
					zIndex: ZIndexMap.Garden,
					uvScale: 16,
				});
			}
			case 'construction': {
				const features: Tile3DFeature[] = this.handleGenericSurface({
					textureId: ProjectedTextures.Soil,
					isOriented: false,
					zIndex: ZIndexMap.Construction,
					uvScale: 25,
				});

				features.push(...this.instances);

				return features;
			}
			case 'buildingConstruction': {
				return this.handleGenericSurface({
					textureId: ProjectedTextures.Soil,
					isOriented: false,
					zIndex: ZIndexMap.Construction,
					uvScale: 25,
				});
			}
			case 'grass': {
				return this.handleGenericSurface({
					textureId: ProjectedTextures.Grass,
					isOriented: false,
					zIndex: ZIndexMap.Grass,
					uvScale: 25,
				});
			}
			case 'rock': {
				return this.handleGenericSurface({
					textureId: ProjectedTextures.Rock,
					isOriented: false,
					zIndex: ZIndexMap.Rock,
					uvScale: 32,
				});
			}
			case 'sand': {
				return this.handleGenericSurface({
					textureId: ProjectedTextures.Sand,
					isOriented: false,
					zIndex: ZIndexMap.Sand,
					uvScale: 12,
				});
			}
			case 'farmland': {
				return this.handleGenericSurface({
					textureId: ProjectedTextures.Farmland,
					isOriented: false,
					zIndex: ZIndexMap.Farmland,
					uvScale: 60,
				});
			}
			case 'asphalt': {
				return this.handleGenericSurface({
					textureId: ProjectedTextures.Asphalt,
					isOriented: false,
					zIndex: ZIndexMap.AsphaltArea,
					uvScale: 20,
					addUsageMask: true,
				});
			}
			case 'roadwayArea': {
				return this.handleGenericSurface({
					textureId: ProjectedTextures.Asphalt,
					isOriented: false,
					zIndex: ZIndexMap.RoadwayArea,
					uvScale: 20,
					addUsageMask: true,
				});
			}
			case 'roadwayIntersection': {
				return this.handleRoadIntersection();
			}
			case 'pavement': {
				return this.handleGenericSurface({
					textureId: ProjectedTextures.Pavement,
					isOriented: false,
					zIndex: ZIndexMap.FootwayArea,
					uvScale: 10,
				});
			}
			case 'helipad': {
				return [
					...this.handleGenericSurface({
						textureId: ProjectedTextures.Helipad,
						isOriented: true,
						zIndex: ZIndexMap.Helipad
					}),
					...this.handleGenericSurface({
						textureId: ProjectedTextures.Pavement,
						isOriented: false,
						zIndex: ZIndexMap.FootwayArea,
						uvScale: 10,
					})
				];
			}
			case 'forest': {
				return this.instances;
			}
			case 'shrubbery': {
				return [
					...this.instances,
					...this.handleGenericSurface({
						textureId: ProjectedTextures.ForestFloor,
						isOriented: false,
						zIndex: ZIndexMap.ShrubberySoil,
						uvScale: 15,
					})
				];
			}
		}

		return [];
	}

	private handleRoadIntersection(): Tile3DFeature[] {
		const params: Record<
			VectorAreaDescriptor['intersectionMaterial'],
			{textureId: number; scale: number}
		> = {
			asphalt: {textureId: ProjectedTextures.Asphalt, scale: 20},
			concrete: {textureId: ProjectedTextures.ConcreteIntersection, scale: 20},
			cobblestone: {textureId: ProjectedTextures.Cobblestone, scale: 6},
		};

		const {textureId, scale} = params[this.descriptor.intersectionMaterial] ?? params.asphalt;

		return this.handleGenericSurface({
			textureId: textureId,
			isOriented: false,
			zIndex: ZIndexMap.AsphaltArea,
			uvScale: scale,
			addUsageMask: true
		});
	}

	private handleBuilding(): Tile3DFeature[] {
		const multipolygon = this.getMultipolygon();
		const builder = new Tile3DExtrudedGeometryBuilder(this.osmReference, multipolygon);

		const noDefaultRoof = builder.getAreaToOMBBRatio() < 0.75 || multipolygon.getArea() < 10;
		const roofParams = this.getRoofParams(noDefaultRoof);

		const facadeMinHeight = this.descriptor.buildingFoundation ? this.terrainMaxHeight : this.terrainMinHeight;
		const foundationHeight = this.terrainMaxHeight - this.terrainMinHeight;

		const {skirt, facadeHeightOverride} = builder.addRoof({
			terrainHeight: facadeMinHeight,
			type: roofParams.type,
			buildingHeight: this.descriptor.buildingHeight,
			minHeight: this.descriptor.buildingHeight - this.descriptor.buildingRoofHeight,
			height: this.descriptor.buildingRoofHeight,
			direction: this.descriptor.buildingRoofDirection,
			orientation: this.descriptor.buildingRoofOrientation,
			angle: this.descriptor.buildingRoofAngle,
			textureId: roofParams.textureId,
			color: roofParams.color,
			scaleX: roofParams.scaleX,
			scaleY: roofParams.scaleY,
			isStretched: roofParams.isStretched,
			flip: false
		});

		const facadeParams = this.getFacadeParams();

		builder.addWalls({
			terrainHeight: facadeMinHeight,
			levels: this.descriptor.buildingLevels,
			windowWidth: facadeParams.windowWidth,
			minHeight: this.descriptor.buildingMinHeight,
			height: facadeHeightOverride ?? (this.descriptor.buildingHeight - this.descriptor.buildingRoofHeight),
			skirt: skirt,
			color: facadeParams.color,
			textureIdWall: facadeParams.textureIdWall,
			textureIdWindow: facadeParams.textureIdWindow,
			windowSeed: this.osmReference.id
		});

		if (this.descriptor.buildingFoundation && foundationHeight > 0.5) {
			builder.addWalls({
				terrainHeight: this.terrainMinHeight,
				levels: foundationHeight / 4,
				windowWidth: facadeParams.windowWidth,
				minHeight: 0,
				height: this.terrainMaxHeight - this.terrainMinHeight,
				skirt: null,
				color: facadeParams.color,
				textureIdWall: facadeParams.textureIdWall,
				textureIdWindow: facadeParams.textureIdWall,
				windowSeed: this.osmReference.id
			});
		}

		const features: Tile3DFeature[] = [
			builder.getGeometry(),
			builder.getTerrainMaskGeometry()
		];

		if (this.descriptor.label) {
			const pole = this.getMultipolygon().getPoleOfInaccessibility();
			const height = facadeMinHeight + this.descriptor.buildingHeight + 5;
			const labelFeature: Tile3DLabel = {
				type: 'label',
				position: [pole.x, height, pole.y],
				priority: pole.z,
				text: this.descriptor.label
			};

			features.push(labelFeature);
		}

		return features;
	}

	private handleGenericSurface(
		{
			textureId,
			isOriented,
			uvScale = 1,
			zIndex,
			addUsageMask = false
		}: {
			textureId: number;
			isOriented: boolean;
			uvScale?: number;
			zIndex: number;
			addUsageMask?: boolean;
		}
	): Tile3DFeature[] {
		const builder = new Tile3DProjectedGeometryBuilder();
		builder.setZIndex(zIndex);

		for (const ring of this.rings) {
			const type = ring.type === VectorAreaRingType.Inner ? Tile3DRingType.Inner : Tile3DRingType.Outer;
			const nodes = ring.nodes.map(node => new Vec2(node.x, node.y));

			builder.addRing(type, nodes);
		}

		builder.addPolygon({
			height: 0,
			textureId: textureId,
			isOriented: isOriented,
			uvScale: uvScale,
			addUsageMask: addUsageMask
		});

		const features: Tile3DFeature[] = [builder.getGeometry()];

		if (addUsageMask) {
			features.push(builder.getTerrainMaskGeometry());
		}

		return features;
	}

	private createTree(x: number, y: number, z: number): Tile3DInstance {
		const seed = Math.floor(x) + Math.floor(z);
		const rnd = new SeededRandom(seed);

		const rotation = rnd.generate() * Math.PI * 2;

		const textureIdList = getTreeTextureIdFromType('genericBroadleaved');
		const textureId = textureIdList[Math.floor(rnd.generate() * textureIdList.length)];
		const textureScale = getTreeTextureScaling(textureId);

		const heightRange = getTreeHeightRangeFromTextureId(textureId);
		const height = heightRange[0] + rnd.generate() * (heightRange[1] - heightRange[0]);

		return {
			type: 'instance',
			instanceType: 'tree',
			x: x,
			y: y * this.mercatorScale,
			z: z,
			scale: height * textureScale * this.mercatorScale,
			rotation: rotation,
			seed: rnd.generate(),
			textureId: textureId
		};
	}


	private createShrub(x: number, y: number, z: number): Tile3DInstance {
		const seed = Math.floor(x) + Math.floor(z);
		const rnd = new SeededRandom(seed);

		const height = 0.9 + rnd.generate() * 0.25;
		const rotation = rnd.generate() * Math.PI * 2;

		return {
			type: 'instance',
			instanceType: 'shrubbery',
			x: x,
			y: y * this.mercatorScale,
			z: z,
			scale: height * this.mercatorScale,
			rotation: rotation
		};
	}

	private createGenericInstance(x: number, y: number, z: number, type: Tile3DInstanceType): Tile3DInstance {
		const seed = Math.floor(x) + Math.floor(z);
		const rnd = new SeededRandom(seed);

		const rotation = rnd.generate() * Math.PI * 2;

		return {
			type: 'instance',
			instanceType: type,
			x: x,
			y: y * this.mercatorScale,
			z: z,
			scale: this.mercatorScale,
			rotation: rotation
		};
	}

	private static getRoofTypeFromString(str: VectorAreaDescriptor['buildingRoofType']): RoofType {
		switch (str) {
			case 'flat':
				return RoofType.Flat;
			case 'gabled':
				return RoofType.Gabled;
			case 'gambrel':
				return RoofType.Gambrel;
			case 'hipped':
				return RoofType.Hipped;
			case 'pyramidal':
				return RoofType.Pyramidal;
			case 'onion':
				return RoofType.Onion;
			case 'dome':
				return RoofType.Dome;
			case 'round':
				return RoofType.Round;
			case 'skillion':
				return RoofType.Skillion;
			case 'mansard':
				return RoofType.Mansard;
			case 'quadrupleSaltbox':
				return RoofType.QuadrupleSaltbox;
			case 'saltbox':
				return RoofType.Saltbox;
		}

		console.error(`Roof type ${str} is not supported`);

		return RoofType.Flat;
	}

	private getRoofParams(noDefaultRoof: boolean): {
		type: RoofType;
		textureId: number;
		color: number;
		scaleX: number;
		scaleY: number;
		isStretched: boolean;
	} {
		const roofType = VectorAreaHandler.getRoofTypeFromString(this.descriptor.buildingRoofType);
		const roofMaterial = this.descriptor.buildingRoofMaterial;
		let roofColor = this.descriptor.buildingRoofColor;

		const materialToTextureId: Record<VectorAreaDescriptor['buildingRoofMaterial'], number> = {
			default: ExtrudedTextures.RoofConcrete,
			tiles: ExtrudedTextures.RoofTiles,
			metal: ExtrudedTextures.RoofMetal,
			concrete: ExtrudedTextures.RoofConcrete,
			thatch: ExtrudedTextures.RoofThatch,
			eternit: ExtrudedTextures.RoofEternit,
			grass: ExtrudedTextures.RoofGrass,
			glass: ExtrudedTextures.RoofGlass,
			tar: ExtrudedTextures.RoofTar
		};
		const textureIdToScale: Record<number, Vec2> = {
			[ExtrudedTextures.RoofTiles]: new Vec2(3, 3),
			[ExtrudedTextures.RoofMetal]: new Vec2(4, 4),
			[ExtrudedTextures.RoofConcrete]: new Vec2(10, 10),
			[ExtrudedTextures.RoofThatch]: new Vec2(8, 8),
			[ExtrudedTextures.RoofEternit]: new Vec2(5, 5),
			[ExtrudedTextures.RoofGrass]: new Vec2(12, 12),
			[ExtrudedTextures.RoofGlass]: new Vec2(4, 4),
			[ExtrudedTextures.RoofTar]: new Vec2(4, 4),
		};

		if (roofType === RoofType.Flat && roofMaterial === 'default' && !noDefaultRoof) {
			const defaultTextures = [
				ExtrudedTextures.RoofGeneric1,
				ExtrudedTextures.RoofGeneric2,
				ExtrudedTextures.RoofGeneric3,
				ExtrudedTextures.RoofGeneric4
			];

			return {
				type: roofType,
				textureId: defaultTextures[(this.osmReference.id || 0) % defaultTextures.length],
				color: roofColor,
				scaleX: 1,
				scaleY: 1,
				isStretched: true
			};
		}

		if (noDefaultRoof && roofMaterial === 'default') {
			roofColor = 0xBBBBBB;
		}

		const id = materialToTextureId[roofMaterial];
		const scale = textureIdToScale[id] ?? new Vec2(1, 1);

		return {
			type: roofType,
			textureId: id,
			color: roofColor,
			scaleX: scale.x,
			scaleY: scale.y,
			isStretched: false
		};
	}

	private getFacadeParams(): {
		windowWidth: number;
		color: number;
		textureIdWindow: number;
		textureIdWall: number;
	} {
		const material = this.descriptor.buildingFacadeMaterial;
		let color = this.descriptor.buildingFacadeColor;
		const hasWindows = this.descriptor.buildingWindows;

		const materialToTextureId: Record<VectorAreaDescriptor['buildingFacadeMaterial'], {
			wall: number;
			window: number;
			width: number;
		}> = {
			plaster: {
				wall: ExtrudedTextures.FacadePlasterWall,
				window: ExtrudedTextures.FacadePlasterWindow,
				width: 4
			},
			glass: {
				wall: ExtrudedTextures.FacadeGlass,
				window: ExtrudedTextures.FacadeGlass,
				width: 4
			},
			brick: {
				wall: ExtrudedTextures.FacadeBrickWall,
				window: ExtrudedTextures.FacadeBrickWindow,
				width: 4
			},
			wood: {
				wall: ExtrudedTextures.FacadeWoodWall,
				window: ExtrudedTextures.FacadeWoodWindow,
				width: 4
			},
			cementBlock: {
				wall: ExtrudedTextures.FacadeBlockWall,
				window: ExtrudedTextures.FacadeBlockWindow,
				width: 4
			}
		};

		const params = materialToTextureId[material] ?? materialToTextureId.plaster;

		return {
			windowWidth: params.width * this.mercatorScale,
			color,
			textureIdWall: params.wall,
			textureIdWindow: hasWindows ? params.window : params.wall
		};
	}

	private static simplifyNodes(nodes: VectorNode[]): VectorNode[] {
		return <VectorNode[]>Simplify(nodes, 0.5, false);
	}
}