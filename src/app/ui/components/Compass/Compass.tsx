import React from "react";
import './Compass.scss';

const directionToTransformStyle = (direction: number): string => {
	return `rotate(${direction}deg)`;
};

const Compass: React.FC<{
	direction: number;
	onReset?: () => void;
}> = ({direction, onReset}) => {
	return <div
		className={'compass'}
		onClick={(): void => {
			onReset && onReset();
		}}
		style={{
			transform: directionToTransformStyle(direction)
		}}
	>
		<div className={'compass-arrows'}>
			<div className={'arrow-up'}>{}</div>
			<div className={'arrow-down'}>{}</div>
		</div>
	</div>;
}

export default React.memo(Compass);