import Utils from "./Utils";

const Config = {
	TileSize: /*40075016.7 / (1 << 16)*/ 611.4962158203125,
	GroundSegments: 32,
	MaxConcurrentTiles: 100,
	MaxTilesPerWorker: 2,
	WebWorkersNumber: navigator.hardwareConcurrency,
	ShadowCascades: 3,
	StartPosition: [40.76050, -73.98088],
	MinCameraDistance: 20,
	MaxCameraDistance: 2000,
	MinCameraPitch: 5,
	MaxCameraPitch: 89.99,
	IsMobileBrowser: Utils.isMobileBrowser(),
	MinTexturedRoofArea: 50,
	MaxTexturedRoofAABBArea: 2e6,
	BuildingSmoothNormalsThreshold: 20,
	LightTransitionDuration: 1,
	OverpassRequestTimeout: 10000
}

export default Config;
