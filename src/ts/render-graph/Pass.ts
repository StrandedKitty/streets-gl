import Resource from "./Resource";
import Node from "./Node";
import PhysicalResourcePool from "./PhysicalResourcePool";

export enum InternalResourceType {
	Input,
	Output
}

interface InternalResource {
	type: InternalResourceType,
	resource: Resource;
}

export type ResourcePropMap = Record<string, InternalResource>;

export default abstract class Pass<T extends ResourcePropMap = ResourcePropMap> extends Node {
	public readonly isRenderable: boolean = true;
	protected readonly internalResources: Map<keyof T, T[keyof T]>;
	protected readonly physicalResources: Map<keyof T, T[keyof T]['resource']['physicalResourceBuilder']['type']>;
	private readonly physicalResourcesIds: Map<keyof T, string> = new Map();

	protected constructor(name: string, initialResources: T) {
		super(name);

		const internalResourcesMap = new Map();

		for (const [name, resource] of Object.entries(initialResources)) {
			internalResourcesMap.set(name, resource);
		}

		this.internalResources = internalResourcesMap;
		this.physicalResources = new Map();
	}

	public fetchPhysicalResources(pool: PhysicalResourcePool) {
		for (const [name, internalResource] of this.internalResources.entries()) {
			if (internalResource.resource === null) {
				continue;
			}

			const resourceId = internalResource.resource.descriptor.deserialize();
			const idChanged = this.physicalResourcesIds.get(name) !== resourceId;

			if (!idChanged && this.physicalResources.has(name)) {
				continue;
			}

			this.physicalResources.set(name, pool.getPhysicalResource(internalResource.resource));
			this.physicalResourcesIds.set(name, resourceId);
		}
	}

	public freePhysicalResources(pool: PhysicalResourcePool) {
		for (const [name, physicalResource] of this.physicalResources.entries()) {
			const internalResource = this.internalResources.get(name);

			if (!internalResource.resource.isTransient) {
				continue;
			}

			pool.pushPhysicalResource(internalResource.resource.descriptor, physicalResource);

			this.physicalResources.delete(name);
			this.physicalResourcesIds.delete(name);
		}
	}

	public setResource<K extends keyof T>(name: K, resource: T[K]['resource']) {
		this.internalResources.get(name).resource = resource;
	}

	public getResource<K extends keyof T>(name: K): T[K]['resource'] {
		return this.internalResources.get(name).resource;
	}

	public getPhysicalResource<K extends keyof T>(name: K): T[K]['resource']['physicalResourceBuilder']['type'] {
		return this.physicalResources.get(name);
	}

	public hasExternalOutput(): boolean {
		for (const internalResource of this.internalResources.values()) {
			if (internalResource.type === InternalResourceType.Output && internalResource.resource.isUsedExternally) {
				return true;
			}
		}

		return false;
	}

	public getAllResourcesOfType(type: InternalResourceType): Set<Resource> {
		const filtered = Array.from(this.internalResources.values()).filter(r => r.type === type);

		return new Set(filtered.map(r => r.resource));
	}

	public abstract render(): void;
}