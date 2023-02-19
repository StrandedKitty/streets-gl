import {
	VectorAreaDescriptor,
	VectorNodeDescriptor,
	VectorPolylineDescriptor
} from "~/lib/tile-processing/vector/descriptors";
import {Modifier, ModifierType} from "~/lib/tile-processing/vector/modifiers";
import ColorsList from '../../../resources/colors.json';
import {Tags} from "~/lib/tile-processing/vector/providers/OverpassDataObject";

type Descriptor = VectorNodeDescriptor | VectorAreaDescriptor | VectorPolylineDescriptor;

export enum ContainerType {
	Descriptor,
	Modifier
}

interface ModifierContainer {
	type: ContainerType.Modifier;
	data: Modifier;
}

interface DescriptorContainer<T extends Descriptor> {
	type: ContainerType.Descriptor;
	data: T;
}

type Container<T extends Descriptor> = ModifierContainer | DescriptorContainer<T>;

const RoofOSMShapeToType: Record<string, VectorAreaDescriptor['buildingRoofType']> = {
	flat: 'flat',
	hipped: 'hipped',
	gabled: 'gabled',
	pyramidal: 'pyramidal'
};

const RoofTypeToDefaultLevels: Record<VectorAreaDescriptor['buildingRoofType'], number> = {
	flat: 0,
	hipped: 1,
	gabled: 1,
	pyramidal: 1
};

export class VectorDescriptorFactory {
	public static parsePolylineTags(tags: Record<string, string>): Container<VectorPolylineDescriptor> {
		if (tags.highway) {
			const descriptor: VectorPolylineDescriptor = {
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
					descriptor.pathType = 'roadway';
					break;
				}
				case 'footway':
				case 'path':
				case 'steps':
				case 'pedestrian': {
					descriptor.pathType = 'footway';
					break;
				}
				case 'cycleway': {
					descriptor.pathType = 'cycleway';
					break;
				}
				default: {
					descriptor.pathType = 'roadway';
					break;
				}
			}

			return {
				type: ContainerType.Descriptor,
				data: descriptor
			};
		}

		if (tags.railway === 'rail') {
			return {
				type: ContainerType.Descriptor,
				data: {
					type: 'path',
					pathType: 'railway'
				}
			};
		}

		if (tags.barrier === 'fence') {
			return {
				type: ContainerType.Descriptor,
				data: {
					type: 'fence'
				}
			};
		}

		if (tags.barrier === 'hedge') {
			return {
				type: ContainerType.Descriptor,
				data: {
					type: 'hedge'
				}
			};
		}

		if (tags.natural === 'tree_row') {
			return {
				type: ContainerType.Modifier,
				data: {
					type: ModifierType.NodeRow,
					spacing: 10,
					randomness: 1,
					descriptor: {
						type: 'tree'
					}
				}
			};
		}

