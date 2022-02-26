import PhysicalResource from "./PhysicalResource";

export default abstract class ResourceDescriptor {
	abstract memorySize(): number;
	abstract deserialize(): string;
}