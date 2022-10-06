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
import Vec3 from "../../../../../math/Vec3";
import StraightSkeletonBuilder from "../../StraightSkeletonBuilder";
import {RoofGeometry} from "~/app/world/geometry/roofs/RoofBuilder";
import FlatRoofBuilder from "~/app/world/geometry/roofs/FlatRoofBuilder";
import HippedRoofBuilder from "~/app/world/geometry/roofs/HippedRoofBuilder";
import GabledRoofBuilder from "~/app/world/geometry/roofs/GabledRoofBuilder";
import PyramidalRoofBuilder from "~/app/world/geometry/roofs/PyramidalRoofBuilder";
import polylabel from "polylabel";

interface EarcutInput {
	vertices: number[];
	holes: number[];
}

enum RoofShape {
	Flat,
	Hipped,
	Gabled,
	Pyramidal
}

export default class Way3D extends Feature3D {
	public vertices: [number, number][];
	public maxGroundHeight: number;
	public minGroundHeight: number;
	public heightViewer: HeightViewer;
	public heightFactor: number;
	public rings: Ring3D[] = [];
	private holesArrays: EarcutInput;
	public geoJSON: GeoJSON.MultiPolygon = null;
	public aabb: WayAABB = new WayAABB();
	public buildingRelationId: number;
	public isRelation: boolean;
	public roofShape: RoofShape;

	public constructor(id: number, buildingRelationId: number = null, tags: Tags, heightViewer: HeightViewer, isRelation: boolean) {
		super(id, tags);

		this.buildingRelationId = buildingRelationId;
		this.heightViewer = heightViewer;
		this.isRelation = isRelation;
		this.updateRoofShapeType();
	}

	public addRing(type: RingType, id: number, nodes: Node3D[], tags: Tags, canMerge = false): void {
		const ring = new Ring3D(id, type, nodes, this, tags);

		this.rings.push(ring);

		if (canMerge) {
			const firstNode = nodes[0];
			const lastNode = nodes[nodes.length - 1];

			if (!firstNode.posEquals(lastNode)) {
				ring.isMergeable = true;
			}
		}
	}

	public build(): void {
		for (const ring of this.rings) {
			if (ring.deleted) {
				continue;
			}

			for (const otherRing of this.rings) {
				if (otherRing.deleted) {
					continue;
				}

				const isMerged = ring.tryMerge(otherRing);

				if (isMerged) {
					otherRing.deleted = true;
				}
			}
		}

		this.rings = this.rings.filter(ring => ring.deleted === false);

		for (const ring of this.rings) {
			ring.build();
			this.addRingToAABB(ring);
		}
	}

	private updateHeightFactor(): void {
		let lat: number = null;

		for (const ring of this.rings) {
			if (ring.nodes.length > 0) {
				lat = ring.nodes[0].lat;
				break;
			}
		}

		this.heightFactor = lat === null ? 1 : MathUtils.mercatorScaleFactor(lat);
	}

	private updateRoofShapeType(): void {
		let roofType = RoofShape.Flat;

		switch (this.tags.roofShape) {
			case 'hipped':
				roofType = RoofShape.Hipped;
				break;
			case 'gabled':
				roofType = RoofShape.Gabled;
				break;
			case 'pyramidal':
				roofType = RoofShape.Pyramidal;
				break;
		}

		this.roofShape = roofType;
	}

	private getRoadWidth(): number {
		if (this.tags.width) {
			return +this.tags.width;
		}

		if (this.tags.roadType === 'sidewalk') {
			return 4;
		}

		if (this.tags.roadLanes || this.tags.roadLanesForward || this.tags.roadLanesBackward) {
			let totalLanes;

			if (!isNaN(+this.tags.roadLanes)) {
				totalLanes = +this.tags.roadLanes;
			} else {
				const forward = +this.tags.roadLanesForward || 0;
				const backward = +this.tags.roadLanesBackward || 0;

				totalLanes = forward + backward;
			}

			if (totalLanes === 1) {
				return 6;
			}

			return totalLanes * 3.7;
		}

		return 7;
	}

