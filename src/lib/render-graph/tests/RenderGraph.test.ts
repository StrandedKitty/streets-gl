import {InternalResourceType, Pass, PhysicalResource, RenderGraph, ResourceDescriptor} from "~/lib/render-graph";
import {mock} from "jest-mock-extended";
import PhysicalResourcePool from '../PhysicalResourcePool';
import PhysicalResourceBuilder from '../PhysicalResourceBuilder';
import Resource from '../Resource';
import {jest} from '@jest/globals';

jest.mock('../PhysicalResourcePool');

const descriptor = mock<ResourceDescriptor>();
descriptor.deserialize.mockReturnValue('');

const builder = mock<PhysicalResourceBuilder<any>>();
builder.createFromResourceDescriptor.mockReturnValue({});

const testGraphs: {
	id: number;
	resourceIDs: string[];
	externalResourceIDs: string[];
	passes: {in: string[]; out: string[]}[];
	externalPassIDs: number[];
	hasLoop: boolean;
}[] = [
	{
		id: 0,
		resourceIDs: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'],
		externalResourceIDs: ['f'],
		passes: [
			{in: [], out: ['a', 'b']},
			{in: ['a'], out: ['d']},
			{in: ['d', 'c', 'e'], out: ['f']},
			{in: [], out: ['c']},
			{in: ['b', 'c'], out: ['e']},
			{in: ['g'], out: ['h']},
			{in: ['h'], out: ['i']}
		],
		externalPassIDs: [5, 6],
		hasLoop: false
	}, {
		id: 1,
		resourceIDs: ['a', 'b', 'c', 'd'],
		externalResourceIDs: [],
		passes: [
			{in: [], out: ['a']},
			{in: ['a', 'b'], out: ['c', 'd']},
			{in: [], out: ['b']},
		],
		externalPassIDs: [0, 1, 2],
		hasLoop: false
	}, {
		id: 2,
		resourceIDs: ['a', 'b', 'c', 'd'],
		externalResourceIDs: ['d'],
		passes: [
			{in: [], out: ['a']},
			{in: ['a', 'c'], out: ['b']},
			{in: ['b'], out: ['c']},
			{in: ['b'], out: ['d']},
		],
		externalPassIDs: [],
		hasLoop: true
	}
];

const buildResourcesAndPasses = (
	{
		resourceIDs,
		externalResourceIDs,
		passes
	}: {
		resourceIDs: string[];
		externalResourceIDs: string[];
		passes: {in: string[]; out: string[]}[];
	}
): {passList: ReturnType<typeof mock<Pass<any>>>[]; renderOrder: number[]} => {
	const passList: ReturnType<typeof mock<Pass<any>>>[] = [];
	const resources: Record<string, Resource<any, any>> = {};
	const renderOrder: number[] = [];

	for (const id of resourceIDs) {
		resources[id] = mock<Resource<any, any>>({
			name: id,
			descriptor,
			physicalResourceBuilder: builder,
			isUsedExternally: externalResourceIDs.includes(id),
			isRenderable: false
		});
	}

	for (let i = 0; i < passes.length; i++) {
		const resourcesIDs = passes[i];
		const passResources: {type: InternalResourceType; resource: Resource<any, any>}[] = [];

		for (const id of resourcesIDs.in) {
			passResources.push({
				type: InternalResourceType.Input,
				resource: resources[id]
			});
		}
		for (const id of resourcesIDs.out) {
			passResources.push({
				type: InternalResourceType.Output,
				resource: resources[id]
			});
		}

		const name = i.toString();
		const pass = mock<Pass<any>>({
			name,
			getOutputResourcesUsedExternally: () => {
				return new Set(passResources
					.filter(entry => entry.resource.isUsedExternally)
					.map(entry => entry.resource)
				);
			},
			getAllResourcesOfType: (type) => {
				return new Set(passResources
					.filter(entry => entry.type === type)
					.map(entry => entry.resource)
				)
			},
			getAllResources: () => {
				return Array.from(Object.values(passResources)).map(entry => entry.resource);
			},
			isRenderable: true,
			render: (): void => {
				renderOrder.push(i);
			}
		});

		passList.push(pass);
	}

	return {
		passList,
		renderOrder
	};
}

beforeEach(() => {
	jest.clearAllMocks();
});

test(`should store added passes`, () => {
	const graph = new RenderGraph();
	const pass = mock<Pass<any>>();

	graph.addPass(pass);

	expect(graph.passes.has(pass)).toBeTruthy();
});

test(`should attach physical resources to resources`, () => {
	const pool = new PhysicalResourcePool(2);
	const graph = new RenderGraph(pool);
	const resource = mock<Resource<any, any>>({
		descriptor,
		physicalResourceBuilder: builder,
		isUsedExternally: true,
		isRenderable: false
	});
	const pass = mock<Pass<any>>({
		getOutputResourcesUsedExternally: () => new Set([resource]),
		getAllResourcesOfType: (type) => {
			return type === InternalResourceType.Output ? new Set([resource]) : new Set();
		},
		getAllResources: () => [resource],
		isRenderable: true
	});

	graph.addPass(pass);
	graph.render();

	expect(resource.attachPhysicalResource).toBeCalledTimes(1);
	expect(resource.attachPhysicalResource).toBeCalledWith(pool);
});

