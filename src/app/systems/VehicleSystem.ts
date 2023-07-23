import System from "../System";
import Vec2 from "~/lib/math/Vec2";
import MathUtils from "~/lib/math/MathUtils";
import SettingsSystem from "~/app/systems/SettingsSystem";
import TerrainSystem from "~/app/systems/TerrainSystem";
import SceneSystem from "~/app/systems/SceneSystem";
import Config from "~/app/Config";
import Aircraft, {
	AircraftPart,
	AircraftPartType,
	AircraftPosition,
	AircraftType
} from "~/app/vehicles/aircraft/Aircraft";

interface QueryAircraft {
	id: string;
	lat: number;
	lon: number;
	altitude: number;
	heading: number;
	type: string;
	onGround: boolean;
	timestamp: number;
}

interface QueryVessel {
	id: string;
	lat: number;
	lon: number;
	heading: number;
	a: number;
	b: number;
	c: number;
	d: number;
}

interface AircraftState {
	x: number;
	y: number;
	altitude: number;
	heading: number;
	onGround: boolean;
	timestamp: number;
}
interface VehiclesQueryResponse {
	timestamp: number;
	aircraft: QueryAircraft[][];
	vessels: QueryVessel[];
}

const QueryInterval = 10000;
const AircraftRollbackTime = 20000;

export default class VehicleSystem extends System {
	public readonly aircraftMap: Map<string, Aircraft> = new Map();
	private lastUpdateTimestamp: number = 0;
	private serverTimeOffset: number = null;
	private enabled: boolean = false;
	private lockAircraftPositions: boolean = false;
	public aircraftPartsBuffers: Map<AircraftPartType, Float32Array> = new Map();

	public postInit(): void {
		this.listenToSettings();
		this.startTimer();
		this.addListeners();
	}

	private addListeners(): void {
		window.addEventListener('keydown', (e: KeyboardEvent): void => {
			if (e.code === 'KeyB' && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();

				this.lockAircraftPositions = !this.lockAircraftPositions;
			}
		});
	}

	private listenToSettings(): void {
		const settings = this.systemManager.getSystem(SettingsSystem).settings;

		/*settings.onChange('airTraffic', ({statusValue}) => {
			this.enabled = statusValue === 'on';
		}, true);*/
	}

	private startTimer(): void {
		const fn = (): void => {
			if (this.enabled) {
				this.fetchData();
			}
		};

		setTimeout(fn, 0);
		setInterval(fn, QueryInterval);
	}

	public update(deltaTime: number): void {
		for (const aircraft of this.aircraftMap.values()) {
			this.updateAircraftPosition(aircraft);
		}
	}

	public updateBuffers(origin: Vec2): void {
		const combinedParts: Map<AircraftPartType, AircraftPart[]> = new Map();

		for (const aircraft of this.aircraftMap.values()) {
			const parts = aircraft.getParts();

			for (const part of parts) {
				if (!combinedParts.get(part.type)) {
					combinedParts.set(part.type, []);
				}

				combinedParts.get(part.type).push(part);
			}
		}

		this.aircraftPartsBuffers.clear();

		for (const [type, parts] of combinedParts.entries()) {
			this.aircraftPartsBuffers.set(type, VehicleSystem.getBufferFromAircraftParts(parts, origin));
		}
	}

	private static getBufferFromAircraftParts(parts: AircraftPart[], origin: Vec2): Float32Array {
		const buffer = new Float32Array(parts.length * 6);

		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];

