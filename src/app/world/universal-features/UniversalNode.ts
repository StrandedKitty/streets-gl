import UniversalFeature, {OSMReference} from "./UniversalFeature";
import {UniversalNodeDescription} from "./descriptions";

export default class UniversalNode extends UniversalFeature {
	public description: UniversalNodeDescription;
	public id: number;
	public x: number;
	public y: number;

	public constructor(
		id: number,
		x: number,
		y: number,
		description: UniversalNodeDescription,
		osmReference: OSMReference
	) {
		super(osmReference);

		this.id = id;
		this.x = x;
		this.y = y;
		this.description = description;
	}
}