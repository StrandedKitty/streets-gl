import React, {useCallback, useContext, useEffect, useState} from "react";
import LegalAttributionPanel from "~/app/ui/components/LegalAttributionPanel";
import {useRecoilValue} from "recoil";
import DebugInfo from "~/app/ui/components/DebugInfo";
import CompassPanel from "~/app/ui/components/CompassPanel";
import SelectionPanel from "~/app/ui/components/SelectionPanel";
import {ActionsContext, AtomsContext} from "~/app/ui/UI";
import RenderGraphViewer from "~/app/ui/components/RenderGraphViewer";
import SearchPanel from "~/app/ui/components/SearchPanel";
import TimePanel from "~/app/ui/components/TimePanel";
import NavPanel from "~/app/ui/components/NavPanel";
import InfoModalPanel from "~/app/ui/components/InfoModalPanel";
import SettingsModalPanel from "~/app/ui/components/SettingsModalPanel";
import GeolocationButton from "~/app/ui/components/GeolocationButton";
import styles from './MainScreen.scss';
import SavedPlacesModalPanel from "~/app/ui/components/SavedPlacesModalPanel";

const MainScreen: React.FC = () => {
	const atoms = useContext(AtomsContext);
	const actions = useContext(ActionsContext);

	const [isRenderGraphVisible, setIsRenderGraphVisible] = useState<boolean>(false);
	const loadingProgress = useRecoilValue(atoms.resourcesLoadingProgress);
	const [activeModalWindow, setActiveModalWindow] = useState<string>('');
	const [isUIVisible, setIsUIVisible] = useState<boolean>(true);

	const showRenderGraph = useCallback((): void => setIsRenderGraphVisible(true), []);
	const hideRenderGraph = useCallback((): void => setIsRenderGraphVisible(false), []);

	const closeModal = useCallback((): void => setActiveModalWindow(''), []);

	useEffect(() => {
		const handler = (e: KeyboardEvent): void => {
			if (e.code === 'KeyU' && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				setIsUIVisible(!isUIVisible);
			}

			if (e.code === 'Escape') {
				closeModal();
			}
		}

		window.addEventListener('keydown', handler);
		return () => {
			window.removeEventListener('keydown', handler)
		};
	}, [isUIVisible]);

	let containerClassNames = styles.mainScreen;

	if (!isUIVisible || loadingProgress < 1.) {
		containerClassNames += ' ' + styles['mainScreen--hidden'];
	}

	return (
		<div className={containerClassNames}>
			<SearchPanel/>
			<NavPanel
				setActiveModalWindow={setActiveModalWindow}
				activeModalWindow={activeModalWindow}
			/>
			{
				activeModalWindow === 'info' && <InfoModalPanel onClose={closeModal}/>
			}
			{
				activeModalWindow === 'settings' && <SettingsModalPanel onClose={closeModal}/>
			}
			{
				activeModalWindow === 'savedPlaces' && <SavedPlacesModalPanel onClose={closeModal}/>
			}
			<DebugInfo showRenderGraph={showRenderGraph}/>
			<TimePanel/>
			<SelectionPanel/>
			<LegalAttributionPanel/>
			<CompassPanel/>
			<GeolocationButton/>
			{
				isRenderGraphVisible && (
					<RenderGraphViewer
						update={actions.updateRenderGraph}
						close={hideRenderGraph}
					/>
				)
			}
		</div>
	);
}

export default MainScreen;