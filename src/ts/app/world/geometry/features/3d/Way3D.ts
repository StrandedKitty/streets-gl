import Feature3D, {Tags} from "./Feature3D";
import Node3D from "./Node3D";
import earcut from 'earcut';
import HeightViewer from "../../../HeightViewer";
import Ring3D, {RingType} from "./Ring3D";
import MathUtils from "../../../../../math/MathUtils";
import {GeoJSON} from "geojson";
import WayAABB from "./WayAABB";
import Utils from "../../../../Utils";
import TileGeometryBuilder from "../../TileGeometryBuilder";
import Vec2 from "../../../../../math/Vec2";
import {CalcConvexHull, ComputeOMBB, Vector} from "../../../../../math/OMBB";
import SeededRandom from "../../../../../math/SeededRandom";

interface EarcutInput {
	vertices: number[];
	holes: number[]
}

export default class Way3D extends Feature3D {
	public buildingRelationId: number;
	public vertices: [number, number][];
	public maxGroundHeight: number;
	public minGroundHeight: number;
	public heightViewer: HeightViewer;
	public heightFactor: number;
	private rings: Ring3D[] = [];
	private holesArrays: EarcutInput;
	public geoJSON: GeoJSON.MultiPolygon = null;
	public aabb: WayAABB = new WayAABB();

	constructor(id: number, buildingRelationId: number = null, tags: Tags, heightViewer: HeightViewer) {
		super(id, tags);

		this.buildingRelationId = buildingRelationId;
		this.heightViewer = heightViewer;
	}

	public addRing(type: RingType, id: number, nodes: Node3D[], tags: Tags) {
		const ring = new Ring3D(id, type, nodes, this, tags);

		this.rings.push(ring);
		this.addRingToAABB(ring);
	}

	private updateHeightFactor() {
		let lat: number = null;

		for(const ring of this.rings) {
			if(ring.nodes.length > 0) {
				lat = ring.nodes[0].lat;
				break;
			}
		}

		this.heightFactor = lat === null ? 1 : MathUtils.mercatorScaleFactor(lat);
	}

	public getAttributeBuffers(): {position: Float32Array, color: Uint8Array, uv: Float32Array, textureId: Uint8Array} {
		if (!this.visible || this.tags.type !== 'building') {
			return {
				position: new Float32Array(),
				color: new Uint8Array(),
				uv: new Float32Array(),
				textureId: new Uint8Array()
			};
		}

		this.updateHeightFactor();

		for(const ring of this.rings) {
			ring.updateFootprintHeight();
		}
		this.updateFootprintHeight();

		if(!this.tags.height) {
			this.tags.height = (+this.tags.levels || 1) * 3.5 + this.maxGroundHeight - this.minGroundHeight;
		}

		const positionArrays: Float32Array[] = [];
		const uvArrays: Float32Array[] = [];
		const textureIdArrays: Uint8Array[] = [];

		const footprint = this.triangulateFootprint();
		positionArrays.push(footprint.positions);
		uvArrays.push(footprint.uvs);
		textureIdArrays.push(Utils.fillTypedArraySequence(
			Uint8Array,
			new Uint8Array(footprint.uvs.length / 2),
			new Uint8Array([this.id % 4 + 1])
		));

		for(const ring of this.rings) {
			const ringData = ring.triangulateWalls();
			positionArrays.push(ringData.positions);
			uvArrays.push(ringData.uvs);
			textureIdArrays.push(Utils.fillTypedArraySequence(
				Uint8Array,
				new Uint8Array(ringData.uvs.length / 2),
				new Uint8Array([0])
			));
		}

		const positionBuffer = Utils.mergeTypedArrays(Float32Array, positionArrays);
		const uvBuffer = Utils.mergeTypedArrays(Float32Array, uvArrays);
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

		for(let i = 0; i < this.holesArrays.holes.length; i++) {
			holes.push(this.holesArrays.holes[i] + ring.vertices.length);
		}

		return {vertices, holes};
	}

	private updateHoles() {
		const data: EarcutInput = {vertices: [], holes: []};

		for(const ring of this.rings) {
			if(ring.type === RingType.Inner) {
				data.holes.push(data.vertices.length / 2);

				data.vertices = data.vertices.concat(ring.getFlattenVertices());
			}
		}

		this.holesArrays = data;
	}

	private triangulateFootprint(): {positions: Float32Array, uvs: Float32Array} {
		const positions: number[] = [];
		const uvs: number[] = [];

		const ombbPoints: number[][] = [];

		this.updateHoles();

		for(const ring of this.rings) {
			if(ring.type === RingType.Outer) {
				const {vertices, holes} = this.getFlattenVerticesForRing(ring);
				const triangles = earcut(vertices, holes).reverse();

				for (let i = 0; i < triangles.length; i++) {
					positions.push(
						vertices[triangles[i] * 2],
						this.minGroundHeight + (+this.tags.height || 6) * this.heightFactor,
						vertices[triangles[i] * 2 + 1]
					);
					uvs.push(vertices[triangles[i] * 2], vertices[triangles[i] * 2 + 1]);
				}

				for(const vertex of ring.vertices) {
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

		if(magRot0 > magRot1) {
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

		for(let i = 0; i < uvs.length; i += 2) {
			uvs[i] -= origin.x;
			uvs[i + 1] -= origin.y;

			const v = Vec2.rotate(new Vec2(uvs[i], uvs[i + 1]), angle);

			uvs[i] = v.x / sizeX + 1;
			uvs[i + 1] = v.y / sizeY;

			if(flipX) {
				uvs[i] = 1 - uvs[i];
			}

			if(flipY) {
				uvs[i + 1] = 1 - uvs[i + 1];
			}
		}

		return {positions: new Float32Array(positions), uvs: new Float32Array(uvs)};
	}

	private getOMBBFromPoints(points: number[][]): Vec2[] {
		const hullVectors: any[] = [];

		for(const point of points) {
			hullVectors.push(new Vector(point[0], point[1]));
		}

		const hull = CalcConvexHull(hullVectors);
		const ombb = ComputeOMBB(hull);
		const vectors: Vec2[] = [];

		for(let i = 0; i < 4; i++) {
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

		for(const ring of this.rings) {
			if(ring.type === RingType.Inner && ring.closed) {
				inners.push(ring);
			}
		}

		for(const ring of this.rings) {
			if(ring.type === RingType.Outer && ring.closed) {
				const item: [number, number][][] = [ring.vertices];

				for(let j = 0; j < inners.length; j++) {
					item.push(inners[j].vertices);
				}

				json.coordinates.push(item);
			}
		}

		this.geoJSON = json;
	}

	public addRingToAABB(ring: Ring3D) {
		for(let i = 0; i < ring.vertices.length; i++) {
			this.aabb.addPoint(ring.vertices[i][0], ring.vertices[i][1]);
		}
	}
}