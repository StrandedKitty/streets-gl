import OSMNode from "./features/osm/OSMNode";
import OSMWay from "./features/osm/OSMWay";
import {tile2meters} from "../../../math/Utils";
import Vec2 from "../../../math/Vec2";
import Node3D from "./features/3d/Node3D";
import Way3D from "./features/3d/Way3D";
import HeightViewer from "../HeightViewer";
import {StaticTileGeometry} from "../../objects/Tile";
import {RingType} from "./features/3d/Ring3D";
import OSMRelation, {OSMRelationMember} from "./features/osm/OSMRelation";
import * as martinez from 'martinez-polygon-clipping';

interface OSMSource {
	nodes: Map<number, OSMNode>,
	ways: Map<number, OSMWay>,
	relations: Map<number, OSMRelation>
}

interface Features3D {
	nodes: Map<number, Node3D>,
	ways: Map<number, Way3D>
}

export default class TileGeometryBuilder {
	private readonly x: number;
	private readonly y: number;
	private readonly pivot: Vec2;
	private readonly heightViewer: HeightViewer;
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

		const arrays: Float32Array[] = [];
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
		const relations: Map<number, OSMRelation> = new Map();

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

		for (const feature of data) {
			if (feature.type === 'relation') {
				const members: OSMRelationMember[] = [];

				for (const member of feature.members) {
					let memberFeature = null;

					switch (member.type) {
						case 'node':
							memberFeature = nodes.get(member.ref);
							break;
						case 'way':
							memberFeature = ways.get(member.ref);
							break;
					}

					if (memberFeature) {
						members.push({
							feature: memberFeature,
							role: member.role
						} as OSMRelationMember);
					}
				}

				relations.set(feature.id, new OSMRelation(feature.id, members, feature.tags));
			}
		}

		return {nodes, ways, relations} as OSMSource;
	}

	private create3DFeatures(osm: OSMSource): Features3D {
		const nodes: Map<number, Node3D> = new Map();
		const ways: Map<number, Way3D> = new Map();

		for (const node of osm.nodes.values()) {
			nodes.set(node.id, new Node3D(node.id, node.lat, node.lon, node.descriptor.properties, this.x, this.y));
		}

		const usedWays = new Set<number>();

		for(const relation of osm.relations.values()) {
			if(relation.members.length === 0) {
				continue;
			}

			const relationType: string = relation.descriptor.properties.relationType;

			if(relationType === 'multipolygon') {
				const way3d = new Way3D(relation.id, relation.descriptor.properties, this.heightViewer);
				ways.set(way3d.id, way3d);

				for(const {feature, role} of relation.members) {
					if(feature instanceof OSMWay) {
						const wayNodes: Node3D[] = [];

						for (const node of feature.nodes) {
							wayNodes.push(nodes.get(node.id));
						}

						way3d.addRing(role === 'inner' ? RingType.Inner : RingType.Outer, feature.id, wayNodes, feature.descriptor.properties);

						usedWays.add(feature.id);
					}
				}
			} else if(relationType === 'building') {
				for(const {feature, role} of relation.members) {
					if(feature instanceof OSMWay && role === 'outline') {
						usedWays.add(feature.id);
					}
				}
			}
		}

		for (const way of osm.ways.values()) {
			if(usedWays.has(way.id)) {
				continue;
			}

			const wayNodes: Node3D[] = [];

			for (const node of way.nodes) {
				wayNodes.push(nodes.get(node.id));
			}

			const way3d = new Way3D(way.id, way.descriptor.properties, this.heightViewer);
			ways.set(way3d.id, way3d);

			way3d.addRing(RingType.Outer, way.id, wayNodes, way.descriptor.properties);
		}

		this.removeBuildingOutlines(ways);

		return {nodes, ways} as Features3D;
	}

	private removeBuildingOutlines(ways: Map<number, Way3D>) {
		for (const part of ways.values()) {
			if (!part.tags.buildingPart) {
				continue;
			}

			for (const outline of ways.values()) {
				if (
					outline.tags.buildingPart ||
					outline.tags.type !== 'building' ||
					!outline.aabb.intersectsAABB(part.aabb)
				) {
					continue;
				}

				if(!part.geoJSON) part.updateGeoJSON();
				if(!outline.geoJSON) outline.updateGeoJSON();

				if(part.geoJSON.coordinates.length > 0 && outline.geoJSON.coordinates.length > 0) {
					try {
						const intersection = martinez.intersection(part.geoJSON.coordinates, outline.geoJSON.coordinates);

						if(intersection && intersection.length > 0) {
							outline.visible = false;
						}
					} catch (e) {
						console.error(`Building-building:part intersection test failed for ${part.id} and ${outline.id}`);
					}
				}
			}
		}
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
