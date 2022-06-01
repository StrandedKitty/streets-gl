import ShaderChunks from "~/app/render/shaders/ShaderChunks";

const IncludePattern = /^[ \t]*#include +<([\w\d./]+)>/gm;

function includeReplacer(match: string, include: string): string {
	const string = ShaderChunks[include];

	if (string === undefined) {
		throw new Error('Can not resolve #include <' + include + '>');
	}

	return resolveIncludes(string);
}

function resolveIncludes(str: string): string {
	return str.replace(IncludePattern, includeReplacer);
}

export default class ShaderPrecompiler {
	public static resolveIncludes(shaderSource: string): string {
		return resolveIncludes(shaderSource);
	}
}