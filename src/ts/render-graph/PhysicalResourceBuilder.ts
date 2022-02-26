import ResourceDescriptor from "./ResourceDescriptor";
import PhysicalResource from "./PhysicalResource";

export default abstract class PhysicalResourceBuilder {
	public abstract createFromResourceDescriptor(descriptor: ResourceDescriptor): PhysicalResource;
}