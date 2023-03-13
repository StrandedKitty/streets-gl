export interface VectorNodeDescriptor {
	name?: string;
	type?: 'tree' | 'hydrant' | 'transmissionTower' | 'utilityPole' | 'artwork' | 'adColumn';
	direction?: number;
}

export interface VectorPolylineDescriptor {
	name?: string;
	type: 'path' | 'fence' | 'hedge' | 'powerLine';
	pathType?: 'roadway' | 'footway' | 'cycleway' | 'railway' | 'tramway';
	width?: number;
	height?: number;
	minHeight?: number;
	embeddedFootway?: boolean;
	embeddedFootwayWidth?: boolean;
	lanesForward?: number;
	lanesBackward?: number;
}

export interface VectorAreaDescriptor {
	name?: string;
	type: 'building' | 'buildingPart' | 'roadway' | 'footway' | 'water' | 'farmland' | 'sand' | 'rock' | 'pitch' | 'manicuredGrass';
	pitchType?: 'football' | 'basketball' | 'tennis';
	buildingLevels?: number;
	buildingHeight?: number;
	buildingMinHeight?: number;
	buildingRoofHeight?: number;
	buildingRoofType?: 'flat' | 'hipped' | 'gabled' | 'pyramidal' | 'skillion' | 'mansard' | 'quadrupleSaltbox';
	buildingRoofOrientation?: 'along' | 'across';
	buildingRoofDirection?: number;
	buildingRoofAngle?: number;
	buildingFacadeMaterial?: 'plaster' | 'brick' | 'wood' | 'glass' | 'mirror' | 'cementBlock';
	buildingFacadeColor?: number;
	buildingRoofMaterial?: 'default' | 'tiles' | 'metal' | 'concrete' | 'thatch' | 'eternit' | 'grass' | 'glass' | 'tar';
	buildingRoofColor?: number;
	buildingWindows?: boolean;
}