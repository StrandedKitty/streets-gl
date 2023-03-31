import Tile3DFeature from "~/lib/tile-processing/tile3d/features/Tile3DFeature";

export default interface Tile3DLabel extends Tile3DFeature {
	type: 'label';
	position: [number, number, number];
	priority: number;
	text: string;
}