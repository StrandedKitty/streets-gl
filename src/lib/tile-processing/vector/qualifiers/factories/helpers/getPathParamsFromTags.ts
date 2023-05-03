import {VectorPolylineDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";

const materialTable: Record<string, VectorPolylineDescriptor['pathMaterial']> = {
	asphalt: 'asphalt',
	unpaved: 'dirt',
	paved: 'asphalt',
	ground: 'dirt',
	concrete: 'concrete',
	paving_stones: 'cobblestone',
	gravel: 'dirt',
	dirt: 'dirt',
	grass: 'dirt',
	compacted: 'dirt',
	sand: 'sand',
	sett: 'cobblestone',
	fine_gravel: 'dirt',
	wood: 'wood',
	cobblestone: 'cobblestone',
	earth: 'dirt',
	pebblestone: 'cobblestone'
};

const highwayTable: Record<string, {
	type: VectorPolylineDescriptor['pathType'];
	defaultMaterial: VectorPolylineDescriptor['pathMaterial'];
	defaultLanes: number;
	defaultWidth?: number;
}> = {
	residential: {type: 'roadway', defaultMaterial: 'asphalt', defaultLanes: 2},
	service: {type: 'roadway', defaultMaterial: 'asphalt', defaultLanes: 2},
	track: {type: 'roadway', defaultMaterial: 'dirt', defaultLanes: 1},
	unclassified: {type: 'roadway', defaultMaterial: 'asphalt', defaultLanes: 2},
	tertiary: {type: 'roadway', defaultMaterial: 'asphalt', defaultLanes: 2},
	secondary: {type: 'roadway', defaultMaterial: 'asphalt', defaultLanes: 2},
	primary: {type: 'roadway', defaultMaterial: 'asphalt', defaultLanes: 2},
	living_street: {type: 'roadway', defaultMaterial: 'asphalt', defaultLanes: 2},
	trunk: {type: 'roadway', defaultMaterial: 'asphalt', defaultLanes: 2},
	motorway: {type: 'roadway', defaultMaterial: 'asphalt', defaultLanes: 2},
	motorway_link: {type: 'roadway', defaultMaterial: 'asphalt', defaultLanes: 1},
	trunk_link: {type: 'roadway', defaultMaterial: 'asphalt', defaultLanes: 1},
	primary_link: {type: 'roadway', defaultMaterial: 'asphalt', defaultLanes: 1},
	secondary_link: {type: 'roadway', defaultMaterial: 'asphalt', defaultLanes: 1},
	tertiary_link: {type: 'roadway', defaultMaterial: 'asphalt', defaultLanes: 1},
	busway: {type: 'roadway', defaultMaterial: 'asphalt', defaultLanes: 2},
	footway: {type: 'footway', defaultMaterial: 'dirt', defaultLanes: 1},
	path: {type: 'footway', defaultMaterial: 'dirt', defaultLanes: 1},
	steps: {type: 'footway', defaultMaterial: 'dirt', defaultLanes: 1},
	pedestrian: {type: 'footway', defaultMaterial: 'dirt', defaultLanes: 1},
	cycleway: {type: 'cycleway', defaultMaterial: 'dirt', defaultLanes: 1},
	raceway: {type: 'roadway', defaultMaterial: 'asphalt', defaultLanes: 1, defaultWidth: 6}
}

export default function getPathParamsFromTags(tags: Record<string, string>): {
	type: VectorPolylineDescriptor['pathType'];
	material: VectorPolylineDescriptor['pathMaterial'];
	defaultLanes: number;
	defaultWidth?: number;
} {
	const highwayParams = highwayTable[tags.highway];

	if (!highwayParams) {
		return null;
	}

	const material = materialTable[tags.surface] ?? highwayParams.defaultMaterial;

	return {
		type: highwayParams.type,
		material: material,
		defaultLanes: highwayParams.defaultLanes,
		defaultWidth: highwayParams.defaultWidth
	};
}