test(`should not attach physical resources to resources if they are already attached`, () => {
	const graph = new RenderGraph();
	const physicalResource = mock<PhysicalResource>();
	const resource = mock<Resource<any, any>>({
		descriptor,
		physicalResourceBuilder: builder,
		isUsedExternally: true,
		isRenderable: false,
		attachedPhysicalResource: physicalResource,
		attachedPhysicalResourceId: ''
	});
	const pass = mock<Pass<any>>({
		getOutputResourcesUsedExternally: () => new Set([resource]),
		getAllResourcesOfType: (type) => {
			return type === InternalResourceType.Output ? new Set([resource]) : new Set();
		},
		getAllResources: () => [resource],
		isRenderable: true
	});

	graph.addPass(pass);
	graph.render();

	expect(resource.attachPhysicalResource).toBeCalledTimes(0);
});

test(`should call render on used passes`, () => {
	const graph = new RenderGraph();
	const resource = mock<Resource<any, any>>({
		descriptor,
		physicalResourceBuilder: builder,
		isUsedExternally: true,
		isRenderable: false
	});

	const pass = mock<Pass<any>>({
		getOutputResourcesUsedExternally: () => new Set([resource]),
		getAllResourcesOfType: (type) => {
			return type === InternalResourceType.Output ? new Set([resource]) : new Set();
		},
		getAllResources: () => [resource],
		isRenderable: true
	});

	graph.addPass(pass);
	graph.render();

	expect(pass.render).toBeCalledTimes(1);
});

test.each([true, false])(
	`should reset only transient attached physical resources after render (transient = %s)`,
	(isTransient) => {
		const graph = new RenderGraph();
		const resource = mock<Resource<any, any>>({
			descriptor,
			physicalResourceBuilder: builder,
			isUsedExternally: true,
			isTransient,
			isRenderable: false
		});
		const pass = mock<Pass<any>>({
			getOutputResourcesUsedExternally: () => new Set([resource]),
			getAllResourcesOfType: (type) => {
				return type === InternalResourceType.Output ? new Set([resource]) : new Set();
			},
			getAllResources: () => [resource],
			isRenderable: true
		});

		graph.addPass(pass);
		graph.render();

		expect(resource.resetAttachedPhysicalResource).toBeCalledTimes(isTransient ? 1 : 0);
	}
);

test(`should update pool during render`, () => {
	const pool = new PhysicalResourcePool(2);
	const graph = new RenderGraph(pool);
	const resource = mock<Resource<any, any>>({
		descriptor,
		physicalResourceBuilder: builder,
		isUsedExternally: true,
		isTransient: true,
		isRenderable: false
	});
	const pass = mock<Pass<any>>({
		getOutputResourcesUsedExternally: () => new Set([resource]),
		getAllResourcesOfType: (type) => {
			return type === InternalResourceType.Output ? new Set([resource]) : new Set();
		},
		getAllResources: () => [resource],
		isRenderable: true
	});

	graph.addPass(pass);
	graph.render();

	expect(pool.update).toBeCalledTimes(1);
});

test.each(testGraphs.filter(data => !data.hasLoop))(
	`should render passes in the correct order (input #$id)`,
	({resourceIDs, externalResourceIDs, passes}) => {
		const graph = new RenderGraph();
		const {passList, renderOrder} = buildResourcesAndPasses({
			resourceIDs,
			externalResourceIDs,
			passes
		});

		for (const pass of passList) {
			graph.addPass(pass);
		}

		graph.render();

		const completedResources: string[] = [];

		for (const passID of renderOrder) {
			const inOut = passes[passID];

			inOut.in.map(id => expect(completedResources).toContain(id));

			completedResources.push(...inOut.out);
		}
	}
);

test.each(testGraphs)(
	`should throw error if the graph has a cycle (input #$id)`,
	({resourceIDs, externalResourceIDs, passes, hasLoop}) => {
		const graph = new RenderGraph();
		const {passList} = buildResourcesAndPasses({
			resourceIDs,
			externalResourceIDs,
			passes
		});

		for (const pass of passList) {
			graph.addPass(pass);
		}

		if (hasLoop) {
			expect(() => graph.render()).toThrowError();
		} else {
			expect(() => graph.render()).not.toThrowError();
		}
	}
);

test.each(testGraphs.filter(data => !data.hasLoop))(
	`should not render passes that don't contribute to result (input #$id)`,
	({resourceIDs, externalResourceIDs, passes, externalPassIDs}) => {
		const graph = new RenderGraph();

		const {passList, renderOrder} = buildResourcesAndPasses({
			resourceIDs,
			externalResourceIDs,
			passes
		});

		for (const pass of passList) {
			graph.addPass(pass);
		}

		graph.render();

		externalPassIDs.map(id => expect(renderOrder).not.toContain(id));
	}
);