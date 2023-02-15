import React, {useContext} from "react";
import {useRecoilState} from "recoil";
import {AtomsContext} from "~/app/ui/UI";
import styles from './TimePanel.scss';
import timeButtonStyles from './TimeButton.scss';
import TimeControls from "~/app/ui/components/TimePanel/TimeControls";

const presets = ['Dynamic', 'Morning', 'Noon', 'Evening'];

const TimePanel: React.FC = () => {
	const atoms = useContext(AtomsContext);
	const [timeMode, setTimeMode] = useRecoilState(atoms.mapTimeMode);

	return (
		<div className={styles.timePanel}>
			<div className={styles.timePanel__header}>Time of day</div>
			<div className={styles.timePanel__presets}>
				{presets.map((presetName, i) => {
					const isActive = timeMode === i;
					let classList = timeButtonStyles.timeButton + ' ' + timeButtonStyles['timeButton--text'];

					if (isActive) {
						classList += ' ' + timeButtonStyles['timeButton--active'];
					}

					return (
						<button
							className={classList}
							onClick={(): void => {
								setTimeMode(i);
							}}
							key={i}
						>{presetName}</button>
					);
				})}
			</div>
			{timeMode === 0 && (
				<TimeControls/>
			)}
		</div>
	);
};

export default React.memo(TimePanel);