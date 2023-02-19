export default interface OverpassDataObject {
	version: number;
	generator: string;
	osm3s: {
		timestamp_osm_base: string;
		copyright: string;
	};
	elements: (NodeElement | WayElement | RelationElement)[];
}

export type Tags = Record<string, string>;

export interface Element {
	type: 'node' | 'way' | 'relation';
	id: number;
	tags?: Tags;
}

export interface NodeElement extends Element {
	type: 'node';
	lat: number;
	lon: number;
}

export interface WayElement extends Element {
	type: 'way';
	nodes: number[];
}

export interface RelationElement extends Element {
	type: 'relation';
	members: RelationMember[];
}

export interface RelationMember {
	type: 'node' | 'way' | 'relation';
	ref: number;
	role: string;
}