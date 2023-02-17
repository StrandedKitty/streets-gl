import Tile3DExtrudedGeometry from "~/lib/tile-processing/tile3d/features/Tile3DExtrudedGeometry";
import Tile3DFlatGeometry from "~/lib/tile-processing/tile3d/features/Tile3DFlatGeometry";
import Tile3DNode from "~/lib/tile-processing/tile3d/features/Tile3DNode";

export default interface Tile3DFeatureCollection {
	extruded: Tile3DExtrudedGeometry[];
	flat: Tile3DFlatGeometry[];
	nodes: Tile3DNode[];
}