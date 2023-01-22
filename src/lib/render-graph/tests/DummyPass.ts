import {Pass, ResourcePropMap} from "~/lib/render-graph";

export default class DummyPass<T extends ResourcePropMap> extends Pass<T> {
	public constructor(
		{
			name = '',
			initialResources
		}: {
			name?: string;
			initialResources: T;
		}
	) {
		super(name, initialResources);
	}

	public render(): void {
	}
}