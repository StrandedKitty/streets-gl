import React, {useContext, useEffect, useRef, useState} from "react";
import dagre from "dagre";
import dagreD3 from "dagre-d3";
import * as d3 from "d3";
import {useRecoilValue} from "recoil";
import styles from './RenderGraphViewer.scss';
import {AtomsContext} from "~/app/ui/UI";
import stringifyRecord from "~/app/ui/components/RenderGraphViewer/stringifyRecord";
import RenderGraphSnapshot from "~/app/ui/RenderGraphSnapshot";

const constructGraphFromData = (data: RenderGraphSnapshot): dagre.graphlib.Graph => {
	const g = new dagre.graphlib.Graph({compound: true});

	g.setGraph({rankdir: "LR", ranker: 'longest-path'});
	g.setDefaultEdgeLabel('');

	for (const node of data.graph) {
		const formattedMetadata = stringifyRecord(node.metadata);
		let formattedLocalResources: string[] = [];

		if (node.localResources) {
			formattedLocalResources = node.localResources.map(r => `<div class="local-resource">${stringifyRecord(r)}</div>`)
		}

		const labelHtml = `
			<header>${node.name}</header>
			<main>
				<div class="metadata">${formattedMetadata}</div>
				${formattedLocalResources ? `<div class="local-resources">${formattedLocalResources.join('')}</div>` : ``}
			</main>
		`;

		g.setNode(node.name, {
			label: labelHtml,
			labelType: 'html',
			rx: 10,
			ry: 10,
			class: node.type === 'pass' ? 'node-pass' : 'node-resource'
		});
		for (const prev of node.prev) {
			g.setEdge(prev, node.name, {curve: d3.curveBasis});
		}
		for (const next of node.next) {
			g.setEdge(node.name, next, {curve: d3.curveBasis});
		}
	}

	dagre.layout(g, {rankdir: "LR"});

	return g;
}

const RenderGraphViewer: React.FC<{
	update: () => void;
	close: () => void;
}> = ({update, close}) => {
	const atoms = useContext(AtomsContext);
	const data = useRecoilValue(atoms.renderGraph);
	const [isZoomHandlerSet, setIsZoomHandlerSet] = useState<boolean>(null);
	const svgRef = useRef();

	useEffect(() => {
		if (!data) {
			return;
		}

		const g = constructGraphFromData(data);
		const render = new dagreD3.render();

		const svg = d3.select(svgRef.current);
		const svgGroup = svg.select("g");
		const lastTransform = svgGroup.attr("transform");

		svgGroup.attr("transform", d3.zoomIdentity as any);
		render(svgGroup as any, g);

		if (lastTransform) {
			svgGroup.attr("transform", lastTransform);
		}

		if (!isZoomHandlerSet) {
			const zoom = d3.zoom().on("zoom", (e) => {
				svgGroup.attr("transform", e.transform);
			});
			svg.call(zoom as any);

			setIsZoomHandlerSet(true);
		}
	}, [data]);

	return (
		<div className={styles.viewer}>
			<div className={styles.viewer__header}>
				<div className={styles.viewer__header__title}>Render graph viewer</div>
				<div className={styles.nav}>
					<button className={styles.nav__button} onClick={update}>Update from last frame</button>
					<button className={styles.nav__button} onClick={close}>Exit</button>
				</div>
			</div>
			<div className={styles.viewer__body}>
				<svg ref={svgRef} className={styles.graph}>
					<g/>
				</svg>
			</div>
		</div>
	);
}

export default React.memo(RenderGraphViewer);