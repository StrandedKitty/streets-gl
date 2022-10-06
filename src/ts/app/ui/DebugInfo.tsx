import React, {useEffect, useState} from "react";
import UI from "~/app/ui/UI";

const DebugInfo: React.FC<{
	onRenderGraphOpen: () => void;
}> = ({onRenderGraphOpen}) => {
	const [fps, setFps] = useState<number>(0);
	const [frameTime, setFrameTime] = useState<number>(0);

	useEffect(() => {
		UI.listenToField('fpsSmooth', (v: number) => setFps(v));
		UI.listenToField('frameTime', (v: number) => setFrameTime(v));
	}, []);

	return (
		<div className='debug-info'>
			<div className='debug-info-item'>{Math.round(fps)} FPS</div>
			<div className='debug-info-item'>{frameTime.toFixed(1)} ms</div>
			<div
				className='debug-info-item debug-info-item-small'
				onClick={onRenderGraphOpen}
				style={{cursor: 'pointer'}}
			>RG</div>
		</div>
	);
};

export default DebugInfo;