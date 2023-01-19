import OSMFeature, {OSMTags} from "./OSMFeature";

export default class OSMNode extends OSMFeature {
	public lat: number;
	public lon: number;

	public constructor(id: number, lat: number, lon: number, tags: OSMTags) {
		super(id, tags);

		this.lat = lat;
		this.lon = lon;
	}
}