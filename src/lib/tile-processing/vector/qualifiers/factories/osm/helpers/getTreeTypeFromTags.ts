import {VectorNodeDescriptor} from "~/lib/tile-processing/vector/qualifiers/descriptors";

const treeTypeMap: Record<string, VectorNodeDescriptor['treeType']> = {
	beech: 'beech',
	fir: 'fir',
	linden: 'linden',
	oak: 'oak'
};

export default function getTreeTypeFromTags(tags: Record<string, string>): VectorNodeDescriptor['treeType'] {
	const typeFromGenus = treeTypeMap[tags.genus];
	if (typeFromGenus) {
		return typeFromGenus;
	}

	const typeFromGenusEn = treeTypeMap[tags['genus:en']];
	if (typeFromGenusEn) {
		return typeFromGenusEn;
	}

	if (tags.leaf_type === 'needleleaved') {
		return 'genericNeedleleaved';
	}

	return 'genericBroadleaved';
}