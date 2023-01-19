import UniversalFeature, {OSMReference} from "./UniversalFeature";
import {UniversalPolylineDescription} from "./descriptions";
import UniversalNode from "./UniversalNode";

export default class UniversalPolyline extends UniversalFeature {
	public description: UniversalPolylineDescription;
	public nodes: UniversalNode[];

	public constructor(
		nodes: UniversalNode[],
		description: UniversalPolylineDescription,
		osmReference: OSMReference
	) {
		super(osmReference);

		this.nodes = nodes;
		this.description = description;
	}
}