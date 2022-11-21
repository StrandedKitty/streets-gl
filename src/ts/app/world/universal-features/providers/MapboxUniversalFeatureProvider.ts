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
import PBFPolygonParser, {PBFPolygon} from "~/app/world/universal-features/providers/PBFPolygonParser";
import MeshGroundProjector from "~/app/world/geometry/features/MeshGroundProjector";
import {GroundGeometryData} from "~/app/world/universal-features/providers/GroundGeometryBuilder";
import HeightViewer from "~/app/world/HeightViewer";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Pbf = require('pbf');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const proto = require('./vector_tile.js').Tile;

enum UVMode {
	OMBB,
	TileCoordinates
}

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
		const areas: Map<number, UniversalArea> = new Map();
		const polygons = await this.fetchTile(x, y);

		for (const [name, polygonList] of Object.entries(polygons)) {
			const config = AreasConfig[name as keyof typeof AreasConfig];

			for (const polygon of polygonList) {
				const universalRings: UniversalAreaRing[] = [];

				for (const ring of polygon) {
					const nodes = ring.map((point, i) => {
						return new UniversalNode(i, point[0], point[1], {});
					});

					universalRings.push(new UniversalAreaRing(nodes));
				}

				if (universalRings.length > 0) {
					const area = new UniversalArea(universalRings, config.description);
					areas.set(areas.size, area);
				}
			}
		}

		return {
			nodes: new Map(),
			polylines: new Map(),
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
					const polygon = PBFPolygonParser.convertCommandsToPolygons(feature.geometry);

					polygons[name].push(polygon);
				}
			}
		}

		return polygons;
	}
}