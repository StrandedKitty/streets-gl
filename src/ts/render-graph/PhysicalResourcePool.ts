import PhysicalResource from "./PhysicalResource";
import Resource from "./Resource";

const UnusedResourceLifeTime = 2;

class PhysicalResourceEntry {
	public frameCount = 0;

	public constructor(public resource: PhysicalResource) {
	}
}

export default class PhysicalResourcePool {
	private resourcesMap: Map<string, PhysicalResourceEntry[]> = new Map();

	public pushPhysicalResource(id: string, physicalResource: PhysicalResource): void {
		if (!this.resourcesMap.get(id)) {
			this.resourcesMap.set(id, []);
		}

		this.resourcesMap.get(id).push(new PhysicalResourceEntry(physicalResource));
	}

	public getPhysicalResource(resource: Resource<any, any>): PhysicalResource {
		const id = resource.descriptor.deserialize();

		if (!this.resourcesMap.get(id)) {
			return resource.createPhysicalResource();
		}

		const entries = this.resourcesMap.get(id);
		const result = entries.pop().resource;

		if (entries.length === 0) {
			this.resourcesMap.delete(id);
		}

		return result;
	}

	public update(): void {
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