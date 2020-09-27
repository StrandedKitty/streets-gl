import {tile2degrees} from "../../../math/Utils";
import TileGeometryBuilder from "../geometry/TileGeometryBuilder";
import {WorkerMessageIncoming, WorkerMessageOutgoing} from "./MapWorker";

const ctx: Worker = self as any;

ctx.addEventListener('message', event => {
	const data = event.data as WorkerMessageOutgoing;

	load(data.tile[0], data.tile[1]);
});

function sendMessage(msg: WorkerMessageIncoming) {
	ctx.postMessage(msg, msg.result);
}

function load(x: number, y: number) {
	const offset = 0.05;
	const position = [
		tile2degrees(x - offset, y + 1 + offset),
		tile2degrees(x + 1 + offset, y - offset)
	];
	const bbox = position[0].lat + ',' + position[0].lon + ',' + position[1].lat + ',' + position[1].lon;

	const urls = [
		//'https://overpass.kumi.systems/api/interpreter?data=',
		'https://overpass.nchc.org.tw/api/interpreter?data=',
		//'https://lz4.overpass-api.de/api/interpreter?data=',
		//'https://z.overpass-api.de/api/interpreter?data='
	];
	let url = urls[Math.floor(urls.length * Math.random())];
	url += `
		[out:json][timeout:25];
		(
			node(${bbox});
			way(${bbox});
			rel["type"="building"](${bbox});
		 	rel["type"="multipolygon"]["building"](${bbox});
		 	rel["type"="multipolygon"]["building:part"](${bbox});
		)->.data;
		
		.data > ->.dataMembers;
		
		(
			.data;
			.dataMembers;
		)->.all;
		
		.all out body qt;
	`;

	const httpRequest = new XMLHttpRequest();

	httpRequest.onreadystatechange = function () {
		if (httpRequest.readyState === XMLHttpRequest.DONE) {
			if (httpRequest.status === 200) {
				buildGeometry(x, y, JSON.parse(httpRequest.responseText).elements);
			} else {
				sendMessage({
					error: true,
					tile: [x, y],
					result: {errorCode: httpRequest.status}
				});
			}
		}
	};

	httpRequest.open('GET', url);
	httpRequest.send();
}

function buildGeometry(x: number, y: number, data: any) {
	const builder = new TileGeometryBuilder(x, y);
	const result = builder.process(data);

	sendMessage({
		error: false,
		tile: [x, y],
		result: result
	});
}

