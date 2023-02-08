import React, {useContext} from "react";
import {useRecoilValue} from "recoil";
import './DebugInfo.scss';
import {AtomsContext} from "~/app/ui/UI";

const DebugInfo: React.FC<{showRenderGraph: () => void}> = ({showRenderGraph}) => {
	const atoms = useContext(AtomsContext);
	const fps = useRecoilValue(atoms.fps);
	const frameTime = useRecoilValue(atoms.frameTime);

	return (
		<div className='debug-info'>
			<div className='item'>{Math.round(fps)} FPS</div>
			<div className='item'>{frameTime.toFixed(1)} ms</div>
			<div
				className='item item-small item-clickable'
				onClick={(): void => {
					showRenderGraph();
				}}
			>
				RG
			</div>
		</div>
	);
};

export default React.memo(DebugInfo);