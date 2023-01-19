import React, {useEffect, useReducer, useState} from "react";
import {IoCloseOutline} from 'react-icons/io5';
import SettingsManager, {SettingsConfigType, SettingsValues} from "./SettingsManager";

const req = (
	settingsConfig: SettingsConfigType,
	settingsValues: SettingsValues,
	parent?: string,
	accum?: JSX.Element[],
	level: number = 0
): JSX.Element[] => {
	if (!accum) {
		accum = [];
	}

	return Object.entries(settingsConfig).map(([key, config]) => {
		if (config.parent !== parent) {
			return;
		}

		if (config.parent && config.parentStatusCondition) {
			if (!config.parentStatusCondition.includes(settingsValues[parent].statusValue)) {
				return;
			}
		}

		const value = settingsValues[key];
		const options = config.status || [];
		const children = req(settingsConfig, settingsValues, key, accum, level + 1);

		return (
			<React.Fragment key={key}>
				<tr>
					<td style={{paddingLeft: `${level * 20}px`}}>{config.label}</td>
					<td>
						{
							options.length !== 0 && (
								<select
									className={'modal-settings-select'}
									value={value.statusValue}
									onChange={(e): void => {
										SettingsManager.updateSetting(key, {
											...value,
											statusValue: e.target.value
										});
									}}
								>
									{
										options.map((option, i) => {
											return <option
												key={option}
												value={option}
											>{config.statusLabels[i]}</option>;
										})
									}
								</select>
							)
						}
						{
							config.selectRange && (
								<div className={'modal-settings-range-container'}>
									<div className={'modal-settings-range-value'}>{value.numberValue}</div>
									<input
										className={'modal-settings-range'}
										type='range'
										min={config.selectRange[0]}
										max={config.selectRange[1]}
										step={config.selectRange[2]}
										value={value.numberValue}
										onChange={(e): void => {
											SettingsManager.updateSetting(key, {
												...value,
												numberValue: +e.target.value
											});
										}}
									/>
									<div className={'modal-settings-range-footer'}>
										<span className={'modal-settings-range-min-max'} style={{float: 'left'}}>{config.selectRange[0]}</span>
										<span className={'modal-settings-range-min-max'} style={{float: 'right'}}>{config.selectRange[1]}</span>
									</div>
								</div>
							)
						}
					</td>
				</tr>
				<>{children}</>
			</React.Fragment>
		);
	});
}

const Settings: React.FC<{onClose: () => void}> = (
	{
		onClose
	}
) => {
	const [values, setValues] = useState<SettingsValues>(null);
	const [, forceUpdate] = useReducer(x => x + 1, 0);
	const settingsConfig = SettingsManager.config;

	useEffect(() => {
		SettingsManager.onAnySettingChange(v => {
			setValues(v);
			forceUpdate();
		});
	}, []);

	return (
		<div className='modal'>
			<div
				className='modal-close'
				onClick={onClose}
			>
				<IoCloseOutline size={36}/>
			</div>
			<div className='modal-header'>Settings</div>
			<table className='modal-keys'>
				<tbody>
					{
						values && req(settingsConfig, values)
					}
				</tbody>
			</table>
			<button
				className={'modal-settings-reset'}
				onClick={(): void => {
					SettingsManager.resetAllSettings();
				}}
			>Reset to default values</button>
		</div>
	);
}

export default Settings;