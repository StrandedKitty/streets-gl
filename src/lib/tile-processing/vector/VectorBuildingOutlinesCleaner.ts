import * as martinez from "martinez-polygon-clipping";
import VectorArea, {VectorAreaRing, VectorAreaRingType} from "~/lib/tile-processing/vector/features/VectorArea";
import {GeoJSON} from "geojson";
import AABB2D from "~/lib/math/AABB2D";
import Vec2 from "~/lib/math/Vec2";

export default class VectorBuildingOutlinesCleaner {
	private boundingBoxMap: Map<VectorArea, AABB2D> = new Map();
	private geoJSONMap: Map<VectorArea, GeoJSON.MultiPolygon> = new Map();

	public deleteBuildingOutlines(areas: VectorArea[]): VectorArea[] {
		const {parts, outlines} = this.getPartsAndOutlinesFromAreas(areas);

		const outlinesToDelete: Set<VectorArea> = new Set();

		for (const outline of outlines) {
			for (const part of parts) {
				if (!this.intersectBoxes(outline, part)) {
					continue;
				}

				if (this.intersectPrecise(outline, part)) {
					outlinesToDelete.add(outline);
				}
			}
		}

		if (outlinesToDelete.size === 0) {
			return areas;
		}

		return areas.filter(area => !outlinesToDelete.has(area));
	}

	private getPartsAndOutlinesFromAreas(areas: VectorArea[]): {parts: VectorArea[]; outlines: VectorArea[]} {
		return {
			outlines: areas.filter(area => area.descriptor.type === 'building'),
			parts: areas.filter(area => {
				return area.descriptor.type === 'buildingPart' && !area.isBuildingPartInRelation
			})
		}
	}

	private getAreaBoundingBox(area: VectorArea): AABB2D {
		let box = this.boundingBoxMap.get(area);

		if (!box) {
			box = VectorBuildingOutlinesCleaner.getVectorAreaBoundingBox(area);
			this.boundingBoxMap.set(area, box);
		}

		return box;
	}

	private getAreaGeoJSON(area: VectorArea): GeoJSON.MultiPolygon {
		let geoJSON = this.geoJSONMap.get(area);

		if (!geoJSON) {
			geoJSON = VectorBuildingOutlinesCleaner.getVectorAreaGeoJSON(area);
			this.geoJSONMap.set(area, geoJSON);
		}

		return geoJSON;
	}

	private intersectBoxes(outline: VectorArea, part: VectorArea): boolean {
		const outlineBox = this.getAreaBoundingBox(outline);
		const partBox = this.getAreaBoundingBox(part);

		return outlineBox.intersectsAABB(partBox);
	}

	private intersectPrecise(outline: VectorArea, part: VectorArea): boolean {
		const outlineGeoJSON = this.getAreaGeoJSON(outline);
		const partGeoJSON = this.getAreaGeoJSON(part);

		if (partGeoJSON.coordinates.length === 0 && outlineGeoJSON.coordinates.length === 0) {
			return false;
		}

		try {
			const intersection = martinez.intersection(partGeoJSON.coordinates, outlineGeoJSON.coordinates);

			if (
				intersection &&
				intersection.length !== 0 &&
				VectorBuildingOutlinesCleaner.getMartinezIntersectionArea(intersection) > 1
			) {
				return true;
			}
		} catch (e) {
			VectorBuildingOutlinesCleaner.logError(part.osmReference.id, outline.osmReference.id);
		}

		return false;
	}

	private static logError(partId: number, outlineId: number): void {
		console.error(`Building-building:part intersection test failed for part №${partId} and outline №${outlineId}`);
	}

	private static getMartinezIntersectionArea(geometry: martinez.Geometry): number {
		let sum = 0;

		const vertices = geometry[0][0].slice(0, -1) as martinez.Position[];

		for (let i = 0; i < vertices.length; i++) {
			const point1 = vertices[i];
			const point2 = vertices[i + 1] || vertices[0];
			sum += (point2[0] - point1[0]) * (point2[1] + point1[1]);
		}

		return Math.abs(sum);
	}

	private static getVectorAreaGeoJSON(area: VectorArea): GeoJSON.MultiPolygon {
		const multipolygon: GeoJSON.MultiPolygon = {
			type: "MultiPolygon",
			coordinates: []
		};

		const inners: VectorAreaRing[] = [];

		for (const ring of area.rings) {
			if (ring.type === VectorAreaRingType.Inner) {
				inners.push(ring);
			}
		}

		for (const ring of area.rings) {
			if (ring.type === VectorAreaRingType.Outer) {
				const item: [number, number][][] = [ring.nodes.map(node => [node.x, node.y])];

				for (let j = 0; j < inners.length; j++) {
					item.push(inners[j].nodes.map(node => [node.x, node.y]));
				}

				multipolygon.coordinates.push(item);
			}
		}

		return multipolygon;
	}

	private static getVectorAreaBoundingBox(area: VectorArea): AABB2D {
		const aabb = new AABB2D();

		for (const ring of area.rings) {
			if (ring.type === VectorAreaRingType.Outer) {
				for (const node of ring.nodes) {
					aabb.includePoint(new Vec2(node.x, node.y));
				}
			}
		}

		return aabb;
	}
}