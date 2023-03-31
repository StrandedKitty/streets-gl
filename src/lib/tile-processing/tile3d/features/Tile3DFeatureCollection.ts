import Tile3DExtrudedGeometry from "~/lib/tile-processing/tile3d/features/Tile3DExtrudedGeometry";
import Tile3DProjectedGeometry from "~/lib/tile-processing/tile3d/features/Tile3DProjectedGeometry";
import Tile3DInstance from "~/lib/tile-processing/tile3d/features/Tile3DInstance";
import Tile3DHuggingGeometry from "~/lib/tile-processing/tile3d/features/Tile3DHuggingGeometry";
import Tile3DLabel from "~/lib/tile-processing/tile3d/features/Tile3DLabel";

export default interface Tile3DFeatureCollection {
	extruded: Tile3DExtrudedGeometry[];
	projected: Tile3DProjectedGeometry[];
	hugging: Tile3DHuggingGeometry[];
	labels: Tile3DLabel[];
	instances: Tile3DInstance[];
}