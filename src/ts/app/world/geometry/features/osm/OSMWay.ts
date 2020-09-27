import OSMFeature, {OSMTags} from "./OSMFeature";
import OSMNode from "./OSMNode";

export default class OSMWay extends OSMFeature {
	public nodes: OSMNode[];

	constructor(id: number, nodes: OSMNode[], tags: OSMTags) {
		super(id, tags);

		this.nodes = nodes;
	}
}