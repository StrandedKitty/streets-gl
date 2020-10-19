import Feature3D, {Tags} from "./Feature3D";
import Node3D from "./Node3D";
import earcut from 'earcut';
import HeightViewer from "../../../HeightViewer";
import Ring3D, {RingType} from "./Ring3D";
import {mercatorScaleFactor} from "../../../../../math/Utils";
import {GeoJSON} from "geojson";
import WayAABB from "../WayAABB";
import Config from "../../../../Config";

interface EarcutInput {
	vertices: number[];
	holes: number[]
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

	constructor(id: number, tags: Tags, heightViewer: HeightViewer) {
		super(id, tags);

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

		this.heightFactor = lat === null ? 1 : mercatorScaleFactor(lat);
	}

	public getVertices(): Float32Array {
		if (!this.visible || this.tags.type !== 'building') {
			return new Float32Array();
		}

		this.updateHeightFactor();

		for(const ring of this.rings) {
			ring.updateFootprintHeight();
		}
		this.updateFootprintHeight();

		if(!this.tags.height) {
			this.tags.height = (+this.tags.levels || 1) * 3.5 + this.maxGroundHeight - this.minGroundHeight;
		}

		const footprint = this.triangulateFootprint();
		let walls: number[] = [];

		for(const ring of this.rings) {
			walls = walls.concat(ring.triangulateWalls());
		}

		return new Float32Array(footprint.concat(walls));
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

	private triangulateFootprint(): number[] {
		const result = [];

		this.updateHoles();

		for(const ring of this.rings) {
			if(ring.type === RingType.Outer) {
				const {vertices, holes} = this.getFlattenVerticesForRing(ring);
				const triangles = earcut(vertices, holes).reverse();

				for (let i = 0; i < triangles.length; i++) {
					result.push(
						vertices[triangles[i] * 2],
						this.minGroundHeight + (+this.tags.height || 6) * this.heightFactor,
						vertices[triangles[i] * 2 + 1]
					);
				}
			}
		}

		return result;
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