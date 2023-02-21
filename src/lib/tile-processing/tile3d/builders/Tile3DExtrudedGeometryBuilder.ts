import Tile3DExtrudedGeometry from "~/lib/tile-processing/tile3d/features/Tile3DExtrudedGeometry";
import AABB3D from "~/lib/math/AABB3D";
import MathUtils from "~/lib/math/MathUtils";
import OSMReference, {OSMReferenceType} from "~/lib/tile-processing/vector/features/OSMReference";
import Vec2 from "~/lib/math/Vec2";
import Vec3 from "~/lib/math/Vec3";
import earcut from "earcut";
import * as OMBB from "~/lib/math/OMBB";
import {min} from "d3";
import Utils from "~/app/Utils";

export enum RoofType {
	Flat,
	Gabled,
	Hipped,
	Pyramidal,
	Dome,
	Skillion
}

export enum RingType {
	Outer,
	Inner
}

interface EarcutInput {
	vertices: number[];
	holes: number[];
}

function colorToComponents(color: number): [number, number, number] {
	return [
		color >> 16,
		color >> 8 & 0xff,
		color & 0xff
	];
}

export class Ring {
	public readonly type: RingType;
	public readonly nodes: Vec2[];

	private cachedFlattenVertices: number[] = null;

	public constructor(type: RingType, nodes: Vec2[]) {
		this.type = type;
		this.nodes = nodes;
	}

	public getFlattenVertices(): number[] {
		if (!this.cachedFlattenVertices) {
			const vertices: number[] = [];

			for (const node of this.nodes) {
				vertices.push(node.x, node.y);
			}

			this.cachedFlattenVertices = vertices;
		}

		return this.cachedFlattenVertices;
	}
}

export default class Tile3DExtrudedGeometryBuilder {
	private readonly osmReference: OSMReference;
	private readonly arrays: {
		position: number[];
		uv: number[];
		normal: number[];
		textureId: number[];
		color: number[];
	} = {
		position: [],
		uv: [],
		normal: [],
		textureId: [],
		color: []
	};
	private readonly rings: Ring[] = [];
	private readonly boundingBox: AABB3D = new AABB3D(new Vec3(), new Vec3());
	private smoothingThreshold: number = Infinity;

	public constructor(osmReference: OSMReference) {
		this.arrays = {
			position: [],
			uv: [],
			normal: [],
			textureId: [],
			color: []
		};

		this.osmReference = osmReference;
	}

	public addRing(type: RingType, nodes: Vec2[]): void {
		this.rings.push(new Ring(type, nodes));
	}

	public setSmoothingThreshold(value: number): void {
		this.smoothingThreshold = value;
	}

	public addWalls(
		{
			minHeight,
			height,
			color,
			textureId
		}: {
			minHeight: number;
			height: number | ((vertex: Vec2) => number);
			color: number;
			textureId: number;
		}
	): void {

	}

	public addRoof(
		{
			type,
			minHeight,
			height,
			color,
			textureId
		}: {
			type: RoofType;
			minHeight: number;
			height: number;
			color: number;
			textureId: number;
		}
	): void {
		switch (type) {
			default: {
				this.addFootprint({
					height: minHeight,
					color: color,
					textureId: textureId,
					flip: false
				});
				break;
			}
		}
	}

	public addFootprint(
		{
			height,
			color,
			textureId,
			flip
		}: {
			height: number;
			color: number;
			textureId: number;
			flip: boolean;
		}
	): void {
		const colorComponents = colorToComponents(color);
		const normalY = flip ? -1 : 1;

		for (const ring of this.rings) {
			if (ring.type !== RingType.Outer) {
				continue;
			}

			const {vertices, holes} = this.getRingEarcutInput(
				ring,
				this.rings.filter(ring => ring.type === RingType.Inner)
			);
			const triangles = earcut(vertices, holes).reverse();

			for (let i = 0; i < triangles.length; i++) {
				this.arrays.position.push(
					vertices[triangles[i] * 2],
					height,
					vertices[triangles[i] * 2 + 1]
				);
				this.arrays.uv.push(vertices[triangles[i] * 2], vertices[triangles[i] * 2 + 1]);
				this.arrays.normal.push(0, normalY, 0);
				this.arrays.color.push(...colorComponents);
				this.arrays.textureId.push(textureId);
			}
		}
	}

	private getRingEarcutInput(outerRing: Ring, innerRings: Ring[]): EarcutInput {
		let vertices: number[] = [...outerRing.getFlattenVertices()];
		const holes: number[] = [];

		for (const inner of innerRings) {
			holes.push(vertices.length / 2);
			vertices = vertices.concat(inner.getFlattenVertices());
		}

		return {vertices, holes};
	}

	private getPolygonOMBB(vertices: Vec2[]): [Vec2, Vec2, Vec2, Vec2] {
		const vectors: OMBB.Vector[] = vertices.map(v => new OMBB.Vector(v.x, v.y));
		const convexHull = OMBB.CalcConvexHull(vectors);
		const ombb = OMBB.ComputeOMBB(convexHull);

		return [
			new Vec2(ombb[0].x, ombb[0].y),
			new Vec2(ombb[1].x, ombb[1].y),
			new Vec2(ombb[2].x, ombb[2].y),
			new Vec2(ombb[3].x, ombb[3].y)
		];
	}

	private getIDBuffer(): Uint32Array {
		const idBuffer = new Uint32Array(2);
		const osmType = this.osmReference.type;
		const osmId = this.osmReference.id;

		if (osmType === OSMReferenceType.Way || osmType === OSMReferenceType.Relation) {
			const typeInt = osmType === OSMReferenceType.Way ? 0 : 1;

			idBuffer[0] = Math.min(osmId, 0xffffffff);
			idBuffer[1] = MathUtils.shiftLeft(typeInt, 19) + MathUtils.shiftRight(typeInt, 32);
		}

		return idBuffer;
	}

	public getGeometry(): Tile3DExtrudedGeometry {
		const vertexCount = this.arrays.position.length / 3;

		return {
			type: 'extruded',
			boundingBox: this.boundingBox,
			positionBuffer: new Float32Array(this.arrays.position),
			normalBuffer: new Float32Array(this.arrays.normal),
			uvBuffer: new Float32Array(this.arrays.uv),
			textureIdBuffer: new Uint8Array(this.arrays.textureId),
			colorBuffer: new Uint8Array(this.arrays.color),
			idBuffer: this.getIDBuffer()
		};
	}
}