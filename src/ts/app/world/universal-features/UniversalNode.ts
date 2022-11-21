import UniversalFeature from "~/app/world/universal-features/UniversalFeature";
import {UniversalNodeDescription} from "~/app/world/universal-features/descriptions";

export default class UniversalNode extends UniversalFeature {
	public description: UniversalNodeDescription;
	public id: number;
	public x: number;
	public y: number;

	public constructor(id: number, x: number, y: number, description: UniversalNodeDescription) {
		super();

		this.id = id;
		this.x = x;
		this.y = y;
		this.description = description;
	}
}