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

function addName(src: string, name: string): string {
	if (src.startsWith('#version 300 es')) {
		return src.replace('#version 300 es', `#version 300 es\n#define SHADER_NAME ${name}`);
	}

	return `#define SHADER_NAME ${name}\n${src}`;
}

export default class ShaderPrecompiler {
	public static resolveIncludes(shaderSource: string, shaderName: string): string {
		const withIncludes = resolveIncludes(shaderSource);

		return addName(withIncludes, shaderName);
	}
}