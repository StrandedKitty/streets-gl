import OSMNode from "./features/osm/OSMNode";
import OSMWay from "./features/osm/OSMWay";
import MathUtils from "../../../math/MathUtils";
import Vec2 from "../../../math/Vec2";
import Node3D from "./features/3d/Node3D";
import Way3D from "./features/3d/Way3D";
import HeightViewer from "../HeightViewer";
import {GroundGeometryBuffers, StaticTileGeometry} from "../../objects/Tile";
import {RingType} from "./features/3d/Ring3D";
import OSMRelation, {OSMRelationMember} from "./features/osm/OSMRelation";
import * as martinez from 'martinez-polygon-clipping';
import Utils from "../../Utils";
import MeshGroundProjector from "./features/MeshGroundProjector";
import Config from "../../Config";
import Vec3 from "../../../math/Vec3";

interface OSMSource {
	nodes: Map<number, OSMNode>;
	ways: Map<number, OSMWay>;
	relations: Map<number, OSMRelation>;
}

interface Features3D {
	nodes: Map<number, Node3D>;
	ways: Map<number, Way3D>;
}

export default class TileGeometryBuilder {
	private readonly x: number;
	private readonly y: number;
	private readonly pivot: Vec2;
	private readonly heightViewer: HeightViewer;
	private osmFeatures: OSMSource;
	private features: Features3D;

