import UniversalFeatureProvider from "~/app/world/universal-features/providers/UniversalFeatureProvider";
import UniversalFeatureCollection from "~/app/world/universal-features/UniversalFeatureCollection";
import Config from "~/app/Config";
import MathUtils from "~/math/MathUtils";
import OverpassDataObject, {WayElement} from "~/app/world/universal-features/providers/OverpassDataObject";
import UniversalNode from "~/app/world/universal-features/UniversalNode";
import Vec2 from "~/math/Vec2";
import UniversalArea, {UniversalAreaRing} from "~/app/world/universal-features/UniversalArea";
import UniversalPolyline from "~/app/world/universal-features/UniversalPolyline";
import {
	UniversalAreaDescription,
	UniversalNodeDescription,
	UniversalPolylineDescription
} from "~/app/world/universal-features/descriptions";
import HeightViewer from "~/app/world/HeightViewer";
import {GroundGeometryData} from "~/app/world/universal-features/providers/GroundGeometryBuilder";

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

const getNodeDescriptionFromTags = (tags: Record<string, string>): UniversalNodeDescription => {
	return tags;
}

const getPolylineDescriptionFromTags = (tags: Record<string, string>): UniversalPolylineDescription => {
	return tags;
}

const getAreaDescriptionFromTags = (tags: Record<string, string>): UniversalAreaDescription => {
	return tags;
}

export default class OverpassUniversalFeatureProvider extends UniversalFeatureProvider {
	public async getCollection(
		{
			x,
			y,
			heightViewer,
			groundData
		}: {
			x: number;
			y: number;
			heightViewer: HeightViewer;
			groundData: GroundGeometryData;
		}
	): Promise<UniversalFeatureCollection> {
		const tileOrigin = MathUtils.tile2meters(x, y + 1);
		const overpassData = await this.fetchOverpassTile(x, y);
		const nodes: Map<number, UniversalNode> = new Map();
		const polylines: Map<number, UniversalPolyline> = new Map();
		const areas: Map<number, UniversalArea> = new Map();

		for (const element of overpassData.elements) {
			if (element.type === 'node') {
				const position = Vec2.sub(MathUtils.degrees2meters(element.lat, element.lon), tileOrigin);
				const node = new UniversalNode(element.id, position.x, position.y, getNodeDescriptionFromTags(element.tags || {}));

				nodes.set(element.id, node);
			}
		}

		for (const element of overpassData.elements) {
			if (element.type === 'way') {
				const polylineNodes = element.nodes.map(nodeId => {
					return nodes.get(nodeId);
				});
				const isArea = isWayElementArea(element);

				if (isArea) {
					const ring = new UniversalAreaRing(polylineNodes);
					const feature = new UniversalArea([ring], getAreaDescriptionFromTags(element.tags || {}));
					areas.set(element.id, feature);
				} else {
					const feature = new UniversalPolyline(polylineNodes, getPolylineDescriptionFromTags(element.tags || {}));
					polylines.set(element.id, feature);
				}
			}

			if (element.type === 'relation' && element.tags && element.tags.type === 'multipolygon') {
				const wayMembers = element.members.filter(member => member.type === 'way');
			}
		}

		//console.log(nodes, polylines, areas)

		return {nodes, polylines, areas};
	}

	private async fetchOverpassTile(x: number, y: number): Promise<OverpassDataObject> {
		const url = getRequestURL(x, y);
		const response = await fetch(url, {
			method: 'GET'
		});

		return await response.json() as OverpassDataObject;
	}
}