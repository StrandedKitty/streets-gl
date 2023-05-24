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
	Pitch: 8,
	ShrubberySoil: 9,
	Railway: 10,
	RailwayOverlay: 11,
	DirtRoadway: 12,
	SandRoadway: 13,
	RoadArea: 14,
	Footway: 15,
	WoodFootway: 16,
	FootwayArea: 17,
	Cycleway: 18,
	AsphaltRoadway: 19,
	ConcreteRoadway: 20,
	WoodRoadway: 21,
	CobblestoneRoadway: 22,
	AsphaltArea: 23,
	ConcreteArea: 24,
	CobblestoneArea: 25,
	Runway: 26,
	Rail: 27,
	Helipad: 28,
} satisfies Record<string, number>;

export default interface Tile3DProjectedGeometry extends Tile3DFeature {
	type: 'projected';
	zIndex: number;
	boundingBox: AABB3D;
	positionBuffer: Float32Array;
	normalBuffer: Float32Array;
	uvBuffer: Float32Array;
	textureIdBuffer: Uint8Array;
}