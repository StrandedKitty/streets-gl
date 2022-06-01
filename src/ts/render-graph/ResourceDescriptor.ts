export default abstract class ResourceDescriptor {
	public abstract memorySize(): number;
	public abstract deserialize(): string;
}