import {VectorPolylineDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";
import {VectorTile} from "~/lib/tile-processing/vector/providers/pbf/VectorTile";

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
	defaultIsMarked?: boolean;
}> = {
	residential: {
		type: 'roadway',
		defaultMaterial: 'asphalt',
		defaultLanes: 2,
		defaultIsMarked: true
	},
	service: {
		type: 'roadway',
		defaultMaterial: 'asphalt',
		defaultLanes: 2,
		defaultIsMarked: false
	},
	track: {
		type: 'roadway',
		defaultMaterial: 'dirt',
		defaultLanes: 1,
		defaultIsMarked: false
	},
	unclassified: {
		type: 'roadway',
		defaultMaterial: 'asphalt',
		defaultLanes: 2,
		defaultIsMarked: true
	},
	tertiary: {
		type: 'roadway',
		defaultMaterial: 'asphalt',
		defaultLanes: 2,
		defaultIsMarked: true
	},
	secondary: {
		type: 'roadway',
		defaultMaterial: 'asphalt',
		defaultLanes: 2,
		defaultIsMarked: true
	},
	primary: {
		type: 'roadway',
		defaultMaterial: 'asphalt',
		defaultLanes: 2,
		defaultIsMarked: true
	},
	living_street: {
		type: 'roadway',
		defaultMaterial: 'asphalt',
		defaultLanes: 2,
		defaultIsMarked: false
	},
	trunk: {
		type: 'roadway',
		defaultMaterial: 'asphalt',
		defaultLanes: 2,
		defaultIsMarked: true
	},
	motorway: {
		type: 'roadway',
		defaultMaterial: 'asphalt',
		defaultLanes: 2,
		defaultIsMarked: true
	},
	motorway_link: {
		type: 'roadway',
		defaultMaterial: 'asphalt',
		defaultLanes: 1,
		defaultIsMarked: true
	},
	trunk_link: {
		type: 'roadway',
		defaultMaterial: 'asphalt',
		defaultLanes: 1,
		defaultIsMarked: true
	},
	primary_link: {
		type: 'roadway',
		defaultMaterial: 'asphalt',
		defaultLanes: 1,
		defaultIsMarked: true
	},
	secondary_link: {
		type: 'roadway',
		defaultMaterial: 'asphalt',
		defaultLanes: 1,
		defaultIsMarked: true
	},
	tertiary_link: {
		type: 'roadway',
		defaultMaterial: 'asphalt',
		defaultLanes: 1,
		defaultIsMarked: true
	},
	busway: {
		type: 'roadway',
		defaultMaterial: 'asphalt',
		defaultLanes: 1,
		defaultIsMarked: true
	},
	raceway: {
		type: 'roadway',
		defaultMaterial: 'asphalt',
		defaultLanes: 1,
		defaultWidth: 6,
		defaultIsMarked: false
	},
	footway: {type: 'footway', defaultMaterial: 'dirt', defaultLanes: 1},
	path: {type: 'footway', defaultMaterial: 'dirt', defaultLanes: 1},
	steps: {type: 'footway', defaultMaterial: 'dirt', defaultLanes: 1},
	pedestrian: {type: 'footway', defaultMaterial: 'dirt', defaultLanes: 1},
	cycleway: {type: 'cycleway', defaultMaterial: 'dirt', defaultLanes: 1}
};

export default function getPathParams(tags: VectorTile.FeatureTags): {
	type: VectorPolylineDescriptor['pathType'];
	material: VectorPolylineDescriptor['pathMaterial'];
	defaultLanes: number;
	defaultWidth?: number;
	defaultIsMarked: boolean;
} {
	const highwayParams = highwayTable[<string>tags.pathType];

	if (!highwayParams) {
		return null;
	}

	const material = materialTable[<string>tags.surface] ?? highwayParams.defaultMaterial;

	return {
		type: highwayParams.type,
		material: material,
		defaultLanes: highwayParams.defaultLanes ?? 1,
		defaultWidth: highwayParams.defaultWidth,
		defaultIsMarked: highwayParams.defaultIsMarked ?? true
	};
}