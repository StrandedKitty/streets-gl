import VectorNode from "~/lib/tile-processing/vector/features/VectorNode";
import VectorArea from "~/lib/tile-processing/vector/features/VectorArea";
import VectorPolyline from "~/lib/tile-processing/vector/features/VectorPolyline";

export type VectorFeature = VectorNode | VectorArea | VectorPolyline;