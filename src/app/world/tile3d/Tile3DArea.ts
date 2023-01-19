import Tile3DFeature from "./Tile3DFeature";
import UniversalArea from "../universal-features/UniversalArea";
import HeightViewer from "../HeightViewer";

export default class Tile3DArea extends Tile3DFeature<UniversalArea> {
	public constructor(universalArea: UniversalArea, heightViewer: HeightViewer) {
		super(universalArea, heightViewer);
	}
}