import {
	VectorAreaDescriptor,
	VectorNodeDescriptor,
	VectorPolylineDescriptor
} from "~/lib/tile-processing/vector/descriptors";

export const getPolylineDescriptorFromTags = (tags: Record<string, string>): VectorPolylineDescriptor => {
	if (tags.highway) {
		const desc: VectorPolylineDescriptor = {
			type: 'path'
		};

		switch (tags.highway) {
			case 'residential':
			case 'service':
			case 'track':
			case 'unclassified':
			case 'tertiary':
			case 'secondary':
			case 'primary':
			case 'living_street':
			case 'trunk':
			case 'motorway':
			case 'motorway_link': {
				desc.pathType = 'roadway';
				break;
			}
			case 'footway':
			case 'path':
			case 'steps':
			case 'pedestrian': {
				desc.pathType = 'footway';
				break;
			}
			case 'cycleway': {
				desc.pathType = 'cycleway';
				break;
			}
			default: {
				desc.pathType = 'roadway';
				break;
			}
		}

		return desc;
	}

	if (tags.railway === 'rail') {
		return {
			type: 'path',
			pathType: 'railway'
		};
	}

	if (tags.barrier === 'fence') {
		return {
			type: 'fence'
		};
	}

	if (tags.barrier === 'hedge') {
		return {
			type: 'hedge'
		};
	}

	return null;
}

export const getAreaDescriptorFromTags = (tags: Record<string, string>): VectorAreaDescriptor => {
	if (tags.building) {
		return {
			type: 'building'
		};
	}

	if (tags.buildingPart) {
		return {
			type: 'buildingPart'
		};
	}

	if (tags.natural === 'sand') {
		return {
			type: 'sand'
		};
	}

	if (tags.natural === 'rock') {
		return {
			type: 'rock'
		};
	}

	return null;
}

export const getNodeDescriptorFromTags = (tags: Record<string, string>): VectorNodeDescriptor => {
	if (tags.natural === 'true') {
		return {
			type: 'tree'
		};
	}

	if (tags.emergency === 'fire_hydrant') {
		return {
			type: 'hydrant'
		};
	}

	return null;
}