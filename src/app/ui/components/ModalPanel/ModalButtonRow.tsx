import React from "react";
import styles from "./ModalButtonRow.scss";

const ModalButtonRow: React.FC<{
	labels: string[];
	onClicks: (() => void)[];
}> = ({labels, onClicks}) => {
	return (
		<div className={styles.container}>
			{
				labels.map((label, i) => {
					return <button
						key={label}
						className={styles.container__button}
						onClick={onClicks[i]}
					>
						{label}
					</button>
				})
			}
		</div>
	);
};

export default React.memo(ModalButtonRow);