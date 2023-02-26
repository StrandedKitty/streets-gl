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
		if (!this.rings.find(r => r.type === VectorAreaRingType.Outer)) {
			return [];
		}

		if (this.descriptor.type === 'building' || this.descriptor.type === 'buildingPart') {
			return [this.handleBuilding()];
		} else if (this.descriptor.type === 'water') {
			//return [this.handleWater()];
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

		const {skirt, facadeHeightOverride} = builder.addRoof({
			type: this.getRingTypeFromString(this.descriptor.buildingRoofType),
			buildingHeight: this.descriptor.buildingHeight,
			minHeight: this.descriptor.buildingHeight - this.descriptor.buildingRoofHeight,
			height: this.descriptor.buildingRoofHeight,
			direction: this.descriptor.buildingRoofDirection,
			orientation: this.descriptor.buildingRoofOrientation,
			angle: this.descriptor.buildingRoofAngle,
			textureId: 0,
			color: this.descriptor.buildingRoofColor
		});
		builder.addWalls({
			levels: this.descriptor.buildingLevels,
			windowWidth: 5,
			minHeight: this.descriptor.buildingMinHeight,
			height: facadeHeightOverride ?? (this.descriptor.buildingHeight - this.descriptor.buildingRoofHeight),
			skirt: skirt,
			color: this.descriptor.buildingFacadeColor,
			textureId: 0
		});

		return builder.getGeometry();
	}

	private handleWater(): Tile3DExtrudedGeometry {
		return null;
	}

	private getRingTypeFromString(str: VectorAreaDescriptor['buildingRoofType']): RoofType {
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
}