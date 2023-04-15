import Vec2 from "~/lib/math/Vec2";
import PowerlineSegment from "~/lib/tile-processing/powerline-graph/PowerlineSegment";
import PowerlineNode, {NodeType} from "~/lib/tile-processing/powerline-graph/PowerlineNode";

export interface NodeEntity {
	readonly position: Vec2;
	readonly type: NodeType;
	readonly rotation: number;
}

export interface SegmentEntity {
	readonly start: NodeEntity;
	readonly end: NodeEntity;
}

export interface EntityList {
	readonly nodes: NodeEntity[];
	readonly segments: SegmentEntity[];
}

export default class PowerlineGraph {
	private readonly segmentInputs: [Vec2, Vec2][] = [];
	private readonly nodeInputs: [NodeType, Vec2][] = [];

	private readonly nodesMap: Map<string, PowerlineNode> = new Map();
	private readonly segments: PowerlineSegment[] = [];

	public entities: EntityList = null;

	public addPowerlinePolyline(polyline: Vec2[]): void {
		for (let i = 0; i < polyline.length - 1; i++) {
			this.segmentInputs.push([polyline[i], polyline[i + 1]]);
		}
	}

	public addPowerlineNode(type: NodeType, position: Vec2): void {
		this.nodeInputs.push([type, position]);
	}

	private addNode(node: PowerlineNode): void {
		const key = `${node.position.x},${node.position.y}`;
		this.nodesMap.set(key, node);
	}

	private getNode(position: Vec2): PowerlineNode {
		const key = `${position.x},${position.y}`;
		return this.nodesMap.get(key);
	}

	public processGraph(): void {
		for (const [type, position] of this.nodeInputs) {
			this.addNode(new PowerlineNode(type, position));
		}

		for (const [start, end] of this.segmentInputs) {
			const startNode = this.getNode(start) ?? PowerlineGraph.getPlaceholderNode(start);
			const endNode = this.getNode(end) ?? PowerlineGraph.getPlaceholderNode(end);
			const segment = new PowerlineSegment(startNode, endNode);

			this.segments.push(segment);

			if (startNode.type !== NodeType.Ground) {
				startNode.addSegment(segment);
			}

			if (endNode.type !== NodeType.Ground) {
				endNode.addSegment(segment);
			}
		}

		for (const node of this.nodesMap.values()) {
			node.updateRotation();
		}
	}

	public createEntities(): void {
		const collection: {
			nodes: NodeEntity[];
			segments: SegmentEntity[];
		} = {
			nodes: [],
			segments: []
		};

		for (const node of this.nodesMap.values()) {
			collection.nodes.push(PowerlineGraph.getNodeEntity(node));
		}

		for (const segment of this.segments) {
			collection.segments.push({
				start: PowerlineGraph.getNodeEntity(segment.start),
				end: PowerlineGraph.getNodeEntity(segment.end)
			});
		}

		this.entities = collection;
	}

	private static getNodeEntity(node: PowerlineNode): NodeEntity {
		return {
			position: node.position,
			type: node.type,
			rotation: node.rotation
		};
	}

	private static getPlaceholderNode(position: Vec2): PowerlineNode {
		return new PowerlineNode(NodeType.Ground, position);
	}
}