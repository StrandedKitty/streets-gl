import UniversalFeature from "~/app/world/universal-features/UniversalFeature";
import {UniversalPolylineDescription} from "~/app/world/universal-features/descriptions";

export default class UniversalPolyline extends UniversalFeature {
	public description: UniversalPolylineDescription;
	public nodes: Node[];
}