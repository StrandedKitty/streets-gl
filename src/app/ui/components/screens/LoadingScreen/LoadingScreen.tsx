import React, {useContext, useState} from "react";
import classes from './LoadingScreen.scss';
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

	let containerClassNames = classes.loadingScreenOuter;

	if (loadingProgress >= 1) {
		containerClassNames += ' ' + classes['loadingScreenOuter--hidden'];
	}

	return <div
		className={containerClassNames}
		onTransitionEnd={(): void => setShowSelf(false)}
	>
		<div className={classes.loadingScreen}>
			<div className={classes.loadingScreen__title}>Streets GL</div>
			<div className={classes.loadingScreen__progress}>
				<div className={classes.loadingScreen__progress__inner} style={{width: `${loadingProgress * 100}%`}}/>
			</div>
			<div className={classes.loadingScreen__info}>
				<a href={RepositoryURL} target={'_blank'}>GitHub repository</a>
			</div>
		</div>
	</div>;
}

export default React.memo(LoadingScreen);