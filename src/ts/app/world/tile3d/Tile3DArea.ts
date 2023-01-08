import Tile3DFeature from "~/app/world/tile3d/Tile3DFeature";
import UniversalArea from "~/app/world/universal-features/UniversalArea";
import HeightViewer from "~/app/world/HeightViewer";

export default class Tile3DArea extends Tile3DFeature<UniversalArea> {
	public constructor(universalArea: UniversalArea, heightViewer: HeightViewer) {
		super(universalArea, heightViewer);
	}
}