import React from "react";
import styles from "./ModalButtonRow.scss";
import ModalButton from "~/app/ui/components/ModalButton";
import {GrPowerReset} from "react-icons/gr";

const ModalButtonRow: React.FC<{
	labels: string[];
	onClicks: (() => void)[];
	icons: React.ReactNode[];
	loadingFlags?: boolean[];
}> = ({labels, onClicks, icons, loadingFlags}) => {
	return (
		<div className={styles.container}>
			{
				labels.map((label, i) => {
					return <div key={label} className={styles.container__button}>
						<ModalButton
							text={label}
							onClick={onClicks[i]}
							icon={icons[i]}
							isLoading={loadingFlags ? loadingFlags[i] : false}
						/>
					</div>
				})
			}
		</div>
	);
};

export default React.memo(ModalButtonRow);