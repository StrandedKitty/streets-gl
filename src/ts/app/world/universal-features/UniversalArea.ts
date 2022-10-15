import UniversalFeature from "~/app/world/universal-features/UniversalFeature";
import {UniversalAreaDescription} from "~/app/world/universal-features/descriptions";
import UniversalPolyline from "~/app/world/universal-features/UniversalPolyline";

export default class UniversalArea extends UniversalFeature {
	public description: UniversalAreaDescription;
	public rings: UniversalPolyline[];
}