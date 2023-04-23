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
	Footway: 10,
	WoodFootway: 11,
	FootwayArea: 12,
	Cycleway: 13,
	DirtRoadway: 14,
	SandRoadway: 15,
	AsphaltRoadway: 16,
	ConcreteRoadway: 17,
	WoodRoadway: 18,
	CobblestoneRoadway: 19,
	AsphaltArea: 20,
	ConcreteArea: 21,
	CobblestoneArea: 22,
	Railway: 23,
	RailwayOverlay: 24,
	Tramway: 25,
	Runway: 26,
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