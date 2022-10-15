import UniversalFeatureProvider from "~/app/world/universal-features/providers/UniversalFeatureProvider";
import UniversalFeatureCollection from "~/app/world/universal-features/UniversalFeatureCollection";

export default class OverpassUniversalFeatureProvider extends UniversalFeatureProvider {
	public getCollection(): UniversalFeatureCollection {
		return undefined;
	}

}