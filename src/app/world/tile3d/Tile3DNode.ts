import Tile3DFeature from "./Tile3DFeature";
import UniversalNode from "../universal-features/UniversalNode";
import HeightViewer from "../HeightViewer";

export default class Tile3DNode extends Tile3DFeature<UniversalNode> {
	public constructor(universalNode: UniversalNode, heightViewer: HeightViewer) {
		super(universalNode, heightViewer);
	}
}