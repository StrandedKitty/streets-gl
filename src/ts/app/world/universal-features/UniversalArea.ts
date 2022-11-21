import UniversalFeature from "~/app/world/universal-features/UniversalFeature";
import {UniversalAreaDescription} from "~/app/world/universal-features/descriptions";
import UniversalNode from "~/app/world/universal-features/UniversalNode";

export class UniversalAreaRing {
	public nodes: UniversalNode[];

	public constructor(nodes: UniversalNode[]) {
		this.nodes = nodes;
	}
}

export default class UniversalArea extends UniversalFeature {
	public description: UniversalAreaDescription;
	public rings: UniversalAreaRing[];

	public constructor(rings: UniversalAreaRing[], description: UniversalAreaDescription) {
		super();

		this.description = description;
		this.rings = rings;
	}
}