import OSMNode from "./features/osm/OSMNode";
import OSMWay from "./features/osm/OSMWay";
import MathUtils from "../../../math/MathUtils";
import Vec2 from "../../../math/Vec2";
import Node3D from "./features/3d/Node3D";
import Way3D from "./features/3d/Way3D";
import HeightViewer from "../HeightViewer";
import {StaticTileGeometry} from "../../objects/Tile";
import {RingType} from "./features/3d/Ring3D";
import OSMRelation, {OSMRelationMember} from "./features/osm/OSMRelation";
import * as martinez from 'martinez-polygon-clipping';
import Utils from "../../Utils";

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
		this.pivot = MathUtils.tile2meters(this.x, this.y + 1);
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
		const {ways} = this.features;

		const positionArrays: Float32Array[] = [];
		const colorArrays: Uint8Array[] = [];
		const uvArrays: Float32Array[] = [];
		const normalArrays: Float32Array[] = [];
		const textureIdArrays: Uint8Array[] = [];
		const localIdArrays: Uint32Array[] = [];

		const joinedWays: Map<number, Way3D[]> = new Map();

		const featuresIDs: number[] = [];
		const featuresTypes: number[] = [];

		for (const way of ways.values()) {
			if(way.buildingRelationId !== null) {
				if(!joinedWays.has(way.buildingRelationId)) {
					joinedWays.set(way.buildingRelationId, []);
				}

				joinedWays.get(way.buildingRelationId).push(way);

				continue;
			}

			const {position, color, uv, normal, textureId} = way.getAttributeBuffers();

			if (position.length === 0) {
				continue;
			}

			positionArrays.push(position);
			colorArrays.push(color);
			uvArrays.push(uv);
			normalArrays.push(normal);
			textureIdArrays.push(textureId);
			localIdArrays.push(Utils.fillTypedArraySequence(
				Uint32Array,
				new Uint32Array(position.length / 3),
				new Uint32Array([localIdArrays.length])
			));

			featuresIDs.push(way.id);
			featuresTypes.push(way.isRelation ? 1 : 0);
		}

		for(const [relationId, wayArray] of joinedWays.entries()) {
			const relationPositionsArrays: Float32Array[] = [];
			const relationColorArrays: Uint8Array[] = [];
			const relationUvArrays: Float32Array[] = [];
			const relationNormalArrays: Float32Array[] = [];
			const relationTextureIdArrays: Uint8Array[] = [];
			const relationLocalIdArrays: Uint32Array[] = [];

			for(const way of wayArray) {
				const {position, color, uv, normal, textureId} = way.getAttributeBuffers();

				relationPositionsArrays.push(position);
				relationColorArrays.push(color);
				relationUvArrays.push(uv);
				relationNormalArrays.push(normal);
				relationTextureIdArrays.push(textureId);
				relationLocalIdArrays.push(Utils.fillTypedArraySequence(
					Uint32Array,
					new Uint32Array(position.length / 3),
					new Uint32Array([localIdArrays.length])
				));
			}

			positionArrays.push(
				Utils.mergeTypedArrays(Float32Array, relationPositionsArrays)
			);
			colorArrays.push(
				Utils.mergeTypedArrays(Uint8Array, relationColorArrays)
			);
			uvArrays.push(
				Utils.mergeTypedArrays(Float32Array, relationUvArrays)
			);
			normalArrays.push(
				Utils.mergeTypedArrays(Float32Array, relationNormalArrays)
			);
			textureIdArrays.push(
				Utils.mergeTypedArrays(Uint8Array, relationTextureIdArrays)
			);
			localIdArrays.push(
				Utils.mergeTypedArrays(Uint32Array, relationLocalIdArrays)
			);

			featuresIDs.push(relationId);
			featuresTypes.push(1);
		}

		const offsets: Uint32Array = new Uint32Array(featuresIDs.length);
		const ids: Uint32Array = new Uint32Array(featuresIDs.length * 2);
		let lastOffset = 0;

		for (let i = 0; i < featuresIDs.length; i++) {
			ids[i * 2] = Math.min(featuresIDs[i], 0xffffffff);
			ids[i * 2 + 1] = MathUtils.shiftLeft(featuresTypes[i], 19) + MathUtils.shiftRight(featuresTypes[i], 32);

			offsets[i] = lastOffset;
			lastOffset += positionArrays[i].length / 3;
		}

		const positionBuffer = Utils.mergeTypedArrays(Float32Array, positionArrays);
		const colorBuffer = Utils.mergeTypedArrays(Uint8Array, colorArrays);
		const uvBuffer = Utils.mergeTypedArrays(Float32Array, uvArrays);
		const normalBuffer = Utils.mergeTypedArrays(Float32Array, normalArrays);
		const textureIdBuffer = Utils.mergeTypedArrays(Uint8Array, textureIdArrays);
		const localIdBuffer = Utils.mergeTypedArrays(Uint32Array, localIdArrays);
		const bbox = this.getBoundingBoxFromVertices(positionBuffer);

		return {
			buildings: {
				position: positionBuffer,
				uv: uvBuffer,
				normal: normalBuffer,
				textureId: textureIdBuffer,
				color: colorBuffer,
				id: ids,
				offset: offsets,
				localId: localIdBuffer
			},
			bbox
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

		const processedWays = new Set<number>();
		const buildingRelationsWays = new Map<number, number>();

		for(const relation of osm.relations.values()) {
			if(relation.members.length === 0) {
				continue;
			}

			if(relation.descriptor.properties.layer < 0) {
				continue;
			}

			const relationType: string = relation.descriptor.properties.relationType;

			if(relationType === 'multipolygon') {
				const way3d = new Way3D(relation.id, null, relation.descriptor.properties, this.heightViewer, true);
				ways.set(way3d.id, way3d);

				for(const {feature, role} of relation.members) {
					if(feature instanceof OSMWay) {
						const wayNodes: Node3D[] = [];

						for (const node of feature.nodes) {
							wayNodes.push(nodes.get(node.id));
						}

						if(role === 'inner') {
							way3d.addRing(RingType.Inner, feature.id, wayNodes, feature.descriptor.properties);
						} else if(role === 'outer') {
							way3d.addRing(RingType.Outer, feature.id, wayNodes, feature.descriptor.properties);
						}

						//processedWays.add(feature.id);
					}
				}
			} else if(relationType === 'building') {
				for(const {feature, role} of relation.members) {
					if(feature instanceof OSMWay && role === 'outline') {
						processedWays.add(feature.id);
					} else if (role === 'part') {
						buildingRelationsWays.set(feature.id, relation.id);
					}
				}
			}
		}

		for (const way of osm.ways.values()) {
			if(processedWays.has(way.id)) {
				continue;
			}

			if(way.descriptor.properties.layer < 0) {
				continue;
			}

			const wayNodes: Node3D[] = [];

			for (const node of way.nodes) {
				wayNodes.push(nodes.get(node.id));
			}

			const way3d = new Way3D(
				way.id,
				buildingRelationsWays.get(way.id),
				way.descriptor.properties,
				this.heightViewer,
				false
			);

			way3d.addRing(RingType.Outer, way.id, wayNodes, way.descriptor.properties);
			ways.set(way3d.id, way3d);
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

	private getBoundingBoxFromVertices(vertices: TypedArray): {min: number[], max: number[]} {
		const min = [Infinity, Infinity, Infinity];
		const max = [-Infinity, -Infinity, -Infinity];

		for(let i = 0; i < vertices.length; i += 3) {
			min[0] = Math.min(min[0], vertices[i]);
			min[1] = Math.min(min[1], vertices[i + 1]);
			min[2] = Math.min(min[2], vertices[i + 2]);

			max[0] = Math.max(max[0], vertices[i]);
			max[1] = Math.max(max[1], vertices[i + 1]);
			max[2] = Math.max(max[2], vertices[i + 2]);
		}

		return {min, max};
	}
}
