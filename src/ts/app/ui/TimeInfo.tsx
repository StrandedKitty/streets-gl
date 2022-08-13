import React from "react";
import {IoPlayOutline, IoPauseOutline, IoCalendarClearOutline} from 'react-icons/io5';
import {FiEdit2} from 'react-icons/fi';
import {AiOutlineSave} from 'react-icons/ai';

const timeSpeedButtons = [1, 10, 100, 1000, 10000];

export default class TimeInfo extends React.Component<{
	time: number;
	timeMultiplier: number;
	updateTime: (n: number) => void;
	updateTimeMultiplier: (n: number) => void;
	resetTime: () => void;
}, {
	timeEditEnabled: boolean;
	timeEditDate: string;
	timeEditTime: string;
}> {
	private readonly dateInputRef: React.RefObject<HTMLInputElement>;

	public constructor(props: any) {
		super(props);

		this.dateInputRef = React.createRef();

		this.state = {
			timeEditEnabled: false,
			timeEditDate: '',
			timeEditTime: ''
		};
	}

	private formatTimeComponent(value: number): string {
		return value.toString().padStart(2, '0');
	}

	public render(): JSX.Element {
		const date = new Date(this.props.time);
		const timeString = `${this.formatTimeComponent(date.getHours())}:${this.formatTimeComponent(date.getMinutes())}:${this.formatTimeComponent(date.getSeconds())}`;
		const dateString = date.toISOString().split('T')[0];
		const inputActiveClass = this.state.timeEditEnabled ? ' time-input-active' : '';

		return (
			<div className='time-info'>
				<div className='time-controls'>
					<button
						className='time-controls-button time-controls-button-icon'
						onClick={(): void => {
							if (this.props.timeMultiplier === 0) {
								this.props.updateTimeMultiplier(1);
							} else {
								this.props.updateTimeMultiplier(0);
							}
						}}
					>
						<div className='svg-icon-wrapper'>
							{this.props.timeMultiplier === 0 ? <IoPlayOutline size={24}/> : <IoPauseOutline size={24}/>}
						</div>
					</button>
					{
						timeSpeedButtons.map((speed: number) => {
							const isActive = this.props.timeMultiplier === speed;
							let classList = 'time-controls-button time-controls-button-text';

							if (isActive) {
								classList += ' time-controls-button-active';
							}

							return (
								<button
									className={classList}
									onClick={(): void => {
										this.props.updateTimeMultiplier(speed);
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
						disabled={!this.state.timeEditEnabled}
						type='date'
						value={this.state.timeEditEnabled ? this.state.timeEditDate : dateString}
						ref={this.dateInputRef}
						onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
							this.setState({timeEditDate: e.target.value});
						}}/>
					<input
						className={'time-input time-input-small' + inputActiveClass}
						disabled={!this.state.timeEditEnabled}
						type="time"
						step="1"
						value={this.state.timeEditEnabled ? this.state.timeEditTime : timeString}
						onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
							this.setState({timeEditTime: e.target.value});
						}}
					/>
					<div className='svg-icon-wrapper time-input-edit-button' onClick={(): void => {
						if (!this.state.timeEditEnabled) {
							this.setState({
								timeEditTime: timeString,
								timeEditDate: dateString
							});
							this.dateInputRef.current.disabled = false;
							this.dateInputRef.current.focus();
						} else {
							const dateOffset = +(new Date(this.state.timeEditDate)) + new Date().getTimezoneOffset() * 60 * 1000;
							const timeStrings = this.state.timeEditTime.split(':');
							const timeOffset = +timeStrings[0] * 3600000 + +timeStrings[1] * 60000 + +timeStrings[2] * 1000;

							this.props.updateTime(dateOffset + timeOffset);
						}

						this.setState({timeEditEnabled: !this.state.timeEditEnabled});
					}}>
						{this.state.timeEditEnabled ? <AiOutlineSave size={20}/> : <FiEdit2 size={20}/>}
					</div>
				</div>
				<div className='time-reset' onClick={(): void => {
					if (this.state.timeEditEnabled) {
						this.setState({
							timeEditTime: timeString,
							timeEditDate: dateString
						});
					}

					this.props.resetTime();
				}}>
					Reset to current date and time
				</div>
			</div>
		);
	}
}