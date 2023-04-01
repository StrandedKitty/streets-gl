import {
	VectorAreaDescriptor,
	VectorNodeDescriptor,
	VectorPolylineDescriptor
} from "~/lib/tile-processing/vector/descriptors";
import {Modifier, ModifierType} from "~/lib/tile-processing/vector/modifiers";
import ColorsList from '../../../../resources/colors.json';
import {Tags} from "~/lib/tile-processing/vector/providers/OverpassDataObject";
import Utils from "~/app/Utils";

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
	pyramidal: 'pyramidal',
	onion: 'onion',
	dome: 'dome',
	round: 'round',
	skillion: 'skillion',
	mansard: 'mansard',
	quadruple_saltbox: 'quadrupleSaltbox'
};

const RoofTypeToDefaultLevels: Record<VectorAreaDescriptor['buildingRoofType'], number> = {
	flat: 0,
	hipped: 1,
	gabled: 1,
	pyramidal: 1,
	onion: 2,
	dome: 2,
	round: 2,
	skillion: 1,
	mansard: 1,
	quadrupleSaltbox: 1
};

export class VectorDescriptorFactory {
	public static parsePolylineTags(tags: Record<string, string>): Container<VectorPolylineDescriptor>[] {
		if (this.isUnderground(tags)) {
			return null;
		}

		if (tags.highway) {
			const descriptor: VectorPolylineDescriptor = {
				type: 'path',
				pathMaterial: this.parsePathMaterial(tags.surface)
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
				case 'motorway_link':
				case 'busway': {
					descriptor.pathType = 'roadway';

					const isOneWay = tags.oneway === 'yes';
					let lanesForward = this.parseUnsignedInt(tags['lanes:forward']);
					let lanesBackward = this.parseUnsignedInt(tags['lanes:backward']);
					const lanesTotal = this.parseUnsignedInt(tags['lanes']) ?? 2;

					if (isOneWay) {
						lanesForward = lanesTotal;
						lanesBackward = 0;
					} else {
						if (lanesForward === undefined && lanesBackward === undefined) {
							lanesForward = Math.ceil(lanesTotal / 2);
							lanesBackward = lanesTotal - lanesForward;
						} else if (lanesForward === undefined) {
							lanesForward = Math.max(0, lanesTotal - lanesBackward);
						} else if (lanesBackward === undefined) {
							lanesBackward = Math.max(0, lanesTotal - lanesForward);
						}
					}

					descriptor.lanesForward = lanesForward;
					descriptor.lanesBackward = lanesBackward;
					descriptor.width = this.parseUnits(tags.width) ?? (lanesForward + lanesBackward) * 3;
					break;
				}
				case 'footway':
				case 'path':
				case 'steps':
				case 'pedestrian': {
					descriptor.pathType = 'footway';
					descriptor.width = this.parseUnits(tags.width) ?? 2;
					break;
				}
				case 'cycleway': {
					descriptor.pathType = 'cycleway';
					descriptor.width = this.parseUnits(tags.width) ?? 3;
					break;
				}
			}

			if (!descriptor.pathType) {
				return [];
			}

			const descriptors: Container<VectorPolylineDescriptor>[] = [{
				type: ContainerType.Descriptor,
				data: descriptor
			}];

			if (descriptor.pathType === 'roadway') {
				const cyclewayWidth = 2;
				const sidewalkWidth = 3;

				const sidewalkSide = this.getSidewalkSide(tags);
				const cyclewaySide = this.getCyclewaySide(tags);

				const roadWidth = descriptor.width;

				if (cyclewaySide) {
					descriptors.push({
						type: ContainerType.Descriptor,
						data: {
							type: 'path',
							pathType: 'cycleway',
							width: roadWidth + cyclewayWidth * 2,
							side: cyclewaySide
						}
					});
				}

				if (sidewalkSide) {
					if (!cyclewaySide || cyclewaySide === 'both') {
						descriptors.push({
							type: ContainerType.Descriptor,
							data: {
								type: 'path',
								pathType: 'footway',
								width: roadWidth + sidewalkWidth * 2 + (cyclewaySide === 'both' ? cyclewayWidth * 2 : 0),
								side: sidewalkSide
							}
						});
					} else {
						if (sidewalkSide === 'left' || sidewalkSide === 'both') {
							const multiplier = cyclewaySide === 'left' ? 1 : 0;
							const width = roadWidth + sidewalkWidth * 2 + multiplier * cyclewayWidth * 2;

							descriptors.push({
								type: ContainerType.Descriptor,
								data: {
									type: 'path',
									pathType: 'footway',
									width: width,
									side: 'left'
								}
							});
						}

						if (sidewalkSide === 'right' || sidewalkSide === 'both') {
							const multiplier = cyclewaySide === 'right' ? 1 : 0;
							const width = roadWidth + sidewalkWidth * 2 + multiplier * cyclewayWidth * 2;

							descriptors.push({
								type: ContainerType.Descriptor,
								data: {
									type: 'path',
									pathType: 'footway',
									width: width,
									side: 'right'
								}
							});
						}
					}
				}
			}

			return descriptors;
		}

		if (tags.aeroway === 'runway' || tags.aeroway === 'taxiway') {
			let width = this.parseUnits(tags.width);

			if (width === undefined) {
				if (tags.aeroway === 'runway') {
					width = 45;
				} else {
					width = 20;
				}
			}

			return [{
				type: ContainerType.Descriptor,
				data: {
					type: 'path',
					pathType: 'runway',
					width: width
				}
			}];
		}

		if (tags.railway === 'rail') {
			return [{
				type: ContainerType.Descriptor,
				data: {
					type: 'path',
					pathType: 'railway',
					width: 3
				}
			}];
		}

		if (tags.railway === 'tram') {
			return [{
				type: ContainerType.Descriptor,
				data: {
					type: 'path',
					pathType: 'tramway',
					width: 3
				}
			}];
		}

		if (tags.barrier === 'fence' || tags.barrier === 'wall') {
			const minHeight = this.parseHeight(tags.min_height, 0);
			const height = this.parseHeight(tags.height, 2) - minHeight;

			if (height <= 0) {
				return [];
			}

			return [{
				type: ContainerType.Descriptor,
				data: {
					type: 'fence',
					height,
					minHeight
				}
			}];
		}

		if (tags.barrier === 'hedge') {
			return [{
				type: ContainerType.Descriptor,
				data: {
					type: 'hedge'
				}
			}];
		}

		if (tags.natural === 'tree_row') {
			return [{
				type: ContainerType.Modifier,
				data: {
					type: ModifierType.NodeRow,
					spacing: 10,
					randomness: 1,
					descriptor: {
						type: 'tree'
					}
				}
			}];
		}

		return null;
	}