		return null;
	}

	public static parseAreaTags(tags: Record<string, string>): Container<VectorAreaDescriptor> {
		if (tags.building) {
			return {
				type: ContainerType.Descriptor,
				data: {
					type: 'building',
					...this.parseBuildingParams(tags)
				}
			};
		}

		if (tags['building:part']) {
			return {
				type: ContainerType.Descriptor,
				data: {
					type: 'buildingPart',
					...this.parseBuildingParams(tags)
				}
			};
		}

		if (tags.natural === 'sand') {
			return {
				type: ContainerType.Descriptor,
				data: {
					type: 'sand'
				}
			};
		}

		if (tags.natural === 'rock') {
			return {
				type: ContainerType.Descriptor,
				data: {
					type: 'rock'
				}
			};
		}

		return null;
	}

	public static parseNodeTags(tags: Record<string, string>): Container<VectorNodeDescriptor> {
		if (tags.natural === 'tree') {
			return {
				type: ContainerType.Descriptor,
				data: {
					type: 'tree'
				}
			};
		}

		if (tags.emergency === 'fire_hydrant') {
			return {
				type: ContainerType.Descriptor,
				data: {
					type: 'hydrant'
				}
			};
		}
		if (tags.advertising === 'column') {
			return {
				type: ContainerType.Descriptor,
				data: {
					type: 'adColumn'
				}
			};
		}

		return null;
	}

	private static parseRoofType(
		str: string,
		fallback: VectorAreaDescriptor['buildingRoofType']
	): VectorAreaDescriptor['buildingRoofType'] {
		return RoofOSMShapeToType[str] ?? fallback;
	}

	private static getRoofDefaultLevels(type: VectorAreaDescriptor['buildingRoofType']): number {
		return RoofTypeToDefaultLevels[type];
	}

	private static parseFacadeMaterial(
		str: string,
		fallback: VectorAreaDescriptor['buildingFacadeMaterial']
	): VectorAreaDescriptor['buildingFacadeMaterial'] {
		switch (str) {
			case 'brick':
				return 'brick';
			case 'cement_block':
				return 'cementBlock';
			case 'wood':
				return 'wood';
			case 'plaster':
			case 'plastered':
				return 'plaster';
			case 'glass':
				return 'glass';
		}

		return fallback;
	}

	private static parseRoofMaterial(
		str: string,
		fallback: VectorAreaDescriptor['buildingRoofMaterial']
	): VectorAreaDescriptor['buildingRoofMaterial'] {
		switch (str) {
			case 'tile':
			case 'roof_tiles':
				return 'tiles';
			case 'metal':
			case 'metal_sheet':
			case 'metal sheet':
				return 'metal';
			case 'concrete':
				return 'concrete';
		}

		return fallback;
	}

	private static isBuildingHasWindows(tags: Tags): boolean {
		if (!tags.building) {
			return false;
		}

		const list = ['garage', 'garages', 'greenhouse', 'storage_tank', 'bunker', 'silo', 'stadium'];

		return !list.includes(tags.building);
	}

	private static parseBuildingParams(tags: Tags): {
		buildingLevels: number;
		buildingHeight: number;
		buildingMinHeight: number;
		buildingRoofHeight: number;
		buildingRoofType: VectorAreaDescriptor['buildingRoofType'];
		buildingFacadeMaterial: VectorAreaDescriptor['buildingFacadeMaterial'];
		buildingFacadeColor: number;
		buildingRoofMaterial: VectorAreaDescriptor['buildingRoofMaterial'];
		buildingRoofColor: number;
		buildingWindows: boolean;
	} {
		const fallbackLevels = 1;
		const levelHeight = 4;
		const fallbackFacadeColor = 0xffffff;
		const fallbackRoofColor = 0xffffff;

		const roofType = this.parseRoofType(tags['roof:shape'], 'flat');
		const roofLevels = this.parseUnsignedInt(tags['roof:levels']) ?? this.getRoofDefaultLevels(roofType);
		const roofHeight = this.parseHeight(tags['roof:height'], roofLevels * levelHeight);
		const roofColor = this.parseColor(tags['roof:colour'], fallbackRoofColor);
		const roofMaterial = this.parseRoofMaterial(tags['building:material'], 'default');

		const levels = this.parseUnsignedInt(tags['building:levels']) ?? fallbackLevels;
		const height = Math.max(0,
			this.parseHeight(
				tags.height,
				levels * levelHeight + roofHeight
			) - roofHeight
		);
		const minHeight = this.parseHeight(tags.min_height, 0);
		const color = this.parseColor(tags['building:colour'], fallbackFacadeColor);
		const material = this.parseFacadeMaterial(tags['building:material'], 'plaster');
		const windows = this.isBuildingHasWindows(tags);

		return {
			buildingLevels: levels,
			buildingHeight: height,
			buildingMinHeight: minHeight,
			buildingRoofHeight: roofHeight,
			buildingRoofType: roofType,
			buildingFacadeMaterial: material,
			buildingFacadeColor: color,
			buildingRoofMaterial: roofMaterial,
			buildingRoofColor: roofColor,
			buildingWindows: windows
		};
	}

	private static parseColor(str: string = '', fallback?: number): number {
		const noSpaces = str.replace(/[ _-]/g, '');
		const entry = (ColorsList as Record<string, number[]>)[noSpaces];

		if (!entry) {
			return fallback;
		}

		return entry[0] * 256 * 256 + entry[1] * 256 + entry[2];
	}

	private static parseHeight(str: string = '', fallback?: number): number {
		const units = this.parseUnits(str);

		if (!isNaN(units)) {
			return units;
		}

		return fallback;
	}

	private static parseUnits(str: string = ''): number {
		str = str
			.replace(/,/g, '.')
			.replace(/ /g, '')
			.replace(/ft/g, '\'')
			.replace(/feet/g, '\'');

		if (str.search(/m/) !== -1) {
			return parseFloat(str.replace(/m/g, ''));
		} else if (str.search(/'/) !== -1) {
			const [feet, inches] = str.split('\'').map(v => parseFloat(v));
			return (feet * 12 + (inches || 0)) * 0.0254;
		} else if (str.search(/"/) !== -1) {
			const inches = parseFloat(str) || 0;
			return inches * 0.0254;
		}

		return parseFloat(str);
	}

	private static parseUnsignedInt(str: string = ''): number {
		const value = Math.max(parseInt(str), 0);
		return isNaN(value) ? undefined : value;
	}
}