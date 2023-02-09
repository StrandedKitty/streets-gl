import {IoCalendarClearOutline, IoPauseOutline, IoPlayOutline} from "react-icons/io5";
import React, {useContext, useState} from "react";
import {AiOutlineSave} from "react-icons/ai";
import {FiEdit2} from "react-icons/fi";
import {AtomsContext} from "~/app/ui/UI";
import {useRecoilState} from "recoil";

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

	const [timeMultiplier, setTimeMultiplier] = useRecoilState(atoms.mapTimeMultiplier);
	const [time, setTime] = useRecoilState(atoms.mapTime);
	const [timeEditEnabled, setTimeEditEnabled] = useState<boolean>(false);
	const [timeEditDate, setTimeEditDate] = useState<string>('');
	const [timeEditTime, setTimeEditTime] = useState<string>('');
	const dateInputRef = React.createRef<HTMLInputElement>();

	const dateFormatted = formalDate(new Date(time));

	const inputActiveClass = timeEditEnabled ? ' time-input-active' : '';

	return <div className='time-controls'>
		<div className='time-modes'>
			<button
				className='time-button time-button-icon'
				onClick={(): void => {
					setTimeMultiplier(timeMultiplier === 0 ? 1 : 0);
				}}
			>
				<div className='svg-icon-wrapper'>
					{timeMultiplier === 0 ? <IoPlayOutline size={24}/> : <IoPauseOutline size={24}/>}
				</div>
			</button>
			{
				timeSpeedButtons.map((speed: number) => {
					const isActive = timeMultiplier === speed;
					let classList = 'time-button time-button-text';

					if (isActive) {
						classList += ' time-button-active';
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
		<div className='time-inputs'>
			<div className='svg-icon-wrapper'><IoCalendarClearOutline size={24}/></div>
			<input
				className={'time-input' + inputActiveClass}
				disabled={!timeEditEnabled}
				type='date'
				value={timeEditEnabled ? timeEditDate : dateFormatted.day}
				ref={dateInputRef}
				onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
					setTimeEditDate(e.target.value);
				}}
			/>
			<input
				className={'time-input time-input-small' + inputActiveClass}
				disabled={!timeEditEnabled}
				type="time"
				step="1"
				value={timeEditEnabled ? timeEditTime : dateFormatted.time}
				onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
					setTimeEditTime(e.target.value);
				}}
			/>
			<div className='svg-icon-wrapper time-input-button' onClick={(): void => {
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
			}}>
				{timeEditEnabled ? <AiOutlineSave size={20}/> : <FiEdit2 size={20}/>}
			</div>
		</div>
		<div className='time-reset' onClick={(): void => {
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