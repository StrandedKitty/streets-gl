import ShaderChunks from "./ShaderChunks";

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

	public static resolveNameAndDefines(shaderSource: string, name: string, defines: Record<string, string>): string {
		const lines = shaderSource.split('\n');
		let lineIndex = 0;

		for (let i = 0; i < lines.length; i++) {
			if (lines[i].startsWith('#version')) {
				lineIndex = i + 1;
			}
		}

		let definesString = `#define SHADER_NAME ${name}\n`;

		for (const [key, value] of Object.entries(defines)) {
			definesString += `#define ${key} ${value}\n`;
		}

		lines.splice(lineIndex, 0, definesString);

		return lines.join('\n');
	}
}