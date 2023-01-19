import React, {useEffect, useState} from "react";
import DebugInfo from "./DebugInfo";
import SelectionInfo from "./SelectionInfo";
import TimeInfo from "./TimeInfo";
import Search from "./Search";
import RenderGraphViewer from "./RenderGraphViewer";
import LegalAttribution from "./LegalAttribution";
import Nav from "./Nav";
import UI from "./UI";
import Info from "./Info";
import Settings from "./Settings";

const UIRoot: React.FC<{
	updateRenderGraph: () => void;
	goToLatLon: (lat: number, lon: number) => void;
	setTimeState: (state: number) => void;
}> = ({updateRenderGraph, goToLatLon, setTimeState}) => {
	const [showRenderGraph, setShowRenderGraph] = useState<boolean>(false);
	const [loadingProgress, setLoadingProgress] = useState<number>(0);
	const [activeModalWindow, setActiveModalWindow] = useState<string>('');
	const [isUIVisible, setIsUIVisible] = useState<boolean>(true);

	useEffect(() => {
		UI.listenToField('resourcesLoadingProgress', (v: number) => setLoadingProgress(v));
	}, []);

	useEffect(() => {
		UI.listenToField('resourcesLoadingProgress', (v: number) => setLoadingProgress(v));
	}, []);

	useEffect(() => {
		const handler = (e: KeyboardEvent): void => {
			if (e.code === 'KeyU' && (e.ctrlKey || e.metaKey)) {
				setIsUIVisible(!isUIVisible);
			}

			if (e.code === 'Escape') {
				setActiveModalWindow('');
			}
		}

		window.addEventListener('keydown', handler);
		return () => {
			window.removeEventListener('keydown', handler)
		};
	}, [isUIVisible]);

	if (loadingProgress < 1) {
		return <div className='loading-screen'>
			<div className='loading-screen-center'>
				<div className='loading-screen-title'>Streets GL</div>
				<div className='loading-screen-progress'>
					<div className='loading-screen-progress-inner' style={{width: `${loadingProgress * 100}%`}} />
				</div>
				<div className='loading-screen-info'>
					<a href={'https://github.com/StrandedKitty/streets-gl'} target={'_blank'}>GitHub repository</a>
				</div>
			</div>
		</div>
	}

	return (
		<div style={{display: isUIVisible ? 'block' : 'none'}}>
			<Search
				goToLatLon={goToLatLon}
			/>
			<Nav
				setActiveModalWindow={(name: string): void => setActiveModalWindow(name)}
				activeModalWindow={activeModalWindow}
			/>
			{
				activeModalWindow === 'info' && (
					<Info
						onClose={(): void => setActiveModalWindow('')}
					/>
				)
			}
			{
				activeModalWindow === 'settings' && (
					<Settings
						onClose={(): void => setActiveModalWindow('')}
					/>
				)
			}
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
		</div>
	);
}

export default UIRoot;