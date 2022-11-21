import UniversalFeature from "~/app/world/universal-features/UniversalFeature";
import {UniversalPolylineDescription} from "~/app/world/universal-features/descriptions";
import UniversalNode from "~/app/world/universal-features/UniversalNode";

export default class UniversalPolyline extends UniversalFeature {
	public description: UniversalPolylineDescription;
	public nodes: UniversalNode[];

	public constructor(nodes: UniversalNode[], description: UniversalPolylineDescription) {
		super();

		this.nodes = nodes;
		this.description = description;
	}
}