export default abstract class Node {
	public name: string;
	public abstract isRenderable: boolean;

	protected constructor(name: string) {
		this.name = name;
	}
}
