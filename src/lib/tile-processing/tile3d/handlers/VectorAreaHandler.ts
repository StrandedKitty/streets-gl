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
import Tile3DProjectedGeometry from "~/lib/tile-processing/tile3d/features/Tile3DProjectedGeometry";
import Tile3DLabel from "~/lib/tile-processing/tile3d/features/Tile3DLabel";
import Tile3DMultipolygon from "~/lib/tile-processing/tile3d/builders/Tile3DMultipolygon";
import Config from "~/app/Config";
import Tile3DInstance, {
	InstanceStructureSchemas,
	Tile3DInstanceType
} from "~/lib/tile-processing/tile3d/features/Tile3DInstance";
import Vec3 from "~/lib/math/Vec3";
import SeededRandom from "~/lib/math/SeededRandom";
import RoadGraph from "~/lib/road-graph/RoadGraph";
import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {
	getTreeHeightRangeFromTextureId,
	getTreeTextureIdFromType,
	getTreeTextureScaling
} from "~/lib/tile-processing/tile3d/utils";

const TileSize = 611.4962158203125;

export default class VectorAreaHandler implements Handler {
	private readonly osmReference: OSMReference;
	private readonly descriptor: VectorAreaDescriptor;
	private readonly rings: VectorAreaRing[];
	private mercatorScale: number = 1;
	private terrainHeight: number = 0;
	private multipolygon: Tile3DMultipolygon = null;
	private instances: Tile3DInstance[] = [];

