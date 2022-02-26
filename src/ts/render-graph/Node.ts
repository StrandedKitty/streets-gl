export default abstract class Node {
	public name: string;
	public previousNodes: Set<Node> = new Set();
	public nextNodes: Set<Node> = new Set();
	public tempAdjacencyList: Set<Node> = new Set();
	abstract isRenderable: boolean;

	protected constructor(name: string) {
		this.name = name;
	}
}
