import React, {useEffect, useState} from "react";
import DebugInfo from "./DebugInfo";
import SelectionInfo from "./SelectionInfo";
import TimeInfo from "~/app/ui/TimeInfo";
import Search from "~/app/ui/Search";
import RenderGraphViewer from "~/app/ui/RenderGraphViewer";
import LegalAttribution from "~/app/ui/LegalAttribution";
import Nav from "~/app/ui/Nav";
import UI from "~/app/ui/UI";

const UIRoot: React.FC<{
	updateRenderGraph: () => void;
	goToLatLon: (lat: number, lon: number) => void;
	setTimeState: (state: number) => void;
}> = ({updateRenderGraph, goToLatLon, setTimeState}) => {
	const [showRenderGraph, setShowRenderGraph] = useState<boolean>(false);
	const [loadingProgress, setLoadingProgress] = useState<number>(0);

	useEffect(() => {
		UI.listenToField('resourcesLoadingProgress', (v: number) => setLoadingProgress(v));
	}, []);

	if (loadingProgress < 1) {
		return <div className='loading-screen'>
			<div className='loading-screen-center'>
				<div className='loading-screen-title'>Streets GL</div>
				<div className='loading-screen-progress'>
					<div className='loading-screen-progress-inner' style={{width: `${loadingProgress * 100}%`}} />
				</div>
				<div className='loading-screen-info'>
					<a href={'https://github.com/StrandedKitty/streets-gl'}>GitHub repo</a>
				</div>
			</div>
		</div>
	}

	return (
		<>
			<Search
				goToLatLon={goToLatLon}
			/>
			<Nav />
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