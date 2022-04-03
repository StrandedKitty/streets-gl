import PhysicalResource from "./PhysicalResource";
import ResourceDescriptor from "./ResourceDescriptor";
import Resource from "./Resource";

const UnusedResourceLifeTime = 2;

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
		for (const [resourceId, resourceArray] of this.resourcesMap.entries()) {
			for (let i = 0; i < resourceArray.length; i++) {
				const resourceEntry = resourceArray[i];

				++resourceEntry.frameCount;

				if (resourceEntry.frameCount > UnusedResourceLifeTime) {
					resourceEntry.resource.delete();

					resourceArray.splice(i, 1);
					--i;
				}
			}

			if (resourceArray.length === 0) {
				this.resourcesMap.delete(resourceId);
			}
		}
	}
}