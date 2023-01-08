import Tile3DFeature from "~/app/world/tile3d/Tile3DFeature";
import UniversalNode from "~/app/world/universal-features/UniversalNode";
import HeightViewer from "~/app/world/HeightViewer";

export default class Tile3DNode extends Tile3DFeature<UniversalNode> {
	public constructor(universalNode: UniversalNode, heightViewer: HeightViewer) {
		super(universalNode, heightViewer);
	}
}