import {PhysicalResource, PhysicalResourceBuilder} from "~/render-graph";
import TextureResourceDescriptor from "~/app/render/render-graph/resource-descriptors/TextureResourceDescriptor";
import AbstractRenderer from "~/renderer/abstract-renderer/AbstractRenderer";

export default class TexturePhysicalResourceBuilder extends PhysicalResourceBuilder {
	private renderer: AbstractRenderer;

	constructor(renderer: AbstractRenderer) {
		super();
		this.renderer = renderer;
	}

	public createFromResourceDescriptor(descriptor: TextureResourceDescriptor): PhysicalResource {
		return null;
	}
}