	public static parseAreaTags(tags: Record<string, string>): Container<VectorAreaDescriptor> {
		if (this.isUnderground(tags)) {
			return null;
		}

		if (tags['building:part'] && tags['building:part'] !== 'no') {
			return {
				type: ContainerType.Descriptor,
				data: {
					type: 'buildingPart',
					...this.parseBuildingParams(tags, tags['building:part'] === 'roof'),
				}
			};
		}

		if (tags.building && tags.building !== 'construction') {
			return {
				type: ContainerType.Descriptor,
				data: {
					type: 'building',
					...this.parseBuildingParams(tags, tags.building === 'roof')
				}
			};
		}

		if (tags.natural === 'sand' || tags.natural === 'beach') {
			return {
				type: ContainerType.Descriptor,
				data: {
					type: 'sand'
				}
			};
		}

		if (tags.natural === 'rock' || tags.natural === 'bare_rock') {
			return {
				type: ContainerType.Descriptor,
				data: {
					type: 'rock'
				}
			};
		}

		if (tags.leisure === 'pitch') {
			let type: VectorAreaDescriptor['pitchType'] = 'football';

			if (tags.sport === 'basketball') {
				type = 'basketball';
			} else if (tags.sport === 'tennis') {
				type = 'tennis';
			}

			return {
				type: ContainerType.Descriptor,
				data: {
					type: 'pitch',
					pitchType: type
				}
			};
		}

		if (tags.golf === 'fairway') {
			return {
				type: ContainerType.Descriptor,
				data: {
					type: 'manicuredGrass'
				}
			};
		}

		if (
			tags.amenity === 'parking' && (tags.parking === 'surface' || tags.parking === undefined) ||
			tags.amenity === 'bicycle_parking'
		) {
			return {
				type: ContainerType.Descriptor,
				data: {
					type: 'roadway'
				}
			};
		}

		if (
			(tags.area === 'yes' || tags.type === 'multipolygon') &&
			(
				tags.highway === 'pedestrian' ||
				tags.highway === 'footway' ||
				tags.man_made === 'pier'
			)
		) {
			return {
				type: ContainerType.Descriptor,
				data: {
					type: 'footway'
				}
			};
		}

		if (tags.man_made === 'bridge') {
			return {
				type: ContainerType.Descriptor,
				data: {
					type: 'footway'
				}
			};
		}

		if (tags.aeroway === 'apron') {
			return {
				type: ContainerType.Descriptor,
				data: {
					type: 'footway'
				}
			};
		}

		return null;
	}

