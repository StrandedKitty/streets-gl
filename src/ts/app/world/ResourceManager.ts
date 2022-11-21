import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';

export enum ResourceType {
	Image,
	GLTF
}

export type ResourceJSONTypes = "image" | "text";
export type ResourceJSON = Record<string, {url: string; type: ResourceJSONTypes}>

export interface ResourceRequest {
	url: string;
	type: ResourceType;
}

export default new class ResourceManager {
	private resources: Map<string, any> = new Map();
	private requests: Map<string, ResourceRequest> = new Map();

	public add(name: string, url: string, type: ResourceType): void {
		this.requests.set(name, {url, type});
	}

	public addFromJSON(resources: ResourceJSON): void {
		for (const [name, record] of Object.entries(resources)) {
			const type = ResourceManager.getResourceTypeFromString(record.type);

			this.add(name, record.url, type);
		}
	}

	public get(name: string): any {
		return this.resources.get(name);
	}

	public async load(
		{
			onFileLoad
		}: {
			onFileLoad: (loaded: number, total: number) => void;
		}
	): Promise<void> {
		let loaded = 0;
		const total = this.requests.size;

		return new Promise<void>(resolve => {
			for (const [name, request] of this.requests.entries()) {
				let promise: Promise<any> = null;

				switch (request.type) {
					case ResourceType.Image: {
						promise = this.loadImage(request.url);
						break;
					}
					case ResourceType.GLTF: {
						promise = this.loadGLTF(request.url);
						break;
					}
				}

				if (promise) {
					promise.then(r => {
						this.resources.set(name, r);
						onFileLoad(++loaded, total);

						if (loaded === total) {
							resolve();
						}
					});
				}
			}
		});
	}

	private async loadImage(url: string): Promise<HTMLImageElement> {
		return new Promise<any>(resolve => {
			const image = new Image();

			image.crossOrigin = "anonymous";
			image.onload = (): void => {
				resolve(image);
			};

			image.src = url;
		});
	}

	private async loadGLTF(url: string): Promise<HTMLImageElement> {
		return await load(url, GLTFLoader);
	}

	private static getResourceTypeFromString(str: string): ResourceType {
		switch (str) {
			case 'image':
				return ResourceType.Image;
			case 'gltf':
				return ResourceType.GLTF;
		}

		throw new Error(`Unknown resource type: ${str}`);
	}
};