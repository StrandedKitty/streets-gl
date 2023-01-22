import {PhysicalResourceBuilder, Resource, ResourceDescriptor} from "~/lib/render-graph";

export default class DummyResource<Desc extends ResourceDescriptor,
	Builder extends PhysicalResourceBuilder<any>>
	extends Resource<Desc, Builder> {
	public constructor(
		{
			descriptor,
			builder,
			name = '',
			isUsedExternally = false,
			isTransient = false
		}: {
			descriptor: Desc;
			builder: Builder;
			name?: string;
			isUsedExternally?: boolean;
			isTransient?: boolean;
		}
	) {
		super({
			name,
			descriptor,
			physicalResourceBuilder: builder,
			isTransient,
			isUsedExternally
		});
	}
}