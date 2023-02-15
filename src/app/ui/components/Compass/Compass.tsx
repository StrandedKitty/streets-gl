import React from "react";
import styles from './Compass.scss';

const directionToTransformStyle = (direction: number): string => {
	return `rotate(${direction}deg)`;
};

const Compass: React.FC<{
	direction: number;
	onReset?: () => void;
}> = ({direction, onReset}) => {
	return <div
		className={styles.compass}
		onClick={(): void => {
			onReset && onReset();
		}}
		style={{
			transform: directionToTransformStyle(direction)
		}}
	>
		<div>
			<div className={styles.compass__arrowUp}>{}</div>
			<div className={styles.compass__arrowDown}>{}</div>
		</div>
	</div>;
}

export default React.memo(Compass);