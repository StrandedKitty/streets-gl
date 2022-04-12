export enum ResourceType {
	Image,
	Text
}

type ResourceJSONTypes = "image" | "text";
type ResourceJSON = Record<string, {url: string, type: ResourceJSONTypes}>

export default new class ResourceManager {
	private resources: Map<string, any> = new Map();
	private requests: Map<string, string> = new Map();

	public add(name: string, url: string, type: ResourceType) {
		this.requests.set(name, url);
	}

	public addFromJSON(resources: ResourceJSON) {
		for (const [name, record] of Object.entries(resources)) {
			const type = ResourceManager.getResourceTypeFromString(record.type);

			this.add(name, record.url, type);
		}
	}

	public get(name: string): any {
		return this.resources.get(name);
	}

	public async load() {
		let loaded = 0;
		const total = this.requests.size;

		return new Promise<void>(resolve => {
			for (const [name, url] of this.requests.entries()) {
				const image = new Image();

				image.crossOrigin = "anonymous";
				image.onload = () => {
					this.resources.set(name, image);

					if (++loaded === total) {
						resolve();
					}
				};

				image.src = url;
			}
		});
	}

	static getResourceTypeFromString(str: string): ResourceType {
		switch (str) {
			case 'image':
				return ResourceType.Image;
			case 'text':
				return ResourceType.Text;
		}

		return ResourceType.Text;
	}
};