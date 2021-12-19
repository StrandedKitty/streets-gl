import Feature3D, {Tags} from "./Feature3D";
import Node3D from "./Node3D";
import earcut from 'earcut';
import HeightViewer from "../../../HeightViewer";
import Ring3D, {RingType} from "./Ring3D";
import MathUtils from "../../../../../math/MathUtils";
import {GeoJSON} from "geojson";
import WayAABB from "./WayAABB";
import Utils from "../../../../Utils";
import Vec2 from "../../../../../math/Vec2";
import {CalcConvexHull, ComputeOMBB, Vector} from "../../../../../math/OMBB";
import SeededRandom from "../../../../../math/SeededRandom";
import Config from "../../../../Config";
import RoadPolylineBuilder from "../../RoadPolylineBuilder";
import SkeletonBuilder, {Skeleton} from "straight-skeleton";
import Vec3 from "../../../../../math/Vec3";

interface EarcutInput {
	vertices: number[];
	holes: number[]
}

enum RoofShape {
	Flat,
	Hipped,
	Gabled
}

export default class Way3D extends Feature3D {
	public vertices: [number, number][];
	public maxGroundHeight: number;
	public minGroundHeight: number;
	public heightViewer: HeightViewer;
	public heightFactor: number;
	private rings: Ring3D[] = [];
	private holesArrays: EarcutInput;
	public geoJSON: GeoJSON.MultiPolygon = null;
	public aabb: WayAABB = new WayAABB();
	public buildingRelationId: number;
	public isRelation: boolean;
	public roofShape: RoofShape;

	constructor(id: number, buildingRelationId: number = null, tags: Tags, heightViewer: HeightViewer, isRelation: boolean) {
		super(id, tags);

		this.buildingRelationId = buildingRelationId;
		this.heightViewer = heightViewer;
		this.isRelation = isRelation;
		this.updateRoofShapeType();
	}

	public addRing(type: RingType, id: number, nodes: Node3D[], tags: Tags) {
		const ring = new Ring3D(id, type, nodes, this, tags);

		this.rings.push(ring);
		this.addRingToAABB(ring);
	}

	private updateHeightFactor() {
		let lat: number = null;

		for (const ring of this.rings) {
			if (ring.nodes.length > 0) {
				lat = ring.nodes[0].lat;
				break;
			}
		}

		this.heightFactor = lat === null ? 1 : MathUtils.mercatorScaleFactor(lat);
	}

	private updateRoofShapeType() {
		let roofType = RoofShape.Flat;

		switch (this.tags.roofShape) {
			case 'hipped':
				roofType = RoofShape.Hipped;
				break;
			case 'gabled':
				roofType = RoofShape.Gabled;
				break;
		}

		this.roofShape = roofType;
	}

