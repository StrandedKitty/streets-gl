import React, {useContext} from "react";
import {useRecoilState} from "recoil";
import {AtomsContext} from "~/app/ui/UI";
import './TimePanel.scss';
import TimeControls from "~/app/ui/components/TimePanel/TimeControls";

const presets = ['Dynamic/realtime', 'Morning', 'Noon', 'Evening'];

const TimePanel: React.FC = () => {
	const atoms = useContext(AtomsContext);
	const [timeMode, setTimeMode] = useRecoilState(atoms.mapTimeMode);

	return (
		<div className='time-panel'>
			<div className='time-panel-header'>Time of day</div>
			<div className='time-panel-presets'>
				{presets.map((presetName, i) => {
					const isActive = timeMode === i;
					let classList = 'time-button time-button-text';

					if (isActive) {
						classList += ' time-button-active';
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