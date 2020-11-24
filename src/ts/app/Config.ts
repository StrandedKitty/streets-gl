import Utils from "./Utils";

const Config = {
	TileSize: 40075016.7 / (1 << 16),
	MaxConcurrentTiles: 100,
	WebWorkersNumber: navigator.hardwareConcurrency,
	ShadowCascades: 3,
	StartPosition: [37.663539, -122.418106],
	MinCameraDistance: 20,
	MaxCameraDistance: 2000,
	MinCameraPitch: 5,
	MaxCameraPitch: 89.99,
	IsMobileBrowser: Utils.isMobileBrowser()
}

export default Config;
