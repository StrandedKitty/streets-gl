import React, {useState} from "react";
import DebugInfo from "./DebugInfo";
import SelectionInfo from "./SelectionInfo";
import TimeInfo from "~/app/ui/TimeInfo";
import Search from "~/app/ui/Search";
import RenderGraphViewer from "~/app/ui/RenderGraphViewer";
import LegalAttribution from "~/app/ui/LegalAttribution";

const UIRoot: React.FC<{
	updateRenderGraph: () => void;
	goToLatLon: (lat: number, lon: number) => void;
	setTimeState: (state: number) => void;
}> = ({updateRenderGraph, goToLatLon, setTimeState}) => {
	const [showRenderGraph, setShowRenderGraph] = useState<boolean>(false);

	return (
		<>
			<Search
				goToLatLon={goToLatLon}
			/>
			<DebugInfo
				onRenderGraphOpen={(): void => setShowRenderGraph(true)}
			/>
			<TimeInfo
				setTimeState={setTimeState}
			/>
			<SelectionInfo/>
			{
				showRenderGraph && (
					<RenderGraphViewer
						update={updateRenderGraph}
						close={(): void => setShowRenderGraph(false)}
					/>
				)
			}
			<LegalAttribution/>
		</>
	);
}

export default UIRoot;