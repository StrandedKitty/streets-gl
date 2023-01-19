export default class SeededRandom {
	private seed: number;

	public constructor(seed: number) {
		this.seed = seed || 0x2F6E2B1;
	}

	public generate(): number {
		// Robert Jenkins’ 32-bit integer hash function
		this.seed = ((this.seed + 0x7ED55D16) + (this.seed << 12)) & 0xFFFFFFFF;
		this.seed = ((this.seed ^ 0xC761C23C) ^ (this.seed >>> 19)) & 0xFFFFFFFF;
		this.seed = ((this.seed + 0x165667B1) + (this.seed << 5)) & 0xFFFFFFFF;
		this.seed = ((this.seed + 0xD3A2646C) ^ (this.seed << 9)) & 0xFFFFFFFF;
		this.seed = ((this.seed + 0xFD7046C5) + (this.seed << 3)) & 0xFFFFFFFF;
		this.seed = ((this.seed ^ 0xB55A4F09) ^ (this.seed >>> 16)) & 0xFFFFFFFF;
		return (this.seed & 0xFFFFFFF) / 0x10000000;
	}
}
