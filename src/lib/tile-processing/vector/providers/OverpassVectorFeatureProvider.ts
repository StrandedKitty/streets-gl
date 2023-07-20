import MathUtils from "~/lib/math/MathUtils";
import OverpassDataObject, {NodeElement, RelationElement, RelationMember, WayElement} from "./OverpassDataObject";
import VectorFeatureProvider from "~/lib/tile-processing/vector/providers/VectorFeatureProvider";
import VectorFeatureCollection from "~/lib/tile-processing/vector/features/VectorFeatureCollection";
import Vec2 from "~/lib/math/Vec2";
import OSMNodeHandler from "~/lib/tile-processing/vector/handlers/OSMNodeHandler";
import OSMWayHandler from "~/lib/tile-processing/vector/handlers/OSMWayHandler";
import OSMRelationHandler from "~/lib/tile-processing/vector/handlers/OSMRelationHandler";
import VectorBuildingOutlinesCleaner from "~/lib/tile-processing/vector/VectorBuildingOutlinesCleaner";
import {VectorFeature} from "~/lib/tile-processing/vector/features/VectorFeature";
import OSMHandler from "~/lib/tile-processing/vector/handlers/OSMHandler";
import {getCollectionFromVectorFeatures} from "~/lib/tile-processing/vector/utils";

const TileRequestMargin = 0.05;

const getRequestBody = (x: number, y: number, zoom: number): string => {
	const position = [
		MathUtils.tile2degrees(x - TileRequestMargin, y + 1 + TileRequestMargin, zoom),
		MathUtils.tile2degrees(x + 1 + TileRequestMargin, y - TileRequestMargin, zoom)
	];
	const bbox = position[0].lat + ',' + position[0].lon + ',' + position[1].lat + ',' + position[1].lon;
	return `
		[out:json][timeout:30];
		(
			node(${bbox});
			way(${bbox});
			rel["type"~"^(multipolygon|building)"](${bbox});
			//rel["type"="building"](br); // this is SLOW
			
			// Make sure that we have all parts of each building in the result
			(
				relation["building"](${bbox});
				>;
				way["building"](${bbox});
			) ->.buildingOutlines;
			way["building:part"](area.buildingOutlines);
			
			// Make sure that each powerline node knows about all the powerline segments it is connected to
			//way[power=line](${bbox})->.powerline;
			//way(around.powerline:0)[power=line];
		);
		
		out body qt;
		>>;
		out body qt;
	`;
};

export default class OverpassVectorFeatureProvider extends VectorFeatureProvider {
	public constructor(private readonly overpassURL: string) {
		super();
	}

	public async getCollection(
		{
			x,
			y,
			zoom
		}: {
			x: number;
			y: number;
			zoom: number;
		}
	): Promise<VectorFeatureCollection> {
		const tileOrigin = MathUtils.tile2meters(x, y + 1, zoom);
		const overpassData = await OverpassVectorFeatureProvider.fetchOverpassTile(x, y, zoom, this.overpassURL);

		const nodeHandlersMap: Map<number, OSMNodeHandler> = new Map();
		const wayHandlersMap: Map<number, OSMWayHandler> = new Map();
		const relationHandlersMap: Map<number, OSMRelationHandler> = new Map();

		const elements = OverpassVectorFeatureProvider.classifyElements(overpassData.elements);

		for (const element of elements.nodes) {
			const position = Vec2.sub(MathUtils.degrees2meters(element.lat, element.lon), tileOrigin);
			const handler = new OSMNodeHandler(
				element,
				position.x,
				position.y
			);

			nodeHandlersMap.set(element.id, handler);
		}

		for (const element of elements.ways) {
			const nodes = element.nodes.map(nodeId => {
				return nodeHandlersMap.get(nodeId);
			});

			const handler = new OSMWayHandler(
				element,
				nodes
			);

			wayHandlersMap.set(element.id, handler);
		}

		const osmMembersMap: Map<OSMRelationHandler, RelationMember[]> = new Map();

		for (const element of elements.relations) {
			const members = element.members.filter(member => member.type === 'way' || member.type === 'relation');

			if (members.length === 0) {
				continue;
			}

			const handler = new OSMRelationHandler(
				element
			);

			relationHandlersMap.set(element.id, handler);
			osmMembersMap.set(handler, members);
		}

		for (const relation of relationHandlersMap.values()) {
			const members = osmMembersMap.get(relation);

			for (const member of members) {
				const memberId = member.ref;
				let handler: OSMWayHandler | OSMRelationHandler;

				switch (member.type) {
					case 'way':
						handler = wayHandlersMap.get(memberId);
						break;
					case 'relation':
						handler = relationHandlersMap.get(memberId);
						break;
				}

				if (!handler) {
					console.error();
					continue;
				}

				relation.addMember(member, handler);
			}
		}

		const features = OverpassVectorFeatureProvider.getFeaturesFromHandlers([
			...nodeHandlersMap.values(),
			...wayHandlersMap.values(),
			...relationHandlersMap.values()
		]);
		const collection = getCollectionFromVectorFeatures(features);

		collection.areas = new VectorBuildingOutlinesCleaner().deleteBuildingOutlines(collection.areas);

		return collection;
	}

	private static getFeaturesFromHandlers(handlers: OSMHandler[]): VectorFeature[] {
		const features: VectorFeature[] = [];

		for (const handler of handlers) {
			features.push(...handler.getFeatures());
		}

		return features;
	}

	private static async fetchOverpassTile(
		x: number,
		y: number,
		zoom: number,
		overpassURL: string
	): Promise<OverpassDataObject> {
		const response = await fetch(overpassURL, {
			method: 'POST',
			body: getRequestBody(x, y, zoom)
		});
		return await response.json() as OverpassDataObject;
	}

	private static classifyElements(elements: (NodeElement | WayElement | RelationElement)[]): {
		nodes: NodeElement[];
		ways: WayElement[];
		relations: RelationElement[];
	} {
		const nodes: NodeElement[] = [];
		const ways: WayElement[] = [];
		const relations: RelationElement[] = [];

		for (const el of elements) {
			switch (el.type) {
				case 'node':
					nodes.push(el);
					break;
				case 'way':
					ways.push(el);
					break;
				case 'relation':
					relations.push(el);
					break;
			}
		}

		return {nodes, ways, relations};
	}
}
