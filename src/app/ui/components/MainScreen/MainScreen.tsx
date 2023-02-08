import React, {useContext, useEffect, useState} from "react";
import LegalAttributionPanel from "~/app/ui/components/LegalAttributionPanel";
import {useRecoilValue} from "recoil";
import DebugInfo from "~/app/ui/components/DebugInfo";
import CompassPanel from "~/app/ui/components/CompassPanel";
import SelectionPanel from "~/app/ui/components/SelectionPanel";
import {ActionsContext, AtomsContext} from "~/app/ui/UI";
import Search from "~/app/ui/Search";
import Nav from "~/app/ui/Nav";
import Info from "~/app/ui/Info";
import Settings from "~/app/ui/Settings";
import TimeInfo from "~/app/ui/TimeInfo";
import RenderGraphViewer from "~/app/ui/components/RenderGraphViewer";

const MainScreen: React.FC = () => {
	const atoms = useContext(AtomsContext);
	const actions = useContext(ActionsContext);

	const [showRenderGraph, setShowRenderGraph] = useState<boolean>(false);
	const loadingProgress = useRecoilValue(atoms.resourcesLoadingProgress);
	const [activeModalWindow, setActiveModalWindow] = useState<string>('');
	const [isUIVisible, setIsUIVisible] = useState<boolean>(true);

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

	return (
		<div className={(isUIVisible || loadingProgress < 1.) ? 'main-screen-hidden' : ''}>
			<Search
				goToLatLon={actions.goToLatLon}
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
			<DebugInfo showRenderGraph={(): void => {
				setShowRenderGraph(true);
			}}/>
			<TimeInfo/>
			<SelectionPanel/>
			<LegalAttributionPanel/>
			<CompassPanel/>
			{
				showRenderGraph && (
					<RenderGraphViewer
						update={actions.updateRenderGraph}
						close={(): void => setShowRenderGraph(false)}
					/>
				)
			}
		</div>
	);
}

export default MainScreen;