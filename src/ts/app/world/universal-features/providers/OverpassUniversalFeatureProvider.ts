import UniversalFeatureProvider from "~/app/world/universal-features/providers/UniversalFeatureProvider";
import UniversalFeatureCollection from "~/app/world/universal-features/UniversalFeatureCollection";
import Config from "~/app/Config";
import MathUtils from "~/math/MathUtils";
import OverpassDataObject, {
	NodeElement,
	RelationElement,
	RelationMember,
	WayElement
} from "~/app/world/universal-features/providers/OverpassDataObject";
import UniversalNode from "~/app/world/universal-features/UniversalNode";
import Vec2 from "~/math/Vec2";
import UniversalArea, {UniversalAreaRing, UniversalAreaRingType} from "~/app/world/universal-features/UniversalArea";
import UniversalPolyline from "~/app/world/universal-features/UniversalPolyline";
import {
	UniversalAreaDescription,
	UniversalNodeDescription,
	UniversalPolylineDescription
} from "~/app/world/universal-features/descriptions";
import {OSMReference, OSMReferenceType} from "~/app/world/universal-features/UniversalFeature";

const TileRequestMargin = 0.05;

const getRequestURL = (x: number, y: number): string => {
	const position = [
		MathUtils.tile2degrees(x - TileRequestMargin, y + 1 + TileRequestMargin),
		MathUtils.tile2degrees(x + 1 + TileRequestMargin, y - TileRequestMargin)
	];
	const bbox = position[0].lat + ',' + position[0].lon + ',' + position[1].lat + ',' + position[1].lon;
	const urls = [
		//'http://overpass.openstreetmap.ru/cgi/interpreter?data=',
		'https://overpass.kumi.systems/api/interpreter?data='
		//'https://overpass.nchc.org.tw/api/interpreter?data=',
		//'https://lz4.overpass-api.de/api/interpreter?data=',
		//'https://z.overpass-api.de/api/interpreter?data='
	];
	let url = urls[Math.floor(urls.length * Math.random())];
	url += `
		[out:json][timeout:${Math.floor(Config.OverpassRequestTimeout / 1000)}];
		(
			node(${bbox});
			way(${bbox});
			rel["type"="building"](${bbox});
		 	rel["type"="multipolygon"]["building"](${bbox});
		 	rel["type"="multipolygon"]["building:part"](${bbox});
		 	rel["type"="multipolygon"]["highway"](${bbox});
		)->.data;
		
		.data > ->.dataMembers;
		
		(
			.data;
			.dataMembers;
		)->.all;
		
		.all out body qt;
	`;

	return url;
};

const isWayElementArea = (way: WayElement): boolean => {
	if (way.nodes.length < 4 || way.nodes[0] !== way.nodes[way.nodes.length - 1]) {
		return false;
	}

	const tags = way.tags || {};

	if (tags.area === 'yes' || tags.building || tags['building:part']) {
		return true;
	}

	return false;
}

const isWayElementPolyline = (way: WayElement): boolean => {
	if (way.nodes.length < 2) {
		return false;
	}

	const tags = way.tags || {};

	if (tags.type === 'path' || tags.type === 'fence') {
		return true;
	}

	return false;
}

const ElementTypeToOSMReferenceTypeMap: Record<string, OSMReferenceType> = {
	node: OSMReferenceType.Node,
	way: OSMReferenceType.Way,
	relation: OSMReferenceType.Relation
};

const getElementOSMReference = (element: NodeElement | WayElement | RelationElement): OSMReference => {
	return {
		type: ElementTypeToOSMReferenceTypeMap[element.type] ?? OSMReferenceType.None,
		id: element.id ?? 0
	};
}

const getNodeDescriptionFromTags = (tags: Record<string, string>): UniversalNodeDescription => {
	return {};
}

const getPolylineDescriptionFromTags = (tags: Record<string, string>): UniversalPolylineDescription => {
	return {
		type: 'path'
	};
}

const getAreaDescriptionFromTags = (tags: Record<string, string>): UniversalAreaDescription => {
	return {
		type: 'roadway'
	};
}

export default class OverpassUniversalFeatureProvider extends UniversalFeatureProvider {
	public async getCollection(
		{
			x,
			y
		}: {
			x: number;
			y: number;
		}
	): Promise<UniversalFeatureCollection> {
		const tileOrigin = MathUtils.tile2meters(x, y + 1);
		const overpassData = await this.fetchOverpassTile(x, y);
		const nodesMap: Map<number, UniversalNode> = new Map();
		const polylines: UniversalPolyline[] = [];
		const areas: UniversalArea[] = [];

		for (const element of overpassData.elements) {
			if (element.type === 'node') {
				const position = Vec2.sub(MathUtils.degrees2meters(element.lat, element.lon), tileOrigin);
				const node = new UniversalNode(
					element.id,
					position.x,
					position.y,
					getNodeDescriptionFromTags(element.tags || {}),
					getElementOSMReference(element)
				);

				nodesMap.set(element.id, node);
			}
		}

		for (const element of overpassData.elements) {
			if (element.type === 'way') {
				const elementNodes = element.nodes.map(nodeId => {
					return nodesMap.get(nodeId);
				});
				const polylineDesc = getPolylineDescriptionFromTags(element.tags || {});
				const areaDesc = getAreaDescriptionFromTags(element.tags || {});

				if (polylineDesc) {
					polylines.push(new UniversalPolyline(
						elementNodes,
						polylineDesc,
						getElementOSMReference(element)
					));
				}

				if (areaDesc) {
					const ring = new UniversalAreaRing(elementNodes, UniversalAreaRingType.Outer);

					areas.push(new UniversalArea(
						[ring],
						areaDesc,
						getElementOSMReference(element)
					));
				}
			}

			if (element.type === 'relation' && element.tags && element.tags.type === 'multipolygon') {
				const members = element.members.filter(member => member.type === 'way');
				const desc = getAreaDescriptionFromTags(element.tags || {});

				if (members.length > 0 && desc !== null) {
					const rings: UniversalAreaRing[] = [];

					for (const member of members) {
						const memberId = member.ref;
						const memberType = OverpassUniversalFeatureProvider.getUniversalAreaRingType(member);

						if (memberType === null) {
							continue;
						}

						const way = <WayElement>overpassData.elements.find(e => {
							return e.id === memberId && e.type === 'way';
						});

						if (!way) {
							console.error();
							continue;
						}

						const wayNodes = way.nodes.map(nodeId => {
							return nodesMap.get(nodeId);
						});
						rings.push(new UniversalAreaRing(wayNodes, memberType));
					}

					areas.push(new UniversalArea(
						rings,
						desc,
						getElementOSMReference(element)
					));
				}
			}
		}

		const nodes: UniversalNode[] = [];

		for (const node of nodesMap.values()) {
			if (node.description) {
				nodes.push(node);
			}
		}

		return {
			nodes,
			polylines,
			areas
		};
	}

	private async fetchOverpassTile(x: number, y: number): Promise<OverpassDataObject> {
		const url = getRequestURL(x, y);
		const response = await fetch(url, {
			method: 'GET'
		});

		return await response.json() as OverpassDataObject;
	}

	private static getUniversalAreaRingType(member: RelationMember): UniversalAreaRingType | null {
		if (member.role === 'inner') {
			return UniversalAreaRingType.Inner;
		}

		if (member.role === 'outer') {
			return UniversalAreaRingType.Outer;
		}

		return null;
	}
}