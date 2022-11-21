import UniversalFeatureCollection from "~/app/world/universal-features/UniversalFeatureCollection";
import {GroundGeometryData} from "~/app/world/universal-features/providers/GroundGeometryBuilder";
import HeightViewer from "~/app/world/HeightViewer";

export default abstract class UniversalFeatureProvider {
	public abstract getCollection(
		{
			x,
			y,
			heightViewer,
			groundData
		}: {
			x: number;
			y: number;
			heightViewer: HeightViewer;
			groundData: GroundGeometryData;
		}
	): Promise<UniversalFeatureCollection>;
}