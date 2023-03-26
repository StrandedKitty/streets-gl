import {IoCalendarClearOutline, IoPauseOutline, IoPlayOutline} from "react-icons/io5";
import React, {useContext, useState} from "react";
import {AiOutlineSave} from "react-icons/ai";
import {FiEdit2} from "react-icons/fi";
import {ActionsContext, AtomsContext} from "~/app/ui/UI";
import {useRecoilState, useRecoilValue} from "recoil";
import styles from './TimeControls.scss';
import timeButtonStyles from './TimeButton.scss';
import CenteredIcon from "~/app/ui/components/TimePanel/CenteredIcon";

const timeSpeedButtons = [1, 10, 100, 1000, 10000];

function formatTimeComponent(value: number): string {
	return value.toString().padStart(2, '0');
}

function dateToLocalISOString(date: Date): string {
	return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
}

function formalDate(date: Date): {time: string; day: string} {
	const hh = formatTimeComponent(date.getHours());
	const mm = formatTimeComponent(date.getMinutes());
	const ss = formatTimeComponent(date.getSeconds());
	const day = dateToLocalISOString(date).split('T')[0];

	return {
		time: `${hh}:${mm}:${ss}`,
		day
	};
}

const TimeControls: React.FC = () => {
	const atoms = useContext(AtomsContext);
	const actions = useContext(ActionsContext);

	const setTime = actions.setTime;

	const [timeMultiplier, setTimeMultiplier] = useRecoilState(atoms.mapTimeMultiplier);
	const time = useRecoilValue(atoms.mapTime);
	const [timeEditEnabled, setTimeEditEnabled] = useState<boolean>(false);
	const [timeEditDate, setTimeEditDate] = useState<string>('');
	const [timeEditTime, setTimeEditTime] = useState<string>('');
	const dateInputRef = React.createRef<HTMLInputElement>();

	const dateFormatted = formalDate(new Date(time));

	let inputClassNames = styles.timeInput;

	if (timeEditEnabled) {
		inputClassNames += ' ' + styles['timeInput--active'];
	}

	return <div className={styles.controls}>
		<div className={styles.controls__modes}>
			<button
				className={timeButtonStyles.timeButton + ' ' + timeButtonStyles['timeButton--icon']}
				onClick={(): void => {
					setTimeMultiplier(timeMultiplier === 0 ? 1 : 0);
				}}
			>
				<CenteredIcon type={timeMultiplier === 0 ? IoPlayOutline : IoPauseOutline} size={24}/>
			</button>
			{
				timeSpeedButtons.map((speed: number) => {
					const isActive = timeMultiplier === speed;
					let classList = timeButtonStyles.timeButton + ' ' + timeButtonStyles['timeButton--text'];

					if (isActive) {
						classList += ' ' + timeButtonStyles['timeButton--active'];
					}

					return (
						<button
							className={classList}
							onClick={(): void => {
								setTimeMultiplier(speed);
							}}
							key={speed}
						>x{speed}</button>
					);
				})
			}
		</div>
		<div className={styles.controls__inputs}>
			<div className={styles.controls__inputs__block}>
				<CenteredIcon type={IoCalendarClearOutline} size={24}/>
			</div>
			<div className={styles.controls__inputs__block}>
				<input
					className={inputClassNames}
					disabled={!timeEditEnabled}
					type='date'
					value={timeEditEnabled ? timeEditDate : dateFormatted.day}
					ref={dateInputRef}
					onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
						setTimeEditDate(e.target.value);
					}}
				/>
			</div>
			<div className={styles.controls__inputs__block}>
				<input
					className={inputClassNames + ' ' + styles['timeInput--small']}
					disabled={!timeEditEnabled}
					type="time"
					step="1"
					value={timeEditEnabled ? timeEditTime : dateFormatted.time}
					onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
						setTimeEditTime(e.target.value);
					}}
				/>
			</div>
			<div className={styles.controls__inputs__block}>
				<div
					className={styles.controls__inputs__button}
					onClick={(): void => {
						if (!timeEditEnabled) {
							setTimeEditTime(dateFormatted.time);
							setTimeEditDate(dateFormatted.day);
							dateInputRef.current.disabled = false;
							dateInputRef.current.focus();
						} else {
							const dateOffset = +(new Date(timeEditDate)) + new Date().getTimezoneOffset() * 60 * 1000;
							const timeStrings = timeEditTime.split(':');
							const timeOffset = +timeStrings[0] * 3600000 + +timeStrings[1] * 60000 + +timeStrings[2] * 1000;

							setTime(dateOffset + timeOffset);
						}

						setTimeEditEnabled(!timeEditEnabled);
					}}
				>
					<CenteredIcon type={timeEditEnabled ? AiOutlineSave : FiEdit2} size={20}/>
				</div>
			</div>
		</div>
		<div className={styles.timeReset} onClick={(): void => {
			if (timeEditEnabled) {
				setTimeEditTime(dateFormatted.time);
				setTimeEditDate(dateFormatted.day);
			}

			setTime(Date.now());
		}}>
			Reset to current date and time
		</div>
	</div>
}

export default React.memo(TimeControls);