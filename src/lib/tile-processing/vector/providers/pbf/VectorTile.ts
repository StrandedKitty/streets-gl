export namespace VectorTile {
	export type FeatureTags = Record<string, string | number | boolean>;
	export type Point = [number, number];
	export type PointGeometry = Point[];
	export type LineStringGeometry = Point[][];
	export type PolygonRingGeometry = Point[];
	export type PolygonGeometry = PolygonRingGeometry[];

	export interface Tile {
		layers: Map<string, Layer>;
	}

	export interface Layer {
		features: Feature[];
	}

	export enum FeatureType {
		Point,
		LineString,
		Polygon
	}

	interface BaseFeature {
		id: number;
		type: FeatureType;
		tags: FeatureTags;
	}

	export interface PointFeature extends BaseFeature {
		type: FeatureType.Point;
		geometry: PointGeometry;
	}

	export interface LineStringFeature extends BaseFeature {
		type: FeatureType.LineString;
		geometry: LineStringGeometry;
	}

	export interface PolygonFeature extends BaseFeature {
		type: FeatureType.Polygon;
		geometry: PolygonGeometry;
	}

	export type Feature = PointFeature | LineStringFeature | PolygonFeature;
}