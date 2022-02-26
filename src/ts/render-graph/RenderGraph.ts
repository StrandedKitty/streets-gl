import Pass from "./Pass";
import Resource from "./Resource";
import Node from "./Node";
import {Queue} from "./Utils";
import ResourcePool from "./PhysicalResourcePool";

export default class RenderGraph {
	private passes: Set<Pass> = new Set();
	private resourcePool: ResourcePool = new ResourcePool();

	public addPass(pass: Pass) {
		this.passes.add(pass);
	}

	private sortRenderableNodes(nodes: Set<Node>): Node[] {
		// Kahn's algorithm

		const queue = new Queue<Node>();

		for (const node of nodes) {
			if (node.tempAdjacencyList.size === 0) {
				queue.push(node);
			}
		}

		let visitedCount: number = 0;
		const topOrder: Node[] = [];

		while (!queue.isEmpty()) {
			const node = queue.pop();

			if (node.isRenderable) {
				topOrder.push(node);
			}

			for (const adjacentNode of node.tempAdjacencyList) {
				adjacentNode.tempAdjacencyList.delete(node);

				if (adjacentNode.tempAdjacencyList.size === 0) {
					queue.push(adjacentNode);
				}
			}

			++visitedCount;
		}

		if (visitedCount !== nodes.size) {
			throw new Error('Render graph has a cycle');
		}

		return topOrder;
	}

	private getPassesWithExternalOutput(passes: Set<Pass>): Set<Pass> {
		const result: Set<Pass> = new Set();

		for (const pass of passes) {
			if (pass.hasExternalOutput()) {
				result.add(pass);
			}
		}

		return result;
	}

	private buildGraphWithCulling(passes: Set<Pass>): Set<Node> {
		const nodes: Pass[] = Array.from(this.getPassesWithExternalOutput(passes));
		const graph: Set<Node> = new Set();

		for (const node of nodes) {
			node.tempAdjacencyList.clear();

			graph.add(node);
		}

		while (nodes.length > 0) {
			const node = nodes.pop();

			for (const prevNode of node.previousNodes) {
				if (!graph.has(prevNode)) {
					prevNode.tempAdjacencyList.clear();
				}

				graph.add(prevNode);

				prevNode.tempAdjacencyList.add(node);
			}
		}

		return graph;
	}

	public updateAllNodesVertices() {
		const allResources: Set<Resource> = new Set();

		for (const pass of this.passes) {
			const inputResources = pass.getAllInputResources();
			const outputResources = pass.getAllOutputResources();

			pass.previousNodes = inputResources;
			pass.nextNodes = outputResources;

			for (const resource of [...inputResources, ...outputResources]) {
				allResources.add(resource);
			}
		}

		for (const resource of allResources) {
			resource.nextNodes.clear();
			resource.previousNodes.clear();
		}

		for (const pass of this.passes) {
			for (const resource of pass.previousNodes) {
				resource.nextNodes.add(pass);
			}

			for (const resource of pass.nextNodes) {
				resource.previousNodes.add(pass);
			}
		}
	}

	public render() {
		this.updateAllNodesVertices();

		const graph = this.buildGraphWithCulling(this.passes);
		const sorted = <Pass[]>this.sortRenderableNodes(graph);

		for (const pass of sorted) {
			pass.render();
		}
	}
}