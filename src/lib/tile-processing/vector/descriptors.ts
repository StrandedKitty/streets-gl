export interface VectorNodeDescriptor {
	type?: 'tree' | 'hydrant' | 'transmissionTower' | 'utilityPole' | 'artwork' | 'adColumn';
	direction?: number;
}

export interface VectorPolylineDescriptor {
	type: 'path' | 'fence' | 'hedge' | 'powerLine';
	pathType?: 'roadway' | 'footway' | 'cycleway' | 'railway' | 'tramway' | 'runway';
	pathMaterial?: 'asphalt' | 'concrete' | 'dirt' | 'sand' | 'gravel' | 'cobblestone' | 'wood';
	width?: number;
	height?: number;
	minHeight?: number;
	lanesForward?: number;
	lanesBackward?: number;
	side?: 'both' | 'left' | 'right';
}

export interface VectorAreaDescriptor {
	label?: string;
	type: 'building' | 'buildingPart' | 'roadway' | 'roadwayIntersection' | 'footway' | 'water' | 'farmland' | 'sand' | 'rock' | 'pitch' | 'manicuredGrass';
	intersectionMaterial?: 'asphalt' | 'concrete';
	pitchType?: 'football' | 'basketball' | 'tennis';
	buildingLevels?: number;
	buildingHeight?: number;
	buildingMinHeight?: number;
	buildingRoofHeight?: number;
	buildingRoofType?: 'flat' | 'hipped' | 'gabled' | 'pyramidal' | 'onion' | 'dome' | 'round' | 'skillion' | 'mansard' | 'quadrupleSaltbox';
	buildingRoofOrientation?: 'along' | 'across';
	buildingRoofDirection?: number;
	buildingRoofAngle?: number;
	buildingFacadeMaterial?: 'plaster' | 'brick' | 'wood' | 'glass' | 'mirror' | 'cementBlock';
	buildingFacadeColor?: number;
	buildingRoofMaterial?: 'default' | 'tiles' | 'metal' | 'concrete' | 'thatch' | 'eternit' | 'grass' | 'glass' | 'tar';
	buildingRoofColor?: number;
	buildingWindows?: boolean;
}