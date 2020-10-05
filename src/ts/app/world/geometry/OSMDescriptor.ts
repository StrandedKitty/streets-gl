import OSMFeature, {OSMTags} from "./features/osm/OSMFeature";
import {hexToRgb} from "../../../math/Utils";

const TagsList = require("./../../../../resources/tags.json");
const ColorsList = require("./../../../../resources/colors.json");

export default class OSMDescriptor {
	private readonly tags: OSMTags;
	public properties: { [key: string]: any } = {};

	constructor(feature: OSMFeature) {
		this.tags = feature.tags;

		this.getProperties();
	}

	private getProperties() {
		for (const [key, value] of Object.entries(this.tags)) {
			if (TagsList[key]) {
				const props: { [key: string]: string } = TagsList[key][value] || TagsList[key].default || {};

				for (const [propKey, propValue] of Object.entries(props)) {
					let newValue: any;

					switch (propValue) {
						case '@units':
							newValue = this.parseUnits(value);
							break;
						case '@color':
							newValue = ColorsList[value.toLowerCase()] || hexToRgb(value);
							break;
						case '@int':
							newValue = parseInt(value);
							break;
						case '@self':
							newValue = value;
							break;
						default:
							newValue = propValue;
							break;
					}

					this.properties[propKey] = newValue;
				}
			}
		}
	}

	private parseUnits(value: string): number {
		let num: number;
		value = value.replace(/,/g, '.').replace(/ /g, '').replace(/ft/g, '\'');

		if (value.search(/m/) !== -1) {
			num = parseFloat(value.replace(/m/g, ''));
		} else if (value.search(/'/) !== -1) {
			if (value.search(/"/) !== -1) {
				const feetArr = value.replace(/"/g, '').split('\'');
				const feet = parseFloat(feetArr[0]) + parseFloat(feetArr[1]) / 12;
				num = feet / 3.2808;
			} else {
				num = parseFloat(value.replace(/'/g, '')) / 3.2808;
			}
		} else {
			num = parseFloat(value);
		}

		return num;
	}
}