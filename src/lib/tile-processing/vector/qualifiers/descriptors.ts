import {OMBBResult} from "~/lib/tile-processing/tile3d/builders/Tile3DMultipolygon";

export interface VectorNodeDescriptor {
	type?: 'tree' | 'rock' | 'hydrant' | 'transmissionTower' | 'utilityPole' | 'artwork' | 'adColumn' | 'windTurbine' |
	'bench' | 'picnicTable' | 'busStop' | 'memorial' | 'statue' | 'sculpture';
	treeType?: 'genericBroadleaved' | 'genericNeedleleaved' | 'beech' | 'fir' | 'linden' | 'oak';
	direction?: number;
	height?: number;
	minHeight?: number;
}

export interface VectorPolylineDescriptor {
	type: 'path' | 'fence' | 'wall' | 'powerLine' | 'waterway';
	pathType?: 'roadway' | 'footway' | 'cycleway' | 'railway' | 'tramway' | 'runway';
	wallType?: 'stone' | 'concrete' | 'hedge';
	pathMaterial?: 'asphalt' | 'concrete' | 'dirt' | 'sand' | 'gravel' | 'cobblestone' | 'wood';
	isRoadwayMarked?: boolean;
	fenceMaterial?: 'wood' | 'chainLink' | 'metal' | 'concrete';
	width?: number;
	height?: number;
	minHeight?: number;
	lanesForward?: number;
	lanesBackward?: number;
	side?: 'both' | 'left' | 'right';
}

export interface VectorAreaDescriptor {
	label?: string;
	type: 'building' | 'buildingPart' | 'asphalt' | 'roadwayIntersection' | 'pavement' | 'water' | 'farmland' |
		'grass' | 'sand' | 'rock' | 'pitch' | 'manicuredGrass' | 'helipad' | 'forest' | 'garden' | 'construction' |
		'buildingConstruction' | 'shrubbery' | 'roadwayArea';
	intersectionMaterial?: 'asphalt' | 'concrete' | 'cobblestone';
	pitchType?: 'generic' | 'football' | 'basketball' | 'tennis';
	buildingLevels?: number;
	buildingHeight?: number;
	buildingMinHeight?: number;
	buildingRoofHeight?: number;
	buildingRoofType?: 'flat' | 'hipped' | 'gabled' | 'gambrel' | 'pyramidal' | 'onion' | 'dome' | 'round' |
		'skillion' | 'mansard' | 'quadrupleSaltbox' | 'saltbox';
	buildingRoofOrientation?: 'along' | 'across';
	buildingRoofDirection?: number;
	buildingRoofAngle?: number;
	buildingFacadeMaterial?: 'plaster' | 'brick' | 'wood' | 'glass' | 'cementBlock';
	buildingFacadeColor?: number;
	buildingRoofMaterial?: 'default' | 'tiles' | 'metal' | 'concrete' | 'thatch' | 'eternit' | 'grass' | 'glass' |
		'tar';
	buildingRoofColor?: number;
	buildingWindows?: boolean;
	buildingFoundation?: boolean;
	ombb?: OMBBResult;
}

export type VectorDescriptor = VectorNodeDescriptor | VectorAreaDescriptor | VectorPolylineDescriptor;