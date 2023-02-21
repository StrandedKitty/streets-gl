import Tile3DFeature from "~/lib/tile-processing/tile3d/features/Tile3DFeature";

export default interface Handler {
	getFeatures(): Tile3DFeature[];
}