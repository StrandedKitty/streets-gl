import AbstractMaterial from "~/renderer/abstract-renderer/AbstractMaterial";
import AbstractRenderer from "~/renderer/abstract-renderer/AbstractRenderer";

export default abstract class MaterialContainer {
	protected renderer: AbstractRenderer;
	public material: AbstractMaterial;

	protected constructor(renderer: AbstractRenderer) {
		this.renderer = renderer;
	}
}