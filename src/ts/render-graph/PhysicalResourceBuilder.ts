import ResourceDescriptor from "./ResourceDescriptor";
import PhysicalResource from "./PhysicalResource";

export default abstract class PhysicalResourceBuilder<T extends PhysicalResource = PhysicalResource> {
	public readonly type: T;
	public abstract createFromResourceDescriptor(descriptor: ResourceDescriptor): T;
}