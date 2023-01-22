import Node from "./Node";
import ResourceDescriptor from "./ResourceDescriptor";
import PhysicalResourceBuilder from "./PhysicalResourceBuilder";
import PhysicalResource from "./PhysicalResource";
import ResourcePool from "~/lib/render-graph/PhysicalResourcePool";

export default abstract class Resource<TDescriptor extends ResourceDescriptor, TBuilder extends PhysicalResourceBuilder<any>> extends Node {
	public isRenderable = false;
	public descriptor: TDescriptor;
	public physicalResourceBuilder: TBuilder;
	public isTransient: boolean;
	public isUsedExternally: boolean;
	public attachedPhysicalResource: TBuilder['type'] = null;
	public attachedPhysicalResourceId: string = null;

	protected constructor(
		{
			name,
			descriptor,
			physicalResourceBuilder,
			isTransient,
			isUsedExternally
		}: {
			name: string;
			descriptor: TDescriptor;
			physicalResourceBuilder: TBuilder;
			isTransient: boolean;
			isUsedExternally: boolean;
		}
	) {
		super(name);

		this.descriptor = descriptor;
		this.physicalResourceBuilder = physicalResourceBuilder;
		this.isTransient = isTransient;
		this.isUsedExternally = isUsedExternally;
	}

	private createPhysicalResource(): TBuilder['type'] {
		return this.physicalResourceBuilder.createFromResourceDescriptor(this.descriptor);
	}

	public attachPhysicalResource(pool: ResourcePool): void {
		const id = this.descriptor.deserialize();

		this.attachedPhysicalResourceId = id;
		this.attachedPhysicalResource = pool.getPhysicalResource(id) ?? this.createPhysicalResource();
	}

	public resetAttachedPhysicalResource(): void {
		this.attachedPhysicalResource = null;
		this.attachedPhysicalResourceId = null;
	}
}