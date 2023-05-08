import ColorsList from "~/resources/colors.json";
import MathUtils from "~/lib/math/MathUtils";
import Utils from "~/app/Utils";


export function isTagIncludesString(
	tags: Record<string, string>,
	key: string,
	value: string
): boolean {
	const tagValue = tags[key];

	if (tagValue === undefined) {
		return false;
	}

	const parts = tagValue.split(';').map((part) => part.trim().toLowerCase());

	return parts.some(part => part === value);
}

export function getTagValues(
	tags: Record<string, string>,
	key: string
): string[] {
	const tagValue = tags[key];

	if (tagValue === undefined) {
		return [];
	}

	return tagValue.split(';').map((part) => part.trim().toLowerCase());
}

export function readTagAsFloat(tags: Record<string, string>, key: string): number {
	const value = tags[key];
	const parsed = parseFloat(value);

	if (isNaN(parsed)) {
		return undefined;
	}

	return parsed;
}

export function readTagAsUnsignedFloat(tags: Record<string, string>, key: string): number {
	const parsed = readTagAsFloat(tags, key);

	if (parsed === undefined) {
		return undefined;
	}

	return Math.max(parsed, 0);
}

export function readTagAsInt(tags: Record<string, string>, key: string): number {
	const value = tags[key];
	const parsed = parseInt(value);

	if (isNaN(parsed)) {
		return undefined;
	}

	return parsed;
}

export function readTagAsUnsignedInt(tags: Record<string, string>, key: string): number {
	const parsed = readTagAsInt(tags, key);

	if (parsed === undefined) {
		return undefined;
	}

	return Math.max(parsed, 0);
}

export function parseMeters(str: string = ''): number {
	str = str
		.replace(/,/g, '.')
		.replace(/ /g, '')
		.replace(/ft/g, '\'')
		.replace(/feet/g, '\'');

	if (str.search(/m/) !== -1) {
		return parseFloat(str.replace(/m/g, ''));
	} else if (str.search(/'/) !== -1) {
		const [feet, inches] = str.split('\'').map(v => parseFloat(v));
		return (feet * 12 + (inches || 0)) * 0.0254;
	} else if (str.search(/"/) !== -1) {
		const inches = parseFloat(str) || 0;
		return inches * 0.0254;
	}

	const parsedFloat = parseFloat(str);

	return isNaN(parsedFloat) ? undefined : parsedFloat;
}

export function parseHeight(str: string = '', fallback?: number): number {
	return parseMeters(str) ?? fallback;
}

export function parseRoofLevels(tags: Record<string, string>, key: string): number {
	const levels = readTagAsUnsignedInt(tags, key);
	if (levels <= 0) {
		return undefined;
	}
	
	return levels ?? undefined;
}

export function parseDirection(str: string = '', fallback?: number): number {
	const directions: Record<string, number> = {
		N: 0,
		NE: 45,
		E: 90,
		SE: 135,
		S: 180,
		SW: 225,
		W: 270,
		NW: 315,
		NNW: 337.5,
		NNE: 22.5,
		ENE: 67.5,
		ESE: 112.5,
		SSE: 157.5,
		SSW: 202.5,
		WSW: 247.5,
		WNW: 292.5,
	};

	const direction = directions[str.toUpperCase()];

	if (direction !== undefined) {
		return direction;
	}

	const floatValue = parseFloat(str);

	if (isNaN(floatValue)) {
		return fallback;
	}

	return floatValue;
}

export function parseColor(str: string = '', fallback?: number): number {
	if (str.length === 0) {
		return fallback;
	}

	const noSpacesLowerCase = str.replace(/[ _-]/g, '').toLowerCase();
	let components = (ColorsList as Record<string, number[]>)[noSpacesLowerCase];

	if (!components) {
		const hex = str.includes(';') ? str.split(';')[0] : str;
		components = Utils.hexToRgb(hex);
	}

	if (!components) {
		return fallback;
	}

	return components[0] * 256 * 256 + components[1] * 256 + components[2];
}
