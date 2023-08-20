import OSMReference, {OSMReferenceType} from "~/lib/tile-processing/vector/features/OSMReference";

export default function getOSMReferenceFromOnegeoID(onegeoID: string): OSMReference {
	if (onegeoID) {
		if (onegeoID.startsWith('osm-w')) {
			return {
				type: OSMReferenceType.Way,
				id: parseInt(onegeoID.slice(5))
			};
		}

		if (onegeoID.startsWith('osm-r')) {
			return {
				type: OSMReferenceType.Relation,
				id: parseInt(onegeoID.slice(5))
			};
		}
	}

	return {
		type: OSMReferenceType.Way,
		id: Math.floor(Math.random() * 1e8)
	};
}