	public static parseNodeTags(tags: Record<string, string>): Container<VectorNodeDescriptor> {
		if (this.isUnderground(tags)) {
			return null;
		}

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

		if (tags.highway === 'turning_circle') {
			return {
				type: ContainerType.Modifier,
				data: {
					type: ModifierType.CircleArea,
					radius: 10,
					descriptor: {
						type: 'roadwayIntersection',
						intersectionMaterial: 'asphalt'
					}
				}
			};
		}

		return null;
	}

	private static parsePathMaterial(str: string): VectorPolylineDescriptor['pathMaterial'] {
		switch (str) {
			case 'concrete':
				return 'concrete';
			case 'wood':
				return 'wood';
		}

		return 'asphalt';
	}

	private static parseRoofType(
		str: string,
		fallback: VectorAreaDescriptor['buildingRoofType']
	): VectorAreaDescriptor['buildingRoofType'] {
		return RoofOSMShapeToType[str] ?? fallback;
	}

	private static parseRoofOrientation(str: string): VectorAreaDescriptor['buildingRoofOrientation'] {
		if (str === 'along' || str === 'across') {
			return str;
		}

		return null;
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
			case 'tiles':
			case 'roof_tiles':
			case 'slate':
				return 'tiles';
			case 'metal':
			case 'metal_sheet':
			case 'metal sheet':
			case 'tin':
			case 'copper':
			case 'zinc':
				return 'metal';
			case 'concrete':
			case 'asphalt':
				return 'concrete';
			case 'eternit':
			case 'asbestos':
				return 'eternit';
			case 'thatch':
				return 'thatch';
			case 'grass':
				return 'grass';
			case 'glass':
				return 'glass';
			case 'tar_paper':
				return 'tar';
		}

