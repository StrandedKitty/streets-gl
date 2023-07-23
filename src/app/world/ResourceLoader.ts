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

export default new class ResourceLoader {
	private resources: Map<string, any> = new Map();
	private requests: Map<string, ResourceRequest> = new Map();

	public add(name: string, url: string, type: ResourceType): void {
		this.requests.set(name, {url, type});
	}

	public addFromJSON(resources: ResourceJSON): void {
		for (const [name, record] of Object.entries(resources)) {
			const type = ResourceLoader.getResourceTypeFromString(record.type);

			if (name.startsWith('aircraft')) {
				// Skip aircraft models as they are unused for now
				continue;
			}

			this.add(name, record.url, type);
		}
	}

	public get(name: string): any {
		return this.resources.get(name);
	}

	public async load(
		{
			onFileLoad,
			onLoadedFileNameChange
		}: {
			onFileLoad: (loaded: number, total: number) => void;
			onLoadedFileNameChange: (name: string) => void;
		}
	): Promise<void> {
		let loaded = 0;
		const total = this.requests.size;

		return new Promise<void>(async resolve => {
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

				onLoadedFileNameChange(request.url);

				const r = await promise;

				this.resources.set(name, r);
				onFileLoad(++loaded, total);

				if (loaded === total) {
					onLoadedFileNameChange('');
					resolve();
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