	public getAttributeBuffers(): {
		position: Float32Array,
		color: Uint8Array,
		uv: Float32Array,
		normal: Float32Array,
		textureId: Uint8Array,
		positionRoad?: Float32Array,
		uvRoad?: Float32Array
	} {
		if (!this.visible) {
			return {
				position: new Float32Array(),
				color: new Uint8Array(),
				uv: new Float32Array(),
				normal: new Float32Array(),
				textureId: new Uint8Array()
			};
		}

		if (this.tags.type === 'road') {
			const ring = this.rings.find(ring => ring.type === RingType.Outer);

			if (ring) {
				const roadGeometry = RoadPolylineBuilder.build(ring.vertices.map(v => new Vec2(v[0], v[1])), 10);

				return {
					position: new Float32Array(),
					color: new Uint8Array(),
					uv: new Float32Array(),
					normal: new Float32Array(),
					textureId: new Uint8Array(),
					positionRoad: roadGeometry.positions,
					uvRoad: roadGeometry.uvs
				};
			}
		}

		if (this.tags.type !== 'building') {
			return {
				position: new Float32Array(),
				color: new Uint8Array(),
				uv: new Float32Array(),
				normal: new Float32Array(),
				textureId: new Uint8Array()
			};
		}

		this.updateHeightFactor();

		for (const ring of this.rings) {
			ring.updateFootprintHeight();
		}
		this.updateFootprintHeight();

		if (!this.tags.height) {
			this.tags.height = (+this.tags.levels || 1) * 3.5 + this.maxGroundHeight - this.minGroundHeight;
		}

		const positionArrays: Float32Array[] = [];
		const uvArrays: Float32Array[] = [];
		const normalArrays: Float32Array[] = [];
		const textureIdArrays: Uint8Array[] = [];

		const roofBuffers = this.buildRoof();

		positionArrays.push(roofBuffers.position);
		uvArrays.push(roofBuffers.uv);
		normalArrays.push(roofBuffers.normal);
		textureIdArrays.push(Utils.fillTypedArraySequence(
			Uint8Array,
			new Uint8Array(roofBuffers.uv.length / 2),
			new Uint8Array(roofBuffers.isTextured ? [this.id % 4 + 1] : [0])
		));

		for (const ring of this.rings) {
			const ringData = ring.triangulateWalls();
			positionArrays.push(ringData.positions);
			uvArrays.push(ringData.uvs);
			normalArrays.push(ringData.normals);
			textureIdArrays.push(Utils.fillTypedArraySequence(
				Uint8Array,
				new Uint8Array(ringData.uvs.length / 2),
				new Uint8Array([0])
			));
		}

		const positionBuffer = Utils.mergeTypedArrays(Float32Array, positionArrays);
		const uvBuffer = Utils.mergeTypedArrays(Float32Array, uvArrays);
		const normalBuffer = Utils.mergeTypedArrays(Float32Array, normalArrays);
		const textureIdBuffer = Utils.mergeTypedArrays(Uint8Array, textureIdArrays);
		const color = new Uint8Array(<number[]>this.tags.facadeColor || [255, 255, 255]);
		const colorBuffer = Utils.fillTypedArraySequence(
			Uint8Array,
			new Uint8Array(positionBuffer.length),
			color
		);

		return {
			position: positionBuffer,
			color: colorBuffer,
			uv: uvBuffer,
			normal: normalBuffer,
			textureId: textureIdBuffer
		};
	}

	private updateFootprintHeight() {
		let maxHeight = -Infinity;
		let minHeight = Infinity;

		for (const ring of this.rings) {
			minHeight = Math.min(minHeight, ring.minGroundHeight);
			maxHeight = Math.max(maxHeight, ring.maxGroundHeight);
		}

		this.minGroundHeight = minHeight;
		this.maxGroundHeight = maxHeight;
	}

	private getFlattenVerticesForRing(ring: Ring3D): EarcutInput {
		const vertices: number[] = ring.getFlattenVertices().concat(this.holesArrays.vertices);
		const holes: number[] = [];

		for (let i = 0; i < this.holesArrays.holes.length; i++) {
			holes.push(this.holesArrays.holes[i] + ring.vertices.length);
		}

		return {vertices, holes};
	}

	private updateHoles() {
		const data: EarcutInput = {vertices: [], holes: []};

		for (const ring of this.rings) {
			if (ring.type === RingType.Inner) {
				data.holes.push(data.vertices.length / 2);

				data.vertices = data.vertices.concat(ring.getFlattenVertices());
			}
		}

		this.holesArrays = data;
	}

	private triangulateFootprint(): { positions: Float32Array, normals: Float32Array, uvs: Float32Array } {
		const positions: number[] = [];
		const uvs: number[] = [];
		const normals: number[] = [];

		const ombbPoints: number[][] = [];

		this.updateHoles();

		for (const ring of this.rings) {
			if (ring.type === RingType.Outer) {
				const {vertices, holes} = this.getFlattenVerticesForRing(ring);
				const triangles = earcut(vertices, holes).reverse();

				for (let i = 0; i < triangles.length; i++) {
					positions.push(
						vertices[triangles[i] * 2],
						this.minGroundHeight + (+this.tags.height || 6) * this.heightFactor,
						vertices[triangles[i] * 2 + 1]
					);
					uvs.push(vertices[triangles[i] * 2], vertices[triangles[i] * 2 + 1]);
					normals.push(0, 1, 0);
				}

				for (const vertex of ring.vertices) {
					ombbPoints.push(vertex);
				}
			}
		}

		const ombb = this.getOMBBFromPoints(ombbPoints);

		const rotVector0 = Vec2.sub(ombb[1], ombb[0]);
		const rotVector1 = Vec2.sub(ombb[2], ombb[1]);
		const magRot0 = Vec2.getLength(rotVector0);
		const magRot1 = Vec2.getLength(rotVector1);

		let rotVector: Vec2, origin: Vec2, sizeX: number, sizeY: number;

		if (magRot0 > magRot1) {
			rotVector = rotVector0;
			origin = ombb[1];
			sizeX = magRot0;
			sizeY = magRot1;
		} else {
			rotVector = rotVector1;
			origin = ombb[2];
			sizeX = magRot1;
			sizeY = magRot0;
		}

		const rotVectorNormalized = Vec2.normalize(rotVector);
		const angle = -Math.atan2(rotVectorNormalized.y, rotVectorNormalized.x);

		const rand = new SeededRandom(this.id);
		const flipX = rand.generate() > 0.5;
		const flipY = rand.generate() > 0.5;

		for (let i = 0; i < uvs.length; i += 2) {
			uvs[i] -= origin.x;
			uvs[i + 1] -= origin.y;

			const v = Vec2.rotate(new Vec2(uvs[i], uvs[i + 1]), angle);

			uvs[i] = v.x / sizeX + 1;
			uvs[i + 1] = v.y / sizeY;

			if (flipX) {
				uvs[i] = 1 - uvs[i];
			}

			if (flipY) {
				uvs[i + 1] = 1 - uvs[i + 1];
			}
		}

		return {positions: new Float32Array(positions), normals: new Float32Array(normals), uvs: new Float32Array(uvs)};
	}

