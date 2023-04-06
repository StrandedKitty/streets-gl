import Tile3DFeature from "~/lib/tile-processing/tile3d/features/Tile3DFeature";
import RoadGraph from "~/lib/road-graph/RoadGraph";

export interface RequestedHeightParams {
	positions: Float64Array;
	callback: (heights: Float64Array) => void;
}

export default interface Handler {
	setRoadGraph(graph: RoadGraph): void;
	setMercatorScale(scale: number): void;
	getFeatures(): Tile3DFeature[];
	getRequestedHeightPositions(): RequestedHeightParams;
}