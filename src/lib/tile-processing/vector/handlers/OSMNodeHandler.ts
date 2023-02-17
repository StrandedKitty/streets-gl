import {NodeElement} from "~/lib/tile-processing/vector/providers/OverpassDataObject";
import VectorNode from "~/lib/tile-processing/vector/features/VectorNode";
import VectorArea from "~/lib/tile-processing/vector/features/VectorArea";
import Handler from './Handler';
import OSMReference, {OSMReferenceType} from "~/lib/tile-processing/vector/features/OSMReference";
import {getNodeDescriptorFromTags} from "~/lib/tile-processing/vector/handlers/descriptors";

export default class OSMNodeHandler implements Handler {
	private readonly x: number;
	private readonly y: number;
	private readonly osmElement: NodeElement;
	private readonly tags: Record<string, string>;
	private disableFeatureOutput: boolean = false;

	private cachedFeatures: (VectorNode | VectorArea)[] = null;
	private cachedStructuralFeature: VectorNode = null;

	public constructor(osmElement: NodeElement, x: number, y: number) {
		this.x = x;
		this.y = y;
		this.osmElement = osmElement;
		this.tags = osmElement.tags ?? {};
	}

	public getFeatures(): (VectorNode | VectorArea)[] {
		if (!this.cachedFeatures) {
			const descriptor = getNodeDescriptorFromTags(this.tags);

			if (descriptor && descriptor.type) {
				this.cachedFeatures = [{
					type: 'node',
					x: this.x,
					y: this.y,
					osmReference: this.getOSMReference(),
					descriptor: getNodeDescriptorFromTags(this.tags)
				}];
			} else {
				this.cachedFeatures = [];
			}
		}

		return this.cachedFeatures;
	}

	public getStructuralFeature(): VectorNode {
		if (!this.cachedStructuralFeature) {
			this.cachedStructuralFeature = {
				type: 'node',
				x: this.x,
				y: this.y,
				osmReference: null,
				descriptor: null
			};
		}

		return this.cachedStructuralFeature;
	}

	private getOSMReference(): OSMReference {
		return {
			type: OSMReferenceType.Node,
			id: this.osmElement.id
		};
	}

	public preventFeatureOutput(): void {
		this.disableFeatureOutput = true;
	}
}