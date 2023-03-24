import VectorFeatureProvider from "~/lib/tile-processing/vector/providers/VectorFeatureProvider";
import VectorFeatureCollection from "~/lib/tile-processing/vector/features/VectorFeatureCollection";
import VectorArea from "~/lib/tile-processing/vector/features/VectorArea";
import PBFPolygonParser, {PBFPolygon} from "~/lib/tile-processing/vector/providers/pbf/PBFPolygonParser";
import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/descriptors";
import MapboxAreaHandler from "~/lib/tile-processing/vector/handlers/MapboxAreaHandler";
import Pbf from 'pbf';

const proto = require('./pbf/vector_tile.js').Tile;

const AccessToken = 'pk.eyJ1Ijoidmhhd2siLCJhIjoiY2xmbWpqOXBoMGNmZDN2cjJwZXk0MXBzZiJ9.192VNPJG0VV9dGOCOX1gUw';

const getRequestURL = (x: number, y: number, zoom: number): string => {
	return `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/${zoom}/${x}/${y}.vector.pbf?access_token=${AccessToken}`;
};

const AreasConfig: Record<'water', {
	descriptor: VectorAreaDescriptor;
}> = {
	water: {
		descriptor: {
			type: 'water'
		}
	}
}

export default class MapboxVectorFeatureProvider extends VectorFeatureProvider {
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
		const areas: VectorArea[] = [];
		const polygons = await MapboxVectorFeatureProvider.fetchTile(x, y, zoom);

		for (const [name, polygonList] of Object.entries(polygons)) {
			const config = AreasConfig[name as keyof typeof AreasConfig];

			for (const polygon of polygonList) {
				const handler = new MapboxAreaHandler(config.descriptor);

				for (const ring of polygon) {
					handler.addRing(ring);
				}

				for (const area of handler.getFeatures()) {
					areas.push(area);
				}
			}
		}

		return {
			nodes: [],
			polylines: [],
			areas
		};
	}

	private static async fetchTile(x: number, y: number, zoom: number): Promise<Record<keyof typeof AreasConfig, PBFPolygon[]>> {
		const size = 40075016.68 / (1 << zoom);
		const polygons: Record<keyof typeof AreasConfig, PBFPolygon[]> = {
			water: []
		};
		const response = await fetch(getRequestURL(x, y, zoom), {
			method: 'GET'
		});

		if (response.status !== 200) {
			return polygons;
		}

		const pbf = new Pbf(await response.arrayBuffer());
		const obj = proto.read(pbf);

		for (const layer of obj.layers) {
			const name = layer.name as keyof typeof AreasConfig;

			if (AreasConfig[name]) {
				for (const feature of layer.features) {
					const polygon = PBFPolygonParser.convertCommandsToPolygons(feature.geometry, size);

					polygons[name].push(polygon);
				}
			}
		}

		return polygons;
	}
}