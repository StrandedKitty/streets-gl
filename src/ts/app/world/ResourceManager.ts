export enum ResourceType {
	Image
}

export default new class ResourceManager {
	private resources: Map<string, any> = new Map();
	private requests: Map<string, string> = new Map();

	public add(name: string, url: string) {
		this.requests.set(name, url);
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

					if(++loaded === total) {
						resolve();
					}
				};

				image.src = url;
			}
		});
	}
}