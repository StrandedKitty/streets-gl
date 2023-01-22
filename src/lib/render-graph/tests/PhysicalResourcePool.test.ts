import {
	PhysicalResource,
	PhysicalResourceBuilder,
	PhysicalResourcePool,
	Resource,
	ResourceDescriptor
} from "~/lib/render-graph";
import {mock} from "jest-mock-extended";

const getMockedDependencies = (): {
	desc: ReturnType<typeof mock<ResourceDescriptor>>;
	builder: ReturnType<typeof mock<PhysicalResourceBuilder<any>>>;
	physicalResource: ReturnType<typeof mock<PhysicalResource>>;
	resource: ReturnType<typeof mock<Resource<any, any>>>;
} => {
	const desc = mock<ResourceDescriptor>();
	const builder = mock<PhysicalResourceBuilder<any>>();
	const physicalResource = mock<PhysicalResource>();
	const resource = mock<Resource<any, any>>();

	return {desc, builder, physicalResource, resource};
}

test(`should provide pushed resources`, () => {
	const id = 'lorem ipsum';
	const pool = new PhysicalResourcePool(1);

	const {physicalResource} = getMockedDependencies();

	pool.pushPhysicalResource(id, physicalResource);
	expect(pool.getPhysicalResource(id)).toBe(physicalResource);
});

test.each([...new Array(5)].map((_, i) => i + 1))(
	`should delete unused resources (limit = %d)`,
	(limit) => {
		const pool = new PhysicalResourcePool(limit);
		const id = 'lorem ipsum';
		const {physicalResource} = getMockedDependencies();

		pool.pushPhysicalResource(id, physicalResource);

		for (let i = 0; i < limit + 1; i++) {
			pool.update();
		}

		expect(physicalResource.delete).toBeCalledTimes(1);
		expect(pool.getPhysicalResource(id)).toBeFalsy();
	}
);

test.each([...new Array(5)].map((_, i) => i))(
	`should provide resources during their lifetime (tick = %d)`,
	(tick) => {
		const limit = 4;
		const pool = new PhysicalResourcePool(limit);
		const id = 'lorem ipsum';
		const {physicalResource} = getMockedDependencies();

		pool.pushPhysicalResource(id, physicalResource);

		for (let i = 0; i < tick; i++) {
			pool.update();
		}

		expect(physicalResource.delete).toBeCalledTimes(0);
		expect(pool.getPhysicalResource(id)).toBe(physicalResource);
	}
);