import Node from "./Node";
import ResourceDescriptor from "./ResourceDescriptor";
import PhysicalResourceBuilder from "./PhysicalResourceBuilder";
import PhysicalResource from "./PhysicalResource";

export default abstract class Resource<TDescriptor extends ResourceDescriptor = ResourceDescriptor,
	TBuilder extends PhysicalResourceBuilder = PhysicalResourceBuilder> extends Node {
	public isRenderable = false;
	public descriptor: TDescriptor;
	public physicalResourceBuilder: TBuilder;
	public isTransient: boolean;
	public isUsedExternally: boolean;

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

	public createPhysicalResource(): PhysicalResource {
		return this.physicalResourceBuilder.createFromResourceDescriptor(this.descriptor);
	}
}