import MathUtils from "../../../math/MathUtils";
import TileGeometryBuilder from "../geometry/TileGeometryBuilder";
import HeightViewer from "../HeightViewer";
import {
	WorkerMessageIncoming,
	WorkerMessageIncomingType,
	WorkerMessageOutgoing,
	WorkerMessageOutgoingType
} from "./WorkerMessageTypes";

const ctx: Worker = self as any;
const heightViewer = new HeightViewer();
heightViewer.requestHeightFunction = (x: number, y: number) => {
	sendMessage({
		type: WorkerMessageIncomingType.RequestHeight,
		tile: [x, y]
	});
}

ctx.addEventListener('message', event => {
	const data = event.data as WorkerMessageOutgoing;

	if (data.type === WorkerMessageOutgoingType.Start) {
		load(data.tile[0], data.tile[1]);
	} else if (data.type === WorkerMessageOutgoingType.SendHeightData) {
		heightViewer.pushHeightTile(data.tile[0], data.tile[1], data.heightArray);
	}
});

function sendMessage(msg: WorkerMessageIncoming) {
	ctx.postMessage(msg,
		msg.type === WorkerMessageIncomingType.Success ?
			[
				msg.result.buildings.position.buffer,
				msg.result.buildings.uv.buffer,
				msg.result.buildings.normal.buffer,
				msg.result.buildings.textureId.buffer,
				msg.result.buildings.color.buffer,
				msg.result.buildings.id.buffer,
				msg.result.buildings.offset.buffer,
				msg.result.buildings.localId.buffer
			] :
			[]
	);
}

function load(x: number, y: number) {
	const offset = 0.05;
	const position = [
		MathUtils.tile2degrees(x - offset, y + 1 + offset),
		MathUtils.tile2degrees(x + 1 + offset, y - offset)
	];
	const bbox = position[0].lat + ',' + position[0].lon + ',' + position[1].lat + ',' + position[1].lon;

	const urls = [
		'http://overpass.openstreetmap.ru/cgi/interpreter?data=',
		//'https://overpass.kumi.systems/api/interpreter?data=',
		//'https://overpass.nchc.org.tw/api/interpreter?data=',
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
					type: WorkerMessageIncomingType.Error,
					tile: [x, y],
					result: {errorCode: httpRequest.status}
				});
			}
		}
	};

	httpRequest.open('GET', url);
	httpRequest.send();
}

async function buildGeometry(x: number, y: number, data: any) {
	const builder = new TileGeometryBuilder(x, y, heightViewer);
	const tilesList = builder.getCoveredTiles(data);

	await heightViewer.requestTileSet(tilesList);

	const result = await builder.getTileGeometry();

	sendMessage({
		type: WorkerMessageIncomingType.Success,
		tile: [x, y],
		result: result
	});
}

