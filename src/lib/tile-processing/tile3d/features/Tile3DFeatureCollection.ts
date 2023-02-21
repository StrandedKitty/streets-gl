import Tile3DExtrudedGeometry from "~/lib/tile-processing/tile3d/features/Tile3DExtrudedGeometry";
import Tile3DProjectedGeometry from "~/lib/tile-processing/tile3d/features/Tile3DProjectedGeometry";
import Tile3DInstance from "~/lib/tile-processing/tile3d/features/Tile3DInstance";

export default interface Tile3DFeatureCollection {
	extruded: Tile3DExtrudedGeometry[];
	projected: Tile3DProjectedGeometry[];
	instances: Tile3DInstance[];
}