import PBFPolygonParser, {PBFPolygon, PBFRing} from "~/app/world/universal-features/providers/pbf/PBFPolygonParser";
import {Tile as proto} from "~/app/world/universal-features/providers/pbf/vector_tile";
import earcut from 'earcut';
import Vec2 from "~/math/Vec2";
import TileSource from "~/app/world/terrain/TileSource";
import AbstractMesh from "~/renderer/abstract-renderer/AbstractMesh";
import {RendererTypes} from "~/renderer/RendererTypes";
import WaterMask from "~/app/objects/WaterMask";
import AbstractRenderer from "~/renderer/abstract-renderer/AbstractRenderer";

const Pbf = require('pbf');

const HalfTileOffsets = [
	new Vec2(0, 0),
	new Vec2(0, 1),
	new Vec2(1, 0),
	new Vec2(1, 1)
];

export default class WaterTileSource extends TileSource<Float32Array> {
	private mesh: AbstractMesh = null;

	public constructor(x: number, y: number, zoom: number) {
		super(x, y, zoom);
		this.load();
	}

	private async fetchTile(x: number, y: number, zoom: number, scale: number): Promise<PBFPolygon[]> {
		const url = WaterTileSource.getURL(x, y, zoom);
		const response = await fetch(url, {
			method: 'GET'
		});

		const pbf = new Pbf(await response.arrayBuffer());
		const obj = proto.read(pbf);
		const polygons: PBFPolygon[] = [];

		for (const layer of obj.layers) {
			if (layer.name === 'water') {
				for (const feature of layer.features) {
					const polygon = PBFPolygonParser.convertCommandsToPolygons(feature.geometry, scale);

					polygons.push(polygon);
				}
			}
		}

		return polygons;
	}

	private async load(): Promise<void> {
		/*const nextZoom = Config.TerrainHeightMapTileZoom + 1;
		const nextZoomX = this.x * 2;
		const nextZoomY = this.y * 2;

		const tiles = await Promise.all(
			HalfTileOffsets.map(offset => {
				return this.fetchTile(nextZoomX + offset.x, nextZoomY + offset.y, nextZoom, 0.5);
			})
		);

		if (this.deleted) {
			return;
		}

		let combinedVertices: number[] = [];

		for (let i = 0; i < tiles.length; i++) {
			const tris = this.polygonsToTriangles(tiles[i], 0.5 - HalfTileOffsets[i].y * 0.5, HalfTileOffsets[i].x * 0.5);

			combinedVertices = combinedVertices.concat(tris)
		}

		this.vertices = new Float32Array(combinedVertices);*/

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

		if (!this.mesh) {
			const waterMask = new WaterMask(this.data);
			waterMask.updateMesh(renderer);
			this.mesh = waterMask.mesh;
		}

		return this.mesh;
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
	}

	private static getURL(x: number, y: number, zoom: number): string {
		return `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/${zoom}/${x}/${y}.vector.pbf?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY5YzJzczA2ejIzM29hNGQ3emFsMXgifQ.az9JUrQP7klCgD3W-ueILQ`;
	}
}