import Vec2 from "~/lib/math/Vec2";
import MathUtils from "~/lib/math/MathUtils";
import TileSource from "./tile-source/TileSource";
import TileSourceFactory from "~/app/terrain/tile-source/factory/TileSourceFactory";

export enum TileAreaLoaderCellStateType {
	Empty,
	Clear,
	WithData
}

export interface TileAreaLoaderCellState<TileSourceType extends TileSource<any>> {
	type: TileAreaLoaderCellStateType;
	lastRenderType: TileAreaLoaderCellStateType;
	localX: number;
	localY: number;
	x: number;
	y: number;
	tile: TileSourceType | null;
}

export default class TileAreaLoader<T extends TileSource<any>> {
	public readonly zoom: number;
	public readonly bufferSize: number;
	public readonly maxStoredTiles: number;
	public readonly viewportSize: number;
	private readonly states: TileAreaLoaderCellState<T>[] = [];
	private readonly tiles: Map<string, T> = new Map();
	private readonly sourceFactory: TileSourceFactory<T>;

	public constructor(
		{
			sourceFactory,
			zoom,
			maxStoredTiles,
			viewportSize,
			bufferSize
		}: {
			sourceFactory: TileSourceFactory<T>;
			zoom: number;
			maxStoredTiles: number;
			viewportSize: number;
			bufferSize: number;
		}
	) {
		this.sourceFactory = sourceFactory;
		this.zoom = zoom;
		this.bufferSize = bufferSize;
		this.maxStoredTiles = maxStoredTiles;
		this.viewportSize = viewportSize;

		this.initStates();
	}

	private initStates(): void {
		for (let y = 0; y < this.viewportSize; y++) {
			for (let x = 0; x < this.viewportSize; x++) {
				this.states.push({
					type: TileAreaLoaderCellStateType.Clear,
					lastRenderType: TileAreaLoaderCellStateType.Empty,
					localX: x,
					localY: y,
					x: -1,
					y: -1,
					tile: null
				});
			}
		}
	}

	private getState(x: number, y: number): TileAreaLoaderCellState<T> {
		return this.states[x + y * this.viewportSize];
	}

	private getTile(x: number, y: number): T {
		return this.tiles.get(`${x},${y}`);
	}

	private setTile(x: number, y: number, tile: T): void {
		this.tiles.set(`${x},${y}`, tile);
	}

	public update(viewportCenter: Vec2): void {
		for (const tile of this.tiles.values()) {
			tile.markUnused();
		}

		const center = MathUtils.meters2tile(viewportCenter.x, viewportCenter.y, this.zoom);
		const min = Vec2.addScalar(center, -Math.floor(this.viewportSize / 2));
		min.x = Math.round(min.x);
		min.y = Math.round(min.y);

		for (let x = -this.bufferSize; x < this.viewportSize + this.bufferSize; x++) {
			for (let y = -this.bufferSize; y < this.viewportSize + this.bufferSize; y++) {
				const tileX = x + min.x;
				const tileY = y + min.y;

				if (!this.getTile(tileX, tileY)) {
					this.fetchTile(tileX, tileY);
				}

				const tile = this.getTile(tileX, tileY);

				tile.markUsed();
			}
		}

		this.markDirtyTileStates(min);
	}

	private markDirtyTileStates(viewportOrigin: Vec2): void {
		for (let x = 0; x < this.viewportSize; x++) {
			for (let y = 0; y < this.viewportSize; y++) {
				const state = this.getState(x, y);
				const tileX = x + viewportOrigin.x;
				const tileY = y + viewportOrigin.y;

				if (state.x !== tileX || state.y !== tileY) {
					state.x = tileX;
					state.y = tileY;
					state.type = TileAreaLoaderCellStateType.Clear;
					state.tile = this.getTile(tileX, tileY);
				}
			}
		}
	}

	public getDirtyTileStates(): TileAreaLoaderCellState<T>[] {
		const result: TileAreaLoaderCellState<T>[] = [];

		for (const state of this.states) {
			if (
				state.type === TileAreaLoaderCellStateType.Clear &&
				state.tile &&
				state.tile.data !== null
			) {
				state.lastRenderType = TileAreaLoaderCellStateType.Empty;
				state.type = TileAreaLoaderCellStateType.WithData;
			}

			if (state.type !== state.lastRenderType) {
				result.push(state);
				state.lastRenderType = state.type;
			}
		}

		return result;
	}

	private fetchTile(x: number, y: number): void {
		const tile = this.sourceFactory.create(x, y, this.zoom);
		this.setTile(x, y, tile);
		tile.markUsed();

		if (this.tiles.size > this.maxStoredTiles) {
			this.tryDeleteLeastUsedTexture();
		}
	}

	private tryDeleteLeastUsedTexture(): void {
		let leastUsedKey: string = null;
		let leastUsedTime: number = Infinity;

		for (const [key, cached] of this.tiles.entries()) {
			if (!cached.isCurrentlyUsed && cached.lastUsedTimestamp < leastUsedTime) {
				leastUsedKey = key;
				leastUsedTime = cached.lastUsedTimestamp;
			}
		}

		if (leastUsedKey) {
			const cached = this.tiles.get(leastUsedKey);
			cached.delete();
			this.tiles.delete(leastUsedKey);
		}
	}

	public transformToArray(
		quadOriginX: number,
		quadOriginY: number,
		quadSize: number,
		array: TypedArray
	): void {
		const areaSize = this.getSizeInMeters();
		const scale = quadSize / areaSize;
		const originState = this.getState(0, 0);
		const originPosition = MathUtils.tile2meters(originState.x, originState.y + this.viewportSize, this.zoom);

		const transform = {
			offsetY: (quadOriginX - originPosition.x) / areaSize,
			offsetX: (quadOriginY - originPosition.y) / areaSize,
			scaleX: scale,
			scaleY: scale
		};

		array[0] = transform.offsetX;
		array[1] = transform.offsetY;
		array[2] = transform.scaleX;
		array[3] = transform.scaleY;
	}

	public getSizeInMeters(): number {
		return 40075016.68 / (1 << this.zoom) * this.viewportSize;
	}
}