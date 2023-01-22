import Pass, {InternalResourceType} from "./Pass";
import Resource from "./Resource";
import Node from "./Node";
import {Queue} from "./Utils";
import ResourcePool from "./PhysicalResourcePool";

export default class RenderGraph {
	private readonly resourcePool: ResourcePool;
	public passes: Set<Pass<any>> = new Set();
	public lastGraph: Set<Node> = null;
	public lastSortedPassList: Pass<any>[] = null;
	public indegreeSets: Map<Node, Set<Node>> = new Map();
	public outdegreeSets: Map<Node, Set<Node>> = new Map();
	private nextNodes: Map<Node, Set<Node>> = new Map();
	private previousNodes: Map<Node, Set<Node>> = new Map();

	public constructor(resourcePool: ResourcePool = new ResourcePool(2)) {
		this.resourcePool = resourcePool;
	}

	public addPass(pass: Pass<any>): void {
		this.passes.add(pass);
	}

	private sortRenderableNodes(nodes: Set<Node>): Node[] {
		// Kahn's algorithm

		const queue = new Queue<Node>();

		for (const node of nodes) {
			if (this.indegreeSets.get(node).size === 0) {
				queue.push(node);
			}
		}

		let visitedCount = 0;
		const graphNodeCount = nodes.size;
		const topOrder: Node[] = [];

		while (!queue.isEmpty()) {
			const node = queue.pop();

			if (node.isRenderable) {
				topOrder.push(node);
			}

			for (const adjacentNode of this.outdegreeSets.get(node)) {
				const adjacentIndegreeSet = this.indegreeSets.get(adjacentNode);

				adjacentIndegreeSet.delete(node);

				if (adjacentIndegreeSet.size === 0) {
					queue.push(adjacentNode);
				}
			}

			++visitedCount;
		}

		if (visitedCount !== graphNodeCount) {
			throw new Error('Render graph has a cycle');
		}

		return topOrder;
	}

	private getResourcesUsedExternally(passes: Set<Pass<any>>): Set<Resource<any, any>> {
		const result: Set<Resource<any, any>> = new Set();

		for (const pass of passes) {
			const resources = pass.getOutputResourcesUsedExternally();

			for (const resource of resources) {
				result.add(resource);
			}
		}

		return result;
	}

	private buildGraphWithCulling(passes: Set<Pass<any>>): Set<Node> {
		const nodes: Node[] = Array.from(this.getResourcesUsedExternally(passes));
		const graph: Set<Node> = new Set();

		this.indegreeSets.clear();
		this.outdegreeSets.clear();

		for (const node of nodes) {
			this.indegreeSets.set(node, new Set());
			this.outdegreeSets.set(node, new Set());

			graph.add(node);
		}

		while (nodes.length > 0) {
			const node = nodes.shift();

			for (const prevNode of this.previousNodes.get(node)) {
				if (!graph.has(prevNode)) {
					this.indegreeSets.set(prevNode, new Set());
					this.outdegreeSets.set(prevNode, new Set());

					graph.add(prevNode);
					nodes.push(prevNode);
				}

				this.indegreeSets.get(node).add(prevNode);
				this.outdegreeSets.get(prevNode).add(node);
			}
		}

		return graph;
	}

	private updateAllNodesVertices(): void {
		const allResources: Set<Resource<any, any>> = new Set();

		this.nextNodes.clear();
		this.previousNodes.clear();

		for (const pass of this.passes) {
			const inputResources = pass.getAllResourcesOfType(InternalResourceType.Input);
			const outputResources = pass.getAllResourcesOfType(InternalResourceType.Output);

			this.previousNodes.set(pass, inputResources);
			this.nextNodes.set(pass, outputResources);

			for (const resource of [...inputResources, ...outputResources]) {
				allResources.add(resource);
			}
		}

		for (const resource of allResources) {
			this.nextNodes.set(resource, new Set());
			this.previousNodes.set(resource, new Set());
		}

		for (const pass of this.passes) {
			for (const resource of this.previousNodes.get(pass)) {
				this.nextNodes.get(resource).add(pass);
			}

			for (const resource of this.nextNodes.get(pass)) {
				this.previousNodes.get(resource).add(pass);
			}
		}
	}

	private attachPhysicalResources(resources: Set<Resource<any, any>>): void {
		for (const resource of resources) {
			const currentResourceId = resource.attachedPhysicalResourceId;
			const newResourceId = resource.descriptor.deserialize();

			if (resource.attachedPhysicalResource && currentResourceId === newResourceId) {
				continue;
			}

			if (resource.attachedPhysicalResource) {
				this.resourcePool.pushPhysicalResource(currentResourceId, resource.attachedPhysicalResource);
			}

			resource.attachPhysicalResource(this.resourcePool);
		}
	}

	private resetPhysicalResources(resources: Set<Resource<any, any>>): void {
		for (const resource of resources) {
			if (resource.isTransient && resource.attachedPhysicalResource) {
				this.resourcePool.pushPhysicalResource(resource.attachedPhysicalResourceId, resource.attachedPhysicalResource);
				resource.resetAttachedPhysicalResource();
			}
		}
	}

	private renderPasses(passes: Pass<any>[]): void {
		for (const pass of passes) {
			pass.render();
		}
	}

	public render(): void {
		this.updateAllNodesVertices();

		const graph = this.buildGraphWithCulling(this.passes);
		const sorted = <Pass<any>[]>this.sortRenderableNodes(graph);

		this.lastGraph = graph;
		this.lastSortedPassList = sorted;

		const allResources: Set<Resource<any, any>> = new Set();

		for (const pass of sorted) {
			const resources = pass.getAllResources();

			for (const resource of resources) {
				allResources.add(resource);
			}
		}

		this.attachPhysicalResources(allResources);

		this.renderPasses(sorted);
		this.resourcePool.update();

		this.resetPhysicalResources(allResources);
	}
}