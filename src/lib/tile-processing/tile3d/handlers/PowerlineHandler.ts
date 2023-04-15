import Handler, {RequestedHeightParams} from "~/lib/tile-processing/tile3d/handlers/Handler";
import Tile3DFeature from "~/lib/tile-processing/tile3d/features/Tile3DFeature";
import RoadGraph from "~/lib/road-graph/RoadGraph";
import PowerlineGraph, {NodeEntity, SegmentEntity} from "~/lib/tile-processing/powerline-graph/PowerlineGraph";
import VectorFeatureCollection from "~/lib/tile-processing/vector/features/VectorFeatureCollection";
import {NodeType} from "~/lib/tile-processing/powerline-graph/PowerlineNode";
import Vec2 from "~/lib/math/Vec2";
import Tile3DInstance, {Tile3DInstanceType} from "~/lib/tile-processing/tile3d/features/Tile3DInstance";
import WireGroupBuilder from "~/lib/tile-processing/tile3d/builders/WireGroupBuilder";

export default class PowerlineHandler implements Handler {
	private readonly graph: PowerlineGraph = new PowerlineGraph();
	private mercatorScale: number = 1;
	private heightMap: Map<string, number> = null;

	public constructor(features: VectorFeatureCollection) {
		for (const feature of features.nodes) {
			if (feature.descriptor.type === 'utilityPole') {
				this.graph.addPowerlineNode(NodeType.Pole, new Vec2(feature.x, feature.y));
			} else if (feature.descriptor.type === 'transmissionTower') {
				this.graph.addPowerlineNode(NodeType.Tower, new Vec2(feature.x, feature.y));
			}
		}

		for (const feature of features.polylines) {
			if (feature.descriptor.type === 'powerLine') {
				const nodes = feature.nodes.map(node => new Vec2(node.x, node.y));
				this.graph.addPowerlinePolyline(nodes);
			}
		}

		this.graph.processGraph();
		this.graph.createEntities();
	}

	private buildInstances(): Tile3DInstance[] {
		const instances: Tile3DInstance[] = [];

		for (const node of this.graph.entities.nodes) {
			const instance = this.getInstanceFromGraphNode(node);

			if (instance) {
				instances.push(instance);
			}
		}

		for (const segment of this.graph.entities.segments) {
			const segments = this.getInstancesFromGraphSegment(segment);

			instances.push(...segments);
		}

		return instances;
	}

	public getFeatures(): Tile3DFeature[] {
		return this.buildInstances();
	}

	public getRequestedHeightPositions(): RequestedHeightParams {
		const positionsMap: Map<string, Vec2> = new Map();

		for (const segment of this.graph.entities.segments) {
			for (const {position} of [segment.end, segment.start]) {
				const key = `${position.x},${position.y}`;

				if (!positionsMap.has(key)) {
					positionsMap.set(key, position);
				}
			}
		}

		for (const {position} of this.graph.entities.nodes) {
			const key = `${position.x},${position.y}`;

			if (!positionsMap.has(key)) {
				positionsMap.set(key, position);
			}
		}

		const positions: number[] = [];

		for (const position of positionsMap.values()) {
			positions.push(position.x, position.y);
		}

		return {
			positions: new Float64Array(positions),
			callback: (heights: Float64Array): void => {
				const heightMap: Map<string, number> = new Map();

				for (let i = 0; i < heights.length; i++) {
					const x = positions[i * 2];
					const y = positions[i * 2 + 1];
					const key = `${x},${y}`;

					heightMap.set(key, heights[i]);
				}

				this.heightMap = heightMap;
			}
		};
	}

	public setMercatorScale(scale: number): void {
		this.mercatorScale = scale;
	}

	public setRoadGraph(graph: RoadGraph): void {
	}

	private getInstanceFromGraphNode(node: NodeEntity): Tile3DInstance {
		if (PowerlineHandler.isOutOfBounds(node.position.x, node.position.y)) {
			return null;
		}

		const instanceType: Tile3DInstanceType = node.type === NodeType.Tower ? 'transmissionTower' : 'utilityPole';
		const height = this.heightMap.get(`${node.position.x},${node.position.y}`);

		return {
			type: 'instance',
			instanceType: instanceType,
			x: node.position.x,
			y: height * this.mercatorScale,
			z: node.position.y,
			scale: this.mercatorScale,
			rotation: node.rotation
		};
	}

	private getInstancesFromGraphSegment(segment: SegmentEntity): Tile3DInstance[] {
		const startPosition = segment.start.position;
		const endPosition = segment.end.position;
		const startHeight = this.heightMap.get(`${startPosition.x},${startPosition.y}`);
		const endHeight = this.heightMap.get(`${endPosition.x},${endPosition.y}`);

		const instances = new WireGroupBuilder().build(
			segment,
			startHeight * this.mercatorScale,
			endHeight * this.mercatorScale,
			this.mercatorScale
		);

		for (const instance of instances) {
			//instance.y *= this.mercatorScale;
		}

		return instances.filter(instance => !PowerlineHandler.isOutOfBounds(instance.x, instance.z));
	}

	private static isOutOfBounds(x: number, y: number): boolean {
		const TileSize = 611.4962158203125;
		return x < 0 || x > TileSize || y < 0 || y > TileSize;
	}
}