import {InternalResourceType, PhysicalResource} from "~/lib/render-graph";
import Resource from "../Resource";
import DummyPass from "./DummyPass";
import {mock} from 'jest-mock-extended';

test(`should store name`, () => {
	const name = '12345';
	const pass = new DummyPass({
		name,
		initialResources: {}
	});

	expect(pass.name).toBe(name);
});

test(`should provide the stored resource provided in constructor`, () => {
	const resource = mock<Resource<any, any>>();

	const pass = new DummyPass({
		initialResources: {
			res: {
				type: InternalResourceType.Input,
				resource: resource
			},
		}
	});

	pass.setResource('res', resource);
	expect(pass.getResource('res')).toBe(resource);
});

test(`should provide the stored resource provided after instantiation`, () => {
	const resource = mock<Resource<any, any>>();

	const pass = new DummyPass({
		initialResources: {
			res: {
				type: InternalResourceType.Input,
				resource: null
			}
		}
	});

	pass.setResource('res', resource);
	expect(pass.getResource('res')).toBe(resource);
});


test(`should provide physical resource of a resource`, () => {
	const resource = mock<Resource<any, any>>();
	const physicalResource = mock<PhysicalResource>();

	resource.attachedPhysicalResource = physicalResource;

	const pass = new DummyPass({
		initialResources: {
			res: {
				type: InternalResourceType.Input,
				resource: resource
			},
		}
	});

	expect(pass.getPhysicalResource('res')).toBe(physicalResource);
});

test(`should provide external resources`, () => {
	const resourceIn = mock<Resource<any, any>>({isUsedExternally: false});
	const resourceLocal = mock<Resource<any, any>>({isUsedExternally: false});
	const resourceOut = mock<Resource<any, any>>({isUsedExternally: false});
	const resourceOutExternal = mock<Resource<any, any>>({isUsedExternally: true});

	const pass = new DummyPass({
		initialResources: {
			in: {
				type: InternalResourceType.Input,
				resource: resourceIn
			},
			local: {
				type: InternalResourceType.Local,
				resource: resourceLocal
			},
			out: {
				type: InternalResourceType.Output,
				resource: resourceOut
			},
			outExternal: {
				type: InternalResourceType.Output,
				resource: resourceOutExternal
			},
		}
	});

	const external = pass.getOutputResourcesUsedExternally();

	expect(external.size).toBe(1);
	expect(external.has(resourceOutExternal)).toBeTruthy();
});

test.each([
	['Output', InternalResourceType.Output],
	['Input', InternalResourceType.Input],
	['Local', InternalResourceType.Local],
])(
	`should filter resources by type = %s`,
	(key, type) => {
		const resource = mock<Resource<any, any>>();

		const pass = new DummyPass({
			initialResources: {
				target: {
					type: type,
					resource: resource
				}
			}
		});

		const matching = pass.getAllResourcesOfType(type);

		expect(matching.size).toBe(1);
		expect(matching.has(resource)).toBeTruthy();
	}
);

test(`should return all resources`, () => {
	const resourceIn = mock<Resource<any, any>>();
	const resourceLocal = mock<Resource<any, any>>();
	const resourceOut = mock<Resource<any, any>>();

	const pass = new DummyPass({
		initialResources: {
			in: {
				type: InternalResourceType.Input,
				resource: resourceIn
			},
			out: {
				type: InternalResourceType.Output,
				resource: resourceOut
			},
			local: {
				type: InternalResourceType.Local,
				resource: resourceLocal
			}
		}
	});

	const allResources = pass.getAllResources();

	expect(allResources.length).toBe(3);

	for (const res of allResources) {
		expect(allResources).toContain(res);
	}
});