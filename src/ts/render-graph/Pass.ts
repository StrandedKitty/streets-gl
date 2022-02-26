import Resource from "./Resource";
import Node from "./Node";

export default abstract class Pass extends Node {
	public isRenderable: boolean = true;
	protected inputResources: Map<string, Resource>;
	protected outputResources: Map<string, Resource>;

	protected constructor(name: string) {
		super(name);

		this.inputResources = new Map();
		this.outputResources = new Map();
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