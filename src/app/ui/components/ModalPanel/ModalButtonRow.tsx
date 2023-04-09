import React from "react";
import styles from "./ModalButtonRow.scss";
import ModalButton from "~/app/ui/components/ModalButton";
import {GrPowerReset} from "react-icons/gr";

const ModalButtonRow: React.FC<{
	labels: string[];
	onClicks: (() => void)[];
	icons: React.ReactNode[];
}> = ({labels, onClicks, icons}) => {
	return (
		<div className={styles.container}>
			{
				labels.map((label, i) => {
					return <div key={label} className={styles.container__button}>
						<ModalButton
							text={label}
							onClick={onClicks[i]}
							icon={icons[i]}
						/>
					</div>
				})
			}
		</div>
	);
};

export default React.memo(ModalButtonRow);