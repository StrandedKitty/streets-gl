import Handler, {RequestedHeightParams} from "~/lib/tile-processing/tile3d/handlers/Handler";
import VectorNode from "~/lib/tile-processing/vector/features/VectorNode";
import OSMReference from "~/lib/tile-processing/vector/features/OSMReference";
import {VectorNodeDescriptor} from "~/lib/tile-processing/vector/descriptors";
import Tile3DInstance, {Tile3DInstanceType} from "~/lib/tile-processing/tile3d/features/Tile3DInstance";
import SeededRandom from "~/lib/math/SeededRandom";
import RoadGraph from "~/lib/road-graph/RoadGraph";
import Vec2 from "~/lib/math/Vec2";

const TileSize = 611.4962158203125;

export default class VectorNodeHandler implements Handler {
	private readonly osmReference: OSMReference;
	private readonly descriptor: VectorNodeDescriptor;
	private readonly x: number;
	private readonly y: number;
	private mercatorScale: number = 1;
	private terrainHeight: number = 0;
	private graph: RoadGraph = null;

	public constructor(feature: VectorNode) {
		this.osmReference = feature.osmReference;
		this.descriptor = feature.descriptor;
		this.x = feature.x;
		this.y = feature.y;
	}

	public setRoadGraph(graph: RoadGraph): void {
		this.graph = graph;
	}

	public setMercatorScale(scale: number): void {
		this.mercatorScale = scale;
	}

	public getFeatures(): Tile3DInstance[] {
		if (this.isOutOfBounds()) {
			return [];
		}

		if (this.descriptor.type === 'tree') {
			return [this.getGenericInstanceFeature({
				type: 'tree',
				rotateToNearestPath: false,
				height: this.descriptor.height
			})];
		}

		if (this.descriptor.type === 'adColumn') {
			return [this.getGenericInstanceFeature({
				type: 'adColumn',
				rotateToNearestPath: false
			})];
		}

		if (this.descriptor.type === 'transmissionTower') {
			return [this.getGenericInstanceFeature({
				type: 'transmissionTower',
				rotateToNearestPath: false
			})];
		}

		if (this.descriptor.type === 'hydrant') {
			return [this.getGenericInstanceFeature({
				type: 'hydrant',
				rotateToNearestPath: false
			})];
		}

		if (this.descriptor.type === 'windTurbine') {
			return [this.getGenericInstanceFeature({
				type: 'windTurbine',
				rotateToNearestPath: false,
				height: this.descriptor.height,
				rotation: 0
			})];
		}

		if (this.descriptor.type === 'bench') {
			return [this.getGenericInstanceFeature({
				type: 'bench',
				rotateToNearestPath: true
			})];
		}

		if (this.descriptor.type === 'picnicTable') {
			return [this.getGenericInstanceFeature({
				type: 'picnicTable',
				rotateToNearestPath: true
			})];
		}

		if (this.descriptor.type === 'busStop') {
			return [this.getGenericInstanceFeature({
				type: 'busStop',
				rotateToNearestPath: true,
				pathGroupId: 0
			})];
		}

		if (this.descriptor.type === 'memorial') {
			return [this.getGenericInstanceFeature({
				type: 'memorial',
				rotateToNearestPath: true
			})];
		}

		if (this.descriptor.type === 'statue') {
			return [this.getGenericInstanceFeature({
				type: 'statue',
				rotateToNearestPath: true
			})];
		}

		return [];
	}

	private getGenericInstanceFeature(
		{
			type,
			rotateToNearestPath = false,
			pathGroupId,
			height = 1,
			rotation,
		}: {
			type: Tile3DInstanceType;
			rotateToNearestPath?: boolean;
			pathGroupId?: number;
			height?: number;
			rotation?: number;
		}
	): Tile3DInstance {
		let rotationAngle: number = 0;

		if (rotation !== undefined) {
			rotationAngle = rotation;
		} else if (rotateToNearestPath && this.graph) {
			const selfPosition = new Vec2(this.x, this.y);
			const projection = this.graph.getClosestProjection(selfPosition, pathGroupId);

			if (projection) {
				rotationAngle = -Vec2.sub(projection, selfPosition).getAngle() + Math.PI * 0.5;
			}
		} else {
			const rnd = new SeededRandom(Math.floor(this.x + this.y));
			rotationAngle = rnd.generate() * Math.PI * 2;
		}

		return {
			type: 'instance',
			instanceType: type,
			x: this.x,
			y: this.terrainHeight,
			z: this.y,
			scale: height * this.mercatorScale,
			rotation: rotationAngle
		};
	}

	public getRequestedHeightPositions(): RequestedHeightParams {
		if (this.isOutOfBounds()) {
			return null;
		}

		if (this.descriptor.type) {
			return {
				positions: new Float64Array([this.x, this.y]),
				callback: (heights: Float64Array): void => {
					this.terrainHeight = heights[0] * this.mercatorScale;
				}
			};
		}

		return null;
	}

	private isOutOfBounds(): boolean {
		return this.x < 0 || this.x > TileSize || this.y < 0 || this.y > TileSize;
	}
}