	private getOMBBFromPoints(points: number[][]): Vec2[] {
		const hullVectors: any[] = [];

		for (const point of points) {
			hullVectors.push(new Vector(point[0], point[1]));
		}

		const hull = CalcConvexHull(hullVectors);
		const ombb = ComputeOMBB(hull);
		const vectors: Vec2[] = [];

		for (let i = 0; i < 4; i++) {
			const vertex = ombb[i] || {x: 0, y: 0};

			vectors.push(new Vec2(vertex.x, vertex.y));
		}

		return vectors;
	}

	public updateGeoJSON() {
		const json: GeoJSON.MultiPolygon = {
			type: "MultiPolygon",
			coordinates: []
		};

		const inners: Ring3D[] = [];

		for (const ring of this.rings) {
			if (ring.type === RingType.Inner && ring.closed) {
				inners.push(ring);
			}
		}

		for (const ring of this.rings) {
			if (ring.type === RingType.Outer && ring.closed) {
				const item: [number, number][][] = [ring.vertices];

				for (let j = 0; j < inners.length; j++) {
					item.push(inners[j].vertices);
				}

				json.coordinates.push(item);
			}
		}

		this.geoJSON = json;
	}

	public addRingToAABB(ring: Ring3D) {
		for (let i = 0; i < ring.vertices.length; i++) {
			this.aabb.addPoint(ring.vertices[i][0], ring.vertices[i][1]);
		}
	}

	private getTotalArea(): number {
		let area = 0;

		for (const ring of this.rings) {
			let ringArea = ring.getArea();

			if (ring.type === RingType.Inner) {
				ringArea *= -1;
			}

			area += ringArea;
		}

		return area;
	}

	private buildStraightSkeleton(): Skeleton {
		const outer = this.rings.find(ring => ring.type === RingType.Outer);

		if (!outer) {
			return null;
		}

		const inners = this.rings.filter(ring => ring.type === RingType.Inner).map(ring => ring.vertices.slice(0, -1));

		let skeleton = null;

		try {
			skeleton = SkeletonBuilder.BuildFromGeoJSON([[
				outer.vertices.slice(0, -1),
				...inners
			]]);
		} catch (e) {

		}

		return skeleton;
	}

