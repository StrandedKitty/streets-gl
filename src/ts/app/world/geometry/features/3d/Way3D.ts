import Feature3D, {Tags} from "./Feature3D";
import Node3D from "./Node3D";

export default class Way extends Feature3D {
    public nodes: Node3D[];

    constructor(id: number, nodes: Node3D[], tags: Tags) {
        super(id, tags);

        this.nodes = nodes;
    }
}