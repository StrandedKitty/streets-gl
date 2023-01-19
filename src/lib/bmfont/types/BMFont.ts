type char = {
	id: number;
	width: number;
	height: number;
	xoffset: number;
	yoffset: number;
	xadvance: number;
	chnl: number;
	x: number;
	y: number;
	page: number;
};

export type kerning = {
	first: number;
	second: number;
	amount: number;
};

type BMFont =  {
	pages: string[];
	chars: char[];
	info: {
		face: string;
		size: number;
		bold: number;
		italic: number;
		charset: string[];
		unicode: number;
		stretchH: number;
		smooth: number;
		aa: number;
		padding: [
			number,
			number,
			number,
			number,
		];
		spacing: [
			number,
			number,
		];
	};
	common: {
		lineHeight: number;
		base: number;
		scaleW: number;
		scaleH: number;
		pages: number;
		packed: number;
		alphaChnl: number;
		redChnl: number;
		greenChnl: number;
		blueChnl: number;
	};
	kernings: kerning[];
};

export default BMFont;
