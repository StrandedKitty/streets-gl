import System from "../System";
import SystemManager from "../SystemManager";
import TileSystem from "./TileSystem";
import Vec2 from "~/lib/math/Vec2";
import MathUtils from "~/lib/math/MathUtils";
import HeightProvider from "../world/HeightProvider";

interface QueryAircraft {
	id: string;
	lat: number;
	lon: number;
	altitude: number;
	heading: number;
	type: string;
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
}

interface AircraftEntry {
	type: number;
	prevState: AircraftState;
	targetState: AircraftState;
	lastLerpedState: AircraftState;
	isUpdatedTemp: boolean;
}

interface VehiclesQueryResponse {
	aircraft: QueryAircraft[][];
	vessels: QueryVessel[];
}

const QueryInterval = 10000;

export default class VehicleSystem extends System {
	public aircraftMap: Map<string, AircraftEntry> = new Map();
	private lastUpdateTimestamp: number = 0;

	public constructor(systemManager: SystemManager) {
		super(systemManager);

		setInterval(() => {
			this.fetchData();
		}, QueryInterval);
	}

	public postInit(): void {

	}

	public update(deltaTime: number): void {

	}

	private getLoadedTilesBoundingBox(): number[] {
		const tileSystem = this.systemManager.getSystem(TileSystem);
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;

		for (const tile of tileSystem.tiles.values()) {
			minX = Math.min(minX, tile.x);
			minY = Math.min(minY, tile.y);
			maxX = Math.max(maxX, tile.x);
			maxY = Math.max(maxY, tile.y);
		}

		return [minX, maxX, minY, maxY];
	}

	public async fetchData(): Promise<any> {
		const tilesBoundingBox = this.getLoadedTilesBoundingBox();

		fetch(`http://localhost:3000/vehicles?bbox=${tilesBoundingBox.join(',')}`, {
			method: 'GET'
		}).then(async r => {
			const response: VehiclesQueryResponse = await r.json();

			this.handleQueryResponse(response);
		}).catch(() => {
			// ignore it
		});
	}

	private handleQueryResponse(response: VehiclesQueryResponse): void {
		for (const aircraft of this.aircraftMap.values()) {
			aircraft.isUpdatedTemp = false;
		}

		for (const aircraft of response.aircraft) {
			const id = aircraft[aircraft.length - 1].id;
			const lastState = VehicleSystem.convertQueryAircraftToAircraftState(aircraft[aircraft.length - 1]);
			let prevState;

			if (this.aircraftMap.get(id) && this.aircraftMap.get(id).lastLerpedState) {
				prevState = this.aircraftMap.get(id).lastLerpedState;
			} else {
				prevState = VehicleSystem.convertQueryAircraftToAircraftState(aircraft[0]);
			}

			const savedEntry = this.aircraftMap.get(id);

			if (!savedEntry) {
				this.aircraftMap.set(id, {
					prevState: prevState,
					targetState: lastState,
					lastLerpedState: null,
					type: VehicleSystem.getPlaneTypeInteger(aircraft[0]),
					isUpdatedTemp: true
				});
			} else {
				savedEntry.prevState = prevState;
				savedEntry.targetState = lastState;
				savedEntry.lastLerpedState = null;
				savedEntry.isUpdatedTemp = true;
			}
		}

		for (const [key, aircraft] of this.aircraftMap.entries()) {
			if (!aircraft.isUpdatedTemp) {
				this.aircraftMap.delete(key);
			}
		}

		this.lastUpdateTimestamp = Date.now();
	}

	public getAircraftBuffer(origin: Vec2, type: number): Float32Array {
		const aircraftOfType: AircraftEntry[] = [];

		for (const aircraft of this.aircraftMap.values()) {
			if (aircraft.type === type) {
				aircraftOfType.push(aircraft);
			}
		}

		if (aircraftOfType.length === 0) {
			return null;
		}

		const buffer = new Float32Array(aircraftOfType.length * 4);
		const progress = (Date.now() - this.lastUpdateTimestamp) / QueryInterval;

		let i = 0;

		for (const aircraft of aircraftOfType) {
			const prevState = aircraft.prevState;
			const targetState = aircraft.targetState;
			const lerpedState = VehicleSystem.lerpAircraftStates(prevState, targetState, progress);

			aircraft.lastLerpedState = lerpedState;

			buffer[i++] = lerpedState.x - origin.x;
			buffer[i++] = lerpedState.altitude;
			buffer[i++] = lerpedState.y - origin.y;
			buffer[i++] = lerpedState.heading;
		}

		return buffer;
	}

	private static lerpAircraftStates(a: AircraftState, b: AircraftState, t: number): AircraftState {
		const heightA = VehicleSystem.getActualAltitude(a.x, a.y, a.altitude);
		const heightB = VehicleSystem.getActualAltitude(b.x, b.y, b.altitude);

		return {
			x: MathUtils.lerp(a.x, b.x, t),
			y: MathUtils.lerp(a.y, b.y, t),
			altitude: MathUtils.lerp(heightA, heightB, t),
			heading: MathUtils.lerpAngle(a.heading, b.heading, t),
		};
	}

	private static convertQueryAircraftToAircraftState(query: QueryAircraft): AircraftState {
		const {x, y} = MathUtils.degrees2meters(query.lat, query.lon);
		return {
			x,
			y,
			altitude: query.altitude,
			heading: MathUtils.toRad(-query.heading)
		};
	}

	private static getActualAltitude(x: number, z: number, altitude: number): number {
		const tilePosition = MathUtils.meters2tile(x, z, 16);
		const height = HeightProvider.getHeight(
			Math.floor(tilePosition.x),
			Math.floor(tilePosition.y),
			tilePosition.x % 1,
			tilePosition.y % 1
		);

		if (altitude < height) {
			return height;
		}

		return altitude;
	}

	private static getPlaneTypeInteger(state: QueryAircraft): number {
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
				return 0;
			case 'A320':
			case 'A321':
			case 'A20N':
			case 'A319':
			case 'A21N':
			case 'A359':
			case 'A333':
			case 'A332':
				return 1;
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
				return 2;
			case 'CRJ9':
			case 'E55P':
			case 'CRJ7':
			case 'BE20':
			case 'C56X':
			case 'CL30':
			case 'CRJ2':
			case 'C68A':
			case 'C25A':
				return 3;
		}

		return 0;
	}
}