	public constructor(feature: VectorArea) {
		this.osmReference = feature.osmReference;
		this.descriptor = feature.descriptor;
		this.rings = feature.rings;
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
					this.terrainHeight = Math.min.apply(null, Array.from(heights));
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
				return [this.handleGenericSurface({
					textureId: 0,
					isOriented: false,
					zIndex: 0
				})];
			}
			case 'pitch': {
				const textureIdMap = {
					football: 4,
					basketball: 5,
					tennis: 6
				};
				const textureId = textureIdMap[this.descriptor.pitchType] ?? textureIdMap.football;

				return [this.handleGenericSurface({
					textureId,
					isOriented: true,
					zIndex: 4
				})];
			}
			case 'manicuredGrass': {
				return [this.handleGenericSurface({
					textureId: 7,
					isOriented: false,
					zIndex: 1,
					uvScale: 20,
				})];
			}
			case 'garden': {
				return [this.handleGenericSurface({
					textureId: 21,
					isOriented: false,
					zIndex: 1,
					uvScale: 16,
				})];
			}
			case 'construction': {
				const features: Tile3DFeature[] = [this.handleGenericSurface({
					textureId: 22,
					isOriented: false,
					zIndex: 1,
					uvScale: 25,
				})];

				features.push(...this.instances);

				return features;
			}
			case 'buildingConstruction': {
				return [this.handleGenericSurface({
					textureId: 22,
					isOriented: false,
					zIndex: 1,
					uvScale: 25,
				})];
			}
			case 'grass': {
				return [this.handleGenericSurface({
					textureId: 23,
					isOriented: false,
					zIndex: 1,
					uvScale: 25,
				})];
			}
			case 'rock': {
				return [this.handleGenericSurface({
					textureId: 10,
					isOriented: false,
					zIndex: 1,
					uvScale: 32,
				})];
			}
			case 'sand': {
				return [this.handleGenericSurface({
					textureId: 11,
					isOriented: false,
					zIndex: 1,
					uvScale: 12,
				})];
			}
			case 'asphalt': {
				return [this.handleGenericSurface({
					textureId: 2,
					isOriented: false,
					zIndex: 4.5,
					uvScale: 20
				})];
			}
			case 'roadwayIntersection': {
				return [this.handleRoadIntersection()];
			}
			case 'pavement': {
				return [this.handleGenericSurface({
					textureId: 1,
					isOriented: false,
					zIndex: 1.5,
					uvScale: 10,
				})];
			}
			case 'helipad': {
				return [
					this.handleGenericSurface({
						textureId: 20,
						isOriented: true,
						zIndex: 10
					}),
					this.handleGenericSurface({
						textureId: 1,
						isOriented: false,
						zIndex: 5,
						uvScale: 10,
					})
				];
			}
			case 'farmland': {
				return [this.handleGenericSurface({
					textureId: 29,
					isOriented: false,
					zIndex: 1.5,
					uvScale: 60,
				})];
			}
			case 'forest': {
				return this.instances;
			}
			case 'shrubbery': {
				return [
					...this.instances,
					this.handleGenericSurface({
						textureId: 24,
						isOriented: false,
						zIndex: 1,
						uvScale: 15,
					})
				];
			}
		}

		return [];
	}

	private handleRoadIntersection(): Tile3DProjectedGeometry {
		const params: Record<
			VectorAreaDescriptor['intersectionMaterial'],
			{textureId: number; scale: number}
		> = {
			asphalt: {textureId: 16, scale: 20},
			concrete: {textureId: 18, scale: 20},
			cobblestone: {textureId: 3, scale: 6},
		};

		const {textureId, scale} = params[this.descriptor.intersectionMaterial] ?? params.asphalt;

		return this.handleGenericSurface({
			textureId: textureId,
			isOriented: false,
			zIndex: 4.5,
			uvScale: scale
		});
	}

	private handleBuilding(): Tile3DFeature[] {
		const builder = new Tile3DExtrudedGeometryBuilder(this.osmReference, this.getMultipolygon());

		const noDefaultRoof = builder.getAreaToOMBBRatio() < 0.75;
		const roofParams = this.getRoofParams(noDefaultRoof);

		const {skirt, facadeHeightOverride} = builder.addRoof({
			terrainHeight: this.terrainHeight,
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
			terrainHeight: this.terrainHeight,
			levels: this.descriptor.buildingLevels,
			windowWidth: facadeParams.windowWidth,
			minHeight: this.descriptor.buildingMinHeight,
			height: facadeHeightOverride ?? (this.descriptor.buildingHeight - this.descriptor.buildingRoofHeight),
			skirt: skirt,
			color: facadeParams.color,
			textureIdWall: facadeParams.textureIdWall,
			textureIdWindow: facadeParams.textureIdWindow,
		});

		const features: Tile3DFeature[] = [builder.getGeometry()];

		if (this.descriptor.label) {
			const pole = this.getMultipolygon().getPoleOfInaccessibility();
			const height = this.terrainHeight + this.descriptor.buildingHeight + 5;
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
			zIndex
		}: {
			textureId: number;
			isOriented: boolean;
			uvScale?: number;
			zIndex: number;
		}
	): Tile3DProjectedGeometry {
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
			uvScale: uvScale
		});

		return builder.getGeometry();
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
			default: 7,
			tiles: 5,
			metal: 6,
			concrete: 7,
			thatch: 8,
			eternit: 9,
			grass: 10,
			glass: 11,
			tar: 12
		};
		const textureIdToScale: Record<number, Vec2> = {
			5: new Vec2(3, 3),
			6: new Vec2(4, 4),
			7: new Vec2(10, 10),
			8: new Vec2(8, 8),
			9: new Vec2(5, 5),
			10: new Vec2(12, 12),
			11: new Vec2(4, 4),
			12: new Vec2(4, 4),
		};

		if (roofType === RoofType.Flat && roofMaterial === 'default' && !noDefaultRoof) {
			return {
				type: roofType,
				textureId: (this.osmReference.id || 0) % 4 + 1,
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
				wall: 16,
				window: 17,
				width: 4
			},
			glass: {
				wall: 13,
				window: 13,
				width: 4
			},
			brick: {
				wall: 14,
				window: 15,
				width: 4
			},
			wood: {
				wall: 18,
				window: 19,
				width: 4
			},
			cementBlock: {
				wall: 20,
				window: 21,
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
}