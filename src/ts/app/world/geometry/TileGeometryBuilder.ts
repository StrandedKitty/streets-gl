import OSMNode from "./features/osm/OSMNode";
import OSMWay from "./features/osm/OSMWay";
import {tile2meters} from "../../../math/Utils";
import Vec2 from "../../../math/Vec2";
import Node3D from "./features/3d/Node3D";
import Way3D from "./features/3d/Way3D";
import HeightViewer from "../HeightViewer";

interface OSMSource {
	nodes: Map<number, OSMNode>,
	ways: Map<number, OSMWay>
}

export default class TileGeometryBuilder {
	private readonly x: number;
	private readonly y: number;
	private readonly pivot: Vec2;
	private heightViewer: HeightViewer;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
		this.pivot = tile2meters(this.x, this.y + 1);
		this.heightViewer = new HeightViewer();
	}

	public process(data: any[]): any {
		const osmSource = this.createOSMFeatures(data);
		const features = this.create3DFeatures(osmSource);

		return features;
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

	private create3DFeatures(osm: OSMSource) {
		const nodes: Map<number, Node3D> = new Map();
		const ways: Map<number, Way3D> = new Map();

		for (const node of osm.nodes.values()) {
			nodes.set(node.id, new Node3D(node.id, node.lat, node.lon, node.descriptor.properties));
		}

		for (const way of osm.ways.values()) {
			const wayNodes: Node3D[] = [];

			for (const node of way.nodes) {
				wayNodes.push(nodes.get(node.id));
			}

			ways.set(way.id, new Way3D(way.id, wayNodes, way.descriptor.properties));
		}

		return {nodes, ways};
	}
}
