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
	Footway: 12,
	WoodFootway: 13,
	FootwayArea: 14,
	Cycleway: 15,
	DirtRoadway: 16,
	SandRoadway: 17,
	AsphaltRoadway: 18,
	ConcreteRoadway: 19,
	WoodRoadway: 20,
	CobblestoneRoadway: 21,
	AsphaltArea: 22,
	ConcreteArea: 23,
	CobblestoneArea: 24,
	Runway: 25,
	Rail: 26,
	Helipad: 27,
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