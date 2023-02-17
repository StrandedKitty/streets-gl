import OSMNodeHandler from "~/lib/tile-processing/vector/handlers/OSMNodeHandler";
import {WayElement} from "~/lib/tile-processing/vector/providers/OverpassDataObject";
import VectorArea, {VectorAreaRingType} from "~/lib/tile-processing/vector/features/VectorArea";
import VectorPolyline from "~/lib/tile-processing/vector/features/VectorPolyline";
import Handler from "~/lib/tile-processing/vector/handlers/Handler";
import {
	getAreaDescriptorFromTags,
	getPolylineDescriptorFromTags
} from "~/lib/tile-processing/vector/handlers/descriptors";
import {Ring} from "~/lib/tile-processing/vector/handlers/OSMRelationHandler";
import OSMReference, {OSMReferenceType} from "~/lib/tile-processing/vector/features/OSMReference";

export default class OSMWayHandler implements Handler {
	private readonly osmElement: WayElement;
	private readonly tags: Record<string, string>;
	private readonly nodes: OSMNodeHandler[];
	private disableFeatureOutput: boolean = false;

	private cachedFeatures: (VectorArea | VectorPolyline)[] = null;
	private cachedStructuralFeature: VectorPolyline = null;

	public constructor(osmElement: WayElement, nodes: OSMNodeHandler[]) {
		this.osmElement = osmElement;
		this.tags = osmElement.tags ?? {};
		this.nodes = nodes;

		if (nodes.some(n => !n)) {
			debugger;
		}
	}

	private isClosed(): boolean {
		return this.nodes[0] === this.nodes[this.nodes.length - 1];
	}

	public preventFeatureOutput(): void {
		this.disableFeatureOutput = true;
	}

	public getFeatures(): (VectorArea | VectorPolyline)[] {
		if (this.disableFeatureOutput) {
			return [];
		}

		if (!this.cachedFeatures) {
			const features: (VectorArea | VectorPolyline)[] = [];

			const polylineDesc = getPolylineDescriptorFromTags(this.tags);

			if (polylineDesc) {
				features.push({
					type: 'polyline',
					osmReference: this.getOSMReference(),
					descriptor: polylineDesc,
					nodes: this.nodes.map(n => n.getStructuralFeature())
				});
			}

			if (this.isClosed()) {
				const areaDesc = getAreaDescriptorFromTags(this.tags);

				if (areaDesc) {
					const ring = new Ring(
						this.nodes.map(n => n.getStructuralFeature()),
						VectorAreaRingType.Outer
					);
					ring.fixDirection();

					features.push({
						type: 'area',
						osmReference: this.getOSMReference(),
						descriptor: areaDesc,
						rings: [ring.getVectorAreaRing()]
					});
				}
			}

			this.cachedFeatures = features;
		}

		return this.cachedFeatures;
	}

	public getStructuralFeature(): VectorPolyline {
		if (!this.cachedStructuralFeature) {
			this.cachedStructuralFeature = {
				type: 'polyline',
				osmReference: null,
				descriptor: null,
				nodes: this.nodes.map(n => n.getStructuralFeature())
			};
		}

		return this.cachedStructuralFeature;
	}

	private getOSMReference(): OSMReference {
		return {
			type: OSMReferenceType.Way,
			id: this.osmElement.id
		};
	}
}