import Tile3DFeature from "~/lib/tile-processing/tile3d/features/Tile3DFeature";
import AABB3D from "~/lib/math/AABB3D";

export const ZIndexMap = {
	Water: 0,
	Grass: 1,
	Sand: 2,
	Rock: 3,
	ManicuredGrass: 4,
	Garden: 5,
	Construction: 6,
	Farmland: 7,
	Waterway: 8,
	Pitch: 9,
	ShrubberySoil: 10,
	Railway: 11,
	RailwayOverlay: 12,
	DirtRoadway: 13,
	SandRoadway: 14,
	RoadwayArea: 15,
	Footway: 16,
	WoodFootway: 17,
	AsphaltFootway: 17,
	FootwayArea: 18,
	Cycleway: 19,
	AsphaltRoadway: 20,
	ConcreteRoadway: 21,
	WoodRoadway: 22,
	CobblestoneRoadway: 23,
	AsphaltArea: 24,
	ConcreteArea: 25,
	CobblestoneArea: 26,
	Runway: 27,
	Rail: 28,
	Helipad: 29,
} as const satisfies Record<string, number>;

export default interface Tile3DProjectedGeometry extends Tile3DFeature {
	type: 'projected';
	zIndex: number;
	boundingBox: AABB3D;
	positionBuffer: Float32Array;
	normalBuffer: Float32Array;
	uvBuffer: Float32Array;
	textureIdBuffer: Uint8Array;
}