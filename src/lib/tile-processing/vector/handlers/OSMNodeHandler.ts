import {NodeElement} from "~/lib/tile-processing/vector/providers/OverpassDataObject";
import VectorNode from "~/lib/tile-processing/vector/features/VectorNode";
import VectorArea, {VectorAreaRing, VectorAreaRingType} from "~/lib/tile-processing/vector/features/VectorArea";
import OSMHandler from './OSMHandler';
import OSMReference, {OSMReferenceType} from "~/lib/tile-processing/vector/features/OSMReference";
import {cleanupTags} from "~/lib/tile-processing/vector/utils";
import Vec2 from "~/lib/math/Vec2";
import NodeQualifierFactory from "~/lib/tile-processing/vector/qualifiers/factories/NodeQualifierFactory";
import {VectorFeature} from "~/lib/tile-processing/vector/features/VectorFeature";
import {QualifierType} from "~/lib/tile-processing/vector/qualifiers/Qualifier";
import {ModifierType} from "~/lib/tile-processing/vector/qualifiers/modifiers";

export default class OSMNodeHandler implements OSMHandler {
	private readonly x: number;
	private readonly y: number;
	private readonly osmElement: NodeElement;
	private readonly tags: Record<string, string>;
	private disableFeatureOutput: boolean = false;

	private cachedFeatures: VectorFeature[] = null;
	private cachedStructuralFeature: VectorNode = null;

	public constructor(osmElement: NodeElement, x: number, y: number) {
		this.x = x;
		this.y = y;
		this.osmElement = osmElement;
		this.tags = cleanupTags(osmElement.tags);
	}

	private getFeaturesFromTags(): VectorFeature[] {
		const features: VectorFeature[] = [];
		const qualifiers = new NodeQualifierFactory().fromTags(this.tags);

		if (!qualifiers) {
			return features;
		}

		for (const qualifier of qualifiers) {
			switch (qualifier.type) {
				case QualifierType.Descriptor: {
					features.push({
						type: 'node',
						x: this.x,
						y: this.y,
						rotation: 0,
						osmReference: this.getOSMReference(),
						descriptor: qualifier.data
					});
					break;
				}
				case QualifierType.Modifier: {
					if (qualifier.data.type === ModifierType.CircleArea) {
						const ring = OSMNodeHandler.getCircleAreaRing(this.x, this.y, qualifier.data.radius);

						features.push({
							type: 'area',
							osmReference: this.getOSMReference(),
							descriptor: qualifier.data.descriptor,
							rings: [ring]
						});
					} else {
						console.error(`Unexpected modifier ${qualifier.data.type}`);
					}
					break;
				}
			}
		}

		return features;
	}

	public getFeatures(): VectorFeature[] {
		if (!this.cachedFeatures) {
			this.cachedFeatures = this.getFeaturesFromTags();
		}

		return this.cachedFeatures;
	}

	public getStructuralFeature(): VectorNode {
		if (!this.cachedStructuralFeature) {
			this.cachedStructuralFeature = {
				type: 'node',
				x: this.x,
				y: this.y,
				rotation: 0,
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

	public markAsBuildingPartInRelation(): void {

	}

	private static getCircleAreaRing(x: number, y: number, radius: number): VectorAreaRing {
		const nodes: VectorNode[] = [];
		const nodeCount = 16;

		for (let i = 0; i < 16; i++) {
			const progress = i / nodeCount;
			const rotation = Math.PI * 2 * progress;
			const pos = Vec2.rotate(new Vec2(radius, 0), rotation);

			nodes.push({
				type: 'node',
				x: x + pos.x,
				y: y + pos.y,
				osmReference: null,
				descriptor: null,
				rotation: 0
			});
		}

		nodes.push(nodes[0]);

		return {
			type: VectorAreaRingType.Outer,
			nodes
		};
	}
}