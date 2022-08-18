import Resource from "./Resource";
import Node from "./Node";

export enum InternalResourceType {
	Input,
	Output
}

export interface InternalResource {
	type: InternalResourceType;
	resource: Resource<any, any>;
}

export type ResourcePropMap = Record<string, InternalResource>;

export default abstract class Pass<T extends ResourcePropMap> extends Node {
	public readonly isRenderable: boolean = true;
	protected readonly internalResources: Map<keyof T, T[keyof T]>;

	protected constructor(name: string, initialResources: T) {
		super(name);

		const internalResourcesMap = new Map();

		for (const [name, resource] of Object.entries(initialResources)) {
			internalResourcesMap.set(name, resource);
		}

		this.internalResources = internalResourcesMap;
	}

	public setResource<K extends keyof T>(name: K, resource: T[K]['resource']): void {
		this.internalResources.get(name).resource = resource;
	}

	public getResource<K extends keyof T>(name: K): T[K]['resource'] {
		return this.internalResources.get(name).resource;
	}

	public getPhysicalResource<K extends keyof T>(name: K): T[K]['resource']['physicalResourceBuilder']['type'] {
		return this.getResource(name).attachedPhysicalResource;
	}

	public getOutputResourcesUsedExternally(): Set<Resource<any, any>> {
		const resources: Set<Resource<any, any>> = new Set();

		for (const internalResource of this.internalResources.values()) {
			if (internalResource.type === InternalResourceType.Output && internalResource.resource.isUsedExternally) {
				resources.add(internalResource.resource);
			}
		}

		return resources;
	}

	public getAllResources(): Resource<any, any>[] {
		return Array.from(this.internalResources.values()).map(r => r.resource);
	}

	public getAllResourcesOfType(type: InternalResourceType): Set<Resource<any, any>> {
		const filtered = Array.from(this.internalResources.values()).filter(r => r.type === type);

		return new Set(filtered.map(r => r.resource));
	}

	public abstract render(): void;
}