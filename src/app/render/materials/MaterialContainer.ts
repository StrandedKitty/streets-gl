import AbstractMaterial from "~/lib/renderer/abstract-renderer/AbstractMaterial";
import AbstractRenderer from "~/lib/renderer/abstract-renderer/AbstractRenderer";

export default abstract class MaterialContainer {
	protected renderer: AbstractRenderer;
	public material: AbstractMaterial;

	protected constructor(renderer: AbstractRenderer) {
		this.renderer = renderer;
	}
}