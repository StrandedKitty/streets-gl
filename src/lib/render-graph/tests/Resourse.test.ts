import {PhysicalResource, PhysicalResourceBuilder, ResourceDescriptor} from "~/lib/render-graph";
import PhysicalResourcePool from "../PhysicalResourcePool";
import {mock} from "jest-mock-extended";
import DummyResource from "~/lib/render-graph/tests/DummyResource";

const getMockedDependencies = (): {
	desc: ReturnType<typeof mock<ResourceDescriptor>>;
	builder: ReturnType<typeof mock<PhysicalResourceBuilder<any>>>;
	physicalResource: ReturnType<typeof mock<PhysicalResource>>;
	pool: ReturnType<typeof mock<PhysicalResourcePool>>;
} => {
	const desc = mock<ResourceDescriptor>();
	const builder = mock<PhysicalResourceBuilder<any>>();
	const physicalResource = mock<PhysicalResource>();
	const pool = mock<PhysicalResourcePool>();

	return {desc, builder, physicalResource, pool};
}

test(`should store name`, () => {
	const name = '12345';
	const {desc, builder} = getMockedDependencies();
	const pass = new DummyResource({
		descriptor: desc,
		builder: builder,
		name
	});

	expect(pass.name).toBe(name);
});

test(`should prioritize attaching a physical resource from pool`, () => {
	const str = '123';
	const {physicalResource, builder, pool} = getMockedDependencies();
	const descriptor = mock<ResourceDescriptor>({deserialize(): string {
		return str;
	}});

	pool.getPhysicalResource.mockReturnValue(physicalResource);

	const resource = new DummyResource({descriptor, builder});
	resource.attachPhysicalResource(pool);

	expect(pool.getPhysicalResource).toBeCalledTimes(1);
	expect(resource.attachedPhysicalResource).toBe(physicalResource);
});


test(`should fall back to attaching new physical resource if pool in empty`, () => {
	const str = '123';
	const {physicalResource, builder, pool} = getMockedDependencies();
	const descriptor = mock<ResourceDescriptor>({deserialize(): string {
		return str;
	}});

	builder.createFromResourceDescriptor.mockReturnValue(physicalResource);

	const resource = new DummyResource({descriptor, builder});
	resource.attachPhysicalResource(pool);

	expect(builder.createFromResourceDescriptor).toBeCalledTimes(1);
	expect(resource.attachedPhysicalResource).toBe(physicalResource);
});

test(`should store attached physical resource ID`, () => {
	const testID = '123456';
	const {desc, physicalResource, builder, pool} = getMockedDependencies();

	desc.deserialize.mockReturnValue(testID);
	pool.getPhysicalResource.mockReturnValue(physicalResource);

	const resource = new DummyResource({descriptor: desc, builder});

	resource.attachPhysicalResource(pool);
	expect(resource.attachedPhysicalResourceId).toBe(testID);
});

test(`should reset attached physical resource`, () => {
	const {desc, builder, pool} = getMockedDependencies();
	const resource = new DummyResource({descriptor: desc, builder});

	resource.attachPhysicalResource(pool);
	resource.resetAttachedPhysicalResource();

	expect(resource.attachedPhysicalResource).toBe(null);
});

test(`should reset attached physical resource ID`, () => {
	const {desc, builder, pool} = getMockedDependencies();
	const resource = new DummyResource({descriptor: desc, builder});

	resource.attachPhysicalResource(pool);
	resource.resetAttachedPhysicalResource();

	expect(resource.attachedPhysicalResourceId).toBe(null);
});