			buffer[i * 6] = part.position.x - origin.x;
			buffer[i * 6 + 1] = part.position.y;
			buffer[i * 6 + 2] = part.position.z - origin.y;
			buffer[i * 6 + 3] = part.rotation.x;
			buffer[i * 6 + 4] = part.rotation.y;
			buffer[i * 6 + 5] = part.rotation.z;
		}

		return buffer;
	}

	public async fetchData(): Promise<void> {
		const camera = this.systemManager.getSystem(SceneSystem).objects.camera;
		const normalizedPosition = MathUtils.meters2tile(camera.position.x, camera.position.z, 0);

		fetch(`${Config.TileServerEndpoint}/vehicles/${normalizedPosition.x}/${normalizedPosition.y}`, {
			method: 'GET'
		}).then(async r => {
			const response: VehiclesQueryResponse = await r.json();

			if (this.serverTimeOffset === null) {
				this.serverTimeOffset = response.timestamp - Date.now();
			}

			this.handleQueryResponse(response);
		}).catch(() => {
			console.warn('Failed to fetch vehicles');
		});
	}

	private handleQueryResponse(response: VehiclesQueryResponse): void {
		for (const aircraft of this.aircraftMap.values()) {
			aircraft.isUpdatedTemp = false;
		}

		for (const aircraftData of response.aircraft) {
			const id = aircraftData[0].id;
			const states = aircraftData.map(VehicleSystem.convertQueryAircraftToAircraftState);
			let aircraft = this.aircraftMap.get(id);

			if (!aircraft) {
				const type = VehicleSystem.getAircraftType(aircraftData[0]);

				aircraft = new Aircraft(type);
				this.aircraftMap.set(id, aircraft);
			}

			aircraft.update(states);
		}

		for (const [key, aircraft] of this.aircraftMap.entries()) {
			if (!aircraft.isUpdatedTemp && !this.lockAircraftPositions) {
				this.aircraftMap.delete(key);
			}
		}

		this.lastUpdateTimestamp = Date.now();
	}

	private updateAircraftPosition(aircraft: Aircraft): void {
		if (this.lockAircraftPositions && aircraft.position) {
			return;
		}

		aircraft.position = this.lerpAircraftStates(aircraft.states);
	}

	private lerpAircraftStates(states: AircraftState[]): AircraftPosition {
		const heightProvider = this.systemManager.getSystem(TerrainSystem).terrainHeightProvider;
		const serverTime = Date.now() + this.serverTimeOffset - AircraftRollbackTime;

		if (states.length > 1) {
			for (let i = 0; i < states.length - 1; i++) {
				const a = states[i];
				const b = states[i + 1];

				if (serverTime >= a.timestamp && serverTime < b.timestamp) {
					const progress = (serverTime - a.timestamp) / (b.timestamp - a.timestamp);
					const lerpedX = MathUtils.lerp(a.x, b.x, progress);
					const lerpedY = MathUtils.lerp(a.y, b.y, progress);
					const height = this.getActualAltitude(a, b, progress);
					const lerpedHeading = MathUtils.lerpAngle(a.heading, b.heading, progress);
					const groundHeight = heightProvider.getHeightGlobalInterpolated(lerpedX, lerpedY, true);

					return {
						x: lerpedX,
						y: lerpedY,
						height: height,
						heading: lerpedHeading,
						onGround: height <= groundHeight
					};
				}
			}
		}

		const lastState = states[states.length - 1];
		const groundHeight = heightProvider.getHeightGlobalInterpolated(lastState.x, lastState.y, true);
		const height = this.getActualAltitude(lastState, lastState, 0);

		return {
			x: lastState.x,
			y: lastState.y,
			height: this.getActualAltitude(lastState, lastState, 0),
			heading: lastState.heading,
			onGround: height <= groundHeight
		};
	}

	private getActualAltitude(
		stateFrom: AircraftState,
		stateTo: AircraftState,
		progress: number
	): number {
		const heightProvider = this.systemManager.getSystem(TerrainSystem).terrainHeightProvider;
		const x = MathUtils.lerp(stateFrom.x, stateTo.x, progress);
		const y = MathUtils.lerp(stateFrom.y, stateTo.y, progress);

		const mercatorScale = MathUtils.getMercatorScaleFactor(MathUtils.meters2degrees(x, y).lat);
		const height = heightProvider.getHeightGlobalInterpolated(x, y, true);
		const lerpedAltitude = MathUtils.lerp(stateFrom.altitude, stateTo.altitude, progress);
		const correctedAltitude = lerpedAltitude * mercatorScale;

		if (stateFrom.onGround && stateTo.onGround) {
			return height ?? correctedAltitude;
		}

		if (stateFrom.onGround && !stateTo.onGround) {
			let heightFrom = heightProvider.getHeightGlobalInterpolated(stateFrom.x, stateFrom.y, true);
			const heightTo = stateTo.altitude * mercatorScale;

			if (heightFrom === null) {
				heightFrom = stateFrom.altitude * mercatorScale;
			}

			return MathUtils.lerp(heightFrom, heightTo, progress);
		}

		if (!stateFrom.onGround && stateTo.onGround) {
			const heightFrom = stateFrom.altitude * mercatorScale;
			let heightTo = heightProvider.getHeightGlobalInterpolated(stateTo.x, stateTo.y, true);

			if (heightTo === null) {
				heightTo = stateTo.altitude * mercatorScale;
			}

			return MathUtils.lerp(heightFrom, heightTo, progress);
		}

		if (height === null || correctedAltitude > height) {
			return correctedAltitude;
		}

		return height;
	}

	private static convertQueryAircraftToAircraftState(query: QueryAircraft): AircraftState {
		const {x, y} = MathUtils.degrees2meters(query.lat, query.lon);
		return {
			x,
			y,
			altitude: query.altitude,
			heading: MathUtils.toRad(-query.heading),
			onGround: query.onGround,
			timestamp: query.timestamp
		};
	}

	private static getAircraftType(state: QueryAircraft): AircraftType {
		switch (state.type) {
			case 'B738':
			case 'B737':
			case 'B38M':
			case 'E75L':
			case 'B739':
			case 'B77W':
			case 'B763':
			case 'B789':
			case 'E190':
			case 'B752':
			case 'B77L':
			case 'B788':
			case 'BCS3':
			case 'B744':
			case 'B772':
			case 'B39M':
				return AircraftType.B777;
			case 'A320':
			case 'A321':
			case 'A20N':
			case 'A319':
			case 'A21N':
			case 'A359':
			case 'A333':
			case 'A332':
				return AircraftType.A321;
			case 'C172':
			case 'P28A':
			case 'PC12':
			case 'C208':
			case 'SR22':
			case 'C152':
			case 'SR20':
			case 'C182':
			case 'DA40':
			case 'C72R':
			case 'GLID':
			case 'M20P':
			case 'BE36':
				return AircraftType.Cessna208;
			case 'CRJ9':
			case 'E55P':
			case 'CRJ7':
			case 'BE20':
			case 'C56X':
			case 'CL30':
			case 'CRJ2':
			case 'C68A':
			case 'C25A':
				return AircraftType.ERJ135;
			case 'EC35':
			case 'R44':
			case 'A169':
			case 'AS55':
			case 'A139':
			case 'EC75':
			case 'B407':
			case 'AS50':
			case 'H60':
			case 'R66':
			case 'S76':
			case 'B06':
			case 'B429':
			case 'H500':
			case 'R22':
			case 'AS65':
			case 'EC30':
				return AircraftType.Helicopter;
		}

		return AircraftType.A321;
	}
}
