import earcut from 'earcut';
import TileSource from "./TileSource";
import AbstractMesh from "~/lib/renderer/abstract-renderer/AbstractMesh";
import WaterMask from "../../objects/WaterMask";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";
import PBFPolygonParser, {PBFPolygon, PBFRing} from "~/lib/tile-processing/vector/providers/pbf/PBFPolygonParser";
import {Tile as proto} from "~/lib/tile-processing/vector/providers/pbf/vector_tile";
import Utils from "~/app/Utils";
import Config from "~/app/Config";

const Pbf = require('pbf');

export default class WaterTileSource extends TileSource<Float32Array> {
	private mask: WaterMask = null;

	public constructor(x: number, y: number, zoom: number) {
		super(x, y, zoom);
	}

	private async fetchTile(x: number, y: number, zoom: number, scale: number): Promise<PBFPolygon[]> {
		const polygons: PBFPolygon[] = [];
		const url = WaterTileSource.getURL(x, y, zoom);
		const response = await fetch(url, {
			method: 'GET'
		});

		if (response.status !== 200) {
			return polygons;
		}

		const pbf = new Pbf(await response.arrayBuffer());
		const obj = proto.read(pbf);

		for (const layer of obj.layers) {
			if (layer.name === 'water') {
				for (const feature of layer.features) {
					const polygon = PBFPolygonParser.convertCommandsToPolygons(feature.geometry, layer.extent, scale);

					polygons.push(polygon);
				}
			}
		}

		return polygons;
	}

	public async load(): Promise<void> {
		const tiles = await this.fetchTile(this.x, this.y, this.zoom, 1);
		const tris = this.polygonsToTriangles(tiles, 0, 0);
		this.data = new Float32Array(tris);
	}

	private polygonsToTriangles(polygons: PBFPolygon[], offsetX: number, offsetY: number): number[] {
		const vertices: number[] = [];

		for (const polygon of polygons) {
			const types: number[] = [];

			for (const ring of polygon) {
				types.push(WaterTileSource.isRingClockwise(ring) ? 0 : 1);
			}

			for (let i = 0; i < types.length; i++) {
				const outer = polygon[i].flat();
				const holeIndices: number[] = [];
				let index = outer.length / 2;

				for (let j = i + 1; j < types.length; j++) {
					if (types[j] === 1) {
						const inner = polygon[j].flat()

						holeIndices.push(index);
						index += inner.length / 2;
						outer.push(...inner);
						++i;
					} else {
						break;
					}
				}

				const triangles = earcut(outer, holeIndices).reverse();

				for (let j = 0; j < triangles.length; j++) {
					vertices.push(
						outer[triangles[j] * 2 + 1] + offsetX,
						outer[triangles[j] * 2] + offsetY
					);
				}
			}
		}

		return vertices;
	}

	public getMesh(renderer: AbstractRenderer): AbstractMesh {
		if (!this.data) {
			throw new Error();
		}

		if (!this.mask) {
			this.mask = new WaterMask(this.data);
			this.mask.updateMesh(renderer);
		}

		return this.mask.mesh;
	}

	private static isRingClockwise(ring: PBFRing): boolean {
		let sum = 0;

		for (let i = 0; i < ring.length; i++) {
			const point1 = ring[i];
			const point2 = ring[i + 1] ?? ring[0];
			sum += (point2[0] - point1[0]) * (point2[1] + point1[1]);
		}

		return sum < 0;
	}

	public delete(): void {
		this.deleted = true;

		if (this.mask) {
			this.mask.delete();
		}
	}

	private static getURL(x: number, y: number, zoom: number): string {
		return Utils.resolveEndpointTemplate({
			template: Config.MapboxStreetsEndpointTemplate,
			values: {
				x: x,
				y: y,
				z: zoom,
				accessToken: Config.MapboxAccessToken
			}
		});
	}
}