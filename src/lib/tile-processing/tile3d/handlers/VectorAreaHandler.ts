import Handler from "~/lib/tile-processing/tile3d/handlers/Handler";
import Tile3DFeature from "~/lib/tile-processing/tile3d/features/Tile3DFeature";
import VectorArea, {VectorAreaRing, VectorAreaRingType} from "~/lib/tile-processing/vector/features/VectorArea";
import OSMReference from "~/lib/tile-processing/vector/features/OSMReference";
import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/descriptors";
import Tile3DExtrudedGeometryBuilder, {
	RoofType
} from "~/lib/tile-processing/tile3d/builders/Tile3DExtrudedGeometryBuilder";
import Vec2 from "~/lib/math/Vec2";
import Tile3DExtrudedGeometry from "~/lib/tile-processing/tile3d/features/Tile3DExtrudedGeometry";
import {Tile3DRingType} from "~/lib/tile-processing/tile3d/builders/Tile3DRing";
import Tile3DProjectedGeometryBuilder from "~/lib/tile-processing/tile3d/builders/Tile3DProjectedGeometryBuilder";
import Tile3DProjectedGeometry from "~/lib/tile-processing/tile3d/features/Tile3DProjectedGeometry";

export default class VectorAreaHandler implements Handler {
	private readonly osmReference: OSMReference;
	private readonly descriptor: VectorAreaDescriptor;
	private readonly rings: VectorAreaRing[];

	public constructor(feature: VectorArea) {
		this.osmReference = feature.osmReference;
		this.descriptor = feature.descriptor;
		this.rings = feature.rings;
	}

	public getFeatures(): Tile3DFeature[] {
		if (!this.rings.some(ring => ring.type === VectorAreaRingType.Outer)) {
			return [];
		}

		switch (this.descriptor.type) {
			case 'building':
			case 'buildingPart':
				return [this.handleBuilding()];
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
			case 'roadway': {
				return [this.handleGenericSurface({
					textureId: 2,
					isOriented: false,
					zIndex: 3,
					uvScale: 0.1,
				})];
			}
			case 'footway': {
				return [this.handleGenericSurface({
					textureId: 1,
					isOriented: false,
					zIndex: 2,
					uvScale: 0.1,
				})];
			}
		}

		return [];
	}

	private handleBuilding(): Tile3DExtrudedGeometry {
		const builder = new Tile3DExtrudedGeometryBuilder(this.osmReference);

		for (const ring of this.rings) {
			const type = ring.type === VectorAreaRingType.Inner ? Tile3DRingType.Inner : Tile3DRingType.Outer;
			const nodes = ring.nodes.map(node => new Vec2(node.x, node.y));

			builder.addRing(type, nodes);
		}

		const facadeParams = this.getFacadeParams();
		const roofParams = this.getRoofParams();

		const {skirt, facadeHeightOverride} = builder.addRoof({
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
			levels: this.descriptor.buildingLevels,
			windowWidth: facadeParams.windowWidth,
			minHeight: this.descriptor.buildingMinHeight,
			height: facadeHeightOverride ?? (this.descriptor.buildingHeight - this.descriptor.buildingRoofHeight),
			skirt: skirt,
			color: facadeParams.color,
			textureIdWall: facadeParams.textureIdWall,
			textureIdWindow: facadeParams.textureIdWindow,
		});

		return builder.getGeometry();
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
		const builder = new Tile3DProjectedGeometryBuilder(this.osmReference);
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