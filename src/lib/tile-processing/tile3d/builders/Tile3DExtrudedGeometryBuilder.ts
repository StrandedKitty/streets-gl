import Tile3DExtrudedGeometry from "~/lib/tile-processing/tile3d/features/Tile3DExtrudedGeometry";
import AABB3D from "~/lib/math/AABB3D";
import MathUtils from "~/lib/math/MathUtils";
import OSMReference, {OSMReferenceType} from "~/lib/tile-processing/vector/features/OSMReference";
import Vec2 from "~/lib/math/Vec2";
import Vec3 from "~/lib/math/Vec3";
import Tile3DRing, {Tile3DRingType} from "~/lib/tile-processing/tile3d/builders/Tile3DRing";
import {colorToComponents} from "~/lib/tile-processing/tile3d/builders/utils";
import Tile3DMultipolygon from "~/lib/tile-processing/tile3d/builders/Tile3DMultipolygon";
import FlatRoofBuilder from "~/lib/tile-processing/tile3d/builders/roofs/FlatRoofBuilder";
import SkillionRoofBuilder from "~/lib/tile-processing/tile3d/builders/roofs/SkillionRoofBuilder";
import RoofBuilder from "~/lib/tile-processing/tile3d/builders/roofs/RoofBuilder";
import PyramidalRoofBuilder from "~/lib/tile-processing/tile3d/builders/roofs/PyramidalRoofBuilder";

export enum RoofType {
	Flat,
	Gabled,
	Hipped,
	Pyramidal,
	Dome,
	Skillion
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
	private readonly rings: Tile3DRing[] = [];
	private readonly multipolygon: Tile3DMultipolygon = new Tile3DMultipolygon();
	private readonly boundingBox: AABB3D = new AABB3D(new Vec3(), new Vec3());
	private smoothingThreshold: number = Infinity;

	public constructor(osmReference: OSMReference) {
		this.osmReference = osmReference;
	}

	public addRing(type: Tile3DRingType, nodes: Vec2[]): void {
		const ring = new Tile3DRing(type, nodes);

		this.rings.push(ring);
		this.multipolygon.addRing(ring);
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
			height: number | number[][];
			color: number;
			textureId: number;
		}
	): void {
		for (let i = 0; i < this.rings.length; i++) {
			this.rings[i].buildWalls({
				minHeight,
				height: (typeof height === 'number') ? height : height[i],
				color,
				textureId
			}, this.arrays);
		}

		if (minHeight > 0) {
			const roof = new FlatRoofBuilder().build({
				multipolygon: this.multipolygon,
				height: 0,
				minHeight: minHeight,
				flip: true,
				direction: 0
			});
			this.addAndPaintGeometry({
				position: roof.position,
				normal: roof.normal,
				uv: roof.uv,
				color,
				textureId
			});
		}
	}

	public addRoof(
		{
			type,
			minHeight,
			height,
			direction,
			color,
			textureId
		}: {
			type: RoofType;
			minHeight: number;
			height: number;
			direction: number;
			color: number;
			textureId: number;
		}
	): number[][] | null {
		let builder: RoofBuilder;

		switch (type) {
			case RoofType.Skillion: {
				builder = new SkillionRoofBuilder();
				break;
			}
			case RoofType.Pyramidal: {
				builder = new PyramidalRoofBuilder();
				break;
			}
			default: {
				builder = new FlatRoofBuilder();
				break;
			}
		}

		const roof = builder.build({
			multipolygon: this.multipolygon,
			height: height,
			minHeight: minHeight,
			flip: false,
			direction: direction
		});
		this.addAndPaintGeometry({
			position: roof.position,
			normal: roof.normal,
			uv: roof.uv,
			color: color,
			textureId: textureId
		});

		return roof.addSkirt ? roof.skirtHeight : null;
	}

	private addAndPaintGeometry(
		{
			position,
			normal,
			uv,
			color,
			textureId
		}: {
			position: number[];
			normal: number[];
			uv: number[];
			color: number;
			textureId: number;
		}
	): void {
		this.arrays.position.push(...position);
		this.arrays.normal.push(...normal);
		this.arrays.uv.push(...uv);

		const vertexCount = position.length / 3;
		const colorComponents = colorToComponents(color);

		for (let i = 0; i < vertexCount; i++) {
			this.arrays.color.push(...colorComponents);
			this.arrays.textureId.push(textureId);
		}
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