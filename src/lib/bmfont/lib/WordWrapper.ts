import BMFont, {kerning} from '../types/BMFont';


const defaultBreakPoints: BreakPoint[] = [
	{	// space
		char: '\u0020'.charCodeAt(0),
		replace: '\n',
	},
	{	// soft hyphen
		char: '\u00AD'.charCodeAt(0),
		replace: '–\n',
	},
	{	// en dash
		char: '–'.charCodeAt(0),
		replace: '–\n',
	},
	{	// em dash
		char: '—'.charCodeAt(0),
		replace: '—\n',
	},
	{	// hyphen minus
		char: '-'.charCodeAt(0),
		replace: '-\n',
	},
];


type BreakPoint = {
	char: number;
	replace: string;
};


interface WordWrapperProps {
	font: BMFont;
	breakPoints?: BreakPoint[];
	useKernings?: boolean;
	kernings: Map<number, number>;
	maxChar: number;
}


interface WrapProps {
	text: string;
	width?: number;
	letterSpacing?: number;
	tabWidth?: number;
}


export default class WordWrapper {
	private breakPoints: BreakPoint[];
	private charAdvanceCache: Map<number, number> = new Map();
	private kernings: Map<number, number>;
	private maxChar: number;
	private breakCache: number[] = [];
	private letterSpacing: number;
	private tabWidth: number;
	private useKernings: boolean;

	public constructor(props: WordWrapperProps) {
		const {
			font,
			breakPoints = defaultBreakPoints,
			useKernings = true,
			kernings,
			maxChar
		} = props;

		this.breakPoints = breakPoints;
		this.useKernings = useKernings;
		this.kernings = kernings;
		this.maxChar = maxChar;

		for (const char of font.chars) {
			this.charAdvanceCache.set(char.id, char.xadvance / font.info.size);
		}

		breakPoints.forEach((breakpoint) => {
			this.breakCache.push(breakpoint.char);
		});
	}

	private greedy(str: string, width: number): [string, string] {
		let currentLineWidth = 0;
		let currentPosition = 0;

		let previousChar: number;

		// walk until line is full
		while (currentLineWidth < width) {
			const char = str.charCodeAt(currentPosition);

			if (isNaN(char)) {
				// end of string reached, no break needed.
				return [str, ''];
			}

			if (char === 10) {
				// new line character
				return [str.substr(0, currentPosition + 1), str.substr(currentPosition + 1)];
			}

			currentLineWidth += this.getCharWidth(char, previousChar);
			currentPosition += 1;
			previousChar = char;
		}

		const hardBreak = currentPosition;

		// walk backwards until a breakpoint is reached
		while (currentPosition >= 0) {
			const char = str.charCodeAt(currentPosition);
			if (this.breakCache.includes(char)) {
				const br = this.breakPoints.find(b => b.char === char).replace;

				const line = str.substr(0, currentPosition) + br;

				// check if the remaining line, including break, fits into width
				if (this.measure(line) <= width) {
					return [line, str.substr(currentPosition + 1)];
				}
			}
			currentPosition -= 1;
		}

		// no break point. Break word instead.
		return [`${str.substr(0, hardBreak)}\n`, str.substr(hardBreak)];
	}

	private getCharWidth(char: number, previousChar?: number): number {
		let charWidth = this.charAdvanceCache.get(char) ?? 0;

		if (char === 9) {
			// tab
			charWidth = this.tabWidth;
		}

		if (this.useKernings && previousChar) {
			const kerning = this.kernings.get(previousChar * this.maxChar + char);

			if (kerning !== undefined) {
				charWidth += kerning;
			}
		}

		return charWidth + this.letterSpacing;
	}

	public wrap(props: WrapProps): string {
		const {
			text: str,
			width = 10,
			letterSpacing = 0,
			tabWidth = 1,
		} = props;

		this.letterSpacing = letterSpacing;
		this.tabWidth = tabWidth;

		// TODO: check if  string contains unsupported chars

		const out: string[] = [];
		let nextLine: string = str;

		while (nextLine.length > 0) {
			const s = this.greedy(nextLine, width);
			out.push(s[0]);
			nextLine = s[1];
		}

		return out.join('');
	}

	public measure(text: string): number {
		let width = 0;
		let previousChar: number;

		text.split('').forEach((s) => {
			const char = s.charCodeAt(0);
			width += this.getCharWidth(char, previousChar);
			previousChar = char;
		});

		return width;
	}
}
