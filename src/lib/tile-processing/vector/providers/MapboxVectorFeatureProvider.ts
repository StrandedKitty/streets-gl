import VectorFeatureCollection from "~/lib/tile-processing/vector/features/VectorFeatureCollection";
import VectorArea from "~/lib/tile-processing/vector/features/VectorArea";
import PBFPolygonParser, {PBFPolygon} from "~/lib/tile-processing/vector/providers/pbf/PBFPolygonParser";
import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/descriptors";
import MapboxAreaHandler from "~/lib/tile-processing/vector/handlers/MapboxAreaHandler";
import Pbf from 'pbf';
import {FeatureProvider} from "~/lib/tile-processing/types";

const proto = require('./pbf/vector_tile.js').Tile;

const AreasConfig: Record<'water', {
	descriptor: VectorAreaDescriptor;
}> = {
	water: {
		descriptor: {
			type: 'water'
		}
	}
}

export default class MapboxVectorFeatureProvider implements FeatureProvider<VectorFeatureCollection> {
	private readonly endpointTemplate: string;
	private readonly accessToken: string;

	public constructor(endpointTemplate: string, accessToken: string) {
		this.endpointTemplate = endpointTemplate;
		this.accessToken = accessToken;
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
		const areas: VectorArea[] = [];
		const polygons = await this.fetchTile(x, y, zoom);

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

	private async fetchTile(x: number, y: number, zoom: number): Promise<Record<keyof typeof AreasConfig, PBFPolygon[]>> {
		const size = 40075016.68 / (1 << zoom);
		const polygons: Record<keyof typeof AreasConfig, PBFPolygon[]> = {
			water: []
		};
		const url = this.buildRequestURL(x, y, zoom);
		const response = await fetch(url, {
			method: 'GET'
		});

		if (response.status !== 200) {
			const error = await response.text();
			throw new Error(error);
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

	private buildRequestURL(x: number, y: number, zoom: number): string {
		return this.endpointTemplate
			.replace('{x}', x.toString())
			.replace('{y}', y.toString())
			.replace('{z}', zoom.toString())
			.replace('{access_token}', this.accessToken);
	}
}