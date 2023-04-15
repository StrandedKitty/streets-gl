import PowerlineNode from "~/lib/tile-processing/powerline-graph/PowerlineNode";

export default class PowerlineSegment {
	public readonly start: PowerlineNode;
	public readonly end: PowerlineNode;

	public constructor(start: PowerlineNode, end: PowerlineNode) {
		this.start = start;
		this.end = end;
	}
}