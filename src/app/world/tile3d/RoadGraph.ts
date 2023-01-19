import UniversalPolyline from "../universal-features/UniversalPolyline";
import UniversalNode from "../universal-features/UniversalNode";
import UniversalArea from "../universal-features/UniversalArea";

class RoadGraphNode {
	public readonly x: number;
	public readonly y: number;
	private readonly polylines: Set<UniversalPolyline> = new Set();

	public constructor(universalNode: UniversalNode) {
		this.x = universalNode.x;
		this.y = universalNode.y;
	}

	public addPolyline(polyline: UniversalPolyline): void {
		this.polylines.add(polyline);
	}

	public hasIntersection(): boolean {
		return this.polylines.size > 1;
	}
}

export default class RoadGraph {
	private sourcePolylines: UniversalPolyline[];

	public constructor(polylines: UniversalPolyline[]) {
		this.sourcePolylines = polylines;
	}

	public processIntersections(): {polylines: UniversalPolyline[]; areas: UniversalArea[]} {
		const graphNodes: Map<UniversalNode, RoadGraphNode> = new Map();

		for (const polyline of this.sourcePolylines) {
			for (const node of polyline.nodes) {
				if (!graphNodes.get(node)) {
					graphNodes.set(node, new RoadGraphNode(node));
				}

				graphNodes.get(node).addPolyline(polyline);
			}
		}

		for (const node of graphNodes.values()) {
			if (node.hasIntersection()) {

			}
		}

		return {
			polylines: this.sourcePolylines,
			areas: []
		};
	}
}