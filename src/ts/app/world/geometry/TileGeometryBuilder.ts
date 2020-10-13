import OSMNode from "./features/osm/OSMNode";
import OSMWay from "./features/osm/OSMWay";
import {tile2meters} from "../../../math/Utils";
import Vec2 from "../../../math/Vec2";
import Node3D from "./features/3d/Node3D";
import Way3D from "./features/3d/Way3D";
import HeightViewer from "../HeightViewer";
import {StaticTileGeometry} from "../../objects/Tile";
import Config from "../../Config";

interface OSMSource {
	nodes: Map<number, OSMNode>,
	ways: Map<number, OSMWay>
}

interface Features3D {
	nodes: Map<number, Node3D>,
	ways: Map<number, Way3D>
}

export default class TileGeometryBuilder {
	private readonly x: number;
	private readonly y: number;
	private readonly pivot: Vec2;
	private heightViewer: HeightViewer;
	private osmFeatures: OSMSource;
	private features: Features3D;

	constructor(x: number, y: number, heightViewer: HeightViewer) {
		this.x = x;
		this.y = y;
		this.pivot = tile2meters(this.x, this.y + 1);
		this.heightViewer = heightViewer;
	}

	public getCoveredTiles(data: any[]): Vec2[] {
		this.osmFeatures = this.createOSMFeatures(data);
		this.features = this.create3DFeatures(this.osmFeatures);

		const tilesList = new Map<string, Vec2>();

		for (const node of this.features.nodes.values()) {
			const tile = new Vec2(Math.floor(node.tile.x), Math.floor(node.tile.y));

			tilesList.set(`${tile.x},${tile.y}`, tile);
		}

		return Array.from(tilesList.values());
	}

	public async getTileGeometry(): Promise<StaticTileGeometry> {
		const {nodes, ways} = this.features;

		const arrays = [];
		for (const way of ways.values()) {
			arrays.push(way.getVertices());
		}

		const vertices = TileGeometryBuilder.mergeTypedArrays(Float32Array, arrays);

		return {
			buildings: {
				position: vertices,
				uv: new Float32Array(vertices.length / 3 * 2)
			}
		};
	}

	private createOSMFeatures(data: any[]): OSMSource {
		const nodes: Map<number, OSMNode> = new Map();
		const ways: Map<number, OSMWay> = new Map();

		for (const feature of data) {
			if (feature.type === 'node') {
				nodes.set(feature.id, new OSMNode(feature.id, feature.lat, feature.lon, feature.tags));
			}
		}

		for (const feature of data) {
			if (feature.type === 'way') {
				const nodesArray: OSMNode[] = [];

				for (const nodeId of feature.nodes) {
					nodesArray.push(nodes.get(nodeId));
				}

				ways.set(feature.id, new OSMWay(feature.id, nodesArray, feature.tags));
			}
		}

		return {nodes, ways} as OSMSource;
	}

	private create3DFeatures(osm: OSMSource): Features3D {
		const nodes: Map<number, Node3D> = new Map();
		const ways: Map<number, Way3D> = new Map();

		for (const node of osm.nodes.values()) {
			nodes.set(node.id, new Node3D(node.id, node.lat, node.lon, node.descriptor.properties, this.x, this.y));
		}

		for (const way of osm.ways.values()) {
			const wayNodes: Node3D[] = [];

			for (const node of way.nodes) {
				wayNodes.push(nodes.get(node.id));
			}

			ways.set(way.id, new Way3D(way.id, wayNodes, way.descriptor.properties, this.heightViewer));
		}

		return {nodes, ways} as Features3D;
	}

	static mergeTypedArrays<T extends TypedArray>(type: { new(l: number): T }, typedArrays: T[]): T {
		if (typedArrays.length > 0) {
			let length = 0;

			for (let i = 0; i < typedArrays.length; i++) {
				length += typedArrays[i].length;
			}

			const array = new type(length);

			let currentLength = 0;

			for (let i = 0; i < typedArrays.length; i++) {
				array.set(typedArrays[i], currentLength);
				currentLength += typedArrays[i].length;
			}

			return array;
		}

		return new type(0);
	}
}
