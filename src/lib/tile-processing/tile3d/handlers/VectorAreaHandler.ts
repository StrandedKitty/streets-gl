import Handler, {RequestedHeightParams} from "~/lib/tile-processing/tile3d/handlers/Handler";
import Tile3DFeature from "~/lib/tile-processing/tile3d/features/Tile3DFeature";
import VectorArea, {VectorAreaRing, VectorAreaRingType} from "~/lib/tile-processing/vector/features/VectorArea";
import OSMReference from "~/lib/tile-processing/vector/features/OSMReference";
import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/descriptors";
import Tile3DExtrudedGeometryBuilder, {
	RoofType
} from "~/lib/tile-processing/tile3d/builders/Tile3DExtrudedGeometryBuilder";
import Vec2 from "~/lib/math/Vec2";
import Tile3DExtrudedGeometry from "~/lib/tile-processing/tile3d/features/Tile3DExtrudedGeometry";
import Tile3DRing, {Tile3DRingType} from "~/lib/tile-processing/tile3d/builders/Tile3DRing";
import Tile3DProjectedGeometryBuilder from "~/lib/tile-processing/tile3d/builders/Tile3DProjectedGeometryBuilder";
import Tile3DProjectedGeometry from "~/lib/tile-processing/tile3d/features/Tile3DProjectedGeometry";
import Tile3DLabel from "~/lib/tile-processing/tile3d/features/Tile3DLabel";
import Tile3DMultipolygon from "~/lib/tile-processing/tile3d/builders/Tile3DMultipolygon";

export default class VectorAreaHandler implements Handler {
	private readonly osmReference: OSMReference;
	private readonly descriptor: VectorAreaDescriptor;
	private readonly rings: VectorAreaRing[];
	private terrainHeight: number = 0;
	private multipolygon: Tile3DMultipolygon = null;

	public constructor(feature: VectorArea) {
		this.osmReference = feature.osmReference;
		this.descriptor = feature.descriptor;
		this.rings = feature.rings;
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

		return null;
	}

	public getFeatures(): Tile3DFeature[] {
		if (!this.rings.some(ring => ring.type === VectorAreaRingType.Outer)) {
			return [];
		}

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
					uvScale: 0.05,
				})];
			}
			case 'rock': {
				return [this.handleGenericSurface({
					textureId: 10,
					isOriented: false,
					zIndex: 1,
					uvScale: 0.03,
				})];
			}
			case 'sand': {
				return [this.handleGenericSurface({
					textureId: 11,
					isOriented: false,
					zIndex: 1,
					uvScale: 0.08,
				})];
			}
			case 'roadway': {
				return [this.handleRoadway()];
			}
			case 'roadwayIntersection': {
				return [this.handleRoadIntersection()];
			}
			case 'footway': {
				return [this.handleGenericSurface({
					textureId: 1,
					isOriented: false,
					zIndex: 1.5,
					uvScale: 0.1,
				})];
			}
			case 'helipad': {
				return [this.handleGenericSurface({
					textureId: 20,
					isOriented: true,
					zIndex: 10
				})];
			}
		}

		return [];
	}

	private handleRoadway(): Tile3DProjectedGeometry {
		return this.handleGenericSurface({
			textureId: 2,
			isOriented: false,
			zIndex: 3.5,
			uvScale: 0.1
		});
	}

	private handleRoadIntersection(): Tile3DProjectedGeometry {
		const textureId = this.descriptor.intersectionMaterial === 'asphalt' ? 16 : 18;

		return this.handleGenericSurface({
			textureId: textureId,
			isOriented: false,
			zIndex: 4.5,
			uvScale: 0.05
		});
	}

	private handleBuilding(): Tile3DFeature[] {
		const builder = new Tile3DExtrudedGeometryBuilder(this.osmReference, this.getMultipolygon());

		const facadeParams = this.getFacadeParams();
		const roofParams = this.getRoofParams();

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

	private static getRoofTypeFromString(str: VectorAreaDescriptor['buildingRoofType']): RoofType {
		switch (str) {
			case 'flat': return RoofType.Flat;
			case 'gabled': return RoofType.Gabled;
			case 'hipped': return RoofType.Hipped;
			case 'pyramidal': return RoofType.Pyramidal;
			case 'onion': return RoofType.Onion;
			case 'dome': return RoofType.Dome;
			case 'round': return RoofType.Round;
			case 'skillion': return RoofType.Skillion;
			case 'mansard': return RoofType.Mansard;
			case 'quadrupleSaltbox': return RoofType.QuadrupleSaltbox;
		}

		console.error(`Roof type ${str} is not supported`);

		return RoofType.Flat;
	}

	private getRoofParams(): {
		type: RoofType;
		textureId: number;
		color: number;
		scaleX: number;
		scaleY: number;
		isStretched: boolean;
	} {
		const roofType = VectorAreaHandler.getRoofTypeFromString(this.descriptor.buildingRoofType);
		const roofMaterial = this.descriptor.buildingRoofMaterial;
		const roofColor = this.descriptor.buildingRoofColor;

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

		if (roofType === RoofType.Flat && roofMaterial === 'default' && roofColor === 0xffffff) {
			return {
				type: roofType,
				textureId: (this.osmReference.id || 0) % 4 + 1,
				color: roofColor,
				scaleX: 1,
				scaleY: 1,
				isStretched: true
			};
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
		const color = this.descriptor.buildingFacadeColor;
		const hasWindows = this.descriptor.buildingWindows;

		const materialToTextureId: Record<VectorAreaDescriptor['buildingFacadeMaterial'], number> = {
			plaster: 13,
			brick: 14,
			wood: 15,
			glass: 16,
			mirror: 17,
			cementBlock: 18
		};

		return {
			windowWidth: 4,
			color,
			textureIdWall: 13,
			textureIdWindow: 13
		};
	}
}