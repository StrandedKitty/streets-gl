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
		<div className={styles.compass__container}>
			<div className={styles.compass__container__arrowUp}/>
			<div className={styles.compass__container__arrowDown}/>
		</div>
	</div>;
}

export default React.memo(Compass);