		return fallback;
	}

	private static getRoofMaterialAndColor(materialValue: string, colorValue: string, noDefault: boolean): {
		material: VectorAreaDescriptor['buildingRoofMaterial'];
		color: number;
	} {
		let material = this.parseRoofMaterial(materialValue, 'default');
		let color = this.parseColor(colorValue, null);

		if ((color !== null || noDefault) && material === 'default') {
			material = 'concrete';
		}

		if (color === null) {
			switch (material) {
				case "concrete": {
					color = 0xBBBBBB;
					break;
				}
				case "metal": {
					color = materialValue === 'copper' ? 0xA3CABD : 0xC3D2DD;
					break;
				}
				case "tiles": {
					color = materialValue === 'slate' ? 0x8C8C97 : 0xCB7D64;
					break;
				}
				default: {
					color = 0xffffff;
				}
			}
		}

		if (material === 'thatch' || material === 'eternit' || material === 'grass') {
			color = 0xffffff;
		}

		return {
			material: material,
			color: color
		};
	}

	private static isBuildingHasWindows(tags: Tags): boolean {
		if (tags['bridge:support']) {
			return false;
		}

		const list = ['garage', 'garages', 'greenhouse', 'storage_tank', 'bunker', 'silo', 'stadium', 'ship'];

		return !list.includes(tags.building);
	}

	private static parseBuildingParams(tags: Tags, onlyRoof: boolean = false): {
		label: string;
		buildingLevels: number;
		buildingHeight: number;
		buildingMinHeight: number;
		buildingRoofHeight: number;
		buildingRoofType: VectorAreaDescriptor['buildingRoofType'];
		buildingRoofOrientation: VectorAreaDescriptor['buildingRoofOrientation'];
		buildingRoofDirection: number;
		buildingRoofAngle: number;
		buildingFacadeMaterial: VectorAreaDescriptor['buildingFacadeMaterial'];
		buildingFacadeColor: number;
		buildingRoofMaterial: VectorAreaDescriptor['buildingRoofMaterial'];
		buildingRoofColor: number;
		buildingWindows: boolean;
	} {
		const fallbackLevels = 1;
		const levelHeight = 4;
		const fallbackFacadeColor = 0xffffff;

		const roofType = this.parseRoofType(tags['roof:shape'], 'flat');
		const roofOrientation = this.parseRoofOrientation(tags['roof:orientation']);
		const roofLevels = this.parseUnsignedInt(tags['roof:levels']) ?? this.getRoofDefaultLevels(roofType);
		const roofMatAndColor = this.getRoofMaterialAndColor(
			tags['roof:material'],
			tags['roof:colour'],
			tags.building === 'stadium' || tags.building === 'houseboat' || roofType !== 'flat' || !!tags['bridge:support'] || !!tags['ship:type']
		);
		const roofDirection = this.parseFloat(tags['roof:direction']) ?? 0;

		const roofHeight = this.parseHeight(tags['roof:height'], roofLevels * levelHeight);
		const roofAngle = this.parseUnsignedFloat(tags['roof:angle']);

		let minLevel = this.parseUnsignedInt(tags['building:min_level']) ?? null;
		let height = this.parseHeight(tags.height, this.parseHeight(tags.est_height, null));
		let levels = this.parseUnsignedInt(tags['building:levels']) ?? null;
		let minHeight = this.parseHeight(tags.min_height, null);

		if (height === null && levels === null) {
			levels = fallbackLevels;
			height = levels * levelHeight + roofHeight
		} else if (height === null) {
			height = levels * levelHeight + roofHeight
		} else if (levels === null) {
			levels = Math.max(1, Math.round((height - roofHeight) / levelHeight));
		}

		if (minLevel === null) {
			if (minHeight !== null) {
				minLevel = Math.min(levels - 1, Math.round(minHeight / levelHeight));
			} else {
				minLevel = 0;
			}
		}

		if (minHeight === null) {
			minHeight = Math.min(minLevel * levelHeight, height);
		}

		const color = this.parseColor(tags['building:colour'], fallbackFacadeColor);
		const material = this.parseFacadeMaterial(tags['building:material'], 'plaster');
		const windows = this.isBuildingHasWindows(tags);
		const label = tags.name ?? null;

		return {
			label: label,
			buildingLevels: levels - minLevel,
			buildingHeight: height,
			buildingMinHeight: onlyRoof ? (height - roofHeight) : minHeight,
			buildingRoofHeight: roofHeight,
			buildingRoofType: roofType,
			buildingRoofOrientation: roofOrientation,
			buildingRoofDirection: roofDirection,
			buildingRoofAngle: roofAngle,
			buildingFacadeMaterial: material,
			buildingFacadeColor: color,
			buildingRoofMaterial: roofMatAndColor.material,
			buildingRoofColor: roofMatAndColor.color,
			buildingWindows: windows
		};
	}

	private static getSidewalkSide(tags: Tags): VectorPolylineDescriptor['side'] {
		const isBoth = tags['sidewalk:both'] === 'yes' || tags['sidewalk'] === 'both';
		const isOnLeft = tags['sidewalk:left'] === 'yes' || tags['sidewalk'] === 'left' || isBoth;
		const isOnRight = tags['sidewalk:right'] === 'yes' || tags['sidewalk'] === 'right' || isBoth;

		if (isOnLeft && isOnRight) {
			return 'both';
		}

		if (isOnLeft) {
			return 'left';
		}

		if (isOnRight) {
			return 'right';
		}

		return null;
	}

	private static getCyclewaySide(tags: Tags): VectorPolylineDescriptor['side'] {
		const isBoth = tags['cycleway:both'] === 'lane';
		const isOnLeft = tags['cycleway:left'] === 'lane' || isBoth;
		const isOnRight = tags['cycleway:right'] === 'lane' || isBoth;

		if (isOnLeft && isOnRight) {
			return 'both';
		}

		if (isOnLeft) {
			return 'left';
		}

		if (isOnRight) {
			return 'right';
		}

		return null;
	}

	private static isUnderground(tags: Tags): boolean {
		return (
			tags.location === 'underground' ||
			this.parseFloat(tags.level) < 0 ||
			tags.tunnel === 'yes' ||
			tags.parking === 'underground'
		);
	}

	private static parseColor(str: string = '', fallback?: number): number {
		if (str.length === 0) {
			return fallback;
		}

		const noSpacesLowerCase = str.replace(/[ _-]/g, '').toLowerCase();
		let components = (ColorsList as Record<string, number[]>)[noSpacesLowerCase];

		if (!components) {
			const hex = str.includes(';') ? str.split(';')[0] : str;
			components = Utils.hexToRgb(hex);
		}

		if (!components) {
			return fallback;
		}

		return components[0] * 256 * 256 + components[1] * 256 + components[2];
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

		const parsedFloat = parseFloat(str);

		return isNaN(parsedFloat) ? undefined : parsedFloat;
	}

	private static parseUnsignedInt(str: string = ''): number {
		const value = Math.max(parseInt(str), 0);
		return isNaN(value) ? undefined : value;
	}

	private static parseInt(str: string = ''): number {
		const value = parseInt(str);
		return isNaN(value) ? undefined : value;
	}

	private static parseFloat(str: string = ''): number {
		const value = parseFloat(str);
		return isNaN(value) ? undefined : value;
	}

	private static parseUnsignedFloat(str: string = ''): number {
		const value = Math.max(parseFloat(str), 0);
		return isNaN(value) ? undefined : value;
	}
}