	public constructor(x: number, y: number, heightViewer: HeightViewer) {
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

		const roadPositionArrays: Float32Array[] = [];
		const roadUvArrays: Float32Array[] = [];
		const roadTextureIdArrays: Uint8Array[] = [];

		const joinedWays: Map<number, Way3D[]> = new Map();

		const featuresIDs: number[] = [];
		const featuresTypes: number[] = [];

		const labelPositions: number[] = [];
		const labelPriorities: number[] = [];
		const labelText: string[] = [];

		for (const way of ways.values()) {
			if (way.buildingRelationId !== null) {
				if (!joinedWays.has(way.buildingRelationId)) {
					joinedWays.set(way.buildingRelationId, []);
				}

				joinedWays.get(way.buildingRelationId).push(way);

				continue;
			}

			const {position, color, uv, normal, textureId, positionRoad, uvRoad} = way.getAttributeBuffers();
			const label = way.getLabel();

			if (label) {
				labelPositions.push(label.x, label.y, label.z);
				labelText.push(label.text);
				labelPriorities.push(label.priority);
			}

			if (positionRoad) {
				roadPositionArrays.push(positionRoad);
				roadUvArrays.push(uvRoad);
				roadTextureIdArrays.push(textureId);
			}

			if (position.length === 0) {
				continue;
			}

			positionArrays.push(position);
			colorArrays.push(color);
			uvArrays.push(uv);
			normalArrays.push(normal);
			textureIdArrays.push(textureId);
			localIdArrays.push(Utils.fillTypedArraySequence(
				new Uint32Array(position.length / 3),
				new Uint32Array([localIdArrays.length])
			));

			featuresIDs.push(way.id);
			featuresTypes.push(way.isRelation ? 1 : 0);
		}

		for (const [relationId, wayArray] of joinedWays.entries()) {
			const relationPositionsArrays: Float32Array[] = [];
			const relationColorArrays: Uint8Array[] = [];
			const relationUvArrays: Float32Array[] = [];
			const relationNormalArrays: Float32Array[] = [];
			const relationTextureIdArrays: Uint8Array[] = [];
			const relationLocalIdArrays: Uint32Array[] = [];

			for (const way of wayArray) {
				const {position, color, uv, normal, textureId} = way.getAttributeBuffers();
				const label = way.getLabel();

				if (label) {
					labelPositions.push(label.x, label.y, label.z);
					labelPriorities.push(label.priority);
					labelText.push(label.text);
				}

				relationPositionsArrays.push(position);
				relationColorArrays.push(color);
				relationUvArrays.push(uv);
				relationNormalArrays.push(normal);
				relationTextureIdArrays.push(textureId);
				relationLocalIdArrays.push(Utils.fillTypedArraySequence(
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

		const ground = this.getGroundGeometry();

		const projector = new MeshGroundProjector(this.x, this.y, this.heightViewer, ground.geometry);

		const projectedPositions: Float32Array[] = [];
		const projectedNormals: Float32Array[] = [];
		const projectedUvs: Float32Array[] = [];
		const projectedTextureIds: Uint8Array[] = [];

		for (let ii = 0; ii < roadPositionArrays.length * 2; ii++) {
			const i = ii % roadPositionArrays.length;

			const roadPositions = roadPositionArrays[i];
			const roadUvs = roadUvArrays[i];
			const roadTextureIds = roadTextureIdArrays[i];

			const part = Math.floor(ii / roadPositionArrays.length);

			if (roadTextureIds[0] !== part) {
				continue;
			}

			for (let i = 0, j = 0; i < roadPositions.length; i += 9, j += 6) {
				const projectedMesh = projector.project([
					[roadPositions[i] / Config.TileSize, roadPositions[i + 2] / Config.TileSize],
					[roadPositions[i + 3] / Config.TileSize, roadPositions[i + 5] / Config.TileSize],
					[roadPositions[i + 6] / Config.TileSize, roadPositions[i + 8] / Config.TileSize]
				], {
					uv: [
						[roadUvs[j], roadUvs[j + 1]],
						[roadUvs[j + 2], roadUvs[j + 3]],
						[roadUvs[j + 4], roadUvs[j + 5]]
					],
				});

				projectedPositions.push(projectedMesh.position);
				projectedNormals.push(projectedMesh.normal);
				projectedUvs.push(projectedMesh.attributes.uv);
				projectedTextureIds.push(new Uint8Array(projectedMesh.position.length / 3).fill(roadTextureIds[0]));
			}
		}

		const projectedMeshPosition = Utils.mergeTypedArrays(Float32Array, projectedPositions);
		const projectedMeshNormal = Utils.mergeTypedArrays(Float32Array, projectedNormals);
		const projectedMeshUv = Utils.mergeTypedArrays(Float32Array, projectedUvs);
		const projectedMeshTextureId = Utils.mergeTypedArrays(Uint8Array, projectedTextureIds);

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
			ground: {
				position: ground.geometry.position,
				uv: ground.geometry.uv,
				normal: ground.geometry.normal,
				index: ground.geometry.index
			},
			roads: {
				position: projectedMeshPosition,
				uv: projectedMeshUv,
				normal: projectedMeshNormal,
				textureId: projectedMeshTextureId
			},
			labels: {
				position: labelPositions,
				text: labelText,
				priority: labelPriorities
			},
			bbox,
			bboxGround: ground.bbox
		};
	}

	public static createPlane(x: number, z: number, segmentsX: number, segmentsZ: number): {
		vertices: Float32Array;
		uvs: Float32Array;
		indices: Uint32Array;
	} {
		const vertices: number[] = [];
		const indices: number[] = [];
		const uvs: number[] = [];

		const segmentSize = {
			x: x / segmentsX,
			z: z / segmentsZ
		};

		for (let z = 0; z <= segmentsZ; z++) {
			for (let x = 0; x <= segmentsX; x++) {
				vertices.push(x * segmentSize.x, 0, z * segmentSize.z);
				uvs.push(z / segmentsZ, x / segmentsX);
			}
		}

		for (let z = 0; z < segmentsZ; z++) {
			for (let x = 0; x < segmentsX; x++) {
				const isOdd = (x + z) % 2 === 1;

				const quad = [
					z * (segmentsX + 1) + x,
					z * (segmentsX + 1) + x + 1,
					(z + 1) * (segmentsX + 1) + x,
					(z + 1) * (segmentsX + 1) + x + 1,
				];

				if (isOdd) {
					indices.push(
						quad[1], quad[0], quad[3],
						quad[3], quad[0], quad[2]
					);
				} else {
					indices.push(
						quad[2], quad[1], quad[0],
						quad[3], quad[1], quad[2]
					);
				}
			}
		}

		return {vertices: new Float32Array(vertices), uvs: new Float32Array(uvs), indices: new Uint32Array(indices)};
	}

	public static createPlaneExtruded(x: number, z: number, segmentsX: number, segmentsZ: number): {
		vertices: Float32Array;
		uvs: Float32Array;
		indices: Uint32Array;
		indicesExtruded: Uint32Array;
	} {
		const vertices: number[] = [];
		const indices: number[] = [];
		const indicesExtruded: number[] = [];
		const uvs: number[] = [];

		x += x / segmentsX * 2;
		z += z / segmentsZ * 2;
		segmentsX += 2;
		segmentsZ += 2;

		const segmentSize = {
			x: x / segmentsX,
			z: z / segmentsZ
		};

		for (let z = 0; z <= segmentsZ; z++) {
			for (let x = 0; x <= segmentsX; x++) {
				vertices.push(x * segmentSize.x - segmentSize.x, 0, z * segmentSize.z - segmentSize.z);
				uvs.push((z - 1) / (segmentsZ - 2), (x - 1) / (segmentsX - 2));
			}
		}

		for (let z = 0; z < segmentsZ; z++) {
			for (let x = 0; x < segmentsX; x++) {
				const isOdd = (x + z) % 2 === 1;

				const quad = [
					z * (segmentsX + 1) + x,
					z * (segmentsX + 1) + x + 1,
					(z + 1) * (segmentsX + 1) + x,
					(z + 1) * (segmentsX + 1) + x + 1,
				];

				const isNotExtruded = z > 0 && z < segmentsZ - 1 && x > 0 && x < segmentsX - 1;

				if (isOdd) {
					indicesExtruded.push(
						quad[1], quad[0], quad[3],
						quad[3], quad[0], quad[2]
					);

					if (isNotExtruded) {
						indices.push(
							quad[1], quad[0], quad[3],
							quad[3], quad[0], quad[2]
						);
					}
				} else {
					indicesExtruded.push(
						quad[2], quad[1], quad[0],
						quad[3], quad[1], quad[2]
					);

					if (isNotExtruded) {
						indices.push(
							quad[2], quad[1], quad[0],
							quad[3], quad[1], quad[2]
						);
					}
				}
			}
		}

		return {
			vertices: new Float32Array(vertices),
			uvs: new Float32Array(uvs),
			indices: new Uint32Array(indices),
			indicesExtruded: new Uint32Array(indicesExtruded)
		};
	}

	private getGroundGeometry(): {
		geometry: GroundGeometryBuffers;
		bbox: { min: number[]; max: number[] };
		} {
		const plane = TileGeometryBuilder.createPlaneExtruded(
			Config.TileSize,
			Config.TileSize,
			Config.GroundSegments,
			Config.GroundSegments
		);

		const vertices = plane.vertices;
		const uvs = plane.uvs;

		let maxHeight = -Infinity, minHeight = Infinity;

		for(let i = 0; i < uvs.length / 2; i++) {
			let tileX = this.x;
			let tileY = this.y;
			let u = vertices[i * 3 + 2] / Config.TileSize;
			let v = 1 - vertices[i * 3] / Config.TileSize;

			if (u < 0) {
				tileX -= 1;
				u = 1 + u;
			}
			if (u > 1) {
				tileX += 1;
				u = u - 1;
			}
			if (v < 0) {
				tileY -= 1;
				v = 1 + v;
			}
			if (v > 1) {
				tileY += 1;
				v = v - 1;
			}

			const height = this.heightViewer.getHeight(tileX, tileY, u, v);

			vertices[i * 3 + 1] = height;

			maxHeight = Math.max(maxHeight, height);
			minHeight = Math.min(minHeight, height);
		}

		const normals = this.calculateGroundNormals(vertices, plane.indicesExtruded);

		return {
			geometry: {
				position: plane.vertices,
				uv: plane.uvs,
				normal: normals,
				index: plane.indices,
			},
			bbox: {
				min: [0, minHeight, 0],
				max: [Config.TileSize, maxHeight, Config.TileSize]
			}
		}
	}

	private calculateGroundNormals(vertices: Float32Array, indices: Uint32Array): Float32Array {
		const normalBuffer = new Float32Array(vertices.length);

		const accumulatedNormals: Map<number, Vec3> = new Map();

		const buffer32 = new Float32Array(2);
		const buffer64 = new Float64Array(buffer32.buffer);

		const getVertexKey = (v: Vec2): number => {
			buffer32.set([v.x, v.y]);

			return buffer64[0];
		}

		for(let i = 0; i < indices.length; i += 3) {
			const aIndex = indices[i] * 3;
			const bIndex = indices[i + 1] * 3;
			const cIndex = indices[i + 2] * 3;

			const a = new Vec3(vertices[aIndex], vertices[aIndex + 1], vertices[aIndex + 2]);
			const b = new Vec3(vertices[bIndex], vertices[bIndex + 1], vertices[bIndex + 2]);
			const c = new Vec3(vertices[cIndex], vertices[cIndex + 1], vertices[cIndex + 2]);

			const triangleNormal = Vec3.cross(Vec3.sub(b, a), Vec3.sub(c, a));

			const triangleVertices = [a, b, c];

			for (const vertex of triangleVertices) {
				const key = getVertexKey(vertex.xz);
				const accum = accumulatedNormals.get(key) || new Vec3();
				const newValue = Vec3.add(accum, triangleNormal);

				accumulatedNormals.set(key, newValue);
			}
		}

		for (let i = 0; i < normalBuffer.length; i += 3) {
			const vertexX = vertices[i];
			const vertexZ = vertices[i + 2];

			const normalsSum = accumulatedNormals.get(getVertexKey(new Vec2(vertexX, vertexZ)));

			const normal = Vec3.normalize(normalsSum);

			normalBuffer[i] = normal.x;
			normalBuffer[i + 1] = normal.y;
			normalBuffer[i + 2] = normal.z;
		}

		return normalBuffer;
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
						case 'relation':
							memberFeature = relations.get(member.ref);
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

		const ignoredWays = new Set<number>();
		const buildingRelationsWays = new Map<number, number>();

		for (const relation of osm.relations.values()) {
			if (relation.members.length === 0) {
				continue;
			}

			if (relation.descriptor.properties.layer < 0) {
				continue;
			}

			const relationType: string = relation.descriptor.properties.relationType;

			if (relationType === 'multipolygon') {
				const way3d = new Way3D(relation.id, null, relation.descriptor.properties, this.heightViewer, true);
				ways.set(way3d.id, way3d);

				for (const {feature, role} of relation.members) {
					if (feature instanceof OSMWay) {
						const wayNodes: Node3D[] = [];

						for (const node of feature.nodes) {
							wayNodes.push(nodes.get(node.id));
						}

						if (role === 'inner') {
							way3d.addRing(RingType.Inner, feature.id, wayNodes, feature.descriptor.properties, true);
						} else if (role === 'outer') {
							way3d.addRing(RingType.Outer, feature.id, wayNodes, feature.descriptor.properties, true);
						}

						//ignoredWays.add(feature.id);
					}
				}
			} else if (relationType === 'building') {
				for (const {feature, role} of relation.members) {
					if (feature instanceof OSMWay && role === 'outline') {
						ignoredWays.add(feature.id);
					} else if (role === 'part') {
						buildingRelationsWays.set(feature.id, relation.id);
					}
				}
			}
		}

		for (const way of osm.ways.values()) {
			if (ignoredWays.has(way.id)) {
				continue;
			}

			if (way.descriptor.properties.layer < 0) {
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

		for (const way of ways.values()) {
			way.build();
		}

		this.removeBuildingOutlines(ways, buildingRelationsWays);

		return {nodes, ways} as Features3D;
	}

	private removeBuildingOutlines(ways: Map<number, Way3D>, partsRelations: Map<number, number>): void {
		for (const part of ways.values()) {
			if (!part.tags.buildingPart || part.tags.type === 'none') {
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

				if (partsRelations.get(part.id) !== undefined) {
					continue;
				}

				if (!part.geoJSON) part.updateGeoJSON();
				if (!outline.geoJSON) outline.updateGeoJSON();

				if (part.geoJSON.coordinates.length > 0 && outline.geoJSON.coordinates.length > 0) {
					try {
						const intersection = martinez.intersection(part.geoJSON.coordinates, outline.geoJSON.coordinates);

						if (intersection && intersection.length !== 0 && this.getGaussArea(intersection) > 1) {
							outline.visible = false;
						}
					} catch (e) {
						console.error(`Building-building:part intersection test failed for ${part.id} and ${outline.id}`);
					}
				}
			}
		}
	}

	private getGaussArea(data: martinez.Geometry): number {
		let sum = 0;

		const vertices = data[0][0].slice(0, -1) as martinez.Position[];

		for (let i = 0; i < vertices.length; i++) {
			const point1 = vertices[i];
			const point2 = vertices[i + 1] || vertices[0];
			sum -= (point2[0] - point1[0]) * (point2[1] + point1[1]);
		}

		return sum;
	}

	private getBoundingBoxFromVertices(vertices: TypedArray): { min: number[]; max: number[] } {
		const min = [Infinity, Infinity, Infinity];
		const max = [-Infinity, -Infinity, -Infinity];

		for (let i = 0; i < vertices.length; i += 3) {
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
