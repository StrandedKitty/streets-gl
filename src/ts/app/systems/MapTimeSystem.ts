import System from "../System";
import SystemManager from "../SystemManager";
import ControlsSystem from "./ControlsSystem";
import MathUtils from "../../math/MathUtils";
import Vec3 from "../../math/Vec3";
const SunCalc = require('suncalc');

export default class MapTimeSystem extends System {
	public sunDirection: Vec3 = new Vec3();
	public sunIntensity: number = 0;

	constructor(systemManager: SystemManager) {
		super(systemManager);
	}

	public postInit() {

	}

	public update(deltaTime: number) {
		const latLon = this.systemManager.getSystem(ControlsSystem).getLatLon();
		const sunPosition = SunCalc.getPosition(Date.now(), latLon.lat, latLon.lon);

		this.sunDirection = MathUtils.sphericalToCartesian(sunPosition.azimuth + Math.PI, sunPosition.altitude);
		this.sunIntensity = this.sunDirection.y < 0 ? 5 : 0;
	}
}