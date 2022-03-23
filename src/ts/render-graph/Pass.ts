import Resource from "./Resource";
import Node from "./Node";
import PhysicalResourcePool from "~/render-graph/PhysicalResourcePool";
import PhysicalResource from "~/render-graph/PhysicalResource";

export default abstract class Pass extends Node {
	public readonly isRenderable: boolean = true;
	protected readonly inputResources: Map<string, Resource>;
	protected readonly outputResources: Map<string, Resource>;
	protected readonly inputPhysicalResources: Map<string, PhysicalResource>;
	protected readonly outputPhysicalResources: Map<string, PhysicalResource>;

	protected constructor(name: string) {
		super(name);

		this.inputResources = new Map();
		this.outputResources = new Map();
		this.inputPhysicalResources = new Map();
		this.outputPhysicalResources = new Map();
	}

	public fetchPhysicalResources(pool: PhysicalResourcePool) {
		for (const [resourceName, resource] of this.inputResources.entries()) {
			if (this.inputPhysicalResources.has(resourceName)) {
				continue;
			}

			this.inputPhysicalResources.set(resourceName, pool.getPhysicalResource(resource));
		}

		for (const [resourceName, resource] of this.outputResources.entries()) {
			if (this.outputPhysicalResources.has(resourceName)) {
				continue;
			}

			this.outputPhysicalResources.set(resourceName, pool.getPhysicalResource(resource));
		}
	}

	public freePhysicalResources(pool: PhysicalResourcePool) {
		for (const [resourceName, physicalResource] of this.inputPhysicalResources.entries()) {
			const inputResource = this.getInputResource(resourceName);
			const inputPhysicalResource = physicalResource;

			if (!inputResource.isTransient) {
				continue;
			}

			pool.pushPhysicalResource(inputResource.descriptor, inputPhysicalResource);

			this.inputPhysicalResources.delete(resourceName);
		}

		for (const [resourceName, physicalResource] of this.outputPhysicalResources.entries()) {
			const outputResource = this.getOutputResource(resourceName);
			const outputPhysicalResource = physicalResource;

			if (!outputResource.isTransient) {
				continue;
			}

			pool.pushPhysicalResource(outputResource.descriptor, outputPhysicalResource);

			this.outputPhysicalResources.delete(resourceName);
		}
	}

	protected addInputResource(resource: Resource) {
		this.inputResources.set(resource.name, resource);
	}

	protected addOutputResource(resource: Resource) {
		this.outputResources.set(resource.name, resource);
	}

	public getInputResource(name: string): Resource {
		return this.inputResources.get(name);
	}

	public getOutputResource(name: string): Resource {
		return this.outputResources.get(name);
	}

	public getInputPhysicalResource(name: string): PhysicalResource {
		return this.inputPhysicalResources.get(name);
	}

	public getOutputPhysicalResource(name: string): PhysicalResource {
		return this.outputPhysicalResources.get(name);
	}

	public hasExternalOutput(): boolean {
		for (const resource of this.outputResources.values()) {
			if (resource.isUsedExternally) {
				return true;
			}
		}

		return false;
	}

	public getAllInputResources(): Set<Resource> {
		return new Set(this.inputResources.values());
	}

	public getAllOutputResources(): Set<Resource> {
		return new Set(this.outputResources.values());
	}

	public abstract render(): void;
}