import TextureResourceDescriptor from "../resource-descriptors/TextureResourceDescriptor";
import * as RG from "../../../../render-graph";
import {PhysicalResourceBuilder} from "~/render-graph";
import AbstractRenderer from "~/renderer/abstract-renderer/AbstractRenderer";

export default class FramebufferPhysicalResourceBuilder extends PhysicalResourceBuilder {
	private renderer: AbstractRenderer;

	constructor(renderer: AbstractRenderer) {
		super();
		this.renderer = renderer;
	}

	public createFromResourceDescriptor(descriptor: TextureResourceDescriptor): RG.PhysicalResource {
		return null;
	}
}