	private buildRoof(): { position: Float32Array, normal: Float32Array, uv: Float32Array, isTextured: boolean } {
		switch (this.roofShape) {
			case RoofShape.Flat: {
				const footprint = this.triangulateFootprint();
				const isFootprintTextured = this.getTotalArea() > Config.MinTexturedRoofArea && this.aabb.getArea() < Config.MaxTexturedRoofAABBArea;

				return {
					position: footprint.positions,
					normal: footprint.normals,
					uv: footprint.uvs,
					isTextured: isFootprintTextured
				};
			}
			case RoofShape.Hipped: {
				const skeleton = this.buildStraightSkeleton();

				if (!skeleton) {
					this.roofShape = RoofShape.Flat;
					return this.buildRoof();
				}

				const heightMap: Map<string, number> = new Map();
				const minHeight = this.minGroundHeight + (+this.tags.height || 6) * this.heightFactor;

				for (const [point, distance] of skeleton.Distances.entries()) {
					heightMap.set(`${point.X} ${point.Y}`, distance);
				}

				const vertices: number[] = [];

				for (const edge of skeleton.Edges) {
					for (let i = 2; i < edge.Polygon.length; i++) {
						vertices.push(
							edge.Polygon[0].X, 0, edge.Polygon[0].Y,
							edge.Polygon[i].X, 0, edge.Polygon[i].Y,
							edge.Polygon[i - 1].X, 0, edge.Polygon[i - 1].Y
						);
					}
				}

				for (let i = 0; i < vertices.length; i += 3) {
					const x = vertices[i];
					const z = vertices[i + 2];
					const y = heightMap.get(`${x} ${z}`);

					vertices[i + 1] = +y * 0.5 * this.heightFactor + minHeight;
				}

				const normals = new Float32Array(vertices.length);

				for (let i = 0; i < vertices.length; i += 9) {
					const a = new Vec3(vertices[i], vertices[i + 1], vertices[i + 2]);
					const b = new Vec3(vertices[i + 3], vertices[i + 4], vertices[i + 5]);
					const c = new Vec3(vertices[i + 6], vertices[i + 7], vertices[i + 8]);

					const normal: [number, number, number] = Vec3.toArray(MathUtils.calculateNormal(a, b, c));

					for (let j = i; j < i + 9; j++) {
						normals[j] = normal[j % 3];
					}
				}

				return {
					position: new Float32Array(vertices),
					normal: normals,
					uv: new Float32Array(vertices.length / 3 * 2),
					isTextured: false
				};
			}
			case RoofShape.Gabled: {
				const skeleton = this.buildStraightSkeleton();

				if (!skeleton) {
					this.roofShape = RoofShape.Flat;
					return this.buildRoof();
				}

				const heightMap: Map<string, number> = new Map();
				const minHeight = this.minGroundHeight + (+this.tags.height || 6) * this.heightFactor;

				for (const [point, distance] of skeleton.Distances.entries()) {
					heightMap.set(`${point.X} ${point.Y}`, distance);
				}

				const vertices: number[] = [];

				for (const edge of skeleton.Edges) {
					if (edge.Polygon.length === 3) {
						const a = edge.Edge.Begin;
						const b = edge.Edge.End;
						const c = edge.Polygon.find(p => p.NotEquals(a) && p.NotEquals(b));
						const cHeight = heightMap.get(`${c.X} ${c.Y}`);

						const diff = b.Sub(a);
						const center = a.Add(diff.MultiplyScalar(0.5));

						heightMap.set(`${center.X} ${center.Y}`, cHeight);

						vertices.push(
							a.X, 0, a.Y,
							c.X, 0, c.Y,
							center.X, 0, center.Y,

							b.X, 0, b.Y,
							center.X, 0, center.Y,
							c.X, 0, c.Y,

							a.X, 0, a.Y,
							center.X, cHeight, center.Y,
							b.X, 0, b.Y
						);

						continue;
					}

					for (let i = 2; i < edge.Polygon.length; i++) {
						vertices.push(
							edge.Polygon[0].X, 0, edge.Polygon[0].Y,
							edge.Polygon[i].X, 0, edge.Polygon[i].Y,
							edge.Polygon[i - 1].X, 0, edge.Polygon[i - 1].Y
						);
					}
				}

				for (let i = 0; i < vertices.length; i += 3) {
					const x = vertices[i];
					const z = vertices[i + 2];
					const y = vertices[i + 1] || heightMap.get(`${x} ${z}`);

					vertices[i + 1] = +y * this.heightFactor + minHeight;
				}

				const normals = new Float32Array(vertices.length);

				for (let i = 0; i < vertices.length; i += 9) {
					const a = new Vec3(vertices[i], vertices[i + 1], vertices[i + 2]);
					const b = new Vec3(vertices[i + 3], vertices[i + 4], vertices[i + 5]);
					const c = new Vec3(vertices[i + 6], vertices[i + 7], vertices[i + 8]);

					const normal: [number, number, number] = Vec3.toArray(MathUtils.calculateNormal(a, b, c));

					for (let j = i; j < i + 9; j++) {
						normals[j] = normal[j % 3];
					}
				}

				return {
					position: new Float32Array(vertices),
					normal: normals,
					uv: new Float32Array(vertices.length / 3 * 2),
					isTextured: false
				};
			}
		}

		return {
			position: new Float32Array(),
			normal: new Float32Array(),
			uv: new Float32Array(),
			isTextured: false
		};
	}
}