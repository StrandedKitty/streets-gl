import PhysicalResource from "./PhysicalResource";
import ResourceDescriptor from "./ResourceDescriptor";
import Resource from "./Resource";

class PhysicalResourceEntry {
	public frameCount: number = 0;

	constructor(public resource: PhysicalResource) {
	}
}

export default class PhysicalResourcePool {
	private resourcesMap: Map<string, PhysicalResourceEntry[]> = new Map();

	public pushPhysicalResource(descriptor: ResourceDescriptor, physicalResource: PhysicalResource) {
		const id = descriptor.deserialize();

		if (!this.resourcesMap.get(id)) {
			this.resourcesMap.set(id, []);
		}

		this.resourcesMap.get(id).push(new PhysicalResourceEntry(physicalResource));
	}

	public getPhysicalResource(resource: Resource): PhysicalResource {
		const id = resource.descriptor.deserialize();

		if (!this.resourcesMap.get(id)) {
			return resource.createPhysicalResource();
		}

		const entries = this.resourcesMap.get(id);

		return entries.pop().resource;
	}

	public update() {
		for (const resourceArray of this.resourcesMap.values()) {
			for (const resource of resourceArray) {
				++resource.frameCount;

				if (resource.frameCount > 2) {

				}
			}
		}
	}
}