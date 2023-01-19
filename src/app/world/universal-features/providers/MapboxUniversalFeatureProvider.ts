import UniversalFeatureProvider from "./UniversalFeatureProvider";
import UniversalFeatureCollection from "../UniversalFeatureCollection";
import UniversalNode from "../UniversalNode";
import UniversalArea, {UniversalAreaRing, UniversalAreaRingType} from "../UniversalArea";
import {UniversalAreaDescription} from "../descriptions";
import PBFPolygonParser, {PBFPolygon} from "./pbf/PBFPolygonParser";
import {OSMReferenceType} from "../UniversalFeature";
import Config from "../../../Config";

const Pbf = require('pbf');
const proto = require('./pbf/vector_tile.js').Tile;

const AreasConfig: Record<'water', {
	description: UniversalAreaDescription;
}> = {
	water: {
		description: {
			type: 'water'
		}
	}
}

const getRequestURL = (x: number, y: number): string => {
	return `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/16/${x}/${y}.vector.pbf?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY5YzJzczA2ejIzM29hNGQ3emFsMXgifQ.az9JUrQP7klCgD3W-ueILQ`;
};

export default class MapboxUniversalFeatureProvider extends UniversalFeatureProvider {
	public async getCollection(
		{
			x,
			y
		}: {
			x: number;
			y: number;
		}
	): Promise<UniversalFeatureCollection> {
		const areas: UniversalArea[] = [];
		const polygons = await this.fetchTile(x, y);

		for (const [name, polygonList] of Object.entries(polygons)) {
			const config = AreasConfig[name as keyof typeof AreasConfig];

			for (const polygon of polygonList) {
				const universalRings: UniversalAreaRing[] = [];

				for (const ring of polygon) {
					const nodes = ring.map((point, i) => {
						return new UniversalNode(
							i,
							point[0],
							point[1],
							{},
							{type: OSMReferenceType.None, id: 0}
						);
					});

					universalRings.push(new UniversalAreaRing(nodes, UniversalAreaRingType.Outer));
				}

				if (universalRings.length > 0) {
					areas.push(new UniversalArea(
						universalRings,
						config.description,
						{type: OSMReferenceType.None, id: 0}
					));
				}
			}
		}

		return {
			nodes: [],
			polylines: [],
			areas
		};
	}

	private async fetchTile(x: number, y: number): Promise<Record<keyof typeof AreasConfig, PBFPolygon[]>> {
		const url = getRequestURL(x, y);
		const response = await fetch(url, {
			method: 'GET'
		});

		const pbf = new Pbf(await response.arrayBuffer());
		const obj = proto.read(pbf);
		const polygons: Record<keyof typeof AreasConfig, PBFPolygon[]> = {
			water: []
		}

		for (const layer of obj.layers) {
			const name = layer.name as keyof typeof AreasConfig;

			if (AreasConfig[name]) {
				for (const feature of layer.features) {
					const polygon = PBFPolygonParser.convertCommandsToPolygons(feature.geometry, Config.TileSize);

					polygons[name].push(polygon);
				}
			}
		}

		return polygons;
	}
}