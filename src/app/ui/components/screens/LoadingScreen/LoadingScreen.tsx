import React, {useContext, useState} from "react";
import './LoadingScreen.scss';
import {AtomsContext} from "~/app/ui/UI";
import {useRecoilValue} from "recoil";

const RepositoryURL = 'https://github.com/StrandedKitty/streets-gl';

const LoadingScreen: React.FC = () => {
	const atoms = useContext(AtomsContext);
	const loadingProgress = useRecoilValue(atoms.resourcesLoadingProgress);
	const [showSelf, setShowSelf] = useState<boolean>(true);

	if (!showSelf) {
		return null;
	}

	let containerClassNames = 'loading-screen-container';

	if (loadingProgress >= 1) {
		containerClassNames += ' loading-screen-container-hidden';
	}

	return <div
		className={containerClassNames}
		onTransitionEnd={(): void => setShowSelf(false)}
	>
		<div className='loading-screen-body'>
			<div className='title'>Streets GL</div>
			<div className='progress'>
				<div className='inner' style={{width: `${loadingProgress * 100}%`}}/>
			</div>
			<div className='info'>
				<a href={RepositoryURL} target={'_blank'}>GitHub repository</a>
			</div>
		</div>
	</div>;
}

export default LoadingScreen;