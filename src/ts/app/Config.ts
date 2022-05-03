import Utils from "./Utils";

const Config = {
	TileSize: /*40075016.7 / (1 << 16)*/ 611.4962158203125,
	GroundSegments: 16,
	MaxConcurrentTiles: 100,
	MaxTilesPerWorker: 2,
	WebWorkersNumber: Math.min(6, navigator.hardwareConcurrency),
	ShadowCascades: 3,
	StartPosition: [40.76050, -73.98088],
	MinCameraDistance: 20,
	MaxCameraDistance: 3000,
	CameraZoomSmoothing: 0.4,
	CameraSteps: 16,
	MinCameraPitch: 5,
	MaxCameraPitch: 89.99,
	IsMobileBrowser: Utils.isMobileBrowser(),
	MinTexturedRoofArea: 50,
	MaxTexturedRoofAABBArea: 2e6,
	BuildingSmoothNormalsThreshold: 30,
	LightTransitionDuration: 1,
	OverpassRequestTimeout: 10000,
	DoFCoCScale: 4,
	DoFFocusScale: 2,
	DoFBokehRadius: 5,
	devicePixelRatio: 1
};

export default Config;
