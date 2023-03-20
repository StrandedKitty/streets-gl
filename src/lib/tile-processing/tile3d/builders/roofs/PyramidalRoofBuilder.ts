import CurvedRoofBuilder from "~/lib/tile-processing/tile3d/builders/roofs/CurvedRoofBuilder";

export default class PyramidalRoofBuilder extends CurvedRoofBuilder {
	protected override splits: [number, number][] = [
		[0, 1],
		[1, 0]
	];
}