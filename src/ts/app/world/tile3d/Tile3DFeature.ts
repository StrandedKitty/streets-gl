import UniversalFeature from "~/app/world/universal-features/UniversalFeature";
import HeightViewer from "~/app/world/HeightViewer";

export default abstract class Tile3DFeature<T extends UniversalFeature> {
	protected readonly universal: T;
	protected readonly heightViewer: HeightViewer;

	protected constructor(universalFeature: T, heightViewer: HeightViewer) {
		this.universal = universalFeature;
		this.heightViewer = heightViewer;
	}
}