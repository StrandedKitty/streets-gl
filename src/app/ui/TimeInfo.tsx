import React, {useState} from "react";
import {IoCalendarClearOutline, IoPauseOutline, IoPlayOutline} from 'react-icons/io5';
import {FiEdit2} from 'react-icons/fi';
import {AiOutlineSave} from 'react-icons/ai';
import {useRecoilState} from "recoil";
import atoms from "~/app/ui/state/atoms";

const presets = [0, 1, 2, 3];
const presetLabels = ['Dynamic/realtime', 'Morning', 'Noon', 'Evening', 'Night'];
const timeSpeedButtons = [1, 10, 100, 1000, 10000];

function formatTimeComponent(value: number): string {
	return value.toString().padStart(2, '0');
}

function dateToLocalISOString(date: Date): string {
	return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
}

const TimeInfo: React.FC = () => {
	const [time, setTime] = useRecoilState(atoms.mapTime);
	const [timeMode, setTimeMode] = useRecoilState(atoms.mapTimeMode);
	const [timeMultiplier, setTimeMultiplier] = useRecoilState(atoms.mapTimeMultiplier);
	const [timeEditEnabled, setTimeEditEnabled] = useState<boolean>(false);
	const [timeEditDate, setTimeEditDate] = useState<string>('');
	const [timeEditTime, setTimeEditTime] = useState<string>('');
	const dateInputRef = React.createRef<HTMLInputElement>();

	const date = new Date(time);
	const timeString = `${formatTimeComponent(date.getHours())}:${formatTimeComponent(date.getMinutes())}:${formatTimeComponent(date.getSeconds())}`;
	const dateString = dateToLocalISOString(date).split('T')[0];
	const inputActiveClass = timeEditEnabled ? ' time-input-active' : '';

	return (
		<div className='time-info'>
			<div className='time-info-header'>Time of day</div>
			<div className='time-info-presets'>
				{presets.map((presetId, i) => {
					const isActive = timeMode === presetId;
					let classList = 'time-controls-button time-controls-button-text';

					if (isActive) {
						classList += ' time-controls-button-active';
					}

					return (
						<button
							className={classList}
							onClick={(): void => {
								setTimeMode(presetId);
							}}
							key={presetId}
						>{presetLabels[i]}</button>
					);
				})}
			</div>
			{timeMode === 0 && (
				<>
					<div className='time-controls'>
						<button
							className='time-controls-button time-controls-button-icon'
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
								let classList = 'time-controls-button time-controls-button-text';

								if (isActive) {
									classList += ' time-controls-button-active';
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
							value={timeEditEnabled ? timeEditDate : dateString}
							ref={dateInputRef}
							onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
								setTimeEditDate(e.target.value);
							}}/>
						<input
							className={'time-input time-input-small' + inputActiveClass}
							disabled={!timeEditEnabled}
							type="time"
							step="1"
							value={timeEditEnabled ? timeEditTime : timeString}
							onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
								setTimeEditTime(e.target.value);
							}}
						/>
						<div className='svg-icon-wrapper time-input-edit-button' onClick={(): void => {
							if (!timeEditEnabled) {
								setTimeEditTime(timeString);
								setTimeEditDate(dateString);
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
							setTimeEditTime(timeString);
							setTimeEditDate(dateString);
						}

						setTime(Date.now());
					}}>
						Reset to current date and time
					</div>
				</>
			)}
		</div>
	);
};

export default TimeInfo;