import * as RG from "~/render-graph";
import PassManager from '~/app/render/PassManager';
import AbstractRenderer from '~/renderer/abstract-renderer/AbstractRenderer';
import RenderGraphResourceFactory from '~/app/render/render-graph/RenderGraphResourceFactory';

export default abstract class Pass<T extends RG.ResourcePropMap = RG.ResourcePropMap> extends RG.Pass<T> {
	protected readonly manager: PassManager;
	protected readonly renderer: AbstractRenderer;
	protected readonly resourceFactory: RenderGraphResourceFactory;

	protected constructor(name: string, manager: PassManager, initialResources: T) {
		super(name, initialResources);

		this.manager = manager;
		this.renderer = manager.renderer;
		this.resourceFactory = manager.resourceFactory;
	}

	public abstract setSize(width: number, height: number): void;
}