	public getAttributeBuffers(): {
		position: Float32Array;
		color: Uint8Array;
		uv: Float32Array;
		normal: Float32Array;
		textureId: Uint8Array;
		positionRoad?: Float32Array;
		uvRoad?: Float32Array;
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

		if (this.tags.type === 'road' && !this.tags.isArea) {
			const ring = this.rings.find(ring => ring.type === RingType.Outer);

			if (ring) {
				const roadWidth = this.getRoadWidth();
				const roadGeometry = RoadPolylineBuilder.build(ring.vertices.map(v => new Vec2(v[0], v[1])), roadWidth);
				const textureId = this.tags.roadType === 'sidewalk' ? 0 : 1;

				return {
					position: new Float32Array(),
					color: new Uint8Array(),
					uv: new Float32Array(),
					normal: new Float32Array(),
					textureId: new Uint8Array(roadGeometry.positions.length / 3).fill(textureId),
					positionRoad: roadGeometry.positions,
					uvRoad: roadGeometry.uvs
				};
			}
		}

		if (this.tags.type === 'road' && this.tags.isArea) {
			const footprint = this.triangulateFootprint();
			const textureId = this.tags.roadType === 'sidewalk' ? 0 : 1;

			return {
				position: new Float32Array(),
				color: new Uint8Array(),
				uv: new Float32Array(),
				normal: new Float32Array(),
				textureId: new Uint8Array(footprint.positions.length / 3).fill(textureId),
				positionRoad: footprint.positions,
				uvRoad: footprint.uvs
			};
		}

		if (this.tags.type === 'parking') {
			const footprint = this.triangulateFootprint();
			const textureId = 1;

			return {
				position: new Float32Array(),
				color: new Uint8Array(),
				uv: new Float32Array(),
				normal: new Float32Array(),
				textureId: new Uint8Array(footprint.positions.length / 3).fill(textureId),
				positionRoad: footprint.positions,
				uvRoad: footprint.uvs
			};
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
		const colorArrays: Uint8Array[] = [];

		const roofBuffers = this.buildRoof();

		positionArrays.push(roofBuffers.position);
		uvArrays.push(roofBuffers.uv);
		normalArrays.push(roofBuffers.normal);
		textureIdArrays.push(roofBuffers.textureId);
		colorArrays.push(Utils.fillTypedArraySequence(
			new Uint8Array(roofBuffers.uv.length / 2 * 3),
			new Uint8Array(<number[]>this.tags.roofColor || [255, 255, 255])
		));

		for (const ring of this.rings) {
			const ringData = ring.triangulateWalls();
			positionArrays.push(ringData.positions);
			uvArrays.push(ringData.uvs);
			normalArrays.push(ringData.normals);
			textureIdArrays.push(Utils.fillTypedArraySequence(
				new Uint8Array(ringData.uvs.length / 2),
				new Uint8Array([0])
			));
			colorArrays.push(Utils.fillTypedArraySequence(
				new Uint8Array(ringData.uvs.length / 2 * 3),
				new Uint8Array(<number[]>this.tags.facadeColor || [255, 255, 255])
			));
		}

		const positionBuffer = Utils.mergeTypedArrays(Float32Array, positionArrays);
		const uvBuffer = Utils.mergeTypedArrays(Float32Array, uvArrays);
		const normalBuffer = Utils.mergeTypedArrays(Float32Array, normalArrays);
		const textureIdBuffer = Utils.mergeTypedArrays(Uint8Array, textureIdArrays);
		const colorBuffer = Utils.mergeTypedArrays(Uint8Array, colorArrays);

		return {
			position: positionBuffer,
			color: colorBuffer,
			uv: uvBuffer,
			normal: normalBuffer,
			textureId: textureIdBuffer
		};
	}

	public getLabel(): {x: number; y: number; z: number; text: string; priority: number} {
		if (!this.visible || this.tags.type !== 'building' || !this.tags.name) {
			return null;
		}

		const polygon = this.rings.map(r => r.vertices);
		const center = polylabel(polygon, 1) as [number, number];
		const minHeight = this.minGroundHeight + (+this.tags.height || 6) * this.heightFactor;
		let name = this.tags.name.toString().trim();

		if (name.length > 60) {
			name = name.slice(0, 60).trim() + '...';
		}

		return {
			x: center[0],
			y: minHeight + 10,
			z: center[1],
			priority: this.getTotalArea(),
			text: name
		};
	}

	private updateFootprintHeight(): void {
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

	private updateHoles(): void {
		const data: EarcutInput = {vertices: [], holes: []};

		for (const ring of this.rings) {
			if (ring.type === RingType.Inner) {
				data.holes.push(data.vertices.length / 2);

				data.vertices = data.vertices.concat(ring.getFlattenVertices());
			}
		}

		this.holesArrays = data;
	}

	public triangulateFootprint(): {positions: Float32Array; normals: Float32Array; uvs: Float32Array} {
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

	public updateGeoJSON(): void {
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

	public addRingToAABB(ring: Ring3D): void {
		for (let i = 0; i < ring.vertices.length; i++) {
			this.aabb.addPoint(ring.vertices[i][0], ring.vertices[i][1]);
		}
	}

	public getTotalArea(): number {
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

	private buildRoof(): RoofGeometry {
		switch (this.roofShape) {
			case RoofShape.Flat: {
				return FlatRoofBuilder.build(this);
			}
			case RoofShape.Hipped: {
				const roof = HippedRoofBuilder.build(this);

				if (!roof) {
					this.roofShape = RoofShape.Flat;
					return this.buildRoof();
				}

				return roof;
			}
			case RoofShape.Gabled: {
				const roof = GabledRoofBuilder.build(this);

				if (!roof) {
					this.roofShape = RoofShape.Flat;
					return this.buildRoof();
				}

				return roof;
			}
			case RoofShape.Pyramidal: {
				return PyramidalRoofBuilder.build(this);
			}
		}

		throw new Error('Unknown roof type');
	}
}