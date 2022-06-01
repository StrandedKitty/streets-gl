export default abstract class Node {
	public name: string;
	public previousNodes: Set<Node> = new Set();
	public nextNodes: Set<Node> = new Set();
	public tempIndegreeSet: Set<Node> = new Set();
	public tempOutdegreeSet: Set<Node> = new Set();
	public abstract isRenderable: boolean;

	protected constructor(name: string) {
		this.name = name;
	}
}
