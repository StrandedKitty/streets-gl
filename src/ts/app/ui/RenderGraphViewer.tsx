import React, {useEffect, useRef} from "react";
import {RenderGraphSnapshot} from "~/app/systems/UISystem";
import dagre from "dagre";
import dagreD3 from "dagre-d3";
import * as d3 from "d3";

const constructGraphFromData = (data: RenderGraphSnapshot): dagre.graphlib.Graph => {
	const g = new dagre.graphlib.Graph({ compound: true });

	g.setGraph({ rankdir: "LR", ranker: 'longest-path' });
	g.setDefaultEdgeLabel('');

	for (const node of data.graph) {
		let formattedMetadata = '';

		for (const [k, v] of Object.entries(node.metadata)) {
			formattedMetadata += `\n${k}: ${v}`;
		}

		g.setNode(node.name, {
			label: node.name + formattedMetadata,
			rx: 10,
			ry: 10,
			class: node.type === 'pass' ? 'node-pass' : 'node-resource'
		});
		for (const prev of node.prev) {
			g.setEdge(prev, node.name, { curve: d3.curveBasis });
		}
		for (const next of node.next) {
			g.setEdge(node.name, next, { curve: d3.curveBasis });
		}
	}

	dagre.layout(g, { rankdir: "LR" });

	return g;
}

const RenderGraphViewer: React.FC<{
	data: RenderGraphSnapshot;
	update: () => void;
	close: () => void;
}> = ({data, update, close}) => {
	const svgRef = useRef();

	useEffect(() => {
		if (!data) {
			return;
		}

		const g = constructGraphFromData(data);
		const render = new dagreD3.render();

		const svg = d3.select(svgRef.current);
		const svgGroup = svg.select("g");

		render(svgGroup as any, g);

		const zoom = d3.zoom().on("zoom", (e) => {
			svgGroup.attr("transform", e.transform);
		});
		svg.call(zoom as any);
	}, [data]);

	return (
		<div className='render-graph-viewer'>
			<div className='render-graph-viewer-header'>
				<div className='render-graph-viewer-title'>Render graph viewer</div>
				<div className='render-graph-viewer-nav'>
					<button onClick={update}>Update from last frame</button>
					<button onClick={close}>Exit</button>
				</div>
			</div>
			<div className='render-graph-viewer-body'>
				<svg ref={svgRef} id='graph-svg'><g /></svg>
			</div>
		</div>
	);
}

export default RenderGraphViewer;