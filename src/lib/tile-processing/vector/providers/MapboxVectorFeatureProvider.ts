import VectorFeatureCollection from "~/lib/tile-processing/vector/features/VectorFeatureCollection";
import VectorArea from "~/lib/tile-processing/vector/features/VectorArea";
import PBFPolygonParser, {PBFPolygon} from "~/lib/tile-processing/vector/providers/pbf/PBFPolygonParser";
import MapboxAreaHandler from "~/lib/tile-processing/vector/handlers/MapboxAreaHandler";
import Pbf from 'pbf';
import {FeatureProvider} from "~/lib/tile-processing/types";
import VectorNode from "~/lib/tile-processing/vector/features/VectorNode";
import {VectorAreaDescriptor} from "~/lib/tile-processing/vector/descriptors";

const proto = require('./pbf/vector_tile.js').Tile;

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
		const nodes: VectorNode[] = [];
		const polygons = await this.fetchTile(x, y, zoom);

		for (const [name, polygonList] of Object.entries(polygons)) {
			for (const polygon of polygonList) {
				const handler = new MapboxAreaHandler({
					type: name as VectorAreaDescriptor['type']
				});

				for (const ring of polygon) {
					handler.addRing(ring);
				}

				for (const area of handler.getFeatures()) {
					areas.push(area);
				}
			}
		}

		return {
			nodes,
			polylines: [],
			areas
		};
	}

	private async fetchTile(x: number, y: number, zoom: number): Promise<Record<string, PBFPolygon[]>> {
		const size = 40075016.68 / (1 << zoom);
		const polygons: Record<string, PBFPolygon[]> = {
			water: [],
			forest: []
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
			const name = layer.name;
			const keys = layer.keys;
			const values = layer.values;

			if (name === 'water') {
				for (const feature of layer.features) {
					const polygon = PBFPolygonParser.convertCommandsToPolygons(feature.geometry, size);

					polygons['water'].push(polygon);
				}
			}

			if (name === 'landuse') {
				for (const {geometry, tags} of layer.features) {
					const tagsMap: Record<string, string> = {};

					for (let i = 0; i < tags.length; i += 2) {
						const key = keys[tags[i]];
						const value = values[tags[i + 1]];

						tagsMap[key] = value.string_value;
					}

					if (tagsMap.type === 'wood' || tagsMap.type === 'forest') {
						const polygon = PBFPolygonParser.convertCommandsToPolygons(geometry, size);
						polygons['forest'].push(polygon);
					}
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