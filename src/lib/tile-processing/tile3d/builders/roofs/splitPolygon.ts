type Vertex = [number, number];
type Polygon = Vertex[];

export default function splitPolygon(poly: Polygon, rayOrig: Vertex, rayDir: Vertex): Polygon[] {
	if (!poly || poly.length < 3) {
		throw new Error("splitPolygon: input polygon must have at least 3 vertices");
	}

	const interPoints = [];

	let start = poly[poly.length - 1];
	for (let ivert = 0; ivert < poly.length; ivert++) {
		const end = poly[ivert];

		//inter = start + s * (end-start)
		//s = (rayOrig-start) dot (-rayDir.y, rayDir.x) / (end-start) dot (-rayDir.y, rayDir.x)
		//inter in edge if s>=0 && s<=1
		const edgeDir = [end[0] - start[0], end[1] - start[1]];
		const den = rayDir[0] * edgeDir[1] - rayDir[1] * edgeDir[0];
		if (den != 0) {
			let num = rayDir[0] * (rayOrig[1] - start[1]) - rayDir[1] * (rayOrig[0] - start[0]);
			const s = num / den;

			if (s >= 0 && s <= 1) {
				const p = [
					start[0] + s * edgeDir[0],
					start[1] + s * edgeDir[1]
				];
				//inter = rayOrig + t * rayDir
				//t = det((end-start),(rayOrig-start)) / (end-start) dot (-rayDir.y, rayDir.x)
				num = edgeDir[0] * (rayOrig[1] - start[1]) - edgeDir[1] * (rayOrig[0] - start[0]);
				const t = num / den;
				interPoints.push({
					is: (ivert + poly.length - 1) % poly.length,
					ie: ivert,
					p: p,
					t: t
				});
			}

		}
		start = end;
	}

	//sort inter points by distance from the ray origin
	interPoints.sort(function (a, b) {
		if (a.t < b.t)
			return -1;
		if (a.t > b.t)
			return 1;
		return 0;
	});
//	console.log(interPoints);

	if (interPoints.length % 2 !== 0)
		throw new Error("splitPolygon: unknown error");

	//list of new polygons with a first empty one (make it current)
	const output: Polygon[] = [[]];
	let curPoly = output[0];

	//walk through initial poly points
	for (let ivert = 0; ivert < poly.length; ivert++) {
//		console.log(ivert);
		//append first point to poly
		curPoly.push(poly[ivert]);

		//is there an intersection point ?
		let inter = null;
		for (let interTmp = 0; interTmp < interPoints.length; interTmp++) {
			if (interPoints[interTmp].is == ivert) {
				inter = interTmp;
				break;
			}
		}

		if (inter !== null) {
			//yes, add the inter point to the current poly
			// @ts-ignore
			curPoly.push(interPoints[inter].p);
			//set the paired inter point to be the crossback point of this poly
			if (inter % 2 == 0) {
//				console.log("+1");
				// @ts-ignore
				interPoints[inter + 1].crossback = curPoly;
			} else {
//				console.log("-1");
				// @ts-ignore
				interPoints[inter - 1].crossback = curPoly;
			}
			//now we have to switch the current poly to a pending one or to a new one
			// @ts-ignore
			if (interPoints[inter].crossback) {
				// @ts-ignore
				curPoly = interPoints[inter].crossback;
//				console.log("a");
			} else {
//				console.log("b");
				curPoly = [];
				output.push(curPoly);
			}
			//add the inter point to the new current
			// @ts-ignore
			curPoly.push(interPoints[inter].p);
		}

	}

	return output;
}