import React, {useContext} from "react";
import {useRecoilValue} from "recoil";
import styles from './DebugInfo.scss';
import {AtomsContext} from "~/app/ui/UI";

const DebugInfo: React.FC<{showRenderGraph: () => void}> = ({showRenderGraph}) => {
	const atoms = useContext(AtomsContext);
	const fps = useRecoilValue(atoms.fps);
	const frameTime = useRecoilValue(atoms.frameTime);

	return (
		<div className={styles.debugInfo}>
			<div className={styles.debugInfo__item}>{Math.round(fps)} FPS</div>
			<div className={styles.debugInfo__item}>{frameTime.toFixed(1)} ms</div>
			<div
				className={
					styles.debugInfo__item + ' ' + styles['debugInfo__item--small'] + ' ' + styles['debugInfo__item--clickable']
				}
				onClick={showRenderGraph}
			>
				RG
			</div>
		</div>
	);
};

export default React.memo(DebugInfo);