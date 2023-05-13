import VectorArea, {VectorAreaRing, VectorAreaRingType} from "~/lib/tile-processing/vector/features/VectorArea";
import {GeoJSON} from "geojson";
import AABB2D from "~/lib/math/AABB2D";
import Vec2 from "~/lib/math/Vec2";
// @ts-ignore
import PolyBool from "polybooljs";

const OutlineDiscardThreshold: number = 0.1;

export default class VectorBuildingOutlinesCleaner {
	private boundingBoxMap: Map<VectorArea, AABB2D> = new Map();
	private geoJSONMap: Map<VectorArea, GeoJSON.MultiPolygon> = new Map();

	public deleteBuildingOutlines(areas: VectorArea[]): VectorArea[] {
		const {parts, outlines} = this.getPartsAndOutlinesFromAreas(areas);
		const outlinesToDelete: Set<VectorArea> = new Set();

		for (const outline of outlines) {
			const outlineGeoJSON = this.getAreaGeoJSON(outline);
			const area = VectorBuildingOutlinesCleaner.getMultiPolygonArea(outlineGeoJSON);

			for (const part of parts) {
				if (!this.isBoundingBoxesIntersect(outline, part)) {
					continue;
				}

				this.subtractPartFromOutline(outline, part);
			}

			const newArea = VectorBuildingOutlinesCleaner.getMultiPolygonArea(outlineGeoJSON);

			if (newArea / area < OutlineDiscardThreshold) {
				outlinesToDelete.add(outline);
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

	private isBoundingBoxesIntersect(outline: VectorArea, part: VectorArea): boolean {
		const outlineBox = this.getAreaBoundingBox(outline);
		const partBox = this.getAreaBoundingBox(part);

		return outlineBox.intersectsAABB(partBox);
	}

	private subtractPartFromOutline(outline: VectorArea, part: VectorArea): void {
		const outlineGeoJSON = this.getAreaGeoJSON(outline);
		const partGeoJSON = this.getAreaGeoJSON(part);

		if (partGeoJSON.coordinates.length === 0 && outlineGeoJSON.coordinates.length === 0) {
			return;
		}

		try {
			const intersection = this.executePolygonDifference(outlineGeoJSON, partGeoJSON);

			if (intersection) {
				outlineGeoJSON.coordinates = intersection.coordinates;
				outlineGeoJSON.type = intersection.type;
			}
		} catch (e) {
			VectorBuildingOutlinesCleaner.logError(part.osmReference.id, outline.osmReference.id);
			console.error(e);
		}
	}

	private executePolygonDifference(
		outline: GeoJSON.MultiPolygon,
		part: GeoJSON.MultiPolygon
	): GeoJSON.MultiPolygon {
		const outlinePolygon = PolyBool.polygonFromGeoJSON(outline);
		const partPolygon = PolyBool.polygonFromGeoJSON(part);

		let result = null

		try {
			result = PolyBool.difference(outlinePolygon, partPolygon);
		} catch (e) {
			console.error(e);
		}

		if (result) {
			const geoJSON = PolyBool.polygonToGeoJSON(result);
			const multipolygon: GeoJSON.MultiPolygon = {
				type: "MultiPolygon",
				coordinates: []
			};

			if (geoJSON.type === 'Polygon') {
				multipolygon.coordinates.push(geoJSON.coordinates);
			}

			if (geoJSON.type === 'MultiPolygon') {
				multipolygon.coordinates = geoJSON.coordinates;
			}

			return multipolygon;
		}

		return null;
	}

	private static logError(partId: number, outlineId: number): void {
		console.error(`Building-building:part intersection test failed for part №${partId} and outline №${outlineId}`);
	}

	private static getMultiPolygonArea(multiPolygon: GeoJSON.MultiPolygon): number {
		let totalArea = 0;

		for (const polygon of multiPolygon.coordinates) {
			totalArea += VectorBuildingOutlinesCleaner.getPolygonArea({type: "Polygon", coordinates: polygon});
		}

		return totalArea;
	}

	private static getPolygonArea(polygon: GeoJSON.Polygon): number {
		if (polygon.coordinates.length === 0) {
			return 0;
		}

		const [outerRing, ...innerRings] = polygon.coordinates;

		let area = VectorBuildingOutlinesCleaner.getRingArea(outerRing);

		for (const innerRing of innerRings) {
			area -= VectorBuildingOutlinesCleaner.getRingArea(innerRing);
		}

		return area;
	}

	private static getRingArea(ring: number[][]): number {
		let area = 0;

		for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
			const [xi, yi] = ring[i];
			const [xj, yj] = ring[j];
			area += xi * yj - xj * yi;
		}

		return Math.abs(area / 2);
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